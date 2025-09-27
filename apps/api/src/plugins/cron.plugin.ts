import { cron, Patterns } from "@elysiajs/cron";
import { backupService, webhooksService } from "@kaa/services";
import { logger } from "@kaa/utils";
import type { Elysia } from "elysia";

export const cronPlugin = (app: Elysia) =>
  app
    .use(
      cron({
        name: "cleanup-expired-backups",
        pattern: Patterns.EVERY_DAY_AT_MIDNIGHT,
        run() {
          logger.info("Cleaning up expired backups");
          backupService.cleanupExpiredBackups();
          logger.info("Expired backups cleaned up");
        },
      })
    )
    .use(
      cron({
        name: "webhook-delivery-processor",
        pattern: Patterns.EVERY_30_SECONDS,
        run() {
          // logger.info("Starting webhook delivery processor");
          logger.info("Running webhook delivery processor");
          webhooksService.processWebhookDeliveries();
          // logger.info("Run webhook delivery processor");
        },
      })
    )
    .get(
      "/stop",
      ({
        store: {
          cron: {
            "cleanup-expired-backups": cleanupExpiredBackups,
            "webhook-delivery-processor": webhookDeliveryProcessor,
          },
        },
      }) => {
        logger.info("Stopping running cron jobs");

        // logger.info("Stopping cleanup expired backups");
        cleanupExpiredBackups.stop();
        logger.info("Cleanup expired backups stopped");

        webhookDeliveryProcessor.stop();
        logger.info("Webhook delivery processor stopped");

        return {
          message: "Stopped cron jobs",
        };
      }
    );
