import { Document, Tenant } from "@kaa/models";
import { DocumentStatus, type IDocument } from "@kaa/models/types";
import { documentVerificationService } from "@kaa/services";
import { logger, processFromBuffer, uploadFile } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const documentController = new Elysia().group("documents", (app) =>
  app
    .use(accessPlugin("documents", "read"))
    .get(
      "/verification/status",
      async ({ set, user }) => {
        try {
          // Get verification status for each category
          const status =
            await documentVerificationService.getUserVerificationStatus(
              user.id
            );

          // Calculate overall verification progress
          const progress =
            await documentVerificationService.calculateVerificationProgress(
              user.id
            );

          set.status = 200;
          return {
            status: "success",
            verification_status: status,
            progress,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error getting verification status:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get verification status",
            error: errorMessage,
          };
        }
      },
      {
        detail: {
          tags: ["documents"],
          summary: "Get verification status",
          description: "Get verification status for each category",
        },
      }
    )
    .post(
      "/verification",
      async ({ set, user, body }) => {
        try {
          const { category, name, expiryDate, file } = body;

          const processed = await processFromBuffer(
            Buffer.from(await body.file.arrayBuffer())
          );

          const uploadPath = await uploadFile(
            {
              originalname: file.name,
              buffer: processed,
              mimetype: file.type,
              size: file.size,
            },
            {
              userId: user.id,
              fileName: file.name,
              public: true,
            }
          );

          const tenant = await Tenant.findOne({ user: user.id });

          // Check if tenant exists
          if (!tenant) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Create new document
          const document = new Document({
            tenant: tenant._id,
            // user: user.id,
            name: name || file.name,
            type: file.type,
            category,
            file: uploadPath.url,
            mimeType: file.type,
            size: file.size,
            status: DocumentStatus.PENDING,
            expiryDate: expiryDate || null,
            uploadedAt: new Date().toISOString(),
          });

          await document.save();

          // Return the document
          set.status = 200;
          return {
            status: "success",
            data: document,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error uploading document:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to upload document",
            error: errorMessage,
          };
        }
      },
      {
        body: t.Object({
          category: t.String(),
          name: t.String(),
          expiryDate: t.String(),
          file: t.File({
            type: [
              "image/png",
              "image/jpeg",
              "image/gif",
              "image/bmp",
              "image/webp",
            ], // List of acceptable image types
            maxSize: 5 * 1024 * 1024, // 5 MB in bytes
          }),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ["documents"],
          summary: "Upload a document",
          description: "Upload a document for verification",
        },
      }
    )
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const { category } = query;

          // Build query
          const queryFilter: FilterQuery<IDocument> = {
            // user: user.id
          };

          if (category) {
            queryFilter.category = category;
          }

          const documents = await Document.find(queryFilter).sort({
            uploadedAt: -1,
          });
          set.status = 200;
          return {
            status: "success",
            data: documents,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error getting documents:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get documents",
            error: errorMessage,
          };
        }
      },
      {
        query: t.Object({
          category: t.String(),
        }),
        detail: {
          tags: ["documents"],
          summary: "Get documents",
          description: "Get documents for a user",
        },
      }
    )
    .get(
      "/:id",
      async ({ set, params }) => {
        try {
          const { id } = params;

          const document = await Document.findOne({
            _id: id,
            // user: user.id,
          });

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
            data: document,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error getting document:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get document",
            error: errorMessage,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["documents"],
          summary: "Get document",
          description: "Get document by ID",
        },
      }
    )
    .delete(
      "/:id",
      async ({ set, params }) => {
        try {
          const { id } = params;

          const document = await Document.findOneAndDelete({
            _id: id,
            // user: user.id,
          });

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
            data: null,
            message: "Document deleted successfully",
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error deleting document:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete document",
            error: errorMessage,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["documents"],
          summary: "Delete document",
          description: "Delete document by ID",
        },
      }
    )
    .post(
      "/:id/verify",
      async ({ set, params, body }) => {
        try {
          const { id } = params;

          const document = await Document.findOne({
            _id: id,
            // user: user.id,
          });
          if (!document) {
            set.status = 404;
            return {
              status: "error",
              message: "Document not found",
            };
          }

          // Get verification options from request body
          const { options } = body;

          // Verify document
          const result = await documentVerificationService.verifyDocument(
            document._id.toString(),
            options.priority
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error verifying document:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to verify document",
            error: errorMessage,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          options: t.Object({ priority: t.Optional(t.Number()) }),
        }),
        detail: {
          tags: ["documents"],
          summary: "Verify document",
          description: "Verify document by ID",
        },
      }
    )
    .post(
      "/:id/extract",
      async ({ set, params }) => {
        try {
          const { id } = params;

          const document = await Document.findOne({
            _id: id,
            // user: user.id,
          });
          if (!document) {
            set.status = 404;
            return {
              status: "error",
              message: "Document not found",
            };
          }

          // Extract document
          const result = await documentVerificationService.extractDocumentData(
            document._id.toString()
          );

          set.status = 200;
          return {
            status: "success",
            data: result,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error("Error extracting document:", error as Error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to extract document",
            error: errorMessage,
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["documents"],
          summary: "Extract document",
          description: "Extract document by ID",
        },
      }
    )
);
