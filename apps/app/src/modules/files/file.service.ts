import { httpClient } from "@/lib/axios";
import { useAuthStore } from "../auth/auth.store";
import type {
  BulkFileOperation,
  FileFilter,
  FileListResponse,
  FileSearchResult,
  FileStats,
  FileType,
  FileUpdateInput,
  FileUploadInput,
  GetFilesParams,
  OptimizationOptions,
} from "./file.type";

const FILES_API = "/files";

/**
 * Get a list of attachments with pagination and filters
 *
 * @param param.orgIdOrSlug - The organization ID or slug.
 * @param param.q - Optional search query to filter results.
 * @param param.sort - Field to sort by (defaults to 'id').
 * @param param.order - Sort order `'asc' | 'desc'` (defaults to 'asc').
 * @param param.page - Page number.
 * @param param.limit - Maximum number of attachments to fetch per page.
 * @param param.offset - Optional offset.
 * @param signal - Optional abort signal for cancelling the request.
 * @returns A paginated list of attachments.
 */
export const getFiles = async (
  params: GetFilesParams,
  signal?: AbortSignal
) => {
  const response = await httpClient.api.get("/files", { params, signal });
  return response.data;
};

/**
 * Get a specific file by its ID
 *
 * @param id - The file ID.
 * @param orgIdOrSlug - The organization ID or slug.
 * @returns The file info
 */
export const getFile = async ({
  id,
  orgIdOrSlug,
}: {
  id: string;
  orgIdOrSlug: string;
}) => {
  const response = await httpClient.api.get(`/files/${id}`, {
    params: { orgIdOrSlug },
  });
  return response.data;
};

export const getFileByShareToken = async (shareToken: string) => {
  const response = await httpClient.api.get(`/files/share/${shareToken}`);
  return response.data;
};

export const getFileByShareLink = async (shareLink: string) => {
  const response = await httpClient.api.get(`/files/share/${shareLink}`);
  return response.data;
};

/**
 * Create a new attachment
 *
 * @param attachments - An array of attachment data to create, where each attachment has:
 *   - `url`: URL of the attachment.
 *   - `filename`: Name of file.
 *   - `contentType`: MIME type of the attachment.
 *   - `size`: Size of file.
 *   - `organizationId`: Organization id to associate the attachment with.
 *   - `id`: An optional ID for the attachment (if not provided, a new ID will be generated).
 *
 * @param orgIdOrSlug - Organization ID or slug, to check permissions attachment
 * @returns The created attachment data.
 */
export const createFile = async (file: FileType) => {
  const response = await httpClient.api.post("/files", file);
  return response.data;
};

export const createFiles = async ({
  files,
  orgIdOrSlug,
}: {
  files: FileType[];
  orgIdOrSlug: string;
}) => {
  const response = await httpClient.api.post("/files", files, {
    params: { orgIdOrSlug },
  });
  return response.data;
};

/**
 * Update an attachment
 *
 * @param param.id - File ID.
 * @param param.orgIdOrSlug - Organization ID or slug.
 * @param param.file - The updated file data.
 * @returns A boolean indicating success of the update
 */
export const updateFile = async ({
  orgIdOrSlug,
  id,
  ...file
}: {
  id: string;
  file: Partial<FileType>;
  orgIdOrSlug: string;
}) => {
  const response = await httpClient.api.put(`/files/${id}`, file, {
    params: { orgIdOrSlug },
  });
  return response.data;
};

/**
 * Delete multiple attachments
 *
 * @param param.id - Attachment ID.
 * @param param.orgIdOrSlug - Organization ID or slug.
 * @returns A boolean indicating whether the deletion was successful.
 */
export const deleteFiles = async ({
  ids,
  orgIdOrSlug,
}: {
  ids: string[];
  orgIdOrSlug: string;
}) => {
  const response = await httpClient.api.delete("/files", {
    params: { ids, orgIdOrSlug },
  });
  return response.data;
};

// Get all files for the current user
export const getUserFiles = async (): Promise<{
  status: string;
  results: number;
  files: FileType[];
}> => {
  const { data } = await httpClient.api.get(FILES_API);
  return data;
};

// Upload a new file
export const uploadFile_ = async (
  data: FileUploadInput
): Promise<{ status: string; file: FileType }> => {
  const formData = new FormData();
  formData.append("file", data.file);
  if (data.description) {
    formData.append("description", data.description);
  }

  const { data: response } = await httpClient.api.post(FILES_API, formData, {
    headers: {
      // "Content-Type": "multipart/form-data",
    },
  });
  return response;
};

export const uploadFile = async (
  data: FileUploadInput
): Promise<{ status: string; file: FileType }> => {
  console.log("data", data);

  const formData = new FormData();
  formData.append("file", data.file);
  if (data.description) {
    formData.append("description", data.description);
  }

  const res = await fetch("http://localhost:5000/api/v1/files", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${useAuthStore.getState().getAccessToken()}`,
    },
  });

  return res.json();
};

// Get a file by ID
export const getFileById = async (
  id: string
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}`);
  return data;
};

// Update a file's metadata
export const updateFile_v2 = async (
  id: string,
  updateData: FileUpdateInput
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.patch(`${FILES_API}/${id}`, updateData);
  return data;
};

/**
 * Delete a file
 *
 * @param param.id - Attachment ID.
 * @param param.orgIdOrSlug - Organization ID or slug.
 * @returns A boolean indicating whether the deletion was successful.
 */ export const deleteFile = async (
  id: string
): Promise<{ status: string }> => {
  const { data } = await httpClient.api.delete(`${FILES_API}/${id}`);
  return data;
};

// Get a presigned URL for direct CDN upload
export const getPresignedUploadUrl = async (
  uploadData: FileUploadInput
): Promise<{ status: string; uploadData: any }> => {
  const { data } = await httpClient.api.post(
    `${FILES_API}/upload-url`,
    uploadData
  );
  return data;
};

// Get an optimized asset URL
export const getOptimizedAssetUrl = async (
  path: string,
  options: OptimizationOptions
): Promise<{ status: string; url: string }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/optimize/${path}`, {
    params: options,
  });
  return data;
};

// Direct upload to CDN
export const uploadDirectToCDN = async (
  file: FileType,
  userId: string,
  fileName: string
): Promise<{ status: string; file: FileType }> => {
  const formData = new FormData();
  formData.append("file", file as unknown as Blob);

  const { data } = await httpClient.api.post(
    `${FILES_API}/upload-direct`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "x-user-id": userId,
        "x-file-name": fileName,
      },
    }
  );
  return data;
};

// Get files with filters and pagination
export const getFilesWithFilters = async (
  filters: FileFilter
): Promise<FileListResponse> => {
  const { data } = await httpClient.api.get(FILES_API, { params: filters });
  return data;
};

// Search files
export const searchFiles = async (
  query: string,
  options?: { limit?: number; offset?: number }
): Promise<{ status: string; results: FileSearchResult[]; total: number }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/search`, {
    params: { q: query, ...options },
  });
  return data;
};

// Get file statistics
export const getFileStats = async (): Promise<{
  status: string;
  stats: FileStats;
}> => {
  const { data } = await httpClient.api.get(`${FILES_API}/stats`);
  return data;
};

// Bulk file operations
export const bulkFileOperation = async (
  operation: BulkFileOperation
): Promise<{ status: string; message: string; results?: any }> => {
  const { data } = await httpClient.api.post(`${FILES_API}/bulk`, operation);
  return data;
};

// Share file
export const shareFile = async (
  id: string,
  settings: { isPublic: boolean; allowDownload?: boolean; expiresAt?: string }
): Promise<{ status: string; shareUrl?: string }> => {
  const { data } = await httpClient.api.post(
    `${FILES_API}/${id}/share`,
    settings
  );
  return data;
};

// Get shared file info
export const getSharedFileInfo = async (
  shareToken: string
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.get(
    `${FILES_API}/shared/${shareToken}`
  );
  return data;
};

// Download file
export const downloadFile = async (
  id: string
): Promise<{ status: string; downloadUrl: string }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}/download`);
  return data;
};

// Get file preview URL
export const getFilePreviewUrl = async (
  id: string,
  options?: { width?: number; height?: number; quality?: number }
): Promise<{ status: string; previewUrl: string }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}/preview`, {
    params: options,
  });
  return data;
};

// Copy file
export const copyFile = async (
  id: string,
  name?: string
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.post(`${FILES_API}/${id}/copy`, {
    name,
  });
  return data;
};

// Move file
export const moveFile = async (
  id: string,
  targetFolder: string
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.post(`${FILES_API}/${id}/move`, {
    targetFolder,
  });
  return data;
};

// Get file versions
export const getFileVersions = async (
  id: string
): Promise<{ status: string; versions: any[] }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}/versions`);
  return data;
};

// Restore file version
export const restoreFileVersion = async (
  id: string,
  versionId: string
): Promise<{ status: string; file: FileType }> => {
  const { data } = await httpClient.api.post(
    `${FILES_API}/${id}/versions/${versionId}/restore`
  );
  return data;
};

// Get file access logs
export const getFileAccessLogs = async (
  id: string,
  options?: { limit?: number; offset?: number }
): Promise<{ status: string; logs: any[] }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}/access-logs`, {
    params: options,
  });
  return data;
};

// Generate file thumbnail
export const generateThumbnail = async (
  id: string,
  options?: { width?: number; height?: number }
): Promise<{ status: string; thumbnailUrl: string }> => {
  const { data } = await httpClient.api.post(
    `${FILES_API}/${id}/thumbnail`,
    options
  );
  return data;
};

// Extract file metadata
export const extractMetadata = async (
  id: string
): Promise<{ status: string; metadata: any }> => {
  const { data } = await httpClient.api.post(
    `${FILES_API}/${id}/extract-metadata`
  );
  return data;
};

// Scan file for malware
export const scanFile = async (
  id: string
): Promise<{
  status: string;
  scanResult: { clean: boolean; threats?: string[] };
}> => {
  const { data } = await httpClient.api.post(`${FILES_API}/${id}/scan`);
  return data;
};

// Get file usage analytics
export const getFileAnalytics = async (
  id: string,
  timeRange?: "7d" | "30d" | "90d"
): Promise<{ status: string; analytics: any }> => {
  const { data } = await httpClient.api.get(`${FILES_API}/${id}/analytics`, {
    params: { timeRange },
  });
  return data;
};
