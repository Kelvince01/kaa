/**
 * Legal Document Types
 *
 * Type definitions for the legal documents system matching the backend API
 */

import type {
  DeliveryMethod,
  Language,
  LegalDocumentType,
  TemplateStatus,
} from "@kaa/models/types";

/**
 * Document format options
 */
export type DocumentFormat = "pdf" | "html" | "docx";

/**
 * Party type for document signing
 */
export type PartyType =
  | "landlord"
  | "tenant"
  | "guarantor"
  | "witness"
  | "agent";

export enum LegalDocumentStatus {
  GENERATED = "generated",
  SIGNED = "signed",
  EXECUTED = "executed",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  ARCHIVED = "archived",

  PENDING_SIGNATURE = "pending_signature",
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  ACTIVE = "active",
  COMPLETED = "completed",
}

/**
 * Signature information
 */
export type Signature = {
  party: PartyType;
  signedAt: Date;
  signatureHash: string;
};

/**
 * Document generation options
 */
export type DocumentGenerationOptions = {
  format?: DocumentFormat;
  language?: Language;
  digitalSignature?: boolean;
  watermark?: string;
  encryption?: boolean;
  password?: string;
  copies?: number;
  delivery?: DeliveryMethod[];
};

/**
 * Main legal document interface
 */
export type ILegalDocument = {
  _id: string;
  type: LegalDocumentType;
  templateId: string;
  templateVersion: number;
  status: LegalDocumentStatus;
  format: DocumentFormat;
  language: Language;

  // Parties
  generatedBy: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;

  // Document content
  data: Record<string, unknown>;
  file: string;
  checksum: string;

  // Signatures
  signatures: Signature[];

  // Settings
  digitalSignature: boolean;
  watermark?: string;
  encryption: boolean;
  copies: number;

  // Delivery
  delivery: DeliveryMethod[];
  deliveredAt?: Date;

  // Verification
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;

  // Audit trail
  accessLog: Array<{
    action: "view" | "download" | "share" | "sign";
    by: string;
    at: Date;
    ip?: string;
  }>;

  // Metadata
  metadata?: Record<string, unknown>;
  version: number;
  archivedAt?: Date;
  archivedBy?: string;

  createdAt: Date;
  updatedAt: Date;
};

/**
 * Template field definition
 */
export type TemplateField = {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "textarea";
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
};

/**
 * Legal document template
 */
export type ILegalDocumentTemplate = {
  _id: string;
  name: string;
  type: LegalDocumentType;
  version: number;
  status: TemplateStatus;

  // Template content
  content: string; // Handlebars template
  fields: TemplateField[];

  // Legal metadata
  jurisdiction: string;
  legalReferences: string[];
  effectiveDate: Date;
  expiryDate?: Date;

  // Settings
  requiresSignature: boolean;
  signatureParties: PartyType[];
  language: Language;
  supportedFormats: DocumentFormat[];

  // Usage
  usageCount: number;
  lastUsedAt?: Date;

  // Metadata
  description?: string;
  tags: string[];
  category?: string;

  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Document generation request
 */
export type GenerateDocumentRequest = {
  templateId: string;
  data: Record<string, unknown>;
  format?: DocumentFormat;
  language?: Language;
  digitalSignature?: boolean;
  watermark?: string;
  encryption?: boolean;
  password?: string;
  copies?: number;
  delivery?: DeliveryMethod[];
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Document sign request
 */
export type SignDocumentRequest = {
  documentId: string;
  partyType: PartyType;
  signatureHash: string;
};

/**
 * Document verification result
 */
export type DocumentVerificationResult = {
  valid: boolean;
  document?: ILegalDocument;
  message: string;
};

/**
 * Document filters for listing
 */
export type LegalDocumentFilter = {
  type?: LegalDocumentType;
  status?: LegalDocumentStatus;
  generatedBy?: string;
  propertyId?: string;
  tenantId?: string;
  landlordId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

/**
 * Template filters
 */
export type TemplateFilter = {
  type?: LegalDocumentType;
  status?: TemplateStatus;
  jurisdiction?: string;
  language?: Language;
  page?: number;
  limit?: number;
};

/**
 * API response wrappers
 */
export type LegalDocumentResponse = {
  status: "success" | "error";
  message?: string;
  document?: ILegalDocument;
};

export type LegalDocumentListResponse = {
  status: "success" | "error";
  results: number;
  documents: ILegalDocument[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type TemplateResponse = {
  status: "success" | "error";
  message?: string;
  template?: ILegalDocumentTemplate;
};

export type TemplateListResponse = {
  status: "success" | "error";
  results: number;
  templates: ILegalDocumentTemplate[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};
