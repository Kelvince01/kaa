import { monitoringService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

export const monitoringController = new Elysia({
  detail: {
    tags: ["monitoring"],
  },
}).group("/monitoring", (app) =>
  app
    .use(authPlugin)
    .get(
      "/health",
      async () => {
        const health = await monitoringService.getSystemHealth();

        return {
          status: "success",
          data: health,
        };
      },
      {
        detail: {
          summary: "Get system health",
          tags: ["monitoring"],
        },
      }
    )
    .get(
      "/alerts",
      async () => {
        const alerts = await monitoringService.getAlerts();

        return {
          status: "success",
          data: alerts,
        };
      },
      {
        detail: {
          summary: "Get alerts",
          tags: ["monitoring"],
        },
      }
    )
    .post(
      "/alerts",
      async ({ body, user }) => {
        const alert = await monitoringService.createAlert({
          ...body,
          memberId: user.memberId,
          createdBy: user.id,
        });

        return {
          status: "success",
          data: alert,
          message: "Alert created successfully",
        };
      },
      {
        body: t.Object({
          name: t.String(),
          description: t.String(),
          type: t.Enum({
            metric: "metric",
            error: "error",
            security: "security",
            performance: "performance",
            custom: "custom",
          }),
          severity: t.Enum({
            info: "info",
            warning: "warning",
            error: "error",
            critical: "critical",
          }),
          conditions: t.Object({
            metric: t.String(),
            operator: t.Enum({
              gt: "gt",
              lt: "lt",
              eq: "eq",
              gte: "gte",
              lte: "lte",
              ne: "ne",
            }),
            threshold: t.Number(),
            timeWindow: t.Number(),
          }),
          channels: t.Array(
            t.Object({
              type: t.Enum({
                email: "email",
                slack: "slack",
                webhook: "webhook",
                sms: "sms",
              }),
              config: t.Object({}),
            })
          ),
        }),
        detail: {
          summary: "Create an alert",
          tags: ["monitoring"],
        },
      }
    )
    .get(
      "/incidents",
      async () => {
        const incidents = await monitoringService.getIncidents();

        return {
          status: "success",
          data: incidents,
        };
      },
      {
        detail: {
          summary: "Get incidents",
          tags: ["monitoring"],
        },
      }
    )
    .post(
      "/incidents",
      async ({ body, user }) => {
        const incident = await monitoringService.createIncident({
          ...body,
          memberId: user.memberId,
          createdBy: user.id,
        });

        return {
          status: "success",
          data: incident,
          message: "Incident created successfully",
        };
      },
      {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          severity: t.Enum({
            low: "low",
            medium: "medium",
            high: "high",
            critical: "critical",
          }),
          affectedServices: t.Array(t.String()),
        }),
        detail: {
          summary: "Create an incident",
          tags: ["monitoring"],
        },
      }
    )
    .put(
      "/incidents/:id/status",
      async ({ params, user, body }) => {
        await monitoringService.updateIncidentStatus(
          params.id,
          body.status,
          body.message,
          user.id
        );

        return {
          status: "success",
          message: "Incident status updated",
        };
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          status: t.Enum({
            investigating: "investigating",
            identified: "identified",
            monitoring: "monitoring",
            resolved: "resolved",
          }),
          message: t.String(),
        }),
        detail: {
          summary: "Update incident status",
          tags: ["monitoring"],
        },
      }
    )
    .get(
      "/metrics/:name",
      async ({ params, user, query }) => {
        const history = await monitoringService.getMetricHistory({
          metricName: params.name,
          startDate: query.startDate,
          endDate: query.endDate,
          memberId: user.memberId,
        });

        return {
          status: "success",
          data: history,
        };
      },
      {
        params: t.Object({
          name: t.String(),
        }),
        query: t.Object({
          startDate: t.Date(),
          endDate: t.Date(),
        }),
        detail: {
          summary: "Get metric history",
          tags: ["monitoring"],
        },
      }
    )
    .post(
      "/metrics",
      async ({ body, user }) => {
        const metric = await monitoringService.recordMetric({
          ...body,
          memberId: user.memberId,
        });

        return {
          status: "success",
          message: "Metric recorded successfully",
        };
      },
      {
        body: t.Object({
          name: t.String(),
          value: t.Number(),
          unit: t.String(),
          tags: t.Optional(t.Object({})),
          timestamp: t.Optional(t.Date()),
        }),
        detail: {
          summary: "Record a metric",
          tags: ["monitoring"],
        },
      }
    )
);
