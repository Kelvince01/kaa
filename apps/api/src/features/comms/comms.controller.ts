// import {
//   type CommunicationContent,
//   type CommunicationSettings,
//   type CommunicationType,
//   communicationsService,
//   type Recipient,
// } from "@kaa/communications";
// import { logger } from "@kaa/utils";
// import { Elysia, t } from "elysia";
// import {
//   analyticsQuerySchema,
//   communicationContentSchema,
//   communicationContextSchema,
//   communicationPrioritySchema,
//   communicationSettingsSchema,
//   communicationTypeSchema,
//   communicationWebhookSchema,
//   getBulkCommunicationParamsSchema,
//   getCommunicationParamsSchema,
//   listCommunicationsQuerySchema,
//   recipientSchema,
//   sendBulkCommunicationSchema,
//   sendCommunicationSchema,
// } from "./comms.schema";

// /**
//  * Unified Communications Controller
//  * Handles all communication types (email, SMS, push) through a single API
//  */
// export const commsController = new Elysia({ prefix: "/comms" })

//   /**
//    * Send a single communication (email, SMS, or push)
//    */
//   .post(
//     "/send",
//     async ({ body, set, headers }) => {
//       try {
//         // Get context from headers
//         const userId = headers["x-user-id"] as string;
//         const orgId = headers["x-org-id"] as string;
//         const requestId = headers["x-request-id"] as string;
//         const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"];
//         const userAgent = headers["user-agent"];

//         const context = {
//           userId,
//           orgId,
//           requestId: requestId || `req_${Date.now()}`,
//           ipAddress: ipAddress as string,
//           userAgent: userAgent as string,
//         };

//         const result = await communicationsService.sendCommunication({
//           ...body,
//           content: body.content as CommunicationContent,
//           settings: body.settings as CommunicationSettings,
//           scheduledAt: body.scheduledAt
//             ? new Date(body.scheduledAt)
//             : undefined,
//           to: body.to as string | string[] | Recipient[],
//           type: body.type as CommunicationType,
//           context,
//         });

//         if (!result.success) {
//           set.status = 400;
//           return {
//             success: false,
//             error: result.error?.code || "SEND_ERROR",
//             message: result.error?.message || "Failed to send communication",
//           };
//         }

//         set.status = 201;
//         return {
//           success: true,
//           data: {
//             communicationId: result.communicationId,
//             messageId: result.messageId,
//             segments: result.segments,
//             cost: result.cost,
//           },
//           message: "Communication sent successfully",
//         };
//       } catch (error) {
//         logger.error("Failed to send communication:", error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to send communication",
//         };
//       }
//     },
//     {
//       body: sendCommunicationSchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Send communication",
//         description: "Send an email, SMS, or push notification",
//       },
//     }
//   )

//   /**
//    * Send bulk communications
//    */
//   .post(
//     "/bulk",
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

//         const result = await communicationsService.sendBulkCommunication({
//           ...body,
//           scheduledAt: body.scheduledAt
//             ? new Date(body.scheduledAt)
//             : undefined,
//           settings: body.settings as CommunicationSettings,
//           context,
//         });

//         if (!result.success && result.failedCommunications > 0) {
//           set.status = 207; // Multi-status
//         } else if (result.success) {
//           set.status = 201;
//         } else {
//           set.status = 400;
//         }

//         return {
//           success: result.success,
//           data: {
//             bulkId: result.bulkId,
//             total: result.totalCommunications,
//             successful: result.successfulCommunications,
//             failed: result.failedCommunications,
//             results: result.results?.slice(0, 10), // Return first 10 results
//           },
//           message: `Bulk communication ${result.success ? "sent" : "partially sent"} successfully`,
//         };
//       } catch (error) {
//         logger.error("Failed to send bulk communication:", error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to send bulk communication",
//         };
//       }
//     },
//     {
//       body: sendBulkCommunicationSchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Send bulk communications",
//         description:
//           "Send bulk emails, SMS, or push notifications to multiple recipients",
//       },
//     }
//   )

//   /**
//    * List communications with filtering
//    */
//   .get(
//     "/",
//     ({ query, set, headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;
//         const {
//           type,
//           status,
//           startDate,
//           endDate,
//           page = 1,
//           limit = 20,
//           sortBy = "createdAt",
//           sortOrder = "desc",
//         } = query;

//         // Build query
//         const dbQuery: any = {
//           "context.orgId": orgId,
//         };

//         if (type) dbQuery.type = type;
//         if (status) dbQuery.status = status;

//         if (startDate || endDate) {
//           dbQuery.createdAt = {};
//           if (startDate) dbQuery.createdAt.$gte = new Date(startDate);
//           if (endDate) dbQuery.createdAt.$lte = new Date(endDate);
//         }

//         // This would need to be implemented in the communications service
//         // For now, return mock data structure
//         const mockData = {
//           communications: [],
//           pagination: {
//             page: Number(page),
//             limit: Number(limit),
//             total: 0,
//             pages: 0,
//           },
//         };

//         return {
//           success: true,
//           data: mockData,
//           message: "Communications retrieved successfully",
//         };
//       } catch (error) {
//         logger.error("Failed to list communications:", error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve communications",
//         };
//       }
//     },
//     {
//       query: listCommunicationsQuerySchema,
//       detail: {
//         tags: ["communications"],
//         summary: "List communications",
//         description: "List communications with filtering and pagination",
//       },
//     }
//   )

//   /**
//    * Get communication by ID
//    */
//   .get(
//     "/:id",
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
//           data: communication,
//           message: "Communication retrieved successfully",
//         };
//       } catch (error) {
//         logger.error(`Failed to get communication ${params.id}:`, error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve communication",
//         };
//       }
//     },
//     {
//       params: getCommunicationParamsSchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Get communication by ID",
//         description: "Get a specific communication by its ID",
//       },
//     }
//   )

//   /**
//    * Get bulk communication by ID
//    */
//   .get(
//     "/bulk/:id",
//     async ({ params, set, headers }) => {
//       try {
//         const orgId = headers["x-org-id"] as string;

//         const bulkCommunication =
//           await communicationsService.getBulkCommunication(params.id);

//         if (!bulkCommunication) {
//           set.status = 404;
//           return {
//             success: false,
//             error: "Not found",
//             message: "Bulk communication not found",
//           };
//         }

//         // Check if bulk communication belongs to the organization
//         if (bulkCommunication.context.orgId !== orgId) {
//           set.status = 403;
//           return {
//             success: false,
//             error: "Forbidden",
//             message: "Access denied",
//           };
//         }

//         return {
//           success: true,
//           data: bulkCommunication,
//           message: "Bulk communication retrieved successfully",
//         };
//       } catch (error) {
//         logger.error(`Failed to get bulk communication ${params.id}:`, error);
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to retrieve bulk communication",
//         };
//       }
//     },
//     {
//       params: getBulkCommunicationParamsSchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Get bulk communication by ID",
//         description: "Get a specific bulk communication by its ID",
//       },
//     }
//   )

//   /**
//    * Webhook endpoint for delivery status updates
//    */
//   .post(
//     "/webhook/:provider",
//     async ({ params, body, set }) => {
//       try {
//         // Process webhook based on provider
//         const payload = {
//           ...body,
//           type: mapWebhookType(params.provider, body),
//           communicationId: body.communicationId || body.messageId,
//           timestamp: new Date(),
//         };

//         await communicationsService.processWebhook({
//           ...payload,
//           communicationId: payload.communicationId as string,
//           timestamp: payload.timestamp,
//           recipient: payload.recipient as string,
//         });

//         return {
//           success: true,
//           message: "Webhook processed successfully",
//         };
//       } catch (error) {
//         logger.error(
//           `Failed to process webhook for provider ${params.provider}:`,
//           error
//         );
//         set.status = 500;
//         return {
//           success: false,
//           error: "Internal server error",
//           message: "Failed to process webhook",
//         };
//       }
//     },
//     {
//       params: t.Object({
//         provider: t.String(),
//       }),
//       body: communicationWebhookSchema,
//       detail: {
//         tags: ["communications"],
//         summary: "Communication webhook",
//         description: "Webhook endpoint for communication provider updates",
//       },
//     }
//   )

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

// export default commsController;

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
