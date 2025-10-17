import { securityService } from "@kaa/services";
import Elysia, { t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

export const securityController = new Elysia({
  detail: {
    tags: ["security"],
  },
}).group("/security", (app) =>
  app
    .use(authPlugin)
    .get(
      "/dashboard",
      async ({ user }) => {
        const dashboard = await securityService.getSecurityDashboard(
          user.memberId as string
        );

        return {
          status: "success",
          data: dashboard,
        };
      },
      {
        detail: {
          tags: ["security"],
          summary: "Get security dashboard",
        },
      }
    )
    .post(
      "/data-retention",
      async ({ body, user }) => {
        // requireRole(["admin"])(context);
        await securityService.createDataRetentionPolicy({
          ...body,
          memberId: user.memberId as string,
          createdBy: user.id,
        });

        return {
          status: "success",
          message: "Data retention policy created successfully",
        };
      },
      {
        body: t.Object({
          dataType: t.Enum({
            user_data: "user_data",
            analytics: "analytics",
            logs: "logs",
            files: "files",
            backups: "backups",
          }),
          retentionPeriod: t.Number(),
        }),
        detail: {
          tags: ["security"],
          summary: "Create data retention policy",
        },
      }
    )
    .post(
      "/compliance/reports",
      async ({ body, user }) => {
        // requireRole(["admin"])(context);
        const reportId = await securityService.generateComplianceReport({
          ...body,
          memberId: user.memberId as string,
          generatedBy: user.id,
        });

        return {
          status: "success",
          data: { reportId },
          message: "Compliance report generation started",
        };
      },
      {
        body: t.Object({
          type: t.Enum({
            gdpr: "gdpr",
            ccpa: "ccpa",
            hipaa: "hipaa",
            sox: "sox",
            custom: "custom",
          }),
          generatedBy: t.String(),
        }),
        detail: {
          tags: ["security"],
          summary: "Generate compliance report",
        },
      }
    )
    .post(
      "/data-retention/execute",
      async () => {
        // requireRole(["admin"])(context);
        await securityService.executeDataRetention();

        return {
          status: "success",
          message: "Data retention executed successfully",
        };
      },
      {
        detail: {
          tags: ["security"],
          summary: "Execute data retention",
        },
      }
    )
);
