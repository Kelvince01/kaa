import { subscriptionService } from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

/**
 * Plugin to track API request usage
 */
export const usageTrackingPlugin = (app: Elysia) =>
  app.use(authPlugin).derive(async ({ user, request }) => {
    if (!user) return {};

    try {
      // Track API request usage
      await subscriptionService.trackUsage(
        user.id,
        user.memberId as string,
        "requests",
        1,
        {
          endpoint: new URL(request.url).pathname,
          method: request.method,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      // If quota exceeded, the trackUsage function will throw an error
      if (error instanceof Error && error.message.includes("quota exceeded")) {
        throw error;
      }
      // Log other errors but don't fail the request
      logger.error("Error tracking usage", error);
    }

    return {};
  });

/**
 * Plugin to check storage quota before file uploads
 */
export const storageQuotaPlugin = (sizeInMB: number) =>
  new Elysia().use(authPlugin).derive(async ({ user }) => {
    if (!user) return {};

    try {
      // Check if user can upload this file size
      await subscriptionService.trackUsage(
        user.id,
        user.memberId as string,
        "storage",
        sizeInMB
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("quota exceeded")) {
        throw error;
      }
      logger.error("Error checking storage quota", error);
    }

    return {};
  });

/**
 * Plugin to check user quota before creating users
 */
export const userQuotaPlugin = new Elysia()
  .use(authPlugin)
  .derive(async ({ user }) => {
    if (!user) return {};

    try {
      // Check if tenant can add more users
      await subscriptionService.trackUsage(
        user.id,
        user.memberId as string,
        "users",
        1
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("quota exceeded")) {
        throw error;
      }
      logger.error("Error checking user quota", error);
    }

    return {};
  });
