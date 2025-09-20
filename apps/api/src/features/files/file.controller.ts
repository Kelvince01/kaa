import config from "@kaa/config/api";
import type { IBulkFileOperation, IFileFilter } from "@kaa/models/types";
import { fileService } from "@kaa/services";
import {
  clearCache,
  deleteFile,
  generatePresignedUploadUrl,
  getOptimizedAssetUrl,
  isMetaDataImg,
  listUserFiles,
  processFromBuffer,
  uploadFile,
} from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import ShortUniqueId from "short-unique-id";
import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const fileController = new Elysia().group("files", (app) =>
  app
    .use(authPlugin)
    .get(
      "/v1",
      async ({ set, user }) => {
        try {
          // List files from storage
          const files = await listUserFiles(user.id);

          // Get file metadata from database
          const fileMetadata = await fileService.getFilesByUserId(user.id);

          // Combine storage data with metadata
          const combinedFiles = files.map((file) => {
            const metadata = fileMetadata.find(
              (meta) => meta.path === file.pathname
            );
            return {
              ...file,
              id: (metadata?._id as mongoose.Types.ObjectId)?.toString(),
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
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const result = await fileService.getFiles({
            filters: {
              page: query.page ? Number.parseInt(query.page, 10) : undefined,
              limit: query.limit ? Number.parseInt(query.limit, 10) : undefined,
              search: query.search,
              mimeType: query.mimeType,
              sizeFrom: query.sizeFrom
                ? Number.parseInt(query.sizeFrom, 10)
                : undefined,
              sizeTo: query.sizeTo
                ? Number.parseInt(query.sizeTo, 10)
                : undefined,
              uploadedFrom: query.uploadedFrom
                ? new Date(query.uploadedFrom)
                : undefined,
              uploadedTo: query.uploadedTo
                ? new Date(query.uploadedTo)
                : undefined,
              tags: query.tags ? query.tags.split(",") : undefined,
              isPublic:
                query.isPublic === "true"
                  ? true
                  : query.isPublic === "false"
                    ? false
                    : undefined,
              sortBy: query.sortBy,
              sortOrder: query.sortOrder as "asc" | "desc",
            },
          });

          set.status = 200;
          return result;
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get files",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          search: t.Optional(t.String()),
          mimeType: t.Optional(t.String()),
          sizeFrom: t.Optional(t.String()),
          sizeTo: t.Optional(t.String()),
          uploadedFrom: t.Optional(t.String()),
          uploadedTo: t.Optional(t.String()),
          tags: t.Optional(t.String()),
          isPublic: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Get all files",
        },
      }
    )
    .post(
      "/",
      async ({ set, user, body }) => {
        try {
          const fileBuffer = await body.file.arrayBuffer(); // Use arrayBuffer for binary data
          const { randomUUID } = new ShortUniqueId({ length: 20 });
          const fileExtension = body.file.name.split(".").pop() || ".png";
          const fileName = `${randomUUID()}.${fileExtension}`; // `${uuidv4()}.${fileExtension}`

          const isImg = await isMetaDataImg(fileBuffer);

          if (!isImg) {
            return {
              status: "error",
              message: "Uploaded file is not a valid image",
            };
          }

          const processed = await processFromBuffer(Buffer.from(fileBuffer));

          // Upload to storage
          const file = await uploadFile(
            {
              originalname: fileName,
              buffer: processed,
              mimetype: body.file.type,
              size: body.file.size,
            },
            {
              userId: user.id,
              public: false,
            }
          );

          // Save file metadata to database
          const fileData = {
            user: new mongoose.Types.ObjectId(user.id),
            name: fileName,
            path: file.path,
            url: file.url,
            size: file.size,
            mimeType: body.file.type,
            description: body.description || "",
          };

          const savedFile = await fileService.createFile(fileData);

          set.status = 201;
          return {
            status: "success",
            file: {
              ...file,
              metadata: savedFile,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to upload file",
          };
        }
      },
      {
        body: t.Object({
          file: t.File({
            type: [
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/gif",
              "image/bmp",
              "image/webp",
            ], // List of acceptable image types
            maxSize: 5 * 1024 * 1024, // 5 MB in bytes
          }),
          description: t.Optional(t.String()),
        }),
        type: "formdata",
        detail: {
          tags: ["files"],
          summary: "Upload a new file",
        },
      }
    )
    .get(
      "/:id",
      async ({ set, params }) => {
        try {
          const file = await fileService.getFileById(params.id);
          if (!file) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
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
            message: "Failed to get file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files"],
          summary: "Get a file by ID",
        },
      }
    )
    .use(accessPlugin("files", "delete"))
    .delete(
      "/:id",
      async ({ set, params }) => {
        try {
          const file = await fileService.getFileById(params.id);
          if (!file) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
            };
          }

          // Delete from storage
          await deleteFile(file.path);

          // Delete metadata from database
          await fileService.deleteFile(
            (file._id as mongoose.Types.ObjectId).toString()
          );

          // Clear cache
          await clearCache(`api:/api/v1/files/${file._id}`);
          await clearCache("api:/api/v1/files");

          set.status = 200;
          return {
            status: "success",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files"],
          summary: "Get a file by ID",
        },
      }
    )
    .patch(
      "/:id",
      async ({ set, params, body }) => {
        try {
          const fileId = params.id;
          const updateData = body;

          // Get file metadata from database
          const file = await fileService.getFileById(fileId);

          if (!file) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
            };
          }

          // Update only allowed fields
          const allowedFields = ["name", "description", "tags"];
          for (const key of Object.keys(updateData)) {
            if (!allowedFields.includes(key)) {
              delete (updateData as any)[key];
            }
          }

          // Update in database
          const updatedFile = await fileService.updateFile(fileId, updateData);

          // Clear cache
          await clearCache(`api:/api/v1/files/${file._id}`);
          await clearCache("api:/api/v1/files");

          set.status = 200;
          return {
            status: "success",
            file: updatedFile,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update file",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          tags: t.Optional(t.Array(t.String())),
        }),
        detail: {
          tags: ["files"],
          summary: "Update a file by ID",
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

          const savedFile = await fileService.createFile(fileData);

          set.status = 201;
          return {
            status: "success",
            file: {
              ...file,
              metadata: savedFile,
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
    // Advanced search endpoint
    .get(
      "/search",
      async ({ set, user, query }) => {
        try {
          const { q, limit, skip } = query;

          if (!q || q.length < 2) {
            set.status = 400;
            return {
              status: "error",
              message: "Search query must be at least 2 characters",
            };
          }

          const results = await fileService.searchFiles(user.id, q, {
            limit: limit ? Number.parseInt(limit, 10) : undefined,
            skip: skip ? Number.parseInt(skip, 10) : undefined,
          });

          set.status = 200;
          return {
            status: "success",
            ...results,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Search failed",
          };
        }
      },
      {
        query: t.Object({
          q: t.String(),
          limit: t.Optional(t.String()),
          skip: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Search files",
        },
      }
    )
    // Get file statistics
    .get(
      "/stats",
      async ({ set, user }) => {
        try {
          const stats = await fileService.getFileStats(user.id);

          set.status = 200;
          return {
            status: "success",
            stats,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get file statistics",
          };
        }
      },
      {
        detail: {
          tags: ["files"],
          summary: "Get file statistics",
        },
      }
    )
    // Bulk file operations
    .post(
      "/bulk",
      async ({ set, user, body }) => {
        try {
          const result = await fileService.bulkFileOperation(
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
          const result = await fileService.shareFile(id, user.id, {
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
          const file = await fileService.getSharedFile(token);

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
    // Download file
    .get(
      "/:id/download",
      async ({ set, user, params, headers }) => {
        try {
          const { id } = params;
          const file = await fileService.getFileById(id);

          if (!file || file.user.toString() !== user.id) {
            set.status = 404;
            return {
              status: "error",
              message: "File not found",
            };
          }

          // Log the download
          await fileService.logFileAccess(id, user.id, "DOWNLOAD", {
            ipAddress: headers["x-forwarded-for"] || headers["x-real-ip"],
            userAgent: headers["user-agent"],
          });

          set.status = 200;
          return {
            status: "success",
            downloadUrl: file.url,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to generate download URL",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["files"],
          summary: "Get download URL for file",
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
          const copiedFile = await fileService.copyFile(id, user.id, name);

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
    // Get file analytics
    .get(
      "/:id/analytics",
      async ({ set, user, params, query }) => {
        try {
          const { id } = params;
          const { timeRange } = query;
          const analytics = await fileService.getFileAnalytics(
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
    // Get files with filters
    .get(
      "/filtered",
      async ({ set, user, query }) => {
        try {
          const filters: IFileFilter = {
            search: query.search,
            mimeType: query.mimeType,
            sizeFrom: query.sizeFrom
              ? Number.parseInt(query.sizeFrom, 10)
              : undefined,
            sizeTo: query.sizeTo
              ? Number.parseInt(query.sizeTo, 10)
              : undefined,
            uploadedFrom: query.uploadedFrom
              ? new Date(query.uploadedFrom)
              : undefined,
            uploadedTo: query.uploadedTo
              ? new Date(query.uploadedTo)
              : undefined,
            tags: query.tags ? query.tags.split(",") : undefined,
            isPublic:
              query.isPublic === "true"
                ? true
                : query.isPublic === "false"
                  ? false
                  : undefined,
            page: query.page ? Number.parseInt(query.page, 10) : undefined,
            limit: query.limit ? Number.parseInt(query.limit, 10) : undefined,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder as "asc" | "desc",
          };

          const result = await fileService.getFilesWithFilters(
            user.id,
            filters
          );

          set.status = 200;
          return {
            status: "success",
            items: result.files,
            total: result.total,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total: result.total,
              pages: Math.ceil(result.total / (filters.limit || 20)),
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get filtered files",
          };
        }
      },
      {
        query: t.Object({
          search: t.Optional(t.String()),
          mimeType: t.Optional(t.String()),
          sizeFrom: t.Optional(t.String()),
          sizeTo: t.Optional(t.String()),
          uploadedFrom: t.Optional(t.String()),
          uploadedTo: t.Optional(t.String()),
          tags: t.Optional(t.String()),
          isPublic: t.Optional(t.String()),
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
        }),
        detail: {
          tags: ["files"],
          summary: "Get files with advanced filters",
        },
      }
    )
);
