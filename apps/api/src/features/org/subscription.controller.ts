import config from "@kaa/config/api";
import { subscriptionService } from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import type mongoose from "mongoose";
import { authPlugin, rolesPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const subscriptionController = new Elysia({
  detail: {
    tags: ["subscriptions"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).group("/subscriptions", (app) =>
  // Get all subscription plans (public)
  app
    .get(
      "/plans",
      async () => {
        const result = await subscriptionService.getPlans();
        return result;
      },
      {
        detail: {
          summary: "Get subscription plans",
          tags: ["subscriptions"],
        },
      }
    )

    // Get user's subscription
    .use(authPlugin)
    .get(
      "/my-subscription",
      async ({ set, user }) => {
        try {
          const { subscription: result, plan } =
            await subscriptionService.getSubscription(
              user.id,
              user.memberId as string
            );

          set.status = 200;
          return {
            status: "success",
            subscription: {
              ...result,
              id: (result._id as mongoose.Types.ObjectId).toString(),
              plan: result.plan.toString(),
              memberId: result.memberId.toString(),
              userId: result.userId.toString(),
              startDate: result.startDate.toString(),
              endDate: result.endDate.toString(),
              trialEndsAt: result.trialEndsAt?.toString(),
              canceledAt: result.canceledAt?.toString(),
              paymentMethod: result.paymentMethod as any,
              billing: {
                ...result.billing,
                nextBillingDate: result.billing.nextBillingDate.toString(),
              },
              usage: {
                ...result.usage,
                resetDate: result.usage.resetDate.toString(),
              },
              createdAt: result.createdAt.toString(),
              updatedAt: result.updatedAt.toString(),
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get subscription",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            subscription: t.Object({
              id: t.String(),
              userId: t.String(),
              memberId: t.String(),
              plan: t.String(),
              status: t.String(),
              startDate: t.String(),
              endDate: t.String(),
              trialEndsAt: t.Optional(t.String()),
              canceledAt: t.Optional(t.String()),
              autoRenew: t.Boolean(),
              paymentMethod: t.Object({ type: t.String() }),
              billing: t.Object({
                amount: t.Number(),
                currency: t.String(),
                interval: t.String(),
                nextBillingDate: t.String(),
                intervalCount: t.Number(),
              }),
              usage: t.Object({
                requests: t.Number(),
                storage: t.Number(),
                users: t.Number(),
                resetDate: t.String(),
              }),
              quota: t.Object({
                requests: t.Number(),
                storage: t.Number(),
                users: t.Number(),
              }),
              createdAt: t.String(),
              updatedAt: t.String(),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        security: [{ bearerAuth: [] }],
        detail: {
          summary: "Get my subscription",
          tags: ["subscriptions"],
        },
      }
    )

    // Get subscription for tenant
    .get(
      "/subscription",
      async ({ user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.getSubscription(
          user.id,
          user.memberId as string
        );
        return result;
      },
      {
        detail: {
          summary: "Get subscription",
          tags: ["subscriptions"],
        },
      }
    )

    // Create/update subscription
    // Create subscription (admin only)
    .use(rolesPlugin(["admin"]))
    .post(
      "/subscribe",
      async ({ body, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.createSubscription(
          user.id,
          user.memberId as string,
          body
        );
        logger.info(`User subscribed to ${body.plan}: ${user.id}`);
        return result;
      },
      {
        body: t.Object({
          plan: t.String({ enum: ["free", "basic", "premium", "enterprise"] }),
          interval: t.String({ enum: ["monthly", "yearly"] }),
          paymentMethodId: t.Optional(t.String()),
        }),
        detail: {
          summary: "Subscribe to a plan",
          tags: ["subscriptions"],
        },
      }
    )

    // Change subscription
    // Update subscription (admin only)
    .use(rolesPlugin(["admin"]))
    .patch(
      "/change-plan",
      async ({ body, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.changeSubscription(
          user.id,
          user.memberId as string,
          body
        );
        logger.info(`User changed subscription to ${body.plan}: ${user.id}`);
        return result;
      },
      {
        body: t.Object({
          plan: t.String({ enum: ["free", "basic", "premium", "enterprise"] }),
          interval: t.Optional(t.String({ enum: ["monthly", "yearly"] })),
        }),
        detail: {
          summary: "Change subscription plan",
          tags: ["subscriptions"],
        },
      }
    )

    // Cancel subscription
    .use(authPlugin)
    // Cancel subscription (admin only)
    .use(rolesPlugin(["admin"]))
    .post(
      "/cancel",
      async ({ body, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.cancelSubscription(
          user.id,
          user.memberId as string,
          body?.immediate
        );
        logger.info(`User canceled subscription: ${user.id}`);
        return result;
      },
      {
        body: t.Optional(
          t.Object({
            immediate: t.Optional(t.Boolean()),
          })
        ),
        detail: {
          summary: "Cancel subscription",
          tags: ["subscriptions"],
        },
      }
    )

    // Track usage (internal API)
    .use(authPlugin)
    .post(
      "/usage/track",
      async ({ body, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.trackUsage(
          user.id,
          user.memberId as string,
          body.type as "requests" | "storage" | "users",
          body.amount,
          body.metadata as Record<string, any>
        );
        return { status: "success", usage: result };
      },
      {
        body: t.Object({
          type: t.String({ enum: ["requests", "storage", "users"] }),
          amount: t.Number({ minimum: 0 }),
          metadata: t.Optional(t.Object({})),
        }),
        detail: {
          summary: "Track usage",
          tags: ["subscriptions"],
        },
      }
    )

    // Get usage statistics
    .use(authPlugin)
    .get(
      "/usage/stats",
      async ({ query, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.getUsageStats(
          user.id,
          user.memberId as string,
          query
        );
        return result;
      },
      {
        detail: {
          summary: "Get usage statistics",
          tags: ["subscriptions"],
        },
      }
    )

    // Get user subscription (admin/manager only)
    .use(accessPlugin("subscriptions", "read"))
    .get(
      "/users/:userId",
      async ({ params, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.getAppSubscription(
          params.userId,
          user.memberId as string
        );
        return result;
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        detail: {
          summary: "Get user subscription (admin)",
          tags: ["subscriptions"],
        },
      }
    )

    // Change user subscription (admin only)
    .use(accessPlugin("subscriptions", "update"))
    .patch(
      "/users/:userId/change-plan",
      async ({ params, body, user }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await subscriptionService.changeSubscription(
          params.userId,
          user.memberId as string,
          body
        );
        logger.info(
          `Admin changed user subscription to ${body.plan}: ${params.userId}`
        );
        return result;
      },
      {
        params: t.Object({
          userId: t.String(),
        }),
        body: t.Object({
          plan: t.String({ enum: ["free", "basic", "premium", "enterprise"] }),
          interval: t.Optional(t.String({ enum: ["monthly", "yearly"] })),
        }),
        detail: {
          summary: "Change user subscription (admin)",
          tags: ["subscriptions"],
        },
      }
    )

    // Process renewals (admin only - for cron jobs)
    .use(accessPlugin("subscriptions", "update"))
    .post(
      "/process-renewals",
      async () => {
        const result = await subscriptionService.processRenewals();
        logger.info(
          `Processed ${result.processed} renewals, ${result.failed} failed`
        );
        return result;
      },
      {
        detail: {
          summary: "Process subscription renewals",
          tags: ["subscriptions"],
        },
      }
    )

    // Stripe webhook handler (public)
    .post(
      "/webhook",
      async ({ body, request }) => {
        // In production, verify Stripe signature
        const signature = request.headers.get("stripe-signature");

        if (!signature && config.env === "production") {
          return {
            error: "Missing Stripe signature",
          };
        }

        // Process webhook
        const result = await subscriptionService.handleStripeWebhook(body);
        return result;
      },
      {
        detail: {
          summary: "Handle Stripe webhook",
          tags: ["subscriptions"],
        },
      }
    )
);
