import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";
import { resendService } from "../comms/resend.service";

// Create queue
export const emailQueue = createQueue("email");

// Create worker
const worker = new Worker(
  "email",
  async (job) => {
    logger.info(`Processing email job ${job.id}`);

    if (job.name === "sendEmail") {
      await resendService.sendEmail(job.data);
    }

    if (job.name === "sendEmailWithTemplate") {
      await resendService.sendEmailWithTemplate({
        ...job.data,
        userId: job.data.userId,
        requestMetadata: job.data.requestMetadata,
      });
    }

    if (job.name === "sendBulkEmail") {
      await resendService.sendBulkEmail(job.data);
    }

    if (job.name === "sendBulkEmailWithTemplate") {
      await resendService.sendBulkEmailWithTemplate(job.data);
    }

    logger.info(`Completed email job ${job.id}`);
  },
  {
    connection: redisOptions,
    concurrency: 5,
  }
);

// Handle worker events
worker.on("completed", (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
  logger.error(`Email job ${job?.id} failed:`, error);
});

export default worker;
