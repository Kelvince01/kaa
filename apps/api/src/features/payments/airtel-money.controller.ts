/**
 * Airtel Money Controller for Virtual Tours
 */

import { airtelMoneyService_v1 as airtelMoneyService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

export const airtelMoneyController = new Elysia().group(
  "/airtel-money",
  (app) =>
    app
      .use(authPlugin)
      .post(
        "/pay",
        async ({ body, set }) => {
          try {
            const { phoneNumber, amount, reference, description, tourId } =
              body;

            const transaction = await airtelMoneyService.processPayment({
              phoneNumber,
              amount,
              reference,
              description,
              tourId,
            });

            set.status = 201;
            return {
              status: "success",
              message: "Airtel Money payment initiated successfully",
              data: { transaction },
            };
          } catch (error) {
            console.error("Airtel Money payment error:", error);
            set.status = 500;
            return {
              status: "error",
              message:
                (error as Error).message ||
                "Failed to process Airtel Money payment",
            };
          }
        },
        {
          body: t.Object({
            phoneNumber: t.String(),
            amount: t.Number(),
            reference: t.String(),
            description: t.String(),
            tourId: t.Optional(t.String()),
          }),
          detail: {
            tags: ["airtel-money"],
            summary: "Process Airtel Money payment",
            description: "Initiate Airtel Money payment for virtual tours",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/callback",
        async ({ body, set }) => {
          try {
            const success = await airtelMoneyService.handleCallback(body);

            set.status = success ? 200 : 400;
            return {
              status: success ? "success" : "error",
              message: success
                ? "Callback processed successfully"
                : "Failed to process callback",
            };
          } catch (error) {
            console.error("Airtel Money callback error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to process callback",
            };
          }
        },
        {
          body: t.Any(),
          detail: {
            tags: ["airtel-money"],
            summary: "Handle Airtel Money callback",
            description: "Process Airtel Money payment callback/webhook",
          },
        }
      )
      .get(
        "/verify/:transactionId",
        async ({ params, set }) => {
          try {
            const { transactionId } = params;
            const transaction =
              await airtelMoneyService.verifyPayment(transactionId);

            if (transaction) {
              set.status = 200;
              return {
                status: "success",
                message: "Transaction verified successfully",
                data: { transaction },
              };
            }
            set.status = 404;
            return {
              status: "error",
              message: "Transaction not found",
            };
          } catch (error) {
            console.error("Airtel Money verification error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to verify transaction",
            };
          }
        },
        {
          params: t.Object({
            transactionId: t.String(),
          }),
          detail: {
            tags: ["airtel-money"],
            summary: "Verify Airtel Money transaction",
            description: "Verify the status of an Airtel Money transaction",
          },
        }
      )
      .get(
        "/fees",
        async ({ set }) => {
          try {
            const feeStructure = await airtelMoneyService.getFeeStructure();

            set.status = 200;
            return {
              status: "success",
              message: "Fee structure retrieved successfully",
              data: feeStructure,
            };
          } catch (error) {
            console.error("Fee structure error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve fee structure",
            };
          }
        },
        {
          detail: {
            tags: ["airtel-money"],
            summary: "Get Airtel Money fees",
            description: "Get Airtel Money fee structure and limits",
          },
        }
      )
      .get(
        "/health",
        async ({ set }) => {
          try {
            const health = await airtelMoneyService.getHealth();

            set.status = health.isHealthy ? 200 : 503;
            return {
              status: "success",
              message: "Airtel Money health status retrieved",
              data: health,
            };
          } catch (error) {
            console.error("Airtel Money health error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to check Airtel Money health",
            };
          }
        },
        {
          detail: {
            tags: ["airtel-money"],
            summary: "Get Airtel Money service health",
            description: "Check the health status of Airtel Money service",
          },
        }
      )
);
