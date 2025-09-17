import crypto from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import mime from "mime-types";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger.util";

export const isMetaDataImg = async (values: ArrayBuffer) => {
  // Read file content as array buffer
  const buffer = new Uint8Array(values);

  // Check if the file is an image based on its binary content
  const type = await fileTypeFromBuffer(buffer);
  if (!type?.mime.startsWith("image/")) {
    return false;
  }

  return true;
};

// Check MIME type
export const checkMimeType = (fileName: string) => {
  const mimeType = mime.lookup(fileName);
  return mimeType;
};

/**
 * Generate processed filename
 */
export function generateProcessedFileName(
  originalFileName: string,
  suffix: string,
  params: any
): string {
  const extension = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extension);
  const paramString = Object.values(params).join("x");

  return `${baseName}_${suffix}_${paramString}${extension}`;
}

/**
 * Basic malware scanning placeholder
 */
export function scanForMalware(buffer: Buffer): {
  clean: boolean;
  warnings: string[];
} {
  // Placeholder for actual malware scanning
  // Would integrate with services like ClamAV, VirusTotal, etc.

  // Basic checks
  const warnings: string[] = [];

  // Check for suspicious file signatures
  const header = buffer.slice(0, 10).toString("hex");
  const suspiciousSignatures = ["4d5a"]; // PE executable

  if (suspiciousSignatures.some((sig) => header.startsWith(sig))) {
    warnings.push("File contains executable code");
  }

  return {
    clean: warnings.length === 0,
    warnings,
  };
}

/**
 * Extract file metadata
 */
export async function extractMetadata(
  buffer: Buffer,
  fileName: string
): Promise<any> {
  const mimeType = mime.lookup(fileName);
  const metadata: any = {};

  try {
    if ((mimeType as string)?.startsWith("image/")) {
      // Extract image metadata using sharp
      const imageInfo = await sharp(buffer).metadata();
      metadata.width = imageInfo.width;
      metadata.height = imageInfo.height;
      metadata.format = imageInfo.format;
      metadata.colorSpace = imageInfo.space;
      metadata.hasAlpha = imageInfo.hasAlpha;
      metadata.orientation = imageInfo.orientation;
      metadata.exif = imageInfo.exif;
    }
  } catch (error) {
    logger.error("Metadata extraction error:", error);
  }

  return metadata;
}

/**
 * Generate secure checksum
 */
export function generateChecksum(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Generate unique filename
 */
export function generateFileName(
  originalName: string,
  organizationId?: string
): string {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const timestamp = Date.now();
  const uuid = uuidv4();

  const prefix = organizationId ? `${organizationId}_` : "";
  return `${prefix}${timestamp}_${uuid}${extension}`;
}

// ==================== IMAGE PROCESSING OPERATIONS ====================

/**
 * Resize image
 */
export async function resizeImage(
  buffer: Buffer,
  params: any
): Promise<Buffer> {
  const { width, height, fit = "cover", withoutEnlargement = true } = params;

  return await sharp(buffer)
    .resize(width, height, {
      fit: fit as any,
      withoutEnlargement,
    })
    .toBuffer();
}

/**
 * Create thumbnail
 */
export async function createThumbnail(
  buffer: Buffer,
  params: any
): Promise<Buffer> {
  const { size = 150, quality = 80 } = params;

  return await sharp(buffer)
    .resize(size, size, { fit: "cover" })
    .jpeg({ quality })
    .toBuffer();
}

/**
 * Convert image format
 */
export async function convertImage(
  buffer: Buffer,
  params: any
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { format = "jpeg", quality = 90 } = params;

  let processor = sharp(buffer);
  let mimeType: string;

  switch (format.toLowerCase()) {
    case "jpeg":
    case "jpg":
      processor = processor.jpeg({ quality });
      mimeType = "image/jpeg";
      break;
    case "png":
      processor = processor.png({ quality });
      mimeType = "image/png";
      break;
    case "webp":
      processor = processor.webp({ quality });
      mimeType = "image/webp";
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const convertedBuffer = await processor.toBuffer();
  return { buffer: convertedBuffer, mimeType };
}

/**
 * Optimize image for web
 */
export async function optimizeImage(
  buffer: Buffer,
  params: any
): Promise<Buffer> {
  const { quality = 85, progressive = true } = params;

  return await sharp(buffer)
    .jpeg({
      quality,
      progressive,
      mozjpeg: true,
    })
    .toBuffer();
}

/**
 * Add watermark to image
 */
export async function addWatermark(
  buffer: Buffer,
  params: any
): Promise<Buffer> {
  const { text, position = "bottom-right", opacity = 0.5 } = params;

  // For now, just return original - watermarking needs more complex setup
  // This would require creating text overlays or composite images
  return await buffer;
}
