import { EventEmitter } from "node:events";
import { WebRTCRecordingEngine } from "./webrtc-recording.engine";
import { WebRTCSFUEngine } from "./webrtc-sfu.engine";
import { WebRTCSignalingEngine } from "./webrtc-signaling.engine";

export type MediaServerConfig = {
  iceServers?: RTCIceServer[];
  recordingEnabled?: boolean;
  maxParticipantsPerRoom?: number;
  qualityMonitoringInterval?: number;
  bandwidthLimits?: {
    audio?: number;
    video?: number;
  };
};

export type RoomSession = {
  roomId: string;
  sfu: WebRTCSFUEngine;
  participants: Map<string, ParticipantSession>;
  createdAt: Date;
  recording?: RecordingSession;
};

export type ParticipantSession = {
  userId: string;
  sfu: WebRTCSFUEngine;
  joinedAt: Date;
  stats?: any;
};

export type RecordingSession = {
  id: string;
  roomId: string;
  startedAt: Date;
  stoppedAt?: Date;
  chunks: any[];
  participants?: string[];
  status:
    | "recording"
    | "stopping"
    | "stopped"
    | "processing"
    | "completed"
    | "failed";
};

/**
 * WebRTC Media Server Engine
 * Manages SFU instances, signaling, and media routing
 */
export class WebRTCMediaServerEngine extends EventEmitter {
  private readonly signaling: WebRTCSignalingEngine;
  private readonly rooms: Map<string, RoomSession> = new Map();
  private readonly config: MediaServerConfig;
  private readonly recordings: Map<string, RecordingSession> = new Map();
  private readonly recordingEngine: WebRTCRecordingEngine;

  constructor(config: MediaServerConfig = {}) {
    super();
    this.config = {
      maxParticipantsPerRoom: 50,
      qualityMonitoringInterval: 5000,
      recordingEnabled: true,
      ...config,
    };

    this.signaling = new WebRTCSignalingEngine();

    // Initialize recording engine
    const storageProvider = (process.env.RECORDING_STORAGE_PROVIDER ||
      "local") as "local" | "s3" | "gcs" | "vercel-blob";

    this.recordingEngine = new WebRTCRecordingEngine({
      outputDir: process.env.RECORDING_OUTPUT_DIR || "./recordings",
      format: "webm",
      videoCodec: "vp8",
      audioCodec: "opus",
      videoBitrate: config.bandwidthLimits?.video || 2_000_000,
      audioBitrate: config.bandwidthLimits?.audio || 128_000,
      framerate: 30,
      resolution: { width: 1280, height: 720 },
      storage:
        storageProvider !== "local"
          ? {
              provider: storageProvider,
              local:
                storageProvider ===
                ("local" as "local" | "s3" | "gcs" | "vercel-blob")
                  ? {
                      basePath:
                        process.env.RECORDING_OUTPUT_DIR || "./recordings",
                    }
                  : undefined,
              s3:
                storageProvider === "s3"
                  ? {
                      bucket: process.env.RECORDING_S3_BUCKET || "",
                      region: process.env.RECORDING_S3_REGION || "us-east-1",
                      accessKeyId: process.env.RECORDING_S3_ACCESS_KEY_ID,
                      secretAccessKey:
                        process.env.RECORDING_S3_SECRET_ACCESS_KEY,
                      endpoint: process.env.RECORDING_S3_ENDPOINT,
                    }
                  : undefined,
              gcs:
                storageProvider === "gcs"
                  ? {
                      bucket: process.env.RECORDING_GCS_BUCKET || "",
                      projectId: process.env.RECORDING_GCS_PROJECT_ID,
                      keyFilename: process.env.RECORDING_GCS_KEY_FILENAME,
                      credentials: process.env.RECORDING_GCS_CREDENTIALS
                        ? JSON.parse(process.env.RECORDING_GCS_CREDENTIALS)
                        : undefined,
                    }
                  : undefined,
              vercelBlob:
                storageProvider === "vercel-blob"
                  ? {
                      token: process.env.BLOB_READ_WRITE_TOKEN || "",
                    }
                  : undefined,
            }
          : undefined,
    });

    this.setupSignalingHandlers();
    this.setupRecordingHandlers();
  }

  /**
   * Get recording engine for direct access
   * @returns Recording engine instance or null
   */
  getRecordingEngine(): WebRTCRecordingEngine {
    return this.recordingEngine;
  }

  /**
   * Setup recording event handlers
   */
  private setupRecordingHandlers(): void {
    this.recordingEngine.on(
      "recordingCompleted",
      ({ recordingId, outputPath, fileSize, duration }) => {
        const recording = this.recordings.get(recordingId);
        if (recording) {
          recording.status = "completed";
          recording.stoppedAt = new Date();
        }

        this.emit("recordingcompleted", {
          recordingId,
          roomId: recording?.roomId,
          outputPath,
          fileSize,
          duration,
        });
      }
    );

    this.recordingEngine.on("recordingFailed", ({ recordingId, error }) => {
      const recording = this.recordings.get(recordingId);
      if (recording) {
        recording.status = "failed";
      }

      this.emit("recordingfailed", {
        recordingId,
        roomId: recording?.roomId,
        error,
      });
    });

    this.recordingEngine.on(
      "recordingProgress",
      ({ recordingId, chunks, participants }) => {
        this.emit("recordingprogress", {
          recordingId,
          chunks,
          participants,
        });
      }
    );

    this.recordingEngine.on("thumbnailsGenerated", ({ recordingId, count }) => {
      this.emit("thumbnailsgenerated", {
        recordingId,
        count,
      });
    });

    this.recordingEngine.on(
      "recordingUploaded",
      ({ recordingId, provider, bucket }) => {
        this.emit("recordinguploaded", {
          recordingId,
          provider,
          bucket,
        });
      }
    );
  }

  /**
   * Setup signaling event handlers
   */
  private setupSignalingHandlers(): void {
    // User joined room
    this.signaling.on("userjoined", async ({ roomId, userId }) => {
      await this.handleUserJoined(roomId, userId);
    });

    // User left room
    this.signaling.on("userleft", ({ roomId, userId }) => {
      this.handleUserLeft(roomId, userId);
    });

    // WebRTC offer
    this.signaling.on(
      "offer",
      async ({ roomId, fromUserId, toUserId, data }) => {
        await this.handleOffer(roomId, fromUserId, toUserId, data);
      }
    );

    // WebRTC answer
    this.signaling.on(
      "answer",
      async ({ roomId, fromUserId, toUserId, data }) => {
        await this.handleAnswer(roomId, fromUserId, toUserId, data);
      }
    );

    // ICE candidate
    this.signaling.on(
      "icecandidate",
      async ({ roomId, fromUserId, toUserId, data }) => {
        await this.handleIceCandidate(roomId, fromUserId, toUserId, data);
      }
    );

    // Room created
    this.signaling.on("roomcreated", ({ roomId }) => {
      this.emit("roomcreated", { roomId });
    });

    // Room deleted
    this.signaling.on("roomdeleted", ({ roomId }) => {
      this.cleanupRoom(roomId);
      this.emit("roomdeleted", { roomId });
    });
  }

  /**
   * Handle WebSocket connection
   */
  handleConnection(ws: any, userId: string): void {
    this.signaling.handleConnection(ws, userId);
    this.emit("connection", { userId });
  }

  /**
   * Handle WebSocket message (called by Elysia message handler)
   */
  handleMessage(ws: any, message: any): void {
    this.signaling.handleMessage(ws, message);
  }

  /**
   * Handle WebSocket close (called by Elysia close handler)
   */
  handleClose(ws: any): void {
    this.signaling.handleClose(ws);
  }

  /**
   * Handle WebSocket error (called by Elysia error handler)
   */
  handleError(ws: any, error: Error): void {
    this.signaling.handleError(ws, error);
  }

  /**
   * Handle user joined room
   */
  private async handleUserJoined(
    roomId: string,
    userId: string
  ): Promise<void> {
    // Get or create room session
    let roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      roomSession = await this.createRoomSession(roomId);
    }

    // Check participant limit
    if (
      roomSession.participants.size >=
      (this.config.maxParticipantsPerRoom || 50)
    ) {
      this.signaling.kickUser(roomId, userId, "Room is full");
      return;
    }

    // Create SFU for participant
    const sfu = new WebRTCSFUEngine(roomId, userId, {
      iceServers: this.config.iceServers,
    });

    // Setup SFU event handlers
    this.setupSFUHandlers(sfu, roomId, userId);

    // Add participant to room
    roomSession.participants.set(userId, {
      userId,
      sfu,
      joinedAt: new Date(),
    });

    this.emit("userjoined", { roomId, userId });
  }

  /**
   * Handle user left room
   */
  private handleUserLeft(roomId: string, userId: string): void {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return;
    }

    const participant = roomSession.participants.get(userId);
    if (participant) {
      participant.sfu.close();
      roomSession.participants.delete(userId);
    }

    // Cleanup room if empty
    if (roomSession.participants.size === 0) {
      this.cleanupRoom(roomId);
    }

    this.emit("userleft", { roomId, userId });
  }

  /**
   * Create room session
   */
  private async createRoomSession(roomId: string): Promise<RoomSession> {
    const roomSession: RoomSession = {
      roomId,
      sfu: new WebRTCSFUEngine(roomId, "server", {
        iceServers: this.config.iceServers,
      }),
      participants: new Map(),
      createdAt: new Date(),
    };

    this.rooms.set(roomId, roomSession);
    return await Promise.resolve(roomSession);
  }

  /**
   * Setup SFU event handlers
   */
  private setupSFUHandlers(
    sfu: WebRTCSFUEngine,
    roomId: string,
    userId: string
  ): void {
    // ICE candidate
    sfu.on("icecandidate", ({ peerId, candidate }) => {
      // Forward ICE candidate through signaling
      this.emit("icecandidate", {
        roomId,
        fromUserId: userId,
        toUserId: peerId,
        candidate,
      });
    });

    // Negotiation needed
    sfu.on("negotiationneeded", ({ peerId, description }) => {
      this.emit("negotiationneeded", {
        roomId,
        fromUserId: userId,
        toUserId: peerId,
        description,
      });
    });

    // Track received
    sfu.on("track", ({ peerId, track, streams }) => {
      this.emit("track", {
        roomId,
        fromUserId: peerId,
        toUserId: userId,
        track,
        streams,
      });
    });

    // Quality warning
    sfu.on("qualitywarning", ({ peerId, type, value, severity }) => {
      this.emit("qualitywarning", {
        roomId,
        userId,
        peerId,
        type,
        value,
        severity,
      });
    });

    // Peer connected
    sfu.on("peerconnected", ({ peerId }) => {
      this.emit("peerconnected", {
        roomId,
        userId,
        peerId,
      });
    });

    // Peer disconnected
    sfu.on("peerdisconnected", ({ peerId }) => {
      this.emit("peerdisconnected", {
        roomId,
        userId,
        peerId,
      });
    });
  }

  /**
   * Handle WebRTC offer
   */
  private async handleOffer(
    roomId: string,
    fromUserId: string,
    toUserId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return;
    }

    const toParticipant = roomSession.participants.get(toUserId);
    if (!toParticipant) {
      return;
    }

    // Handle offer and create answer
    const answer = await toParticipant.sfu.handleOffer(fromUserId, offer);
    if (answer) {
      this.emit("answer", {
        roomId,
        fromUserId: toUserId,
        toUserId: fromUserId,
        answer,
      });
    }
  }

  /**
   * Handle WebRTC answer
   */
  private async handleAnswer(
    roomId: string,
    fromUserId: string,
    toUserId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return;
    }

    const toParticipant = roomSession.participants.get(toUserId);
    if (!toParticipant) {
      return;
    }

    await toParticipant.sfu.handleAnswer(fromUserId, answer);
  }

  /**
   * Handle ICE candidate
   */
  private async handleIceCandidate(
    roomId: string,
    fromUserId: string,
    toUserId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return;
    }

    const toParticipant = roomSession.participants.get(toUserId);
    if (!toParticipant) {
      return;
    }

    await toParticipant.sfu.handleIceCandidate(fromUserId, candidate);
  }

  /**
   * Start recording room
   */
  async startRecording(roomId: string): Promise<string> {
    if (!this.config.recordingEnabled) {
      throw new Error("Recording is not enabled");
    }

    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      throw new Error("Room not found");
    }

    if (roomSession.recording) {
      throw new Error("Recording already in progress");
    }

    // Start recording with recording engine
    const recordingId = await this.recordingEngine.startRecording(roomId);

    const recording: RecordingSession = {
      id: recordingId,
      roomId,
      startedAt: new Date(),
      chunks: [],
      status: "recording",
    };

    roomSession.recording = recording;
    this.recordings.set(recordingId, recording);

    // Setup track handlers to capture media
    this.setupRecordingCapture(roomId, recordingId);

    this.emit("recordingstarted", { roomId, recordingId });
    return recordingId;
  }

  /**
   * Setup recording capture for room
   */
  private setupRecordingCapture(roomId: string, recordingId: string): void {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) return;

    // Capture tracks from existing participants
    for (const [, participant] of roomSession.participants) {
      // Listen for new tracks from this participant
      const trackHandler = ({
        peerId,
        track,
      }: {
        peerId: string;
        track: MediaStreamTrack;
      }) => {
        const recording = this.recordings.get(recordingId);
        if (recording && recording.status === "recording") {
          this.captureTrack(recordingId, peerId, track);
        }
      };

      participant.sfu.on("track", trackHandler);

      // Store handler for cleanup
      const recording = this.recordings.get(recordingId);
      if (recording) {
        recording.chunks.push({
          stop: () => {
            participant.sfu.off("track", trackHandler);
          },
        } as any);
      }
    }

    // Listen for new participants joining during recording
    const userJoinedHandler = ({
      userId,
    }: {
      roomId: string;
      userId: string;
    }) => {
      const recording = this.recordings.get(recordingId);
      if (!recording || recording.status !== "recording") return;

      const participant = roomSession.participants.get(userId);
      if (!participant) return;

      // Setup track capture for new participant
      const trackHandler = ({
        peerId,
        track,
      }: {
        peerId: string;
        track: MediaStreamTrack;
      }) => {
        const rec = this.recordings.get(recordingId);
        if (rec && rec.status === "recording") {
          this.captureTrack(recordingId, peerId, track);
        }
      };

      participant.sfu.on("track", trackHandler);

      // Store handler for cleanup
      recording.chunks.push({
        stop: () => {
          participant.sfu.off("track", trackHandler);
        },
      } as any);
    };

    this.on("userjoined", userJoinedHandler);

    // Store handler for cleanup
    const recording = this.recordings.get(recordingId);
    if (recording) {
      recording.chunks.push({
        stop: () => {
          this.off("userjoined", userJoinedHandler);
        },
      } as any);
    }
  }

  /**
   * Capture track data for recording
   */
  private captureTrack(
    recordingId: string,
    participantId: string,
    track: MediaStreamTrack
  ): void {
    const recording = this.recordings.get(recordingId);
    if (!recording || recording.status !== "recording") {
      return;
    }

    try {
      // Create a MediaStream with the track
      const stream = new MediaStream([track]);

      // Setup track capture based on environment
      if (typeof MediaRecorder !== "undefined") {
        // Browser environment - use MediaRecorder
        this.captureTrackBrowser(recordingId, participantId, stream, track);
      } else {
        // Node.js environment - use alternative approach
        this.captureTrackNode(recordingId, participantId, track);
      }
    } catch (error) {
      console.error(`Failed to capture track for ${participantId}:`, error);
      this.emit("captureerror", {
        recordingId,
        participantId,
        trackKind: track.kind,
        error,
      });
    }
  }

  /**
   * Capture track in browser environment using MediaRecorder
   */
  private captureTrackBrowser(
    recordingId: string,
    participantId: string,
    stream: MediaStream,
    track: MediaStreamTrack
  ): void {
    const recording = this.recordings.get(recordingId);
    if (!recording) return;

    // Determine MIME type based on track kind
    const mimeType =
      track.kind === "video"
        ? "video/webm;codecs=vp8"
        : "audio/webm;codecs=opus";

    // Create MediaRecorder
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: this.config.bandwidthLimits?.video,
      audioBitsPerSecond: this.config.bandwidthLimits?.audio,
    });

    // Handle data available
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        // Convert Blob to Buffer for Node.js compatibility
        event.data.arrayBuffer().then((arrayBuffer) => {
          const buffer = Buffer.from(arrayBuffer);
          this.recordingEngine.addChunk(
            recordingId,
            participantId,
            buffer,
            track.kind as "audio" | "video"
          );
        });
      }
    };

    // Handle errors
    recorder.onerror = (error) => {
      console.error(`MediaRecorder error for ${participantId}:`, error);
      this.emit("captureerror", {
        recordingId,
        participantId,
        trackKind: track.kind,
        error,
      });
    };

    // Handle track ended
    track.onended = () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    };

    // Start recording with timeslice (capture chunks every 1 second)
    recorder.start(1000);

    // Store recorder reference for cleanup
    recording.chunks.push(recorder as any);
  }

  /**
   * Capture track in Node.js environment
   * Uses MediaStream and creates a synthetic recorder
   */
  private captureTrackNode(
    recordingId: string,
    participantId: string,
    track: MediaStreamTrack
  ): void {
    const recording = this.recordings.get(recordingId);
    if (!recording) return;

    // Create a MediaStream with the track
    const stream = new MediaStream([track]);
    let isCapturing = true;

    // Use a buffer to accumulate track data
    const captureBuffer: Buffer[] = [];
    const flushInterval = 1000; // Flush every 1 second

    // Flush buffer to recording engine
    const flushBuffer = () => {
      if (captureBuffer.length > 0) {
        const combinedBuffer = Buffer.concat(captureBuffer);
        this.recordingEngine.addChunk(
          recordingId,
          participantId,
          combinedBuffer,
          track.kind as "audio" | "video"
        );
        captureBuffer.length = 0;
      }
    };

    // Set up periodic flush
    const flushTimer = setInterval(() => {
      if (isCapturing) {
        flushBuffer();
      }
    }, flushInterval);

    // Try to use MediaRecorder if available (even in Node with wrtc)
    try {
      if (typeof MediaRecorder !== "undefined") {
        const recorder = new MediaRecorder(stream, {
          mimeType:
            track.kind === "video"
              ? "video/webm;codecs=vp8"
              : "audio/webm;codecs=opus",
        });

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            event.data.arrayBuffer().then((arrayBuffer) => {
              captureBuffer.push(Buffer.from(arrayBuffer));
            });
          }
        };

        recorder.start(flushInterval);

        track.onended = () => {
          isCapturing = false;
          recorder.stop();
          clearInterval(flushTimer);
          flushBuffer();
        };

        recording.chunks.push({
          stop: () => {
            isCapturing = false;
            if (recorder.state !== "inactive") {
              recorder.stop();
            }
            clearInterval(flushTimer);
            flushBuffer();
          },
        } as any);

        return;
      }
    } catch (error) {
      console.warn("MediaRecorder not available, using fallback:", error);
    }

    // Fallback: Monitor track and emit progress
    // This is for environments where MediaRecorder is not available
    const monitorInterval = setInterval(() => {
      if (!isCapturing || track.readyState !== "live") {
        clearInterval(monitorInterval);
        clearInterval(flushTimer);
        return;
      }

      this.emit("captureprogress", {
        recordingId,
        participantId,
        trackKind: track.kind,
        timestamp: Date.now(),
      });
    }, 1000);

    track.onended = () => {
      isCapturing = false;
      clearInterval(monitorInterval);
      clearInterval(flushTimer);
    };

    recording.chunks.push({
      stop: () => {
        isCapturing = false;
        clearInterval(monitorInterval);
        clearInterval(flushTimer);
      },
    } as any);
  }

  /**
   * Stop recording room
   */
  async stopRecording(roomId: string): Promise<void> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession?.recording) {
      throw new Error("No active recording for this room");
    }

    const recording = roomSession.recording;
    recording.stoppedAt = new Date();
    recording.status = "stopped";

    // Stop all capture mechanisms
    for (const chunk of recording.chunks) {
      if (typeof chunk === "number") {
        // Clear interval
        clearInterval(chunk);
      } else if (chunk && typeof chunk === "object") {
        // Stop MediaRecorder or custom capture
        // biome-ignore lint/style/useCollapsedIf: ignore
        if ("stop" in chunk && typeof chunk.stop === "function") {
          try {
            chunk.stop();
          } catch (error) {
            console.error("Error stopping capture:", error);
          }
        }
      }
    }

    // Clear chunks array
    recording.chunks = [];

    // Stop recording in recording engine
    await this.recordingEngine.stopRecording(recording.id);

    this.emit("recordingstopped", {
      roomId,
      recordingId: recording.id,
      duration: recording.stoppedAt.getTime() - recording.startedAt.getTime(),
    });

    // Process recording asynchronously
    this.processRecording(recording);
  }

  /**
   * Process recording (handled automatically by recording engine)
   */
  private async processRecording(_recording: RecordingSession): Promise<void> {
    // Recording engine handles processing automatically after stopRecording()
    // Events are emitted through setupRecordingHandlers()
  }

  /**
   * Get recording status
   */
  getRecordingStatus(recordingId: string):
    | (RecordingSession & {
        status:
          | "recording"
          | "stopping"
          | "stopped"
          | "processing"
          | "completed"
          | "failed";
      })
    | undefined {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      return;
    }

    const engineRecording = this.recordingEngine.getRecording(recordingId);

    return {
      ...recording,
      status: engineRecording?.status || recording.status,
    };
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    await this.recordingEngine.deleteRecording(recordingId);
    this.recordings.delete(recordingId);

    // Remove from room session if still active
    const roomSession = this.rooms.get(recording.roomId);
    if (roomSession?.recording?.id === recordingId) {
      roomSession.recording = undefined;
    }
  }

  /**
   * Get room statistics
   */
  async getRoomStats(roomId: string): Promise<any> {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return null;
    }

    const participantStats = new Map();

    for (const [userId, participant] of roomSession.participants) {
      const stats = await participant.sfu.getAllStats();
      participantStats.set(userId, stats);
    }

    return {
      roomId,
      participantCount: roomSession.participants.size,
      participants: Array.from(participantStats.entries()),
      recording: roomSession.recording
        ? {
            id: roomSession.recording.id,
            status: roomSession.recording.status,
            duration: roomSession.recording.stoppedAt
              ? roomSession.recording.stoppedAt.getTime() -
                roomSession.recording.startedAt.getTime()
              : Date.now() - roomSession.recording.startedAt.getTime(),
          }
        : null,
    };
  }

  /**
   * Get server statistics
   */
  getServerStats(): {
    rooms: number;
    participants: number;
    recordings: number;
    signaling: any;
  } {
    let totalParticipants = 0;
    let activeRecordings = 0;

    for (const room of this.rooms.values()) {
      totalParticipants += room.participants.size;
      if (room.recording && room.recording.status === "recording") {
        activeRecordings++;
      }
    }

    return {
      rooms: this.rooms.size,
      participants: totalParticipants,
      recordings: activeRecordings,
      signaling: this.signaling.getStats(),
    };
  }

  /**
   * Cleanup room
   */
  private cleanupRoom(roomId: string): void {
    const roomSession = this.rooms.get(roomId);
    if (!roomSession) {
      return;
    }

    // Stop recording if active
    if (roomSession.recording && roomSession.recording.status === "recording") {
      this.stopRecording(roomId).catch((error) => {
        console.error(`Failed to stop recording for room ${roomId}:`, error);
      });
    }

    // Close all participant SFUs
    for (const participant of roomSession.participants.values()) {
      participant.sfu.close();
    }

    // Close room SFU
    roomSession.sfu.close();

    this.rooms.delete(roomId);
  }

  /**
   * Kick user from room
   */
  kickUser(roomId: string, userId: string, reason?: string): void {
    this.signaling.kickUser(roomId, userId, reason);
  }

  /**
   * Close room
   */
  closeRoom(roomId: string, reason?: string): void {
    this.signaling.closeRoom(roomId, reason);
    this.cleanupRoom(roomId);
  }

  /**
   * Get signaling engine
   */
  getSignaling(): WebRTCSignalingEngine {
    return this.signaling;
  }

  /**
   * Destroy and cleanup
   */
  async destroy(): Promise<void> {
    // Close all rooms
    for (const roomId of this.rooms.keys()) {
      this.closeRoom(roomId, "Server shutting down");
    }

    // Destroy signaling
    this.signaling.destroy();

    // Destroy recording engine
    await this.recordingEngine.destroy();

    this.rooms.clear();
    this.recordings.clear();
    this.removeAllListeners();
  }
}
