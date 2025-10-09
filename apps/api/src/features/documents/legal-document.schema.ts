/**
 * Legal Document Schemas
 *
 * Validation schemas for legal document API endpoints
 */

import { t } from "elysia";

// Document generation request schema
export const generateDocumentSchema = t.Object({
  templateId: t.String({
    minLength: 1,
    description: "ID of the template to use",
    examples: ["residential-tenancy-kenya-v1"],
  }),
  data: t.Record(t.String(), t.Any(), {
    description: "Template data (varies by template)",
    examples: [
      {
        landlordName: "John Doe",
        tenantName: "Jane Smith",
        rentAmount: "50000",
      },
    ],
  }),
  format: t.Optional(
    t.Union([t.Literal("pdf"), t.Literal("html"), t.Literal("docx")], {
      description: "Document format",
      default: "pdf",
    })
  ),
  language: t.Optional(
    t.Union([t.Literal("en"), t.Literal("sw"), t.Literal("en-sw")], {
      description: "Document language",
      default: "en",
    })
  ),
  digitalSignature: t.Optional(
    t.Boolean({
      description: "Include digital signature",
      default: false,
    })
  ),
  watermark: t.Optional(
    t.String({
      description: "Watermark text",
    })
  ),
  encryption: t.Optional(
    t.Boolean({
      description: "Encrypt the document",
      default: false,
    })
  ),
  password: t.Optional(
    t.String({
      description: "Password for encrypted document",
    })
  ),
  copies: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 10,
      description: "Number of copies",
      default: 1,
    })
  ),
  delivery: t.Optional(
    t.Array(
      t.Union([
        t.Literal("email"),
        t.Literal("sms"),
        t.Literal("whatsapp"),
        t.Literal("download"),
        t.Literal("postal"),
      ]),
      {
        description: "Delivery methods",
        default: [],
      }
    )
  ),
  propertyId: t.Optional(
    t.String({
      description: "Associated property ID",
    })
  ),
  tenantId: t.Optional(
    t.String({
      description: "Associated tenant ID",
    })
  ),
  landlordId: t.Optional(
    t.String({
      description: "Associated landlord ID",
    })
  ),
  metadata: t.Optional(
    t.Record(t.String(), t.Any(), {
      description: "Additional metadata",
    })
  ),
});

// Document query schema
export const documentQuerySchema = t.Object({
  type: t.Optional(
    t.String({
      description: "Filter by document type",
    })
  ),
  status: t.Optional(
    t.String({
      description: "Filter by document status",
    })
  ),
  generatedBy: t.Optional(
    t.String({
      description: "Filter by generator user ID",
    })
  ),
  propertyId: t.Optional(
    t.String({
      description: "Filter by property ID",
    })
  ),
  tenantId: t.Optional(
    t.String({
      description: "Filter by tenant ID",
    })
  ),
  landlordId: t.Optional(
    t.String({
      description: "Filter by landlord ID",
    })
  ),
  startDate: t.Optional(
    t.String({
      description: "Filter by start date (ISO 8601)",
    })
  ),
  endDate: t.Optional(
    t.String({
      description: "Filter by end date (ISO 8601)",
    })
  ),
});

// Sign document schema
export const signDocumentSchema = t.Object({
  partyType: t.Union(
    [
      t.Literal("landlord"),
      t.Literal("tenant"),
      t.Literal("guarantor"),
      t.Literal("witness"),
      t.Literal("agent"),
    ],
    {
      description: "Type of party signing",
    }
  ),
  signatureHash: t.String({
    description: "Hash of the signature",
    minLength: 1,
  }),
});

// Update status schema
export const updateStatusSchema = t.Object({
  status: t.Union(
    [
      t.Literal("generated"),
      t.Literal("signed"),
      t.Literal("executed"),
      t.Literal("expired"),
      t.Literal("cancelled"),
      t.Literal("archived"),
    ],
    {
      description: "New document status",
    }
  ),
});

// Template query schema
export const templateQuerySchema = t.Object({
  type: t.Optional(
    t.String({
      description: "Filter by template type",
    })
  ),
  status: t.Optional(
    t.String({
      description: "Filter by template status",
    })
  ),
  jurisdiction: t.Optional(
    t.String({
      description: "Filter by jurisdiction",
    })
  ),
});

// Verify document schema
export const verifyDocumentSchema = t.Object({
  checksum: t.String({
    description: "Document checksum for verification",
    minLength: 1,
  }),
});
