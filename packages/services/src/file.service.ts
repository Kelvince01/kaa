import { File, FileAccessLog, FileProcessingJob } from "@kaa/models";
import type {
  IBulkFileOperation,
  IFile,
  IFileAnalytics,
  IFileFilter,
  IFileListResponse,
  IFileProcessingOptions,
  IFileStats,
  IFileUploadOptions,
} from "@kaa/models/types";
import { FileCategory, FileType } from "@kaa/models/types";
import mongoose, { type FilterQuery } from "mongoose";

/**
 * Get files
 */
export const getFiles = async ({
  userId,
  filters,
}: {
  userId?: string;
  filters?: IFileFilter;
}): Promise<IFileListResponse> => {
  try {
    const query: FilterQuery<IFile> = {};
    if (userId) {
      query.user = userId;
    }
    if (filters?.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }
    if (filters?.mimeType) {
      query.mimeType = { $regex: filters.mimeType, $options: "i" };
    }
    if (filters?.tags) {
      query.tags = { $in: filters.tags };
    }
    if (filters?.isPublic) {
      query.isPublic = filters.isPublic;
    }
    if (filters?.sizeFrom) {
      query.size = { $gte: filters.sizeFrom };
    }
    if (filters?.sizeTo) {
      query.size = { $lte: filters.sizeTo };
    }
    if (filters?.uploadedFrom) {
      query.createdAt = { $gte: filters.uploadedFrom };
    }
    if (filters?.uploadedTo) {
      query.createdAt = { $lte: filters.uploadedTo };
    }
    if (filters?.sortBy) {
      query.createdAt = { $sort: filters.sortBy };
    }
    if (filters?.sortOrder) {
      query.createdAt = { $sort: filters.sortOrder };
    }

    const files = await File.find(query)
      .sort({
        [filters?.sortBy || "createdAt"]: filters?.sortOrder === "asc" ? 1 : -1,
      })
      .skip((filters?.page || 1) - 1)
      .limit(filters?.limit || 10);
    const total = await File.countDocuments(query);
    const pages = Math.ceil(total / (filters?.limit || 10));

    return {
      files: files.map((file) => ({
        ...file.toObject(),
        _id: (file._id as mongoose.Types.ObjectId)?.toString(),
      })) as any,
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        total,
        pages,
      },
      status: "success",
      message: "Files fetched successfully",
    };
  } catch (error) {
    console.error(`Error getting files: ${error}`);
    return {
      files: [] as any,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      },
      status: "error",
      message: "Failed to fetch files",
    };
  }
};

/**
 * Get files by user ID
 */
export const getFilesByUserId = async (userId: string): Promise<IFile[]> => {
  try {
    return await File.find({ user: userId });
  } catch (error) {
    console.error(`Error getting files by user ID: ${error}`);
    return [];
  }
};

// Get file by ID
export const getFileById = async (fileId: string): Promise<IFile | null> => {
  try {
    return await File.findById(fileId);
  } catch (error) {
    console.error(`Error getting file by ID: ${error}`);
    return null;
  }
};

// Create a new file
export const createFile = async (fileData: Partial<IFile>): Promise<IFile> => {
  try {
    const newFile = new File(fileData);
    return await newFile.save();
  } catch (error) {
    console.error(`Error creating file: ${error}`);
    throw new Error("Failed to create file metadata");
  }
};

// Update file
export const updateFile = async (
  fileId: string,
  updateData: Partial<IFile>
): Promise<IFile> => {
  try {
    const updatedFile = await File.findByIdAndUpdate(fileId, updateData, {
      new: true,
    });
    if (!updatedFile) {
      throw new Error("File not found after update");
    }
    return updatedFile;
  } catch (error) {
    console.error(`Error updating file: ${error}`);
    throw new Error("Failed to update file metadata");
  }
};

// Delete file
export const deleteFile = async (fileId: string): Promise<boolean> => {
  try {
    const result = await File.findByIdAndDelete(fileId);
    return !!result;
  } catch (error) {
    console.error(`Error deleting file: ${error}`);
    throw new Error("Failed to delete file metadata");
  }
};

// Search files
export const searchFiles = async (
  userId: string,
  query: string,
  options: { limit?: number; skip?: number } = {}
): Promise<{ files: IFile[]; total: number }> => {
  try {
    const filter: FilterQuery<IFile> = {
      user: new mongoose.Types.ObjectId(userId),
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    };

    const [files, total] = await Promise.all([
      File.find(filter)
        .sort({ createdAt: -1 })
        .skip(options.skip || 0)
        .limit(options.limit || 50),
      File.countDocuments(filter),
    ]);

    return { files, total };
  } catch (error) {
    console.error(`Error searching files: ${error}`);
    return { files: [], total: 0 };
  }
};

// Get files with filters and pagination
export const getFilesWithFilters = async (
  userId: string,
  filters: IFileFilter
): Promise<{ files: IFile[]; total: number; summary?: any }> => {
  try {
    const query: FilterQuery<IFile> = {
      user: new mongoose.Types.ObjectId(userId),
    };

    // Apply filters
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    if (filters.mimeType) {
      query.mimeType = { $regex: filters.mimeType, $options: "i" };
    }

    if (filters.sizeFrom || filters.sizeTo) {
      query.size = {};
      if (filters.sizeFrom) query.size.$gte = filters.sizeFrom;
      if (filters.sizeTo) query.size.$lte = filters.sizeTo;
    }

    if (filters.uploadedFrom || filters.uploadedTo) {
      query.createdAt = {};
      if (filters.uploadedFrom) query.createdAt.$gte = filters.uploadedFrom;
      if (filters.uploadedTo) query.createdAt.$lte = filters.uploadedTo;
    }

    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters.isPublic !== undefined) {
      query.isPublic = filters.isPublic;
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      File.find(query)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate("user", "name email"),
      File.countDocuments(query),
    ]);

    return { files, total };
  } catch (error) {
    console.error(`Error getting files with filters: ${error}`);
    return { files: [], total: 0 };
  }
};

// Get file statistics
export const getFileStats = async (userId: string): Promise<IFileStats> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      totalStats,
      categoryStats,
      mimeTypeStats,
      uploaderStats,
      recentUploads,
      mostDownloaded,
    ] = await Promise.all([
      // Total files and size
      File.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalSize: { $sum: "$size" },
            avgFileSize: { $avg: "$size" },
          },
        },
      ]),

      // By category
      File.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: {
                      $regexMatch: { input: "$mimeType", regex: "^image/" },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "image",
                  },
                  {
                    case: {
                      $regexMatch: { input: "$mimeType", regex: "^video/" },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "video",
                  },
                  {
                    case: {
                      $regexMatch: { input: "$mimeType", regex: "^audio/" },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "audio",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$mimeType",
                        regex: "^application/pdf",
                      },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "document",
                  },
                  {
                    case: {
                      $regexMatch: { input: "$mimeType", regex: "zip|rar|tar" },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "archive",
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: "$mimeType",
                        regex: "javascript|json|xml",
                      },
                    },
                    // biome-ignore lint/suspicious/noThenProperty: false positive
                    then: "code",
                  },
                ],
                default: "other",
              },
            },
            count: { $sum: 1 },
            size: { $sum: "$size" },
          },
        },
      ]),

      // By mime type
      File.aggregate([
        { $match: { user: userObjectId } },
        {
          $group: {
            _id: "$mimeType",
            count: { $sum: 1 },
            size: { $sum: "$size" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // By uploader
      File.aggregate([
        { $match: { user: userObjectId } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $group: {
            _id: "$user",
            userName: { $first: "$userInfo.name" },
            count: { $sum: 1 },
            size: { $sum: "$size" },
          },
        },
      ]),

      // Recent uploads (last 7 days)
      File.find({
        user: userObjectId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id name createdAt"),

      // Most downloaded
      File.find({ user: userObjectId })
        .sort({ downloadCount: -1 })
        .limit(10)
        .select("_id name downloadCount"),
    ]);

    const stats = totalStats[0] || { total: 0, totalSize: 0, avgFileSize: 0 };

    return {
      total: stats.total,
      totalSize: stats.totalSize,
      avgFileSize: stats.avgFileSize,
      byCategory: categoryStats.map((cat: any) => ({
        category: cat._id,
        count: cat.count,
        size: cat.size,
      })),
      byMimeType: mimeTypeStats.map((mime: any) => ({
        mimeType: mime._id,
        count: mime.count,
        size: mime.size,
      })),
      byStatus: [], // Can be implemented based on requirements
      byUploader: uploaderStats.map((uploader: any) => ({
        userId: uploader._id.toString(),
        userName: uploader.userName || "Unknown",
        count: uploader.count,
        size: uploader.size,
      })),
      byDate: [], // Can be implemented for date-based analytics
      mostDownloaded: mostDownloaded.map((file: any) => ({
        fileId: file._id.toString(),
        fileName: file.name,
        downloadCount: file.downloadCount || 0,
      })),
      recentUploads: recentUploads.map((file: any) => ({
        fileId: file._id.toString(),
        fileName: file.name,
        uploadedAt: file.createdAt,
      })),
    };
  } catch (error) {
    console.error(`Error getting file stats: ${error}`);
    throw new Error("Failed to get file statistics");
  }
};

// Bulk file operations
export const bulkFileOperation = async (
  userId: string,
  operation: IBulkFileOperation
): Promise<{ success: boolean; message: string; results?: any }> => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const fileIds = operation.fileIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Verify all files belong to the user
    const userFiles = await File.find({
      _id: { $in: fileIds },
      user: userObjectId,
    });

    if (userFiles.length !== fileIds.length) {
      return {
        success: false,
        message: "Some files not found or access denied",
      };
    }

    let result: any;

    switch (operation.operation) {
      case "DELETE":
        result = await File.deleteMany({
          _id: { $in: fileIds },
          user: userObjectId,
        });
        return {
          success: true,
          message: `${result.deletedCount} files deleted`,
          results: { deletedCount: result.deletedCount },
        };

      case "UPDATE_ACCESS": {
        const isPublic = operation.parameters?.isPublic;
        result = await File.updateMany(
          { _id: { $in: fileIds }, user: userObjectId },
          { $set: { isPublic } }
        );
        return {
          success: true,
          message: `${result.modifiedCount} files updated`,
          results: { modifiedCount: result.modifiedCount },
        };
      }

      case "ARCHIVE":
        // For now, just mark as archived (you can add an archived field)
        result = await File.updateMany(
          { _id: { $in: fileIds }, user: userObjectId },
          { $set: { archived: true } }
        );
        return {
          success: true,
          message: `${result.modifiedCount} files archived`,
          results: { modifiedCount: result.modifiedCount },
        };

      default:
        return {
          success: false,
          message: "Operation not supported",
        };
    }
  } catch (error) {
    console.error(`Error in bulk operation: ${error}`);
    return {
      success: false,
      message: "Bulk operation failed",
    };
  }
};

// Share file
export const shareFile = async (
  fileId: string,
  userId: string,
  settings: { isPublic: boolean; allowDownload?: boolean; expiresAt?: Date }
): Promise<{ success: boolean; shareUrl?: string; message?: string }> => {
  try {
    const file = await File.findOne({
      _id: new mongoose.Types.ObjectId(fileId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!file) {
      return { success: false, message: "File not found" };
    }

    const shareToken = new mongoose.Types.ObjectId().toString();
    const shareUrl = `${process.env.APP_URL}/shared/${shareToken}`;

    await File.updateOne(
      { _id: file._id },
      {
        $set: {
          "sharing.isPublic": settings.isPublic,
          "sharing.allowDownload": settings.allowDownload ?? true,
          "sharing.expiresAt": settings.expiresAt,
          "sharing.shareToken": shareToken,
          "sharing.shareLink": shareUrl,
        },
      }
    );

    return { success: true, shareUrl };
  } catch (error) {
    console.error(`Error sharing file: ${error}`);
    return { success: false, message: "Failed to share file" };
  }
};

// Get shared file
export const getSharedFile = async (
  shareToken: string
): Promise<IFile | null> => {
  try {
    const file = await File.findOne({
      "sharing.shareToken": shareToken,
      "sharing.isPublic": true,
    }).populate("user", "name");

    // Check if share link is expired
    if (file?.sharing?.expiresAt && file.sharing.expiresAt < new Date()) {
      return null;
    }

    return file;
  } catch (error) {
    console.error(`Error getting shared file: ${error}`);
    return null;
  }
};

// Log file access
export const logFileAccess = async (
  fileId: string,
  userId: string,
  action: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<void> => {
  try {
    await FileAccessLog.create({
      fileId: new mongoose.Types.ObjectId(fileId),
      userId: new mongoose.Types.ObjectId(userId),
      action,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata,
    });

    // Update file access statistics
    if (action === "DOWNLOAD") {
      await File.updateOne(
        { _id: new mongoose.Types.ObjectId(fileId) },
        {
          $inc: { downloadCount: 1 },
          $set: { lastAccessedAt: new Date() },
        }
      );
    }
  } catch (error) {
    console.error(`Error logging file access: ${error}`);
    // Don't throw - logging shouldn't break the main operation
  }
};

// Get file analytics
export const getFileAnalytics = async (
  fileId: string,
  userId: string,
  timeRange: "7d" | "30d" | "90d" = "30d"
): Promise<IFileAnalytics | null> => {
  try {
    const file = await File.findOne({
      _id: new mongoose.Types.ObjectId(fileId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!file) return null;

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await FileAccessLog.find({
      fileId: new mongoose.Types.ObjectId(fileId),
      accessedAt: { $gte: startDate },
    });

    const views = logs.filter((log) => log.action === "VIEW").length;
    const downloads = logs.filter((log) => log.action === "DOWNLOAD").length;
    const shares = logs.filter((log) => log.action === "SHARE").length;
    const uniqueViewers = new Set(logs.map((log) => log.userId.toString()))
      .size;

    return {
      fileId,
      views,
      downloads,
      shares,
      uniqueViewers,
      viewsByDate: [], // Can be implemented for detailed date analytics
      downloadsByDate: [], // Can be implemented for detailed date analytics
      topReferrers: [], // Can be implemented if tracking referrers
      topCountries: [], // Can be implemented if tracking geo data
      avgViewDuration: 0, // Can be implemented if tracking view duration
    };
  } catch (error) {
    console.error(`Error getting file analytics: ${error}`);
    return null;
  }
};

// Copy file
export const copyFile = async (
  fileId: string,
  userId: string,
  newName?: string
): Promise<IFile | null> => {
  try {
    const originalFile = await File.findOne({
      _id: new mongoose.Types.ObjectId(fileId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!originalFile) return null;

    const copiedFile = new File({
      ...originalFile.toObject(),
      _id: new mongoose.Types.ObjectId(),
      name: newName || `Copy of ${originalFile.name}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      downloadCount: 0,
      sharing: undefined, // Reset sharing settings for copy
      versions: [], // Reset versions for copy
    });

    return await copiedFile.save();
  } catch (error) {
    console.error(`Error copying file: ${error}`);
    return null;
  }
};

/**
 * Detect file category
 */
export const detectCategory = (
  type: FileType,
  fileName: string
): FileCategory => {
  const lowerName = fileName.toLowerCase();

  if (type === FileType.IMAGE) {
    if (lowerName.includes("avatar") || lowerName.includes("profile")) {
      return FileCategory.USER_AVATAR;
    }
    if (lowerName.includes("logo") || lowerName.includes("brand")) {
      return FileCategory.PROPERTY_PHOTOS;
    }
    return FileCategory.PROPERTY_PHOTOS;
  }

  // if (type === FileType.DOCUMENT) {
  //   if (lowerName.includes('contract') || lowerName.includes('agreement')) {
  //     return FileCategory.CONTRACT_DOCS;
  //   }
  //   if (lowerName.includes('report') || lowerName.includes('analysis')) {
  //     return FileCategory.REPORT;
  //   }
  //   return FileCategory.DOCUMENT;
  // }

  return FileCategory.OTHER_DOCS;
};

/**
 * Check if file should be processed
 */
export const shouldProcess = (
  type: FileType,
  options: IFileUploadOptions
): boolean => type === FileType.IMAGE && !!options.processingOptions;

/**
 * Queue processing job
 */
export const queueProcessing = async (
  fileId: string,
  options?: IFileProcessingOptions
): Promise<string> => {
  if (!options) return "";

  const job = new FileProcessingJob({
    fileId,
    operation: options.operation,
    parameters: options.parameters,
    priority: options.priority || "normal",
    status: "pending",
  });

  await job.save();
  return (job._id as mongoose.Types.ObjectId).toString();
};

/**
 * Check file access permissions
 */
export const checkAccess = (_file: IFile, _userId: string): boolean => {
  // Owner can always access
  // if (file.ownerId === userId) return true;

  // Public files are accessible
  // if (file.accessLevel === FileAccessLevel.PUBLIC) return true;

  // Organization members can access organization files (simplified check)
  // if (file.organizationId && file.accessLevel === FileAccessLevel.ORGANIZATION) {
  // Would check user's organization membership here
  //   return true;
  // }

  return false;
};
