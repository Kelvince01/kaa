import { emailService } from "@kaa/services";
import { getDeviceInfo } from "@kaa/utils";
import { randomUUIDv7 } from "bun";
import { Elysia, t } from "elysia";
import { authPlugin } from "../../auth/auth.plugin";
import {
  queryEmailsSchema,
  sendBulkEmailSchema,
  sendBulkEmailWithTemplateSchema,
  sendEmailSchema,
  sendEmailWithTemplateSchema,
} from "./email.schema";

export const emailController = new Elysia({ prefix: "/emails" })
  .use(authPlugin)
  .post(
    "/send",
    ({ body }) => {
      emailService.sendEmail({
        to: body.to,
        subject: body.subject,
        content: body.content,
        html: body.html,
      });

      return {
        message: "Email sent successfully",
      };
    },
    {
      body: sendEmailSchema,
      detail: {
        tags: ["emails"],
        summary: "Send email",
        description: "Send an email to a recipient",
      },
    }
  )
  .post(
    "/send-with-template",
    ({ body, user, request, server }) => {
      const { ip, userAgent } = getDeviceInfo(request, server);

      emailService.sendEmailWithTemplate({
        to: body.to,
        templateId: body.templateId,
        data: body.data,
        metadata: body.metadata,
        userId: user.id,
        requestMetadata: {
          requestId: randomUUIDv7(),
          ipAddress: ip || "",
          userAgent,
        },
      });

      return {
        message: "Email sent successfully with template",
      };
    },
    {
      body: sendEmailWithTemplateSchema,
      detail: {
        tags: ["emails"],
        summary: "Send email with template",
        description: "Send an email to a recipient with a template",
      },
    }
  )
  .post(
    "/send-bulk",
    ({ body }) => {
      emailService.sendBulkEmail(body);
    },
    {
      body: sendBulkEmailSchema,
      detail: {
        tags: ["emails"],
        summary: "Send bulk email",
        description: "Send an email to a list of recipients",
      },
    }
  )
  .post(
    "/send-bulk-with-template",
    ({ body }) => {
      emailService.sendBulkEmailWithTemplate(body);
    },
    {
      body: sendBulkEmailWithTemplateSchema,
      detail: {
        tags: ["emails"],
        summary: "Send bulk email with template",
        description: "Send an email to a list of recipients with a template",
      },
    }
  )
  .get(
    "/",
    ({ query }) => {
      const {
        page: pageQuery,
        limit: limitQuery,
        recipients,
        templateId,
        data,
        metadata,
        subject,
        content,
      } = query;
      const limit = Number(limitQuery) || 20;
      const page = Number(pageQuery) || 1;

      return emailService.getEmails({
        page,
        limit,
        recipients: recipients
          ? Array.isArray(recipients)
            ? recipients
            : [recipients]
          : [],
        templateId,
        data,
        metadata,
        subject,
        content,
      });
    },
    {
      query: queryEmailsSchema,
      detail: {
        tags: ["emails"],
        summary: "Get emails",
        description: "Get emails with filtering",
      },
    }
  )
  .get("/:id", ({ params }) => emailService.getEmail(params.id), {
    params: t.Object({ id: t.String() }),
    detail: {
      tags: ["emails"],
      summary: "Get email by ID",
      description: "Get an email by its ID",
    },
  });

//   /**
//    * Get communication analytics
//    */
//   .get(
//     "/analytics",
//     ({ query, set, headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;
//         const { startDate, endDate, type, provider } = query;

//         // This would need to be implemented in the communications service
//         // For now, return mock analytics
//         const mockAnalytics = {
//           period: {
//             start: startDate
//               ? new Date(startDate)
//               : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//             end: endDate ? new Date(endDate) : new Date(),
//           },
//           totals: {
//             total: 0,
//             delivered: 0,
//             failed: 0,
//             bounced: 0,
//             pending: 0,
//             deliveryRate: 0,
//             failureRate: 0,
//             bounceRate: 0,
//           },
//           byType: {},
//           byStatus: {},
//           byProvider: {},
//           trends: {
//             hourly: [],
//             daily: [],
//           },
//           costs: {
//             total: 0,
//             byProvider: {},
//             byType: {},
//             averagePerMessage: 0,
//           },
//           performance: {
//             averageSendTime: 0,
//             averageRenderTime: 0,
//             queueWaitTime: 0,
//             successRate: 0,
//           },
//         };

//         return {
//           success: true,
//           data: mockAnalytics,
//           message: "Communication analytics retrieved successfully",
//         };
//       } catch (error) {
//         logger.error("Failed to get communication analytics:", error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve analytics",
//         };
//       }
//     },
//     {
//       query: analyticsQuerySchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Get communication analytics",
//         description: "Get analytics for communications",
//       },
//     }
//   )

//   /**
//    * Schedule a communication for future sending
//    */
//   .post(
//     "/schedule",
//     async ({ body, set, headers }) => {
//       try {
//         // Get context from headers
//         const userId = headers["x-user-id"] as string;
//         const orgId = headers["x-org-id"] as string;
//         const requestId = headers["x-request-id"] as string;

//         const context = {
//           userId,
//           orgId,
//           requestId: requestId || `req_${Date.now()}`,
//         };

//         const result = await communicationsService.sendCommunication({
//           ...body,
//           scheduledAt: body.scheduledAt
//             ? new Date(body.scheduledAt)
//             : undefined,
//           type: body.type as CommunicationType,
//           to: body.to as string | string[] | Recipient[],
//           content: body.content as CommunicationContent,
//           settings: body.settings as CommunicationSettings,
//           context,
//         });

//         if (!result.success) {
//           set.status = 400;
//           return {
//             success: false,
//             error: result.error?.code || "SCHEDULE_ERROR",
//             message:
//               result.error?.message || "Failed to schedule communication",
//           };
//         }

//         set.status = 201;
//         return {
//           success: true,
//           data: {
//             communicationId: result.communicationId,
//             scheduledAt: body.scheduledAt,
//           },
//           message: "Communication scheduled successfully",
//         };
//       } catch (error) {
//         logger.error("Failed to schedule communication:", error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to schedule communication",
//         };
//       }
//     },
//     {
//       body: t.Object({
//         type: communicationTypeSchema,
//         to: t.Union([
//           t.String(),
//           t.Array(t.String()),
//           t.Array(recipientSchema),
//         ]),
//         templateId: t.Optional(t.String()),
//         template: t.Optional(t.Any()),
//         data: t.Optional(t.Record(t.String(), t.Any())),
//         content: t.Optional(communicationContentSchema),
//         priority: t.Optional(communicationPrioritySchema),
//         scheduledAt: t.String({ format: "date-time" }), // Required for scheduling
//         context: t.Optional(communicationContextSchema),
//         settings: t.Optional(communicationSettingsSchema),
//         metadata: t.Optional(t.Record(t.String(), t.Any())),
//       }),
//       detail: {
//         tags: ["communications"],
//         summary: "Schedule communication",
//         description: "Schedule a communication for future sending",
//       },
//     }
//   )

//   /**
//    * Get delivery status for a communication
//    */
//   .get(
//     "/:id/status",
//     async ({ params, set, headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;

//         const communication = await communicationsService.getCommunication(
//           params.id
//         );

//         if (!communication) {
//           set.status = 404;
//           return {
//             success: false,
//             error: "Not found",
//             message: "Communication not found",
//           };
//         }

//         // Check if communication belongs to the organization
//         if (communication.context.orgId !== orgId) {
//           set.status = 403;
//           return {
//             success: false,
//             error: "Forbidden",
//             message: "Access denied",
//           };
//         }

//         return {
//           success: true,
//           data: {
//             id: communication.id,
//             status: communication.status,
//             deliveryStatus: communication.deliveryStatus,
//             sentAt: communication.sentAt,
//             deliveredAt: communication.deliveredAt,
//             error: communication.error,
//           },
//           message: "Communication status retrieved successfully",
//         };
//       } catch (error) {
//         logger.error(`Failed to get communication status ${params.id}:`, error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve communication status",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         id: t.String(),
//       }),
//       detail: {
//         tags: ["communications"],
//         summary: "Get communication delivery status",
//         description: "Get the delivery status of a communication",
//       },
//     }
//   )

//   /**
//    * Retry a failed communication
//    */
//   .post(
//     "/:id/retry",
//     async ({ params, set, headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;

//         const communication = await communicationsService.getCommunication(
//           params.id
//         );

//         if (!communication) {
//           set.status = 404;
//           return {
//             success: false,
//             error: "Not found",
//             message: "Communication not found",
//           };
//         }

//         // Check if communication belongs to the organization
//         if (communication.context.orgId !== orgId) {
//           set.status = 403;
//           return {
//             success: false,
//             error: "Forbidden",
//             message: "Access denied",
//           };
//         }

//         // Check if communication is in a failed state
//         if (communication.status !== "failed") {
//           set.status = 400;
//           return {
//             success: false,
//             error: "Bad request",
//             message: "Communication is not in a failed state",
//           };
//         }

//         // For now, just return success - in production this would trigger a retry
//         // through the queue system
//         return {
//           success: true,
//           data: {
//             communicationId: params.id,
//             status: "queued",
//             retryAt: new Date().toISOString(),
//           },
//           message: "Communication queued for retry",
//         };
//       } catch (error) {
//         logger.error(`Failed to retry communication ${params.id}:`, error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retry communication",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         id: t.String(),
//       }),
//       detail: {
//         tags: ["communications"],
//         summary: "Retry failed communication",
//         description: "Retry sending a failed communication",
//       },
//     }
//   )

//   /**
//    * Get communication statistics summary
//    */
//   .get(
//     "/stats",
//     ({ headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;

//         // Mock statistics - would be implemented with actual database queries
//         const mockStats = {
//           totalCommunications: 0,
//           sentToday: 0,
//           sentThisMonth: 0,
//           deliveredThisMonth: 0,
//           failedThisMonth: 0,
//           deliveryRate: 0,
//           failureRate: 0,
//           totalCost: 0,
//           averageCostPerMessage: 0,
//         };

//         return {
//           success: true,
//           data: mockStats,
//           message: "Communication statistics retrieved successfully",
//         };
//       } catch (error) {
//         logger.error("Failed to get communication statistics:", error);
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve statistics",
//         };
//       }
//     },
//     {
//       detail: {
//         tags: ["communications"],
//         summary: "Get communication statistics",
//         description: "Get communication statistics summary",
//       },
//     }
//   );

// /**
//  * Helper method to map webhook types from different providers
//  */
// function mapWebhookType(
//   provider: string,
//   body: any
// ): "delivery" | "bounce" | "complaint" | "open" | "click" {
//   switch (provider.toLowerCase()) {
//     case "resend":
//       // Resend webhook types
//       if (body.type === "email.delivered") return "delivery";
//       if (body.type === "email.bounced") return "bounce";
//       if (body.type === "email.complained") return "complaint";
//       if (body.type === "email.opened") return "open";
//       if (body.type === "email.clicked") return "click";
//       break;

//     case "africastalking":
//       // Africa's Talking webhook types
//       if (body.status) {
//         if (body.status === "Success") return "delivery";
//         if (body.status === "Failed") return "bounce";
//       }
//       break;

//     default:
//       // Generic mapping
//       if (body.event_type || body.type) {
//         const eventType = (body.event_type || body.type).toLowerCase();
//         if (eventType.includes("deliver")) return "delivery";
//         if (eventType.includes("bounce")) return "bounce";
//         if (eventType.includes("complaint")) return "complaint";
//         if (eventType.includes("open")) return "open";
//         if (eventType.includes("click")) return "click";
//       }
//   }

//   return "delivery"; // Default fallback
// }
