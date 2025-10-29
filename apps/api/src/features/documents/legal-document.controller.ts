/**
 * Legal Documents Controller
 *
 * Handles all legal document operations including generation, verification,
 * signing, and management of legal documents for the Kenyan rental market
 */

import {
  DeliveryMethod,
  Language,
  LegalDocumentStatus,
  type LegalDocumentType,
  type TemplateStatus,
} from "@kaa/models/types";
import { legalDocumentService } from "@kaa/services";
import { logger } from "@kaa/utils";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

/**
 * Helper function to get content type based on document format
 */
const getContentType = (format: string): string => {
  switch (format.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "html":
      return "text/html";
    default:
      return "application/octet-stream";
  }
};

export const legalDocumentController = new Elysia().group(
  "legal-documents",
  (app) =>
    app
      .use(authPlugin)
      // Generate a new legal document
      .post(
        "/generate",
        async ({ body, user, set }) => {
          try {
            const document = await legalDocumentService.generateDocument({
              templateId: body.templateId,
              data: body.data,
              options: {
                format: body.format || "pdf",
                language: body.language || Language.ENGLISH,
                digitalSignature: body.digitalSignature ?? false,
                watermark: body.watermark,
                encryption: body.encryption,
                password: body.password,
                copies: body.copies || 1,
                delivery: body.delivery || [],
              },
              requesterId: user.id,
              propertyId: body.propertyId,
              tenantId: body.tenantId,
              landlordId: body.landlordId,
              metadata: body.metadata,
            });

            set.status = 201;
            return {
              status: "success",
              message: "Document generated successfully",
              document,
            };
          } catch (error) {
            logger.error("Document generation error:", error);
            set.status = 500;
            return {
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to generate document",
            };
          }
        },
        {
          body: t.Object({
            templateId: t.String({ minLength: 1 }),
            data: t.Record(t.String(), t.Any()),
            format: t.Optional(
              t.Union([t.Literal("pdf"), t.Literal("html"), t.Literal("docx")])
            ),
            language: t.Optional(t.Enum(Language)),
            digitalSignature: t.Optional(t.Boolean()),
            watermark: t.Optional(t.String()),
            encryption: t.Optional(t.Boolean()),
            password: t.Optional(t.String()),
            copies: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
            delivery: t.Optional(t.Array(t.Enum(DeliveryMethod))),
            propertyId: t.Optional(t.String()),
            tenantId: t.Optional(t.String()),
            landlordId: t.Optional(t.String()),
            metadata: t.Optional(t.Record(t.String(), t.Any())),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Generate a new legal document",
            description:
              "Generate a legal document from a template with specified data and options",
          },
        }
      )
      // Get a specific document
      .get(
        "/:documentId",
        async ({ params, set }) => {
          try {
            const document = await legalDocumentService.getDocument(
              params.documentId
            );

            if (!document) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            // Track view
            await legalDocumentService.trackDocumentAccess(
              params.documentId,
              "view"
            );

            set.status = 200;
            return {
              status: "success",
              document,
            };
          } catch (error) {
            logger.error("Get document error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Get a specific document",
            description: "Retrieve a legal document by its ID",
          },
        }
      )
      // List documents with filters
      .get(
        "/",
        async ({ query, user, set }) => {
          try {
            const documents = await legalDocumentService.getDocuments({
              type: query.type as LegalDocumentType | undefined,
              status: query.status as LegalDocumentStatus | undefined,
              generatedBy: query.generatedBy || user.id,
              propertyId: query.propertyId,
              tenantId: query.tenantId,
              landlordId: query.landlordId,
              startDate: query.startDate
                ? new Date(query.startDate)
                : undefined,
              endDate: query.endDate ? new Date(query.endDate) : undefined,
            });

            set.status = 200;
            return {
              status: "success",
              results: documents.length,
              documents,
            };
          } catch (error) {
            logger.error("List documents error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to list documents",
            };
          }
        },
        {
          query: t.Object({
            type: t.Optional(t.String()),
            status: t.Optional(t.String()),
            generatedBy: t.Optional(t.String()),
            propertyId: t.Optional(t.String()),
            tenantId: t.Optional(t.String()),
            landlordId: t.Optional(t.String()),
            startDate: t.Optional(t.String()),
            endDate: t.Optional(t.String()),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "List documents with filters",
            description: "Get a list of legal documents with optional filters",
          },
        }
      )
      // Verify document authenticity
      .get(
        "/verify/:documentId",
        async ({ params, query, set }) => {
          try {
            const result = await legalDocumentService.verifyDocument(
              params.documentId,
              query.checksum
            );

            set.status = 200;
            return {
              status: "success",
              ...result,
            };
          } catch (error) {
            logger.error("Document verification error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to verify document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          query: t.Object({
            checksum: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Verify document authenticity",
            description: "Verify a document's authenticity using its checksum",
          },
        }
      )
      // Sign a document
      .post(
        "/:documentId/sign",
        async ({ params, body, set }) => {
          try {
            const document = await legalDocumentService.signDocument(
              params.documentId,
              body.partyType,
              {
                signedAt: new Date(),
                signatureHash: body.signatureHash,
              }
            );

            if (!document) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Document signed successfully",
              document,
            };
          } catch (error) {
            logger.error("Document signing error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to sign document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          body: t.Object({
            partyType: t.Union([
              t.Literal("landlord"),
              t.Literal("tenant"),
              t.Literal("guarantor"),
              t.Literal("witness"),
              t.Literal("agent"),
            ]),
            signatureHash: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Sign a document",
            description: "Record a party's signature on a document",
          },
        }
      )
      // Update document status
      .patch(
        "/:documentId/status",
        async ({ params, body, set }) => {
          try {
            const document = await legalDocumentService.updateDocumentStatus(
              params.documentId,
              body.status
            );

            if (!document) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Document status updated",
              document,
            };
          } catch (error) {
            logger.error("Update document status error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to update document status",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          body: t.Object({
            status: t.Enum(LegalDocumentStatus),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Update document status",
            description: "Update the status of a legal document",
          },
        }
      )
      // Archive a document
      .post(
        "/:documentId/archive",
        async ({ params, user, set }) => {
          try {
            const document = await legalDocumentService.archiveDocument(
              params.documentId,
              user.id
            );

            if (!document) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Document archived successfully",
              document,
            };
          } catch (error) {
            logger.error("Archive document error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to archive document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Archive a document",
            description: "Archive a legal document",
          },
        }
      )
      // Delete a document
      .delete(
        "/:documentId",
        async ({ params, set }) => {
          try {
            const success = await legalDocumentService.deleteDocument(
              params.documentId
            );

            if (!success) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Document deleted successfully",
            };
          } catch (error) {
            logger.error("Delete document error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to delete document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Delete a document",
            description: "Permanently delete a legal document",
          },
        }
      )
      // Download document file
      .get(
        "/:documentId/download",
        async ({ params, set }) => {
          try {
            const document = await legalDocumentService.getDocument(
              params.documentId
            );

            if (!document) {
              set.status = 404;
              return {
                status: "error",
                message: "Document not found",
              };
            }

            // Track download
            await legalDocumentService.trackDocumentAccess(
              params.documentId,
              "download"
            );

            // Get file from storage
            const fileBuffer = await legalDocumentService.getDocumentFile(
              document.filePath
            );

            if (!fileBuffer) {
              set.status = 404;
              return {
                status: "error",
                message: "Document file not found",
              };
            }

            // Set appropriate headers for file download
            set.headers["Content-Type"] = getContentType(document.format);
            set.headers["Content-Disposition"] =
              `attachment; filename="${document.type}-${new Date(document.createdAt).toISOString().split("T")[0]}.${document.format}"`;
            set.headers["Content-Length"] = fileBuffer.length.toString();

            return fileBuffer;
          } catch (error) {
            logger.error("Download document error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to download document",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Download document file",
            description: "Download the actual document file as a blob",
          },
        }
      )
      // Track document download (for analytics only)
      .post(
        "/:documentId/download/track",
        async ({ params, set }) => {
          try {
            await legalDocumentService.trackDocumentAccess(
              params.documentId,
              "download"
            );

            set.status = 200;
            return {
              status: "success",
              message: "Download tracked",
            };
          } catch (error) {
            logger.error("Track download error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to track download",
            };
          }
        },
        {
          params: t.Object({
            documentId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Track document download",
            description: "Record a document download event for analytics",
          },
        }
      )
      // Get all templates
      .get(
        "/templates",
        async ({ query, set }) => {
          try {
            const templates = await legalDocumentService.getTemplates({
              type: query.type as LegalDocumentType | undefined,
              status: query.status as TemplateStatus | undefined,
              jurisdiction: query.jurisdiction,
            });

            set.status = 200;
            return {
              status: "success",
              results: templates.length,
              templates,
            };
          } catch (error) {
            logger.error("Get templates error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get templates",
            };
          }
        },
        {
          query: t.Object({
            type: t.Optional(t.String()),
            status: t.Optional(t.String()),
            jurisdiction: t.Optional(t.String()),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Get all templates",
            description: "Get a list of available document templates",
          },
        }
      )
      // Get a specific template
      .get(
        "/templates/:templateId",
        async ({ params, set }) => {
          try {
            const template = await legalDocumentService.getTemplate(
              params.templateId
            );

            if (!template) {
              set.status = 404;
              return {
                status: "error",
                message: "Template not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              template,
            };
          } catch (error) {
            logger.error("Get template error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get template",
            };
          }
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Get a specific template",
            description: "Retrieve a document template by its ID",
          },
        }
      )
      // Create a new template (admin only)
      .use(accessPlugin("documents", "create"))
      .post(
        "/templates",
        async ({ body, set }) => {
          try {
            const template = await legalDocumentService.createTemplate(
              body as any
            );

            set.status = 201;
            return {
              status: "success",
              message: "Template created successfully",
              template,
            };
          } catch (error) {
            logger.error("Create template error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to create template",
            };
          }
        },
        {
          body: t.Any(), // Template schema is complex, validate in service
          detail: {
            tags: ["legal-documents"],
            summary: "Create a new template",
            description: "Create a new document template (admin only)",
          },
        }
      )
      // Update a template (admin only)
      .patch(
        "/templates/:templateId",
        async ({ params, body, set }) => {
          try {
            const template = await legalDocumentService.updateTemplate(
              params.templateId,
              body as any
            );

            if (!template) {
              set.status = 404;
              return {
                status: "error",
                message: "Template not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Template updated successfully",
              template,
            };
          } catch (error) {
            logger.error("Update template error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to update template",
            };
          }
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
          body: t.Any(),
          detail: {
            tags: ["legal-documents"],
            summary: "Update a template",
            description: "Update an existing document template (admin only)",
          },
        }
      )
      // Delete a template (admin only)
      .delete(
        "/templates/:templateId",
        async ({ params, set }) => {
          try {
            const success = await legalDocumentService.deleteTemplate(
              params.templateId
            );

            if (!success) {
              set.status = 404;
              return {
                status: "error",
                message: "Template not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Template deleted successfully",
            };
          } catch (error) {
            logger.error("Delete template error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to delete template",
            };
          }
        },
        {
          params: t.Object({
            templateId: t.String(),
          }),
          detail: {
            tags: ["legal-documents"],
            summary: "Delete a template",
            description: "Delete a document template (admin only)",
          },
        }
      )
);
