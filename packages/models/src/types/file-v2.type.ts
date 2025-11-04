/**
 * Files Service Types
 *
 * Comprehensive types for file management with AWS S3 integration
 * Includes image processing, document handling, and Kenya-specific optimizations
 */

import type mongoose from "mongoose";

// ==================== ENUMS ====================

/**
 * File types
 */
export enum FileType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  ARCHIVE = "archive",
  CODE = "code",
  OTHER = "other",
}

/**
 * File categories for organization
 */
export enum FileCategory {
  VIRTUAL_TOUR = "virtual_tour",
  LEGAL_DOCUMENT = "legal_document",
  PROPERTY_PHOTOS = "property_photos",
  PROPERTY_DOCUMENTS = "property_documents",
  USER_AVATAR = "user_avatar",
  USER_DOCUMENTS = "user_documents",
  VERIFICATION_DOCS = "verification_docs",
  CONTRACT_DOCS = "contract_docs",
  PAYMENT_RECEIPTS = "payment_receipts",
  INSPECTION_REPORTS = "inspection_reports",
  MARKETING_MATERIALS = "marketing_materials",
  SYSTEM_ASSETS = "system_assets",
  TEMP_UPLOADS = "temp_uploads",

  // Additional categories
  AVATAR = "avatar",
  LOGO = "logo",
  IMAGE = "image",
  DOCUMENT = "document",
  CONTRACT = "contract",
  REPORT = "report",
  OTHER = "other",
}

/**
 * File status
 */
export enum FileStatus {
  UPLOADING = "uploading",
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
  DELETED = "deleted",
  QUARANTINED = "quarantined",
}

/**
 * Image processing operations
 */
export enum ImageOperation {
  RESIZE = "resize",
  CROP = "crop",
  ROTATE = "rotate",
  WATERMARK = "watermark",
  COMPRESS = "compress",
  FORMAT_CONVERT = "format_convert",
  CONVERT = "convert",
  OPTIMIZE = "optimize",
  THUMBNAIL = "thumbnail",
}

/**
 * Storage providers
 */
export enum StorageProvider {
  AWS_S3 = "aws_s3",
  CLOUDINARY = "cloudinary",
  GOOGLE_STORAGE = "google_storage",
  VERCEL_BLOB = "vercel_blob",
  LOCAL = "local",
}

/**
 * Access control levels
 */
export enum FileAccessLevel {
  PUBLIC = "public",
  PRIVATE = "private",
  PROTECTED = "protected",
  INTERNAL = "internal",
  ORGANIZATION = "organization",
}

/**
 * File validation error types
 */
export enum FileValidationError {
  INVALID_TYPE = "invalid_type",
  SIZE_EXCEEDED = "size_exceeded",
  INVALID_FORMAT = "invalid_format",
  CORRUPTED_FILE = "corrupted_file",
  MALWARE_DETECTED = "malware_detected",
  DUPLICATE_FILE = "duplicate_file",
}

// ==================== CORE INTERFACES ====================

/**
 * Base file interface
 */
export type IFile = {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  type: FileType;
  category: FileCategory;
  size: number; // in bytes
  description?: string;

  // Storage information
  provider: StorageProvider;
  bucket?: string;
  key: string;
  url: string;
  cdnUrl?: string;
  path?: string;
  thumbnailUrl?: string;
  previewUrl?: string;

  // File metadata
  metadata: IFileMetadata;
  sharing?: IFileSharingSettings;
  versions?: IFileVersion[];
  scanResult?: IFileScanResult;

  // Access control
  accessLevel: FileAccessLevel;
  ownerId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;

  // Processing status
  status: FileStatus;
  processingProgress?: number; // 0-100
  processingError?: string;

  // Relationships
  relatedEntityId?: string; // Property, User, Application, etc.
  relatedEntityType?: string;
  parentFileId?: string; // For processed variants

  // Kenya-specific metadata
  kenyaMetadata?: {
    county?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    capturedAt?: Date;
    deviceInfo?: {
      model?: string;
      os?: string;
      app?: string;
    };
  };

  // File variants (thumbnails, compressed versions, etc.)
  variants: {
    [key: string]: {
      url: string;
      size: number;
      width?: number;
      height?: number;
      format?: string;
    };
  };

  // Usage tracking
  downloadCount: number;
  viewCount: number;
  lastAccessedAt?: Date;

  // Lifecycle management
  expiresAt?: Date;
  archivedAt?: Date;
  deletedAt?: Date;

  startedAt?: Date;
  completedAt?: Date;

  // Audit trail
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  ipAddress?: string;
  userAgent?: string;

  tags?: string[];

  createdAt: Date;
  updatedAt: Date;

  markAsReady: () => void;
  trackAccess: (view: string) => void;
  softDelete: () => void;
  hasGpsData?: () => void;
};

// File sharing settings
export type IFileSharingSettings = {
  isPublic: boolean;
  allowDownload: boolean;
  allowPreview: boolean;
  expiresAt?: Date;
  passwordProtected: boolean;
  password?: string;
  maxDownloads?: number;
  downloadCount: number;
  shareLink?: string;
  shareToken?: string;
};

// File metadata
export type IFileMetadata = {
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for video/audio files
  pages?: number; // for PDF files
  resolution?: string;
  colorSpace?: string;
  compression?: string;
  exif?: any;
  checksum?: string;
  encoding?: string;
  orientation?: number;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  camera?: {
    make: string;
    model: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
    focalLength?: string;
  };
};

// File version
export type IFileVersion = {
  id: string;
  version: number;
  size: number;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByName: string;
  uploadedAt: Date;
  changes?: string;
  isActive: boolean;
};

/**
 * File upload options (used by service)
 */
export type IFileUploadOptions = {
  // File information
  originalName?: string;
  description?: string;

  // Categorization
  type?: FileType;
  category?: FileCategory;
  accessLevel?: FileAccessLevel;

  // Relationships
  ownerId: string;
  organizationId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;

  // Processing options
  processingOptions?: IFileProcessingOptions;
  parentFileId?: string;

  // Metadata
  metadata?: Record<string, any>;
  kenyaMetadata?: IFile["kenyaMetadata"];

  // Audit trail
  uploadedBy?: string;
  ipAddress?: string;
  userAgent?: string;

  // Lifecycle
  expiresAt?: Date;
  tags?: string[];
};

/**
 * File upload request
 */
export type IFileUploadRequest = {
  // File data
  buffer?: Buffer;
  filePath?: string; // for local files
  url?: string; // for URL downloads

  // File information
  originalName: string;
  mimeType: string;
  size?: number;

  // Categorization
  category: FileCategory;
  accessLevel?: FileAccessLevel;

  // Relationships
  ownerId: string;
  organizationId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;

  // Processing options
  processImages?: boolean;
  generateThumbnails?: boolean;
  watermark?: boolean;

  // Metadata
  metadata?: Record<string, any>;
  kenyaMetadata?: IFile["kenyaMetadata"];

  // Lifecycle
  expiresAt?: Date;
  tags?: string[];
};

// File update input
export type IFileUpdateInput = {
  name?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  metadata?: Partial<IFileMetadata>;
  sharing?: Partial<IFileSharingSettings>;
};

/**
 * File processing options (used by service)
 */
export type IFileProcessingOptions = {
  operation: ImageOperation;
  parameters?: Record<string, any>;
  priority?: "low" | "normal" | "high";
};

/**
 * File processing job
 */
export type IFileProcessingJob = {
  id: string;
  fileId: string;
  operation: ImageOperation;
  parameters: Record<string, any>;
  priority: "low" | "normal" | "high";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  error?: string;
  outputFileId?: string;
  processingTime?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
};

/**
 * File validation result
 */
export type IFileValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
};

/**
 * Bulk file operation request
 */
export type IBulkFileRequest = {
  fileIds: string[];
  operation: "delete" | "move" | "copy" | "archive" | "changeAccess";
  parameters?: Record<string, any>;
};

/**
 * File search query
 */
export type IFileSearchQuery = {
  // Search text
  search?: string;

  // Basic filters
  type?: FileType | FileType[];
  category?: FileCategory | FileCategory[];
  status?: FileStatus | FileStatus[];
  accessLevel?: FileAccessLevel[];

  // Owner and organization filters
  ownerId?: string;
  organizationId?: string;
  uploadedBy?: string;

  // Metadata filters
  sizeMin?: number;
  sizeMax?: number;
  mimeType?: string[];

  // Date filters
  dateFrom?: Date;
  dateTo?: Date;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  accessedAfter?: Date;
  accessedBefore?: Date;

  // Search terms
  filename?: string;
  tags?: string[];

  // Kenya-specific filters
  county?: string;
  hasGps?: boolean;
  hasGpsData?: boolean;

  // Pagination and sorting
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "size" | "downloadCount" | "fileName";
  sortOrder?: "asc" | "desc";
};

// Response types
export type IFileResponse = {
  status: "success" | "error";
  message?: string;
  file?: IFile;
};

export type IFileUploadResponse = {
  status: "success" | "error";
  message?: string;
  file?: IFile;
  uploadUrl?: string;
};

/**
 * Files response with pagination
 */
export type IFilesResponse = {
  files: IFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: Record<string, any>;
  summary?: {
    totalSize: number;
    totalFiles: number;
    byCategory: Array<{ category: string; count: number; size: number }>;
    byMimeType: Array<{ mimeType: string; count: number; size: number }>;
  };
};

/**
 * File search response
 */
export type IFileSearchResponse = {
  files: IFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  aggregations: {
    typeDistribution: Record<FileType, number>;
    categoryDistribution: Record<FileCategory, number>;
    sizeDistribution: {
      small: number; // < 1MB
      medium: number; // 1MB - 10MB
      large: number; // > 10MB
    };
    totalSize: number;
  };
};

// File search result
export type IFileSearchResult = {
  fileId: string;
  name: string;
  category: FileCategory;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  matchType: "name" | "description" | "content" | "tags";
  highlightedText?: string;
  relevanceScore: number;
};

/**
 * File storage information
 */
export type IFileStorageInfo = {
  // Common
  provider: StorageProvider;
  url: string;
  cdnUrl?: string;

  // Vercel Blob
  path?: string;
  size?: number;
  contentType?: string;
  fileName?: string;

  // AWS S3
  bucket?: string;
  key?: string;
  etag?: string;
};

/**
 * File usage statistics
 */
export type IFileUsageStats = {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  totalViews: number;
  averageSize: number;
  typeDistribution: string[];
  categoryDistribution: string[];
  byCategory: Array<{ category: string; count: number; size: number }>;
  byMimeType: Array<{ mimeType: string; count: number; size: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byUploader: Array<{
    userId: string;
    userName: string;
    count: number;
    size: number;
  }>;
  byDate: Array<{ date: string; count: number; size: number }>;
  avgFileSize: number;
  mostDownloaded: Array<{
    fileId: string;
    fileName: string;
    downloadCount: number;
  }>;
  recentUploads: Array<{ fileId: string; fileName: string; uploadedAt: Date }>;
};

// Image and media optimization options
export type IOptimizationOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp" | "avif";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  position?:
    | "center"
    | "top"
    | "right top"
    | "right"
    | "right bottom"
    | "bottom"
    | "left bottom"
    | "left"
    | "left top";
  background?: string;
  compress?: boolean;
  rotate?: number;
  flip?: boolean;
  flop?: boolean;
  blur?: number;
  sharpen?: number;
  grayscale?: boolean;
  progressive?: boolean;
  metadata?: boolean;
  withoutEnlargement?: boolean;
};

// File access log
export type IFileAccessLog = {
  fileId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: "VIEW" | "DOWNLOAD" | "SHARE" | "EDIT" | "DELETE";
  ipAddress: string;
  userAgent: string;
  accessedAt: Date;
  metadata?: Record<string, any>;
};

// File scan result
export type IFileScanResult = {
  clean: boolean;
  threats?: string[];
  scanDate: Date;
  scanner: string;
  scanDuration: number;
};

// Bulk file operation
export type IBulkFileOperation = {
  operation:
    | "DELETE"
    | "ARCHIVE"
    | "UPDATE_CATEGORY"
    | "UPDATE_ACCESS"
    | "MOVE";
  fileIds: string[];
  parameters?: Record<string, any>;
};

/**
 * File analytics
 */
export type IFileAnalytics = {
  id: string;
  date: Date;

  // Upload metrics
  totalUploads: number;
  totalUploadSize: number;
  uploadsByType: Map<FileType, number>;
  uploadsByCategory: Map<FileCategory, number>;
  failedUploads: number;

  // Storage metrics
  totalFiles: number;
  totalStorage: number; // in bytes
  storageByType: Map<FileType, number>;
  storageByCategory: Map<FileCategory, number>;

  // Usage metrics
  totalDownloads: number;
  totalViews: number;
  totalShares: number;
  uniqueUsers: number;

  uniqueViewers: number;
  viewsByDate: Array<{ date: string; count: number }>;
  downloadsByDate: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  avgViewDuration: number;

  // Processing metrics
  processingJobs: number;
  processingTime: number; // average in seconds
  processingErrors: number;

  // Kenya-specific metrics
  kenyaMetrics: {
    uploadsWithGps: number;
    uploadsByCounty: Map<string, number>;
    mobileUploads: number;
    averageFileSize: number;
  };

  createdAt: Date;

  calculateAverageFileSize?: () => void;
};

// ==================== IMAGE PROCESSING ====================

/**
 * Image processing options
 */
export type IImageProcessingOptions = {
  // Resize options
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
    position?: string;
  };

  // Crop options
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Format conversion
  format?: "jpeg" | "png" | "webp" | "avif";
  quality?: number; // 1-100

  // Compression
  compress?: boolean;

  // Watermark
  watermark?: {
    image?: string; // URL or file path
    text?: string;
    opacity?: number;
    position?: "northwest" | "northeast" | "southwest" | "southeast" | "center";
  };

  // Rotation
  rotate?: number; // degrees

  // Auto-orientation (fix EXIF rotation)
  autoOrient?: boolean;

  // Strip metadata
  stripMetadata?: boolean;
};

/**
 * Thumbnail configuration
 */
export type IThumbnailConfig = {
  name: string;
  width: number;
  height: number;
  fit?: "cover" | "contain";
  quality?: number;
  format?: "jpeg" | "png" | "webp";
};

// ==================== STORAGE INTERFACES ====================

/**
 * Storage provider configuration
 */
export type IStorageConfig = {
  provider: StorageProvider;

  // AWS S3 configuration
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    endpoint?: string;
    forcePathStyle?: boolean;
    cdnDomain?: string;
  };

  // Cloudinary configuration
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder?: string;
  };

  // Local storage configuration
  local?: {
    uploadPath: string;
    publicPath: string;
    baseUrl: string;
  };
};

/**
 * Pre-signed URL request
 */
export type IPresignedUrlRequest = {
  fileName: string;
  contentType: string;
  size?: number;
  category: FileCategory;
  accessLevel?: FileAccessLevel;
  expiresIn?: number; // seconds
};

/**
 * Pre-signed URL response
 */
export type IPresignedUrlResponse = {
  uploadUrl: string;
  fileId: string;
  expiresAt: Date;
  maxSize: number;
  allowedTypes: string[];
};

// ==================== VALIDATION & SECURITY ====================

/**
 * File validation rules
 */
export type IFileValidationRules = {
  // Size limits (in bytes)
  maxSize: number;
  minSize?: number;

  // Type restrictions
  allowedTypes: string[]; // MIME types
  blockedTypes?: string[];

  // Format-specific rules
  imageRules?: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    allowedFormats?: string[];
  };

  documentRules?: {
    maxPages?: number;
    allowPasswordProtected?: boolean;
    scanForMalware?: boolean;
  };

  videoRules?: {
    maxDuration?: number; // seconds
    maxBitrate?: number;
    allowedCodecs?: string[];
  };

  // Security rules
  scanForMalware: boolean;
  checkDuplicates: boolean;
  requireAuthentication: boolean;
};

// ==================== CONTENT DELIVERY ====================

/**
 * CDN configuration
 */
export type ICDNConfig = {
  enabled: boolean;
  provider: "cloudfront" | "cloudflare" | "custom";
  domain: string;

  // Cache settings
  cacheSettings: {
    images: number; // seconds
    documents: number;
    videos: number;
    default: number;
  };

  // Optimization
  autoOptimize: boolean;
  webpConversion: boolean;
  gzipCompression: boolean;
};

/**
 * File serving options
 */
export type IFileServingOptions = {
  // Download behavior
  inline?: boolean; // serve inline vs attachment
  fileName?: string; // custom filename for download

  // Image transformations (for on-the-fly processing)
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "jpeg" | "png" | "webp";

  // Security
  expiresIn?: number; // seconds for signed URLs
  referrerPolicy?: string;

  // Kenya-specific optimizations
  mobileOptimized?: boolean;
  lowBandwidth?: boolean;
};

// ==================== CONSTANTS ====================

/**
 * Kenya file management constants
 */
export const FILE_CONSTANTS = {
  // File size limits (in bytes)
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB default
  MIN_FILE_SIZE: 1, // 1 byte minimum

  MAX_FILE_SIZES: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 50 * 1024 * 1024, // 50MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 25 * 1024 * 1024, // 25MB
    OTHER: 25 * 1024 * 1024, // 25MB
  },

  // Allowed file extensions
  ALLOWED_EXTENSIONS: [
    // Images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    // Documents
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".odt",
    // Spreadsheets
    ".xls",
    ".xlsx",
    ".csv",
    ".ods",
    // Archives
    ".zip",
    ".rar",
    ".tar",
    ".gz",
    ".7z",
    // Videos
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    // Audio
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".flac",
  ],

  // Allowed MIME types
  ALLOWED_MIME_TYPES: [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/rtf",
    // Spreadsheets
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-tar",
    "application/gzip",
    "application/x-7z-compressed",
    // Videos
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime",
    "video/x-ms-wmv",
    "video/webm",
    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/flac",
  ],

  // Thumbnail configurations
  THUMBNAIL_CONFIGS: {
    SMALL: { name: "small", width: 150, height: 150, fit: "cover" as const },
    MEDIUM: { name: "medium", width: 400, height: 300, fit: "cover" as const },
    LARGE: { name: "large", width: 800, height: 600, fit: "contain" as const },
    PROPERTY_THUMB: {
      name: "property_thumb",
      width: 300,
      height: 200,
      fit: "cover" as const,
    },
    USER_AVATAR: {
      name: "avatar",
      width: 200,
      height: 200,
      fit: "cover" as const,
    },
  },

  // Supported file types
  SUPPORTED_TYPES: {
    IMAGES: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"],
    DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
    VIDEOS: [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ],
    AUDIO: ["audio/mpeg", "audio/wav", "audio/aac", "audio/ogg"],
    ARCHIVES: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/gzip",
    ],
  },

  // Kenya mobile optimization
  MOBILE_OPTIMIZATION: {
    MAX_IMAGE_WIDTH: 1200,
    MAX_IMAGE_HEIGHT: 1200,
    COMPRESSION_QUALITY: 80,
    PROGRESSIVE_JPEG: true,
    WEBP_CONVERSION: true,
  },

  // Storage paths
  STORAGE_PATHS: {
    PROPERTY_PHOTOS: "properties/photos",
    PROPERTY_DOCUMENTS: "properties/documents",
    USER_AVATARS: "users/avatars",
    USER_DOCUMENTS: "users/documents",
    VERIFICATION_DOCS: "verification",
    CONTRACTS: "contracts",
    RECEIPTS: "receipts",
    TEMP: "temp",
  },

  // CDN settings
  CDN_CACHE_DURATION: {
    IMAGES: 86_400, // 24 hours
    DOCUMENTS: 3600, // 1 hour
    VIDEOS: 86_400, // 24 hours
    AVATARS: 604_800, // 7 days
  },

  // Security settings
  VIRUS_SCAN_ENABLED: true,
  DUPLICATE_CHECK_ENABLED: true,
  WATERMARK_ENABLED: true,

  // Kenya-specific features
  GPS_EXTRACTION_ENABLED: true,
  COUNTY_AUTO_DETECTION: true,
  SWAHILI_FILENAME_SUPPORT: true,

  // Performance settings
  CONCURRENT_UPLOADS: 3,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large files
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 60_000, // 60 seconds
};

// ==================== ERROR TYPES ====================

/**
 * File service error codes
 */
export const FILE_ERROR_CODES = {
  UPLOAD_FAILED: "UPLOAD_FAILED",
  PROCESSING_FAILED: "PROCESSING_FAILED",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  ACCESS_DENIED: "ACCESS_DENIED",
  STORAGE_ERROR: "STORAGE_ERROR",
  VIRUS_DETECTED: "VIRUS_DETECTED",
  DUPLICATE_FILE: "DUPLICATE_FILE",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  NETWORK_ERROR: "NETWORK_ERROR",
  METADATA_EXTRACTION_FAILED: "METADATA_EXTRACTION_FAILED",
} as const;

// ==================== UTILITY INTERFACES ====================

/**
 * File system statistics
 */
export type IFileSystemStats = {
  totalFiles: number;
  totalSize: number;
  avgFileSize: number;
  filesByType: Record<FileType, number>;
  filesByCategory: Record<FileCategory, number>;
  storageByProvider: Record<StorageProvider, number>;
  oldestFile: Date;
  newestFile: Date;
};

/**
 * Upload progress tracking
 */
export type IUploadProgress = {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  uploadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
};

/**
 * File cleanup policy
 */
export type IFileCleanupPolicy = {
  // Temporary files cleanup
  tempFileMaxAge: number; // days

  // Deleted files cleanup
  deletedFileRetention: number; // days

  // Unused files cleanup
  unusedFileMaxAge: number; // days

  // Archive old files
  archiveAfterDays: number;

  // Size-based cleanup
  maxTotalStorage: number; // bytes
  cleanupWhenExceeded: boolean;
};

// ==================== DOCUMENT INTERFACES ====================

// export interface IFileDocument extends IFile, Document {}
// export interface IFileProcessingJobDocument extends IFileProcessingJob, Document {}
// export interface IFileAnalyticsDocument extends IFileAnalytics, Document {}

// Export all types - removed circular export
