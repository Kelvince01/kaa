import {
  elasticsearchService,
  searchAnalyticsService,
  searchIndexingService,
  searchIntegrationService,
} from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { advancedSearchController } from "./advanced-search.controller";
import {
  searchMiddleware,
  searchRateLimitMiddleware,
  searchValidationMiddleware,
} from "./search.middleware";

/**
 * Main search router that combines all search functionality
 */
export const searchRouter = new Elysia({
  detail: {
    tags: ["search"],
  },
}).group("/search", (app) =>
  app
    // Apply middleware
    .use(searchRateLimitMiddleware)
    .use(searchValidationMiddleware)
    .use(searchMiddleware)

    // Mount advanced search controller
    .use(advancedSearchController)

    // Basic search endpoints
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const { q, type = "properties", page = 1, limit = 10 } = query;

          if (!q || q.trim().length < 2) {
            set.status = 400;
            return {
              status: "error",
              message: "Search query must be at least 2 characters long",
            };
          }

          const searchQuery = {
            query: q,
            pagination: { page, limit },
          };

          let results: any;
          if (type === "contractors") {
            results = await elasticsearchService.searchContractors(searchQuery);
          } else {
            results = await elasticsearchService.searchProperties(searchQuery);
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              items: results.hits.map((hit: any) => ({
                ...hit._source,
                _id: hit._id,
                _score: hit._score,
                highlight: hit.highlight,
              })),
              pagination: {
                total: results.total,
                page,
                limit,
                pages: Math.ceil(results.total / limit),
              },
              type,
            },
          };
        } catch (error) {
          logger.error("Basic search failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Search service temporarily unavailable",
          };
        }
      },
      {
        query: t.Object({
          q: t.String({ minLength: 2, maxLength: 500 }),
          type: t.Optional(
            t.Union([t.Literal("properties"), t.Literal("contractors")])
          ),
          page: t.Optional(t.Number({ minimum: 1, maximum: 1000 })),
          limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        }),
        detail: {
          tags: ["search"],
          summary: "Basic search",
          description:
            "Perform a basic text search across properties or contractors",
        },
      }
    )

    // Search analytics endpoint
    .use(authPlugin)
    .get(
      "/analytics",
      ({ set, user, query }) => {
        try {
          // Only allow admin users to view analytics
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          const { hours = 24 } = query;
          const analytics = searchAnalyticsService.getAnalytics(hours);

          set.status = 200;
          return {
            status: "success",
            data: analytics,
          };
        } catch (error) {
          logger.error("Search analytics failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Analytics service temporarily unavailable",
          };
        }
      },
      {
        query: t.Object({
          hours: t.Optional(t.Number({ minimum: 1, maximum: 168 })),
        }),
        detail: {
          tags: ["search"],
          summary: "Get search analytics",
          description:
            "Get search analytics and performance metrics (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    // Search statistics endpoint
    .get(
      "/stats",
      async ({ set, user }) => {
        try {
          // Only allow admin users to view stats
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          const stats = await searchIntegrationService.getSearchStatistics();

          set.status = 200;
          return {
            status: "success",
            data: stats,
          };
        } catch (error) {
          logger.error("Search statistics failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Statistics service temporarily unavailable",
          };
        }
      },
      {
        detail: {
          tags: ["search"],
          summary: "Get search statistics",
          description:
            "Get search service statistics and health info (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    // Indexing status endpoint
    .get(
      "/indexing/status",
      ({ set, user }) => {
        try {
          // Only allow admin users to view indexing status
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          const queueStatus = searchIndexingService.getQueueStatus();
          const healthStatus = searchIntegrationService.getHealthStatus();

          set.status = 200;
          return {
            status: "success",
            data: {
              queue: queueStatus,
              health: healthStatus,
              elasticsearch: {
                connected: elasticsearchService.isHealthy(),
              },
            },
          };
        } catch (error) {
          logger.error("Indexing status check failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Status check failed",
          };
        }
      },
      {
        detail: {
          tags: ["search"],
          summary: "Get indexing status",
          description:
            "Get search indexing queue status and health (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    // Force process indexing queue
    .post(
      "/indexing/process",
      ({ set, user }) => {
        try {
          // Only allow admin users to trigger processing
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          // Process queue in background
          searchIndexingService.forceProcessQueue().catch((error) => {
            logger.error("Force queue processing failed:", error);
          });

          set.status = 202;
          return {
            status: "success",
            message: "Queue processing started",
          };
        } catch (error) {
          logger.error("Force queue processing trigger failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to trigger queue processing",
          };
        }
      },
      {
        detail: {
          tags: ["search"],
          summary: "Force process indexing queue",
          description:
            "Force process all queued indexing operations (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    // Clear indexing queue
    .delete(
      "/indexing/queue",
      ({ set, user }) => {
        try {
          // Only allow admin users to clear queue
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          searchIndexingService.clearQueue();

          set.status = 200;
          return {
            status: "success",
            message: "Indexing queue cleared",
          };
        } catch (error) {
          logger.error("Clear indexing queue failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to clear indexing queue",
          };
        }
      },
      {
        detail: {
          tags: ["search"],
          summary: "Clear indexing queue",
          description: "Clear all queued indexing operations (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    // Search maintenance endpoint
    .post(
      "/maintenance",
      ({ set, user }) => {
        try {
          // Only allow admin users to trigger maintenance
          if (String(user.role) !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Insufficient permissions",
            };
          }

          // Run maintenance in background
          searchIntegrationService.performMaintenance().catch((error) => {
            logger.error("Search maintenance failed:", error);
          });

          set.status = 202;
          return {
            status: "success",
            message: "Maintenance tasks started",
          };
        } catch (error) {
          logger.error("Search maintenance trigger failed:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to trigger maintenance",
          };
        }
      },
      {
        detail: {
          tags: ["search"],
          summary: "Run search maintenance",
          description: "Run search service maintenance tasks (Admin only)",
          security: [{ bearerAuth: [] }],
        },
      }
    )
);

// Initialize search services on startup
searchIntegrationService.initialize().catch((error) => {
  logger.error("Failed to initialize search integration service:", error);
});
