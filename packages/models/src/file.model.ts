import mongoose, { type Document } from "mongoose";
import { ImageOperation } from "./types/file.enum";
import type { IFile, IFileProcessingJob } from "./types/file.type";

const fileSharingSchema = new mongoose.Schema({
  isPublic: { type: Boolean, default: false },
  allowDownload: { type: Boolean, default: true },
  allowPreview: { type: Boolean, default: true },
  expiresAt: Date,
  passwordProtected: { type: Boolean, default: false },
  password: String,
  maxDownloads: Number,
  downloadCount: { type: Number, default: 0 },
  shareLink: String,
  shareToken: String,
});

const fileMetadataSchema = new mongoose.Schema({
  dimensions: {
    width: Number,
    height: Number,
  },
  duration: Number,
  pages: Number,
  resolution: String,
  colorSpace: String,
  compression: String,
  author: String,
  title: String,
  subject: String,
  keywords: [String],
  creator: String,
  producer: String,
  creationDate: Date,
  modificationDate: Date,
  location: {
    latitude: Number,
    longitude: Number,
  },
  camera: {
    make: String,
    model: String,
    iso: Number,
    aperture: String,
    shutterSpeed: String,
    focalLength: String,
  },
});

const fileVersionSchema = new mongoose.Schema({
  id: String,
  version: Number,
  size: Number,
  url: String,
  uploadedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  uploadedByName: String,
  uploadedAt: Date,
  changes: String,
  isActive: { type: Boolean, default: false },
});

const fileScanResultSchema = new mongoose.Schema({
  clean: { type: Boolean, default: true },
  threats: [String],
  scanDate: Date,
  scanner: String,
  scanDuration: Number,
});

const fileSchema = new mongoose.Schema<IFile>(
  {
    url: {
      type: String,
      required: [true, "File URL is required"],
    },
    cdnUrl: {
      type: String,
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    name: {
      type: String,
      required: [true, "File name is required"],
    },
    mimeType: {
      type: String,
      required: [true, "Content type is required"],
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
    },
    description: String,
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "File must belong to a user"],
    },
    metadata: fileMetadataSchema,
    sharing: fileSharingSchema,
    versions: [fileVersionSchema],
    uploadedBy: String,
    downloadCount: { type: Number, default: 0 },
    lastAccessedAt: Date,
    thumbnailUrl: String,
    previewUrl: String,
    scanResult: fileScanResultSchema,
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
fileSchema.index({ user: 1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ isPublic: 1 });
fileSchema.index({ size: 1 });
fileSchema.index({ downloadCount: -1 });
fileSchema.index({ "sharing.shareToken": 1 });

// Text index for search functionality
fileSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

const File = mongoose.model<IFile>("FileOld", fileSchema);

// File Access Log Model
const fileAccessLogSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.ObjectId, ref: "File", required: true },
    userId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["VIEW", "DOWNLOAD", "SHARE", "EDIT", "DELETE"],
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    accessedAt: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexes for access logs
fileAccessLogSchema.index({ fileId: 1, accessedAt: -1 });
fileAccessLogSchema.index({ userId: 1, accessedAt: -1 });
fileAccessLogSchema.index({ action: 1 });

export const FileAccessLog = mongoose.model(
  "FileAccessLog",
  fileAccessLogSchema
);

// ==================== FILE PROCESSING JOB SCHEMA ====================

/**
 * File processing job schema
 */
const fileProcessingJobSchema = new mongoose.Schema<
  IFileProcessingJob & Document
>(
  {
    fileId: {
      type: String,
      required: true,
      ref: "File",
      index: true,
    },
    operation: {
      type: String,
      enum: Object.values(ImageOperation),
      required: true,
      index: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      required: true,
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      required: true,
      default: "pending",
      index: true,
    },
    progress: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    error: {
      type: String,
      maxlength: 1000,
    },
    outputFileId: {
      type: String,
      ref: "File",
      index: true,
    },
    startedAt: {
      type: Date,
      index: true,
    },
    completedAt: {
      type: Date,
    },

    // Processing metadata
    processingTime: {
      type: Number,
      min: 0, // in milliseconds
    },
    resourceUsage: {
      cpu: { type: Number, min: 0 },
      memory: { type: Number, min: 0 },
      disk: { type: Number, min: 0 },
    },

    // Retry information
    retryCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 5,
    },
    maxRetries: {
      type: Number,
      required: true,
      default: 3,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Processing job indexes
fileProcessingJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
fileProcessingJobSchema.index({ fileId: 1, operation: 1 });
fileProcessingJobSchema.index({ status: 1, startedAt: 1 });

// TTL index for completed/failed jobs (7 days retention)
fileProcessingJobSchema.index(
  { completedAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: {
      status: { $in: ["completed", "failed"] },
    },
  }
);

// ==================== PROCESSING JOB METHODS ====================

/**
 * Start processing job
 */
fileProcessingJobSchema.methods.start = function () {
  this.status = "processing";
  this.startedAt = new Date();
  return this.save();
};

/**
 * Complete processing job
 */
fileProcessingJobSchema.methods.complete = function (outputFileId?: string) {
  this.status = "completed";
  this.progress = 100;
  this.completedAt = new Date();
  this.outputFileId = outputFileId;

  if (this.startedAt) {
    this.processingTime = Date.now() - this.startedAt.getTime();
  }

  return this.save();
};

/**
 * Fail processing job
 */
fileProcessingJobSchema.methods.fail = function (error: string) {
  this.status = "failed";
  this.error = error;
  this.completedAt = new Date();

  if (this.startedAt) {
    this.processingTime = Date.now() - this.startedAt.getTime();
  }

  return this.save();
};

/**
 * Retry processing job
 */
fileProcessingJobSchema.methods.retry = function () {
  if (this.retryCount < this.maxRetries) {
    this.status = "pending";
    this.retryCount += 1;
    this.error = undefined;
    this.startedAt = undefined;
    this.progress = 0;
    return this.save();
  }
  throw new Error("Maximum retries exceeded");
};

/**
 * Update processing time calculation
 */
fileProcessingJobSchema.pre("save", function () {
  if (
    this.isModified("status") &&
    this.status === "processing" &&
    !this.startedAt
  ) {
    this.startedAt = new Date();
  }

  if (
    this.isModified("status") &&
    ["completed", "failed"].includes(this.status)
  ) {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }

    if (this.startedAt && !this.processingTime) {
      this.processingTime =
        this.completedAt.getTime() - this.startedAt.getTime();
    }
  }
});

export const FileProcessingJob = mongoose.model<IFileProcessingJob & Document>(
  "FileProcessingJobOld",
  fileProcessingJobSchema
);

export { File };
