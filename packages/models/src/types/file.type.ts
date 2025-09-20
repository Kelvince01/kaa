import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { ImageOperation } from "./file.enum";

export interface IFile extends BaseDocument {
  url: string;
  cdnUrl?: string;
  path: string;
  name: string;
  mimeType: string;
  description?: string;
  tags?: string[];
  size: number;
  isPublic: boolean;
  user: mongoose.Types.ObjectId;
  metadata?: IFileMetadata;
  sharing?: IFileSharingSettings;
  versions?: IFileVersion[];
  uploadedBy?: string;
  downloadCount?: number;
  lastAccessedAt?: Date;
  thumbnailUrl?: string;
  previewUrl?: string;
  scanResult?: IFileScanResult;
}

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

// File upload input (for API requests)
export type IFileUploadInput = {
  file: any; // File blob/buffer
  description?: string;
  tags?: string[];
  isPublic?: boolean;
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

// File filter options
export type IFileFilter = {
  search?: string;
  mimeType?: string;
  uploadedBy?: string;
  sizeFrom?: number;
  sizeTo?: number;
  uploadedFrom?: Date;
  uploadedTo?: Date;
  tags?: string[];
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// File list response
export type IFileListResponse = {
  files: Omit<IFile, "_id"> & { _id: string }[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  summary?: {
    totalSize: number;
    totalFiles: number;
    byCategory: Array<{ category: string; count: number; size: number }>;
    byMimeType: Array<{ mimeType: string; count: number; size: number }>;
  };
  status: "success" | "error";
  message?: string;
};

// File category type
export type IFileCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "code"
  | "other";

// File statistics
export type IFileStats = {
  total: number;
  totalSize: number;
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

// File search result
export type IFileSearchResult = {
  fileId: string;
  name: string;
  category: IFileCategory;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  matchType: "name" | "description" | "content" | "tags";
  highlightedText?: string;
  relevanceScore: number;
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

// File analytics
export type IFileAnalytics = {
  fileId: string;
  views: number;
  downloads: number;
  shares: number;
  uniqueViewers: number;
  viewsByDate: Array<{ date: string; count: number }>;
  downloadsByDate: Array<{ date: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  avgViewDuration: number;
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

export type IFileUploadOptions = {
  type: IFileCategory;
  processingOptions?: IFileProcessingOptions;
};

export type IFileValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
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
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  retryCount?: number;
  maxRetries?: number;
};

export type IFileProcessingOptions = {
  operation: ImageOperation;
  parameters?: Record<string, any>;
  priority?: "low" | "normal" | "high";
};
