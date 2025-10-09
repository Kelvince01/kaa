import { SmsDeliveryReport, SmsMessage } from "@kaa/models";
import { SmsDeliveryStatus } from "@kaa/models/types";
import { smsService, smsServiceFactory } from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import {
  analyticsQuerySchema,
  bulkSmsSchema,
  listSmsQuerySchema,
  sendSmsSchema,
  sendSmsWithTemplateSchema,
} from "./sms.schema";

export const smsController = new Elysia({ prefix: "/sms" })
  /**
   * Send SMS message
   */
  .post(
    "/send",
    async ({ body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;
        const orgId = headers["x-org-id"] as string;

        const context = {
          userId,
          orgId,
          requestId: headers["x-request-id"] as string,
          ipAddress:
            (headers["x-forwarded-for"] as string) ||
            (headers["x-real-ip"] as string),
          userAgent: headers["user-agent"] as string,
        };

        const result = await smsService.sendSms({
          ...body,
          scheduledAt: body.scheduledAt
            ? new Date(body.scheduledAt)
            : undefined,
          context,
        });

        if (!result.success) {
          set.status = 400;
          return {
            status: "error",
            error: result.error?.code || "SMS_SEND_ERROR",
            message: result.error?.message || "Failed to send SMS",
          };
        }

        set.status = 201;
        return {
          status: "success",
          data: {
            messageId: result.messageId,
            segments: result.segments,
            cost: result.cost,
          },
          message: "SMS sent successfully",
        };
      } catch (error) {
        logger.error("Failed to send SMS:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to send SMS",
        };
      }
    },
    {
      body: sendSmsSchema,
      detail: {
        tags: ["sms"],
        summary: "Send SMS",
        description: "Send an SMS message to a recipient",
      },
    }
  )

  /**
   * Send SMS using template
   */
  .post(
    "/send-template",
    async ({ body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;
        const orgId = headers["x-org-id"] as string;

        const context = {
          userId,
          orgId,
          requestId: headers["x-request-id"] as string,
          ipAddress:
            (headers["x-forwarded-for"] as string) ||
            (headers["x-real-ip"] as string),
          userAgent: headers["user-agent"] as string,
        };

        const result = await smsService.sendSmsWithTemplate({
          ...body,
          scheduledAt: body.scheduledAt
            ? new Date(body.scheduledAt)
            : undefined,
          context,
        });

        if (!result.success) {
          set.status = 400;
          return {
            status: "error",
            error: result.error?.code || "SMS_TEMPLATE_ERROR",
            message:
              result.error?.message || "Failed to send SMS with template",
          };
        }

        set.status = 201;
        return {
          status: "success",
          data: {
            messageId: result.messageId,
            segments: result.segments,
            cost: result.cost,
          },
          message: "SMS sent successfully using template",
        };
      } catch (error) {
        logger.error("Failed to send SMS with template:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to send SMS with template",
        };
      }
    },
    {
      body: sendSmsWithTemplateSchema,
      detail: {
        tags: ["sms"],
        summary: "Send SMS with template",
        description: "Send an SMS message to a recipient using a template",
      },
    }
  )

  /**
   * Send bulk SMS
   */
  .post(
    "/send/bulk",
    async ({ body, set, headers }) => {
      try {
        const userId = headers["x-user-id"] as string;
        const orgId = headers["x-org-id"] as string;

        const context = {
          userId,
          orgId,
          requestId: headers["x-request-id"] as string,
        };

        const result = await smsServiceFactory.sendBulkSms({
          ...body,
          context,
        });

        set.status = 201;
        return {
          status: "success",
          data: result,
          message: "Bulk SMS initiated successfully",
        };
      } catch (error) {
        logger.error("Failed to send bulk SMS:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to send bulk SMS",
        };
      }
    },
    {
      body: bulkSmsSchema,
      detail: {
        tags: ["sms"],
        summary: "Send bulk SMS",
        description: "Send bulk SMS messages to multiple recipients",
      },
    }
  )

  /**
   * List SMS messages with filtering
   */
  .get(
    "/",
    async ({ query, set, headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;
        const {
          status,
          type,
          startDate,
          endDate,
          phoneNumber,
          page = 1,
          limit = 20,
          sortBy = "createdAt",
          sortOrder = "desc",
        } = query;

        // Build query
        const dbQuery: any = {
          "context.orgId": orgId,
        };

        if (status) dbQuery.status = status;
        if (type) dbQuery.type = type;
        if (phoneNumber) dbQuery.to = { $regex: phoneNumber, $options: "i" };

        if (startDate || endDate) {
          dbQuery.createdAt = {};
          if (startDate) dbQuery.createdAt.$gte = new Date(startDate);
          if (endDate) dbQuery.createdAt.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const sortOptions: any = {};
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

        const [messages, total] = await Promise.all([
          SmsMessage.find(dbQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .select("-template.data") // Exclude sensitive template data
            .exec(),
          SmsMessage.countDocuments(dbQuery),
        ]);

        return {
          status: "success",
          data: {
            messages,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          },
          message: "SMS messages retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to list SMS messages:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retrieve SMS messages",
        };
      }
    },
    {
      query: listSmsQuerySchema,
      detail: {
        tags: ["sms"],
        summary: "List SMS messages",
        description: "List SMS messages with filtering",
      },
    }
  )

  /*
  // Get user SMS messages
  .get('/user/messages', smsController.getUserSMS.bind(smsController), {
    beforeHandle: ({ requireAuth }) => requireAuth(),
    detail: {
      tags: ['SMS'],
      summary: 'Get user SMS',
      description: 'Get SMS messages for the authenticated user'
    }
  })
    
  // Get SMS status
  .get('/:smsId/status', smsController.getSMSStatus.bind(smsController), {
    beforeHandle: ({ requireAuth }) => requireAuth(),
    detail: {
      tags: ['SMS'],
      summary: 'Get SMS status',
      description: 'Get delivery status of an SMS'
    }
  })*/

  /**
   * Get SMS message by ID
   */
  .get(
    "/:id",
    async ({ params, set, headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;

        const message = await SmsMessage.findOne({
          _id: params.id,
          "context.orgId": orgId,
        });

        if (!message) {
          set.status = 404;
          return {
            status: "error",
            error: "Not found",
            message: "SMS message not found",
          };
        }

        return {
          status: "success",
          data: message,
          message: "SMS message retrieved successfully",
        };
      } catch (error) {
        logger.error(`Failed to get SMS message ${params.id}:`, error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retrieve SMS message",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["sms"],
        summary: "Get SMS message by ID",
        description: "Get an SMS message by its ID",
      },
    }
  )

  /**
   * Get delivery reports for SMS message
   */
  .get(
    "/:id/delivery",
    async ({ params, set, headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;

        // First check if message exists and belongs to org
        const message = await SmsMessage.findOne({
          _id: params.id,
          "context.orgId": orgId,
        });

        if (!message) {
          set.status = 404;
          return {
            status: "error",
            error: "Not found",
            message: "SMS message not found",
          };
        }

        const deliveryReports = await SmsDeliveryReport.find({
          messageId: message.messageId || params.id,
        }).sort({ createdAt: -1 });

        return {
          status: "success",
          data: {
            message: {
              id: message._id,
              status: message.status,
              deliveryStatus: message.deliveryStatus,
            },
            deliveryReports,
          },
          message: "Delivery reports retrieved successfully",
        };
      } catch (error) {
        logger.error(`Failed to get delivery reports for ${params.id}:`, error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retrieve delivery reports",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["sms"],
        summary: "Get delivery reports for SMS message",
        description: "Get delivery reports for an SMS message",
      },
    }
  )

  /**
   * Get SMS analytics
   */
  .get(
    "/analytics/overview",
    async ({ query, set, headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;
        const { startDate, endDate } = query;

        const analytics = await smsService.getAnalytics(
          new Date(startDate),
          new Date(endDate),
          { orgId }
        );

        return {
          status: "success",
          data: analytics,
          message: "SMS analytics retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get SMS analytics:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retrieve SMS analytics",
        };
      }
    },
    {
      query: analyticsQuerySchema,
      detail: {
        tags: ["sms"],
        summary: "Get SMS analytics",
        description: "Get SMS analytics",
      },
    }
  )

  /**
   * Retry failed SMS message
   */
  .post(
    "/:id/retry",
    async ({ params, set, headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;

        const message = await SmsMessage.findOne({
          _id: params.id,
          "context.orgId": orgId,
          status: "failed",
        });

        if (!message) {
          set.status = 404;
          return {
            status: "error",
            error: "Not found",
            message: "Failed SMS message not found",
          };
        }

        // Reset message status and queue for retry
        message.status = SmsDeliveryStatus.QUEUED;
        message.error = undefined;
        await message.save();

        // Queue the message for processing
        await smsService.processSmsMessage(message._id.toString());

        return {
          status: "success",
          message: "SMS message queued for retry",
        };
      } catch (error) {
        logger.error(`Failed to retry SMS message ${params.id}:`, error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retry SMS message",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["sms"],
        summary: "Retry failed SMS message",
        description: "Retry a failed SMS message",
      },
    }
  )

  /**
   * Webhook endpoint for delivery status updates
   */
  .post(
    "/webhook/delivery",
    async ({ body, set }) => {
      try {
        // Handle different provider webhook formats
        const {
          messageId,
          phoneNumber,
          status,
          errorCode,
          errorMessage,
          cost,
          networkCode,
        } = body;

        await smsService.updateDeliveryStatus({
          messageId,
          phoneNumber,
          status,
          errorCode,
          errorMessage,
          cost,
          networkCode,
        });

        return {
          status: "success",
          message: "Delivery status updated successfully",
        };
      } catch (error) {
        logger.error("Failed to process delivery webhook:", error);
        set.status = 500;
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to process delivery webhook",
        };
      }
    },
    {
      body: t.Object({
        messageId: t.String(),
        phoneNumber: t.String(),
        status: t.String(),
        errorCode: t.String(),
        errorMessage: t.String(),
        cost: t.String(),
        networkCode: t.String(),
      }),
      detail: {
        tags: ["sms"],
        summary: "Webhook endpoint for delivery status updates",
        description: "Webhook endpoint for delivery status updates",
      },
    }
  )

  /**
   * Get SMS statistics
   */
  .get(
    "/stats/summary",
    async ({ headers }) => {
      try {
        const orgId = headers["x-org-id"] as string;

        const today = new Date();
        const thirtyDaysAgo = new Date(
          today.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const [
          totalMessages,
          sentToday,
          sentThisMonth,
          failedThisMonth,
          deliveredThisMonth,
        ] = await Promise.all([
          SmsMessage.countDocuments({ "context.orgId": orgId }),
          SmsMessage.countDocuments({
            "context.orgId": orgId,
            createdAt: { $gte: new Date(today.toDateString()) },
          }),
          SmsMessage.countDocuments({
            "context.orgId": orgId,
            createdAt: { $gte: thirtyDaysAgo },
          }),
          SmsMessage.countDocuments({
            "context.orgId": orgId,
            status: "failed",
            createdAt: { $gte: thirtyDaysAgo },
          }),
          SmsMessage.countDocuments({
            "context.orgId": orgId,
            status: "delivered",
            createdAt: { $gte: thirtyDaysAgo },
          }),
        ]);

        const deliveryRate =
          sentThisMonth > 0 ? (deliveredThisMonth / sentThisMonth) * 100 : 0;
        const failureRate =
          sentThisMonth > 0 ? (failedThisMonth / sentThisMonth) * 100 : 0;

        return {
          status: "success",
          data: {
            totalMessages,
            sentToday,
            sentThisMonth,
            failedThisMonth,
            deliveredThisMonth,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
          },
          message: "SMS statistics retrieved successfully",
        };
      } catch (error) {
        logger.error("Failed to get SMS statistics:", error);
        return {
          status: "error",
          error: "Internal server error",
          message: "Failed to retrieve SMS statistics",
        };
      }
    },
    {
      detail: {
        tags: ["sms"],
        summary: "Get SMS statistics",
        description: "Get SMS statistics",
      },
    }
  );

/*
.get('/analytics/delivery', smsController.getDeliveryAnalytics.bind(smsController), {
  beforeHandle: ({ requireAuth }) => requireAuth(),
  detail: {
    tags: ['SMS', 'Analytics'],
    summary: 'Get delivery analytics',
    description: 'Get SMS delivery rate and performance analytics'
  }
})
 
// Delivery reports (webhook endpoint)
.post('/delivery-report', smsController.handleDeliveryReport.bind(smsController), {
  detail: {
    tags: ['SMS', 'Webhooks'],
    summary: 'Handle delivery report',
    description: 'Handle SMS delivery report from Africa\'s Talking'
  }
})
 
// Account and balance
.get('/account/balance', smsController.getAccountBalance.bind(smsController), {
  beforeHandle: ({ requireAuth }) => requireAuth(),
  detail: {
    tags: ['SMS', 'Account'],
    summary: 'Get account balance',
    description: 'Get SMS credit balance from Africa\'s Talking'
  }
})*/

export default smsController;
