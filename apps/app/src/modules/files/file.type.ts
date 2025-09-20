export type GetFilesParams = {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  order?: string;
  offset?: number;
  groupId?: string;
  orgIdOrSlug?: string;
};

export type FileType = {
  _id: string;
  url: string;
  cdnUrl?: string;
  path: string;
  name: string;
  mimeType: string;
  description?: string;
  tags?: string[];
  size: number;
  isPublic: boolean;
  user: string; // ObjectId as string
  createdAt: string;
  updatedAt: string;
};

// File sharing settings
export type FileSharingSettings = {
  isPublic: boolean;
  allowDownload: boolean;
  allowPreview: boolean;
  expiresAt?: string;
  passwordProtected: boolean;
  maxDownloads?: number;
  downloadCount: number;
  shareLink?: string;
};

// File metadata
export type FileMetadata = {
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
  creationDate?: string;
  modificationDate?: string;
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
export type FileVersion = {
  id: string;
  version: number;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  changes?: string;
  isActive: boolean;
};

// File upload input (matches API structure)
export type FileUploadInput = {
  file: File;
  description?: string;
};

// File update input
export type FileUpdateInput = {
  name?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
};

// File filter options
export type FileFilter = {
  search?: string;
  mimeType?: string;
  category?: FileCategory;
  status?: FileStatus;
  uploadedBy?: string;
  sizeFrom?: number;
  sizeTo?: number;
  uploadedFrom?: string;
  uploadedTo?: string;
  tags?: string[];
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// File list response
export type FileListResponse = {
  items: FileType[];
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

// File response
export type FileResponse = {
  data: FileType;
  status: "success" | "error";
  message?: string;
};

// File upload response
export type FileUploadResponse = {
  data: FileType;
  uploadUrl?: string;
  status: "success" | "error";
  message?: string;
};

// File category type
export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "code"
  | "other";

// File status type
export type FileStatus =
  | "active"
  | "archived"
  | "deleted"
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "processing"
  | "completed"
  | "failed";

// File statistics
export type FileStats = {
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
  recentUploads: Array<{
    fileId: string;
    fileName: string;
    uploadedAt: string;
  }>;
};

// Bulk file operation
export type BulkFileOperation = {
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
export type FileSearchResult = {
  fileId: string;
  name: string;
  category: FileCategory;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  matchType: "name" | "description" | "content" | "tags";
  highlightedText?: string;
  relevanceScore: number;
};

// Image and media optimization options
export type OptimizationOptions = {
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
