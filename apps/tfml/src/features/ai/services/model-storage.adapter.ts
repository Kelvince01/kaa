import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type ModelStorageAdapter = {
  getUri(modelId: string, version: string): string; // canonical uri
  getLocalDir(modelId: string, version: string): string; // where to save/load locally
  save(modelId: string, version: string, localDir: string): Promise<string>; // returns canonical uri
  fetch(modelId: string, version: string): Promise<string>; // returns local dir path with model files
  exists(modelId: string, version: string): Promise<boolean>;
};

class LocalStorageAdapter implements ModelStorageAdapter {
  constructor(private readonly root: string) {}
  getUri(modelId: string, version: string) {
    return `file://${path.resolve(this.root, modelId, version)}`;
  }
  getLocalDir(modelId: string, version: string) {
    return path.resolve(this.root, modelId, version);
  }
  async save(modelId: string, version: string, _localDir: string) {
    // Local already saved by TF; just return uri
    return await Promise.resolve(this.getUri(modelId, version));
  }
  async fetch(modelId: string, version: string) {
    return await Promise.resolve(this.getLocalDir(modelId, version));
  }
  async exists(modelId: string, version: string) {
    return await Promise.resolve(
      fs.existsSync(this.getLocalDir(modelId, version))
    );
  }
}

class S3StorageAdapter implements ModelStorageAdapter {
  private readonly s3: S3Client;
  constructor(
    private readonly bucket: string,
    private readonly prefix = "models/"
  ) {
    this.s3 = new S3Client({});
  }
  private key(modelId: string, version: string) {
    return `${this.prefix}${modelId}/${version}/model.json`;
  }
  getUri(modelId: string, version: string) {
    return `s3://${this.bucket}/${this.prefix}${modelId}/${version}`;
  }
  getLocalDir(modelId: string, version: string) {
    return path.resolve(process.cwd(), ".cache/models", modelId, version);
  }
  async save(modelId: string, version: string, localDir: string) {
    // Upload model.json and weight files
    const files = fs.readdirSync(localDir);
    for (const file of files) {
      const body = fs.createReadStream(path.join(localDir, file));
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: `${this.prefix}${modelId}/${version}/${file}`,
          Body: body,
        })
      );
    }
    return this.getUri(modelId, version);
  }
  async fetch(modelId: string, version: string) {
    const outDir = this.getLocalDir(modelId, version);
    fs.mkdirSync(outDir, { recursive: true });
    // Download model.json first to discover weight files
    const modelJsonKey = this.key(modelId, version);
    const modelJsonPath = path.join(outDir, "model.json");
    const modelJsonResp = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: modelJsonKey })
    );
    await pipeline(
      modelJsonResp.Body as any,
      fs.createWriteStream(modelJsonPath)
    );
    const model = JSON.parse(fs.readFileSync(modelJsonPath, "utf-8"));
    for (const w of model.weightsManifest?.flatMap((m: any) => m.paths) || []) {
      const key = `${this.prefix}${modelId}/${version}/${w}`;
      const resp = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      await pipeline(
        resp.Body as any,
        fs.createWriteStream(path.join(outDir, w))
      );
    }
    return outDir;
  }
  async exists(modelId: string, version: string) {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.key(modelId, version),
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}

class GCSStorageAdapter implements ModelStorageAdapter {
  private readonly storage: any;
  private readonly bucketHandle: any;
  constructor(
    private readonly bucket: string,
    private readonly prefix = "models/"
  ) {
    // Lazy require to avoid build-time dep when unused
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Storage } = require("@google-cloud/storage");
    this.storage = new Storage();
    this.bucketHandle = this.storage.bucket(bucket);
  }
  private key(modelId: string, version: string, file = "model.json") {
    return `${this.prefix}${modelId}/${version}/${file}`;
  }
  getUri(modelId: string, version: string) {
    return `gs://${this.bucket}/${this.prefix}${modelId}/${version}`;
  }
  getLocalDir(modelId: string, version: string) {
    return path.resolve(process.cwd(), ".cache/models", modelId, version);
  }
  async save(modelId: string, version: string, localDir: string) {
    const files = fs.readdirSync(localDir);
    for (const file of files) {
      await this.bucketHandle.upload(path.join(localDir, file), {
        destination: `${this.prefix}${modelId}/${version}/${file}`,
      });
    }
    return this.getUri(modelId, version);
  }
  async fetch(modelId: string, version: string) {
    const outDir = this.getLocalDir(modelId, version);
    fs.mkdirSync(outDir, { recursive: true });
    const modelJsonDest = path.join(outDir, "model.json");
    await this.bucketHandle
      .file(this.key(modelId, version))
      .download({ destination: modelJsonDest });
    const model = JSON.parse(fs.readFileSync(modelJsonDest, "utf-8"));
    const weightPaths: string[] =
      model.weightsManifest?.flatMap((m: any) => m.paths) || [];
    for (const w of weightPaths) {
      await this.bucketHandle
        .file(this.key(modelId, version, w))
        .download({ destination: path.join(outDir, w) });
    }
    return outDir;
  }
  async exists(modelId: string, version: string) {
    const [exists] = await this.bucketHandle
      .file(this.key(modelId, version))
      .exists();
    return !!exists;
  }
}

export function getModelStorageAdapter(): ModelStorageAdapter {
  const backend = process.env.MODEL_STORAGE || "local";
  if (backend === "s3") {
    const bucket = process.env.S3_BUCKET as string;
    const prefix = process.env.S3_PREFIX || "models/";
    return new S3StorageAdapter(bucket, prefix);
  }
  if (backend === "gcs") {
    const bucket = process.env.GCS_BUCKET as string;
    const prefix = process.env.GCS_PREFIX || "models/";
    return new GCSStorageAdapter(bucket, prefix);
  }
  const dir = process.env.MODEL_DIR || path.resolve(process.cwd(), "models");
  return new LocalStorageAdapter(dir);
}
