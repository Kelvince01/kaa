// import { communicationsService } from "@kaa/communications";
// import type { ProcessWebhookJob } from "@kaa/models/types";
// import type { CommJob } from "@kaa/models/types";
import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";

type ProcessWebhookJob = { type: string };

// Create queue
export const communicationsQueue = createQueue("communications");

// Create worker
const worker = new Worker(
  "communications",
  async (job: any) => {
    logger.info(`Processing communications job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case "sendCommunication":
          await handleSendCommunication(job.data);
          break;

        case "sendBulkCommunication":
          await handleSendBulkCommunication(job.data);
          break;

        case "processWebhook":
          await handleProcessWebhook(job.data);
          break;

        case "retryCommunication":
          await handleRetryCommunication(job.data);
          break;

        case "scheduleCommunication":
          await handleScheduleCommunication(job.data);
          break;

        default:
          logger.warn(`Unknown communications job type: ${job.name}`);
      }

      logger.info(`Completed communications job ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process communications job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisOptions,
    concurrency: 20, // Higher concurrency for communications
    // removeOnComplete: 100, // Keep the last 100 completed jobs
    // removeOnFail: 50, // Keep the last 50 failed jobs
  }
);

/**
 * Handle sending a single communication
 */
async function handleSendCommunication(data: any): Promise<void> {
  const { communicationId, priority } = data;

  try {
    logger.info(`Processing communication ${communicationId}`);

    // Get communication from database
    const communication = await Promise.resolve(null as any);
    // await communicationsService.getCommunication(communicationId);
    if (!communication) {
      throw new Error(`Communication ${communicationId} not found`);
    }

    if (communication.status !== "queued") {
      logger.warn(
        `Communication ${communicationId} already processed with status: ${communication.status}`
      );
      return;
    }

    // Update status to sending
    // This would be implemented in the actual service

    // Send communication via provider
    // This would call the provider directly or through the service

    logger.info(`Communication ${communicationId} sent successfully`);
  } catch (error) {
    logger.error(
      `Failed to send communication ${data.communicationId}:`,
      error
    );
    throw error;
  }
}

/**
 * Handle sending bulk communications
 */
async function handleSendBulkCommunication(data: any): Promise<void> {
  const { bulkId, batchIndex, communicationIds } = data;

  try {
    logger.info(
      `Processing bulk communication batch ${batchIndex} for bulk ${bulkId}`
    );

    // Process each communication in the batch
    for (const communicationId of communicationIds) {
      try {
        await handleSendCommunication({ communicationId });
      } catch (error) {
        logger.error(
          `Failed to process communication ${communicationId} in bulk ${bulkId}:`,
          error
        );
        // Continue with other communications
      }
    }

    logger.info(
      `Completed bulk communication batch ${batchIndex} for bulk ${bulkId}`
    );
  } catch (error) {
    logger.error("Failed to process bulk communication:", error);
    throw error;
  }
}

/**
 * Handle webhook processing
 */
async function handleProcessWebhook(data: any): Promise<void> {
  const { type, payload } = data;

  try {
    logger.info(`Processing webhook of type ${type}`);

    // await communicationsService.processWebhook(payload);
    await Promise.resolve();

    logger.info("Webhook processed successfully");
  } catch (error) {
    logger.error("Failed to process webhook:", error);
    throw error;
  }
}

/**
 * Handle retrying failed communications
 */
async function handleRetryCommunication(data: any): Promise<void> {
  const { communicationId, reason } = data;

  try {
    logger.info(
      `Retrying communication ${communicationId}. Reason: ${reason || "Unknown"}`
    );

    // Reset communication status and retry
    await handleSendCommunication({ communicationId });

    logger.info(`Communication ${communicationId} retry completed`);
  } catch (error) {
    logger.error(`Failed to retry communication ${communicationId}:`, error);
    throw error;
  }
}

/**
 * Handle scheduled communications
 */
async function handleScheduleCommunication(data: any): Promise<void> {
  const { communicationId, scheduledAt } = data;

  try {
    logger.info(
      `Processing scheduled communication ${communicationId} at ${scheduledAt}`
    );

    // Check if it's time to send
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);

    if (now >= scheduledTime) {
      await handleSendCommunication({ communicationId });
    } else {
      // Reschedule for later
      const delay = scheduledTime.getTime() - now.getTime();
      await communicationsQueue.add("scheduleCommunication", data, {
        delay,
        priority: 1,
      });
    }
  } catch (error) {
    logger.error("Failed to process scheduled communication:", error);
    throw error;
  }
}

// Handle worker events
worker.on("completed", (job) => {
  logger.info(
    `Communications job ${job.id} (${job.name}) completed successfully`
  );
});

worker.on("failed", (job, error) => {
  logger.error(`Communications job ${job?.id} (${job?.name}) failed:`, error);
});

worker.on("stalled", (jobId) => {
  logger.warn(`Communications job ${jobId} stalled`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down communications worker...");
  await worker.close();
});

process.on("SIGINT", async () => {
  logger.info("Shutting down communications worker...");
  await worker.close();
});

// Helper functions to add jobs to queue
export async function addCommunicationJob(
  jobType: ProcessWebhookJob["type"],
  data: any,
  options?: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: "fixed" | "exponential";
      delay: number;
    };
    priority?: number;
  }
): Promise<string> {
  const job = await communicationsQueue.add(jobType, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
    ...options,
  });

  return job.id as string;
}

export default worker;
