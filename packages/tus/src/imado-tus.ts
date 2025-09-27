import type http from "node:http";
import { ServerResponse } from "node:http";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { FileStore } from "@tus/file-store";
import { S3Store } from "@tus/s3-store";
import {
  MemoryLocker,
  Server,
  type ServerOptions,
  type Upload,
} from "@tus/server";
import { copy, del } from "@vercel/blob";
import jwt from "jsonwebtoken";
import { VercelBlobStore } from "./vercel-blob.store"; // Import our VercelBlobStore

type ModifiedServerOptions = Omit<ServerOptions, "locker" | "path">;

type AWSCredentials = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type VercelBlobCredentials = {
  token: string;
  prefix?: string;
};

type TusOptions = {
  secret: string;
  // Make credentials optional and add storage type
  storage?: {
    type: "aws" | "vercel-blob" | "file";
    credentials?: AWSCredentials | VercelBlobCredentials;
  };
  serverOptions?: ModifiedServerOptions;
};

async function moveS3Object(
  oldKey: string,
  newKey: string,
  credentials: AWSCredentials
) {
  const s3Client = new S3Client({
    region: credentials.region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  await s3Client.send(
    new CopyObjectCommand({
      Bucket: credentials.bucket,
      CopySource: `${credentials.bucket}/${oldKey}`,
      Key: newKey,
      MetadataDirective: "COPY",
    })
  );

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: credentials.bucket,
      Key: oldKey,
    })
  );
}

async function moveVercelBlobObject(
  oldKey: string,
  newKey: string,
  credentials: VercelBlobCredentials
) {
  // Copy the blob to new location
  await copy(oldKey, newKey, {
    access: "public",
    token: credentials.token,
  });

  // Delete the old blob
  await del(oldKey, {
    token: credentials.token,
  });
}

function createDataStore(storage: TusOptions["storage"]) {
  if (!storage || storage.type === "file") {
    return new FileStore({
      directory: "./files",
    });
  }

  if (storage.type === "aws") {
    const credentials = storage.credentials as AWSCredentials;
    return new S3Store({
      partSize: 8 * 1024 * 1024, // Each uploaded part will have ~8MiB
      s3ClientConfig: {
        bucket: credentials.bucket,
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      },
    });
  }

  if (storage.type === "vercel-blob") {
    const credentials = storage.credentials as VercelBlobCredentials;
    return new VercelBlobStore({
      partSize: 8 * 1024 * 1024, // Each uploaded part will have ~8MiB
      token: credentials.token,
      prefix: credentials.prefix,
      maxConcurrentPartUploads: 60,
    });
  }

  throw new Error(`Unsupported storage type: ${storage?.type}`);
}

function createOnUploadFinishHandler(storage: TusOptions["storage"]) {
  return async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    upload: Upload
  ) => {
    const auth = req.headers.authorization;
    const token = (auth as string).split(" ")[1];
    const sub = jwt.decode(token ?? "")?.sub;

    if (!sub) {
      console.warn("No subject found in JWT token");
      return res;
    }

    try {
      if (storage?.type === "aws") {
        const credentials = storage.credentials as AWSCredentials;
        // Move main file and info file for S3
        await moveS3Object(upload.id, `${sub}/${upload.id}`, credentials);
        await moveS3Object(
          `${upload.id}.info`,
          `${sub}/${upload.id}.info`,
          credentials
        );
      } else if (storage?.type === "vercel-blob") {
        const credentials = storage.credentials as VercelBlobCredentials;
        const prefix = credentials.prefix ? `${credentials.prefix}/` : "";

        // Move main file and info file for Vercel Blob
        await moveVercelBlobObject(
          `${prefix}${upload.id}`,
          `${prefix}${sub}/${upload.id}`,
          credentials
        );
        await moveVercelBlobObject(
          `${prefix}${upload.id}.info`,
          `${prefix}${sub}/${upload.id}.info`,
          credentials
        );
      }
      // For file storage, no moving is needed as files are already in the right place
    } catch (error) {
      console.error("Error moving uploaded file:", error);
      // Don't throw here to avoid breaking the upload completion
    }

    return res;
  };
}

function extractContentType(upload: Upload) {
  const mimeType = upload.metadata?.type;
  return mimeType;
}

export const ImadoTus = (opts: TusOptions) => {
  const datastore = createDataStore(opts.storage);
  const onUploadFinish = createOnUploadFinishHandler(opts.storage);

  return new Server({
    ...opts.serverOptions,
    path: "/upload",
    locker: new MemoryLocker(),
    datastore,
    onUploadCreate(
      _req: Request,
      upload: Upload
    ): Promise<{
      metadata: { [key: string]: string | null };
    }> {
      console.debug("Upload created:", upload);
      const contentType = extractContentType(upload) ?? null;
      const metadata = { ...upload.metadata, contentType };
      return Promise.resolve({ metadata });
    },
    async onIncomingRequest(req: Request): Promise<void> {
      const auth = req.headers.get("authorization");

      if (!auth) throw new Error("Unauthorized");

      try {
        const token = auth.split(" ")[1];

        // If you want to know who uploaded or create secrets per client you can implement something like this:
        // const sub = jwt.decode(token)?.sub;
        // const secret = await db.query('SELECT secret FROM users WHERE id = $1', [sub]);

        // Verify secret and token, will throw error if invalid
        await Promise.resolve(jwt.verify(token ?? "", opts.secret));
      } catch (error) {
        console.error("Invalid token", error);
        throw new Error("Invalid token");
      }
    },
    async onUploadFinish(
      req: any,
      upload: Upload
    ): Promise<{
      status_code?: number;
      headers?: Record<string, string | number>;
      body?: string;
    }> {
      console.debug("Upload finished:", upload);
      const res = new ServerResponse(req as any);
      await onUploadFinish(req as any, res, upload);
      return await Promise.resolve(res as any);
    },
    async onResponseError(
      _req: Request,
      err: Error | { status_code: number; body: string }
    ): Promise<
      | { status_code: number; body: string }
      | { status_code: number; body: string }
      | undefined
    > {
      console.error("Error:", err);
      return await Promise.resolve({
        status_code: 500,
        body: "TUS Server Error",
      });
    },
  });
};

// Export types for better TypeScript support
export type { TusOptions, AWSCredentials, VercelBlobCredentials };
