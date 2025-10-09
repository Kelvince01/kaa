import { logger } from "@kaa/utils";
import { Elysia } from "elysia";
import {
  addTourQuestionSchema,
  createCallSchema,
  createPropertyTourSchema,
  generateTokenSchema,
  getCallParamsSchema,
  joinCallSchema,
  listCallsQuerySchema,
  navigateTourSchema,
  toggleMediaSchema,
  updateNetworkQualitySchema,
} from "./video-calling.schema";
import { videoCallingService } from "./video-calling.service";

/**
 * Video Calling Controller
 * Handles video calling, property tours, and Agora integration
 */
export const videoCallingController = new Elysia({ prefix: "/video-calls" })

  /**
   * Create a new video call
   */
  .post(
    "/",
    async ({ body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;
        const orgId = headers["x-org-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const call = await videoCallingService.createCall(
          userId,
          body.type as any,
          {
            ...body,
            kenyaSpecific: {
              ...body.kenyaSpecific,
              orgId,
            },
          }
        );

        set.status = 201;
        return {
          success: true,
          data: call,
          message: "Video call created successfully",
        };
      } catch (error) {
        logger.error("Failed to create video call:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to create video call",
        };
      }
    },
    {
      body: createCallSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Create video call",
        description: "Create a new video call or property tour",
      },
    }
  )

  /**
   * Generate Agora token for joining a call
   */
  .post(
    "/:callId/token",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const tokenData = await videoCallingService.generateToken(
          params.callId,
          userId,
          body.role
        );

        return {
          success: true,
          data: tokenData,
          message: "Token generated successfully",
        };
      } catch (error) {
        logger.error("Failed to generate token:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to generate token",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: generateTokenSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Generate Agora token",
        description: "Generate an Agora RTC token for joining a call",
      },
    }
  )

  /**
   * Join a video call
   */
  .post(
    "/:callId/join",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const result = await videoCallingService.joinCall(
          params.callId,
          userId,
          body
        );

        return {
          success: true,
          data: result,
          message: "Joined call successfully",
        };
      } catch (error) {
        logger.error("Failed to join call:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to join call",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: joinCallSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Join video call",
        description: "Join a video call and get Agora credentials",
      },
    }
  )

  /**
   * Leave a video call
   */
  .post(
    "/:callId/leave",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        await videoCallingService.leaveCall(params.callId, userId);

        return {
          success: true,
          message: "Left call successfully",
        };
      } catch (error) {
        logger.error("Failed to leave call:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to leave call",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Leave video call",
        description: "Leave a video call",
      },
    }
  )

  /**
   * End a video call (host only)
   */
  .post(
    "/:callId/end",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        await videoCallingService.endCall(params.callId, userId);

        return {
          success: true,
          message: "Call ended successfully",
        };
      } catch (error) {
        logger.error("Failed to end call:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to end call",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "End video call",
        description: "End a video call (host only)",
      },
    }
  )

  /**
   * Get call details
   */
  .get(
    "/:callId",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        const call = await videoCallingService.getCall(params.callId);

        if (!call) {
          set.status = 404;
          return {
            success: false,
            error: "Not found",
            message: "Call not found",
          };
        }

        // Check if user has access to this call
        const hasAccess =
          call.host === userId ||
          call.participants.some((p: any) => p.userId === userId);

        if (!hasAccess) {
          set.status = 403;
          return {
            success: false,
            error: "Forbidden",
            message: "Access denied",
          };
        }

        return {
          success: true,
          data: call,
          message: "Call retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get call:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve call",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Get call details",
        description: "Get details of a specific video call",
      },
    }
  )

  /**
   * List calls for current user
   */
  .get(
    "/",
    async ({ query, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        if (!userId) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const calls = await videoCallingService.getCallsByUser(
          userId,
          query as any
        );

        return {
          success: true,
          data: calls,
          message: "Calls retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to list calls:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve calls",
        };
      }
    },
    {
      query: listCallsQuerySchema,
      detail: {
        tags: ["video-calling"],
        summary: "List user calls",
        description: "List video calls for the current user",
      },
    }
  )

  /**
   * Create property tour
   */
  .post(
    "/:callId/tour",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        const tour = await videoCallingService.createPropertyTour(
          params.callId,
          body.propertyId,
          userId,
          body.tourPlan
        );

        set.status = 201;
        return {
          success: true,
          data: tour,
          message: "Property tour created successfully",
        };
      } catch (error) {
        logger.error("Failed to create property tour:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to create property tour",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: createPropertyTourSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Create property tour",
        description: "Create a property tour for a video call",
      },
    }
  )

  /**
   * Navigate to tour stop
   */
  .post(
    "/:callId/tour/navigate",
    async ({ params, body, set }) => {
      try {
        await videoCallingService.navigateToStop(params.callId, body.stopIndex);

        return {
          success: true,
          message: "Navigated to tour stop successfully",
        };
      } catch (error) {
        logger.error("Failed to navigate tour:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to navigate tour",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: navigateTourSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Navigate tour",
        description: "Navigate to a specific stop in the property tour",
      },
    }
  )

  /**
   * Add tour question
   */
  .post(
    "/:callId/tour/question",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.addTourQuestion(
          params.callId,
          userId,
          body.question,
          body.category
        );

        return {
          success: true,
          message: "Question added successfully",
        };
      } catch (error) {
        logger.error("Failed to add tour question:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to add question",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: addTourQuestionSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Add tour question",
        description: "Add a question during the property tour",
      },
    }
  )

  /**
   * Start recording
   */
  .post(
    "/:callId/recording/start",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        const recording = await videoCallingService.startRecording(
          params.callId,
          userId
        );

        return {
          success: true,
          data: recording,
          message: "Recording started successfully",
        };
      } catch (error) {
        logger.error("Failed to start recording:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: (error as Error).message || "Failed to start recording",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Start recording",
        description: "Start recording the video call",
      },
    }
  )

  /**
   * Stop recording
   */
  .post(
    "/:callId/recording/stop",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.stopRecording(params.callId, userId);

        return {
          success: true,
          message: "Recording stopped successfully",
        };
      } catch (error) {
        logger.error("Failed to stop recording:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to stop recording",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Stop recording",
        description: "Stop recording the video call",
      },
    }
  )

  /**
   * Toggle audio
   */
  .post(
    "/:callId/audio",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.toggleAudio(
          params.callId,
          userId,
          body.enabled
        );

        return {
          success: true,
          message: `Audio ${body.enabled ? "enabled" : "disabled"} successfully`,
        };
      } catch (error) {
        logger.error("Failed to toggle audio:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to toggle audio",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: toggleMediaSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Toggle audio",
        description: "Enable or disable audio in the call",
      },
    }
  )

  /**
   * Toggle video
   */
  .post(
    "/:callId/video",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.toggleVideo(
          params.callId,
          userId,
          body.enabled
        );

        return {
          success: true,
          message: `Video ${body.enabled ? "enabled" : "disabled"} successfully`,
        };
      } catch (error) {
        logger.error("Failed to toggle video:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to toggle video",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: toggleMediaSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Toggle video",
        description: "Enable or disable video in the call",
      },
    }
  )

  /**
   * Start screen sharing
   */
  .post(
    "/:callId/screen-share/start",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.startScreenShare(params.callId, userId);

        return {
          success: true,
          message: "Screen sharing started successfully",
        };
      } catch (error) {
        logger.error("Failed to start screen sharing:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to start screen sharing",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Start screen sharing",
        description: "Start sharing screen in the call",
      },
    }
  )

  /**
   * Stop screen sharing
   */
  .post(
    "/:callId/screen-share/stop",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.stopScreenShare(params.callId, userId);

        return {
          success: true,
          message: "Screen sharing stopped successfully",
        };
      } catch (error) {
        logger.error("Failed to stop screen sharing:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to stop screen sharing",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Stop screen sharing",
        description: "Stop sharing screen in the call",
      },
    }
  )

  /**
   * Update network quality
   */
  .post(
    "/:callId/network-quality",
    async ({ params, body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        await videoCallingService.updateNetworkQuality(
          params.callId,
          userId,
          body as any
        );

        return {
          success: true,
          message: "Network quality updated successfully",
        };
      } catch (error) {
        logger.error("Failed to update network quality:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to update network quality",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: updateNetworkQualitySchema,
      detail: {
        tags: ["video-calling"],
        summary: "Update network quality",
        description: "Update network quality metrics for the call",
      },
    }
  )

  /**
   * Get call analytics
   */
  .get(
    "/:callId/analytics",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        const analytics = await videoCallingService.getCallAnalytics(
          params.callId,
          userId
        );

        if (!analytics) {
          set.status = 404;
          return {
            success: false,
            error: "Not found",
            message: "Analytics not found",
          };
        }

        return {
          success: true,
          data: analytics,
          message: "Analytics retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get analytics:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve analytics",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Get call analytics",
        description: "Get analytics for a video call",
      },
    }
  )

  /**
   * Get call statistics
   */
  .get(
    "/:callId/stats",
    async ({ params, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;

        const stats = await videoCallingService.getCallStats(
          params.callId,
          userId
        );

        return {
          success: true,
          data: stats,
          message: "Statistics retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get call stats:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve statistics",
        };
      }
    },
    {
      params: getCallParamsSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Get call statistics",
        description: "Get real-time statistics for a video call",
      },
    }
  );

export default videoCallingController;
