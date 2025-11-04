import config from "@kaa/config/api";
import { billingService } from "@kaa/services";
import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

export const billingController = new Elysia({
  detail: {
    tags: ["Billing"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).group("/billing", (app) =>
  app
    .use(authPlugin)

    // Get invoices for tenant
    .get(
      "/invoices",
      async ({ user, query }) => {
        if (!user) throw new Error("User not authenticated");
        const result = await billingService.getInvoices(
          user.memberId as string,
          query
        );
        return result;
      },
      {
        detail: {
          summary: "Get invoices",
          tags: ["billing"],
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
        const result = await billingService.handleStripeWebhook(body);
        return result;
      },
      {
        detail: {
          summary: "Handle Stripe webhook",
          tags: ["billing"],
        },
      }
    )
);
