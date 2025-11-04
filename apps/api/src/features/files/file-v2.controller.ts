/**
 * File V2 Controller
 *
 * Comprehensive file management with AWS S3, image processing,
 * watermarking, malware scanning, and Kenya-specific features
 */

import config from "@kaa/config/api";
import {
  FileAccessLevel,
  type FileCategory,
  FileStatus,
  FileType,
  type IBulkFileOperation,
  ImageOperation,
} from "@kaa/models/types";
import { filesV2Service as filesService } from "@kaa/services";
import {
  generatePresignedUploadUrl,
  getOptimizedAssetUrl,
  listUserFiles,
  processFromBuffer,
  uploadFile,
} from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import ShortUniqueId from "short-unique-id";
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
            // type: [
            //   "image/png",
            //   "image/jpeg",
            //   "image/jpg",
            //   "image/gif",
            //   "image/bmp",
            //   "image/webp",
            // ], // List of acceptable image types
            maxSize: 100 * 1024 * 1024, // 100MB
          }),
          description: t.Optional(t.String()),
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

    .get(
      "/v1",
      async ({ set, user }) => {
        try {
          // List files from storage
          const files = await listUserFiles(user.id);

          // Get file metadata from database
          const fileMetadata = await filesService.getFilesByUserId(user.id);

          // Combine storage data with metadata
          const combinedFiles = files.map((file) => {
            const metadata = fileMetadata.find(
              (meta) => meta.path === file.pathname
            );
            return {
              ...file,
              id: metadata?.id,
              metadata: metadata || {},
            };
          });

          set.status = 200;
          return {
            status: "success",
            results: combinedFiles.length,
            files: combinedFiles,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get files",
          };
        }
      },
      {
        detail: {
          tags: ["files"],
          summary: "Get all files for current user",
        },
      }
    )

    // ==================== DOWNLOAD URL ====================

    .get(
      "/:id/download",
      async ({ set, user, params, query, headers }) => {
        try {
          const expiresIn = query.expiresIn
            ? Number.parseInt(query.expiresIn, 10)
            : 3600;
          const url = await filesService.getDownloadUrl(
            params.id,
            user.id,
            expiresIn
          );

          // Log the download
          await filesService.logFileAccess(params.id, user.id, "DOWNLOAD", {
            ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
            userAgent: headers["user-agent"],
          });

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
      "/",
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
          description: t.Optional(t.String()),
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

    // Copy file
    .post(
      "/:id/copy",
      async ({ set, user, params, body }) => {
        try {
          const { id } = params;
          const { name } = body;
          const copiedFile = await filesService.copyFile(id, user.id, name);

          if (!copiedFile) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
            };
          }

          set.status = 201;
          return {
            status: "success",
            file: copiedFile,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to copy file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Copy a file",
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

    // Generate presigned URL for direct CDN upload
    .post(
      "/upload-url",
      async ({ set, user, body }) => {
        try {
          const { fileName, contentType } = body;

          // Validate file type
          if (!config.cdn.allowedTypes.includes(contentType)) {
            set.status = 400;
            return {
              status: "error",
              message: "File type not allowed",
            };
          }

          // Generate presigned upload URL
          const uploadData = await generatePresignedUploadUrl(
            user.id,
            fileName,
            contentType,
            {
              public: body.public,
            }
          );

          set.status = 200;
          return {
            status: "success",
            uploadData,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to generate upload URL",
          };
        }
      },
      {
        body: t.Object({
          fileName: t.String(),
          contentType: t.String(),
          public: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["files"],
          summary: "Generate presigned upload URL for direct CDN upload",
        },
      }
    )
    // Get optimized asset URL
    .get(
      "/optimize/:path",
      ({ set, params, query }) => {
        try {
          const { path } = params;
          const { w, h, q, f, fit } = query;

          const optimizedUrl = getOptimizedAssetUrl(path, {
            width: w ? Number.parseInt(w, 10) : undefined,
            height: h ? Number.parseInt(h, 10) : undefined,
            quality: q ? Number.parseInt(q, 10) : undefined,
            format: f,
            fit,
          });

          // Set CDN headers
          set.headers = {
            "Cache-Control": "public, max-age=31536000, immutable",
            "CDN-Cache-Control": "public, max-age=31536000",
            "X-Optimized": "true",
          };

          set.status = 200;
          return {
            status: "success",
            url: optimizedUrl,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to generate optimized URL",
          };
        }
      },
      {
        params: t.Object({
          path: t.String(),
        }),
        query: t.Object({
          w: t.Optional(t.String()),
          h: t.Optional(t.String()),
          q: t.Optional(t.String()),
          f: t.Optional(t.String()),
          fit: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Get optimized asset URL",
        },
      }
    )
    // Direct upload endpoint for CDN
    .post(
      "/upload-direct",
      async ({ set, body, headers }) => {
        try {
          const userId = headers["x-user-id"];
          const fileName = headers["x-file-name"];

          if (!(userId && fileName)) {
            set.status = 400;
            return {
              status: "error",
              message: "Missing required headers",
            };
          }

          const fileBuffer = await body.file.arrayBuffer();
          const { randomUUID } = new ShortUniqueId({ length: 20 });
          const fileExtension = body.file.name.split(".").pop() || ".png";
          const uniqueFileName = `${randomUUID()}.${fileExtension}`;

          // Process and upload file
          const processed = await processFromBuffer(Buffer.from(fileBuffer));

          const file = await uploadFile(
            {
              originalname: uniqueFileName,
              buffer: processed,
              mimetype: body.file.type,
              size: body.file.size,
            },
            {
              userId,
              public: true,
              optimization: {
                quality: config.cdn.imageOptimization.quality,
                format: "auto",
              },
            }
          );

          // Save metadata
          const fileData = {
            user: new mongoose.Types.ObjectId(userId),
            name: uniqueFileName,
            path: file.path,
            url: file.url,
            cdnUrl: file.cdnUrl,
            size: file.size,
            mimeType: body.file.type,
          };

          // const savedFile = await filesService.createFile(fileData);

          set.status = 201;
          return {
            status: "success",
            file: {
              ...file,
              // metadata: savedFile,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Direct upload failed",
          };
        }
      },
      {
        body: t.Object({
          file: t.File({
            type: config.cdn.allowedTypes,
            maxSize: config.cdn.maxFileSize,
          }),
        }),
        type: "multipart/form-data",
        detail: {
          tags: ["files"],
          summary: "Direct upload to CDN",
        },
      }
    )

    // Bulk file operations
    .post(
      "/bulk",
      async ({ set, user, body }) => {
        try {
          const result = await filesService.bulkFileOperation(
            user.id,
            body as IBulkFileOperation
          );

          set.status = result.success ? 200 : 400;
          return {
            status: result.success ? "success" : "error",
            message: result.message,
            results: result.results,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Bulk operation failed",
          };
        }
      },
      {
        body: t.Object({
          operation: t.Union([
            t.Literal("DELETE"),
            t.Literal("ARCHIVE"),
            t.Literal("UPDATE_CATEGORY"),
            t.Literal("UPDATE_ACCESS"),
            t.Literal("MOVE"),
          ]),
          fileIds: t.Array(t.String()),
          parameters: t.Optional(t.Record(t.String(), t.Any())),
        }),
        detail: {
          tags: ["files"],
          summary: "Perform bulk operations on files",
        },
      }
    )
    // Share file
    .post(
      "/:id/share",
      async ({ set, user, params, body }) => {
        try {
          const { id } = params;
          const result = await filesService.shareFile(id, user.id, {
            isPublic: body.isPublic,
            allowDownload: body.allowDownload,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
          });

          set.status = result.success ? 200 : 400;
          return {
            status: result.success ? "success" : "error",
            message: result.message,
            shareUrl: result.shareUrl,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to share file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          isPublic: t.Boolean(),
          allowDownload: t.Optional(t.Boolean()),
          expiresAt: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Share a file",
        },
      }
    )
    // Get shared file
    .get(
      "/shared/:token",
      async ({ set, params }) => {
        try {
          const { token } = params;
          const file = await filesService.getSharedFile(token);

          if (!file) {
            set.status = 404;
            return {
              status: "error",
              message: "Shared file not found or expired",
            };
          }

          set.status = 200;
          return {
            status: "success",
            file,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get shared file",
          };
        }
      },
      {
        params: t.Object({
          token: t.String(),
        }),
        detail: {
          tags: ["files"],
          summary: "Get shared file by token",
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
      "/stats",
      async ({ set, user, query }) => {
        try {
          const stats = await filesService.getFileStats(
            user.id,
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

    // Get file analytics
    .get(
      "/:id/analytics",
      async ({ set, user, params, query }) => {
        try {
          const { id } = params;
          const { timeRange } = query;
          const analytics = await filesService.getFileAnalytics(
            id,
            user.id,
            timeRange as "7d" | "30d" | "90d"
          );

          if (!analytics) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            analytics,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get file analytics",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        query: t.Object({
          timeRange: t.Optional(
            t.Union([t.Literal("7d"), t.Literal("30d"), t.Literal("90d")])
          ),
        }),
        detail: {
          tags: ["files"],
          summary: "Get file analytics",
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
