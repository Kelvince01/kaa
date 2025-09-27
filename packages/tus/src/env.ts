import env from "env-var";

export const config = {
  TUS_SECRET: env.get("TUS_SECRET").default("secret").asString(),
  TUS_UPLOAD_DIR: env
    .get("TUS_UPLOAD_DIR")
    .default("/tmp/tus-uploads")
    .asString(),
  TUS_MAX_FILE_SIZE: env
    .get("TUS_MAX_FILE_SIZE")
    .default(1024 * 1024 * 10)
    .asIntPositive(),
  VERCEL_BLOB_READ_WRITE_TOKEN: env
    .get("VERCEL_BLOB_READ_WRITE_TOKEN")
    .default("secret")
    .asString(),
};
