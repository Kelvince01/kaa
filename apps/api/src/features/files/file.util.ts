import path from "node:path";
import { FILE_CONSTANTS } from "@kaa/constants";
import {
  FileType,
  type IFileUploadOptions,
  type IFileValidationResult,
} from "@kaa/models/types";
import { checkMimeType, scanForMalware } from "@kaa/utils";

/**
 * Validate file upload
 */
export async function validateFile(
  buffer: Buffer,
  fileName: string,
  options: IFileUploadOptions
): Promise<IFileValidationResult> {
  const errors: string[] = [];

  // Check file size
  const maxFileSizes =
    FILE_CONSTANTS.MAX_FILE_SIZES[
      options.type as keyof typeof FILE_CONSTANTS.MAX_FILE_SIZES
    ];
  if (buffer.length > maxFileSizes) {
    errors.push(
      `File size exceeds maximum allowed (${maxFileSizes / 1024 / 1024}MB)`
    );
  }

  if (buffer.length < FILE_CONSTANTS.MIN_FILE_SIZE) {
    errors.push(
      `File size below minimum required (${FILE_CONSTANTS.MIN_FILE_SIZE} bytes)`
    );
  }

  // Check file extension
  const extension = path.extname(fileName).toLowerCase();
  const supportedTypes = Object.values(FILE_CONSTANTS.FILE_EXTENSIONS).flat();
  if (!supportedTypes.includes(extension)) {
    errors.push(`File extension '${extension}' not allowed`);
  }

  // Check MIME type
  const mimeType = checkMimeType(fileName);
  if (
    mimeType &&
    !FILE_CONSTANTS.SUPPORTED_TYPES[
      options.type as keyof typeof FILE_CONSTANTS.SUPPORTED_TYPES
    ].includes(mimeType)
  ) {
    errors.push(`MIME type '${mimeType}' not allowed`);
  }

  // Scan for malware (placeholder - would integrate with actual scanner)
  const malwareCheck = await scanForMalware(buffer);
  if (!malwareCheck.clean) {
    errors.push("File failed security scan");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: malwareCheck.warnings || [],
  };
}

/**
 * Detect file type from MIME type
 */
export const detectFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith("image/")) return FileType.IMAGE;
  if (mimeType.startsWith("video/")) return FileType.VIDEO;
  if (mimeType.startsWith("audio/")) return FileType.AUDIO;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  ) {
    return FileType.DOCUMENT;
  }
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("tar")
  ) {
    return FileType.ARCHIVE;
  }
  return FileType.OTHER;
};
