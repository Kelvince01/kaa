import "dotenv/config";
import { createServer, request as httpRequest } from "node:http";
import { cpus } from "node:os";
import { join } from "node:path";
import * as process from "node:process";
import { URL } from "node:url";

const numCPUs = cpus().length - 1;
const basePort = process.env.PORT ? Number(process.env.PORT) : 3000;

const workerPorts = Array.from({ length: numCPUs }, (_, i) => basePort + i + 1);
const workers: Bun.Subprocess[] = [];

for (let i = 0; i < numCPUs; i++) {
  const workerPort = workerPorts[i];

  // biome-ignore lint/correctness/noUndeclaredVariables: false positive
  const proc = Bun.spawn({
    cmd: ["bun", "src/server/index.ts"],
    cwd: join(process.cwd()),
    env: Object.fromEntries(
      Object.entries({
        ...process.env,
        PORT: workerPort,
        WORKER_ID: i,
        BASE_URL: `http://localhost:${workerPort}`,
        PUBLIC_API_URL: `http://localhost:${workerPort}`,
        PUBLIC_WS_URL: `ws://localhost:${workerPort}/ws`,
        MODE: "production",
        NODE_ENV: "production",
        DEV: false,
        PROD: true,
        SSR: true,
        LOG_LEVEL: "error",
      }).map(([k, v]) => [k, String(v)])
    ),
    stdout: "inherit",
    stderr: "inherit",
    onExit(_, code) {
      console.log(`❌ Worker ${i} exited with code ${code}`);
    },
  });

  workers.push(proc);
  console.log(`🚀 Worker ${i + 1}/${numCPUs} started on port ${workerPort}`);
}

// Балансировщик
let current = 0;

const balancer = createServer((req, res) => {
  const targetPort = workerPorts[current];
  current = (current + 1) % workerPorts.length;

  const targetUrl = new URL(req.url ?? "/", `http://localhost:${targetPort}`);

  const proxyReq = httpRequest(
    {
      hostname: "localhost",
      port: targetPort,
      method: req.method,
      path: targetUrl.pathname + targetUrl.search,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on("error", (err) => {
    res.writeHead(502);
    res.end(`Proxy error: ${err.message}`);
  });

  req.pipe(proxyReq, { end: true });
});

balancer.listen(basePort, () => {
  console.log(`📦 Load balancer running at http://localhost:${basePort}`);
});

// Завершение
function shutdown() {
  for (const worker of workers) {
    worker.kill();
  }
  balancer.close(() => {
    console.log("🔻 Balancer stopped");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);
