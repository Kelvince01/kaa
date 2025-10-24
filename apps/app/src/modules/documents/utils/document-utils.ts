import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
// import {
// 	FileText,
// 	Image,
// 	FileVideo,
// 	FileAudio,
// 	FileIcon,
// 	File,
// } from "lucide-react";
import {
  DocumentCategory,
  type DocumentFilter,
  DocumentStatus,
  type IDocument,
} from "../document.type";

/**
 * Format document file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get document type icon
 */
export function getDocumentIcon(
  mimeType: string,
  category?: DocumentCategory
): string {
  // Category-based icons
  if (category) {
    switch (category) {
      case DocumentCategory.IDENTITY:
        return "👤";
      case DocumentCategory.ADDRESS:
        return "🏠";
      case DocumentCategory.INCOME:
        return "💰";
      case DocumentCategory.REFERENCES:
        return "📝";
      default:
        break;
    }
  }

  // MIME type-based icons
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word")) return "📝";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "📊";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "📽️";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";

  return "📄";
}

/**
 * Get status color class
 */
export function getStatusColor(status: DocumentStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case DocumentStatus.VERIFIED:
      return {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-200",
      };
    case DocumentStatus.PENDING:
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-200",
      };
    case DocumentStatus.PROCESSING:
      return {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200",
      };
    case DocumentStatus.REJECTED:
      return {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200",
      };
    case DocumentStatus.EXPIRED:
      return {
        bg: "bg-gray-50",
        text: "text-gray-800",
        border: "border-gray-200",
      };
    case DocumentStatus.ERROR:
      return {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-800",
        border: "border-gray-200",
      };
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: DocumentCategory): string {
  switch (category) {
    case DocumentCategory.GENERAL:
      return "General";
    case DocumentCategory.IDENTITY:
      return "Identity";
    case DocumentCategory.ADDRESS:
      return "Address";
    case DocumentCategory.INCOME:
      return "Income";
    case DocumentCategory.REFERENCES:
      return "References";
    case DocumentCategory.OTHER:
      return "Other";
    default:
      return "Unknown";
  }
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.PENDING:
      return "Pending";
    case DocumentStatus.PROCESSING:
      return "Processing";
    case DocumentStatus.VERIFIED:
      return "Verified";
    case DocumentStatus.REJECTED:
      return "Rejected";
    case DocumentStatus.EXPIRED:
      return "Expired";
    case DocumentStatus.ERROR:
      return "Error";
    default:
      return "Unknown";
  }
}

/**
 * Format relative date
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format absolute date
 */
export function formatDate(
  date: string | Date,
  formatString = "MMM dd, yyyy"
): string {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, formatString);
  } catch {
    return "Invalid date";
  }
}

/**
 * Check if document is expired
 */
export function isDocumentExpired(document: IDocument): boolean {
  if (!document.expiryDate) return false;
  return isBefore(new Date(document.expiryDate), new Date());
}

/**
 * Check if document is expiring soon (within 30 days)
 */
export function isDocumentExpiringSoon(
  document: IDocument,
  days = 30
): boolean {
  if (!document.expiryDate) return false;
  const expiryDate = new Date(document.expiryDate);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return isBefore(expiryDate, futureDate) && isAfter(expiryDate, new Date());
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(document: IDocument): number | null {
  if (!document.expiryDate) return null;
  const expiryDate = new Date(document.expiryDate);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Filter documents based on criteria
 */
export function filterDocuments(
  documents: IDocument[],
  filter: DocumentFilter
): IDocument[] {
  return documents.filter((doc) => {
    // Category filter
    if (filter.category?.length && !filter.category.includes(doc.category)) {
      return false;
    }

    // Status filter
    if (filter.status?.length && !filter.status.includes(doc.status)) {
      return false;
    }

    // Search filter
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      const searchableText = [
        doc.name,
        doc.type,
        getCategoryDisplayName(doc.category),
        getStatusDisplayName(doc.status),
        ...(doc.metadata?.tags || []),
        doc.metadata?.description || "",
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Date range filters
    if (
      filter.uploadedFrom &&
      isBefore(new Date(doc.uploadedAt), new Date(filter.uploadedFrom))
    ) {
      return false;
    }

    if (
      filter.uploadedTo &&
      isAfter(new Date(doc.uploadedAt), new Date(filter.uploadedTo))
    ) {
      return false;
    }

    if (doc.expiryDate) {
      if (
        filter.expiryFrom &&
        isBefore(new Date(doc.expiryDate), new Date(filter.expiryFrom))
      ) {
        return false;
      }

      if (
        filter.expiryTo &&
        isAfter(new Date(doc.expiryDate), new Date(filter.expiryTo))
      ) {
        return false;
      }
    }

    // Tags filter
    if (filter.tags?.length) {
      const docTags = doc.metadata?.tags || [];
      const hasMatchingTag = filter.tags.some((tag) => docTags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort documents
 */
export function sortDocuments(
  documents: IDocument[],
  sortBy = "uploadedAt",
  sortOrder: "asc" | "desc" = "desc"
): IDocument[] {
  const sorted = [...documents].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "category":
        aVal = getCategoryDisplayName(a.category);
        bVal = getCategoryDisplayName(b.category);
        break;
      case "status":
        aVal = getStatusDisplayName(a.status);
        bVal = getStatusDisplayName(b.status);
        break;
      case "size":
        aVal = a.size;
        bVal = b.size;
        break;
      case "uploadedAt":
        aVal = new Date(a.uploadedAt);
        bVal = new Date(b.uploadedAt);
        break;
      case "expiryDate":
        aVal = a.expiryDate ? new Date(a.expiryDate) : new Date(0);
        bVal = b.expiryDate ? new Date(b.expiryDate) : new Date(0);
        break;
      case "verifiedAt":
        aVal = a.verifiedAt ? new Date(a.verifiedAt) : new Date(0);
        bVal = b.verifiedAt ? new Date(b.verifiedAt) : new Date(0);
        break;
      default:
        aVal = a.uploadedAt;
        bVal = b.uploadedAt;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Group documents by category
 */
export function groupDocumentsByCategory(
  documents: IDocument[]
): Record<DocumentCategory, IDocument[]> {
  const groups = Object.values(DocumentCategory).reduce(
    (acc, category) => {
      acc[category] = [];
      return acc;
    },
    {} as Record<DocumentCategory, IDocument[]>
  );

  for (const doc of documents) {
    groups[doc.category].push(doc);
  }

  return groups;
}

/**
 * Group documents by status
 */
export function groupDocumentsByStatus(
  documents: IDocument[]
): Record<DocumentStatus, IDocument[]> {
  const groups = Object.values(DocumentStatus).reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<DocumentStatus, IDocument[]>
  );

  for (const doc of documents) {
    groups[doc.status].push(doc);
  }

  return groups;
}

/**
 * Get document statistics
 */
export function getDocumentStats(documents: IDocument[]) {
  const total = documents.length;
  const verified = documents.filter(
    (doc) => doc.status === DocumentStatus.VERIFIED
  ).length;
  const pending = documents.filter(
    (doc) => doc.status === DocumentStatus.PENDING
  ).length;
  const rejected = documents.filter(
    (doc) => doc.status === DocumentStatus.REJECTED
  ).length;
  const expired = documents.filter((doc) => isDocumentExpired(doc)).length;
  const expiringSoon = documents.filter((doc) =>
    isDocumentExpiringSoon(doc)
  ).length;

  const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);

  const categoryStats = Object.values(DocumentCategory).map((category) => ({
    category,
    count: documents.filter((doc) => doc.category === category).length,
    verified: documents.filter(
      (doc) =>
        doc.category === category && doc.status === DocumentStatus.VERIFIED
    ).length,
  }));

  return {
    total,
    verified,
    pending,
    rejected,
    expired,
    expiringSoon,
    totalSize,
    verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    categoryStats,
  };
}

/**
 * Generate filename for download
 */
export function generateDownloadFilename(document: IDocument): string {
  const category = getCategoryDisplayName(document.category).toLowerCase();
  const timestamp = format(new Date(document.uploadedAt), "yyyy-MM-dd");
  const extension = document.mimeType === "application/pdf" ? "pdf" : "file";

  return `${category}-${timestamp}-${document._id}.${extension}`;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.slice(0, -2));
    }
    return file.type === type;
  });
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/zip": "zip",
    "text/plain": "txt",
    "text/csv": "csv",
  };

  return mimeToExt[mimeType] || "file";
}

/**
 * Check if document can be previewed
 */
export function canPreviewDocument(document: IDocument): boolean {
  const previewableTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
  ];

  return previewableTypes.includes(document.mimeType);
}

/**
 * Get document preview URL
 */
export function getDocumentPreviewUrl(document: IDocument): string | null {
  if (!canPreviewDocument(document)) return null;
  return document.preview || document.file;
}

/**
 * Extract document metadata for display
 */
export function getDocumentDisplayMetadata(document: IDocument) {
  const metadata = document.metadata || {};

  return {
    tags: metadata.tags || [],
    description: metadata.description || "",
    verificationResult: metadata.verificationResult,
    extractedData: metadata.extractedData,
    fraudDetection: metadata.fraudDetection,
    processingHistory: metadata.processingHistory || [],
  };
}
