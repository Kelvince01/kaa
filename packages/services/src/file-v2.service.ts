/**
 * Files Service
 *
 * Comprehensive file management service with AWS S3 integration,
 * image processing, validation, analytics, and Kenya-specific features
 * Implemented for Elysia.js
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { CloudFrontClient } from "@aws-sdk/client-cloudfront";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { File, FileAnalytics, FileProcessingJob } from "@kaa/models/file.model";
import {
  FileAccessLevel,
  FileCategory,
  FileStatus,
  FileType,
  type IFile,
  // type IFileAnalytics,
  // type IFileProcessingJob,
  type IFileProcessingOptions,
  type IFileSearchQuery,
  type IFileStorageInfo,
  type IFilesResponse,
  type IFileUploadOptions,
  type IFileUsageStats,
  type IFileValidationResult,
  ImageOperation,
  KENYA_FILE_CONSTANTS,
  StorageProvider,
} from "@kaa/models/file.type";
import {
  BadRequestError,
  InternalServerError,
  logger,
  NotFoundError,
} from "@kaa/utils";
import NodeClam from "clamscan";
import * as mime from "mime-types";
import type mongoose from "mongoose";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export class FilesService {
  private readonly s3: S3Client;
  readonly cloudFront: CloudFrontClient;
  private clamScanner: NodeClam | null = null;
  private clamScannerInitialized = false;

  constructor() {
    // Initialize AWS services
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || "eu-west-1", // EU region for Kenya proximity
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.cloudFront = new CloudFrontClient({
      region: process.env.AWS_REGION || "eu-west-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    // Initialize ClamAV scanner
    this.initializeClamAV();
  }

  /**
   * Initialize ClamAV scanner
   */
  private async initializeClamAV(): Promise<void> {
    try {
      this.clamScanner = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || "localhost",
          port: Number.parseInt(process.env.CLAMAV_PORT || "3310", 10),
          timeout: 60_000,
          localFallback: true,
        },
        preference: "clamdscan",
      });
      this.clamScannerInitialized = true;
      logger.info("ClamAV scanner initialized successfully");
    } catch (error) {
      logger.warn(
        "ClamAV initialization failed, using fallback scanning:",
        error
      );
      this.clamScannerInitialized = false;
    }
  }

  // ==================== FILE UPLOAD ====================

  /**
   * Upload file with comprehensive validation and processing
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    options: IFileUploadOptions
  ): Promise<IFile> {
    try {
      // Validate file
      const validation = await this.validateFile(buffer, originalName, options);
      if (!validation.isValid) {
        throw new BadRequestError(
          `File validation failed: ${validation.errors.join(", ")}`
        );
      }

      // Generate file metadata
      const metadata = await this.extractMetadata(buffer, originalName);
      const checksum = this.generateChecksum(buffer);
      const fileName = this.generateFileName(
        originalName,
        options.organizationId
      );

      // Detect file type and category
      const mimeType = mime.lookup(originalName) || "application/octet-stream";
      const type = this.detectFileType(mimeType);
      const category =
        options.category || this.detectCategory(type, originalName);

      // Upload to S3
      const uploadResult = await this.uploadToS3(
        buffer,
        fileName,
        mimeType,
        options
      );

      // Create file record
      const fileData: Partial<IFile> = {
        originalName,
        fileName,
        mimeType,
        type,
        category,
        size: buffer.length,
        provider: StorageProvider.AWS_S3,
        bucket: uploadResult.bucket,
        key: uploadResult.key,
        url: uploadResult.url,
        cdnUrl: uploadResult.cdnUrl,
        metadata: {
          ...metadata,
          checksum,
        },
        accessLevel: options.accessLevel || FileAccessLevel.PRIVATE,
        ownerId: options.ownerId,
        organizationId: options.organizationId,
        status: FileStatus.UPLOADING,
        relatedEntityId: options.relatedEntityId,
        relatedEntityType: options.relatedEntityType,
        uploadedBy: options.uploadedBy || options.ownerId,
        uploadedAt: new Date(),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        tags: options.tags || [],
        kenyaMetadata: options.kenyaMetadata,
      };

      const file = new File(fileData);
      await file.save();

      // Start processing if needed
      if (this.shouldProcess(type, options)) {
        await this.queueProcessing(
          (file._id as mongoose.Types.ObjectId).toString(),
          options.processingOptions
        );
      } else {
        // Mark as ready if no processing needed
        await file.markAsReady();
      }

      // Update analytics
      await this.updateUploadAnalytics(file);

      return file;
    } catch (error) {
      logger.error("File upload error:", error);
      throw new InternalServerError("Failed to upload file");
    }
  }

  /**
   * Upload file to AWS S3
   */
  private async uploadToS3(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: IFileUploadOptions
  ): Promise<IFileStorageInfo> {
    const bucket = process.env.AWS_S3_BUCKET || "kaa-files";
    const key = this.generateS3Key(fileName, options);

    const metadata: Record<string, string> = {
      originalName: options.originalName || fileName,
      uploadedBy: options.uploadedBy || options.ownerId,
    };

    if (options.organizationId) {
      metadata.organizationId = options.organizationId;
    }

    const uploadParams = {
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
      ServerSideEncryption: "AES256",
      Metadata: metadata,
    };

    // Set ACL based on access level
    if (options.accessLevel === FileAccessLevel.PUBLIC) {
      Object.assign(uploadParams, { ACL: "public-read" });
    }

    // Add cache control for Kenya's network conditions
    if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
      Object.assign(uploadParams, { CacheControl: "max-age=31536000" }); // 1 year for media
    } else {
      Object.assign(uploadParams, { CacheControl: "max-age=86400" }); // 1 day for documents
    }

    const command = new PutObjectCommand(uploadParams as any);
    await this.s3.send(command);

    // Generate URLs
    const url = `https://${bucket}.s3.${process.env.AWS_REGION || "eu-west-1"}.amazonaws.com/${key}`;

    // Generate CDN URL if CloudFront is configured
    const cdnUrl = process.env.CLOUDFRONT_DOMAIN
      ? `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
      : undefined;

    return {
      provider: StorageProvider.AWS_S3,
      bucket,
      key,
      url,
      cdnUrl,
      etag: "", // In AWS SDK v3, ETag handling is different
    };
  }

  // ==================== FILE PROCESSING ====================

  /**
   * Process file (resize, convert, etc.)
   */
  async processFile(
    fileId: string,
    operations: IFileProcessingOptions[]
  ): Promise<IFile[]> {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    const results: IFile[] = [];

    for (const operation of operations) {
      try {
        const jobId = await this.queueProcessing(fileId, operation);
        const processedFile = await this.executeProcessing(file, operation);
        if (processedFile) {
          results.push(processedFile);
        }

        // Mark job as completed
        await FileProcessingJob.findByIdAndUpdate(jobId, {
          status: "completed",
          outputFileId: processedFile?.id,
          completedAt: new Date(),
          progress: 100,
        });
      } catch (error) {
        logger.error(
          `Processing error for operation ${operation.operation}:`,
          error
        );
        // Continue with other operations
      }
    }

    return results;
  }

  /**
   * Execute image processing operation
   */
  private async executeProcessing(
    file: IFile,
    options: IFileProcessingOptions
  ): Promise<IFile | null> {
    if (file.type !== FileType.IMAGE) {
      return null; // Only process images for now
    }

    try {
      // Download original file
      const originalBuffer = await this.downloadFileBuffer(file);

      let processedBuffer: Buffer;
      let outputFileName: string;
      let outputMimeType: string;

      // Apply processing based on operation
      switch (options.operation) {
        case ImageOperation.RESIZE:
          processedBuffer = await this.resizeImage(
            originalBuffer,
            options.parameters
          );
          outputFileName = this.generateProcessedFileName(
            file.fileName,
            "resized",
            options.parameters
          );
          outputMimeType = file.mimeType;
          break;

        case ImageOperation.THUMBNAIL:
          processedBuffer = await this.createThumbnail(
            originalBuffer,
            options.parameters
          );
          outputFileName = this.generateProcessedFileName(
            file.fileName,
            "thumb",
            options.parameters
          );
          outputMimeType = "image/jpeg";
          break;

        case ImageOperation.CONVERT: {
          const result = await this.convertImage(
            originalBuffer,
            options.parameters
          );
          processedBuffer = result.buffer;
          outputFileName = this.generateProcessedFileName(
            file.fileName,
            "converted",
            options.parameters
          );
          outputMimeType = result.mimeType;
          break;
        }

        case ImageOperation.OPTIMIZE:
          processedBuffer = await this.optimizeImage(
            originalBuffer,
            options.parameters
          );
          outputFileName = this.generateProcessedFileName(
            file.fileName,
            "optimized",
            options.parameters
          );
          outputMimeType = file.mimeType;
          break;

        case ImageOperation.WATERMARK:
          processedBuffer = await this.addWatermark(
            originalBuffer,
            options.parameters
          );
          outputFileName = this.generateProcessedFileName(
            file.fileName,
            "watermarked",
            options.parameters
          );
          outputMimeType = file.mimeType;
          break;

        default:
          throw new Error(`Unsupported operation: ${options.operation}`);
      }

      // Upload processed file
      const processedFile = await this.uploadFile(
        processedBuffer,
        outputFileName,
        {
          ownerId: file.ownerId,
          organizationId: file.organizationId,
          uploadedBy: file.uploadedBy,
          category: file.category,
          accessLevel: file.accessLevel,
          parentFileId: file.id.toString(),
          tags: [...(file.tags || []), `processed:${options.operation}`],
          kenyaMetadata: file.kenyaMetadata,
        }
      );

      return processedFile;
    } catch (error) {
      logger.error("Processing execution error:", error);
      throw error;
    }
  }

  // ==================== IMAGE PROCESSING OPERATIONS ====================

  /**
   * Resize image
   */
  private async resizeImage(buffer: Buffer, params: any): Promise<Buffer> {
    const { width, height, fit = "cover", withoutEnlargement = true } = params;

    return await sharp(buffer)
      .resize(width, height, {
        fit: fit as any,
        withoutEnlargement,
      })
      .toBuffer();
  }

  /**
   * Create thumbnail
   */
  private async createThumbnail(buffer: Buffer, params: any): Promise<Buffer> {
    const { size = 150, quality = 80 } = params;

    return await sharp(buffer)
      .resize(size, size, { fit: "cover" })
      .jpeg({ quality })
      .toBuffer();
  }

  /**
   * Convert image format
   */
  private async convertImage(
    buffer: Buffer,
    params: any
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const { format = "jpeg", quality = 90 } = params;

    let processor = sharp(buffer);
    let mimeType: string;

    switch (format.toLowerCase()) {
      case "jpeg":
      case "jpg":
        processor = processor.jpeg({ quality });
        mimeType = "image/jpeg";
        break;
      case "png":
        processor = processor.png({ quality });
        mimeType = "image/png";
        break;
      case "webp":
        processor = processor.webp({ quality });
        mimeType = "image/webp";
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const convertedBuffer = await processor.toBuffer();
    return { buffer: convertedBuffer, mimeType };
  }

  /**
   * Optimize image for web
   */
  private async optimizeImage(buffer: Buffer, params: any): Promise<Buffer> {
    const { quality = 85, progressive = true } = params;

    return await sharp(buffer)
      .jpeg({
        quality,
        progressive,
        mozjpeg: true,
      })
      .toBuffer();
  }

  /**
   * Add watermark to image (supports both text and image watermarks)
   */
  private async addWatermark(buffer: Buffer, params: any): Promise<Buffer> {
    const {
      type = "text", // 'text' or 'image'
      text = "Confidential",
      watermarkPath, // For image watermark
      position = "bottom-right",
      opacity = 0.5,
      fontSize = 24,
      color = "white",
      scale = 0.2, // For image watermark
    } = params;

    if (type === "image" && watermarkPath) {
      return await this.addImageWatermark(buffer, {
        watermarkPath,
        position,
        opacity,
        scale,
      });
    }

    return await this.addTextWatermark(buffer, {
      text,
      position,
      opacity,
      fontSize,
      color,
    });
  }

  /**
   * Add text watermark to image
   */
  private async addTextWatermark(
    buffer: Buffer,
    params: {
      text: string;
      position: string;
      opacity: number;
      fontSize: number;
      color: string;
    }
  ): Promise<Buffer> {
    const { text, position, opacity, fontSize, color } = params;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Calculate position coordinates
    const positions = {
      "top-left": { x: 20, y: 20 },
      "top-right": { x: (metadata.width || 0) - 200, y: 20 },
      "bottom-left": { x: 20, y: (metadata.height || 0) - 50 },
      "bottom-right": {
        x: (metadata.width || 0) - 200,
        y: (metadata.height || 0) - 50,
      },
      center: {
        x: (metadata.width || 0) / 2 - 100,
        y: (metadata.height || 0) / 2 - 25,
      },
    };

    const pos =
      positions[position as keyof typeof positions] ||
      positions["bottom-right"];

    // Create SVG text overlay
    const svgText = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text 
          x="${pos.x}" 
          y="${pos.y}" 
          font-size="${fontSize}" 
          fill="${color}" 
          opacity="${opacity}"
          font-family="Arial, sans-serif"
          font-weight="bold"
          filter="url(#shadow)"
        >${text}</text>
      </svg>
    `;

    return await image
      .composite([
        {
          input: Buffer.from(svgText),
          gravity: "northwest",
        },
      ])
      .toBuffer();
  }

  /**
   * Add image watermark to image
   */
  private async addImageWatermark(
    buffer: Buffer,
    params: {
      watermarkPath: string;
      position: string;
      opacity: number;
      scale: number;
    }
  ): Promise<Buffer> {
    const { watermarkPath, position, opacity, scale } = params;

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Position mapping for gravity
    const gravityMap = {
      "top-left": "northwest",
      "top-right": "northeast",
      "bottom-left": "southwest",
      "bottom-right": "southeast",
      center: "center",
    };

    // Load and process watermark
    const watermarkBuffer = await sharp(watermarkPath)
      .resize({
        width: Math.floor((metadata.width || 0) * scale),
        fit: "inside",
      })
      .ensureAlpha()
      .toBuffer();

    // Apply opacity to watermark
    const watermarkWithOpacity = await sharp(watermarkBuffer)
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.floor(255 * (1 - opacity))]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: "dest-in",
        },
      ])
      .toBuffer();

    return await image
      .composite([
        {
          input: watermarkWithOpacity,
          gravity:
            gravityMap[position as keyof typeof gravityMap] || "southeast",
        },
      ])
      .toBuffer();
  }

  // ==================== FILE RETRIEVAL ====================

  /**
   * Get file by ID
   */
  async getFile(fileId: string, userId: string): Promise<IFile> {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Check access permissions
    if (!this.checkAccess(file, userId)) {
      throw new BadRequestError("Access denied");
    }

    // Track view
    await file.trackAccess("view");

    return file;
  }

  /**
   * Generate presigned URL for file download
   */
  async getDownloadUrl(
    fileId: string,
    userId: string,
    expiresIn = 3600
  ): Promise<string> {
    const file = await this.getFile(fileId, userId);

    // Generate presigned URL
    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.key,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.originalName)}"`,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn });

    // Track download
    await file.trackAccess("download");

    return url;
  }

  /**
   * Search files with advanced filtering
   */
  async searchFiles(
    query: IFileSearchQuery,
    userId: string
  ): Promise<IFilesResponse> {
    const {
      search,
      type,
      category,
      status,
      ownerId,
      organizationId,
      tags,
      dateFrom,
      dateTo,
      sizeMin,
      sizeMax,
      county,
      hasGps,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = query;

    // Build query filter
    const filter: any = {};

    // Access control - user can only see their files or organization files
    if (organizationId) {
      filter.organizationId = organizationId;
    } else {
      filter.ownerId = userId;
    }

    // Apply filters
    if (search) {
      filter.$text = { $search: search };
    }

    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (category) {
      filter.category = Array.isArray(category) ? { $in: category } : category;
    }

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    } else {
      filter.status = { $ne: FileStatus.DELETED }; // Hide deleted files by default
    }

    if (ownerId) {
      filter.ownerId = ownerId;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (sizeMin || sizeMax) {
      filter.size = {};
      if (sizeMin) filter.size.$gte = sizeMin;
      if (sizeMax) filter.size.$lte = sizeMax;
    }

    // Kenya-specific filters
    if (county) {
      filter["kenyaMetadata.county"] = county;
    }

    if (hasGps !== undefined) {
      if (hasGps) {
        filter["kenyaMetadata.gpsCoordinates.latitude"] = { $exists: true };
        filter["kenyaMetadata.gpsCoordinates.longitude"] = { $exists: true };
      } else {
        filter.$or = [
          { "kenyaMetadata.gpsCoordinates.latitude": { $exists: false } },
          { "kenyaMetadata.gpsCoordinates.longitude": { $exists: false } },
        ];
      }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [files, total] = await Promise.all([
      File.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      File.countDocuments(filter).exec(),
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        type,
        category,
        status,
        tags,
        county,
        hasGps,
      },
    };
  }

  /**
   * Get files by entity
   */
  async getFilesByEntity(
    entityId: string,
    entityType: string,
    userId: string
  ): Promise<IFile[]> {
    return await File.find({
      relatedEntityId: entityId,
      relatedEntityType: entityType,
      status: { $ne: FileStatus.DELETED },
      $or: [{ ownerId: userId }, { accessLevel: FileAccessLevel.PUBLIC }],
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ==================== FILE MANAGEMENT ====================

  /**
   * Update file metadata
   */
  async updateFile(
    fileId: string,
    updates: Partial<IFile>,
    userId: string
  ): Promise<IFile> {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Check ownership
    if (file.ownerId !== userId) {
      throw new BadRequestError("Access denied");
    }

    // Apply updates
    Object.assign(file, updates);
    await file.save();

    return file;
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Check ownership
    if (file.ownerId !== userId) {
      throw new BadRequestError("Access denied");
    }

    // Soft delete
    await file.softDelete();

    // Also delete from S3 (optional - could keep for recovery)
    // await this.deleteFromS3(file.bucket, file.key);
  }

  /**
   * Permanently delete file
   */
  async permanentlyDeleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findById(fileId);
    if (!file) {
      throw new NotFoundError("File not found");
    }

    // Check ownership
    if (file.ownerId !== userId) {
      throw new BadRequestError("Access denied");
    }

    // Delete from S3
    await this.deleteFromS3(file.bucket ?? "", file.key);

    // Delete variants
    if ((file.variants?.size as any) > 0) {
      for (const [, variant] of file?.variants as any) {
        const variantKey = this.extractKeyFromUrl(variant.url);
        if (variantKey) {
          await this.deleteFromS3(file.bucket ?? "", variantKey);
        }
      }
    }

    // Delete from database
    await File.findByIdAndDelete(fileId);

    // Delete processing jobs
    await FileProcessingJob.deleteMany({ fileId });
  }

  // ==================== FILE ANALYTICS ====================

  /**
   * Get file usage statistics
   */
  async getUsageStats(
    organizationId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<IFileUsageStats> {
    const matchFilter: any = {};

    if (organizationId) {
      matchFilter.organizationId = organizationId;
    }

    if (dateFrom || dateTo) {
      matchFilter.createdAt = {};
      if (dateFrom) matchFilter.createdAt.$gte = dateFrom;
      if (dateTo) matchFilter.createdAt.$lte = dateTo;
    }

    const stats = await File.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: "$size" },
          totalDownloads: { $sum: "$downloadCount" },
          totalViews: { $sum: "$viewCount" },
          typeDistribution: {
            $push: "$type",
          },
          categoryDistribution: {
            $push: "$category",
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalFiles: 1,
          totalSize: 1,
          totalDownloads: 1,
          totalViews: 1,
          averageSize: { $divide: ["$totalSize", "$totalFiles"] },
          typeDistribution: 1,
          categoryDistribution: 1,
        },
      },
    ]);

    return (
      stats[0] || {
        totalFiles: 0,
        totalSize: 0,
        totalDownloads: 0,
        totalViews: 0,
        averageSize: 0,
        typeDistribution: [],
        categoryDistribution: [],
      }
    );
  }

  /**
   * Update daily analytics
   */
  private async updateUploadAnalytics(file: IFile): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let analytics = await FileAnalytics.findOne({ date: today });

    if (!analytics) {
      analytics = new FileAnalytics({
        date: today,
        totalUploads: 0,
        totalUploadSize: 0,
        uploadsByType: new Map(),
        uploadsByCategory: new Map(),
        kenyaMetrics: {
          uploadsWithGps: 0,
          uploadsByCounty: new Map(),
          mobileUploads: 0,
          averageFileSize: 0,
        },
      });
    }

    // Update metrics
    analytics.totalUploads += 1;
    analytics.totalUploadSize += file.size;

    // Update type distribution
    const typeCount = analytics.uploadsByType.get(file.type) || 0;
    analytics.uploadsByType.set(file.type, typeCount + 1);

    // Update category distribution
    const categoryCount = analytics.uploadsByCategory.get(file.category) || 0;
    analytics.uploadsByCategory.set(file.category, categoryCount + 1);

    // Update Kenya-specific metrics
    if (file.hasGpsData?.()) {
      analytics.kenyaMetrics.uploadsWithGps += 1;
    }

    if (file.kenyaMetadata?.county) {
      const countyCount =
        analytics.kenyaMetrics.uploadsByCounty?.get(
          file.kenyaMetadata.county
        ) || 0;
      analytics.kenyaMetrics.uploadsByCounty?.set(
        file.kenyaMetadata.county,
        countyCount + 1
      );
    }

    // Check if mobile upload (basic heuristic)
    if (
      file.userAgent &&
      (file.userAgent.includes("Mobile") ||
        file.userAgent.includes("Android") ||
        file.userAgent.includes("iPhone"))
    ) {
      analytics.kenyaMetrics.mobileUploads += 1;
    }

    await analytics.save();
    await analytics.calculateAverageFileSize();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate file upload
   */
  private async validateFile(
    buffer: Buffer,
    fileName: string,
    _options: IFileUploadOptions
  ): Promise<IFileValidationResult> {
    const errors: string[] = [];

    // Check file size
    if (buffer.length > KENYA_FILE_CONSTANTS.MAX_FILE_SIZE) {
      errors.push(
        `File size exceeds maximum allowed (${KENYA_FILE_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB)`
      );
    }

    if (buffer.length < KENYA_FILE_CONSTANTS.MIN_FILE_SIZE) {
      errors.push(
        `File size below minimum required (${KENYA_FILE_CONSTANTS.MIN_FILE_SIZE} bytes)`
      );
    }

    // Check file extension
    const extension = path.extname(fileName).toLowerCase();
    if (!KENYA_FILE_CONSTANTS.ALLOWED_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' not allowed`);
    }

    // Check MIME type
    const mimeType = mime.lookup(fileName);
    if (
      mimeType &&
      !KENYA_FILE_CONSTANTS.ALLOWED_MIME_TYPES.includes(mimeType)
    ) {
      errors.push(`MIME type '${mimeType}' not allowed`);
    }

    // Scan for malware (placeholder - would integrate with actual scanner)
    const malwareCheck = await this.scanForMalware(buffer);
    if (!malwareCheck.clean) {
      errors.push("File failed security scan");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: malwareCheck.warnings || [],
    };
  }

  /**
   * Extract file metadata
   */
  private async extractMetadata(
    buffer: Buffer,
    fileName: string
  ): Promise<any> {
    const mimeType = mime.lookup(fileName);
    const metadata: any = {};

    try {
      if ((mimeType as string)?.startsWith("image/")) {
        // Extract image metadata using sharp
        const imageInfo = await sharp(buffer).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        metadata.format = imageInfo.format;
        metadata.colorSpace = imageInfo.space;
        metadata.hasAlpha = imageInfo.hasAlpha;
        metadata.orientation = imageInfo.orientation;
        metadata.exif = imageInfo.exif;
      }
    } catch (error) {
      logger.error("Metadata extraction error:", error);
    }

    return metadata;
  }

  /**
   * Generate secure checksum
   */
  private generateChecksum(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Generate unique filename
   */
  private generateFileName(
    originalName: string,
    organizationId?: string
  ): string {
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const timestamp = Date.now();
    const uuid = uuidv4();

    const prefix = organizationId ? `${organizationId}_` : "";
    return `${prefix}${timestamp}_${uuid}${extension}`;
  }

  /**
   * Generate S3 key with proper structure
   */
  private generateS3Key(fileName: string, options: IFileUploadOptions): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const day = String(new Date().getDate()).padStart(2, "0");

    const orgPrefix = options.organizationId
      ? `orgs/${options.organizationId}/`
      : "users/";
    const datePath = `${year}/${month}/${day}`;

    return `${orgPrefix}${datePath}/${fileName}`;
  }

  /**
   * Detect file type from MIME type
   */
  private detectFileType(mimeType: string): FileType {
    if (mimeType.startsWith("image/")) return FileType.IMAGE;
    if (mimeType.startsWith("video/")) return FileType.VIDEO;
    if (mimeType.startsWith("audio/")) return FileType.AUDIO;
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text")
    ) {
      return FileType.DOCUMENT;
    }
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("tar")
    ) {
      return FileType.ARCHIVE;
    }
    return FileType.OTHER;
  }

  /**
   * Detect file category
   */
  private detectCategory(type: FileType, fileName: string): FileCategory {
    const lowerName = fileName.toLowerCase();

    if (type === FileType.IMAGE) {
      if (lowerName.includes("avatar") || lowerName.includes("profile")) {
        return FileCategory.AVATAR;
      }
      if (lowerName.includes("logo") || lowerName.includes("brand")) {
        return FileCategory.LOGO;
      }
      return FileCategory.IMAGE;
    }

    if (type === FileType.DOCUMENT) {
      if (lowerName.includes("contract") || lowerName.includes("agreement")) {
        return FileCategory.CONTRACT;
      }
      if (lowerName.includes("report") || lowerName.includes("analysis")) {
        return FileCategory.REPORT;
      }
      return FileCategory.DOCUMENT;
    }

    return FileCategory.OTHER;
  }

  /**
   * Check if file should be processed
   */
  private shouldProcess(type: FileType, options: IFileUploadOptions): boolean {
    return type === FileType.IMAGE && !!options.processingOptions;
  }

  /**
   * Queue processing job
   */
  private async queueProcessing(
    fileId: string,
    options?: IFileProcessingOptions
  ): Promise<string> {
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
  }

  /**
   * Check file access permissions
   */
  private checkAccess(file: IFile, userId: string): boolean {
    // Owner can always access
    if (file.ownerId === userId) return true;

    // Public files are accessible
    if (file.accessLevel === FileAccessLevel.PUBLIC) return true;

    // Organization members can access organization files (simplified check)
    if (
      file.organizationId &&
      file.accessLevel === FileAccessLevel.ORGANIZATION
    ) {
      // Would check user's organization membership here
      return true;
    }

    return false;
  }

  /**
   * Download file buffer from S3
   */
  private async downloadFileBuffer(file: IFile): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: file.bucket,
      Key: file.key,
    });

    const response = await this.s3.send(command);

    // Convert stream to buffer
    return Buffer.concat(await this.streamToBuffer(response.Body as any));
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(
    stream: NodeJS.ReadableStream
  ): Promise<Buffer[]> {
    return await new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", reject);
      stream.on("end", () => resolve(chunks));
    });
  }

  /**
   * Delete file from S3
   */
  private async deleteFromS3(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3.send(command);
  }

  /**
   * Extract S3 key from URL
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch {
      return null;
    }
  }

  /**
   * Generate processed filename
   */
  private generateProcessedFileName(
    originalFileName: string,
    suffix: string,
    params: any
  ): string {
    const extension = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, extension);
    const paramString = Object.values(params).join("x");

    return `${baseName}_${suffix}_${paramString}${extension}`;
  }

  /**
   * Comprehensive malware scanning with ClamAV
   */
  private async scanForMalware(
    buffer: Buffer
  ): Promise<{ clean: boolean; warnings: string[]; threats?: string[] }> {
    const warnings: string[] = [];
    let threats: string[] = [];

    // 1. Quick heuristic checks first
    const heuristicResult = await this.performHeuristicScan(buffer);
    warnings.push(...heuristicResult.warnings);

    // 2. ClamAV scan if available
    if (this.clamScannerInitialized && this.clamScanner) {
      try {
        const clamResult = await this.performClamAVScan(buffer);
        if (!clamResult.clean) {
          warnings.push("Malware detected by ClamAV");
          threats = clamResult.threats || [];
        }
      } catch (error) {
        logger.error("ClamAV scan error:", error);
        warnings.push("Antivirus scan failed - treating as suspicious");
      }
    } else {
      // Fallback to enhanced heuristic scanning
      logger.warn("ClamAV not available, using heuristic scanning only");
    }

    return {
      clean: warnings.length === 0 && threats.length === 0,
      warnings,
      threats: threats.length > 0 ? threats : undefined,
    };
  }

  /**
   * Perform ClamAV scan on buffer
   */
  private async performClamAVScan(
    buffer: Buffer
  ): Promise<{ clean: boolean; threats?: string[] }> {
    // Write buffer to temporary file (ClamAV requires file path)
    const tempPath = `/tmp/scan_${uuidv4()}`;

    try {
      await fs.writeFile(tempPath, buffer);

      const { isInfected, viruses } = await (
        this.clamScanner as NodeClam
      ).scanFile(tempPath);

      return {
        clean: !isInfected,
        threats: viruses && viruses.length > 0 ? viruses : undefined,
      };
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (error) {
        logger.warn("Failed to delete temp scan file:", error);
      }
    }
  }

  /**
   * Perform heuristic malware scanning
   */
  private async performHeuristicScan(
    buffer: Buffer
  ): Promise<{ warnings: string[] }> {
    const warnings: string[] = [];

    // 1. Check file signatures
    const header = buffer.slice(0, 20).toString("hex");

    const suspiciousSignatures = {
      "4d5a": "PE Executable",
      "7f454c46": "ELF Executable",
      "213c617263683e": "Unix Archive",
      cafebabe: "Java Class File",
      feedface: "Mach-O Binary",
      "504b0304": "ZIP Archive (potential script)",
    };

    for (const [sig, threat] of Object.entries(suspiciousSignatures)) {
      if (header.startsWith(sig)) {
        warnings.push(`Suspicious file signature: ${threat}`);
        break;
      }
    }

    // 2. Content analysis for script injections
    const sampleSize = Math.min(buffer.length, 10_000);
    const content = buffer.toString("utf8", 0, sampleSize);

    const scriptPatterns = [
      { pattern: /<script[^>]*>[\s\S]*?<\/script>/gi, name: "Script tags" },
      { pattern: /javascript:/gi, name: "JavaScript protocol" },
      { pattern: /on\w+\s*=/gi, name: "Event handlers" },
      { pattern: /eval\s*\(/gi, name: "Eval function" },
      { pattern: /document\.write/gi, name: "Document.write" },
      { pattern: /iframe/gi, name: "Iframe injection" },
    ];

    for (const { pattern, name } of scriptPatterns) {
      if (pattern.test(content)) {
        warnings.push(`Potential script injection: ${name}`);
        break;
      }
    }

    // 3. Check for obfuscation (high entropy)
    const entropy = this.calculateEntropy(buffer.slice(0, 1024));
    if (entropy > 7.5) {
      warnings.push("High entropy detected - possible encryption/obfuscation");
    }

    // 4. Size anomaly check
    if (buffer.length > 100 * 1024 * 1024) {
      // 100MB
      warnings.push("Unusually large file size");
    }

    // 5. Check for null bytes in text files (potential binary injection)
    if (content.includes("\0")) {
      warnings.push("Null bytes detected in file content");
    }

    return await Promise.resolve({ warnings });
  }

  /**
   * Calculate Shannon entropy for buffer
   */
  private calculateEntropy(buffer: Buffer): number {
    const freq = new Map<number, number>();

    for (const byte of buffer) {
      freq.set(byte, (freq.get(byte) || 0) + 1);
    }

    let entropy = 0;
    const len = buffer.length;

    for (const count of freq.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }
}

export const filesV2Service = new FilesService();
