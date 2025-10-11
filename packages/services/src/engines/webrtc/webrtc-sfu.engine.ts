import { EventEmitter } from "node:events";
import { WebRTCPeerEngine } from "./webrtc-peer.engine";

/**
 * Selective Forwarding Unit (SFU) Engine
 * Manages multiple peer connections in a mesh/SFU topology
 * Optimized for multi-party video calls
 */
export class WebRTCSFUEngine extends EventEmitter {
  private readonly peers: Map<string, WebRTCPeerEngine> = new Map();
  private localStream: MediaStream | null = null;
  private readonly config: RTCConfiguration;
  private readonly roomId: string;
  private readonly userId: string;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(
    roomId: string,
    userId: string,
    config?: Partial<RTCConfiguration>
  ) {
    super();
    this.roomId = roomId;
    this.userId = userId;
    this.config = this.buildConfiguration(config);
  }

  /**
   * Build RTCConfiguration with defaults
   */
  private buildConfiguration(
    config?: Partial<RTCConfiguration>
  ): RTCConfiguration {
    return {
      iceServers: config?.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
      iceCandidatePoolSize: config?.iceCandidatePoolSize || 10,
      bundlePolicy: config?.bundlePolicy || "max-bundle",
      rtcpMuxPolicy: config?.rtcpMuxPolicy || "require",
      iceTransportPolicy: config?.iceTransportPolicy || "all",
      ...config,
    };
  }

  /**
   * Set local media stream
   */
  async setLocalStream(stream: MediaStream): Promise<void> {
    this.localStream = stream;

    // Add stream to all existing peers
    for (const peer of this.peers.values()) {
      await peer.addStream(stream);
    }

    this.emit("localstream", { stream });
  }

  /**
   * Create peer connection
   */
  async createPeer(peerId: string, polite = false): Promise<WebRTCPeerEngine> {
    if (this.peers.has(peerId)) {
      // biome-ignore lint/style/noNonNullAssertion: ingore
      return this.peers.get(peerId)!;
    }

    const peer = new WebRTCPeerEngine(peerId, this.config, polite);
    await peer.initialize();

    // Setup peer event handlers
    this.setupPeerHandlers(peer);

    // Add local stream if available
    if (this.localStream) {
      await peer.addStream(this.localStream);
    }

    this.peers.set(peerId, peer);
    this.emit("peercreated", { peerId });

    return peer;
  }

  /**
   * Setup peer event handlers
   */
  private setupPeerHandlers(peer: WebRTCPeerEngine): void {
    const peerId = peer.getPeerId();

    // ICE candidate
    peer.on("icecandidate", ({ candidate }) => {
      this.emit("icecandidate", {
        peerId,
        candidate,
      });
    });

    // ICE state change
    peer.on("icestatechange", ({ state }) => {
      this.emit("icestatechange", { peerId, state });

      if (state === "connected") {
        this.emit("peerconnected", { peerId });
      } else if (state === "disconnected") {
        this.emit("peerdisconnected", { peerId });
      } else if (state === "failed") {
        this.emit("peerfailed", { peerId });
      }
    });

    // Connection state change
    peer.on("connectionstatechange", ({ state }) => {
      this.emit("connectionstatechange", { peerId, state });
    });

    // Track received
    peer.on("track", ({ track, streams }) => {
      this.emit("track", {
        peerId,
        track,
        streams,
      });
    });

    // Negotiation needed
    peer.on("negotiationneeded", ({ description }) => {
      this.emit("negotiationneeded", {
        peerId,
        description,
      });
    });

    // ICE restart
    peer.on("icerestart", ({ description }) => {
      this.emit("icerestart", {
        peerId,
        description,
      });
    });

    // Data channel events
    peer.on("datachannelopen", () => {
      this.emit("datachannelopen", { peerId });
    });

    peer.on("datachannelmessage", ({ data }) => {
      this.emit("datachannelmessage", { peerId, data });
    });

    // Error
    peer.on("error", ({ error }) => {
      this.emit("error", { peerId, error });
    });

    // Closed
    peer.on("closed", () => {
      this.peers.delete(peerId);
      this.emit("peerclosed", { peerId });
    });
  }

  /**
   * Get peer connection
   */
  getPeer(peerId: string): WebRTCPeerEngine | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Remove peer connection
   */
  removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
      this.emit("peerremoved", { peerId });
    }
  }

  /**
   * Handle incoming offer from peer
   */
  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> {
    let peer = this.peers.get(peerId);

    if (!peer) {
      peer = await this.createPeer(peerId, true); // Polite peer
    }

    return await peer.handleOffer(offer);
  }

  /**
   * Handle incoming answer from peer
   */
  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    await peer.handleAnswer(answer);
  }

  /**
   * Handle incoming ICE candidate from peer
   */
  async handleIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.warn(`Peer ${peerId} not found for ICE candidate`);
      return;
    }

    await peer.addIceCandidate(candidate);
  }

  /**
   * Send data to specific peer
   */
  sendDataToPeer(peerId: string, data: string | ArrayBuffer | Blob): void {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer ${peerId} not found`);
    }

    peer.sendData(data);
  }

  /**
   * Broadcast data to all peers
   */
  broadcastData(data: string | ArrayBuffer | Blob): void {
    for (const peer of this.peers.values()) {
      try {
        peer.sendData(data);
      } catch (error) {
        console.error(
          `Failed to send data to peer ${peer.getPeerId()}:`,
          error
        );
      }
    }
  }

  /**
   * Mute/unmute local audio
   */
  setAudioEnabled(enabled: boolean): void {
    if (!this.localStream) return;

    for (const track of this.localStream.getAudioTracks()) {
      track.enabled = enabled;
    }

    this.emit("audioenabled", { enabled });
  }

  /**
   * Enable/disable local video
   */
  setVideoEnabled(enabled: boolean): void {
    if (!this.localStream) return;

    for (const track of this.localStream.getVideoTracks()) {
      track.enabled = enabled;
    }

    this.emit("videoenabled", { enabled });
  }

  /**
   * Replace video track (for camera switching)
   */
  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    if (!this.localStream) {
      throw new Error("No local stream available");
    }

    const oldTrack = this.localStream.getVideoTracks()[0];
    if (!oldTrack) {
      throw new Error("No video track to replace");
    }

    // Replace in local stream
    this.localStream.removeTrack(oldTrack);
    this.localStream.addTrack(newTrack);
    oldTrack.stop();

    // Replace in all peer connections
    for (const peer of this.peers.values()) {
      await peer.replaceTrack(oldTrack, newTrack);
    }

    this.emit("videotrackchanged", { newTrack });
  }

  /**
   * Get all peer IDs
   */
  getPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Get connection statistics for all peers
   */
  async getAllStats(): Promise<Map<string, any>> {
    const stats = new Map();

    for (const [peerId, peer] of this.peers) {
      const peerStats = await peer.getDetailedStats();
      stats.set(peerId, peerStats);
    }

    return stats;
  }

  /**
   * Start monitoring connection quality
   */
  startQualityMonitoring(intervalMs = 5000): void {
    if (this.statsInterval) {
      return; // Already monitoring
    }

    this.statsInterval = setInterval(async () => {
      const stats = await this.getAllStats();
      this.emit("qualityupdate", { stats });

      // Analyze quality and emit warnings
      this.analyzeQuality(stats);
    }, intervalMs);
  }

  /**
   * Stop monitoring connection quality
   */
  stopQualityMonitoring(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  /**
   * Analyze connection quality
   */
  private analyzeQuality(stats: Map<string, any>): void {
    for (const [peerId, peerStats] of stats) {
      if (!peerStats) continue;

      // Check packet loss
      const videoInbound = peerStats.video?.inbound;
      if (videoInbound?.packetsLost > 0) {
        const lossRate =
          videoInbound.packetsLost /
          (videoInbound.packetsReceived + videoInbound.packetsLost);

        if (lossRate > 0.05) {
          // 5% packet loss
          this.emit("qualitywarning", {
            peerId,
            type: "packet_loss",
            value: lossRate,
            severity: lossRate > 0.1 ? "high" : "medium",
          });
        }
      }

      // Check jitter
      if (videoInbound?.jitter > 0.03) {
        // 30ms jitter
        this.emit("qualitywarning", {
          peerId,
          type: "jitter",
          value: videoInbound.jitter,
          severity: videoInbound.jitter > 0.05 ? "high" : "medium",
        });
      }

      // Check RTT (Round Trip Time)
      const candidatePair = peerStats.connection?.candidatePair;
      if (candidatePair?.currentRoundTripTime > 0.3) {
        // 300ms RTT
        this.emit("qualitywarning", {
          peerId,
          type: "high_latency",
          value: candidatePair.currentRoundTripTime,
          severity:
            candidatePair.currentRoundTripTime > 0.5 ? "high" : "medium",
        });
      }
    }
  }

  /**
   * Get room information
   */
  getRoomInfo(): {
    roomId: string;
    userId: string;
    peerCount: number;
    hasLocalStream: boolean;
  } {
    return {
      roomId: this.roomId,
      userId: this.userId,
      peerCount: this.peers.size,
      hasLocalStream: this.localStream !== null,
    };
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    // Stop quality monitoring
    this.stopQualityMonitoring();

    // Close all peer connections
    for (const peer of this.peers.values()) {
      peer.close();
    }
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
    }

    this.emit("closed");
    await this.removeAllListeners();
  }
}
