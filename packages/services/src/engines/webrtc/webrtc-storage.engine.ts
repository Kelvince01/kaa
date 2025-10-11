import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";

export type StorageProvider = "local" | "s3" | "gcs" | "vercel-blob";

export type StorageConfig = {
  provider: StorageProvider;
  local?: {
    basePath: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
  };
  gcs?: {
    bucket: string;
    projectId?: string;
    keyFilename?: string;
    credentials?: any;
  };
  vercelBlob?: {
    token: string;
  };
};

export type UploadOptions = {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  cacheControl?: string;
};

export type UploadResult = {
  url: string;
  key: string;
  size: number;
  etag?: string;
  provider: StorageProvider;
};

/**
 * Unified Storage Engine
 * Supports local, S3, GCS, and Vercel Blob storage
 */
export class WebRTCStorageEngine extends EventEmitter {
  private readonly config: StorageConfig;

  constructor(config: StorageConfig) {
    super();
    this.config = config;
    this.validateConfig();
  }

  /**
   * Validate storage configuration
   */
  private validateConfig(): void {
    const { provider } = this.config;

    switch (provider) {
      case "local":
        if (!this.config.local?.basePath) {
          throw new Error("Local storage requires basePath");
        }
        break;
      case "s3":
        if (!(this.config.s3?.bucket && this.config.s3?.region)) {
          throw new Error("S3 storage requires bucket and region");
        }
        break;
      case "gcs":
        if (!this.config.gcs?.bucket) {
          throw new Error("GCS storage requires bucket");
        }
        break;
      case "vercel-blob":
        if (!this.config.vercelBlob?.token) {
          throw new Error("Vercel Blob storage requires token");
        }
        break;
      default:
        throw new Error(`Unsupported storage provider: ${provider}`);
    }
  }

  /**
   * Upload file from local path
   */
  async uploadFile(
    localPath: string,
    destinationKey: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { provider } = this.config;

    this.emit("uploadstart", { localPath, destinationKey, provider });

    try {
      let result: UploadResult;

      switch (provider) {
        case "local":
          result = await this.uploadToLocal(localPath, destinationKey, options);
          break;
        case "s3":
          result = await this.uploadToS3(localPath, destinationKey, options);
          break;
        case "gcs":
          result = await this.uploadToGCS(localPath, destinationKey, options);
          break;
        case "vercel-blob":
          result = await this.uploadToVercelBlob(
            localPath,
            destinationKey,
            options
          );
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      this.emit("uploadcomplete", result);
      return result;
    } catch (error) {
      this.emit("uploaderror", { localPath, destinationKey, error });
      throw error;
    }
  }

  /**
   * Upload buffer directly
   */
  async uploadBuffer(
    buffer: Buffer,
    destinationKey: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { provider } = this.config;

    this.emit("uploadstart", { destinationKey, provider, size: buffer.length });

    try {
      let result: UploadResult;

      switch (provider) {
        case "local":
          result = await this.uploadBufferToLocal(
            buffer,
            destinationKey,
            options
          );
          break;
        case "s3":
          result = await this.uploadBufferToS3(buffer, destinationKey, options);
          break;
        case "gcs":
          result = await this.uploadBufferToGCS(
            buffer,
            destinationKey,
            options
          );
          break;
        case "vercel-blob":
          result = await this.uploadBufferToVercelBlob(
            buffer,
            destinationKey,
            options
          );
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      this.emit("uploadcomplete", result);
      return result;
    } catch (error) {
      this.emit("uploaderror", { destinationKey, error });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(key: string): Promise<void> {
    const { provider } = this.config;

    try {
      switch (provider) {
        case "local":
          await this.deleteFromLocal(key);
          break;
        case "s3":
          await this.deleteFromS3(key);
          break;
        case "gcs":
          await this.deleteFromGCS(key);
          break;
        case "vercel-blob":
          await this.deleteFromVercelBlob(key);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      this.emit("deletecomplete", { key, provider });
    } catch (error) {
      this.emit("deleteerror", { key, error });
      throw error;
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(key: string): string {
    const { provider } = this.config;

    switch (provider) {
      case "local":
        return `file://${this.config.local?.basePath}/${key}`;
      case "s3":
        return `https://${this.config.s3?.bucket}.s3.${this.config.s3?.region}.amazonaws.com/${key}`;
      case "gcs":
        return `https://storage.googleapis.com/${this.config.gcs?.bucket}/${key}`;
      case "vercel-blob":
        return `https://vercel.blob.store/${key}`;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  // Local Storage Implementation
  private async uploadToLocal(
    localPath: string,
    destinationKey: string,
    _options: UploadOptions
  ): Promise<UploadResult> {
    const basePath = this.config.local?.basePath || "";
    const destPath = `${basePath}/${destinationKey}`;

    await fs.mkdir(destPath.substring(0, destPath.lastIndexOf("/")), {
      recursive: true,
    });
    await fs.copyFile(localPath, destPath);

    const stats = await fs.stat(destPath);

    return {
      url: `file://${destPath}`,
      key: destinationKey,
      size: stats.size,
      provider: "local",
    };
  }

  private async uploadBufferToLocal(
    buffer: Buffer,
    destinationKey: string,
    _options: UploadOptions
  ): Promise<UploadResult> {
    const basePath = this.config.local?.basePath || "";
    const destPath = `${basePath}/${destinationKey}`;

    await fs.mkdir(destPath.substring(0, destPath.lastIndexOf("/")), {
      recursive: true,
    });
    await fs.writeFile(destPath, buffer);

    return {
      url: `file://${destPath}`,
      key: destinationKey,
      size: buffer.length,
      provider: "local",
    };
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const basePath = this.config.local?.basePath || "";
    const filePath = `${basePath}/${key}`;
    await fs.unlink(filePath);
  }

  // S3 Storage Implementation
  private async uploadToS3(
    localPath: string,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: this.config.s3?.region || "",
      credentials: this.config.s3?.accessKeyId
        ? {
            accessKeyId: this.config.s3.accessKeyId,
            secretAccessKey: this.config.s3.secretAccessKey || "",
          }
        : undefined,
      endpoint: this.config.s3?.endpoint,
    });

    const fileContent = await fs.readFile(localPath);
    const stats = await fs.stat(localPath);

    const command = new PutObjectCommand({
      Bucket: this.config.s3?.bucket || "",
      Key: destinationKey,
      Body: fileContent,
      ContentType: options.contentType,
      Metadata: options.metadata,
      CacheControl: options.cacheControl,
      ACL: options.public ? "public-read" : "private",
    });

    const response = await s3Client.send(command);

    return {
      url: this.getFileUrl(destinationKey),
      key: destinationKey,
      size: stats.size,
      etag: response.ETag,
      provider: "s3",
    };
  }

  private async uploadBufferToS3(
    buffer: Buffer,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: this.config.s3?.region || "",
      credentials: this.config.s3?.accessKeyId
        ? {
            accessKeyId: this.config.s3.accessKeyId,
            secretAccessKey: this.config.s3.secretAccessKey || "",
          }
        : undefined,
      endpoint: this.config.s3?.endpoint,
    });

    const command = new PutObjectCommand({
      Bucket: this.config.s3?.bucket || "",
      Key: destinationKey,
      Body: buffer,
      ContentType: options.contentType,
      Metadata: options.metadata,
      CacheControl: options.cacheControl,
      ACL: options.public ? "public-read" : "private",
    });

    const response = await s3Client.send(command);

    return {
      url: this.getFileUrl(destinationKey),
      key: destinationKey,
      size: buffer.length,
      etag: response.ETag,
      provider: "s3",
    };
  }

  private async deleteFromS3(key: string): Promise<void> {
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );

    const s3Client = new S3Client({
      region: this.config.s3?.region || "",
      credentials: this.config.s3?.accessKeyId
        ? {
            accessKeyId: this.config.s3.accessKeyId,
            secretAccessKey: this.config.s3.secretAccessKey || "",
          }
        : undefined,
    });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.config.s3?.bucket || "",
        Key: key,
      })
    );
  }

  // GCS Storage Implementation
  private async uploadToGCS(
    localPath: string,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { Storage } = await import("@google-cloud/storage");

    const storage = new Storage({
      projectId: this.config.gcs?.projectId,
      keyFilename: this.config.gcs?.keyFilename,
      credentials: this.config.gcs?.credentials,
    });

    const bucket = storage.bucket(this.config.gcs?.bucket || "");
    const file = bucket.file(destinationKey);

    await bucket.upload(localPath, {
      destination: destinationKey,
      metadata: {
        contentType: options.contentType,
        metadata: options.metadata,
        cacheControl: options.cacheControl,
      },
      public: options.public,
    });

    const [metadata] = await file.getMetadata();

    return {
      url: this.getFileUrl(destinationKey),
      key: destinationKey,
      size: Number.parseInt(String(metadata.size) || "0", 10),
      etag: metadata.etag,
      provider: "gcs",
    };
  }

  private async uploadBufferToGCS(
    buffer: Buffer,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { Storage } = await import("@google-cloud/storage");

    const storage = new Storage({
      projectId: this.config.gcs?.projectId,
      keyFilename: this.config.gcs?.keyFilename,
      credentials: this.config.gcs?.credentials,
    });

    const bucket = storage.bucket(this.config.gcs?.bucket || "");
    const file = bucket.file(destinationKey);

    await file.save(buffer, {
      metadata: {
        contentType: options.contentType,
        metadata: options.metadata,
        cacheControl: options.cacheControl,
      },
      public: options.public,
    });

    const [metadata] = await file.getMetadata();

    return {
      url: this.getFileUrl(destinationKey),
      key: destinationKey,
      size: buffer.length,
      etag: metadata.etag,
      provider: "gcs",
    };
  }

  private async deleteFromGCS(key: string): Promise<void> {
    const { Storage } = await import("@google-cloud/storage");

    const storage = new Storage({
      projectId: this.config.gcs?.projectId,
      keyFilename: this.config.gcs?.keyFilename,
      credentials: this.config.gcs?.credentials,
    });

    await storage
      .bucket(this.config.gcs?.bucket || "")
      .file(key)
      .delete();
  }

  // Vercel Blob Storage Implementation
  private async uploadToVercelBlob(
    localPath: string,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { put } = await import("@vercel/blob");

    const fileContent = await fs.readFile(localPath);
    const stats = await fs.stat(localPath);

    const blob = await put(destinationKey, fileContent, {
      access: options.public ? "public" : "public",
      contentType: options.contentType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      key: blob.pathname,
      size: stats.size,
      provider: "vercel-blob",
    };
  }

  private async uploadBufferToVercelBlob(
    buffer: Buffer,
    destinationKey: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const { put } = await import("@vercel/blob");

    const blob = await put(destinationKey, buffer, {
      access: options.public ? "public" : "public",
      contentType: options.contentType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
      key: blob.pathname,
      size: buffer.length,
      provider: "vercel-blob",
    };
  }

  private async deleteFromVercelBlob(key: string): Promise<void> {
    const { del } = await import("@vercel/blob");
    await del(key);
  }

  /**
   * Upload with progress tracking
   */
  async uploadFileWithProgress(
    localPath: string,
    destinationKey: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const stats = await fs.stat(localPath);
    const totalSize = stats.size;
    const uploadedSize = 0;

    // For large files, we can implement chunked upload with progress
    // For now, emit progress events
    this.emit("uploadprogress", {
      key: destinationKey,
      uploaded: 0,
      total: totalSize,
      percentage: 0,
    });

    const result = await this.uploadFile(localPath, destinationKey, options);

    this.emit("uploadprogress", {
      key: destinationKey,
      uploaded: totalSize,
      total: totalSize,
      percentage: 100,
    });

    return result;
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    provider: StorageProvider;
    config: Partial<StorageConfig>;
  } {
    return {
      provider: this.config.provider,
      config: {
        provider: this.config.provider,
        // Don't expose sensitive credentials
      },
    };
  }
}
