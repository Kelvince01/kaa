import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { videoCallingService } from "./video-calling-webrtc.service";

/**
 * WebSocket Controller for Video Calling
 * Handles WebRTC signaling via WebSocket
 */
export const videoCallingWSController = new Elysia({
  prefix: "/video-calls",
})
  .use(authPlugin)
  .ws("/ws", {
    body: t.Any(), // Accept any JSON for signaling messages

    open(ws) {
      const user = (ws.data as any).user;

      if (!user?.id) {
        logger.warn("WebSocket connection attempt without authentication");
        ws.close();
        return;
      }

      logger.info(`📹 Video call WebSocket connected: ${user.id}`);

      try {
        // Store user ID in WebSocket data
        (ws.data as any).userId = user.id;

        // Initialize WebRTC connection through service
        videoCallingService.handleWebSocketConnection(ws, user.id);
      } catch (error) {
        logger.error("Error initializing WebSocket connection:", error);
        ws.close();
      }
    },

    message(ws, message) {
      const userId = (ws.data as any).userId;

      if (!userId) {
        logger.warn("WebSocket message received without proper initialization");
        return;
      }

      try {
        // Pass message directly to the engine
        videoCallingService.handleWebSocketMessage(ws, message);
      } catch (error) {
        logger.error("Error handling WebSocket message:", error);
      }
    },

    close(ws) {
      const userId = (ws.data as any).userId;

      logger.info(`❌ Video call WebSocket disconnected: ${userId}`);

      try {
        // Notify engine of closure
        videoCallingService.handleWebSocketClose(ws);
      } catch (error) {
        logger.error(
          "Error handling WebSocket close:",
          (error as Error).message
        );
        logger.error("Error handling WebSocket close:", (error as Error).stack);
        logger.error(
          "Error handling WebSocket close:",
          (error as Error | any).code
        );
        logger.error(
          "Error handling WebSocket close:",
          (error as Error | any).reason
        );
        logger.error(
          "Error handling WebSocket close:",
          (error as Error | any).wasClean
        );
        logger.error(
          "Error handling WebSocket close:",
          (error as Error | any).protocol
        );
        logger.error(
          "Error handling WebSocket close:",
          (error as Error | any).url
        );
      }
    },
  });
