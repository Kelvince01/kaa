import Elysia, { t } from "elysia";
import {
  apiKeyPlugin,
  requirePermissions,
} from "#/features/auth/api-key.plugin";
import { MLAnalyticsService } from "./services/ml-analytics.service";

// Initialize ML Analytics Service
const mlAnalyticsService = new MLAnalyticsService();

export const mlAnalyticsController = new Elysia({
  detail: {
    tags: ["ml-analytics"],
    description: "Machine Learning Analytics for Virtual Tours",
    security: [{ apiKeyAuth: [] }],
  },
}).group("/ml-analytics", (app) =>
  app
    .use(apiKeyPlugin)
    // Use requirePermissions for write operations only
    .decorate("mlService", mlAnalyticsService)

    // ===== Service Health & Metrics =====

    .get(
      "/health",
      ({ mlService, set }) => {
        try {
          const health = mlService.getHealth();
          return {
            status: "success",
            data: health,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get health status",
          };
        }
      },
      {
        detail: {
          tags: ["ml-analytics"],
          summary: "Get ML Analytics service health status",
        },
      }
    )

    .get(
      "/metrics",
      ({ mlService, set }) => {
        try {
          const metrics = mlService.getMetrics();
          return {
            status: "success",
            data: metrics,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get service metrics",
          };
        }
      },
      {
        detail: {
          tags: ["ml-analytics"],
          summary: "Get comprehensive ML Analytics service metrics",
        },
      }
    )

    // ===== Analytics Generation =====

    .post(
      "/generate",
      async ({ mlService, body, set }) => {
        try {
          const analytics = await mlService.generateMLAnalytics(
            body.tourId,
            body.baseAnalytics,
            body.historicalData
          );

          return {
            status: "success",
            data: analytics,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to generate ML analytics",
          };
        }
      },
      {
        body: t.Object({
          tourId: t.String(),
          baseAnalytics: t.Object({
            totalViews: t.Number(),
            uniqueVisitors: t.Number(),
            averageDuration: t.Number(),
            completionRate: t.Number(),
            deviceBreakdown: t.Object({
              mobile: t.Number(),
              desktop: t.Number(),
              tablet: t.Number(),
              vr: t.Number(),
              ar: t.Number(),
            }),
            locationBreakdown: t.Record(
              t.String(), // the country code / name (key)
              t.Object({
                // value object for each country
                views: t.Number(),
                averageDuration: t.Number(),
                bounceRate: t.Number(),
              })
            ),
            sceneAnalytics: t.Array(
              t.Object({
                sceneId: t.String(),
                views: t.Number(),
                averageTime: t.Number(),
                exitRate: t.Number(),
                hotspotEngagement: t.Number(),
              })
            ),
            heatmap: t.Array(
              t.Object({
                position: t.Object({ x: t.Number(), y: t.Number() }),
                intensity: t.Number(),
                duration: t.Number(),
                sceneId: t.String(),
              })
            ),
            conversionMetrics: t.Object({
              inquiries: t.Number(),
              bookings: t.Number(),
              phoneClicks: t.Number(),
              emailClicks: t.Number(),
              whatsappClicks: t.Number(),
              conversionRate: t.Number(),
            }),
          }),
          historicalData: t.Optional(t.Array(t.Any())),
        }),
        detail: {
          tags: ["ml-analytics"],
          summary: "Generate comprehensive ML analytics for a virtual tour",
          description:
            "Generates ML-powered analytics including predictions, insights, and real-time metrics",
        },
      }
    )

    // ===== Real-time Updates =====

    .post(
      "/real-time-update",
      ({ mlService, body, set }) => {
        try {
          mlService.updateRealTimeData(
            body.tourId,
            body.event,
            body.sessionInfo
          );

          return {
            status: "success",
            message: "Real-time data updated successfully",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to update real-time data",
          };
        }
      },
      {
        body: t.Object({
          tourId: t.String(),
          event: t.Object({
            type: t.Union([
              t.Literal("ai-content"),
              t.Literal("collaboration"),
              t.Literal("view"),
              t.Literal("interaction"),
              t.Literal("navigation"),
              t.Literal("exit"),
            ]),
            timestamp: t.Number(),
            sceneId: t.Optional(t.String()),
            hotspotId: t.Optional(t.String()),
            duration: t.Optional(t.Number()),
            position: t.Optional(
              t.Object({
                x: t.Number(),
                y: t.Number(),
              })
            ),
            metadata: t.Optional(t.Record(t.String(), t.Any())),
          }),
          sessionInfo: t.Optional(t.Any()),
        }),
        detail: {
          tags: ["ml-analytics"],
          summary: "Update real-time analytics data",
          description: "Process real-time events and update analytics metrics",
        },
      }
    )

    // ===== Predictions =====

    .get(
      "/engagement-prediction/:tourId",
      async ({ mlService, params, set }) => {
        try {
          const prediction = await mlService.getEngagementPrediction(
            params.tourId
          );

          return {
            status: "success",
            data: prediction,
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get engagement prediction",
          };
        }
      },
      {
        params: t.Object({
          tourId: t.String(),
        }),
        detail: {
          tags: ["ml-analytics"],
          summary: "Get engagement forecast for a tour",
          description:
            "Returns predicted engagement metrics for the next week and month",
        },
      }
    )

    .get(
      "/conversion-prediction/:tourId",
      async ({ mlService, params, set }) => {
        try {
          const prediction = await mlService.getConversionPrediction(
            params.tourId
          );

          return {
            status: "success",
            data: {
              conversionProbability: prediction,
            },
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to get conversion prediction",
          };
        }
      },
      {
        params: t.Object({
          tourId: t.String(),
        }),
        detail: {
          tags: ["ml-analytics"],
          summary: "Get conversion probability prediction for a tour",
          description: "Returns the predicted conversion probability (0-1)",
        },
      }
    )

    // ===== Admin Operations =====

    .use(requirePermissions(["ml:admin"]))

    .post(
      "/initialize",
      async ({ mlService, set }) => {
        try {
          await mlService.initialize();
          return {
            status: "success",
            message: "ML Analytics service initialized successfully",
          };
        } catch (error: any) {
          set.status = 500;
          return {
            status: "error",
            message: error.message || "Failed to initialize service",
          };
        }
      },
      {
        detail: {
          tags: ["ml-analytics"],
          summary: "Initialize ML Analytics service (Admin only)",
          description: "Initialize ML models and start real-time processing",
        },
      }
    )
);
