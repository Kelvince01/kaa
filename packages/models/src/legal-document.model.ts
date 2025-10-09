/**
 * Legal Document models for rental agreements and legal documents
 */

import mongoose, { type Model, Schema } from "mongoose";
import {
  // DeliveryMethod,
  type DocumentMetadata,
  type DocumentParty,
  FieldType,
  type IDocumentTemplate,
  type IGeneratedDocument,
  Language,
  LegalDocumentCategory,
  LegalDocumentStatus,
  LegalDocumentType,
  type TemplateField,
  TemplateStatus,
} from "./types/legal-document.type";

// Sub-schemas
const fieldValidationSchema = new Schema(
  {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
    customValidator: { type: String },
    errorMessage: { type: String },
  },
  { _id: false }
);

const templateFieldSchema = new Schema<TemplateField>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(FieldType),
      required: true,
    },
    required: { type: Boolean, required: true },
    validation: { type: fieldValidationSchema },
    options: [{ type: String }],
    defaultValue: { type: Schema.Types.Mixed },
    placeholder: { type: String },
    description: { type: String },
    kenyaSpecific: { type: Boolean, default: false },
  },
  { _id: false }
);

const documentMetadataSchema = new Schema<DocumentMetadata>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: String, required: true },
    approvedBy: { type: String },
    legalReviewed: { type: Boolean, required: true },
    complianceChecked: { type: Boolean, required: true },
    lastReviewed: { type: Date },
    nextReviewDue: { type: Date },
    governingLaw: { type: String, required: true },
    court: { type: String, required: true },
  },
  { _id: false }
);

const complianceRequirementSchema = new Schema(
  {
    law: { type: String, required: true },
    section: { type: String, required: true },
    description: { type: String, required: true },
    mandatory: { type: Boolean, required: true },
    penalty: { type: String },
  },
  { _id: false }
);

// Document Template Schema
const documentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(LegalDocumentType),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(LegalDocumentCategory),
      required: true,
    },
    version: { type: String, required: true },
    language: {
      type: String,
      enum: Object.values(Language),
      required: true,
    },
    jurisdiction: {
      type: String,
      enum: ["kenya", "nairobi", "mombasa", "kisumu", "nakuru"],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TemplateStatus),
      required: true,
      default: TemplateStatus.DRAFT,
    },
    fields: [templateFieldSchema],
    content: { type: String, required: true },
    metadata: { type: documentMetadataSchema, required: true },
    compliance: [complianceRequirementSchema],
  },
  {
    timestamps: true,
    collection: "document_templates",
  }
);

// Indexes for document templates
documentTemplateSchema.index({ id: 1 });
documentTemplateSchema.index({ type: 1 });
documentTemplateSchema.index({ category: 1 });
documentTemplateSchema.index({ status: 1 });
documentTemplateSchema.index({ jurisdiction: 1 });
documentTemplateSchema.index({ language: 1 });
documentTemplateSchema.index({ "metadata.tags": 1 });

// Compound indexes
documentTemplateSchema.index({ type: 1, status: 1 });
documentTemplateSchema.index({ category: 1, status: 1 });
documentTemplateSchema.index({ jurisdiction: 1, language: 1 });

// Document Party Schema
const documentPartySchema = new Schema<DocumentParty>(
  {
    type: {
      type: String,
      enum: ["landlord", "tenant", "guarantor", "witness", "agent"],
      required: true,
    },
    name: { type: String, required: true },
    idNumber: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    signed: { type: Boolean, required: true, default: false },
    signedAt: { type: Date },
    signatureHash: { type: String },
  },
  { _id: false }
);

// Generated Document Schema
const generatedDocumentSchema = new Schema<IGeneratedDocument>(
  {
    id: { type: String, required: true, unique: true },
    templateId: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(LegalDocumentType),
      required: true,
    },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    format: {
      type: String,
      enum: ["pdf", "docx", "html"],
      required: true,
    },
    language: {
      type: String,
      enum: Object.values(Language),
      required: true,
    },
    checksum: { type: String, required: true },
    qrCode: { type: String },
    digitalSignature: { type: String },
    watermark: { type: String },
    encrypted: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: Object.values(LegalDocumentStatus),
      required: true,
      default: LegalDocumentStatus.GENERATED,
    },
    metadata: { type: Schema.Types.Mixed, required: true },
    parties: [documentPartySchema],
    validFrom: { type: Date },
    validTo: { type: Date },
    generatedBy: { type: String, required: true },

    // Additional tracking fields
    // propertyId: { type: String },
    // tenantId: { type: String },
    // landlordId: { type: String },
    // contractId: { type: String },

    // Delivery tracking
    // deliveryMethods: [
    //     {
    //         type: String,
    //         enum: Object.values(DeliveryMethod),
    //     },
    // ],
    // deliveredAt: { type: Date },

    // Access tracking
    // viewCount: { type: Number, default: 0 },
    // downloadCount: { type: Number, default: 0 },
    // lastAccessedAt: { type: Date },

    // Archival
    // archived: { type: Boolean, default: false },
    // archivedAt: { type: Date },
    // archivedBy: { type: String },
  },
  {
    timestamps: true,
    collection: "generated_documents",
  }
);

// Indexes for generated documents
generatedDocumentSchema.index({ id: 1 });
generatedDocumentSchema.index({ templateId: 1 });
generatedDocumentSchema.index({ type: 1 });
generatedDocumentSchema.index({ status: 1 });
generatedDocumentSchema.index({ generatedBy: 1 });
generatedDocumentSchema.index({ propertyId: 1 });
generatedDocumentSchema.index({ tenantId: 1 });
generatedDocumentSchema.index({ landlordId: 1 });
generatedDocumentSchema.index({ contractId: 1 });
generatedDocumentSchema.index({ createdAt: -1 });
generatedDocumentSchema.index({ archived: 1 });

// Compound indexes
generatedDocumentSchema.index({ type: 1, status: 1 });
generatedDocumentSchema.index({ generatedBy: 1, createdAt: -1 });
generatedDocumentSchema.index({ propertyId: 1, type: 1 });
generatedDocumentSchema.index({ status: 1, createdAt: -1 });

// Text index for search
generatedDocumentSchema.index({
  title: "text",
  fileName: "text",
});

// Virtual for document age
generatedDocumentSchema.virtual("ageInDays").get(function (
  this: IGeneratedDocument
) {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for validity status
generatedDocumentSchema.virtual("isValid").get(function (
  this: IGeneratedDocument
) {
  if (!(this.validFrom && this.validTo)) {
    return true;
  }
  const now = new Date();
  return now >= this.validFrom && now <= this.validTo;
});

// Middleware to update lastAccessedAt on view/download
generatedDocumentSchema.pre("save", function (next) {
  if (this.isModified("viewCount") || this.isModified("downloadCount")) {
    (this as any).lastAccessedAt = new Date();
  }
  next();
});

// Create and export models
export const DocumentTemplate: Model<IDocumentTemplate> =
  mongoose.model<IDocumentTemplate>("DocumentTemplate", documentTemplateSchema);

export const GeneratedDocument: Model<IGeneratedDocument> =
  mongoose.model<IGeneratedDocument>(
    "GeneratedDocument",
    generatedDocumentSchema
  );

// Export schemas for potential extension
export {
  documentTemplateSchema,
  generatedDocumentSchema,
  documentPartySchema,
  templateFieldSchema,
};

export default {
  DocumentTemplate,
  GeneratedDocument,
};
