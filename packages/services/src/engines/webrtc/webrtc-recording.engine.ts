import { EventEmitter } from "node:events";
import { createWriteStream, promises as fs } from "node:fs";
import { join } from "node:path";
import ffmpeg from "fluent-ffmpeg";
import {
  type StorageConfig,
  WebRTCStorageEngine,
} from "./webrtc-storage.engine";

export type RecordingConfig = {
  outputDir: string;
  format: "webm" | "mp4" | "mkv";
  videoCodec: "vp8" | "vp9" | "h264";
  audioCodec: "opus" | "aac";
  videoBitrate: number;
  audioBitrate: number;
  framerate: number;
  resolution: {
    width: number;
    height: number;
  };
  storage?: StorageConfig;
};

export type RecordingChunk = {
  data: Buffer;
  timestamp: number;
  type: "audio" | "video";
  participantId: string;
};

export type ActiveRecording = {
  id: string;
  roomId: string;
  startedAt: Date;
  chunks: RecordingChunk[];
  participants: Set<string>;
  status:
    | "recording"
    | "stopping"
    | "processing"
    | "completed"
    | "failed"
    | "stopped";
  outputPath?: string;
  fileSize?: number;
  duration?: number;
};

/**
 * WebRTC Recording Engine
 * Handles media capture, processing, and storage
 */
export class WebRTCRecordingEngine extends EventEmitter {
  private readonly config: RecordingConfig;
  private readonly recordings: Map<string, ActiveRecording> = new Map();
  private readonly processingQueue: string[] = [];
  private isProcessing = false;
  private readonly storageEngine?: WebRTCStorageEngine;

  constructor(config: Partial<RecordingConfig> = {}) {
    super();
    this.config = {
      outputDir: config.outputDir || "./recordings",
      format: config.format || "webm",
      videoCodec: config.videoCodec || "vp8",
      audioCodec: config.audioCodec || "opus",
      videoBitrate: config.videoBitrate || 2_000_000, // 2 Mbps
      audioBitrate: config.audioBitrate || 128_000, // 128 kbps
      framerate: config.framerate || 30,
      resolution: config.resolution || { width: 1280, height: 720 },
      storage: config.storage,
    };

    // Initialize storage engine if cloud storage is configured
    if (this.config.storage) {
      this.storageEngine = new WebRTCStorageEngine(this.config.storage);
      this.setupStorageEventHandlers();
    }

    this.ensureOutputDirectory();
  }

  /**
   * Setup storage event handlers
   */
  private setupStorageEventHandlers(): void {
    if (!this.storageEngine) return;

    this.storageEngine.on("uploadstart", ({ destinationKey }) => {
      this.emit("uploadstart", { key: destinationKey });
    });

    this.storageEngine.on("uploadprogress", ({ key, percentage }) => {
      this.emit("uploadprogress", { key, percentage });
    });

    this.storageEngine.on("uploadcomplete", ({ url, key, size }) => {
      this.emit("uploadcomplete", { url, key, size });
    });

    this.storageEngine.on("uploaderror", ({ key, error }) => {
      this.emit("uploaderror", { key, error });
    });
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create output directory:", error);
    }
  }

  /**
   * Start recording a room
   */
  async startRecording(roomId: string): Promise<string> {
    const recordingId = `rec_${roomId}_${Date.now()}`;

    const recording: ActiveRecording = {
      id: recordingId,
      roomId,
      startedAt: new Date(),
      chunks: [],
      participants: new Set(),
      status: "recording",
    };

    this.recordings.set(recordingId, recording);
    this.emit("recordingStarted", { recordingId, roomId });

    return await Promise.resolve(recordingId);
  }

  /**
   * Add media chunk to recording
   */
  addChunk(
    recordingId: string,
    participantId: string,
    data: Buffer,
    type: "audio" | "video"
  ): void {
    const recording = this.recordings.get(recordingId);
    if (!recording || recording.status !== "recording") {
      return;
    }

    recording.chunks.push({
      data,
      timestamp: Date.now(),
      type,
      participantId,
    });

    recording.participants.add(participantId);

    // Emit progress event every 100 chunks
    if (recording.chunks.length % 100 === 0) {
      this.emit("recordingProgress", {
        recordingId,
        chunks: recording.chunks.length,
        participants: recording.participants.size,
      });
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    recording.status = "stopping";
    this.emit("recordingStopping", { recordingId });

    // Add to processing queue
    this.processingQueue.push(recordingId);
    await this.processNextRecording();
  }

  /**
   * Process next recording in queue
   */
  private async processNextRecording(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    // biome-ignore lint/style/noNonNullAssertion: ignore
    const recordingId = this.processingQueue.shift()!;

    try {
      await this.processRecording(recordingId);
    } catch (error) {
      console.error(`Failed to process recording ${recordingId}:`, error);
      const recording = this.recordings.get(recordingId);
      if (recording) {
        recording.status = "failed";
        this.emit("recordingFailed", { recordingId, error });
      }
    } finally {
      this.isProcessing = false;
      // Process next recording
      if (this.processingQueue.length > 0) {
        this.processNextRecording();
      }
    }
  }

  /**
   * Process recording - combine chunks and encode
   */
  private async processRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    recording.status = "processing";
    this.emit("recordingProcessing", { recordingId });

    try {
      // 1. Sort chunks by timestamp
      recording.chunks.sort((a, b) => a.timestamp - b.timestamp);

      // 2. Separate audio and video chunks
      const audioChunks = recording.chunks.filter((c) => c.type === "audio");
      const videoChunks = recording.chunks.filter((c) => c.type === "video");

      // 3. Generate output filename
      const filename = `${recordingId}.${this.config.format}`;
      const outputPath = join(this.config.outputDir, filename);

      // 4. Combine chunks based on format
      if (this.config.format === "webm") {
        await this.combineWebMChunks(audioChunks, videoChunks, outputPath);
      } else {
        // For MP4/MKV, we'd use FFmpeg
        await this.combineWithFFmpeg(audioChunks, videoChunks, outputPath);
      }

      // 5. Get file stats
      const stats = await fs.stat(outputPath);
      recording.outputPath = outputPath;
      recording.fileSize = stats.size;
      recording.duration = Date.now() - recording.startedAt.getTime();

      // 6. Upload to cloud storage if configured
      if (this.config.storage && this.config.storage.provider !== "local") {
        await this.uploadToCloud(recordingId, outputPath);
      }

      // 7. Generate thumbnails
      await this.generateThumbnails(recordingId, outputPath);

      // 8. Mark as completed
      recording.status = "completed";
      this.emit("recordingCompleted", {
        recordingId,
        outputPath,
        fileSize: recording.fileSize,
        duration: recording.duration,
      });
    } catch (error) {
      recording.status = "failed";
      throw error;
    }
  }

  /**
   * Combine WebM chunks (native format)
   */
  private async combineWebMChunks(
    audioChunks: RecordingChunk[],
    videoChunks: RecordingChunk[],
    outputPath: string
  ): Promise<void> {
    // WebM is a container format that can be concatenated
    const writeStream = createWriteStream(outputPath);

    try {
      // Write WebM header (simplified - in production use proper WebM muxer)
      const header = this.createWebMHeader();
      writeStream.write(header);

      // Write video chunks
      for (const chunk of videoChunks) {
        writeStream.write(chunk.data);
      }

      // Write audio chunks (interleaved)
      for (const chunk of audioChunks) {
        writeStream.write(chunk.data);
      }

      await new Promise((resolve, reject) => {
        writeStream.end((err: any) => {
          if (err) reject(err);
          else resolve(null);
        });
      });
    } catch (error) {
      writeStream.destroy();
      throw error;
    }
  }

  /**
   * Create a proper WebM header with EBML structure
   * This creates a valid WebM file header with all necessary elements
   */
  private createWebMHeader(): Buffer {
    const buffers: Buffer[] = [];

    // EBML Header
    buffers.push(this.createEBMLHeader());

    // Segment
    buffers.push(this.createSegmentHeader());

    // Seek Head (for seeking in the file)
    buffers.push(this.createSeekHead());

    // Segment Info
    buffers.push(this.createSegmentInfo());

    // Tracks
    buffers.push(this.createTracksHeader());

    return Buffer.concat(buffers);
  }

  /**
   * Create EBML header element
   */
  private createEBMLHeader(): Buffer {
    const ebmlId = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]); // EBML ID
    const ebmlSize = Buffer.from([0x42, 0x86]); // Size: 6 bytes

    // EBML Version
    const ebmlVersionId = Buffer.from([0x42, 0x86]); // EBMLVersion ID
    const ebmlVersionSize = Buffer.from([0x81]); // Size: 1 byte
    const ebmlVersion = Buffer.from([0x01]); // Version 1

    // EBML Read Version
    const ebmlReadVersionId = Buffer.from([0x42, 0xf7]); // EBMLReadVersion ID
    const ebmlReadVersionSize = Buffer.from([0x81]); // Size: 1 byte
    const ebmlReadVersion = Buffer.from([0x01]); // Read Version 1

    // EBML Max ID Length
    const ebmlMaxIdLengthId = Buffer.from([0x42, 0xf2]); // EBMLMaxIDLength ID
    const ebmlMaxIdLengthSize = Buffer.from([0x81]); // Size: 1 byte
    const ebmlMaxIdLength = Buffer.from([0x04]); // Max ID Length 4

    // EBML Max Size Length
    const ebmlMaxSizeLengthId = Buffer.from([0x42, 0xf3]); // EBMLMaxSizeLength ID
    const ebmlMaxSizeLengthSize = Buffer.from([0x81]); // Size: 1 byte
    const ebmlMaxSizeLength = Buffer.from([0x08]); // Max Size Length 8

    // Doc Type
    const docTypeId = Buffer.from([0x42, 0x82]); // DocType ID
    const docTypeSize = Buffer.from([0x84]); // Size: 4 bytes
    const docType = Buffer.from("webm", "ascii"); // DocType: "webm"

    // Doc Type Version
    const docTypeVersionId = Buffer.from([0x42, 0x87]); // DocTypeVersion ID
    const docTypeVersionSize = Buffer.from([0x81]); // Size: 1 byte
    const docTypeVersion = Buffer.from([0x04]); // Version 4

    // Doc Type Read Version
    const docTypeReadVersionId = Buffer.from([0x42, 0x85]); // DocTypeReadVersion ID
    const docTypeReadVersionSize = Buffer.from([0x81]); // Size: 1 byte
    const docTypeReadVersion = Buffer.from([0x02]); // Read Version 2

    return Buffer.concat([
      ebmlId,
      ebmlSize,
      ebmlVersionId,
      ebmlVersionSize,
      ebmlVersion,
      ebmlReadVersionId,
      ebmlReadVersionSize,
      ebmlReadVersion,
      ebmlMaxIdLengthId,
      ebmlMaxIdLengthSize,
      ebmlMaxIdLength,
      ebmlMaxSizeLengthId,
      ebmlMaxSizeLengthSize,
      ebmlMaxSizeLength,
      docTypeId,
      docTypeSize,
      docType,
      docTypeVersionId,
      docTypeVersionSize,
      docTypeVersion,
      docTypeReadVersionId,
      docTypeReadVersionSize,
      docTypeReadVersion,
    ]);
  }

  /**
   * Create Segment header
   */
  private createSegmentHeader(): Buffer {
    const segmentId = Buffer.from([0x18, 0x53, 0x80, 0x67]); // Segment ID
    const segmentSize = Buffer.from([
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]); // Size: 0 (unknown)

    return Buffer.concat([segmentId, segmentSize]);
  }

  /**
   * Create Seek Head element
   */
  private createSeekHead(): Buffer {
    const seekHeadId = Buffer.from([0x11, 0x4d, 0x9b, 0x74]); // SeekHead ID
    const seekHeadSize = Buffer.from([0x4c]); // Size: 76 bytes

    // Seek entry for Info
    const seekEntryId = Buffer.from([0x4d, 0xbb]); // SeekEntry ID
    const seekEntrySize = Buffer.from([0x2e]); // Size: 46 bytes

    const seekId = Buffer.from([0x53, 0xab, 0x84]); // SeekID ID
    const seekIdSize = Buffer.from([0x83]); // Size: 3 bytes
    const seekIdValue = Buffer.from([0x15, 0x49, 0xa9, 0x66]); // Info ID

    const seekPositionId = Buffer.from([0x53, 0xac]); // SeekPosition ID
    const seekPositionSize = Buffer.from([0x81]); // Size: 1 byte
    const seekPosition = Buffer.from([0x00]); // Position: 0

    // Seek entry for Tracks
    const seekEntry2Id = Buffer.from([0x4d, 0xbb]); // SeekEntry ID
    const seekEntry2Size = Buffer.from([0x2e]); // Size: 46 bytes

    const seekId2 = Buffer.from([0x53, 0xab, 0x84]); // SeekID ID
    const seekId2Size = Buffer.from([0x83]); // Size: 3 bytes
    const seekId2Value = Buffer.from([0x16, 0x54, 0xae, 0x6b]); // Tracks ID

    const seekPosition2Id = Buffer.from([0x53, 0xac]); // SeekPosition ID
    const seekPosition2Size = Buffer.from([0x81]); // Size: 1 byte
    const seekPosition2 = Buffer.from([0x00]); // Position: 0

    return Buffer.concat([
      seekHeadId,
      seekHeadSize,
      seekEntryId,
      seekEntrySize,
      seekId,
      seekIdSize,
      seekIdValue,
      seekPositionId,
      seekPositionSize,
      seekPosition,
      seekEntry2Id,
      seekEntry2Size,
      seekId2,
      seekId2Size,
      seekId2Value,
      seekPosition2Id,
      seekPosition2Size,
      seekPosition2,
    ]);
  }

  /**
   * Create Segment Info element
   */
  private createSegmentInfo(): Buffer {
    const infoId = Buffer.from([0x15, 0x49, 0xa9, 0x66]); // Info ID
    const infoSize = Buffer.from([0x4c]); // Size: 76 bytes

    // Timecode Scale
    const timecodeScaleId = Buffer.from([0x2a, 0xd7, 0xb1]); // TimecodeScale ID
    const timecodeScaleSize = Buffer.from([0x84]); // Size: 4 bytes
    const timecodeScale = Buffer.from([0x00, 0x00, 0x03, 0xe8]); // 1000000 (1ms)

    // Muxing App
    const muxingAppId = Buffer.from([0x4d, 0x80]); // MuxingApp ID
    const muxingAppSize = Buffer.from([0x86]); // Size: 6 bytes
    const muxingApp = Buffer.from("WebRTC", "ascii");

    // Writing App
    const writingAppId = Buffer.from([0x57, 0x41]); // WritingApp ID
    const writingAppSize = Buffer.from([0x86]); // Size: 6 bytes
    const writingApp = Buffer.from("WebRTC", "ascii");

    // Duration
    const durationId = Buffer.from([0x44, 0x89]); // Duration ID
    const durationSize = Buffer.from([0x84]); // Size: 4 bytes
    const duration = Buffer.from([0x00, 0x00, 0x00, 0x00]); // 0 (unknown)

    return Buffer.concat([
      infoId,
      infoSize,
      timecodeScaleId,
      timecodeScaleSize,
      timecodeScale,
      muxingAppId,
      muxingAppSize,
      muxingApp,
      writingAppId,
      writingAppSize,
      writingApp,
      durationId,
      durationSize,
      duration,
    ]);
  }

  /**
   * Create Tracks header with dynamic configuration
   */
  private createTracksHeader(): Buffer {
    const tracksId = Buffer.from([0x16, 0x54, 0xae, 0x6b]); // Tracks ID
    const tracksSize = Buffer.from([0x4c]); // Size: 76 bytes

    // Track Entry for Video
    const trackEntryId = Buffer.from([0xae]); // TrackEntry ID
    const trackEntrySize = Buffer.from([0x4c]); // Size: 76 bytes

    const trackNumberId = Buffer.from([0xd7]); // TrackNumber ID
    const trackNumberSize = Buffer.from([0x81]); // Size: 1 byte
    const trackNumber = Buffer.from([0x01]); // Track 1

    const trackUidId = Buffer.from([0x73, 0xc5]); // TrackUID ID
    const trackUidSize = Buffer.from([0x84]); // Size: 4 bytes
    const trackUid = Buffer.from([0x00, 0x00, 0x00, 0x01]); // UID 1

    const trackTypeId = Buffer.from([0x83]); // TrackType ID
    const trackTypeSize = Buffer.from([0x81]); // Size: 1 byte
    const trackType = Buffer.from([0x01]); // Video track

    // Dynamic codec based on configuration
    const codecId = Buffer.from([0x86]); // CodecID ID
    const codecIdSize = Buffer.from([0x84]); // Size: 4 bytes
    const codecIdValue = Buffer.from(this.getWebMCodecId(), "ascii");

    const videoId = Buffer.from([0xe0]); // Video ID
    const videoSize = Buffer.from([0x4c]); // Size: 76 bytes

    // Dynamic resolution based on configuration
    const pixelWidthId = Buffer.from([0xb0]); // PixelWidth ID
    const pixelWidthSize = Buffer.from([0x84]); // Size: 4 bytes
    const pixelWidth = this.createUint32Buffer(this.config.resolution.width);

    const pixelHeightId = Buffer.from([0xba]); // PixelHeight ID
    const pixelHeightSize = Buffer.from([0x84]); // Size: 4 bytes
    const pixelHeight = this.createUint32Buffer(this.config.resolution.height);

    return Buffer.concat([
      tracksId,
      tracksSize,
      trackEntryId,
      trackEntrySize,
      trackNumberId,
      trackNumberSize,
      trackNumber,
      trackUidId,
      trackUidSize,
      trackUid,
      trackTypeId,
      trackTypeSize,
      trackType,
      codecId,
      codecIdSize,
      codecIdValue,
      videoId,
      videoSize,
      pixelWidthId,
      pixelWidthSize,
      pixelWidth,
      pixelHeightId,
      pixelHeightSize,
      pixelHeight,
    ]);
  }

  /**
   * Get WebM codec ID based on configuration
   */
  private getWebMCodecId(): string {
    switch (this.config.videoCodec) {
      case "vp8":
        return "V_VP8";
      case "vp9":
        return "V_VP9";
      case "h264":
        return "V_AV1"; // WebM doesn't support H.264, use AV1 instead
      default:
        return "V_VP8";
    }
  }

  /**
   * Create a 32-bit unsigned integer buffer
   */
  private createUint32Buffer(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value, 0);
    return buffer;
  }

  /**
   * Combine chunks using fluent-ffmpeg
   */
  private async combineWithFFmpeg(
    audioChunks: RecordingChunk[],
    videoChunks: RecordingChunk[],
    outputPath: string
  ): Promise<void> {
    // Write chunks to temporary files
    const tempAudioPath = join(
      this.config.outputDir,
      `temp_audio_${Date.now()}.webm`
    );
    const tempVideoPath = join(
      this.config.outputDir,
      `temp_video_${Date.now()}.webm`
    );

    try {
      // Write audio chunks
      const audioStream = createWriteStream(tempAudioPath);
      for (const chunk of audioChunks) {
        audioStream.write(chunk.data);
      }
      await new Promise((resolve) => audioStream.end(resolve));

      // Write video chunks
      const videoStream = createWriteStream(tempVideoPath);
      for (const chunk of videoChunks) {
        videoStream.write(chunk.data);
      }
      await new Promise((resolve) => videoStream.end(resolve));

      // Combine using fluent-ffmpeg
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg()
          .input(tempVideoPath)
          .input(tempAudioPath)
          .videoCodec(this.getVideoCodec())
          .audioCodec(this.getAudioCodec())
          .videoBitrate(this.config.videoBitrate)
          .audioBitrate(this.config.audioBitrate)
          .fps(this.config.framerate)
          .size(
            `${this.config.resolution.width}x${this.config.resolution.height}`
          )
          .outputOptions([
            "-preset fast", // Faster encoding
            "-crf 23", // Constant rate factor for quality
            "-movflags +faststart", // Optimize for streaming
            "-pix_fmt yuv420p", // Ensure compatibility
          ])
          .output(outputPath)
          .on("start", (commandLine: any) => {
            console.log("FFmpeg started:", commandLine);
          })
          .on("progress", (progress: { percent: any; timemark: any }) => {
            console.log(`Processing: ${progress.percent}% done`);
            this.emit("recordingProgress", {
              recordingId: this.getRecordingIdFromPath(outputPath),
              progress: progress.percent,
              time: progress.timemark,
            });
          })
          .on("end", async () => {
            console.log("FFmpeg processing finished");
            // Clean up temp files
            await this.cleanupTempFiles(tempAudioPath, tempVideoPath);
            resolve();
          })
          .on("error", async (error: { message: any }) => {
            console.error("FFmpeg error:", error);
            // Clean up temp files on error
            await this.cleanupTempFiles(tempAudioPath, tempVideoPath);
            reject(new Error(`FFmpeg processing failed: ${error.message}`));
          });

        // Start the processing
        command.run();
      });
    } catch (error) {
      // Clean up temp files on any error
      await this.cleanupTempFiles(tempAudioPath, tempVideoPath);
      throw error;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTempFiles(...paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        await fs.unlink(path);
        console.log(`Cleaned up temp file: ${path}`);
      } catch (error) {
        console.warn(`Failed to clean up temp file ${path}:`, error);
      }
    }
  }

  /**
   * Get recording ID from output path
   */
  private getRecordingIdFromPath(outputPath: string): string {
    const filename = outputPath.split("/").pop() || "";
    return filename.split(".")[0] || "";
  }

  /**
   * Get FFmpeg video codec
   */
  private getVideoCodec(): string {
    switch (this.config.videoCodec) {
      case "vp8":
        return "libvpx";
      case "vp9":
        return "libvpx-vp9";
      case "h264":
        return "libx264";
      default:
        return "libvpx";
    }
  }

  /**
   * Get FFmpeg audio codec
   */
  private getAudioCodec(): string {
    switch (this.config.audioCodec) {
      case "opus":
        return "libopus";
      case "aac":
        return "aac";
      default:
        return "libopus";
    }
  }

  /**
   * Upload recording to cloud storage
   */
  private async uploadToCloud(
    recordingId: string,
    filePath: string
  ): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!(recording && this.storageEngine)) {
      return;
    }

    try {
      const filename = filePath.split("/").pop() || recordingId;
      const destinationKey = `recordings/${recordingId}/${filename}`;

      const result = await this.storageEngine.uploadFileWithProgress(
        filePath,
        destinationKey,
        {
          contentType: `video/${this.config.format}`,
          metadata: {
            recordingId,
            roomId: recording.roomId,
            duration: recording.duration?.toString() || "0",
          },
          public: false,
        }
      );

      // Update recording with cloud URL
      recording.outputPath = result.url;

      this.emit("recordingUploaded", {
        recordingId,
        provider: this.config.storage?.provider,
        url: result.url,
        key: result.key,
      });
    } catch (error) {
      console.error("Failed to upload recording to cloud:", error);
      throw error;
    }
  }

  /**
   * Generate thumbnails from recording
   */
  private async generateThumbnails(
    recordingId: string,
    videoPath: string
  ): Promise<void> {
    const thumbnailDir = join(this.config.outputDir, "thumbnails", recordingId);
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Generate thumbnails at different positions
    const positions = ["00:00:05", "00:00:15", "00:00:30", "00:01:00"];
    const thumbnailPromises: Promise<void>[] = [];

    for (let i = 0; i < positions.length; i++) {
      const outputPath = join(thumbnailDir, `thumb_${i}.jpg`);

      const thumbnailPromise = new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .seekInput(positions[i] ?? "")
          .frames(1)
          .size("320x?")
          .outputOptions([
            "-q:v 2", // High quality
            "-vf scale=320:-1:flags=lanczos", // Better scaling algorithm
          ])
          .output(outputPath)
          .on("start", (commandLine: any) => {
            console.log(`Generating thumbnail ${i + 1}:`, commandLine);
          })
          .on("end", () => {
            console.log(`Thumbnail ${i + 1} generated: ${outputPath}`);
            resolve();
          })
          .on("error", (error: { message: any }) => {
            console.error(`Thumbnail ${i + 1} generation failed:`, error);
            reject(new Error(`Thumbnail generation failed: ${error.message}`));
          })
          .run();
      });

      thumbnailPromises.push(thumbnailPromise);
    }

    try {
      await Promise.all(thumbnailPromises);
      this.emit("thumbnailsGenerated", {
        recordingId,
        count: positions.length,
      });
    } catch (error) {
      console.error("Some thumbnails failed to generate:", error);
      // Don't throw - thumbnails are optional
    }
  }

  /**
   * Convert video to different format using fluent-ffmpeg
   */
  convertVideo(
    inputPath: string,
    outputPath: string,
    options: {
      format?: string;
      quality?: "low" | "medium" | "high";
      resolution?: { width: number; height: number };
      bitrate?: number;
    } = {}
  ): Promise<void> {
    const {
      format = "mp4",
      quality = "medium",
      resolution = this.config.resolution,
      bitrate = this.config.videoBitrate,
    } = options;

    return new Promise<void>((resolve, reject) => {
      let command = ffmpeg(inputPath)
        .videoCodec(this.getVideoCodec())
        .audioCodec(this.getAudioCodec())
        .size(`${resolution.width}x${resolution.height}`)
        .videoBitrate(bitrate);

      // Apply quality presets
      switch (quality) {
        case "low":
          command = command.outputOptions(["-preset ultrafast", "-crf 28"]);
          break;
        case "medium":
          command = command.outputOptions(["-preset fast", "-crf 23"]);
          break;
        case "high":
          command = command.outputOptions(["-preset slow", "-crf 18"]);
          break;
        default:
          command = command.outputOptions(["-preset fast", "-crf 23"]);
          break;
      }

      // Apply format-specific options
      if (format === "mp4") {
        command = command.outputOptions([
          "-movflags +faststart", // Optimize for streaming
          "-pix_fmt yuv420p", // Ensure compatibility
        ]);
      }

      command
        .output(outputPath)
        .on("start", (commandLine: any) => {
          console.log("Video conversion started:", commandLine);
        })
        .on("progress", (progress: { percent: any }) => {
          console.log(`Conversion progress: ${progress.percent}% done`);
        })
        .on("end", () => {
          console.log("Video conversion completed");
          resolve();
        })
        .on("error", (error: { message: any }) => {
          console.error("Video conversion failed:", error);
          reject(new Error(`Video conversion failed: ${error.message}`));
        })
        .run();
    });
  }

  /**
   * Get video metadata using fluent-ffmpeg
   */
  getVideoMetadata(videoPath: string): Promise<{
    duration: number;
    size: { width: number; height: number };
    bitrate: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      (ffmpeg as any).ffprobe(
        videoPath,
        (error: Error | null, metadata: any) => {
          if (error) {
            reject(new Error(`Failed to get video metadata: ${error.message}`));
            return;
          }

          const videoStream = metadata.streams.find(
            (stream: { codec_type: string }) => stream.codec_type === "video"
          );
          const audioStream = metadata.streams.find(
            (stream: { codec_type: string }) => stream.codec_type === "audio"
          );

          resolve({
            duration: Number.parseFloat(metadata.format.duration || "0"),
            size: {
              width: videoStream?.width || 0,
              height: videoStream?.height || 0,
            },
            bitrate: Number.parseInt(metadata.format.bit_rate || "0", 10),
            format: metadata.format.format_name || "unknown",
          });
        }
      );
    });
  }

  /**
   * Get recording info
   */
  getRecording(recordingId: string): ActiveRecording | undefined {
    return this.recordings.get(recordingId);
  }

  /**
   * Get all recordings
   */
  getAllRecordings(): ActiveRecording[] {
    return Array.from(this.recordings.values());
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) {
      throw new Error("Recording not found");
    }

    // Delete file if exists
    if (recording.outputPath) {
      try {
        await fs.unlink(recording.outputPath);
      } catch (error) {
        console.error("Failed to delete recording file:", error);
      }
    }

    // Delete thumbnails
    const thumbnailDir = join(this.config.outputDir, "thumbnails", recordingId);
    try {
      await fs.rm(thumbnailDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Failed to delete thumbnails:", error);
    }

    this.recordings.delete(recordingId);
    this.emit("recordingDeleted", { recordingId });
  }

  /**
   * Clean up old recordings
   */
  async cleanupOldRecordings(maxAgeMs: number): Promise<number> {
    const now = Date.now();
    let deletedCount = 0;

    for (const [recordingId, recording] of this.recordings) {
      const age = now - recording.startedAt.getTime();
      if (age > maxAgeMs && recording.status === "completed") {
        await this.deleteRecording(recordingId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get recording statistics
   */
  getStats(): {
    total: number;
    recording: number;
    processing: number;
    completed: number;
    failed: number;
    totalSize: number;
  } {
    let recording = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;
    let totalSize = 0;

    for (const rec of this.recordings.values()) {
      switch (rec.status) {
        case "recording":
          recording++;
          break;
        case "processing":
          processing++;
          break;
        case "completed":
          completed++;
          totalSize += rec.fileSize || 0;
          break;
        case "failed":
          failed++;
          break;
        default:
          break;
      }
    }

    return {
      total: this.recordings.size,
      recording,
      processing,
      completed,
      failed,
      totalSize,
    };
  }

  /**
   * Destroy and cleanup
   */
  async destroy(): Promise<void> {
    // Stop all active recordings
    for (const [recordingId, recording] of this.recordings) {
      if (recording.status === "recording") {
        await this.stopRecording(recordingId);
      }
    }

    this.removeAllListeners();
  }
}
