import { logger } from "@kaa/utils";
import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  addTourQuestionSchema,
  createCallSchema,
  createPropertyTourSchema,
  generateTokenSchema,
  getCallParamsSchema,
  getUploadStatusSchema,
  joinCallSchema,
  listCallsQuerySchema,
  navigateTourSchema,
  toggleMediaSchema,
  updateNetworkQualitySchema,
  uploadChunkSchema,
} from "./video-calling.schema";
import { videoCallingService } from "./video-calling-webrtc.service";

/**
 * Video Calling Controller
 * Handles video calling, property tours, and WebRTC integration
 */
export const videoCallingController = new Elysia({ prefix: "/video-calls" })
  .use(authPlugin)

  /**
   * Create a new video call
   */
  .post(
    "/",
    async ({ body, set, headers, user }) => {
      try {
        // const userId = headers["x-user-id"] as string;
        const orgId = headers["x-org-id"] as string;

        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const call = await videoCallingService.createCall(user.id, body.type, {
          ...body,
          kenyaSpecific: {
            ...body.kenyaSpecific,
            orgId,
          },
        });

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
   * Generate Web token for joining a call
   */
  .post(
    "/:callId/token",
    async ({ params, body, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const tokenData = await videoCallingService.generateToken(
          params.callId,
          user.id,
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
        summary: "Generate Web token",
        description: "Generate an Web RTC token for joining a call",
      },
    }
  )

  /**
   * Join a video call
   */
  .post(
    "/:callId/join",
    async ({ params, body, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const result = await videoCallingService.joinCall(
          params.callId,
          user.id,
          {
            displayName: body.displayName,
            avatar: body.avatar,
            audio: body.mediaStreams?.audio,
            video: body.mediaStreams?.video,
          }
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
        description: "Join a video call and get Web credentials",
      },
    }
  )

  /**
   * Leave a video call
   */
  .post(
    "/:callId/leave",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        await videoCallingService.leaveCall(params.callId, user.id);

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
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        await videoCallingService.endCall(params.callId, user.id);

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
    async ({ params, set, user }) => {
      try {
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
          call.host === user.id ||
          call.participants.some((p: any) => p.userId === user.id);

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
    async ({ query, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const calls = await videoCallingService.getCallsByUser(
          user.id,
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
   * Get active calls
   */
  .get(
    "/calls/active",
    async ({ set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const calls = await videoCallingService.getActiveCalls();

        return {
          success: true,
          data: {
            calls,
            total: calls.length,
            page: 1,
            limit: calls.length,
          },
          message: "Active calls retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get active calls:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve active calls",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get active calls",
        description: "Get all currently active video calls",
      },
    }
  )

  /**
   * Get calls for a specific user
   */
  .get(
    "/calls/user/:userId",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            error: "Unauthorized",
            message: "User ID required",
          };
        }

        const calls = await videoCallingService.getCallsByUser(
          params.userId,
          {}
        );

        return {
          success: true,
          data: calls,
          message: "User calls retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get user calls:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve user calls",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get user calls",
        description: "Get all calls for a specific user",
      },
    }
  )

  /**
   * Create property tour
   */
  .post(
    "/:callId/tour",
    async ({ params, body, set, user }) => {
      try {
        const tour = await videoCallingService.createPropertyTour(
          params.callId,
          body.propertyId,
          user.id,
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
    async ({ params, body, set, user }) => {
      try {
        await videoCallingService.addTourQuestion(
          params.callId,
          user.id,
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
   * Get property tour
   */
  .get(
    "/tours/:callId",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const tour = await videoCallingService.getPropertyTour(params.callId);

        return {
          success: true,
          data: tour,
          message: "Property tour retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get property tour:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve property tour",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get property tour",
        description: "Get property tour details for a call",
      },
    }
  )

  /**
   * Create property tour (alternative endpoint)
   */
  .post(
    "/tours",
    async ({ body, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        // Extract callId from body
        const { callId, propertyId, tourPlan } = body as any;

        const tour = await videoCallingService.createPropertyTour(
          callId,
          user.id,
          propertyId,
          tourPlan
        );

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
          message: "Failed to create property tour",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Create property tour",
        description: "Create a new property tour",
      },
    }
  )

  /**
   * Add tour question (alternative endpoint)
   */
  .post(
    "/tours/:callId/questions",
    async ({ params, body, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        await videoCallingService.addTourQuestion(
          params.callId,
          user.id,
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
    async ({ params, set, user }) => {
      try {
        const recording = await videoCallingService.startRecording(
          params.callId,
          user.id
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
    async ({ params, set, user }) => {
      try {
        await videoCallingService.stopRecording(params.callId, user.id);

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
   * Get recording status
   */
  .get(
    "/:callId/recording/:recordingId",
    async ({ params, set, user }) => {
      try {
        const status = await videoCallingService.getRecordingStatus(
          params.callId,
          params.recordingId,
          user.id
        );

        return {
          success: true,
          data: status,
          message: "Recording status retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get recording status:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve recording status",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get recording status",
        description: "Get the status of a recording",
      },
    }
  )

  /**
   * Delete recording
   */
  .delete(
    "/:callId/recording/:recordingId",
    async ({ params, set, user }) => {
      try {
        await videoCallingService.deleteRecording(
          params.callId,
          params.recordingId,
          user.id
        );

        return {
          success: true,
          message: "Recording deleted successfully",
        };
      } catch (error) {
        logger.error("Failed to delete recording:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to delete recording",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Delete recording",
        description: "Delete a recording",
      },
    }
  )

  /**
   * Get a specific recording
   */
  .get(
    "/recordings/:recordingId",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const recording = await videoCallingService.getRecording(
          params.recordingId
        );

        return {
          success: true,
          data: recording,
          message: "Recording retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get recording:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve recording",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get recording",
        description: "Get a specific recording by ID",
      },
    }
  )

  /**
   * Get all recordings for a call
   */
  .get(
    "/calls/:callId/recordings",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const recordings = await videoCallingService.getCallRecordings(
          params.callId
        );

        return {
          success: true,
          data: recordings,
          message: "Call recordings retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get call recordings:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve call recordings",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get call recordings",
        description: "Get all recordings for a specific call",
      },
    }
  )

  /**
   * Delete recording (alternative endpoint without callId)
   */
  .delete(
    "/recordings/:recordingId",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        // Find the recording to get the callId
        const recording = await videoCallingService.getRecording(
          params.recordingId
        );
        await videoCallingService.deleteRecording(
          recording.callId,
          params.recordingId,
          user.id
        );

        return {
          success: true,
          message: "Recording deleted successfully",
        };
      } catch (error) {
        logger.error("Failed to delete recording:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to delete recording",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Delete recording",
        description: "Delete a recording by ID",
      },
    }
  )

  /**
   * Toggle audio
   */
  .post(
    "/:callId/audio",
    async ({ params, body, set, user }) => {
      try {
        await videoCallingService.toggleAudio(
          params.callId,
          user.id,
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
    async ({ params, body, set, user }) => {
      try {
        await videoCallingService.toggleVideo(
          params.callId,
          user.id,
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
   * Toggle screen sharing
   */
  .post(
    "/:callId/screen-share",
    async ({ params, body, set, user }) => {
      try {
        if (body.enabled) {
          await videoCallingService.startScreenShare(params.callId, user.id);
        } else {
          await videoCallingService.stopScreenShare(params.callId, user.id);
        }

        return {
          success: true,
          message: `Screen sharing ${body.enabled ? "started" : "stopped"} successfully`,
        };
      } catch (error) {
        logger.error("Failed to toggle screen sharing:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to toggle screen sharing",
        };
      }
    },
    {
      params: getCallParamsSchema,
      body: toggleMediaSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Toggle screen sharing",
        description: "Enable or disable screen sharing in the call",
      },
    }
  )

  /**
   * Start screen sharing
   */
  .post(
    "/:callId/screen-share/start",
    async ({ params, set, user }) => {
      try {
        await videoCallingService.startScreenShare(params.callId, user.id);

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
    async ({ params, set, user }) => {
      try {
        await videoCallingService.stopScreenShare(params.callId, user.id);

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
    async ({ params, body, set, user }) => {
      try {
        await videoCallingService.updateNetworkQuality(
          params.callId,
          user.id,
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
    async ({ params, set, user }) => {
      try {
        const analytics = await videoCallingService.getCallAnalytics(
          params.callId,
          user.id
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
    async ({ params, set, user }) => {
      try {
        const stats = await videoCallingService.getCallStats(
          params.callId,
          user.id
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
  )
  /**
   * Upload recording chunk (for client-side recording)
   */
  .post(
    "/recording/chunk",
    async ({ body, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const { recordingId, participantId, chunk, type, timestamp, sequence } =
          body;

        // Validate chunk data
        if (!chunk || chunk.length === 0) {
          set.status = 400;
          return {
            success: false,
            message: "Invalid chunk data",
          };
        }

        // Decode base64 chunk
        const chunkBuffer = Buffer.from(chunk, "base64");

        // Add chunk to recording
        const chunkId = await videoCallingService.addRecordingChunk(
          recordingId,
          participantId,
          chunkBuffer,
          type,
          timestamp,
          sequence
        );

        return {
          success: true,
          message: "Chunk uploaded successfully",
          chunkId,
        };
      } catch (error) {
        logger.error("Error uploading chunk:", error);
        set.status = 500;
        return {
          success: false,
          message: (error as Error).message || "Failed to upload chunk",
        };
      }
    },
    {
      ...uploadChunkSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Upload recording chunk",
        description: "Upload a media chunk for client-side recording",
      },
    }
  )

  /**
   * Get recording upload status
   */
  .get(
    "/recording/:recordingId/status",
    async ({ params, set, user }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const status = await videoCallingService.getRecordingUploadStatus(
          params.recordingId
        );

        if (!status) {
          set.status = 404;
          return {
            success: false,
            message: "Recording not found",
          };
        }

        return {
          success: true,
          data: status,
        };
      } catch (error) {
        logger.error("Error getting upload status:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to get upload status",
        };
      }
    },
    {
      ...getUploadStatusSchema,
      detail: {
        tags: ["video-calling"],
        summary: "Get recording upload status",
        description: "Get the status of a recording upload",
      },
    }
  )

  /**
   * Get all recordings for the current user
   */
  .get(
    "/recordings",
    async ({ set, user, query }) => {
      try {
        if (!user.id) {
          set.status = 401;
          return {
            success: false,
            message: "Unauthorized",
          };
        }

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;

        const recordings = await videoCallingService.getUserRecordings(
          user.id,
          page,
          limit
        );

        return {
          success: true,
          data: recordings,
          message: "Recordings retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get user recordings:", error);
        set.status = 500;
        return {
          success: false,
          error: "Internal server error",
          message: "Failed to retrieve recordings",
        };
      }
    },
    {
      detail: {
        tags: ["video-calling"],
        summary: "Get user recordings",
        description: "Get all recordings for the authenticated user",
      },
    }
  );
