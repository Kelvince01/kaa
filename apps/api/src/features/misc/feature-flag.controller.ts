import { featureFlagService } from "@kaa/services";
import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

export const featureFlagController = new Elysia()
  // API version info
  .get(
    "/version",
    () => ({
      version: "1.0.0",
      apiVersion: "v1",
      buildDate: new Date().toISOString(),
      features: [
        "Multi-Factor Authentication",
        "API Key Management",
        "Advanced Billing",
        "Team Collaboration",
        "Real-time Analytics",
        "Automated Backups",
        "Feature Flags",
        "Internationalization",
        "Compliance Tools",
        "Advanced Monitoring",
      ],
    }),
    {
      detail: {
        summary: "API Version Information",
        description: "Get API version and feature information",
        tags: ["system"],
      },
    }
  )
  .use(authPlugin)
  .get(
    "/features",
    async ({ user }) => {
      if (!user) {
        return { features: {} };
      }

      const features = await featureFlagService.evaluateAllFlags(
        user.id,
        user.memberId ?? "",
        {
          userAgent: "api-request",
        }
      );

      return { features };
    },
    {
      detail: {
        summary: "Get Feature Flags",
        description: "Get all feature flags for the current user",
        tags: ["system"],
      },
    }
  );
