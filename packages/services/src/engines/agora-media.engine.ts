import { EventEmitter } from "node:events";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import RtcEngine from "agora-rtc-sdk-ng";

export type AgoraConfig = {
  appId: string;
  appCertificate?: string;
  enableCloudRecording: boolean;
  recordingConfig?: {
    bucket: string;
    region: string;
    vendor: "aws" | "gcp" | "azure";
  };
};

export type AgoraTokenResponse = {
  token: string;
  uid: number;
  channelName: string;
  expiresAt: Date;
};

export type MediaTrack = {
  audio?: IMicrophoneAudioTrack;
  video?: ICameraVideoTrack;
};

export type RemoteUser = {
  uid: string;
  audioTrack?: IRemoteAudioTrack;
  videoTrack?: IRemoteVideoTrack;
  hasAudio: boolean;
  hasVideo: boolean;
};

/**
 * Agora Media Engine
 * Handles actual WebRTC media streaming using Agora SDK
 */
export class AgoraMediaEngine extends EventEmitter {
  private readonly config: AgoraConfig;
  private readonly clients: Map<string, IAgoraRTCClient>;
  private readonly localTracks: Map<string, MediaTrack>;
  private readonly remoteUsers: Map<string, Map<string, RemoteUser>>;
  private readonly recordings: Map<string, string>; // callId -> resourceId

  constructor(config: AgoraConfig) {
    super();
    this.config = config;
    this.clients = new Map();
    this.localTracks = new Map();
    this.remoteUsers = new Map();
    this.recordings = new Map();
  }

  /**
   * Create and join an Agora channel
   */
  async joinChannel(
    callId: string,
    userId: string,
    token: string,
    options: {
      audio?: boolean;
      video?: boolean;
      role?: "host" | "audience";
    } = {}
  ): Promise<IAgoraRTCClient> {
    const client = RtcEngine.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    // Set up event handlers
    this.setupClientEventHandlers(client, callId);

    // Join the channel
    const uid = await client.join(this.config.appId, callId, token, userId);

    this.clients.set(callId, client);
    this.remoteUsers.set(callId, new Map());

    // Create and publish local tracks if needed
    if (options.audio !== false || options.video !== false) {
      await this.publishLocalTracks(callId, {
        audio: options.audio !== false,
        video: options.video !== false,
      });
    }

    this.emit("channelJoined", { callId, userId, uid });
    return client;
  }

  /**
   * Leave an Agora channel
   */
  async leaveChannel(callId: string): Promise<void> {
    const client = this.clients.get(callId);
    if (!client) return;

    // Unpublish and close local tracks
    await this.unpublishLocalTracks(callId);

    // Leave the channel
    await client.leave();

    // Clean up
    this.clients.delete(callId);
    this.localTracks.delete(callId);
    this.remoteUsers.delete(callId);

    this.emit("channelLeft", { callId });
  }

  /**
   * Create and publish local audio/video tracks
   */
  async publishLocalTracks(
    callId: string,
    options: { audio: boolean; video: boolean }
  ): Promise<MediaTrack> {
    const client = this.clients.get(callId);
    if (!client) {
      throw new Error("Client not found for call");
    }

    const tracks: MediaTrack = {};

    try {
      // Create audio track
      if (options.audio) {
        tracks.audio = await RtcEngine.createMicrophoneAudioTrack({
          encoderConfig: {
            sampleRate: 48_000,
            stereo: false,
            bitrate: 32,
          },
          AEC: true, // Acoustic Echo Cancellation
          AGC: true, // Auto Gain Control
          ANS: true, // Automatic Noise Suppression
        });
      }

      // Create video track
      if (options.video) {
        tracks.video = await RtcEngine.createCameraVideoTrack({
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrateMin: 400,
            bitrateMax: 2000,
          },
          optimizationMode: "motion", // or 'detail' for screen sharing
        });
      }

      // Publish tracks
      const tracksToPublish = [tracks.audio, tracks.video].filter(
        Boolean
      ) as any[];
      if (tracksToPublish.length > 0) {
        await client.publish(tracksToPublish);
      }

      this.localTracks.set(callId, tracks);
      this.emit("localTracksPublished", { callId, tracks });

      return tracks;
    } catch (error) {
      console.error("Error publishing local tracks:", error);
      throw error;
    }
  }

  /**
   * Unpublish and close local tracks
   */
  async unpublishLocalTracks(callId: string): Promise<void> {
    const client = this.clients.get(callId);
    const tracks = this.localTracks.get(callId);

    if (!(client && tracks)) return;

    try {
      // Unpublish tracks
      const tracksToUnpublish = [tracks.audio, tracks.video].filter(
        Boolean
      ) as any[];
      if (tracksToUnpublish.length > 0) {
        await client.unpublish(tracksToUnpublish);
      }

      // Close tracks
      tracks.audio?.close();
      tracks.video?.close();

      this.localTracks.delete(callId);
      this.emit("localTracksUnpublished", { callId });
    } catch (error) {
      console.error("Error unpublishing local tracks:", error);
    }
  }

  /**
   * Mute/unmute local audio
   */
  async setAudioEnabled(callId: string, enabled: boolean): Promise<void> {
    const tracks = this.localTracks.get(callId);
    if (!tracks?.audio) return;

    await tracks.audio.setEnabled(enabled);
    this.emit("audioToggled", { callId, enabled });
  }

  /**
   * Mute/unmute local video
   */
  async setVideoEnabled(callId: string, enabled: boolean): Promise<void> {
    const tracks = this.localTracks.get(callId);
    if (!tracks?.video) return;

    await tracks.video.setEnabled(enabled);
    this.emit("videoToggled", { callId, enabled });
  }

  /**
   * Switch camera (front/back on mobile)
   */
  async switchCamera(callId: string): Promise<void> {
    const tracks = this.localTracks.get(callId);
    if (!tracks?.video) return;

    // @ts-expect-error - switchDevice exists but not in types
    await tracks.video.switchDevice();
    this.emit("cameraSwitched", { callId });
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(callId: string): Promise<void> {
    const client = this.clients.get(callId);
    if (!client) {
      throw new Error("Client not found for call");
    }

    try {
      // Create screen track
      const screenTrack = await RtcEngine.createScreenVideoTrack(
        {
          encoderConfig: {
            width: 1920,
            height: 1080,
            frameRate: 15,
            bitrateMin: 600,
            bitrateMax: 3000,
          },
          optimizationMode: "detail",
        },
        "auto"
      );

      // Unpublish camera video if exists
      const tracks = this.localTracks.get(callId);
      if (tracks?.video) {
        await client.unpublish(tracks.video);
        tracks.video.close();
      }

      // Publish screen track
      await client.publish(screenTrack);

      // Update tracks
      if (tracks) {
        tracks.video = screenTrack as any;
      }

      this.emit("screenShareStarted", { callId });
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  /**
   * Stop screen sharing and resume camera
   */
  async stopScreenShare(callId: string): Promise<void> {
    const client = this.clients.get(callId);
    const tracks = this.localTracks.get(callId);

    if (!(client && tracks)) return;

    try {
      // Unpublish screen track
      if (tracks.video) {
        await client.unpublish(tracks.video);
        tracks.video.close();
      }

      // Create and publish camera track
      tracks.video = await RtcEngine.createCameraVideoTrack({
        encoderConfig: {
          width: 1280,
          height: 720,
          frameRate: 30,
          bitrateMin: 400,
          bitrateMax: 2000,
        },
      });

      await client.publish(tracks.video);
      this.emit("screenShareStopped", { callId });
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  }

  /**
   * Start cloud recording
   */
  async startRecording(callId: string, _uid: string): Promise<string> {
    if (!this.config.enableCloudRecording) {
      throw new Error("Cloud recording not enabled");
    }

    // Note: This requires Agora Cloud Recording RESTful API
    // You'll need to implement the REST API calls
    // This is a placeholder for the integration
    const resourceId = `recording_${callId}_${Date.now()}`;
    this.recordings.set(callId, resourceId);

    this.emit("recordingStarted", { callId, resourceId });
    return await Promise.resolve(resourceId);
  }

  /**
   * Stop cloud recording
   */
  async stopRecording(callId: string): Promise<void> {
    const resourceId = this.recordings.get(callId);
    if (!resourceId) return;

    // Note: This requires Agora Cloud Recording RESTful API
    // You'll need to implement the REST API calls
    this.recordings.delete(callId);

    this.emit("recordingStopped", { callId, resourceId });
    await Promise.resolve({});
  }

  /**
   * Get network quality stats
   */
  async getNetworkQuality(callId: string): Promise<{
    uplinkNetworkQuality: number;
    downlinkNetworkQuality: number;
  }> {
    const client = this.clients.get(callId);
    if (!client) {
      throw new Error("Client not found for call");
    }

    const stats = client.getRTCStats();
    return await Promise.resolve({
      uplinkNetworkQuality: stats.SendBitrate || 0,
      downlinkNetworkQuality: stats.RecvBitrate || 0,
    });
  }

  /**
   * Get call statistics
   */
  async getCallStats(callId: string) {
    const client = this.clients.get(callId);
    if (!client) return null;

    const localStats = await client.getLocalAudioStats();
    const remoteStats = await client.getRemoteAudioStats();

    return {
      local: localStats,
      remote: remoteStats,
      rtc: client.getRTCStats(),
    };
  }

  /**
   * Set up client event handlers
   */
  private setupClientEventHandlers(
    client: IAgoraRTCClient,
    callId: string
  ): void {
    // User joined
    client.on("user-joined", (user) => {
      this.emit("userJoined", { callId, userId: user.uid });
    });

    // User left
    client.on("user-left", (user, reason) => {
      const remoteUsers = this.remoteUsers.get(callId);
      remoteUsers?.delete(String(user.uid));
      this.emit("userLeft", { callId, userId: user.uid, reason });
    });

    // User published
    // biome-ignore lint/nursery/noMisusedPromises: ignore
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      const remoteUsers = this.remoteUsers.get(callId);
      if (!remoteUsers) return;

      let remoteUser = remoteUsers.get(String(user.uid));
      if (!remoteUser) {
        remoteUser = {
          uid: String(user.uid),
          hasAudio: false,
          hasVideo: false,
        };
        remoteUsers.set(String(user.uid), remoteUser);
      }

      if (mediaType === "audio") {
        remoteUser.audioTrack = user.audioTrack;
        remoteUser.hasAudio = true;
        user.audioTrack?.play();
      } else if (mediaType === "video") {
        remoteUser.videoTrack = user.videoTrack;
        remoteUser.hasVideo = true;
      }

      this.emit("userPublished", { callId, userId: user.uid, mediaType });
    });

    // User unpublished
    client.on("user-unpublished", (user, mediaType) => {
      const remoteUsers = this.remoteUsers.get(callId);
      const remoteUser = remoteUsers?.get(String(user.uid));

      if (remoteUser) {
        if (mediaType === "audio") {
          remoteUser.hasAudio = false;
          remoteUser.audioTrack = undefined;
        } else if (mediaType === "video") {
          remoteUser.hasVideo = false;
          remoteUser.videoTrack = undefined;
        }
      }

      this.emit("userUnpublished", { callId, userId: user.uid, mediaType });
    });

    // Network quality
    client.on("network-quality", (stats) => {
      this.emit("networkQuality", {
        callId,
        uplinkQuality: stats.uplinkNetworkQuality,
        downlinkQuality: stats.downlinkNetworkQuality,
      });
    });

    // Connection state change
    client.on("connection-state-change", (curState, prevState, reason) => {
      this.emit("connectionStateChange", {
        callId,
        currentState: curState,
        previousState: prevState,
        reason,
      });
    });

    // Exception
    client.on("exception", (event) => {
      console.error("Agora exception:", event);
      this.emit("error", { callId, error: event });
    });
  }

  /**
   * Get remote users in a call
   */
  getRemoteUsers(callId: string): RemoteUser[] {
    const remoteUsers = this.remoteUsers.get(callId);
    return remoteUsers ? Array.from(remoteUsers.values()) : [];
  }

  /**
   * Get local tracks for a call
   */
  getLocalTracks(callId: string): MediaTrack | undefined {
    return this.localTracks.get(callId);
  }

  /**
   * Clean up all resources
   */
  async destroy(): Promise<void> {
    for (const callId of this.clients.keys()) {
      await this.leaveChannel(callId);
    }

    this.clients.clear();
    this.localTracks.clear();
    this.remoteUsers.clear();
    this.recordings.clear();
  }
}
