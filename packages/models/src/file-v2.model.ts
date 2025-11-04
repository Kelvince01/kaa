/**
 * Files Models
 *
 * Mongoose models for comprehensive file management system
 * Includes files, processing jobs, and analytics with Kenya-specific features
 */

import mongoose, { type Document, model, Schema } from "mongoose";
import {
  FileAccessLevel,
  FileCategory,
  FileStatus,
  FileType,
  type IFile,
  type IFileAnalytics,
  type IFileMetadata,
  type IFileProcessingJob,
  type IFileScanResult,
  type IFileSharingSettings,
  type IFileVersion,
  ImageOperation,
  StorageProvider,
} from "./types/file-v2.type";

// ==================== FILE SCHEMA ====================

const fileSharingSchema = new mongoose.Schema<IFileSharingSettings>({
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

const fileMetadataSchema = new mongoose.Schema<IFileMetadata>({
  dimensions: {
    width: Number,
    height: Number,
  },
  duration: Number,
  pages: Number,
  resolution: String,
  colorSpace: String,
  compression: String,
  exif: { type: Schema.Types.Mixed }, // EXIF data for images
  checksum: {
    type: String,
    required: true,
    maxlength: 128,
    index: true,
  },
  encoding: { type: String, maxlength: 50 },
  orientation: { type: Number, min: 1, max: 8 },
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

const fileVersionSchema = new mongoose.Schema<IFileVersion>({
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

const fileScanResultSchema = new mongoose.Schema<IFileScanResult>({
  clean: { type: Boolean, default: true },
  threats: [String],
  scanDate: Date,
  scanner: String,
  scanDuration: Number,
});

/**
 * Main file schema
 */
const fileSchema = new Schema<IFile & Document>(
  {
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      maxlength: 255,
      unique: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(FileType),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(FileCategory),
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    description: String,

    // Storage information
    provider: {
      type: String,
      enum: Object.values(StorageProvider),
      required: true,
      default: StorageProvider.AWS_S3,
    },
    bucket: {
      type: String,
      maxlength: 100,
    },
    key: {
      type: String,
      required: true,
      maxlength: 500,
      index: true,
    },
    url: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    cdnUrl: {
      type: String,
      maxlength: 1000,
    },
    path: {
      type: String,
      // required: [true, "File path is required"],
    },
    thumbnailUrl: String,
    previewUrl: String,

    // File metadata
    metadata: fileMetadataSchema,
    sharing: fileSharingSchema,
    versions: [fileVersionSchema],
    scanResult: fileScanResultSchema,

    // Access control
    accessLevel: {
      type: String,
      enum: Object.values(FileAccessLevel),
      required: true,
      default: FileAccessLevel.PRIVATE,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.ObjectId,
      required: [true, "File must belong to a user"],
      ref: "User",
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.ObjectId,
      ref: "Organization",
      index: true,
    },

    // Processing status
    status: {
      type: String,
      enum: Object.values(FileStatus),
      required: true,
      default: FileStatus.UPLOADING,
      index: true,
    },
    processingProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    processingError: {
      type: String,
      maxlength: 1000,
    },

    // Relationships
    relatedEntityId: {
      type: String,
      index: true,
    },
    relatedEntityType: {
      type: String,
      maxlength: 50,
      index: true,
    },
    parentFileId: {
      type: String,
      ref: "File",
      index: true,
    },

    // Kenya-specific metadata
    kenyaMetadata: {
      county: {
        type: String,
        maxlength: 50,
        index: true,
      },
      gpsCoordinates: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 },
        accuracy: { type: Number, min: 0 },
      },
      capturedAt: { type: Date },
      deviceInfo: {
        model: { type: String, maxlength: 100 },
        os: { type: String, maxlength: 50 },
        app: { type: String, maxlength: 50 },
      },
    },

    // File variants
    variants: {
      type: Map,
      of: {
        url: { type: String, required: true, maxlength: 1000 },
        size: { type: Number, required: true, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        format: { type: String, maxlength: 20 },
      },
      default: () => new Map(),
    },

    // Usage tracking
    downloadCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    viewCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastAccessedAt: {
      type: Date,
      index: true,
    },

    // Lifecycle management
    expiresAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
      index: true,
    },
    deletedAt: {
      type: Date,
    },

    // Audit trail
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    ipAddress: {
      type: String,
      maxlength: 45, // IPv6 support
    },
    userAgent: {
      type: String,
      maxlength: 500,
    },

    // Tags for organization
    tags: {
      type: [String],
      default: [],
      index: true,
      validate: {
        validator: (v: string[]) => v.length <= 20,
        message: "Maximum 20 tags allowed",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== FILE SCHEMA INDEXES ====================

// Compound indexes for efficient queries
fileSchema.index({ ownerId: 1, category: 1, createdAt: -1 });
fileSchema.index({ type: 1, status: 1, createdAt: -1 });
fileSchema.index({ relatedEntityId: 1, relatedEntityType: 1 });
fileSchema.index({ provider: 1, bucket: 1, key: 1 });
fileSchema.index({ status: 1, expiresAt: 1 });
fileSchema.index({ "kenyaMetadata.county": 1, type: 1 });
fileSchema.index({ tags: 1, status: 1 });
fileSchema.index({ downloadCount: -1 });
fileSchema.index({ "sharing.shareToken": 1 });

// Geospatial index for GPS coordinates
fileSchema.index({ "kenyaMetadata.gpsCoordinates": "2dsphere" });

// Text search index
fileSchema.index(
  { originalName: "text", tags: "text" },
  {
    name: "file_text_search",
    default_language: "english",
    weights: {
      originalName: 10,
      tags: 5,
    },
  }
);

// TTL index for expired files
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index for deleted files cleanup (30 days retention)
fileSchema.index(
  { deletedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { deletedAt: { $exists: true } },
  }
);

// ==================== FILE SCHEMA METHODS ====================

/**
 * Generate file variants (thumbnails, etc.)
 */
fileSchema.methods.addVariant = function (name: string, variant: any) {
  this.variants.set(name, variant);
  return this.save();
};

/**
 * Mark file as ready
 */
fileSchema.methods.markAsReady = function () {
  this.status = FileStatus.READY;
  this.processingProgress = 100;
  this.processingError = undefined;
  return this.save();
};

/**
 * Mark file as failed
 */
fileSchema.methods.markAsFailed = function (error: string) {
  this.status = FileStatus.FAILED;
  this.processingError = error;
  return this.save();
};

/**
 * Update processing progress
 */
fileSchema.methods.updateProgress = function (progress: number) {
  this.processingProgress = Math.max(0, Math.min(100, progress));
  if (progress >= 100) {
    this.status = FileStatus.READY;
  }
  return this.save();
};

/**
 * Track file access
 */
fileSchema.methods.trackAccess = function (type: "view" | "download") {
  if (type === "view") {
    this.viewCount += 1;
  } else {
    this.downloadCount += 1;
  }
  this.lastAccessedAt = new Date();
  return this.save();
};

/**
 * Soft delete file
 */
fileSchema.methods.softDelete = function () {
  this.status = FileStatus.DELETED;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Check if file is image
 */
fileSchema.methods.isImage = function (): boolean {
  return this.type === FileType.IMAGE;
};

/**
 * Check if file is document
 */
fileSchema.methods.isDocument = function (): boolean {
  return this.type === FileType.DOCUMENT;
};

/**
 * Get human readable file size
 */
fileSchema.methods.getHumanSize = function (): string {
  const bytes = this.size;
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Check if file has GPS data
 */
fileSchema.methods.hasGpsData = function (): boolean {
  return !!(
    this.kenyaMetadata?.gpsCoordinates?.latitude &&
    this.kenyaMetadata?.gpsCoordinates?.longitude
  );
};

// ==================== FILE PROCESSING JOB SCHEMA ====================

/**
 * File processing job schema
 */
const fileProcessingJobSchema = new Schema<IFileProcessingJob & Document>(
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
      type: Schema.Types.Mixed,
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

// ==================== FILE ANALYTICS SCHEMA ====================

/**
 * File analytics schema
 */
const fileAnalyticsSchema = new Schema<IFileAnalytics & Document>(
  {
    date: {
      type: Date,
      required: true,
    },

    // Upload metrics
    totalUploads: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalUploadSize: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    uploadsByType: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    uploadsByCategory: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    failedUploads: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Storage metrics
    totalFiles: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalStorage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    storageByType: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    storageByCategory: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },

    // Usage metrics
    totalDownloads: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalViews: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalShares: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    uniqueUsers: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    uniqueViewers: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    viewsByDate: {
      type: [Object],
      of: {
        date: Date,
        count: Number,
      },
      default: [],
    },
    downloadsByDate: {
      type: [Object],
      of: {
        date: Date,
        count: Number,
      },
      default: [],
    },
    topReferrers: {
      type: [Object],
      of: {
        referrer: String,
        count: Number,
      },
      default: [],
    },
    topCountries: {
      type: [Object],
      of: {
        country: String,
        count: Number,
      },
      default: [],
    },
    avgViewDuration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Processing metrics
    processingJobs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    processingTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    processingErrors: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Kenya-specific metrics
    kenyaMetrics: {
      uploadsWithGps: { type: Number, default: 0, min: 0 },
      uploadsByCounty: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
      mobileUploads: { type: Number, default: 0, min: 0 },
      averageFileSize: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes
fileAnalyticsSchema.index({ date: -1 });
fileAnalyticsSchema.index({ date: 1 }, { unique: true });

// ==================== ANALYTICS METHODS ====================

/**
 * Update file type distribution
 */
fileAnalyticsSchema.methods.updateTypeDistribution = function (
  type: FileType,
  increment = 1
) {
  const current = this.uploadsByType.get(type) || 0;
  this.uploadsByType.set(type, current + increment);
  return this.save();
};

/**
 * Update category distribution
 */
fileAnalyticsSchema.methods.updateCategoryDistribution = function (
  category: FileCategory,
  increment = 1
) {
  const current = this.uploadsByCategory.get(category) || 0;
  this.uploadsByCategory.set(category, current + increment);
  return this.save();
};

/**
 * Calculate average file size
 */
fileAnalyticsSchema.methods.calculateAverageFileSize = function () {
  if (this.totalFiles > 0) {
    this.kenyaMetrics.averageFileSize = this.totalStorage / this.totalFiles;
  }
  return this.save();
};

// ==================== VIRTUAL FIELDS ====================

/**
 * File virtual fields
 */
fileSchema.virtual("publicUrl").get(function () {
  return this.accessLevel === FileAccessLevel.PUBLIC ? this.url : null;
});

fileSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

fileSchema.virtual("isDeleted").get(function () {
  return this.status === FileStatus.DELETED || !!this.deletedAt;
});

fileSchema.virtual("processingDuration").get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

// ==================== PRE-SAVE MIDDLEWARE ====================

/**
 * Generate filename and detect file type before saving
 */
fileSchema.pre("save", function () {
  // Generate unique filename if not provided
  if (!this.fileName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = this.originalName.split(".").pop() || "";
    this.fileName = `${timestamp}_${random}.${extension}`;
  }

  // Auto-detect file type from MIME type
  if (!this.type) {
    if (this.mimeType.startsWith("image/")) {
      this.type = FileType.IMAGE;
    } else if (this.mimeType.startsWith("video/")) {
      this.type = FileType.VIDEO;
    } else if (this.mimeType.startsWith("audio/")) {
      this.type = FileType.AUDIO;
    } else if (
      this.mimeType.includes("pdf") ||
      this.mimeType.includes("document") ||
      this.mimeType.includes("text")
    ) {
      this.type = FileType.DOCUMENT;
    } else if (
      this.mimeType.includes("zip") ||
      this.mimeType.includes("rar") ||
      this.mimeType.includes("tar")
    ) {
      this.type = FileType.ARCHIVE;
    } else {
      this.type = FileType.OTHER;
    }
  }

  // Set upload date if not provided
  if (!this.uploadedAt) {
    this.uploadedAt = new Date();
  }
});

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

// ==================== EXPORT MODELS ====================

export const File = model<IFile & Document>("File", fileSchema);
export const FileProcessingJob = model<IFileProcessingJob & Document>(
  "FileProcessingJob",
  fileProcessingJobSchema
);
export const FileAnalytics = model<IFileAnalytics & Document>(
  "FileAnalytics",
  fileAnalyticsSchema
);

// Export schemas for testing and extending
export {
  fileSchema as FileSchema,
  fileProcessingJobSchema as FileProcessingJobSchema,
  fileAnalyticsSchema as FileAnalyticsSchema,
};
