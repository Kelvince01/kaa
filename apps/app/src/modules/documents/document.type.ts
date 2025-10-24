import type { User } from "@/modules/users/user.type";

/**
 * Document category enum matching API
 */
export enum DocumentCategory {
  GENERAL = "general",
  IDENTITY = "identity",
  ADDRESS = "address",
  INCOME = "income",
  REFERENCES = "references",
  OTHER = "other",
}

/**
 * Document status enum matching API
 */
export enum DocumentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  VERIFIED = "verified",
  REJECTED = "rejected",
  EXPIRED = "expired",
  ERROR = "error",
}

/**
 * Document priority levels
 */
export enum DocumentPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

/**
 * Main document interface
 */
export type IDocument = {
  _id: string;
  tenant: string | User;
  name: string;
  type: string;
  category: DocumentCategory;
  file: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  priority: DocumentPriority;
  expiryDate?: string;
  uploadedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
  preview?: string;
  metadata?: DocumentMetadata;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Document metadata interface
 */
export type DocumentMetadata = {
  verificationResult?: VerificationResult;
  extractedData?: ExtractedDocumentData;
  fraudDetection?: FraudDetectionResult;
  processingHistory?: ProcessingStep[];
  tags?: string[];
  description?: string;
  [key: string]: unknown;
};

/**
 * Verification result interface
 */
export type VerificationResult = {
  isValid: boolean;
  confidence: number;
  details: Record<string, string | number | boolean | null>;
  message: string;
  timestamp: string;
  verifiedBy?: string;
};

/**
 * Extracted document data interface
 */
export type ExtractedDocumentData = {
  fullName?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  documentNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  income?: {
    amount?: number;
    frequency?: string;
    employer?: string;
  };
  reference?: {
    name?: string;
    relationship?: string;
    contactInfo?: string;
    duration?: string;
  };
  [key: string]: string | number | boolean | object | undefined;
};

/**
 * Fraud detection result interface
 */
export type FraudDetectionResult = {
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  flags: string[];
  details: Record<string, unknown>;
  timestamp: string;
};

/**
 * Processing step interface
 */
export type ProcessingStep = {
  step: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  timestamp: string;
  duration?: number;
  details?: Record<string, unknown>;
  error?: string;
};

/**
 * Document validation options
 */
export type DocumentValidationOptions = {
  performOcr?: boolean;
  checkExpiry?: boolean;
  validateAddress?: boolean;
  validateIdentity?: boolean;
  validateIncome?: boolean;
  faceMatching?: boolean;
  signatureVerification?: boolean;
};

/**
 * Document upload input
 */
export type DocumentUploadInput = {
  file: File;
  category: DocumentCategory;
  name?: string;
  expiryDate?: string;
  description?: string;
  tags?: string[];
  priority?: DocumentPriority;
  autoVerify?: boolean;
};

/**
 * Document update input
 */
export type DocumentUpdateInput = {
  name?: string;
  category?: DocumentCategory;
  expiryDate?: string;
  metadata?: Partial<DocumentMetadata>;
  tags?: string[];
};

/**
 * Document filter options
 */
export type DocumentFilter = {
  category?: DocumentCategory[];
  status?: DocumentStatus[];
  search?: string;
  uploadedFrom?: string;
  uploadedTo?: string;
  expiryFrom?: string;
  expiryTo?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/**
 * Document list response
 */
export type DocumentListResponse = {
  status: "success" | "error";
  data?: IDocument[];
  pagination?: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary?: {
    totalDocuments: number;
    byCategory: Array<{ category: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    pendingVerification: number;
    expiringThisMonth: number;
  };
  message?: string;
  error?: string;
};

/**
 * Document response
 */
export type DocumentResponse = {
  status: "success" | "error";
  data?: IDocument;
  message?: string;
  error?: string;
};

/**
 * Document upload response
 */
export type DocumentUploadResponse = {
  status: "success" | "error";
  data?: IDocument;
  verificationJobId?: string;
  message?: string;
  error?: string;
};

/**
 * Verification status response
 */
export type VerificationStatusResponse = {
  status: "success" | "error";
  verification_status?: {
    [key in DocumentCategory]: {
      status: "pending" | "verified" | "rejected";
      documentsCount: number;
      lastUpdated?: string;
    };
  };
  progress?: {
    overall: number;
    categories: {
      [key in DocumentCategory]: number;
    };
  };
  message?: string;
  error?: string;
};

/**
 * Bulk operation input
 */
export type BulkDocumentOperation = {
  operation:
    | "delete"
    | "archive"
    | "update-category"
    | "update-status"
    | "add-tags";
  documentIds: string[];
  parameters?: {
    category?: DocumentCategory;
    status?: DocumentStatus;
    tags?: string[];
    metadata?: Partial<DocumentMetadata>;
  };
};

/**
 * Document analytics interface
 */
export type DocumentAnalytics = {
  totalDocuments: number;
  verificationRate: number;
  averageProcessingTime: number;
  documentsThisMonth: number;
  documentsLastMonth: number;
  growthRate: number;
  categoryBreakdown: Array<{
    category: DocumentCategory;
    count: number;
    percentage: number;
    verificationRate: number;
  }>;
  statusBreakdown: Array<{
    status: DocumentStatus;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    action: string;
    documentId: string;
    documentName: string;
    timestamp: string;
    status: DocumentStatus;
  }>;
  expiringDocuments: Array<{
    documentId: string;
    documentName: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
};

/**
 * Document share settings
 */
export type DocumentShareSettings = {
  isPublic: boolean;
  allowDownload: boolean;
  allowPreview: boolean;
  expiresAt?: string;
  passwordProtected: boolean;
  password?: string;
  shareLink?: string;
  accessLog?: Array<{
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    action: "view" | "download";
  }>;
};

/**
 * Document version interface
 */
export type DocumentVersion = {
  id: string;
  version: number;
  file: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  changes?: string;
  isActive: boolean;
  metadata?: Partial<DocumentMetadata>;
};
