import { VideoCall } from "@kaa/models";
import type {
  CallStatus,
  CallType,
  NetworkQualityReport,
  TourStop,
} from "@kaa/models/types";
import {
  createDefaultWebRTCConfig,
  createVideoConfig,
  VideoCallingWebRTCEngine,
} from "@kaa/services/engines";
import type { WebSocketServer } from "ws";

/**
 * Video Calling Service with Native WebRTC
 * Business logic layer for video calling operations
 */
class VideoCallingWebRTCService {
  private engine: VideoCallingWebRTCEngine | null = null;

  /**
   * Initialize the video calling engine with WebRTC
   */
  initialize(wsServer: WebSocketServer) {
    if (this.engine) {
      return; // Already initialized
    }

    this.engine = new VideoCallingWebRTCEngine(
      wsServer,
      createDefaultWebRTCConfig(),
      createVideoConfig()
    );
  }

  /**
   * Get the engine instance
   */
  private getEngine(): VideoCallingWebRTCEngine {
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
   * Generate WebRTC connection info for a user
   */
  async generateToken(
    callId: string,
    userId: string,
    _role: "publisher" | "subscriber" = "publisher"
  ) {
    const engine = this.getEngine();
    return await engine.generateWebRTCToken(callId, userId);
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

    // Generate WebRTC connection info
    const tokenData = await engine.generateWebRTCToken(callId, userId);

    return {
      callId,
      participant,
      roomId: tokenData.roomId,
      iceServers: tokenData.iceServers,
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

    // Leave call in database (WebRTC signaling handles the rest)
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

    // End call (WebRTC room will be closed automatically)
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
   * Get recording status
   */
  async getRecordingStatus(
    callId: string,
    recordingId: string,
    userId: string
  ): Promise<any> {
    const engine = this.getEngine();

    // Verify user has access to the call
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

    return await engine.getRecordingStatus(recordingId);
  }

  /**
   * Delete recording
   */
  async deleteRecording(callId: string, recordingId: string, userId: string) {
    const engine = this.getEngine();

    // Verify user is host
    const call = await VideoCall.findById(callId);
    if (!call) {
      throw new Error("Call not found");
    }

    if (call.host !== userId) {
      throw new Error("Only the host can delete recordings");
    }

    await engine.deleteRecording(recordingId);
  }

  /**
   * Toggle audio
   */
  async toggleAudio(callId: string, userId: string, enabled: boolean) {
    // Update participant state in database
    // WebRTC client handles actual media toggle
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
    // Update participant state in database
    // WebRTC client handles actual media toggle
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
    await engine.enableScreenShare(callId, userId);
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare(callId: string, userId: string) {
    const engine = this.getEngine();
    await engine.disableScreenShare(callId, userId);
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

    return await engine.getWebRTCStats(callId);
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

  /**
   * Add recording chunk (for client-side recording)
   */
  async addRecordingChunk(
    recordingId: string,
    participantId: string,
    chunkData: Buffer,
    type: "audio" | "video",
    timestamp: number,
    sequence: number
  ): Promise<string> {
    const engine = this.getEngine();
    const recordingEngine = engine.getRecordingEngine();

    if (!recordingEngine) {
      throw new Error("Recording engine not available");
    }

    await recordingEngine.addChunk(recordingId, participantId, chunkData, type);
    return `chunk_${recordingId}_${participantId}_${sequence}_${timestamp}`;
  }

  /**
   * Get recording upload status
   */
  async getRecordingUploadStatus(recordingId: string): Promise<{
    recordingId: string;
    chunksReceived: number;
    participants: string[];
    status: string;
    lastChunkAt?: Date;
  } | null> {
    const engine = this.getEngine();

    // const recording = await engine.getRecordingEngine()?.getRecording(recordingId);
    const recording = await engine.getRecordingStatus(recordingId);
    if (!recording) {
      return null;
    }

    return {
      recordingId: recording.id,
      chunksReceived: recording.chunks.length,
      participants: Array.from(recording.participants as string[]),
      status: recording.status,
      lastChunkAt:
        recording.chunks.length > 0
          ? new Date(recording.chunks.at(-1)?.timestamp || Date.now())
          : undefined,
    };
  }

  /**
   * Get all recordings for a user
   */
  async getUserRecordings(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<{
    recordings: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { CallRecording } = await import("@kaa/models");

      // Find all calls where the user is a participant
      const userCalls = await VideoCall.find({
        $or: [{ host: userId }, { "participants.userId": userId }],
      })
        .select("_id")
        .lean();

      const callIds = userCalls.map((call: any) => call._id.toString());

      // Get recordings for these calls
      const skip = (page - 1) * limit;
      const recordings = await CallRecording.find({
        callId: { $in: callIds },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await CallRecording.countDocuments({
        callId: { $in: callIds },
      });

      return {
        recordings,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error("Error getting user recordings:", error);
      throw new Error("Failed to get user recordings");
    }
  }

  /**
   * Get active calls
   */
  async getActiveCalls(): Promise<any[]> {
    try {
      const calls = await VideoCall.find({
        status: "connected",
      })
        .sort({ startedAt: -1 })
        .limit(50)
        .lean();

      return calls;
    } catch (error) {
      console.error("Error getting active calls:", error);
      throw new Error("Failed to get active calls");
    }
  }

  /**
   * Get a specific recording
   */
  async getRecording(recordingId: string): Promise<any> {
    try {
      const { CallRecording } = await import("@kaa/models");

      const recording = await CallRecording.findById(recordingId).lean();

      if (!recording) {
        throw new Error("Recording not found");
      }

      return recording;
    } catch (error) {
      console.error("Error getting recording:", error);
      throw new Error("Failed to get recording");
    }
  }

  /**
   * Get all recordings for a call
   */
  async getCallRecordings(callId: string): Promise<{
    recordings: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { CallRecording } = await import("@kaa/models");

      const recordings = await CallRecording.find({ callId })
        .sort({ createdAt: -1 })
        .lean();

      return {
        recordings,
        total: recordings.length,
        page: 1,
        limit: recordings.length,
      };
    } catch (error) {
      console.error("Error getting call recordings:", error);
      throw new Error("Failed to get call recordings");
    }
  }

  /**
   * Get property tour
   */
  async getPropertyTour(callId: string): Promise<any> {
    try {
      const { PropertyTour } = await import("@kaa/models");

      const tour = await PropertyTour.findOne({ callId }).lean();

      if (!tour) {
        throw new Error("Property tour not found");
      }

      return tour;
    } catch (error) {
      console.error("Error getting property tour:", error);
      throw new Error("Failed to get property tour");
    }
  }
}

// Export singleton instance
export const videoCallingService = new VideoCallingWebRTCService();
