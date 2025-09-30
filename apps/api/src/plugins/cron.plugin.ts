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
        name: "webhook-delivery-retries",
        pattern: Patterns.EVERY_5_SECONDS,
        run() {
          // logger.info("Starting webhook delivery processor");
          logger.info("Running webhook retries processor");
          webhooksService.processRetries();
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
            "webhook-delivery-retries": webhookDeliveryRetries,
          },
        },
      }) => {
        logger.info("Stopping running cron jobs");

        // logger.info("Stopping cleanup expired backups");
        cleanupExpiredBackups.stop();
        logger.info("Cleanup expired backups stopped");

        logger.info("Stopping webhook retries processor");
        webhookDeliveryRetries.stop();
        logger.info("Webhook retries processor stopped");

        return {
          message: "Stopped cron jobs",
        };
      }
    );
