import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";
import { smsService } from "../sms.service";

// Create queue
export const smsQueue = createQueue("sms");

// Create worker
const worker = new Worker(
  "sms",
  async (job: any) => {
    logger.info(`Processing SMS job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case "sendSms":
          await smsService.processSmsMessage(job.data.messageId);
          break;

        case "sendBulkSms":
          // Handle bulk SMS processing
          await processBulkSms(job.data);
          break;

        case "processDeliveryReport":
          // Handle delivery report processing
          await smsService.updateDeliveryStatus(job.data);
          break;

        case "retrySms":
          // Handle SMS retry
          await retrySmsMessage(job.data.messageId);
          break;

        case "scheduleReminder":
          // Handle scheduled reminders
          await processScheduledSms(job.data);
          break;

        default:
          logger.warn(`Unknown SMS job type: ${job.name}`);
      }

      logger.info(`Completed SMS job ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process SMS job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisOptions,
    concurrency: 10, // Increased concurrency for better throughput
    // removeOnComplete: 100, // Keep the last 100 completed jobs
    // removeOnFail: 50, // Keep the last 50 failed jobs
  }
);

/**
 * Process bulk SMS messages
 */
async function processBulkSms(bulkData: any): Promise<void> {
  try {
    const { bulkId, batchIndex, messageIds } = bulkData;

    logger.info(`Processing bulk SMS batch ${batchIndex} for bulk ${bulkId}`);

    // Process each message in the batch
    for (const messageId of messageIds) {
      try {
        await smsService.processSmsMessage(messageId);
      } catch (error) {
        logger.error(
          `Failed to process message ${messageId} in bulk ${bulkId}:`,
          error
        );
        // Continue with other messages
      }
    }

    logger.info(`Completed bulk SMS batch ${batchIndex} for bulk ${bulkId}`);
  } catch (error) {
    logger.error("Failed to process bulk SMS:", error);
    throw error;
  }
}

/**
 * Retry failed SMS message
 */
async function retrySmsMessage(messageId: string): Promise<void> {
  try {
    logger.info(`Retrying SMS message ${messageId}`);
    await smsService.processSmsMessage(messageId);
  } catch (error) {
    logger.error(`Failed to retry SMS message ${messageId}:`, error);
    throw error;
  }
}

/**
 * Process scheduled SMS messages
 */
async function processScheduledSms(scheduleData: any): Promise<void> {
  try {
    const { messageId, scheduledAt } = scheduleData;

    // Check if it's time to send
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);

    if (now >= scheduledTime) {
      await smsService.processSmsMessage(messageId);
    } else {
      // Reschedule for later
      const delay = scheduledTime.getTime() - now.getTime();
      await smsQueue.add("scheduleReminder", scheduleData, { delay });
    }
  } catch (error) {
    logger.error("Failed to process scheduled SMS:", error);
    throw error;
  }
}

// Handle worker events
worker.on("completed", (job) => {
  logger.info(`SMS job ${job.id} (${job.name}) completed successfully`);
});

worker.on("failed", (job, error) => {
  logger.error(`SMS job ${job?.id} (${job?.name}) failed:`, error);
});

worker.on("stalled", (jobId) => {
  logger.warn(`SMS job ${jobId} stalled`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down SMS worker...");
  await worker.close();
});

process.on("SIGINT", async () => {
  logger.info("Shutting down SMS worker...");
  await worker.close();
});

// Helper function to add an SMS job to queue
export async function addSmsJob(
  jobType:
    | "sendSms"
    | "sendBulkSms"
    | "processDeliveryReport"
    | "retrySms"
    | "scheduleReminder",
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
): Promise<void> {
  await smsQueue.add(jobType, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
    ...options,
  });
}

export default worker;
