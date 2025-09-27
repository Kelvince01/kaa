import {
  createWebhookSchema,
  queryUserWebhooksSchema,
  updateWebhookSchema,
} from "@kaa/schemas";
import { webhooksV2Service } from "@kaa/services";
import { Elysia } from "elysia";
import { z } from "zod";
import { authPlugin } from "../../auth/auth.plugin";
// import { rateLimitPlugin } from "../../plugins/rate-limit.plugin";

export const webhooksRoutes = new Elysia({ prefix: "/webhooks" })
  .use(authPlugin)
  //   .use(rateLimitPlugin)

  // Webhook configuration management
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const webhook = await webhooksV2Service.createWebhook(body, user.id);
        return { success: true, data: webhook };
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
      const webhook = await webhooksV2Service.getWebhook(params.webhookId);
      return { success: true, data: webhook };
    },
    {
      // beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      const webhooks = await webhooksV2Service.getUserWebhooks(user.id);
      return { success: true, data: webhooks };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
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
      const webhook = await webhooksV2Service.updateWebhook(
        params.webhookId,
        body,
        user.id
      );
      return { success: true, data: webhook };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
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
      await webhooksV2Service.deleteWebhook(params.webhookId);
      return { success: true, data: "Webhook deleted successfully" };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
      }),
      detail: {
        tags: ["Webhooks"],
        summary: "Delete webhook",
        description: "Delete a webhook configuration",
      },
    }
  )

  // Webhook testing and management
  .post(
    "/:webhookId/test",
    async ({ params }) => {
      const result = await webhooksV2Service.testWebhook(params.webhookId);
      return { success: true, data: result };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      await webhooksV2Service.updateWebhook(
        params.webhookId,
        { isActive: true },
        user.id
      );
      return { success: true, data: "Webhook activated successfully" };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      await webhooksV2Service.updateWebhook(
        params.webhookId,
        { isActive: false },
        user.id
      );
      return { success: true, data: "Webhook deactivated successfully" };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      const deliveries = await webhooksV2Service.getDeliveryHistory(
        params.webhookId
      );
      return { success: true, data: deliveries };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      const delivery = await webhooksV2Service.getWebhookDelivery(
        params.deliveryId
      );
      return { success: true, data: delivery };
    },
    {
      //  beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        deliveryId: z.string(),
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
      await webhooksV2Service.redeliverWebhook(params.deliveryId);
      return { success: true, data: "Webhook redelivered successfully" };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        deliveryId: z.string(),
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
      const events = await webhooksV2Service.getWebhookEvents(params.webhookId);
      return { success: true, data: events };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      const analytics = await webhooksV2Service.getWebhookStats(
        params.webhookId
      );
      return { success: true, data: analytics };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      params: z.object({
        webhookId: z.string(),
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
      await webhooksV2Service.handleIncomingWebhook(params.service);
      return { success: true, data: "Webhook handled successfully" };
    },
    {
      params: z.object({
        service: z.string(),
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
      const events = await webhooksV2Service.getSupportedEvents();
      return { success: true, data: events };
    },
    {
      //   beforeHandle: ({ requireAuth }) => requireAuth(),
      detail: {
        tags: ["Webhooks", "Events"],
        summary: "Get supported events",
        description: "Get list of all supported webhook events",
      },
    }
  );
