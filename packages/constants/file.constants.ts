// ==================== CONSTANTS ====================

/**
 * File management constants
 */
export const FILE_CONSTANTS = {
  MIN_FILE_SIZE: 1024, // 1KB
  // MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB

  // File size limits (in bytes)
  MAX_FILE_SIZES: {
    IMAGE: 10 * 1024 * 1024, // 10MB
    DOCUMENT: 50 * 1024 * 1024, // 50MB
    VIDEO: 100 * 1024 * 1024, // 100MB
    AUDIO: 25 * 1024 * 1024, // 25MB
    CODE: 10 * 1024 * 1024, // 10MB
    ARCHIVE: 100 * 1024 * 1024, // 100MB
    OTHER: 25 * 1024 * 1024, // 25MB
  },

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
    CODE: [
      "text/plain",
      "application/javascript",
      "application/json",
      "application/xml",
      "application/x-python",
      "application/x-ruby",
      "application/x-php",
      "application/x-java",
      "application/x-c",
      "application/x-c++",
      "application/x-c#",
    ],
    ARCHIVES: [
      "application/zip",
      "application/x-rar-compressed",
      "application/x-tar",
      "application/gzip",
    ],
  },

  FILE_EXTENSIONS: {
    IMAGES: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"],
    DOCUMENTS: [".pdf", ".doc", ".docx", ".txt"],
    VIDEOS: [".mp4", ".mpeg", ".quicktime", ".x-msvideo", ".webm"],
    AUDIO: [".mp3", ".wav", ".aac", ".ogg"],
    ARCHIVES: [".zip", ".rar", ".tar", ".gzip"],
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
