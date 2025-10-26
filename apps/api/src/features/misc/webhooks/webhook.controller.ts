import crypto from "node:crypto";
import { type WebhookEventType, WebhookSecurityType } from "@kaa/models/types";
import { webhooksService } from "@kaa/services";
import { webhooksRepository } from "@kaa/services/repositories";
import { AppError } from "@kaa/utils";
import { Elysia, t } from "elysia";
import mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rolePlugin } from "~/features/rbac/rbac.plugin";
import {
  createWebhookSchema,
  queryUserWebhooksSchema,
  updateWebhookSchema,
} from "./webhook.schema";
// import { rateLimitPlugin } from "~/plugins/rate-limit.plugin";

export const webhooksRoutes = new Elysia({ prefix: "/webhooks" })
  .get(
    "/events",
    ({ set }) => {
      try {
        set.status = 200;
        return {
          status: "success",
          events: webhooksService.getSupportedEvents(),
        };
      } catch (error) {
        return error;
      }
    },
    {
      detail: {
        tags: ["webhooks"],
        summary: "Get available webhook events",
      },
    }
  )
  .use(authPlugin)
  //   .use(rateLimitPlugin)

  // Webhook configuration management
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        // Validate URL
        // const isValidUrl = await validateWebhookUrl(url);
        // if (!isValidUrl) {
        // 	return new AppError("Invalid webhook URL", 400);
        // }

        // Validate events
        const availableEvents = await webhooksService.getSupportedEvents();
        const invalidEvents = body.events.filter(
          (event: WebhookEventType) => !availableEvents.includes(event)
        );

        if (invalidEvents.length > 0) {
          set.status = 400;
          return {
            status: "error",
            message: `Invalid events: ${invalidEvents.join(", ")}`,
          };
        }

        // Generate webhook secret
        const secret = crypto.randomBytes(32).toString("hex");

        // Create webhook
        const webhook = await webhooksService.createWebhook(body, user.id);

        set.status = 201;
        return { status: "success", data: webhook };
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to create webhook", details: error.message };
      }
    },
    {
      // beforeHandle: ({ requireAuth }) => requireAuth(),
      body: createWebhookSchema,
      detail: {
        tags: ["Webhooks"],
        summary: "Create webhook",
        description: "Create a new webhook configuration",
      },
    }
  )

  .get(
    "/:webhookId",
    async ({ params }) => {
      const webhook = await webhooksService.getWebhook(params.webhookId);
      return { status: "success", data: webhook };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Get webhook",
        description: "Get webhook configuration by ID",
      },
    }
  )

  .get(
    "/user/webhooks",
    async ({ user }) => {
      const webhooks = await webhooksService.getUserWebhooks(user.id);
      return { status: "success", data: webhooks };
    },
    {
      query: queryUserWebhooksSchema,
      detail: {
        tags: ["Webhooks"],
        summary: "Get user webhooks",
        description: "Get all webhooks for the authenticated user",
      },
    }
  )

  .put(
    "/:webhookId",
    async ({ params, body, user }) => {
      const webhook = await webhooksService.updateWebhook(
        params.webhookId,
        body,
        user.id
      );
      return { status: "success", data: webhook };
    },
    {
      body: updateWebhookSchema,
      detail: {
        tags: ["Webhooks"],
        summary: "Update webhook",
        description: "Update webhook configuration",
      },
    }
  )

  .delete(
    "/:webhookId",
    async ({ params }) => {
      await webhooksService.deleteWebhook(params.webhookId);
      return { status: "success", data: "Webhook deleted successfully" };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Delete webhook",
        description: "Delete a webhook configuration",
      },
    }
  )

  .use(rolePlugin)
  .post(
    "/:id/regenerate-secret",
    async ({ set, params, user, role }) => {
      try {
        const webhookId = params.id;

        // Get webhook from database
        const webhook = await webhooksRepository.getWebhookById(webhookId);

        if (!webhook) {
          return new AppError("Webhook not found", 404);
        }

        // Check if user has access to this webhook
        if (
          webhook.userId !== new mongoose.Types.ObjectId(user?.id) &&
          role.name !== "admin"
        ) {
          return new AppError(
            "You do not have permission to update this webhook",
            403
          );
        }

        // Generate new secret
        const secret = crypto.randomBytes(32).toString("hex");

        // Update webhook
        await webhooksRepository.updateWebhook(webhookId, {
          security: {
            hmacSecret: secret,
            type: WebhookSecurityType.HMAC_SHA256,
          },
        });

        set.status = 200;
        return {
          status: "success",
          secret,
        };
      } catch (error) {
        return error;
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["webhooks"],
        summary: "Regenerate webhook secret",
      },
    }
  )

  // Webhook testing and management
  .post(
    "/:webhookId/test",
    async ({ params }) => {
      const result = await webhooksService.testWebhook(params.webhookId);
      return { status: "success", data: result };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Test webhook",
        description: "Send a test payload to the webhook endpoint",
      },
    }
  )

  .post(
    "/:webhookId/activate",
    async ({ params, user }) => {
      await webhooksService.updateWebhook(
        params.webhookId,
        { isActive: true },
        user.id
      );
      return { status: "success", data: "Webhook activated successfully" };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Activate webhook",
        description: "Activate a webhook configuration",
      },
    }
  )

  .post(
    "/:webhookId/deactivate",
    async ({ params, user }) => {
      await webhooksService.updateWebhook(
        params.webhookId,
        { isActive: false },
        user.id
      );
      return { status: "success", data: "Webhook deactivated successfully" };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Deactivate webhook",
        description: "Deactivate a webhook configuration",
      },
    }
  )

  // Delivery tracking
  .get(
    "/:webhookId/deliveries",
    async ({ params }) => {
      const deliveries = await webhooksService.getDeliveryHistory(
        params.webhookId
      );
      return {
        status: "success",
        data: deliveries,
        pagination: deliveries.pagination,
      };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Deliveries"],
        summary: "Get webhook deliveries",
        description: "Get delivery history for a webhook",
      },
    }
  )

  .get(
    "/deliveries/:deliveryId",
    async ({ params }) => {
      const delivery = await webhooksService.getWebhookDelivery(
        params.deliveryId
      );
      return { status: "success", data: delivery };
    },
    {
      params: t.Object({
        deliveryId: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Deliveries"],
        summary: "Get webhook delivery",
        description: "Get details of a specific webhook delivery",
      },
    }
  )

  .post(
    "/deliveries/:deliveryId/redeliver",
    async ({ params }) => {
      await webhooksService.redeliverWebhook(params.deliveryId);
      return { status: "success", data: "Webhook redelivered successfully" };
    },
    {
      params: t.Object({
        deliveryId: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Deliveries"],
        summary: "Redeliver webhook",
        description: "Retry delivery of a failed webhook",
      },
    }
  )

  // Events and analytics
  .get(
    "/:webhookId/events",
    async ({ params }) => {
      const events = await webhooksService.getWebhookEvents(params.webhookId);
      return { status: "success", data: events };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Events"],
        summary: "Get webhook events",
        description: "Get events associated with a webhook",
      },
    }
  )

  .get(
    "/:webhookId/analytics",
    async ({ params }) => {
      const analytics = await webhooksService.getWebhookStats(params.webhookId);
      return { status: "success", data: analytics };
    },
    {
      params: t.Object({
        webhookId: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Analytics"],
        summary: "Get webhook analytics",
        description: "Get analytics and metrics for a webhook",
      },
    }
  )

  // Incoming webhooks (no auth required)
  .post(
    "/incoming/:service",
    async ({ params }) => {
      await webhooksService.handleIncomingWebhook(params.service);
      return { status: "success", data: "Webhook handled successfully" };
    },
    {
      params: t.Object({
        service: t.String(),
      }),
      detail: {
        tags: ["Webhooks", "Incoming"],
        summary: "Handle incoming webhook",
        description: "Handle incoming webhook from external services",
      },
    }
  )

  // Utility endpoints
  .get(
    "/events/supported",
    async () => {
      const events = await webhooksService.getSupportedEvents();
      return { status: "success", data: events };
    },
    {
      detail: {
        tags: ["Webhooks", "Events"],
        summary: "Get supported events",
        description: "Get list of all supported webhook events",
      },
    }
  );
