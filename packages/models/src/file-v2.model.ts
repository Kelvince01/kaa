/**
 * Files Models
 *
 * Mongoose models for comprehensive file management system
 * Includes files, processing jobs, and analytics with Kenya-specific features
 */

import { type Document, model, Schema } from "mongoose";
import {
  FileAccessLevel,
  FileCategory,
  FileStatus,
  FileType,
  type IFile,
  type IFileAnalytics,
  type IFileProcessingJob,
  ImageOperation,
  // KENYA_FILE_CONSTANTS,
  StorageProvider,
} from "./types/file-v2.type";

// ==================== FILE SCHEMA ====================

/**
 * Main file schema
 */
const FileSchema = new Schema<IFile & Document>(
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

    // File metadata
    metadata: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      duration: { type: Number, min: 0 }, // for video/audio
      pages: { type: Number, min: 0 }, // for documents
      exif: { type: Schema.Types.Mixed }, // EXIF data for images
      checksum: {
        type: String,
        required: true,
        maxlength: 128,
        index: true,
      },
      encoding: { type: String, maxlength: 50 },
      colorSpace: { type: String, maxlength: 20 },
      compression: { type: String, maxlength: 20 },
      orientation: { type: Number, min: 1, max: 8 },
    },

    // Access control
    accessLevel: {
      type: String,
      enum: Object.values(FileAccessLevel),
      required: true,
      default: FileAccessLevel.PRIVATE,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    organizationId: {
      type: String,
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
      index: true,
    },
    archivedAt: {
      type: Date,
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },

    // Audit trail
    uploadedBy: {
      type: String,
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
FileSchema.index({ ownerId: 1, category: 1, createdAt: -1 });
FileSchema.index({ type: 1, status: 1, createdAt: -1 });
FileSchema.index({ relatedEntityId: 1, relatedEntityType: 1 });
FileSchema.index({ provider: 1, bucket: 1, key: 1 });
FileSchema.index({ status: 1, expiresAt: 1 });
FileSchema.index({ "kenyaMetadata.county": 1, type: 1 });
FileSchema.index({ tags: 1, status: 1 });

// Geospatial index for GPS coordinates
FileSchema.index({ "kenyaMetadata.gpsCoordinates": "2dsphere" });

// Text search index
FileSchema.index(
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
FileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// TTL index for deleted files cleanup (30 days retention)
FileSchema.index(
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
FileSchema.methods.addVariant = function (name: string, variant: any) {
  this.variants.set(name, variant);
  return this.save();
};

/**
 * Mark file as ready
 */
FileSchema.methods.markAsReady = function () {
  this.status = FileStatus.READY;
  this.processingProgress = 100;
  this.processingError = undefined;
  return this.save();
};

/**
 * Mark file as failed
 */
FileSchema.methods.markAsFailed = function (error: string) {
  this.status = FileStatus.FAILED;
  this.processingError = error;
  return this.save();
};

/**
 * Update processing progress
 */
FileSchema.methods.updateProgress = function (progress: number) {
  this.processingProgress = Math.max(0, Math.min(100, progress));
  if (progress >= 100) {
    this.status = FileStatus.READY;
  }
  return this.save();
};

/**
 * Track file access
 */
FileSchema.methods.trackAccess = function (type: "view" | "download") {
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
FileSchema.methods.softDelete = function () {
  this.status = FileStatus.DELETED;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Check if file is image
 */
FileSchema.methods.isImage = function (): boolean {
  return this.type === FileType.IMAGE;
};

/**
 * Check if file is document
 */
FileSchema.methods.isDocument = function (): boolean {
  return this.type === FileType.DOCUMENT;
};

/**
 * Get human readable file size
 */
FileSchema.methods.getHumanSize = function (): string {
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
FileSchema.methods.hasGpsData = function (): boolean {
  return !!(
    this.kenyaMetadata?.gpsCoordinates?.latitude &&
    this.kenyaMetadata?.gpsCoordinates?.longitude
  );
};

// ==================== FILE PROCESSING JOB SCHEMA ====================

/**
 * File processing job schema
 */
const FileProcessingJobSchema = new Schema<IFileProcessingJob & Document>(
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
      index: true,
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
FileProcessingJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
FileProcessingJobSchema.index({ fileId: 1, operation: 1 });
FileProcessingJobSchema.index({ status: 1, startedAt: 1 });

// TTL index for completed/failed jobs (7 days retention)
FileProcessingJobSchema.index(
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
FileProcessingJobSchema.methods.start = function () {
  this.status = "processing";
  this.startedAt = new Date();
  return this.save();
};

/**
 * Complete processing job
 */
FileProcessingJobSchema.methods.complete = function (outputFileId?: string) {
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
FileProcessingJobSchema.methods.fail = function (error: string) {
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
FileProcessingJobSchema.methods.retry = function () {
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
const FileAnalyticsSchema = new Schema<IFileAnalytics & Document>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
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
    uniqueUsers: {
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
FileAnalyticsSchema.index({ date: -1 });
FileAnalyticsSchema.index({ date: 1 }, { unique: true });

// ==================== ANALYTICS METHODS ====================

/**
 * Update file type distribution
 */
FileAnalyticsSchema.methods.updateTypeDistribution = function (
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
FileAnalyticsSchema.methods.updateCategoryDistribution = function (
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
FileAnalyticsSchema.methods.calculateAverageFileSize = function () {
  if (this.totalFiles > 0) {
    this.kenyaMetrics.averageFileSize = this.totalStorage / this.totalFiles;
  }
  return this.save();
};

// ==================== VIRTUAL FIELDS ====================

/**
 * File virtual fields
 */
FileSchema.virtual("publicUrl").get(function () {
  return this.accessLevel === FileAccessLevel.PUBLIC ? this.url : null;
});

FileSchema.virtual("isExpired").get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});

FileSchema.virtual("isDeleted").get(function () {
  return this.status === FileStatus.DELETED || !!this.deletedAt;
});

FileSchema.virtual("processingDuration").get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return null;
});

// ==================== PRE-SAVE MIDDLEWARE ====================

/**
 * Generate filename and detect file type before saving
 */
FileSchema.pre("save", function () {
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
FileProcessingJobSchema.pre("save", function () {
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

// ==================== EXPORT MODELS ====================

export const File = model<IFile & Document>("File", FileSchema);
export const FileProcessingJob = model<IFileProcessingJob & Document>(
  "FileProcessingJob",
  FileProcessingJobSchema
);
export const FileAnalytics = model<IFileAnalytics & Document>(
  "FileAnalytics",
  FileAnalyticsSchema
);

// Export schemas for testing and extending
export { FileSchema, FileProcessingJobSchema, FileAnalyticsSchema };

// Default export
export default {
  File,
  FileProcessingJob,
  FileAnalytics,
};
