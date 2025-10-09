import type mongoose from "mongoose";

/**
 * Document category
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
 * Document status
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
 * Document priority
 */
export enum DocumentPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type FraudDetectionResult = {
  fraudDetected: boolean;
  confidenceScore: number;
  riskLevel: "low" | "medium" | "high";
  details: Record<string, unknown>;
  detectionMethods: string[];
  warnings: string[];
};

/**
 * Document interface
 */
export type IDocument = {
  tenant: mongoose.Types.ObjectId;
  name: string;
  type: string;
  category: DocumentCategory;
  file: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  priority: DocumentPriority;
  expiryDate?: Date;
  uploadedAt: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  preview?: string;
  tags?: string[];
  metadata?: {
    verificationResult?: VerificationResult;
    extractedData?: Record<string, unknown>;
    fraudDetection?: FraudDetectionResult;
    description?: string;
    [key: string]: unknown;
  };
};

/**
 * Verification result interface
 */
export type VerificationResult = {
  isValid: boolean;
  confidence: number;
  details: {
    [key: string]: string | number | boolean | null;
  };
  message: string;
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
