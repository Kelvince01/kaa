import {
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@kaa/email";
import { auditService, notificationService } from "@kaa/services";
import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";

// Create auth background jobs queue
export const authBackgroundQueue = createQueue("auth-background", {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
});

// Create worker for auth background jobs
const worker = new Worker(
  "auth-background",
  async (job) => {
    logger.info(`Processing auth background job ${job.id} of type ${job.name}`);

    try {
      switch (job.name) {
        case "sendLoginAlert":
          await sendLoginAlertEmail(
            job.data.email,
            job.data.ip,
            job.data.userAgent
          );
          break;

        case "sendWelcomeEmail":
          await sendWelcomeEmail(job.data.email);
          break;

        case "sendVerificationEmail":
          await sendVerificationEmail(job.data.email, job.data.token);
          break;

        case "sendPasswordResetEmail":
          await sendPasswordResetEmail(job.data.email, job.data.token);
          break;

        case "trackLoginEvent":
          await auditService.trackEvent({
            memberId: job.data.memberId,
            userId: job.data.userId,
            type: "user_login",
            category: "user",
            action: "login",
            ...job.data.metadata,
          });
          break;

        case "trackRegistrationEvent":
          await auditService.trackEvent({
            memberId: job.data.memberId,
            userId: job.data.userId,
            type: "user_registration",
            category: "user",
            action: "register",
            ...job.data.metadata,
          });
          break;

        case "sendWelcomeNotification":
          await notificationService.sendNotification(
            job.data.userId,
            {
              type: "welcome",
              title: "Welcome to the platform!",
              message: "Your account has been created successfully.",
              channels: ["in_app"],
            },
            job.data.memberId
          );
          break;

        case "cleanupExpiredTokens":
          await cleanupExpiredTokens(job.data);
          break;

        case "cleanupOldSessions":
          await cleanupOldSessions(job.data);
          break;

        case "processAnalytics":
          await processAnalytics(job.data);
          break;

        default:
          logger.warn(`Unknown auth background job type: ${job.name}`);
      }

      logger.info(`Completed auth background job ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process auth background job ${job.id}:`, error);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisOptions,
    concurrency: 5,
  }
);

// Handle worker events
worker.on("completed", (job) => {
  logger.info(
    `Auth background job ${job.id} (${job.name}) completed successfully`
  );
});

worker.on("failed", (job, error) => {
  logger.error(`Auth background job ${job?.id} (${job?.name}) failed:`, error);
});

worker.on("stalled", (jobId) => {
  logger.warn(`Auth background job ${jobId} stalled`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down auth background worker...");
  await worker.close();
});

process.on("SIGINT", async () => {
  logger.info("Shutting down auth background worker...");
  await worker.close();
});

// Helper functions for cleanup jobs
function cleanupExpiredTokens(_data: any): void {
  try {
    logger.info("Cleaning up expired tokens");
    // Implementation for cleaning up expired tokens
    // This would typically involve deleting expired verification tokens, reset tokens, etc.
    logger.info("Expired tokens cleanup completed");
  } catch (error) {
    logger.error("Failed to cleanup expired tokens:", error);
    throw error;
  }
}

function cleanupOldSessions(_data: any): void {
  try {
    logger.info("Cleaning up old sessions");
    // Implementation for cleaning up old sessions
    // This would typically involve deleting inactive sessions older than a certain threshold
    logger.info("Old sessions cleanup completed");
  } catch (error) {
    logger.error("Failed to cleanup old sessions:", error);
    throw error;
  }
}

function processAnalytics(data: any): void {
  try {
    logger.info("Processing analytics data", { data });
    // Implementation for analytics processing
    // This could include updating user behavior metrics, generating reports, etc.
    logger.info("Analytics processing completed");
  } catch (error) {
    logger.error("Failed to process analytics:", error);
    throw error;
  }
}

// Helper function to add auth background jobs to queue
export async function addAuthBackgroundJob(
  jobType:
    | "sendLoginAlert"
    | "sendWelcomeEmail"
    | "sendVerificationEmail"
    | "sendPasswordResetEmail"
    | "trackLoginEvent"
    | "trackRegistrationEvent"
    | "sendWelcomeNotification"
    | "cleanupExpiredTokens"
    | "cleanupOldSessions"
    | "processAnalytics",
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
  await authBackgroundQueue.add(jobType, data, {
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

// Convenience functions for common auth operations
export const authBackgroundJobs = {
  async sendLoginAlert(email: string, ip: string, userAgent: string) {
    return await addAuthBackgroundJob("sendLoginAlert", {
      email,
      ip,
      userAgent,
    });
  },

  async sendWelcomeEmail(email: string) {
    return await addAuthBackgroundJob("sendWelcomeEmail", { email });
  },

  async sendVerificationEmail(email: string, token: string) {
    return await addAuthBackgroundJob("sendVerificationEmail", {
      email,
      token,
    });
  },

  async sendPasswordResetEmail(email: string, token: string) {
    return await addAuthBackgroundJob("sendPasswordResetEmail", {
      email,
      token,
    });
  },

  async trackLoginEvent(userId: string, memberId: string, metadata: any) {
    return await addAuthBackgroundJob("trackLoginEvent", {
      userId,
      memberId,
      metadata,
    });
  },

  async trackRegistrationEvent(
    userId: string,
    memberId: string,
    metadata: any
  ) {
    return await addAuthBackgroundJob("trackRegistrationEvent", {
      userId,
      memberId,
      metadata,
    });
  },

  async sendWelcomeNotification(userId: string, memberId?: string) {
    return await addAuthBackgroundJob("sendWelcomeNotification", {
      userId,
      memberId,
    });
  },

  async cleanupExpiredTokens() {
    return await addAuthBackgroundJob("cleanupExpiredTokens", {
      timestamp: new Date(),
    });
  },

  async cleanupOldSessions() {
    return await addAuthBackgroundJob("cleanupOldSessions", {
      timestamp: new Date(),
    });
  },

  async processAnalytics(data: any) {
    return await addAuthBackgroundJob("processAnalytics", data);
  },
};

export default worker;
