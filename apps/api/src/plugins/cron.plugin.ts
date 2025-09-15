import { cron, Patterns } from "@elysiajs/cron";
import { backupService } from "@kaa/services";
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
    .get(
      "/stop",
      ({
        store: {
          cron: { "cleanup-expired-backups": cleanupExpiredBackups },
        },
      }) => {
        logger.info("Stopping cleanup expired backups");
        cleanupExpiredBackups.stop();
        logger.info("Cleanup expired backups stopped");

        return {
          message: "Stopped cron jobs",
        };
      }
    );
