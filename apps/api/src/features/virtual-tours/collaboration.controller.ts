/**
 * Collaboration Controller using Elysia
 * Handles real-time collaboration for virtual tours
 */

import { CollaborationService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

const collaborationService = new CollaborationService();

export const collaborationController = new Elysia()
  .use(authPlugin)
  .group("/collaboration", (app) =>
    app
      .post(
        "/sessions",
        async ({ body, set, user }) => {
          try {
            const { tourId } = body;

            const session = await collaborationService.createSession(
              tourId,
              user.id
            );

            set.status = 201;
            return {
              status: "success",
              message: "Collaboration session created successfully",
              data: { session },
            };
          } catch (error) {
            console.error("Create collaboration session error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to create collaboration session",
            };
          }
        },
        {
          body: t.Object({
            tourId: t.String(),
          }),
          detail: {
            tags: ["collaboration"],
            summary: "Create collaboration session",
            description:
              "Create a new real-time collaboration session for a tour",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/sessions/:sessionId",
        ({ params, set }) => {
          try {
            const { sessionId } = params;
            const session = collaborationService.getSession(sessionId);

            if (!session) {
              set.status = 404;
              return {
                status: "error",
                message: "Collaboration session not found",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Collaboration session retrieved successfully",
              data: { session },
            };
          } catch (error) {
            console.error("Get collaboration session error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve collaboration session",
            };
          }
        },
        {
          params: t.Object({
            sessionId: t.String(),
          }),
          detail: {
            tags: ["collaboration"],
            summary: "Get collaboration session",
            description: "Get details of a collaboration session",
          },
        }
      )
      .delete(
        "/sessions/:sessionId",
        ({ params, set, user }) => {
          try {
            const { sessionId } = params;
            const session = collaborationService.getSession(sessionId);

            if (!session) {
              set.status = 404;
              return {
                status: "error",
                message: "Collaboration session not found",
              };
            }

            // Check if user is the host
            if (session.hostId !== user.id) {
              set.status = 403;
              return {
                status: "error",
                message: "Only the host can end the session",
              };
            }

            const success = collaborationService.endSession(sessionId);

            set.status = success ? 200 : 400;
            return {
              status: success ? "success" : "error",
              message: success
                ? "Session ended successfully"
                : "Failed to end session",
            };
          } catch (error) {
            console.error("End collaboration session error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to end collaboration session",
            };
          }
        },
        {
          params: t.Object({
            sessionId: t.String(),
          }),
          detail: {
            tags: ["collaboration"],
            summary: "End collaboration session",
            description: "End a collaboration session",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/sessions",
        ({ set }) => {
          try {
            const sessions = collaborationService.getActiveSessions();

            set.status = 200;
            return {
              status: "success",
              message: "Active sessions retrieved successfully",
              data: { sessions },
            };
          } catch (error) {
            console.error("Get active sessions error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve active sessions",
            };
          }
        },
        {
          detail: {
            tags: ["collaboration"],
            summary: "Get active sessions",
            description: "Get all active collaboration sessions",
          },
        }
      )
      .get(
        "/health",
        ({ set }) => {
          try {
            const health = collaborationService.getHealth();

            set.status = 200;
            return {
              status: "success",
              message: "Collaboration service health retrieved successfully",
              data: health,
            };
          } catch (error) {
            console.error("Collaboration health check error:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to check collaboration service health",
            };
          }
        },
        {
          detail: {
            tags: ["collaboration"],
            summary: "Get collaboration service health",
            description: "Check the health status of the collaboration service",
          },
        }
      )
  );
