import { EventEmitter } from "node:events";
// import type { MediaStream as NodeMediaStream } from "wrtc";

/**
 * WebRTC Peer Connection Manager
 * Handles individual peer connections with proper lifecycle management
 */
export class WebRTCPeerEngine extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private iceCandidateQueue: RTCIceCandidate[] = [];
  isNegotiating = false;
  private makingOffer = false;
  private ignoreOffer = false;
  polite = false;

  constructor(
    private readonly peerId: string,
    private readonly config: RTCConfiguration,
    polite = false
  ) {
    super();
    this.polite = polite;
  }

  /**
   * Initialize peer connection
   */
  initialize(): void {
    this.peerConnection = new RTCPeerConnection(this.config);
    this.setupPeerConnectionHandlers();
    this.createDataChannel();
  }

  /**
   * Setup peer connection event handlers
   */
  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    // ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit("icecandidate", {
          peerId: this.peerId,
          candidate: event.candidate,
        });
      }
    };

    // ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      this.emit("icestatechange", {
        peerId: this.peerId,
        state,
      });

      if (state === "failed") {
        this.restartIce();
      }
    };

    // Connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      this.emit("connectionstatechange", {
        peerId: this.peerId,
        state,
      });

      if (state === "failed") {
        this.emit("connectionfailed", { peerId: this.peerId });
      }
    };

    // Track handling
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      // biome-ignore lint/style/noNonNullAssertion: ignore
      // biome-ignore lint/nursery/noNonNullAssertedOptionalChain: ingore
      for (const track of event.streams[0]?.getTracks()!) {
        this.remoteStream?.addTrack(track);
      }

      this.emit("track", {
        peerId: this.peerId,
        track: event.track,
        streams: event.streams,
      });
    };

    // Negotiation needed
    this.peerConnection.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.peerConnection?.setLocalDescription();

        this.emit("negotiationneeded", {
          peerId: this.peerId,
          description: this.peerConnection?.localDescription,
        });
      } catch (error) {
        console.error("Negotiation error:", error);
        this.emit("error", { peerId: this.peerId, error });
      } finally {
        this.makingOffer = false;
      }
    };

    // Signaling state change
    this.peerConnection.onsignalingstatechange = () => {
      this.emit("signalingstatechange", {
        peerId: this.peerId,
        state: this.peerConnection?.signalingState,
      });
    };
  }

  /**
   * Create data channel for messaging
   */
  private createDataChannel(): void {
    if (!this.peerConnection) return;

    this.dataChannel = this.peerConnection.createDataChannel("data", {
      ordered: true,
      maxRetransmits: 3,
    });

    this.setupDataChannelHandlers(this.dataChannel);

    // Handle incoming data channels
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers(this.dataChannel);
    };
  }

  /**
   * Setup data channel event handlers
   */
  private setupDataChannelHandlers(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this.emit("datachannelopen", { peerId: this.peerId });
    };

    channel.onclose = () => {
      this.emit("datachannelclose", { peerId: this.peerId });
    };

    channel.onerror = (error) => {
      this.emit("datachannelerror", { peerId: this.peerId, error });
    };

    channel.onmessage = (event) => {
      this.emit("datachannelmessage", {
        peerId: this.peerId,
        data: event.data,
      });
    };
  }

  /**
   * Add local media stream
   */
  async addStream(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }
    await Promise.resolve();

    this.localStream = stream;

    // Add tracks to peer connection
    for (const track of stream.getTracks()) {
      this.peerConnection?.addTrack(track, stream);
    }
  }

  /**
   * Remove local media stream
   */
  removeStream(): void {
    if (!this.peerConnection) return;

    const senders = this.peerConnection.getSenders();
    for (const sender of senders) {
      if (sender.track) {
        this.peerConnection?.removeTrack(sender);
      }
    }

    this.localStream = null;
  }

  /**
   * Replace track (for camera switching, etc.)
   */
  async replaceTrack(
    oldTrack: MediaStreamTrack,
    newTrack: MediaStreamTrack
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const sender = this.peerConnection
      .getSenders()
      .find((s) => s.track === oldTrack);
    if (sender) {
      await sender.replaceTrack(newTrack);
    }
  }

  /**
   * Handle incoming offer (Perfect Negotiation Pattern)
   */
  async handleOffer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    const offerCollision =
      this.makingOffer || this.peerConnection.signalingState !== "stable";

    this.ignoreOffer = !this.polite && offerCollision;

    if (this.ignoreOffer) {
      return null;
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Process queued ICE candidates
    await this.processIceCandidateQueue();

    return this.peerConnection.localDescription?.toJSON() || null;
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    await this.peerConnection.setRemoteDescription(answer);

    // Process queued ICE candidates
    await this.processIceCandidateQueue();
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    try {
      // Queue candidates if remote description not set
      if (!this.peerConnection.remoteDescription) {
        this.iceCandidateQueue.push(new RTCIceCandidate(candidate));
        return;
      }

      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      if (!this.ignoreOffer) {
        console.error("Error adding ICE candidate:", error);
      }
    }
  }

  /**
   * Process queued ICE candidates
   */
  private async processIceCandidateQueue(): Promise<void> {
    if (!this.peerConnection?.remoteDescription) return;

    for (const candidate of this.iceCandidateQueue) {
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error processing queued ICE candidate:", error);
      }
    }

    this.iceCandidateQueue = [];
  }

  /**
   * Restart ICE (for connection recovery)
   */
  async restartIce(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      this.emit("icerestart", {
        peerId: this.peerId,
        description: this.peerConnection.localDescription,
      });
    } catch (error) {
      console.error("ICE restart error:", error);
    }
  }

  /**
   * Send data through data channel
   */
  sendData(data: string | ArrayBuffer | Blob): void {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("Data channel not open");
    }

    this.dataChannel.send(data as any);
  }

  /**
   * Get connection statistics
   */
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;
    return await this.peerConnection.getStats();
  }

  /**
   * Get detailed statistics
   */
  async getDetailedStats(): Promise<{
    audio: any;
    video: any;
    connection: any;
  } | null> {
    const stats = await this.getStats();
    if (!stats) return null;

    const result = {
      audio: {
        inbound: {} as any,
        outbound: {} as any,
      },
      video: {
        inbound: {} as any,
        outbound: {} as any,
      },
      connection: {
        candidatePair: {} as any,
        transport: {} as any,
      },
    };

    for (const report of stats as any) {
      if (report.type === "inbound-rtp") {
        if (report.kind === "audio") {
          result.audio.inbound = report;
        } else if (report.kind === "video") {
          result.video.inbound = report;
        }
      } else if (report.type === "outbound-rtp") {
        if (report.kind === "audio") {
          result.audio.outbound = report;
        } else if (report.kind === "video") {
          result.video.outbound = report;
        }
      } else if (
        report.type === "candidate-pair" &&
        report.state === "succeeded"
      ) {
        result.connection.candidatePair = report;
      } else if (report.type === "transport") {
        result.connection.transport = report;
      }
    }

    return result;
  }

  /**
   * Enable/disable track
   */
  setTrackEnabled(kind: "audio" | "video", enabled: boolean): void {
    if (!this.localStream) return;

    const tracks =
      kind === "audio"
        ? this.localStream.getAudioTracks()
        : this.localStream.getVideoTracks();

    for (const track of tracks) {
      track.enabled = enabled;
    }
  }

  /**
   * Get peer connection state
   */
  getState(): {
    connectionState: RTCPeerConnectionState | null;
    iceConnectionState: RTCIceConnectionState | null;
    signalingState: RTCSignalingState | null;
  } {
    return {
      connectionState: this.peerConnection?.connectionState || null,
      iceConnectionState: this.peerConnection?.iceConnectionState || null,
      signalingState: this.peerConnection?.signalingState || null,
    };
  }

  /**
   * Close peer connection
   */
  close(): void {
    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    // Stop local tracks
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
    }

    // Stop remote tracks
    if (this.remoteStream) {
      for (const track of this.remoteStream.getTracks()) {
        track.stop();
      }
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear ICE candidate queue
    this.iceCandidateQueue = [];

    this.emit("closed", { peerId: this.peerId });
  }

  /**
   * Get peer ID
   */
  getPeerId(): string {
    return this.peerId;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}
