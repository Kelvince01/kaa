/**
 * Collaboration WebSocket Controller using Elysia
 * Handles real-time collaboration for virtual tours
 */

import { CollaborationService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

const collaborationService = new CollaborationService();

export const collaborationWebSocketController = new Elysia()
  .use(authPlugin)
  .ws("/collaboration/:sessionId", {
    // WebSocket route handler
    message(ws, message) {
      try {
        const data =
          typeof message === "string" ? JSON.parse(message) : message;
        const participantId = (ws as any).participantId;

        if (participantId) {
          collaborationService.handleMessage(participantId, data);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
          })
        );
      }
    },

    open(ws) {
      try {
        const sessionId = (ws.data.params as any).sessionId;
        const userId = (ws.data as any).user?.id;
        const role = (ws.data as any).query?.role || "viewer";

        if (!(sessionId && userId)) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Missing sessionId or userId",
            })
          );
          ws.close();
          return;
        }

        // Register participant with collaboration service
        const participantId = collaborationService.handleConnection(
          ws,
          sessionId,
          userId,
          role
        );

        // Store participant ID in WebSocket data for future reference
        (ws as any).participantId = participantId;

        console.log(
          `Collaboration WebSocket opened: ${participantId} in session ${sessionId}`
        );
      } catch (error) {
        console.error("WebSocket connection error:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Connection failed",
          })
        );
        ws.close();
      }
    },

    close(ws) {
      const participantId = (ws as any).participantId;
      if (participantId) {
        collaborationService.handleDisconnect(participantId);
      }
    },

    // WebSocket configuration
    body: t.Object({
      type: t.String(),
      data: t.Any(),
    }),

    params: t.Object({
      sessionId: t.String(),
    }),

    query: t.Object({
      role: t.Optional(
        t.Union([t.Literal("host"), t.Literal("viewer"), t.Literal("editor")])
      ),
    }),

    // Additional options
    idleTimeout: 300, // 5 minutes
    maxCompressedSize: 64 * 1024, // 64KB
    maxBackpressure: 64 * 1024, // 64KB
  });
