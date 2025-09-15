import crypto from "node:crypto";
import Elysia, { t } from "elysia";
import {
  getSecurityEvents,
  getSecurityStats,
} from "~/shared/utils/security-logger.util";

export const securityMonitoringController = new Elysia({ prefix: "/security" })
  .get(
    "/events",
    ({ set, headers, query }) => {
      try {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        const events = getSecurityEvents(query.severity, query.limit);

        set.headers["x-correlation-id"] = correlationId;
        set.status = 200;

        return {
          data: events,
          message: "Security events retrieved successfully",
          status: 200,
          correlationId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        set.headers["x-correlation-id"] = correlationId;
        set.status = 500;

        return {
          code: "SECURITY_EVENTS_FETCH_FAILED",
          message: "Failed to retrieve security events",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      query: t.Object({
        severity: t.Optional(
          t.Union([
            t.Literal("low"),
            t.Literal("medium"),
            t.Literal("high"),
            t.Literal("critical"),
          ])
        ),
        limit: t.Optional(
          t.Number({ minimum: 1, maximum: 1000, default: 100 })
        ),
      }),
      detail: {
        summary: "Get Security Events",
        description: "Retrieve security events with optional filtering",
        tags: ["security"],
      },
    }
  )
  .get(
    "/stats",
    ({ set, headers }) => {
      try {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        const stats = getSecurityStats();

        set.headers["x-correlation-id"] = correlationId;
        set.status = 200;

        return {
          data: stats,
          message: "Security statistics retrieved successfully",
          status: 200,
          correlationId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        set.headers["x-correlation-id"] = correlationId;
        set.status = 500;

        return {
          code: "SECURITY_STATS_FETCH_FAILED",
          message: "Failed to retrieve security statistics",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      detail: {
        summary: "Get Security Statistics",
        description: "Retrieve security statistics and alert status",
        tags: ["security"],
      },
    }
  );
