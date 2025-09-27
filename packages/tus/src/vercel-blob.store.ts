import crypto from "node:crypto";
import fs, { promises as fsProm } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Readable } from "node:stream";
import stream, { promises as streamProm } from "node:stream";
import { type Permit, Semaphore } from "@shopify/semaphore";
import {
  DataStore,
  ERRORS,
  type KvStore,
  MemoryKvStore,
  StreamSplitter,
  TUS_RESUMABLE,
  Upload,
} from "@tus/utils";
import {
  BlobNotFoundError,
  completeMultipartUpload,
  createMultipartUpload,
  del,
  head,
  list,
  put,
  uploadPart,
} from "@vercel/blob";
import debug from "debug";
import MultiStream from "multistream";

const log = debug("tus-node-server:stores:vercelblob");

export type Options = {
  /**
   * The preferred part size for parts send to Vercel Blob. Can not be lower than 5MiB or more than 5GiB.
   * The server calculates the optimal part size, which takes this size into account,
   * but may increase it to not exceed the 10K parts limit.
   */
  partSize?: number;
  /**
   * The minimal part size for parts.
   * Can be used to ensure that all non-trailing parts are exactly the same size.
   * Can not be lower than 5MiB or more than 5GiB.
   */
  minPartSize?: number;
  /**
   * The maximum number of parts allowed in a multipart upload. Defaults to 10,000.
   */
  maxMultipartParts?: number;
  maxConcurrentPartUploads?: number;
  cache?: KvStore<MetadataValue>;
  expirationPeriodInMilliseconds?: number;
  // Vercel Blob token for authentication
  token?: string;
  // Optional prefix for blob pathnames
  prefix?: string;
};

export type MetadataValue = {
  file: Upload;
  "upload-id": string;
  "tus-version": string;
};

export type MultipartUploadInfo = {
  key: string;
  uploadId: string;
  parts: Array<{ etag: string; partNumber: number }>;
};

function calcOffsetFromParts(
  parts?: Array<{ size: number; partNumber: number }>
) {
  // biome-ignore lint/nursery/noUnnecessaryConditions: always true
  return parts && parts.length > 0
    ? parts.reduce((a, b) => a + (b.size ?? 0), 0)
    : 0;
}

// Implementation for Vercel Blob Store
//
// Once a new tus upload is initiated, multiple objects in Vercel Blob are created:
//
// First of all, a new info object is stored which contains a JSON-encoded
// blob of general information about the upload including its size and meta data.
// This kind of objects have the suffix ".info" in their key.
//
// In addition, a new multipart upload is created for large files.
// Whenever a new chunk is uploaded to tus-node-server using a PATCH request, a
// new part is pushed to the multipart upload on Vercel Blob.
//
// For smaller files or incomplete parts, they are stored as separate blobs
// with the suffix ".part" until they can be combined into larger parts.
//
// Once the upload is finished, all parts are combined into the final blob
// and the temporary objects are cleaned up.

export class VercelBlobStore extends DataStore {
  protected cache: KvStore<MetadataValue>;
  protected preferredPartSize: number;
  protected expirationPeriodInMilliseconds = 0;
  protected partUploadSemaphore: Semaphore;
  protected token?: string;
  protected prefix: string;
  protected multipartUploads = new Map<string, MultipartUploadInfo>();
  maxMultipartParts = 10_000;
  minPartSize = 5_242_880; // 5MiB
  maxUploadSize = 5_497_558_138_880 as const; // 5TiB

  constructor(options: Options) {
    super();
    const { maxMultipartParts, partSize, minPartSize } = options;

    this.extensions = [
      "creation",
      "creation-with-upload",
      "creation-defer-length",
      "termination",
      "expiration",
    ];

    this.preferredPartSize = partSize || 8 * 1024 * 1024;
    if (minPartSize) {
      this.minPartSize = minPartSize;
    }
    if (maxMultipartParts) {
      this.maxMultipartParts = maxMultipartParts;
    }

    this.expirationPeriodInMilliseconds =
      options.expirationPeriodInMilliseconds ?? 0;
    this.cache = options.cache ?? new MemoryKvStore<MetadataValue>();
    this.token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
    this.prefix = options.prefix || "";
    this.partUploadSemaphore = new Semaphore(
      options.maxConcurrentPartUploads ?? 60
    );
  }

  /**
   * Saves upload metadata to a `${file_id}.info` blob on Vercel Blob.
   * The metadata is saved as JSON content in the blob.
   */
  protected async saveMetadata(upload: Upload, uploadId: string) {
    log(`[${upload.id}] saving metadata`);

    const metadata = {
      file: upload,
      "upload-id": uploadId,
      "tus-version": TUS_RESUMABLE,
    };

    await put(this.infoKey(upload.id), JSON.stringify(metadata), {
      access: "public",
      contentType: "application/json",
      token: this.token,
    });

    log(`[${upload.id}] metadata file saved`);
  }

  /**
   * Retrieves upload metadata previously saved in `${file_id}.info`.
   * There's a simple caching mechanism to avoid multiple HTTP calls.
   */
  protected async getMetadata(id: string): Promise<MetadataValue> {
    const cached = await this.cache.get(id);
    if (cached) {
      return cached;
    }

    try {
      const blobInfo = await head(this.infoKey(id), { token: this.token });
      const response = await fetch(blobInfo.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadataStr = await response.text();
      const metadata = JSON.parse(metadataStr) as MetadataValue;

      // Reconstruct Upload object
      metadata.file = new Upload({
        id,
        size: Number.isFinite(metadata.file.size)
          ? Number.parseInt(String(metadata.file.size), 10)
          : undefined,
        offset: Number.parseInt(String(metadata.file.offset), 10),
        metadata: metadata.file.metadata,
        creation_date: metadata.file.creation_date,
        storage: metadata.file.storage,
      });

      await this.cache.set(id, metadata);
      return metadata;
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        throw ERRORS.FILE_NOT_FOUND;
      }
      log(`[${id}] failed to get metadata`, error);
      throw ERRORS.FILE_NOT_FOUND;
    }
  }

  protected infoKey(id: string) {
    return this.addPrefix(`${id}.info`);
  }

  protected partKey(id: string, isIncomplete = false, partNumber?: number) {
    let key = id;
    if (isIncomplete) {
      key += ".part";
    } else if (partNumber !== undefined) {
      key += `.part${partNumber}`;
    }
    return this.addPrefix(key);
  }

  protected addPrefix(key: string): string {
    return this.prefix ? `${this.prefix}/${key}` : key;
  }

  protected getBlobUrl(pathname: string): string {
    // For Vercel Blob, we can construct URLs or use the head() method to get the URL
    // This is a placeholder - the actual URL construction depends on your blob store
    // In practice, you might want to use the head() method to get the actual URL
    return pathname; // We'll use fetch with the pathname directly in most cases
  }

  protected async uploadPart(
    metadata: MetadataValue,
    readStream: fs.ReadStream | Readable,
    partNumber: number
  ): Promise<string> {
    const chunks: Buffer[] = [];

    // Read stream into buffer
    for await (const chunk of readStream) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);
    const uploadInfo = this.multipartUploads.get(metadata.file.id);

    if (!uploadInfo) {
      throw new Error(`Multipart upload not found for ${metadata.file.id}`);
    }

    try {
      const result = await uploadPart(
        this.addPrefix(metadata.file.id),
        buffer,
        {
          access: "public",
          partNumber,
          key: uploadInfo.key,
          uploadId: uploadInfo.uploadId,
          token: this.token,
        }
      );

      // Store part info
      uploadInfo.parts.push({
        etag: result.etag,
        partNumber,
      });

      log(`[${metadata.file.id}] finished uploading part #${partNumber}`);
      return result.etag;
    } catch (error) {
      log(`[${metadata.file.id}] failed to upload part #${partNumber}`, error);
      throw error;
    }
  }

  protected async uploadIncompletePart(
    id: string,
    readStream: fs.ReadStream | Readable
  ): Promise<string> {
    const chunks: Buffer[] = [];

    // Read stream into buffer
    for await (const chunk of readStream) {
      chunks.push(Buffer.from(chunk));
    }

    const buffer = Buffer.concat(chunks);

    const result = await put(this.partKey(id, true), buffer, {
      access: "public",
      contentType: "application/octet-stream",
      token: this.token,
    });

    log(`[${id}] finished uploading incomplete part`);
    return result.url;
  }

  protected async downloadIncompletePart(id: string) {
    const incompletePart = await this.getIncompletePart(id);
    if (!incompletePart) {
      return;
    }

    const filePath = await this.uniqueTmpFileName(
      "tus-vercel-incomplete-part-"
    );

    try {
      let incompletePartSize = 0;
      const byteCounterTransform = new stream.Transform({
        transform(chunk, _, callback) {
          incompletePartSize += chunk.length;
          callback(null, chunk);
        },
      });

      // Write to temporary file
      await streamProm.pipeline(
        incompletePart,
        byteCounterTransform,
        fs.createWriteStream(filePath)
      );

      const createReadStream = (options: { cleanUpOnEnd: boolean }) => {
        const fileReader = fs.createReadStream(filePath);
        if (options.cleanUpOnEnd) {
          fileReader.on("end", () => {
            fs.unlink(filePath, () => {
              // ignore
            });
          });
          fileReader.on("error", (err) => {
            fileReader.destroy(err);
            fs.unlink(filePath, () => {
              // ignore
            });
          });
        }
        return fileReader;
      };

      return {
        size: incompletePartSize,
        path: filePath,
        createReader: createReadStream,
      };
    } catch (err) {
      fsProm.rm(filePath).catch(() => {
        /* ignore */
      });
      throw err;
    }
  }

  protected async getIncompletePart(id: string): Promise<Readable | undefined> {
    try {
      const blobInfo = await head(this.partKey(id, true), {
        token: this.token,
      });
      const response = await fetch(blobInfo.url);
      if (!response.ok) {
        return;
      }
      return response.body as unknown as Readable;
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return;
      }
      throw error;
    }
  }

  protected async getIncompletePartSize(
    id: string
  ): Promise<number | undefined> {
    try {
      const blobInfo = await head(this.partKey(id, true), {
        token: this.token,
      });
      return blobInfo.size;
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        return;
      }
      throw error;
    }
  }

  protected async deleteIncompletePart(id: string): Promise<void> {
    try {
      await del(this.partKey(id, true), { token: this.token });
    } catch (error) {
      // Ignore if already deleted
      log(`[${id}] failed to delete incomplete part`, error);
    }
  }

  /**
   * Uploads a stream to Vercel Blob using multiple parts
   */
  protected async uploadParts(
    metadata: MetadataValue,
    readStream: stream.Readable,
    currentPartNumber: number,
    offset: number
  ): Promise<number> {
    const size = metadata.file.size;
    const promises: Promise<void>[] = [];
    let pendingChunkFilepath: string | null = null;
    let bytesUploaded = 0;
    let permit: Permit | undefined;

    const splitterStream = new StreamSplitter({
      chunkSize: this.calcOptimalPartSize(size),
      directory: os.tmpdir(),
    })
      .on("beforeChunkStarted", async () => {
        permit = await this.partUploadSemaphore.acquire();
      })
      .on("chunkStarted", (filepath) => {
        pendingChunkFilepath = filepath;
      })
      .on("chunkFinished", ({ path, size: partSize }) => {
        pendingChunkFilepath = null;
        const acquiredPermit = permit;
        let _partNumber = currentPartNumber;
        const partNumber = _partNumber++;
        let _offset = offset;
        _offset += partSize;
        const isFinalPart = size === _offset;

        // biome-ignore lint/suspicious/noAsyncPromiseExecutor: it's fine
        const deferred = new Promise<void>(async (resolve, reject) => {
          try {
            const readable = fs.createReadStream(path);
            readable.on("error", reject);

            if (partSize >= this.minPartSize || isFinalPart) {
              await this.uploadPart(metadata, readable, partNumber);
            } else {
              await this.uploadIncompletePart(metadata.file.id, readable);
            }

            bytesUploaded += partSize;
            resolve();
          } catch (error) {
            splitterStream.destroy(error as Error);
            reject(error);
          } finally {
            fsProm.rm(path).catch(() => {
              /* ignore */
            });
            acquiredPermit?.release().catch(() => {
              /* ignore */
            });
          }
        });

        promises.push(deferred);
      })
      .on("chunkError", () => {
        permit?.release().catch(() => {
          /* ignore */
        });
      });

    try {
      await streamProm.pipeline(readStream, splitterStream);
    } catch (error) {
      if (pendingChunkFilepath !== null) {
        try {
          await fsProm.rm(pendingChunkFilepath);
        } catch {
          log(
            `[${metadata.file.id}] failed to remove chunk ${pendingChunkFilepath}`
          );
        }
      }
      promises.push(Promise.reject(error));
    } finally {
      await Promise.allSettled(promises);
      await Promise.all(promises);
    }

    return bytesUploaded;
  }

  /**
   * Completes a multipart upload on Vercel Blob.
   */
  protected async finishMultipartUpload(
    metadata: MetadataValue,
    parts: Array<{ etag: string; partNumber: number }>
  ) {
    const uploadInfo = this.multipartUploads.get(metadata.file.id);
    if (!uploadInfo) {
      throw new Error(`Multipart upload not found for ${metadata.file.id}`);
    }

    try {
      const result = await completeMultipartUpload(
        this.addPrefix(metadata.file.id),
        parts,
        {
          access: "public",
          key: uploadInfo.key,
          uploadId: uploadInfo.uploadId,
          token: this.token,
        }
      );

      // Clean up multipart upload info
      this.multipartUploads.delete(metadata.file.id);

      return result.url;
    } catch (error) {
      log(`[${metadata.file.id}] failed to complete multipart upload`, error);
      throw error;
    }
  }

  /**
   * Gets the parts already uploaded for multipart upload.
   */
  protected async retrieveParts(
    id: string
  ): Promise<Array<{ size: number; partNumber: number; etag: string }>> {
    const uploadInfo = this.multipartUploads.get(id);
    if (!uploadInfo) {
      return [];
    }

    // For Vercel Blob, we need to track parts manually
    // This is a simplified implementation - you might want to store this info in a database
    return await Promise.all(
      uploadInfo.parts.map((part) => ({
        size: 0, // Size tracking would need to be implemented
        partNumber: part.partNumber,
        etag: part.etag,
      }))
    );
  }

  /**
   * Removes cached data for a given file.
   */
  protected async clearCache(id: string) {
    log(`[${id}] removing cached data`);
    await this.cache.delete(id);
  }

  protected calcOptimalPartSize(size?: number): number {
    const _size = size ?? this.maxUploadSize;
    // When upload size is not known we assume largest possible value
    // if (size === undefined) {
    //   _size = this.maxUploadSize;
    // }

    let optimalPartSize: number;

    if (_size <= this.preferredPartSize) {
      optimalPartSize = _size;
    } else if (_size <= this.preferredPartSize * this.maxMultipartParts) {
      optimalPartSize = this.preferredPartSize;
    } else {
      optimalPartSize = Math.ceil(_size / this.maxMultipartParts);
    }

    return Math.max(optimalPartSize, this.minPartSize);
  }

  /**
   * Creates a multipart upload on Vercel Blob and saves metadata.
   */
  async create(upload: Upload) {
    log(`[${upload.id}] initializing multipart upload`);

    upload.creation_date = new Date().toISOString();
    upload.storage = {
      type: "vercel-blob",
      path: this.addPrefix(upload.id),
      // prefix: this.prefix,
    };

    // For large files, initialize multipart upload
    if (upload.size && upload.size > this.minPartSize) {
      const multipartUpload = await createMultipartUpload(
        this.addPrefix(upload.id),
        {
          access: "public",
          contentType:
            upload.metadata?.contentType || "application/octet-stream",
          token: this.token,
        }
      );

      // Store multipart upload info
      this.multipartUploads.set(upload.id, {
        key: multipartUpload.key,
        uploadId: multipartUpload.uploadId,
        parts: [],
      });

      await this.saveMetadata(upload, multipartUpload.uploadId);
      log(
        `[${upload.id}] multipart upload created (${multipartUpload.uploadId})`
      );
    } else {
      // For small files, just save metadata without multipart upload
      await this.saveMetadata(upload, crypto.randomUUID());
      log(`[${upload.id}] upload created for small file`);
    }

    return upload;
  }

  async read(id: string) {
    try {
      const blobInfo = await head(this.addPrefix(id), { token: this.token });
      const response = await fetch(blobInfo.url);
      if (!response.ok) {
        throw new Error(`Failed to read blob: ${response.status}`);
      }
      return response.body as unknown as Readable;
    } catch (error) {
      if (error instanceof BlobNotFoundError) {
        throw ERRORS.FILE_NOT_FOUND;
      }
      log(`[${id}] failed to read blob`, error);
      throw ERRORS.FILE_NOT_FOUND;
    }
  }

  /**
   * Write to the file, starting at the provided offset
   */
  async write(
    src: stream.Readable,
    id: string,
    offset: number
  ): Promise<number> {
    const metadata = await this.getMetadata(id);
    const parts = await this.retrieveParts(id);

    const partNumber: number =
      parts.length > 0 ? Math.max(...parts.map((p) => p.partNumber)) : 0;
    const nextPartNumber = partNumber + 1;
    const incompletePart = await this.downloadIncompletePart(id);
    const requestedOffset = offset;

    if (incompletePart) {
      await this.deleteIncompletePart(id);
      offset = requestedOffset - incompletePart.size;
      src = new MultiStream([
        incompletePart.createReader({ cleanUpOnEnd: true }),
        src,
      ]);
    }

    const bytesUploaded = await this.uploadParts(
      metadata,
      src,
      nextPartNumber,
      offset
    );
    const newOffset =
      requestedOffset + bytesUploaded - (incompletePart?.size ?? 0);

    if (metadata.file.size === newOffset) {
      try {
        const parts = await this.retrieveParts(id);
        await this.finishMultipartUpload(metadata, parts);
        await this.clearCache(id);
      } catch (error) {
        log(`[${id}] failed to finish upload`, error);
        throw error;
      }
    }

    return newOffset;
  }

  async getUpload(id: string): Promise<Upload> {
    let metadata: MetadataValue;
    try {
      metadata = await this.getMetadata(id);
    } catch (error) {
      log("getUpload: No file found.", error);
      throw ERRORS.FILE_NOT_FOUND;
    }

    let offset = 0;
    try {
      const parts = await this.retrieveParts(id);
      offset = calcOffsetFromParts(parts);
    } catch (error) {
      // If multipart upload is complete, return the full size as offset
      return new Upload({
        ...metadata.file,
        offset: metadata.file.size as number,
        size: metadata.file.size,
        metadata: metadata.file.metadata,
        storage: metadata.file.storage,
      });
    }

    const incompletePartSize = await this.getIncompletePartSize(id);
    return new Upload({
      ...metadata.file,
      offset: offset + (incompletePartSize ?? 0),
      size: metadata.file.size,
      storage: metadata.file.storage,
    });
  }

  async declareUploadLength(file_id: string, upload_length: number) {
    const { file, "upload-id": uploadId } = await this.getMetadata(file_id);
    if (!file) {
      throw ERRORS.FILE_NOT_FOUND;
    }

    file.size = upload_length;
    await this.saveMetadata(file, uploadId);
  }

  async remove(id: string): Promise<void> {
    try {
      const uploadInfo = this.multipartUploads.get(id);
      if (uploadInfo) {
        // For multipart uploads, we would need to abort the upload
        // Vercel Blob doesn't have a direct abort method, so we clean up manually
        this.multipartUploads.delete(id);
      }

      // Delete all related blobs
      const blobsToDelete = [
        this.addPrefix(id),
        this.infoKey(id),
        this.partKey(id, true),
      ];

      // Also delete any numbered parts
      const parts = await this.retrieveParts(id);
      for (const part of parts) {
        blobsToDelete.push(this.partKey(id, false, part.partNumber));
      }

      await del(blobsToDelete, { token: this.token });
      await this.clearCache(id);
    } catch (error) {
      log(`[${id}] failed to remove upload`, error);
      throw ERRORS.FILE_NOT_FOUND;
    }
  }

  protected getExpirationDate(created_at: string) {
    const date = new Date(created_at);
    return new Date(date.getTime() + this.getExpiration());
  }

  getExpiration(): number {
    return this.expirationPeriodInMilliseconds;
  }

  async deleteExpired(): Promise<number> {
    if (this.getExpiration() === 0) {
      return 0;
    }

    let deleted = 0;
    let cursor: string | undefined;
    const now = new Date();

    do {
      const result = await list({
        token: this.token,
        cursor,
        limit: 1000,
        prefix: this.prefix,
      });

      const expiredBlobs = result.blobs.filter((blob) => {
        return (
          blob.pathname.endsWith(".info") &&
          now.getTime() >
            this.getExpirationDate(blob.uploadedAt.toISOString()).getTime()
        );
      });

      if (expiredBlobs.length > 0) {
        // Extract IDs from info blobs and delete all related blobs
        const expiredIds = expiredBlobs.map((blob) =>
          blob.pathname
            .replace(this.prefix ? `${this.prefix}/` : "", "")
            .replace(".info", "")
        );

        for (const id of expiredIds) {
          try {
            await this.remove(id);
            deleted++;
          } catch (error) {
            log(`Failed to delete expired upload ${id}`, error);
          }
        }
      }

      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);

    return deleted;
  }

  protected async uniqueTmpFileName(template: string): Promise<string> {
    let tries = 0;
    const maxTries = 10;

    while (tries < maxTries) {
      const fileName =
        template + crypto.randomBytes(10).toString("base64url").slice(0, 10);
      const filePath = path.join(os.tmpdir(), fileName);

      try {
        await fsProm.lstat(filePath);
        tries++;
      } catch (e: any) {
        if (e.code === "ENOENT") {
          return filePath;
        }
        throw e;
      }
    }

    throw new Error(
      `Could not find a unique file name after ${maxTries} tries`
    );
  }
}
