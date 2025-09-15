import os from "node:os";
import config from "@kaa/config/api";
import { backupService, monitoringService } from "@kaa/services";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";

// Endpoint to expose metrics
export const metricsEndpointPlugin = new Elysia().get(
  "/metrics",
  async ({ query }) => {
    const metrics = await monitoringService.getMetricHistory(query);
    return {
      metrics,
      timestamp: new Date().toISOString(),
    };
  },
  {
    query: t.Object({
      metricName: t.String(),
      startDate: t.Date(),
      endDate: t.Date(),
      memberId: t.Optional(t.String()),
    }),
    detail: {
      summary: "System Metrics",
      description: "Get system performance metrics",
      tags: ["system"],
    },
  }
);

// Health check endpoint
export const healthCheckPlugin = new Elysia()
  .get(
    "/health",
    async ({ set, headers }) => {
      const correlationId = headers["x-correlation-id"] || crypto.randomUUID();
      const health = await monitoringService.getSystemHealth();

      // Check database connection
      let dbStatus = "UP";
      try {
        if (mongoose.connection.readyState !== 1) {
          dbStatus = "DOWN";
        }
      } catch (error) {
        dbStatus = "DOWN";
      }

      // Calculate system metrics
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // Calculate performance metrics
      const averageResponseTime = getAverageResponseTime(5);
      const errorRate = getErrorRate(5);
      const requestCounts = getRequestCountByStatus(5);

      const systemStatus =
        dbStatus === "UP" && health.status === "healthy"
          ? "healthy"
          : "unhealthy";

      set.status = systemStatus === "healthy" ? 200 : 503;
      set.headers["x-correlation-id"] = correlationId;

      return {
        name: config.app.name,
        version: config.app.version,
        status: systemStatus,
        timestamp: new Date().toISOString(),
        correlationId,
        checks: {
          database: {
            status: dbStatus,
            responseTime: mongoose.connection.readyState === 1 ? 1 : 0,
          },
          memory: {
            status:
              memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9
                ? "UP"
                : "DOWN",
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            usage: Math.round(
              (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
            ),
          },
          cpu: {
            status: "UP",
            user: cpuUsage.user,
            system: cpuUsage.system,
          },
        },
        metrics: {
          averageResponseTime,
          errorRate,
          requestCounts,
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          uptime: process.uptime(),
        },
        services: {
          ...health.services,
          database: dbStatus,
        },
        features: {
          //   reviews: health.status,
        },
      };
    },
    {
      detail: {
        summary: "System Health Check",
        description: "Get overall system health status",
        tags: ["system"],
      },
    }
  )
  .get(
    "/health/detailed",
    async ({ set }) => {
      const [systemHealth, backupStats] = await Promise.all([
        monitoringService.getSystemHealth(),
        backupService.getBackupStats(),
      ]);

      // Check database connection
      let dbStatus = "DOWN";
      try {
        if (mongoose.connection.readyState === 1) {
          dbStatus = "UP";
        }
      } catch (error) {
        console.error("Database health check failed:", error);
      }

      set.status = 200;
      return {
        name: config.app.name,
        version: config.app.version,
        system: {
          ...systemHealth,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          hostname: os.hostname(),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          cpus: os.cpus().length,
        },
        backups: backupStats,
        services: {
          database: dbStatus,
        },
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        summary: "Detailed Health Check",
        description: "Get detailed system health information",
        tags: ["system"],
      },
    }
  );

// Interface for request metrics
type RequestMetrics = {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  userId?: string;
};

// Store metrics in memory (in production, you'd use a proper time-series database)
const metrics: RequestMetrics[] = [];

// Get recent metrics
export const getRecentMetrics = (limit = 100): RequestMetrics[] => {
  return metrics.slice(-limit);
};

// Get average response time for the last n minutes
export const getAverageResponseTime = (minutes = 5): number => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const recentMetrics = metrics.filter((m) => m.timestamp > cutoff);

  if (recentMetrics.length === 0) return 0;

  const sum = recentMetrics.reduce(
    (acc, metric) => acc + metric.responseTime,
    0
  );
  return sum / recentMetrics.length;
};

// Get error rate for the last n minutes
export const getErrorRate = (minutes = 5): number => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const recentMetrics = metrics.filter((m) => m.timestamp > cutoff);

  if (recentMetrics.length === 0) return 0;

  const errors = recentMetrics.filter((m) => m.statusCode >= 500).length;
  return (errors / recentMetrics.length) * 100;
};

// Get request count by status code for the last n minutes
export const getRequestCountByStatus = (
  minutes = 5
): Record<string, number> => {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const recentMetrics = metrics.filter((m) => m.timestamp > cutoff);

  const counts: Record<string, number> = {};

  for (const metric of recentMetrics) {
    if (
      typeof metric.statusCode === "number" &&
      !Number.isNaN(metric.statusCode)
    ) {
      const statusGroup = `${Math.floor(metric.statusCode / 100)}xx`;
      counts[statusGroup] = (counts[statusGroup] || 0) + 1;
    }
  }

  return counts;
};

// Clean up old metrics (keep only the last 24 hours)
export const cleanupOldMetrics = (): void => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const index = metrics.findIndex((m) => m.timestamp > cutoff);

  if (index > 0) {
    metrics.splice(0, index);
  }
};
