import { EventEmitter } from "node:events";
import { CallRecording, PropertyTour, VideoCall } from "@kaa/models";
import {
  CallQuality,
  CallStatus,
  type CallType,
  ConnectionState,
  type ICallAnalytics,
  type ICallParticipant,
  type NetworkQualityReport,
  RecordingStatus,
  type TourQuestion,
  type TourStop,
  type VideoConfig,
  VideoParticipantRole,
  type WebRTCConfig,
} from "@kaa/models/types";
import { redisClient } from "@kaa/utils";
import type { RedisClientType } from "redis";
import { v4 as uuidv4 } from "uuid";
import {
  type RecordingSession,
  WebRTCMediaServerEngine,
  type WebRTCRecordingEngine,
} from "./webrtc";

/**
 * Video Calling Engine with Native WebRTC
 * Complete replacement for Agora using our own WebRTC implementation
 * Now uses individual WebSocket connections instead of WebSocketServer
 */
export class VideoCallingWebRTCEngine extends EventEmitter {
  private readonly redis: RedisClientType;
  private readonly webrtcConfig: WebRTCConfig;
  private readonly config: VideoConfig;
  private readonly webrtcServer: WebRTCMediaServerEngine;

  constructor(webrtcConfig: WebRTCConfig, config: VideoConfig) {
    super();
    this.redis = redisClient;
    this.webrtcConfig = webrtcConfig;
    this.config = config;

    // Initialize WebRTC Media Server
    this.webrtcServer = new WebRTCMediaServerEngine({
      iceServers: webrtcConfig.iceServers,
      maxParticipantsPerRoom: 50,
      recordingEnabled: true,
      qualityMonitoringInterval: 5000,
      bandwidthLimits: {
        audio: webrtcConfig.encodingOptions.audio.bitrate,
        video: webrtcConfig.encodingOptions.video.bitrate.max,
      },
    });

    this.setupWebRTCEventHandlers();
    this.startPeriodicTasks();
  }

  /**
   * Handle individual WebSocket connection (called by Elysia controller)
   * This method is called when a WebSocket connection is established
   */
  handleWebSocketConnection(ws: any, userId: string): void {
    // Store the WebSocket and user ID for later use
    (ws as any).userId = userId;
    (ws as any).engine = this;

    // Pass to media server for WebRTC handling
    this.webrtcServer.handleConnection(ws, userId);
  }

  /**
   * Handle WebSocket message (called by Elysia message handler)
   */
  handleWebSocketMessage(ws: any, message: any): void {
    try {
      // Pass message to media server for processing
      this.webrtcServer.handleMessage(ws, message);
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Handle WebSocket close (called by Elysia close handler)
   */
  handleWebSocketClose(ws: any): void {
    // Pass to media server for cleanup
    this.webrtcServer.handleClose(ws);
    this.handleWebSocketDisconnect(ws);
  }

  /**
   * Get recording engine for direct access
   * @returns Recording engine instance or null
   */
  getRecordingEngine(): WebRTCRecordingEngine | null {
    return this.webrtcServer.getRecordingEngine() || null;
  }

  /**
   * Get media server for advanced operations
   * @returns Media server instance
   */
  getMediaServer(): WebRTCMediaServerEngine {
    return this.webrtcServer;
  }

  /**
   * Setup WebRTC event handlers
   */
  private setupWebRTCEventHandlers(): void {
    // User joined room
    this.webrtcServer.on("userjoined", async ({ roomId, userId }) => {
      const call = await VideoCall.findById(roomId);
      if (!call) return;

      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.connectionState = ConnectionState.CONNECTED;
        await call.save();
      }

      this.emit("webrtcUserJoined", { callId: roomId, userId });
    });

    // User left room
    this.webrtcServer.on("userleft", async ({ roomId, userId }) => {
      const call = await VideoCall.findById(roomId);
      if (!call) return;

      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.connectionState = ConnectionState.DISCONNECTED;
        await call.save();
      }

      this.emit("webrtcUserLeft", { callId: roomId, userId });
    });

    // Peer connected
    this.webrtcServer.on("peerconnected", ({ roomId, userId, peerId }) => {
      this.emit("peerConnected", { callId: roomId, userId, peerId });
    });

    // Quality warning
    this.webrtcServer.on(
      "qualitywarning",
      async ({ roomId, userId, type, value, severity }) => {
        const call = await VideoCall.findById(roomId);
        if (!call) return;

        // Update call quality based on warnings
        if (type === "packet_loss" && value > 0.05) {
          call.quality.overall = CallQuality.FAIR;
        } else if (type === "high_latency" && value > 0.3) {
          call.quality.networkStability = Math.max(
            0,
            call.quality.networkStability - 20
          );
        }

        await call.save();

        this.emit("qualityWarning", {
          callId: roomId,
          userId,
          type,
          value,
          severity,
        });
      }
    );

    // Recording started
    this.webrtcServer.on("recordingstarted", ({ roomId, recordingId }) => {
      this.emit("webrtcRecordingStarted", { callId: roomId, recordingId });
    });

    // Recording stopped
    this.webrtcServer.on(
      "recordingstopped",
      ({ roomId, recordingId, duration }) => {
        this.emit("webrtcRecordingStopped", {
          callId: roomId,
          recordingId,
          duration,
        });
      }
    );

    // Recording completed
    this.webrtcServer.on("recordingcompleted", ({ roomId, recordingId }) => {
      this.emit("webrtcRecordingCompleted", { callId: roomId, recordingId });
    });

    // Room created
    this.webrtcServer.on("roomcreated", ({ roomId }) => {
      this.emit("roomCreated", { roomId });
    });

    // Room deleted
    this.webrtcServer.on("roomdeleted", ({ roomId }) => {
      this.emit("roomDeleted", { roomId });
    });
  }

  private handleWebSocketDisconnect(ws: any): void {
    console.log("disconnected", ws);
    const participantId = (ws as any).participantId;
    const callId = (ws as any).callId;

    if (participantId && callId) {
      this.leaveCall(callId, participantId);
    }
  }

  // Call Management
  async createCall(
    hostId: string,
    type: CallType,
    options: Partial<{
      title: string;
      description: string;
      propertyId: string;
      applicationId: string;
      scheduledAt: Date;
      maxParticipants: number;
      isRecorded: boolean;
      settings: any;
      kenyaSpecific: any;
    }>
  ) {
    const call = new VideoCall({
      type,
      status: CallStatus.SCHEDULED,
      title: options.title || `${type} Call`,
      description: options.description,
      propertyId: options.propertyId,
      applicationId: options.applicationId,
      scheduledAt: options.scheduledAt,
      participants: [],
      host: hostId,
      maxParticipants: options.maxParticipants || 10,
      isRecorded: options.isRecorded,
      recordingStatus: RecordingStatus.NOT_STARTED,
      settings: {
        allowScreenShare: true,
        allowRecording: true,
        muteOnJoin: false,
        videoOnJoin: true,
        waitingRoom: false,
        ...options.settings,
      },
      quality: {
        overall: CallQuality.GOOD,
        audio: CallQuality.GOOD,
        video: CallQuality.GOOD,
        networkStability: 100,
      },
      analytics: {
        participantCount: 0,
        totalDuration: 0,
        averageQuality: CallQuality.GOOD,
        dropoutRate: 0,
        reconnections: 0,
        bandwidthUsage: { total: 0, average: 0, peak: 0 },
        qualityMetrics: { jitter: 0, latency: 0, packetLoss: 0 },
        deviceInfo: { mobile: 0, desktop: 0, tablet: 0 },
        engagement: {
          averageParticipationTime: 0,
          screenShareDuration: 0,
          chatMessages: 0,
        },
      },
      kenyaSpecific: {
        county: options.kenyaSpecific?.county || "Nairobi",
        businessHours: this.isBusinessHours(),
        language: options.kenyaSpecific?.language || "en",
        dataUsageWarning: this.config.lowBandwidthMode,
        ...options.kenyaSpecific,
      },
    });

    await call.save();
    await this.saveCallToRedis(call);

    this.emit("callCreated", call);
    return call;
  }

  async joinCall(
    callId: string,
    userId: string,
    options: Partial<ICallParticipant>
  ): Promise<ICallParticipant> {
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    // ✅ Check if user already joined
    const existingParticipant = call.participants.find(
      (p) => p.userId === userId
    );

    if (existingParticipant) {
      return existingParticipant;
    }

    if (call.participants.length >= call.maxParticipants) {
      throw new Error("Call is full");
    }

    const participant: ICallParticipant = {
      id: uuidv4(),
      userId,
      role:
        userId === call.host
          ? VideoParticipantRole.HOST
          : VideoParticipantRole.GUEST,
      displayName: options.displayName || `User ${userId}`,
      avatar: options.avatar,
      connectionState: ConnectionState.CONNECTING,
      mediaStreams: {
        audio: !call.settings.muteOnJoin,
        video: call.settings.videoOnJoin,
        screen: false,
      },
      permissions: {
        canShare: true,
        canRecord: userId === call.host,
        canMute: true,
        canKick: userId === call.host,
      },
      networkInfo: options.networkInfo || {
        ip: "0.0.0.0",
        bandwidth: { upload: 0, download: 0 },
      },
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };

    call.participants.push(participant);

    if (call.status === CallStatus.SCHEDULED) {
      call.status = CallStatus.INITIATING;
      call.startedAt = new Date();
    }

    await call.save();
    await this.saveCallToRedis(call);
    this.emit("participantJoined", { call, participant });

    return participant;
  }

  async leaveCall(callId: string, participantId: string): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    const participantIndex = call.participants.findIndex(
      (p) => p.id === participantId
    );
    if (participantIndex === -1) return;

    const participant = call.participants[participantIndex];
    call.participants.splice(participantIndex, 1);

    // End call if host leaves or no participants left
    if (participant?.userId === call.host || call.participants.length === 0) {
      await this.endCall(callId);
    } else {
      await call.save();
      await this.saveCallToRedis(call);
    }

    this.emit("participantLeft", { call, participant });
  }

  async endCall(callId: string): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    call.status = CallStatus.ENDED;
    call.endedAt = new Date();
    if (call.startedAt) {
      call.duration = call.endedAt.getTime() - call.startedAt.getTime();
    }

    // Stop recording if active
    if (call.isRecorded && call.recordingStatus === RecordingStatus.RECORDING) {
      await this.stopRecording(callId);
    }

    await call.save();
    await this.saveCallToRedis(call);

    // Close WebRTC room
    this.webrtcServer.closeRoom(callId, "Call ended");

    this.emit("callEnded", call);
  }

  // Property Tour Management
  async createPropertyTour(
    callId: string,
    propertyId: string,
    tourGuideId: string,
    tourPlan: TourStop[]
  ) {
    const tour = new PropertyTour({
      callId,
      propertyId,
      tourGuide: tourGuideId,
      prospects: [],
      tourPlan,
      currentStop: 0,
      highlights: [],
      questions: [],
      feedback: [],
      virtualAssets: {
        images: [],
        videos: [],
        documents: [],
        floorPlans: [],
      },
      interactiveFeatures: {
        measurements: true,
        roomLabels: true,
        virtualStaging: false,
        lightingDemo: true,
      },
    });

    await tour.save();
    await this.redis.setEx(`tour:${callId}`, 3600, JSON.stringify(tour));
    this.emit("tourCreated", tour);
    return tour;
  }

  async navigateToStop(callId: string, stopIndex: number): Promise<void> {
    const tour = await PropertyTour.findOne({ callId });
    if (!tour) return;

    if (stopIndex < 0 || stopIndex >= tour.tourPlan.length) return;

    tour.currentStop = stopIndex;
    await tour.save();
    await this.redis.setEx(`tour:${callId}`, 3600, JSON.stringify(tour));

    const stop = tour.tourPlan[stopIndex];
    this.emit("tourNavigated", { tour, stop });
  }

  async addTourQuestion(
    callId: string,
    participantId: string,
    question: string,
    category: TourQuestion["category"]
  ): Promise<void> {
    const tour = await PropertyTour.findOne({ callId });
    if (!tour) return;

    const newQuestion: TourQuestion = {
      id: uuidv4(),
      participantId,
      question,
      category,
      timestamp: new Date(),
    };

    tour.questions.push(newQuestion);
    await tour.save();
    await this.redis.setEx(`tour:${callId}`, 3600, JSON.stringify(tour));

    this.emit("tourQuestionAdded", { tour, question: newQuestion });
  }

  // Recording Management
  async startRecording(callId: string) {
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (!call.settings.allowRecording) {
      throw new Error("Recording not allowed for this call");
    }

    // Start WebRTC recording
    const recordingId = await this.webrtcServer.startRecording(callId);

    const recording = new CallRecording({
      callId,
      filename: `call_${callId}_${Date.now()}`,
      duration: 0,
      fileSize: 0,
      format: "webm",
      quality: "720p",
      audioOnly: false,
      downloadUrl: "",
      streamUrl: "",
      thumbnails: [],
      chapters: [],
      status: RecordingStatus.RECORDING,
      storageInfo: {
        provider: "aws",
        path: `recordings/${callId}/${recordingId}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      analytics: {
        views: 0,
        downloads: 0,
        sharedWith: [],
      },
    });

    await recording.save();

    call.isRecorded = true;
    call.recordingStatus = RecordingStatus.RECORDING;
    call.recordingUrl = recording.downloadUrl;

    await call.save();
    await this.saveCallToRedis(call);

    this.emit("recordingStarted", { call, recording });
    return recording;
  }

  async stopRecording(callId: string): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    // Stop WebRTC recording
    await this.webrtcServer.stopRecording(callId);

    call.recordingStatus = RecordingStatus.PROCESSING;
    await call.save();
    await this.saveCallToRedis(call);

    this.emit("recordingStopped", { callId });
  }

  async getRecordingStatus(recordingId: string): Promise<
    RecordingSession & {
      status:
        | "recording"
        | "stopping"
        | "stopped"
        | "processing"
        | "completed"
        | "failed";
    }
  > {
    return (await this.webrtcServer.getRecordingStatus(recordingId)) as any;
  }

  async deleteRecording(recordingId: string): Promise<void> {
    await this.webrtcServer.deleteRecording(recordingId);
  }

  // Media and Screen Sharing
  async enableScreenShare(
    callId: string,
    participantId: string
  ): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    if (!call.settings.allowScreenShare) {
      throw new Error("Screen sharing not allowed");
    }

    const participant = call.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.mediaStreams.screen = true;
    await call.save();
    await this.saveCallToRedis(call);

    this.emit("screenShareStarted", { call, participant });
  }

  async disableScreenShare(
    callId: string,
    participantId: string
  ): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.mediaStreams.screen = false;
    await call.save();
    this.emit("screenShareStopped", { callId, participantId });
  }

  // Quality Management
  async updateNetworkQuality(
    callId: string,
    participantId: string,
    qualityReport: NetworkQualityReport
  ): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.networkInfo.bandwidth = qualityReport.bandwidth;
    participant.lastActiveAt = new Date();

    await call.save();

    // Adapt quality based on network conditions
    if (this.config.qualityAdaptation.enabled) {
      await this.adaptCallQuality(callId, participantId, qualityReport);
    }

    this.emit("networkQualityUpdated", { participantId, qualityReport });
  }

  private async adaptCallQuality(
    callId: string,
    participantId: string,
    qualityReport: NetworkQualityReport
  ): Promise<void> {
    const { thresholds, actions } = this.config.qualityAdaptation;
    const bandwidth = qualityReport.bandwidth.download;

    if (bandwidth < thresholds.poor && actions.enableAudioOnly) {
      await this.switchToAudioOnly(callId, participantId);
    } else if (bandwidth < thresholds.fair && actions.disableVideo) {
      await this.disableVideo(callId, participantId);
    } else if (bandwidth < thresholds.good && actions.reduceBitrate) {
      await this.reduceBitrate(participantId);
    }
  }

  private async switchToAudioOnly(
    callId: string,
    participantId: string
  ): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.mediaStreams.video = false;
    await call.save();
    this.emit("qualityAdapted", { participantId, adaptation: "audio_only" });
  }

  private async disableVideo(
    callId: string,
    participantId: string
  ): Promise<void> {
    const call = await VideoCall.findById(callId);
    if (!call) return;

    const participant = call.participants.find((p) => p.id === participantId);
    if (!participant) return;

    participant.mediaStreams.video = false;
    await call.save();
    this.emit("qualityAdapted", {
      participantId,
      adaptation: "video_disabled",
    });
  }

  private async reduceBitrate(participantId: string): Promise<void> {
    // WebRTC handles bitrate adaptation automatically
    await this.emit("qualityAdapted", {
      participantId,
      adaptation: "bitrate_reduced",
    });
  }

  // WebRTC Integration Methods

  /**
   * Generate WebRTC connection info for a participant
   */
  async generateWebRTCToken(callId: string, userId: string) {
    return await Promise.resolve({
      roomId: callId,
      userId,
      iceServers: this.webrtcConfig.iceServers,
      expiresAt: new Date(Date.now() + 3_600_000), // 1 hour
    });
  }

  /**
   * Get WebRTC signaling server
   */
  getSignalingServer() {
    return this.webrtcServer.getSignaling();
  }

  /**
   * Get WebRTC room statistics
   */
  async getWebRTCStats(callId: string) {
    return await this.webrtcServer.getRoomStats(callId);
  }

  /**
   * Get server statistics
   */
  getServerStats() {
    return this.webrtcServer.getServerStats();
  }

  /**
   * Kick user from call
   */
  kickUser(callId: string, userId: string, reason?: string) {
    this.webrtcServer.kickUser(callId, userId, reason);
  }

  /**
   * Close call room
   */
  closeCallRoom(callId: string, reason?: string) {
    this.webrtcServer.closeRoom(callId, reason);
  }

  // Utility Methods
  private async saveCallToRedis(call: any): Promise<void> {
    await this.redis.setEx(
      `call:${call._id}`,
      3600, // 1 hour TTL
      JSON.stringify(call)
    );
  }

  private isBusinessHours(): boolean {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 8 && hours < 18; // 8 AM to 6 PM
  }

  // Periodic Tasks
  private startPeriodicTasks(): void {
    // Clean up ended calls every 5 minutes
    setInterval(
      async () => {
        const endedCalls = await VideoCall.find({ status: CallStatus.ENDED });

        for (const call of endedCalls) {
          await this.redis.del(`call:${call._id}`);
        }
      },
      5 * 60 * 1000
    );

    // Update call analytics every minute
    setInterval(async () => {
      const activeCalls = await VideoCall.find({
        status: {
          $in: [
            CallStatus.CONNECTED,
            CallStatus.INITIATING,
            CallStatus.RINGING,
          ],
        },
      });

      for (const call of activeCalls) {
        await this.updateCallAnalytics(call);
      }
    }, 60 * 1000);

    // Check for inactive participants every 30 seconds
    setInterval(() => {
      this.checkInactiveParticipants();
    }, 30 * 1000);
  }

  private async updateCallAnalytics(call: any): Promise<void> {
    call.analytics.participantCount = call.participants.length;

    if (call.startedAt) {
      call.analytics.totalDuration = Date.now() - call.startedAt.getTime();
    }

    // Get WebRTC stats
    const webrtcStats = await this.webrtcServer.getRoomStats(
      call._id.toString()
    );
    if (webrtcStats) {
      // Update analytics from WebRTC stats
      call.analytics.participantCount = webrtcStats.participantCount;
    }

    await call.save();
    await this.saveCallToRedis(call);
  }

  private async checkInactiveParticipants(): Promise<void> {
    const now = Date.now();
    const inactiveThreshold = 2 * 60 * 1000; // 2 minutes

    const activeCalls = await VideoCall.find({
      status: {
        $in: [CallStatus.CONNECTED, CallStatus.INITIATING, CallStatus.RINGING],
      },
    });

    for (const call of activeCalls) {
      let updated = false;
      for (const participant of call.participants) {
        if (now - participant.lastActiveAt.getTime() > inactiveThreshold) {
          participant.connectionState = ConnectionState.DISCONNECTED;
          updated = true;
          this.emit("participantInactive", {
            participantId: participant.id,
            participant,
          });
        }
      }
      if (updated) {
        await call.save();
      }
    }
  }

  // Public API Methods
  async getCall(callId: string) {
    return await VideoCall.findById(callId);
  }

  async getActiveCalls() {
    return await VideoCall.find({
      status: {
        $in: [
          CallStatus.CONNECTED,
          CallStatus.INITIATING,
          CallStatus.RINGING,
          CallStatus.SCHEDULED,
        ],
      },
    });
  }

  async getCallsByUser(userId: string) {
    return await VideoCall.find({
      $or: [{ host: userId }, { "participants.userId": userId }],
    });
  }

  async getRecording(recordingId: string) {
    return await CallRecording.findById(recordingId);
  }

  async getCallAnalytics(callId: string): Promise<ICallAnalytics | null> {
    const call = await VideoCall.findById(callId);
    return call ? call.analytics : null;
  }

  // Kenya-specific Features
  async checkDataUsage(_participantId: string): Promise<number> {
    // TODO: Implement data usage tracking
    return await Promise.resolve(0);
  }

  async sendDataWarning(participantId: string, usage: number): Promise<void> {
    if (usage > this.config.dataWarningThreshold) {
      await this.emit("dataWarning", { participantId, usage });
    }
  }

  async optimizeForNetwork(networkType: "wifi" | "cellular"): Promise<void> {
    if (networkType === "cellular" && this.config.lowBandwidthMode) {
      // Enable low bandwidth optimizations
      this.webrtcConfig.encodingOptions.video.bitrate.max = 500_000; // 500kbps
      this.webrtcConfig.encodingOptions.video.resolution = {
        width: 640,
        height: 480,
      };
    }

    await Promise.resolve();
  }

  /**
   * Clean up and destroy engine
   */
  async destroy() {
    await this.webrtcServer.destroy();
    this.removeAllListeners();
  }
}

// Export configuration factory functions
export function createDefaultWebRTCConfig(): WebRTCConfig {
  return {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: "max-bundle",
    rtcpMuxPolicy: "require",
    sdpSemantics: "unified-plan",
    encodingOptions: {
      video: {
        codec: "VP8",
        bitrate: {
          min: 100_000,
          max: 2_000_000,
          start: 800_000,
        },
        framerate: 30,
        resolution: {
          width: 1280,
          height: 720,
        },
        adaptiveBitrate: true,
      },
      audio: {
        codec: "OPUS",
        bitrate: 32_000,
        sampleRate: 48_000,
        channels: 1,
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    },
  };
}

export function createVideoConfig(): VideoConfig {
  return {
    lowBandwidthMode: true,
    dataWarningThreshold: 100, // 100MB
    businessHourPricing: true,
    supportedNetworks: ["safaricom", "airtel", "telkom"],
    mpesaIntegration: true,
    swahiliSupport: true,
    qualityAdaptation: {
      enabled: true,
      thresholds: {
        poor: 200_000, // 200kbps
        fair: 500_000, // 500kbps
        good: 1_000_000, // 1Mbps
      },
      actions: {
        reduceBitrate: true,
        disableVideo: true,
        enableAudioOnly: true,
      },
    },
  };
}
