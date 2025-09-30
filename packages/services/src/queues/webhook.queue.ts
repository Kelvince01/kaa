import { WebhookStatus } from "@kaa/models/types";
import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";
import { webhooksService } from "../misc/webhook.service";

// Create queue
export const webhookQueue = createQueue("webhook");

// Create worker
const worker = new Worker(
  "webhook",
  async (job: any) => {
    logger.info(`Processing webhook job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case "deliverWebhook":
          await handleDeliverWebhook(job.data);
          break;

        case "retryWebhook":
          await handleRetryWebhook(job.data);
          break;

        case "scheduleWebhook":
          await handleScheduleWebhook(job.data);
          break;

        default:
          logger.warn(`Unknown webhook job type: ${job.name}`);
      }

      logger.info(`Completed webhook job ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process webhook job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisOptions,
    concurrency: 15, // Moderate concurrency for webhook deliveries
    // removeOnComplete: 100, // Keep the last 100 completed jobs
    // removeOnFail: 50, // Keep the last 50 failed jobs
  }
);

/**
 * Handle webhook delivery
 */
async function handleDeliverWebhook(data: {
  deliveryId: string;
}): Promise<void> {
  const { deliveryId } = data;

  try {
    logger.info(`Processing webhook delivery ${deliveryId}`);

    // Get delivery from database
    const delivery = await webhooksService.getWebhookDelivery(deliveryId);
    if (!delivery) {
      throw new Error(`Webhook delivery ${deliveryId} not found`);
    }

    // Use the existing deliverWebhook method
    await webhooksService.deliverWebhook(delivery);

    logger.info(`Webhook delivery ${deliveryId} processed successfully`);
  } catch (error) {
    logger.error(`Failed to deliver webhook ${deliveryId}:`, error);
    throw error;
  }
}

/**
 * Handle webhook retry
 */
async function handleRetryWebhook(data: {
  deliveryId: string;
  reason?: string;
}): Promise<void> {
  const { deliveryId, reason } = data;

  try {
    logger.info(
      `Retrying webhook delivery ${deliveryId}. Reason: ${reason || "Unknown"}`
    );

    // Get delivery and reset for retry
    const delivery = await webhooksService.getWebhookDelivery(deliveryId, {
      status: [WebhookStatus.FAILED],
      nextRetryAt: new Date(),
    });
    if (!delivery) {
      throw new Error(`Webhook delivery ${deliveryId} not found`);
    }

    // Reset delivery for retry
    delivery.status = WebhookStatus.PENDING;
    delivery.attempt = 1;
    delivery.nextRetryAt = new Date();

    // Process the delivery
    await webhooksService.deliverWebhook(delivery);

    logger.info(`Webhook delivery ${deliveryId} retry completed`);
  } catch (error) {
    logger.error(`Failed to retry webhook delivery ${deliveryId}:`, error);
    throw error;
  }
}

/**
 * Handle scheduled webhook delivery
 */
async function handleScheduleWebhook(data: {
  deliveryId: string;
  scheduledAt: string;
}): Promise<void> {
  const { deliveryId, scheduledAt } = data;

  try {
    logger.info(
      `Processing scheduled webhook delivery ${deliveryId} at ${scheduledAt}`
    );

    // Check if it's time to deliver
    const now = new Date();
    const scheduledTime = new Date(scheduledAt);

    if (now >= scheduledTime) {
      await handleDeliverWebhook({ deliveryId });
    } else {
      // Reschedule for later
      const delay = scheduledTime.getTime() - now.getTime();
      await webhookQueue.add("scheduleWebhook", data, {
        delay,
        priority: 1,
      });
    }
  } catch (error) {
    logger.error(
      `Failed to process scheduled webhook delivery ${deliveryId}:`,
      error
    );
    throw error;
  }
}

// Handle worker events
worker.on("completed", (job) => {
  logger.info(`Webhook job ${job.id} (${job.name}) completed successfully`);
});

worker.on("failed", (job, error) => {
  logger.error(`Webhook job ${job?.id} (${job?.name}) failed:`, error);
});

worker.on("stalled", (jobId) => {
  logger.warn(`Webhook job ${jobId} stalled`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down webhook worker...");
  await worker.close();
});

process.on("SIGINT", async () => {
  logger.info("Shutting down webhook worker...");
  await worker.close();
});

// Helper function to add a webhook job to queue
export async function addWebhookJob(
  jobType: "deliverWebhook" | "retryWebhook" | "scheduleWebhook",
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
  const job = await webhookQueue.add(jobType, data, {
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
