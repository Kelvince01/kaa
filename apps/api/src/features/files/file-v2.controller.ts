/**
 * File V2 Controller
 *
 * Comprehensive file management with AWS S3, image processing,
 * watermarking, malware scanning, and Kenya-specific features
 */

import {
  FileAccessLevel,
  type FileCategory,
  FileStatus,
  FileType,
  ImageOperation,
} from "@kaa/models/file.type";
import { filesV2Service as filesService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const fileV2Controller = new Elysia().group("files/v2", (app) =>
  app
    .use(authPlugin)

    // ==================== UPLOAD ====================

    .post(
      "/upload",
      async ({ set, user, body }) => {
        try {
          const fileBuffer = Buffer.from(await body.file.arrayBuffer());

          const uploadOptions = {
            ownerId: user.id,
            organizationId: body.organizationId,
            uploadedBy: user.id,
            category: body.category as FileCategory,
            accessLevel:
              (body.accessLevel as FileAccessLevel) || FileAccessLevel.PRIVATE,
            relatedEntityId: body.relatedEntityId,
            relatedEntityType: body.relatedEntityType,
            tags: body.tags ? body.tags.split(",") : [],
            // biome-ignore lint/complexity/noExtraBooleanCast: ignore
            processingOptions: Boolean(body.addWatermark)
              ? {
                  operation: ImageOperation.WATERMARK,
                  parameters: {
                    type: body.watermarkType || "text",
                    text: body.watermarkText || "© Confidential",
                    watermarkPath: body.watermarkPath,
                    position: body.watermarkPosition || "bottom-right",
                    opacity: body.watermarkOpacity
                      ? Number.parseFloat(body.watermarkOpacity)
                      : 0.6,
                    fontSize: body.watermarkFontSize
                      ? Number.parseInt(body.watermarkFontSize, 10)
                      : 24,
                    color: body.watermarkColor || "white",
                    scale: body.watermarkScale
                      ? Number.parseFloat(body.watermarkScale)
                      : 0.2,
                  },
                }
              : undefined,
            kenyaMetadata:
              body.county || body.latitude
                ? {
                    county: body.county,
                    gpsCoordinates:
                      body.latitude && body.longitude
                        ? {
                            latitude: Number.parseFloat(body.latitude),
                            longitude: Number.parseFloat(body.longitude),
                            accuracy: body.gpsAccuracy
                              ? Number.parseFloat(body.gpsAccuracy)
                              : undefined,
                          }
                        : undefined,
                  }
                : undefined,
          };

          const file = await filesService.uploadFile(
            fileBuffer,
            body.file.name,
            uploadOptions
          );

          set.status = 201;
          return {
            status: "success",
            message: "File uploaded successfully",
            file: {
              id: file.id,
              url: file.url,
              cdnUrl: file.cdnUrl,
              fileName: file.fileName,
              originalName: file.originalName,
              size: file.size,
              mimeType: file.mimeType,
              type: file.type,
              category: file.category,
              status: file.status,
            },
          };
        } catch (error: any) {
          set.status = error.message.includes("security scan") ? 400 : 500;
          return {
            status: "error",
            message: error.message || "Failed to upload file",
            code: error.message.includes("security scan")
              ? "MALWARE_DETECTED"
              : "UPLOAD_FAILED",
          };
        }
      },
      {
        body: t.Object({
          file: t.File({
            maxSize: 100 * 1024 * 1024, // 100MB
          }),
          category: t.String(),
          organizationId: t.Optional(t.String()),
          accessLevel: t.Optional(t.String()),
          relatedEntityId: t.Optional(t.String()),
          relatedEntityType: t.Optional(t.String()),
          tags: t.Optional(t.String()),

          // Watermark options
          addWatermark: t.Optional(t.Union([t.String(), t.Boolean()])),
          watermarkType: t.Optional(t.String()), // 'text' or 'image'
          watermarkText: t.Optional(t.String()),
          watermarkPath: t.Optional(t.String()),
          watermarkPosition: t.Optional(t.String()),
          watermarkOpacity: t.Optional(t.String()),
          watermarkFontSize: t.Optional(t.String()),
          watermarkColor: t.Optional(t.String()),
          watermarkScale: t.Optional(t.String()),

          // Kenya metadata
          county: t.Optional(t.String()),
          latitude: t.Optional(t.String()),
          longitude: t.Optional(t.String()),
          gpsAccuracy: t.Optional(t.String()),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ["files-v2"],
          summary:
            "Upload file with optional watermarking and malware scanning",
          description:
            "Upload a file to S3 with automatic malware scanning, optional watermarking, and Kenya-specific metadata",
        },
      }
    )

    // ==================== PROCESS FILE ====================

    .post(
      "/:id/process",
      async ({ set, params, body }) => {
        try {
          const processedFiles = await filesService.processFile(
            params.id,
            body.operations
          );

          set.status = 200;
          return {
            status: "success",
            message: `Processed ${processedFiles.length} variant(s)`,
            files: processedFiles.map((f) => ({
              id: f.id,
              url: f.url,
              cdnUrl: f.cdnUrl,
              fileName: f.fileName,
              size: f.size,
              status: f.status,
            })),
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to process file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          operations: t.Array(
            t.Object({
              operation: t.Enum(ImageOperation),
              parameters: t.Optional(t.Record(t.String(), t.Any())),
              priority: t.Optional(
                t.Union([
                  t.Literal("high"),
                  t.Literal("low"),
                  t.Literal("normal"),
                ])
              ),
            })
          ),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Process file (resize, watermark, convert, etc.)",
        },
      }
    )

    // ==================== GET FILE ====================

    .get(
      "/:id",
      async ({ set, user, params }) => {
        try {
          const file = await filesService.getFile(params.id, user.id);

          set.status = 200;
          return {
            status: "success",
            file,
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 403;
          return {
            status: "error",
            message: error.message || "Failed to get file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Get file by ID",
        },
      }
    )

    // ==================== DOWNLOAD URL ====================

    .get(
      "/:id/download",
      async ({ set, user, params, query }) => {
        try {
          const expiresIn = query.expiresIn
            ? Number.parseInt(query.expiresIn, 10)
            : 3600;
          const url = await filesService.getDownloadUrl(
            params.id,
            user.id,
            expiresIn
          );

          set.status = 200;
          return {
            status: "success",
            downloadUrl: url,
            expiresIn,
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 403;
          return {
            status: "error",
            message: error.message || "Failed to generate download URL",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        query: t.Object({
          expiresIn: t.Optional(t.String()), // seconds
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Get presigned download URL",
        },
      }
    )

    // ==================== SEARCH FILES ====================

    .get(
      "/search",
      async ({ set, user, query }) => {
        try {
          const searchQuery = {
            search: query.search,
            type: query.type,
            status: query.status,
            ownerId: query.ownerId,
            organizationId: query.organizationId || user.organizationId,
            tags: query.tags ? query.tags.split(",") : undefined,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
            sizeMin: query.sizeMin
              ? Number.parseInt(query.sizeMin, 10)
              : undefined,
            sizeMax: query.sizeMax
              ? Number.parseInt(query.sizeMax, 10)
              : undefined,
            county: query.county,
            hasGps:
              query.hasGps === "true"
                ? true
                : query.hasGps === "false"
                  ? false
                  : undefined,
            sortBy: query.sortBy || "createdAt",
            sortOrder: (query.sortOrder as "asc" | "desc") || "desc",
            page: query.page ? Number.parseInt(query.page, 10) : 1,
            limit: query.limit ? Number.parseInt(query.limit, 10) : 20,
          };

          const result = await filesService.searchFiles(searchQuery, user.id);

          set.status = 200;
          return {
            status: "success",
            ...result,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Search failed",
          };
        }
      },
      {
        query: t.Object({
          search: t.Optional(t.String()),
          type: t.Optional(
            t.Union([t.Enum(FileType), t.Array(t.Enum(FileType))])
          ),
          category: t.Optional(t.String()),
          status: t.Optional(t.Enum(FileStatus)),
          ownerId: t.Optional(t.String()),
          organizationId: t.Optional(t.String()),
          tags: t.Optional(t.String()),
          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
          sizeMin: t.Optional(t.String()),
          sizeMax: t.Optional(t.String()),
          county: t.Optional(t.String()),
          hasGps: t.Optional(t.String()),
          sortBy: t.Optional(
            t.Union([
              t.Literal("createdAt"),
              t.Literal("fileName"),
              t.Literal("size"),
              t.Literal("downloadCount"),
            ])
          ),
          sortOrder: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Search files with advanced filters",
        },
      }
    )

    // ==================== GET FILES BY ENTITY ====================

    .get(
      "/entity/:entityType/:entityId",
      async ({ set, user, params }) => {
        try {
          const files = await filesService.getFilesByEntity(
            params.entityId,
            params.entityType,
            user.id
          );

          set.status = 200;
          return {
            status: "success",
            count: files.length,
            files,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get files",
          };
        }
      },
      {
        params: t.Object({
          entityType: t.String(),
          entityId: t.String(),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Get files by related entity (property, user, etc.)",
        },
      }
    )

    // ==================== UPDATE FILE ====================

    .patch(
      "/:id",
      async ({ set, user, params, body }) => {
        try {
          const updatedFile = await filesService.updateFile(
            params.id,
            body,
            user.id
          );

          set.status = 200;
          return {
            status: "success",
            message: "File updated successfully",
            file: updatedFile,
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 403;
          return {
            status: "error",
            message: error.message || "Failed to update file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          originalName: t.Optional(t.String()),
          tags: t.Optional(t.Array(t.String())),
          accessLevel: t.Optional(t.Enum(FileAccessLevel)),
          kenyaMetadata: t.Optional(
            t.Object({
              county: t.Optional(t.String()),
              gpsCoordinates: t.Optional(
                t.Object({
                  latitude: t.Number(),
                  longitude: t.Number(),
                  accuracy: t.Optional(t.Number()),
                })
              ),
            })
          ),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Update file metadata",
        },
      }
    )

    // ==================== DELETE FILE ====================

    .use(accessPlugin("files", "delete"))
    .delete(
      "/:id",
      async ({ set, user, params }) => {
        try {
          await filesService.deleteFile(params.id, user.id);

          set.status = 200;
          return {
            status: "success",
            message: "File deleted successfully",
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 403;
          return {
            status: "error",
            message: error.message || "Failed to delete file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Soft delete file",
        },
      }
    )

    // ==================== PERMANENTLY DELETE ====================

    .delete(
      "/:id/permanent",
      async ({ set, user, params }) => {
        try {
          await filesService.permanentlyDeleteFile(params.id, user.id);

          set.status = 200;
          return {
            status: "success",
            message: "File permanently deleted",
          };
        } catch (error: any) {
          set.status = error.message.includes("not found") ? 404 : 403;
          return {
            status: "error",
            message: error.message || "Failed to delete file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Permanently delete file from storage",
        },
      }
    )

    // ==================== USAGE STATISTICS ====================

    .get(
      "/stats/usage",
      async ({ set, user, query }) => {
        try {
          const stats = await filesService.getUsageStats(
            query.organizationId || user.organizationId,
            query.dateFrom ? new Date(query.dateFrom) : undefined,
            query.dateTo ? new Date(query.dateTo) : undefined
          );

          set.status = 200;
          return {
            status: "success",
            stats,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get usage statistics",
          };
        }
      },
      {
        query: t.Object({
          organizationId: t.Optional(t.String()),
          dateFrom: t.Optional(t.String()),
          dateTo: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files-v2"],
          summary: "Get file usage statistics",
        },
      }
    )

    // ==================== BATCH UPLOAD ====================

    .post(
      "/batch-upload",
      async ({ set, user, body }) => {
        try {
          const results = await Promise.allSettled(
            body.files.map(async (file) => {
              const fileBuffer = Buffer.from(await file.arrayBuffer());
              return await filesService.uploadFile(fileBuffer, file.name, {
                ownerId: user.id,
                organizationId: body.organizationId,
                uploadedBy: user.id,
                category: body.category as FileCategory,
                accessLevel:
                  (body.accessLevel as FileAccessLevel) ||
                  FileAccessLevel.PRIVATE,
                tags: body.tags ? body.tags.split(",") : [],
              });
            })
          );

          const successful = results.filter((r) => r.status === "fulfilled");
          const failed = results.filter((r) => r.status === "rejected");

          set.status = 200;
          return {
            status: "success",
            message: `Uploaded ${successful.length} of ${results.length} files`,
            successful: successful.length,
            failed: failed.length,
            files: successful.map(
              (r) => (r as PromiseFulfilledResult<any>).value
            ),
            errors: failed.map(
              (r) => (r as PromiseRejectedResult).reason.message
            ),
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Batch upload failed",
          };
        }
      },
      {
        body: t.Object({
          files: t.Array(t.File()),
          category: t.String(),
          organizationId: t.Optional(t.String()),
          accessLevel: t.Optional(t.String()),
          tags: t.Optional(t.String()),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ["files-v2"],
          summary: "Upload multiple files at once",
        },
      }
    )

    // ==================== WATERMARK PRESETS ====================

    .get(
      "/watermark/presets",
      ({ set }) => {
        set.status = 200;
        return {
          status: "success",
          presets: {
            confidential: {
              type: "text",
              text: "CONFIDENTIAL",
              position: "center",
              opacity: 0.3,
              fontSize: 48,
              color: "red",
            },
            draft: {
              type: "text",
              text: "DRAFT",
              position: "center",
              opacity: 0.4,
              fontSize: 64,
              color: "gray",
            },
            copyright: {
              type: "text",
              text: "© 2025 All Rights Reserved",
              position: "bottom-right",
              opacity: 0.6,
              fontSize: 16,
              color: "white",
            },
            premium: {
              type: "text",
              text: "PREMIUM",
              position: "top-right",
              opacity: 0.8,
              fontSize: 32,
              color: "gold",
            },
          },
        };
      },
      {
        detail: {
          tags: ["files-v2"],
          summary: "Get watermark presets",
        },
      }
    )

    // ==================== HEALTH CHECK ====================

    .get(
      "/health",
      ({ set }) => {
        set.status = 200;
        return {
          status: "success",
          service: "files-v2",
          features: {
            upload: true,
            watermarking: true,
            malwareScanning: true,
            imageProcessing: true,
            kenyaMetadata: true,
            s3Storage: true,
            cdnDelivery: true,
          },
        };
      },
      {
        detail: {
          tags: ["files-v2"],
          summary: "Health check endpoint",
        },
      }
    )
);
