import { config } from "@kaa/config";
import { config as env } from "./env";
import { ImadoTus } from "./imado-tus";

const tus = ImadoTus({
  secret: env.TUS_SECRET,
  storage: {
    type: "vercel-blob",
    credentials: {
      token: env.VERCEL_BLOB_READ_WRITE_TOKEN,
      prefix: "uploads", // Optional: organize blobs in folders
    },
  },
  serverOptions: {
    // Additional TUS server options
    respectForwardedHeaders: true,
  },
});

const tusUrl = new URL(config.tusUrl);

tus.listen({
  host: "0.0.0.0",
  port: Number(config.tusPort),
});

console.info(`${config.name} TUS server is available on ${tusUrl}`);
