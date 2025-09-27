import crypto from "node:crypto";
import { getAvailableEvents } from "@kaa/models";
import { webhooksService } from "@kaa/services";
import { webhooksRepository } from "@kaa/services/repositories";
import { AppError } from "@kaa/utils";
import { Elysia, t } from "elysia";
import mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rolePlugin } from "~/features/rbac/rbac.plugin";

export const webhookController = new Elysia().group("webhooks", (app) =>
  app
    .get(
      "/events",
      ({ set }) => {
        try {
          set.status = 200;
          return {
            status: "success",
            events: getAvailableEvents(),
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
    // .use(accessPlugin("webhooks", "read"))
    .use(authPlugin)
    .get(
      "/",
      async ({ set, user }) => {
        try {
          // Get webhooks from database
          const webhooks = await webhooksRepository.getWebhooksByUserId(
            user?.id
          );

          set.status = 200;
          return {
            status: "success",
            webhooks,
          };
        } catch (error) {
          return error;
        }
      },
      {
        detail: {
          tags: ["webhooks"],
          summary: "Get all webhooks for current user",
        },
      }
    )
    .use(rolePlugin)
    .get(
      "/:id",
      async ({ set, user, role, params }) => {
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
              "You do not have permission to access this webhook",
              403
            );
          }

          set.status = 200;
          return {
            status: "success",
            webhook,
          };
        } catch (error) {
          return error;
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["webhooks"],
          summary: "Get webhook by ID",
        },
      }
    )
    .post(
      "/",
      async ({ set, body, user }) => {
        try {
          const { name, url, events, headers } = body;

          // Validate URL
          // const isValidUrl = await validateWebhookUrl(url);
          // if (!isValidUrl) {
          // 	return new AppError("Invalid webhook URL", 400);
          // }

          // Validate events
          const availableEvents = getAvailableEvents();
          const invalidEvents = events.filter(
            (event: string) => !availableEvents.includes(event)
          );

          if (invalidEvents.length > 0) {
            return new AppError(
              `Invalid events: ${invalidEvents.join(", ")}`,
              400
            );
          }

          // Generate webhook secret
          const secret = crypto.randomBytes(32).toString("hex");

          // Create webhook
          const newWebhook = await webhooksRepository.createWebhook({
            userId: new mongoose.Types.ObjectId(user?.id),
            memberId: new mongoose.Types.ObjectId(user?.memberId),
            name,
            url,
            secret,
            events,
            headers,
            isActive: true,
          });

          set.status = 201;
          return {
            status: "success",
            webhook: {
              ...newWebhook,
              secret, // Include secret in the response only once
            },
          };
        } catch (error) {
          return error;
        }
      },
      {
        body: t.Object({
          name: t.String(),
          url: t.String(),
          events: t.Array(t.String()),
          headers: t.Optional(t.Object(t.Any())),
        }),
        detail: {
          tags: ["webhooks"],
          summary: "Create a new webhook",
        },
      }
    )
    .patch(
      "/:id",
      async ({ set, params, body, user, role }) => {
        try {
          const webhookId = params.id;
          const updateData = body;

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

          // Validate URL if updating
          if (updateData.url) {
            const isValidUrl = await webhooksService.validateWebhookUrl(
              updateData.url
            );
            if (!isValidUrl) {
              return new AppError("Invalid webhook URL", 400);
            }
          }

          // Validate events if updating
          if (updateData.events) {
            const availableEvents = getAvailableEvents();
            const invalidEvents = updateData.events.filter(
              (event: string) => !availableEvents.includes(event)
            );

            if (invalidEvents.length > 0) {
              return new AppError(
                `Invalid events: ${invalidEvents.join(", ")}`,
                400
              );
            }
          }

          // Update only allowed fields
          const allowedFields = [
            "name",
            "url",
            "events",
            "headers",
            "isActive",
          ];
          for (const key of Object.keys(updateData)) {
            if (!allowedFields.includes(key)) {
              // TODO: fix this
              // @ts-expect-error
              delete updateData[key];
            }
          }

          // Update in database
          const updatedWebhook = await webhooksRepository.updateWebhook(
            webhookId,
            updateData
          );

          set.status = 200;
          return {
            status: "success",
            webhook: updatedWebhook,
          };
        } catch (error) {
          return error;
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          url: t.Optional(t.String()),
          events: t.Optional(t.Array(t.String())),
          isActive: t.Optional(t.Boolean()),
        }),
        detail: {
          tags: ["webhooks"],
          summary: "Update webhook",
        },
      }
    )
    .delete(
      "/:id",
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
              "You do not have permission to delete this webhook",
              403
            );
          }

          // Delete from database
          await webhooksRepository.deleteWebhook(webhookId);

          set.status = 204;
          return {
            status: "success",
            message: "Webhook deleted successfully",
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
          summary: "Delete webhook",
        },
      }
    )
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
          await webhooksRepository.updateWebhook(webhookId, { secret });

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
);

export const systemWebhookController = new Elysia().post(
  "/webhooks/:event",
  async ({ params, body, request }) => {
    const signature = request.headers.get("x-webhook-signature");

    // In production, verify webhook signature
    if (!signature) {
      return { error: "Missing webhook signature" };
    }

    // Process webhook event
    await webhooksService.triggerWebhooks("system", params.event, body);

    return { status: "success" };
  },
  {
    detail: {
      summary: "Webhook Endpoint",
      description: "Receive webhook events",
      tags: ["system"],
    },
  }
);
