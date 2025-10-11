import { EventEmitter } from "node:events";
import { createWriteStream, promises as fs } from "node:fs";
import { join } from "node:path";
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
   * Create WebM header
   */
  private createWebMHeader(): Buffer {
    // Simplified WebM header
    // In production, use a proper WebM muxer library like 'webm-muxer'
    const header = Buffer.from([
      0x1a,
      0x45,
      0xdf,
      0xa3, // EBML header
      // ... more header bytes
    ]);
    return header;
  }

  /**
   * Combine chunks using FFmpeg
   */
  private async combineWithFFmpeg(
    audioChunks: RecordingChunk[],
    videoChunks: RecordingChunk[],
    outputPath: string
  ): Promise<void> {
    const { spawn } = await import("node:child_process");

    // Write chunks to temporary files
    const tempAudioPath = join(
      this.config.outputDir,
      `temp_audio_${Date.now()}.webm`
    );
    const tempVideoPath = join(
      this.config.outputDir,
      `temp_video_${Date.now()}.webm`
    );

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

    // Combine using FFmpeg
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempVideoPath,
        "-i",
        tempAudioPath,
        "-c:v",
        this.getVideoCodec(),
        "-c:a",
        this.getAudioCodec(),
        "-b:v",
        `${this.config.videoBitrate}`,
        "-b:a",
        `${this.config.audioBitrate}`,
        "-r",
        `${this.config.framerate}`,
        "-s",
        `${this.config.resolution.width}x${this.config.resolution.height}`,
        "-y", // Overwrite output file
        outputPath,
      ]);

      ffmpeg.on("close", async (code) => {
        // Clean up temp files
        await fs.unlink(tempAudioPath).catch(() => {
          console.log("Cleaning up temp audios...");
        });
        await fs.unlink(tempVideoPath).catch(() => {
          console.log("Cleaning up .temp videos..");
        });

        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", reject);
    });
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
    const { spawn } = await import("node:child_process");

    const thumbnailDir = join(this.config.outputDir, "thumbnails", recordingId);
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Generate thumbnails at 0%, 25%, 50%, 75%, 100%
    const positions = ["0%", "25%", "50%", "75%", "100%"];

    for (let i = 0; i < positions.length; i++) {
      const outputPath = join(thumbnailDir, `thumb_${i}.jpg`);

      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i",
          videoPath,
          "-ss",
          positions[i] ?? "",
          "-vframes",
          "1",
          "-vf",
          "scale=320:-1",
          "-y",
          outputPath,
        ]);

        ffmpeg.on("close", (code) => {
          if (code === 0) resolve(null);
          else
            reject(
              new Error(`FFmpeg thumbnail generation failed with code ${code}`)
            );
        });

        ffmpeg.on("error", reject);
      });
    }

    this.emit("thumbnailsGenerated", { recordingId, count: positions.length });
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
