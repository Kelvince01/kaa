import { auditService } from "@kaa/services";
import { createQueue, logger, redisConfig } from "@kaa/utils";
import { Worker } from "bullmq";

// Create queue
export const auditLogQueue = createQueue("audit-log");

// Create worker
const worker = new Worker(
  "audit-log",
  async (job) => {
    logger.info(`Processing audit log job ${job.id}`);

    if (job.name === "createAuditLog") {
      await auditService.auditLog(job.data);
    }

    logger.info(`Completed audit log job ${job.id}`);
  },
  {
    connection: {
      host: redisConfig.host,
      port: Number.parseInt(redisConfig.port, 10),
      password: redisConfig.password,
    },
    concurrency: 5,
  }
);

// Handle worker events
worker.on("completed", (job) => {
  logger.info(`Audit log job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  logger.error(`Audit log job ${job?.id} failed:`, error);
});

export default worker;
