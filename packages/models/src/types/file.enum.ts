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
  OTHER = "other",
}

export type ImageFormat =
  | "jpeg"
  | "jpg"
  | "png"
  | "webp"
  | "gif"
  | "svg"
  | "bmp"
  | "tiff";

export type VideoFormat =
  | "mp4"
  | "webm"
  | "avi"
  | "mov"
  | "wmv"
  | "flv"
  | "mkv";

export type DocumentFormat =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "ppt"
  | "pptx"
  | "txt"
  | "rtf";

export type ArchiveFormat = "zip" | "rar" | "7z" | "tar" | "gz";

/**
 * File categories for organization
 */
export enum FileCategory {
  PROPERTY_PHOTOS = "property_photos",
  PROPERTY_DOCUMENTS = "property_documents",
  PROPERTY_VIDEOS = "property_videos",
  PROPERTY_FLOORS = "property_floor_plans",
  PROPERTY_VIRTUAL_TOURS = "property_virtual_tours",
  PROPERTY_3D_MODELS = "property_3d_models",
  PROPERTY_PLANS = "property_plans",
  PROPERTY_ELEVATIONS = "property_elevations",
  PROPERTY_MATERIALS = "property_materials",
  PROPERTY_ACCESSORIES = "property_accessories",
  PROPERTY_FINISHES = "property_finishes",
  USER_AVATAR = "user_avatar",
  USER_DOCUMENTS = "user_documents",
  VERIFICATION_DOCS = "verification_docs",
  CONTRACT_DOCS = "contract_docs",
  PAYMENT_RECEIPTS = "payment_receipts",
  INSPECTION_REPORTS = "inspection_reports",
  MARKETING_MATERIALS = "marketing_materials",
  SYSTEM_ASSETS = "system_assets",
  TEMP_UPLOADS = "temp_uploads",
  OTHER_DOCS = "other_docs",
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

// File upload status
export type UploadStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Image processing operations
 */
export enum ImageOperation {
  RESIZE = "resize",
  CROP = "crop",
  ROTATE = "rotate",
  FLIP = "flip",
  WATERMARK = "watermark",
  COMPRESS = "compress",
  FORMAT_CONVERT = "format_convert",
  THUMBNAIL = "thumbnail",
  FILTER = "filter",
  ENHANCE = "enhance",
}

/**
 * Storage providers
 */
export enum StorageProvider {
  VERCEL_BLOB = "vercel_blob",
  AWS_S3 = "aws_s3",
  CLOUDINARY = "cloudinary",
  GOOGLE_CLOUD = "google_cloud",
  AZURE_BLOB = "azure_blob",
  DIGITALOCEAN_SPACES = "digitalocean_spaces",
  LOCAL = "local",
}

/**
 * Access control levels
 */
export enum FileAccessLevel {
  PUBLIC = "public",
  PRIVATE = "private",
  PROTECTED = "protected",
  RESTRICTED = "restricted",
  ADMIN_ONLY = "admin_only",
}

// File validation status
export type ValidationStatus =
  | "pending"
  | "valid"
  | "invalid"
  | "rejected"
  | "quarantined";

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
