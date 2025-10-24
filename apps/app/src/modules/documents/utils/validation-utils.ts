import { DocumentCategory, type DocumentUploadInput } from "../document.type";

/**
 * File type validation rules by category
 */
export const ALLOWED_FILE_TYPES = {
  [DocumentCategory.IDENTITY]: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  [DocumentCategory.ADDRESS]: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ],
  [DocumentCategory.INCOME]: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  [DocumentCategory.REFERENCES]: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  [DocumentCategory.GENERAL]: [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
  ],
  [DocumentCategory.OTHER]: [
    "image/*",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
  ],
} as const;

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  [DocumentCategory.IDENTITY]: 10 * 1024 * 1024, // 10MB
  [DocumentCategory.ADDRESS]: 10 * 1024 * 1024, // 10MB
  [DocumentCategory.INCOME]: 15 * 1024 * 1024, // 15MB
  [DocumentCategory.REFERENCES]: 10 * 1024 * 1024, // 10MB
  [DocumentCategory.GENERAL]: 20 * 1024 * 1024, // 20MB
  [DocumentCategory.OTHER]: 20 * 1024 * 1024, // 20MB
} as const;

/**
 * Required fields by category
 */
export const REQUIRED_FIELDS = {
  [DocumentCategory.IDENTITY]: ["name", "expiryDate"],
  [DocumentCategory.ADDRESS]: ["name"],
  [DocumentCategory.INCOME]: ["name"],
  [DocumentCategory.REFERENCES]: ["name", "description"],
  [DocumentCategory.GENERAL]: ["name"],
  [DocumentCategory.OTHER]: ["name"],
} as const;

/**
 * Validation error types
 */
export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

/**
 * Validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
};

/**
 * Validate file type for category
 */
export function validateFileType(
  file: File,
  category: DocumentCategory
): ValidationError[] {
  const errors: ValidationError[] = [];
  const allowedTypes = ALLOWED_FILE_TYPES[category];

  const isValidType = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.slice(0, -2));
    }
    return file.type === type;
  });

  if (!isValidType) {
    errors.push({
      field: "file",
      message: `File type ${file.type} is not allowed for ${category} documents. Allowed types: ${allowedTypes.join(", ")}`,
      code: "INVALID_FILE_TYPE",
    });
  }

  return errors;
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  category: DocumentCategory
): ValidationError[] {
  const errors: ValidationError[] = [];
  const maxSize = FILE_SIZE_LIMITS[category];

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));

    errors.push({
      field: "file",
      message: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB for ${category} documents`,
      code: "FILE_TOO_LARGE",
    });
  }

  return errors;
}

/**
 * Validate file name
 */
export function validateFileName(fileName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty name
  if (!fileName.trim()) {
    errors.push({
      field: "name",
      message: "Document name is required",
      code: "NAME_REQUIRED",
    });
    return errors;
  }

  // Check length
  if (fileName.length < 3) {
    errors.push({
      field: "name",
      message: "Document name must be at least 3 characters long",
      code: "NAME_TOO_SHORT",
    });
  }

  if (fileName.length > 255) {
    errors.push({
      field: "name",
      message: "Document name must be less than 255 characters",
      code: "NAME_TOO_LONG",
    });
  }

  // Check for invalid characters
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  // biome-ignore lint/suspicious/noControlCharactersInRegex: ignore
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    errors.push({
      field: "name",
      message: "Document name contains invalid characters",
      code: "NAME_INVALID_CHARS",
    });
  }

  return errors;
}

/**
 * Validate expiry date
 */
export function validateExpiryDate(
  expiryDate: string | undefined,
  category: DocumentCategory
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if expiry date is required for this category
  const requiredFields = REQUIRED_FIELDS[category];
  // @ts-expect-error
  const isExpiryRequired = requiredFields.includes("expiryDate");

  if (isExpiryRequired && !expiryDate) {
    errors.push({
      field: "expiryDate",
      message: `Expiry date is required for ${category} documents`,
      code: "EXPIRY_DATE_REQUIRED",
    });
    return errors;
  }

  if (expiryDate) {
    const expiryDateObj = new Date(expiryDate);
    const now = new Date();

    // Check if valid date
    if (Number.isNaN(expiryDateObj.getTime())) {
      errors.push({
        field: "expiryDate",
        message: "Invalid expiry date format",
        code: "EXPIRY_DATE_INVALID",
      });
      return errors;
    }

    // Check if date is in the past
    if (expiryDateObj < now) {
      errors.push({
        field: "expiryDate",
        message: "Expiry date cannot be in the past",
        code: "EXPIRY_DATE_PAST",
      });
    }

    // Check if date is too far in the future (10 years)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);

    if (expiryDateObj > maxFutureDate) {
      errors.push({
        field: "expiryDate",
        message: "Expiry date cannot be more than 10 years in the future",
        code: "EXPIRY_DATE_TOO_FAR",
      });
    }
  }

  return errors;
}

/**
 * Validate description
 */
export function validateDescription(
  description: string | undefined,
  category: DocumentCategory
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if description is required for this category
  const requiredFields = REQUIRED_FIELDS[category];
  // @ts-expect-error
  const isDescriptionRequired = requiredFields.includes("description");

  if (isDescriptionRequired && !description?.trim()) {
    errors.push({
      field: "description",
      message: `Description is required for ${category} documents`,
      code: "DESCRIPTION_REQUIRED",
    });
    return errors;
  }

  if (description && description.length > 1000) {
    // Check length
    errors.push({
      field: "description",
      message: "Description must be less than 1000 characters",
      code: "DESCRIPTION_TOO_LONG",
    });
  }

  return errors;
}

/**
 * Validate tags
 */
export function validateTags(tags: string[] | undefined): ValidationError[] {
  const errors: ValidationError[] = [];

  if (tags) {
    // Check maximum number of tags
    if (tags.length > 10) {
      errors.push({
        field: "tags",
        message: "Maximum 10 tags allowed",
        code: "TOO_MANY_TAGS",
      });
    }

    // Validate each tag
    tags.forEach((tag, index) => {
      if (!tag.trim()) {
        errors.push({
          field: `tags[${index}]`,
          message: "Tag cannot be empty",
          code: "TAG_EMPTY",
        });
      }

      if (tag.length > 50) {
        errors.push({
          field: `tags[${index}]`,
          message: "Tag must be less than 50 characters",
          code: "TAG_TOO_LONG",
        });
      }

      // Check for invalid characters
      // biome-ignore lint/suspicious/noControlCharactersInRegex: ignore
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (invalidChars.test(tag)) {
        errors.push({
          field: `tags[${index}]`,
          message: "Tag contains invalid characters",
          code: "TAG_INVALID_CHARS",
        });
      }
    });

    // Check for duplicate tags
    const uniqueTags = new Set(tags.map((tag) => tag.toLowerCase().trim()));
    if (uniqueTags.size !== tags.length) {
      errors.push({
        field: "tags",
        message: "Duplicate tags are not allowed",
        code: "DUPLICATE_TAGS",
      });
    }
  }

  return errors;
}

/**
 * Validate document upload input
 */
export function validateDocumentUpload(
  input: DocumentUploadInput
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Validate file
  if (input.file) {
    // File type validation
    errors.push(...validateFileType(input.file, input.category));

    // File size validation
    errors.push(...validateFileSize(input.file, input.category));
  } else {
    errors.push({
      field: "file",
      message: "File is required",
      code: "FILE_REQUIRED",
    });
  }

  // Validate name
  if (input.name) {
    errors.push(...validateFileName(input.name));
  } else if (input.file) {
    // Use file name if no custom name provided
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const fileName = input.file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    errors.push(...validateFileName(fileName));

    if (errors.length === 0) {
      warnings.push(
        "Using file name as document name. Consider providing a descriptive name."
      );
    }
  }

  // Validate expiry date
  errors.push(...validateExpiryDate(input.expiryDate, input.category));

  // Validate description
  errors.push(...validateDescription(input.description, input.category));

  // Validate tags
  errors.push(...validateTags(input.tags));

  // Category-specific validations
  switch (input.category) {
    case DocumentCategory.IDENTITY:
      if (!input.expiryDate) {
        warnings.push(
          "Identity documents typically have expiry dates. Consider adding one."
        );
      }
      break;
    case DocumentCategory.ADDRESS:
      if (!input.description) {
        warnings.push(
          "Adding a description helps identify the type of address document (utility bill, bank statement, etc.)."
        );
      }
      break;
    case DocumentCategory.INCOME:
      if (!input.description) {
        warnings.push(
          "Consider adding a description to specify the type of income document (payslip, tax return, etc.)."
        );
      }
      break;
    case DocumentCategory.REFERENCES:
      if (!input.description) {
        warnings.push(
          "Reference documents should include details about the referee and relationship."
        );
      }
      break;
    default:
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get file type recommendations for category
 */
export function getFileTypeRecommendations(category: DocumentCategory): {
  recommended: string[];
  description: string;
} {
  switch (category) {
    case DocumentCategory.IDENTITY:
      return {
        recommended: ["application/pdf", "image/jpeg", "image/png"],
        description:
          "ID cards, passports, driver's licenses work best as high-quality images or PDFs",
      };
    case DocumentCategory.ADDRESS:
      return {
        recommended: ["application/pdf", "image/jpeg", "image/png"],
        description:
          "Utility bills, bank statements, or official letters with your address",
      };
    case DocumentCategory.INCOME:
      return {
        recommended: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        description:
          "Payslips, tax returns, employment letters, or bank statements showing income",
      };
    case DocumentCategory.REFERENCES:
      return {
        recommended: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        description:
          "Reference letters, character references, or employment references",
      };
    default:
      return {
        recommended: ["application/pdf", "image/jpeg", "image/png"],
        description:
          "Most document types are supported. PDF format is recommended for text documents",
      };
  }
}

/**
 * Check if file might be corrupted
 */
export function validateFileIntegrity(file: File): Promise<ValidationError[]> {
  return new Promise((resolve) => {
    const errors: ValidationError[] = [];

    // Check if file size is suspiciously small
    if (file.size < 100) {
      errors.push({
        field: "file",
        message: "File appears to be too small or might be corrupted",
        code: "FILE_POSSIBLY_CORRUPT",
      });
    }

    // For images, try to load to check integrity
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(errors);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        errors.push({
          field: "file",
          message: "Image file appears to be corrupted",
          code: "IMAGE_CORRUPT",
        });
        resolve(errors);
      };

      img.src = url;

      // Timeout after 5 seconds
      setTimeout(() => {
        URL.revokeObjectURL(url);
        errors.push({
          field: "file",
          message: "File validation timeout - file might be corrupted",
          code: "VALIDATION_TIMEOUT",
        });
        resolve(errors);
      }, 5000);
    } else {
      // For non-image files, basic validation
      resolve(errors);
    }
  });
}

/**
 * Validate multiple files for batch upload
 */
export function validateBatchUpload(
  files: File[],
  category: DocumentCategory,
  maxFiles = 10
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check file count
  if (files.length === 0) {
    errors.push({
      field: "files",
      message: "At least one file is required",
      code: "NO_FILES",
    });
    return { isValid: false, errors, warnings };
  }

  if (files.length > maxFiles) {
    errors.push({
      field: "files",
      message: `Maximum ${maxFiles} files allowed in batch upload`,
      code: "TOO_MANY_FILES",
    });
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = FILE_SIZE_LIMITS[category] * files.length;

  if (totalSize > maxTotalSize) {
    const totalSizeMB = Math.round(totalSize / (1024 * 1024));
    const maxTotalSizeMB = Math.round(maxTotalSize / (1024 * 1024));

    errors.push({
      field: "files",
      message: `Total file size ${totalSizeMB}MB exceeds maximum allowed ${maxTotalSizeMB}MB`,
      code: "TOTAL_SIZE_TOO_LARGE",
    });
  }

  // Validate each file
  files.forEach((file, index) => {
    const fileErrors = [
      ...validateFileType(file, category),
      ...validateFileSize(file, category),
    ];

    for (const error of fileErrors) {
      errors.push({
        ...error,
        field: `files[${index}].${error.field}`,
        message: `File "${file.name}": ${error.message}`,
      });
    }
  });

  // Check for duplicate files
  const fileNames = files.map((file) => file.name);
  const uniqueNames = new Set(fileNames);
  if (uniqueNames.size !== fileNames.length) {
    warnings.push(
      "Some files have duplicate names. Consider renaming them for better organization."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
