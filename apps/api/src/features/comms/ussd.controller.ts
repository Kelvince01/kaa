/**
 * USSD Controller for Virtual Tours
 * Handles USSD gateway requests and responses
 */

import { ussdService } from "@kaa/services";
import Elysia, { t } from "elysia";

export const ussdController = new Elysia().group("/ussd", (app) =>
  app
    .post(
      "/callback",
      async ({ body, set }) => {
        try {
          const { sessionId, phoneNumber, text, serviceCode, networkCode } =
            body;

          // Handle USSD request
          const response = await ussdService.handleUSSDRequest(
            sessionId,
            phoneNumber,
            text,
            networkCode
          );

          // Format response for USSD gateway
          const formattedResponse = `${response.type} ${response.response}`;

          set.status = 200;
          set.headers["Content-Type"] = "text/plain";

          return formattedResponse;
        } catch (error) {
          console.error("USSD callback error:", error);
          set.status = 200;
          set.headers["Content-Type"] = "text/plain";
          return "END Service temporarily unavailable. Please try again later.";
        }
      },
      {
        body: t.Object({
          sessionId: t.String(),
          phoneNumber: t.String(),
          text: t.String(),
          serviceCode: t.Optional(t.String()),
          networkCode: t.Optional(t.String()),
        }),
        detail: {
          tags: ["ussd"],
          summary: "Handle USSD callback",
          description: "Handle incoming USSD requests from the gateway",
        },
      }
    )
    .get(
      "/stats",
      async ({ set }) => {
        try {
          const stats = await ussdService.getSessionStats();

          set.status = 200;
          return {
            status: "success",
            message: "USSD statistics retrieved successfully",
            data: stats,
          };
        } catch (error) {
          console.error("USSD stats error:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to retrieve USSD statistics",
          };
        }
      },
      {
        detail: {
          tags: ["ussd"],
          summary: "Get USSD statistics",
          description: "Get USSD service usage statistics",
        },
      }
    )
    .get(
      "/health",
      async ({ set }) => {
        try {
          const health = await ussdService.getHealth();

          set.status = health.isHealthy ? 200 : 503;
          return {
            status: "success",
            message: "USSD health status retrieved successfully",
            data: health,
          };
        } catch (error) {
          console.error("USSD health check error:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to check USSD health",
          };
        }
      },
      {
        detail: {
          tags: ["ussd"],
          summary: "Get USSD health status",
          description: "Check the health and status of the USSD service",
        },
      }
    )
    .delete(
      "/session/:sessionId",
      async ({ params, set }) => {
        try {
          const { sessionId } = params;
          const success = await ussdService.endSession(sessionId);

          if (success) {
            set.status = 200;
            return {
              status: "success",
              message: "USSD session ended successfully",
            };
          }
          set.status = 404;
          return {
            status: "error",
            message: "USSD session not found",
          };
        } catch (error) {
          console.error("End USSD session error:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to end USSD session",
          };
        }
      },
      {
        params: t.Object({
          sessionId: t.String(),
        }),
        detail: {
          tags: ["ussd"],
          summary: "End USSD session",
          description: "Manually end a USSD session",
        },
      }
    )
);
