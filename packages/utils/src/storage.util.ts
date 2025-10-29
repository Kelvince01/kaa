import config from "@kaa/config/api";
import { del, getDownloadUrl, list, put } from "@vercel/blob";
import { AppError } from "./error.util";

type FileUploadOptions = {
  fileName?: string;
  userId?: string;
  public?: boolean;
  optimization?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  };
};

type FileInfo = {
  url: string;
  path: string;
  size: number;
  contentType: string;
  fileName: string;
  cdnUrl?: string;
};

type PresignedUploadData = {
  uploadUrl: string;
  fileUrl: string;
  fields: Record<string, string>;
};

// Upload a file to Vercel Blob
export const uploadFile = async (
  file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
  },
  options: FileUploadOptions = {}
): Promise<FileInfo> => {
  try {
    if (!file) {
      throw new AppError("No file provided", 400);
    }

    const fileName = options.fileName as string;
    const contentType = file.mimetype;

    // Generate a unique path including user ID if available
    const path = options.userId ? `${options.userId}/${fileName}` : fileName;

    // Upload to Vercel Blob
    const blob = await put(path, file.buffer, {
      contentType,
      access: options.public ? "public" : "public", // private,
      addRandomSuffix: true,
    });

    // Generate CDN URL if available
    const cdnUrl = generateCdnUrl(blob.url, options.optimization);

    return {
      url: blob.url,
      path: blob.pathname,
      size: file.size,
      contentType,
      fileName,
      cdnUrl,
    };
  } catch (error) {
    console.error("File upload error:", error);
    throw new AppError("File upload failed", 500);
  }
};

// List files for a specific user
export const listUserFiles = async (
  userId?: string,
  _options: FileUploadOptions = {}
): Promise<any[]> => {
  try {
    const prefix = userId ? `${userId}/` : "";
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error) {
    console.error("List files error:", error);
    throw new AppError("Failed to list files", 500);
  }
};

// Delete a file
export const deleteFile = async (
  path: string
): Promise<{ success: boolean }> => {
  try {
    await del(path);
    return { success: true };
  } catch (error) {
    console.error("Delete file error:", error);
    throw new AppError("Failed to delete file", 500);
  }
};

// Download/retrieve a file from Vercel Blob storage
export const downloadFile = async (url: string): Promise<Buffer | null> => {
  try {
    // Fetch the file from the blob URL
    const downloadUrl = getDownloadUrl(url);
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new AppError(
        `Failed to download file: ${response.statusText}`,
        response.status
      );
    }

    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  } catch (error) {
    console.error("Download file error:", (error as Error).message);
    throw new AppError("Failed to download file from cloud storage", 500);
  }
};

// Generate CDN URL with optimization parameters
export const generateCdnUrl = (
  originalUrl: string,
  optimization?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }
): string => {
  const cdnBaseUrl = config.cdnUrl;

  if (!cdnBaseUrl) {
    return originalUrl;
  }

  // If it's already a CDN URL, return as is
  if (originalUrl.includes(cdnBaseUrl)) {
    return originalUrl;
  }

  // Build optimization parameters
  const params = new URLSearchParams();
  if (optimization?.width) params.set("w", optimization.width.toString());
  if (optimization?.height) params.set("h", optimization.height.toString());
  if (optimization?.quality) params.set("q", optimization.quality.toString());
  if (optimization?.format) params.set("f", optimization.format);

  // Extract path from original URL
  const urlPath = new URL(originalUrl).pathname;
  const queryString = params.toString();

  return queryString
    ? `${cdnBaseUrl}${urlPath}?${queryString}`
    : `${cdnBaseUrl}${urlPath}`;
};

// Generate presigned URL for direct CDN upload
export const generatePresignedUploadUrl = (
  userId: string,
  fileName: string,
  contentType: string,
  _options: { public?: boolean } = {}
): Promise<PresignedUploadData> => {
  try {
    const path = `${userId}/${fileName}`;

    // For Vercel Blob, we'll use a different approach
    // Generate a temporary upload token/URL
    const uploadUrl = `${config.app.url}/api/v1/files/upload-direct`;
    const fileUrl = `${config.cdnUrl || config.app.url}/api/v1/files/${path}`;

    return Promise.resolve({
      uploadUrl,
      fileUrl,
      fields: {
        "Content-Type": contentType,
        "x-user-id": userId,
        "x-file-name": fileName,
      },
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    throw new AppError("Failed to generate upload URL", 500);
  }
};

// Get optimized asset URL
export const getOptimizedAssetUrl = (
  path: string,
  optimization?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    fit?: string;
  }
): string => {
  const cdnBaseUrl = config.cdnUrl;

  if (!cdnBaseUrl) {
    return `${config.app.url}/api/v1/assets/${path}`;
  }

  const params = new URLSearchParams();
  if (optimization?.width) params.set("w", optimization.width.toString());
  if (optimization?.height) params.set("h", optimization.height.toString());
  if (optimization?.quality) params.set("q", optimization.quality.toString());
  if (optimization?.format) params.set("f", optimization.format);
  if (optimization?.fit) params.set("fit", optimization.fit);

  const queryString = params.toString();
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  return queryString
    ? `${cdnBaseUrl}/api/v1/assets/${cleanPath}?${queryString}`
    : `${cdnBaseUrl}/api/v1/assets/${cleanPath}`;
};
