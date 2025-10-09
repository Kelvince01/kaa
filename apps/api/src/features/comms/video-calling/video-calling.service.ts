import {
  // CallRecording,
  // PropertyTour,
  VideoCall,
} from "@kaa/models";
import type {
  CallStatus,
  CallType,
  NetworkQualityReport,
  TourStop,
} from "@kaa/models/types";
import {
  createDefaultWebRTCConfig,
  createVideoConfig,
  VideoCallingEngine,
} from "@kaa/services/engines";
import type { WebSocketServer } from "ws";

/**
 * Video Calling Service
 * Business logic layer for video calling operations
 */
class VideoCallingService {
  private engine: VideoCallingEngine | null = null;

  /**
   * Initialize the video calling engine
   */
  initialize(wsServer: WebSocketServer) {
    if (this.engine) {
      return; // Already initialized
    }

    const agoraAppId = process.env.AGORA_APP_ID;
    const agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!(agoraAppId && agoraAppCertificate)) {
      throw new Error("Agora credentials not configured");
    }

    this.engine = new VideoCallingEngine(
      wsServer,
      createDefaultWebRTCConfig(),
      createVideoConfig(),
      {
        appId: agoraAppId,
        appCertificate: agoraAppCertificate,
      }
    );
  }

  /**
   * Get the engine instance
   */
  private getEngine(): VideoCallingEngine {
    if (!this.engine) {
      throw new Error("Video calling engine not initialized");
    }
    return this.engine;
  }

  /**
   * Create a new video call
   */
  async createCall(hostId: string, type: CallType, options: any) {
    const engine = this.getEngine();
    return await engine.createCall(hostId, type, options);
  }

  /**
   * Generate Agora token for a user
   */
  async generateToken(
    callId: string,
    userId: string,
    role: "publisher" | "subscriber" = "publisher"
  ) {
    const engine = this.getEngine();
    return await engine.generateAgoraToken(callId, userId, role);
  }

  /**
   * Join a video call
   */
  async joinCall(
    callId: string,
    userId: string,
    options: {
      displayName: string;
      avatar?: string;
      audio?: boolean;
      video?: boolean;
    }
  ) {
    const engine = this.getEngine();

    // Join the call in database
    const participant = await engine.joinCall(callId, userId, {
      displayName: options.displayName,
      avatar: options.avatar,
    });

    // Generate Agora token
    const tokenData = await engine.generateAgoraToken(callId, userId);

    // Join Agora channel
    await engine.joinAgoraChannel(callId, userId, {
      audio: options.audio !== false,
      video: options.video !== false,
    });

    return {
      participant,
      token: tokenData.token,
      channelName: tokenData.channelName,
      expiresAt: tokenData.expiresAt,
    };
  }

  /**
   * Leave a video call
   */
  async leaveCall(callId: string, userId: string) {
    const engine = this.getEngine();

    // Find participant ID
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const participant = call.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    // Leave Agora channel
    await engine.leaveAgoraChannel(callId);

    // Leave call in database
    await engine.leaveCall(callId, participant.id);
  }

  /**
   * End a video call (host only)
   */
  async endCall(callId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user is host
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.host !== userId) {
      throw new Error("Only the host can end the call");
    }

    // Leave Agora channel
    await engine.leaveAgoraChannel(callId);

    // End call
    await engine.endCall(callId);
  }

  /**
   * Get call details
   */
  async getCall(callId: string) {
    return await VideoCall.findById(callId);
  }

  /**
   * Get calls for a user
   */
  async getCallsByUser(
    userId: string,
    filters: {
      status?: CallStatus;
      type?: CallType;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const query: any = {
      $or: [{ host: userId }, { "participants.userId": userId }],
    };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [calls, total] = await Promise.all([
      VideoCall.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      VideoCall.countDocuments(query),
    ]);

    return {
      calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a property tour
   */
  async createPropertyTour(
    callId: string,
    propertyId: string,
    tourGuideId: string,
    tourPlan: TourStop[]
  ) {
    const engine = this.getEngine();
    return await engine.createPropertyTour(
      callId,
      propertyId,
      tourGuideId,
      tourPlan
    );
  }

  /**
   * Navigate to a tour stop
   */
  async navigateToStop(callId: string, stopIndex: number) {
    const engine = this.getEngine();
    await engine.navigateToStop(callId, stopIndex);
  }

  /**
   * Add a tour question
   */
  async addTourQuestion(
    callId: string,
    participantId: string,
    question: string,
    category: "property" | "location" | "amenities" | "pricing" | "legal"
  ) {
    const engine = this.getEngine();
    await engine.addTourQuestion(callId, participantId, question, category);
  }

  /**
   * Start recording
   */
  async startRecording(callId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user is host
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.host !== userId) {
      throw new Error("Only the host can start recording");
    }

    return await engine.startRecording(callId);
  }

  /**
   * Stop recording
   */
  async stopRecording(callId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user is host
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.host !== userId) {
      throw new Error("Only the host can stop recording");
    }

    await engine.stopRecording(callId);
  }

  /**
   * Toggle audio
   */
  async toggleAudio(callId: string, userId: string, enabled: boolean) {
    const engine = this.getEngine();
    await engine.toggleAudio(callId, enabled);

    // Update participant state in database
    const call = await VideoCall.findById(callId);
    if (call) {
      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.mediaStreams.audio = enabled;
        await call.save();
      }
    }
  }

  /**
   * Toggle video
   */
  async toggleVideo(callId: string, userId: string, enabled: boolean) {
    const engine = this.getEngine();
    await engine.toggleVideo(callId, enabled);

    // Update participant state in database
    const call = await VideoCall.findById(callId);
    if (call) {
      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.mediaStreams.video = enabled;
        await call.save();
      }
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(callId: string, userId: string) {
    const engine = this.getEngine();
    await engine.startAgoraScreenShare(callId);

    // Update participant state in database
    const call = await VideoCall.findById(callId);
    if (call) {
      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.mediaStreams.screen = true;
        await call.save();
      }
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(callId: string, userId: string) {
    const engine = this.getEngine();
    await engine.stopAgoraScreenShare(callId);

    // Update participant state in database
    const call = await VideoCall.findById(callId);
    if (call) {
      const participant = call.participants.find((p) => p.userId === userId);
      if (participant) {
        participant.mediaStreams.screen = false;
        await call.save();
      }
    }
  }

  /**
   * Update network quality
   */
  async updateNetworkQuality(
    callId: string,
    userId: string,
    qualityReport: NetworkQualityReport
  ) {
    const engine = this.getEngine();

    // Find participant ID
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const participant = call.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error("Participant not found");
    }

    await engine.updateNetworkQuality(callId, participant.id, qualityReport);
  }

  /**
   * Get call analytics
   */
  async getCallAnalytics(callId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user has access
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const hasAccess =
      call.host === userId ||
      call.participants.some((p) => p.userId === userId);

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    return await engine.getCallAnalytics(callId);
  }

  /**
   * Get call statistics
   */
  async getCallStats(callId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user has access
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    const hasAccess =
      call.host === userId ||
      call.participants.some((p) => p.userId === userId);

    if (!hasAccess) {
      throw new Error("Access denied");
    }

    return await engine.getAgoraStats(callId);
  }

  /**
   * Clean up and destroy engine
   */
  async destroy() {
    if (this.engine) {
      await this.engine.destroy();
      this.engine = null;
    }
  }
}

// Export singleton instance
export const videoCallingService = new VideoCallingService();
