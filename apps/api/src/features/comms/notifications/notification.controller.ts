import { Notification, User } from "@kaa/models";
import {
  type INotification,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@kaa/models/types";
import {
  NotificationUtils,
  notificationService,
  WhatsAppTemplates,
  whatsappService,
} from "@kaa/services";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const notificationController = new Elysia({ prefix: "/notifications" })
  .use(authPlugin)
  // Get user notifications
  .get(
    "/",
    async ({ query, user, set }) => {
      try {
        const {
          page = 1,
          limit = 20,
          status,
          type,
          channel,
          unreadOnly = false,
        } = query;

        const filter: FilterQuery<INotification> = {
          recipients: [user.id],
        };

        if (status) {
          filter.status = status;
        }
        if (type) {
          filter.type = type;
        }
        if (channel) {
          filter.channel = channel;
        }

        const skip = (page - 1) * limit;

        // Find notifications for user
        const notifications = await Notification.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        // Get total count for pagination
        const totalNotifications = await Notification.countDocuments(query);
        const totalPages = Math.ceil(totalNotifications / limit);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
          recipients: [user.id],
          isRead: false,
        });

        const data = {
          notifications,
          unreadCount,
        };

        set.status = 200;
        return {
          status: "success",
          message: "Notifications fetched successfully",
          items: data.notifications,
          unread: unreadCount,
          pagination: {
            total: totalNotifications,
            pages: totalPages,
            page,
            limit,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to fetch notifications",
          error: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number()),
        limit: t.Optional(t.Number()),
        unreadOnly: t.Optional(t.Boolean()),
        status: t.Optional(t.String()),
        type: t.Optional(t.String()),
        channel: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Get notifications",
        description: "Get notifications for the authenticated user",
        security: [
          {
            bearerAuth: [
              // {
              // scopes: ["notifications:read"],
              // },
            ],
          },
        ],
      },
    }
  )
  .get(
    "/unread-count",
    async ({ query, user, set }) => {
      try {
        const {
          page = 1,
          limit = 20,
          status,
          type,
          channel,
          unreadOnly = false,
        } = query;

        const unreadCount = await Notification.countDocuments({
          recipient: user.id,
          isRead: false,
        });

        return await notificationService.getUserNotifications(
          user.id,
          user.memberId || "",
          { page, limit, status, type, channel },
          unreadOnly === "true"
        );
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to fetch notifications",
          error: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
        status: t.Optional(t.String()),
        type: t.Optional(t.String()),
        channel: t.Optional(t.String()),
        unreadOnly: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Get unread count",
        description: "Get unread count for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Get unread count
  .get(
    "/unread-count",
    async ({ user, set }) => {
      try {
        const count = await notificationService.getUnreadCount(user.id);
        return { unreadCount: count };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to fetch notifications",
          error: (error as Error).message,
        };
      }
    },
    {
      detail: {
        tags: ["notifications"],
        summary: "Mark notification as read",
        description: "Mark a notification as read for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Mark notification as read
  .patch(
    "/:id/read",
    async ({ params, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        return await notificationService.markAsRead(params.id, user.id);
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to mark notification as read",
          error: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Mark notification as read",
        description: "Mark a notification as read for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Mark all notifications as read
  .patch(
    "/mark-all-read",
    async ({ user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        return await notificationService.markAllAsRead(
          user.id,
          user.memberId || ""
        );
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to mark all notifications as read",
          error: (error as Error).message,
        };
      }
    },
    {
      detail: {
        tags: ["notifications"],
        summary: "Mark all notifications as read",
        description:
          "Mark all notifications as read for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Send smart notification - admin only
  .post(
    "/send",
    async ({ body, set }) => {
      try {
        const result = await NotificationUtils.sendSmartNotification({
          userId: body.userId,
          memberId: body.memberId,
          type: body.type,
          title: body.title,
          message: body.message,
          data: body.data,
          priority: body.priority,
          channels: body.channels,
          templateName: body.templateName,
          templateVariables: body.templateVariables,
          scheduledFor: body.scheduledFor
            ? new Date(body.scheduledFor)
            : undefined,
        });

        return { success: true, result };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to send notification",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        userId: t.String(),
        memberId: t.Optional(t.String()),
        type: t.Union([
          t.Literal(NotificationType.SYSTEM),
          t.Literal(NotificationType.SYSTEM_ALERT),
          t.Literal(NotificationType.BOOKING_CONFIRMED),
          t.Literal(NotificationType.BOOKING_CANCELLED),
        ]),
        title: t.String(),
        message: t.String(),
        data: t.Optional(t.Record(t.String(), t.Any())),
        priority: t.Optional(
          t.Union([
            t.Literal(NotificationPriority.LOW),
            t.Literal(NotificationPriority.MEDIUM),
            t.Literal(NotificationPriority.HIGH),
          ])
        ),
        channels: t.Optional(
          t.Array(
            t.Union([
              t.Literal(NotificationChannel.EMAIL),
              t.Literal(NotificationChannel.PUSH),
              t.Literal(NotificationChannel.SMS),
              t.Literal(NotificationChannel.IN_APP),
              t.Literal(NotificationChannel.WHATSAPP),
            ])
          )
        ),
        templateName: t.Optional(t.String()),
        templateVariables: t.Optional(t.Record(t.String(), t.String())),
        scheduledFor: t.Optional(t.Date()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Send smart notification",
        description: "Send a smart notification to the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const {
          channel,
          recipientId,
          type,
          title,
          message,
          link,
          image,
          relatedId,
          relatedModel,
        } = body;

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          set.status = 404;
          return {
            status: "error",
            message: "Recipient not found",
          };
        }

        // Create notification
        const notification = new Notification({
          userId: new mongoose.Types.ObjectId(user.id),
          memberId: new mongoose.Types.ObjectId(user.memberId),
          channel,
          recipients: [recipientId],
          type,
          title,
          message,
          link: link || null,
          image: image || null,
          relatedId: relatedId || null,
          relatedModel: relatedModel || null,
        });

        await notification.save();

        set.status = 200;
        return {
          status: "success",
          message: "Notification created successfully",
          data: notification,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to create notification",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        channel: t.Enum({
          email: "email",
          sms: "sms",
          push: "push",
          in_app: "in_app",
        }),
        recipientId: t.String(),
        type: t.String(),
        title: t.String(),
        message: t.String(),
        link: t.Optional(t.String()),
        image: t.Optional(t.String()),
        relatedId: t.Optional(t.String()),
        relatedModel: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Create notification",
        description: "Create a notification for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Send WhatsApp template message - admin only
  .post(
    "/whatsapp/template",
    async ({ body, set }) => {
      try {
        // Validate template
        const validation = WhatsAppTemplates.validateTemplate(
          body.templateName,
          body.variables
        );
        if (!validation.valid) {
          set.status = 400;
          return {
            status: "error",
            message: `Template validation failed. Missing variables: ${validation.missingVariables.join(", ")}`,
          };
        }

        const result = await WhatsAppTemplates.sendTemplatedMessage(
          body.templateName,
          body.phoneNumber,
          body.variables
        );

        if (!result.success) {
          set.status = 500;
          return {
            status: "error",
            message: result.error || "Failed to send WhatsApp message",
          };
        }

        return { success: true, messageId: result.messageId };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to send WhatsApp template message",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        templateName: t.String(),
        phoneNumber: t.String(),
        variables: t.Record(t.String(), t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Send WhatsApp template message",
        description:
          "Send a WhatsApp template message to the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Send WhatsApp message directly - admin only
  .post(
    "/whatsapp/send",
    async ({ body, set }) => {
      try {
        const result = await whatsappService.sendMessage({
          to: body.phoneNumber,
          message: body.message,
          title: body.title,
        });

        if (!result.success) {
          set.status = 500;
          return {
            status: "error",
            message: result.error || "Failed to send WhatsApp message",
          };
        }

        return { success: true, messageId: result.messageId };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to send WhatsApp message",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String(),
        message: t.String(),
        title: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Send WhatsApp message",
        description: "Send a WhatsApp message to the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Send bulk notifications - admin only
  .post(
    "/bulk",
    async ({ body, set }) => {
      try {
        const result = await NotificationUtils.sendBulkNotifications(
          body.userIds,
          {
            type: body.type,
            title: body.title,
            message: body.message,
            data: body.data,
            priority: body.priority,
            channels: body.channels,
            templateName: body.templateName,
            templateVariables: body.templateVariables,
          }
        );

        return {
          success: true,
          summary: {
            totalUsers: body.userIds.length,
            successful: result.success,
            failed: result.failed,
            errors: result.errors,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to send bulk notifications",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        userIds: t.Array(t.String()),
        type: t.Union([
          t.Literal(NotificationType.SYSTEM),
          t.Literal(NotificationType.SYSTEM_ALERT),
          t.Literal(NotificationType.BOOKING_CONFIRMED),
          t.Literal(NotificationType.BOOKING_CANCELLED),
        ]),
        title: t.String(),
        message: t.String(),
        data: t.Optional(t.Record(t.String(), t.Any())),
        priority: t.Optional(
          t.Union([
            t.Literal(NotificationPriority.LOW),
            t.Literal(NotificationPriority.MEDIUM),
            t.Literal(NotificationPriority.HIGH),
          ])
        ),
        channels: t.Optional(
          t.Array(
            t.Union([
              t.Literal(NotificationChannel.EMAIL),
              t.Literal(NotificationChannel.PUSH),
              t.Literal(NotificationChannel.SMS),
              t.Literal(NotificationChannel.IN_APP),
              t.Literal(NotificationChannel.WHATSAPP),
            ])
          )
        ),
        templateName: t.Optional(t.String()),
        templateVariables: t.Optional(t.Record(t.String(), t.String())),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Send bulk notifications",
        description: "Send bulk notifications to the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  // Send emergency notification - admin only
  .post(
    "/emergency",
    async ({ body, set }) => {
      try {
        const result = await NotificationUtils.sendEmergencyNotification(
          body.propertyId,
          body.alertMessage,
          body.emergencyContact
        );

        return {
          success: true,
          summary: {
            whatsappSent: result.whatsappSent,
            regularNotifications: result.regularNotifications,
          },
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to send emergency notification",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        propertyId: t.String(),
        alertMessage: t.String(),
        emergencyContact: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Send emergency notification",
        description: "Send an emergency notification to the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )
  .get(
    "/preferences",
    async ({ user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        return await notificationService.getPreferences(
          user.id,
          user.memberId || ""
        );
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get notification preferences",
          error: (error as Error).message,
        };
      }
    },
    {
      detail: {
        tags: ["notifications"],
        summary: "Get notification preferences",
        description: "Get notification preferences for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Update notification preferences
  .put(
    "/preferences",
    async ({ body, user, set }) => {
      try {
        return await notificationService.updatePreferences(
          user.id,
          user.memberId || "",
          body.preferences
        );
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to update notification preferences",
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        preferences: t.Object({
          email: t.Object({
            enabled: t.Boolean(),
            types: t.Array(t.String()),
          }),
        }),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Get notification preferences",
        description: "Get notification preferences for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Get available WhatsApp templates
  .get(
    "/whatsapp/templates",
    ({ query, set }) => {
      const { category } = query;
      try {
        if (category) {
          const templates = WhatsAppTemplates.getTemplatesByCategory(
            category as any
          );
          return {
            templates,
            categories: [
              "booking",
              "payment",
              "property",
              "maintenance",
              "general",
              "emergency",
            ],
          };
          // biome-ignore lint/style/noUselessElse: false positive
        } else {
          const templates = WhatsAppTemplates.getAllTemplates();
          return {
            templates,
            categories: [
              "booking",
              "payment",
              "property",
              "maintenance",
              "general",
              "emergency",
            ],
          };
        }
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get WhatsApp templates",
          error: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Get WhatsApp templates",
        description: "Get WhatsApp templates for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Get WhatsApp service status
  .get(
    "/whatsapp/status",
    ({ user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        return whatsappService.getServiceStatus();
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get WhatsApp service status",
          error: (error as Error).message,
        };
      }
    },
    {
      detail: {
        tags: ["notifications"],
        summary: "Get WhatsApp service status",
        description: "Get the status of the WhatsApp service",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Get notification analytics
  .get(
    "/analytics",
    async ({ query, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        const { days = 30 } = query;

        return await NotificationUtils.getNotificationAnalytics(
          user.id,
          user.memberId || "",
          Number(days)
        );
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get notification analytics",
          error: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        days: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Get notification analytics",
        description: "Get notification analytics for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  )

  // Test notification system - admin only
  .post(
    "/test",
    async ({ body, user, set }) => {
      try {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Unauthorized",
          };
        }

        const { testMessage, testPhoneNumber } = body;

        try {
          const testResults = {
            whatsapp: {
              configured: false,
              tested: false,
              error: null as string | null,
            },
            sms: {
              configured: false,
              tested: false,
              error: null as string | null,
            },
            email: {
              configured: false,
              tested: false,
              error: null as string | null,
            },
          };

          // Test WhatsApp
          testResults.whatsapp.configured = whatsappService.isConfigured();
          if (testResults.whatsapp.configured && body.testPhoneNumber) {
            try {
              const {
                channel,
                recipientId,
                type,
                title,
                message,
                link,
                image,
                relatedId,
                relatedModel,
              } = body;
              const result = await whatsappService.sendMessage({
                to: body.testPhoneNumber,
                message: "Test message from Kaa notification system",
                title: "🧪 Test Notification",
              });
              testResults.whatsapp.tested = result.success;
              if (!result.success) {
                testResults.whatsapp.error = result.error || "Unknown error";
              }
            } catch (error: any) {
              testResults.whatsapp.error = error.message;
            }
          }

          // Test other services (placeholder)
          testResults.sms.configured = true; // Assuming SMS is configured
          testResults.email.configured = true; // Assuming email is configured

          return {
            success: true,
            testResults,
            timestamp: new Date(),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to test notification system",
            error: (error as Error).message,
          };
        }
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to test notification system",
        };
      }
    },
    {
      body: t.Object({
        testMessage: t.String(),
        testPhoneNumber: t.Optional(t.String()),
        testEmail: t.Optional(t.String()),
        channel: t.Optional(t.String()),
        recipientId: t.Optional(t.String()),
        type: t.Optional(t.String()),
        title: t.Optional(t.String()),
        message: t.Optional(t.String()),
        link: t.Optional(t.String()),
        image: t.Optional(t.String()),
        relatedId: t.Optional(t.String()),
        relatedModel: t.Optional(t.String()),
      }),
      detail: {
        tags: ["notifications"],
        summary: "Test notification system",
        description: "Test the notification system for the authenticated user",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    }
  );

export default notificationController;
