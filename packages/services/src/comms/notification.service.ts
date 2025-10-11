import {
  Notification,
  NotificationPreference,
  Template,
  User,
} from "@kaa/models";
import type {
  INotification,
  INotificationPreference,
  IUser,
} from "@kaa/models/types";
import { AppError, logger } from "@kaa/utils";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export type CreateNotificationData = {
  memberId: string;
  userId: string;
  type?: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: ("email" | "push" | "in_app" | "sms" | "whatsapp")[];
  scheduledFor?: Date;
  expiresAt?: Date;
};

export const notificationService = {
  /**
   * Send notification
   */
  sendNotification: async (
    userId: string,
    data: {
      type: string;
      title: string;
      message: string;
      channels?: string[];
      data?: Record<string, any>;
      scheduledFor?: Date;
    },
    memberId?: string
  ) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user preferences
    const preferences = await getNotificationPreferences(userId, memberId);
    const channels = data.channels || ["in_app"];

    const notifications: INotification[] = [];

    for (const channel of channels) {
      // Check if user has enabled this channel for this type
      const channelPrefs =
        preferences.preferences[
          channel as keyof typeof preferences.preferences
        ];
      if (!(channelPrefs.enabled && channelPrefs.types.includes(data.type))) {
        continue;
      }

      const notification = await Notification.create({
        userId,
        memberId,
        type: data.type,
        channel,
        title: data.title,
        message: data.message,
        data: data.data || {},
        scheduledFor: data.scheduledFor,
      });

      notifications.push(notification);

      // Send immediately if not scheduled
      if (!data.scheduledFor) {
        await deliverNotification(
          (notification._id as mongoose.Types.ObjectId).toString()
        );
      }
    }

    return notifications;
  },

  /**
   * Get user notifications
   */
  getUserNotifications: async (
    userId: string,
    memberId: string,
    query: any = {},
    unreadOnly = false
  ) => {
    const { page = 1, limit = 20, status, type, channel } = query;

    const filter: FilterQuery<INotification> = { userId, memberId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (channel) filter.channel = channel;

    if (unreadOnly) {
      filter.readAt = { $exists: false };
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId,
      memberId,
      status: { $ne: "read" },
    });

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId: string, userId: string) => {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    notification.status = "read";
    notification.readAt = new Date();
    await notification.save();

    return notification;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: string, memberId: string) => {
    await Notification.updateMany(
      { userId, memberId, status: { $ne: "read" } },
      { status: "read", readAt: new Date() }
    );

    return { success: true };
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        userId,
        readAt: { $exists: false },
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      });
    } catch (error) {
      logger.error("Failed to get unread count", error);
      throw new AppError("Failed to get unread count");
    }
  },

  /**
   * Update notification preferences
   */
  updatePreferences: async (
    userId: string,
    memberId: string,
    preferences: any
  ) => {
    const updated = await NotificationPreference.findOneAndUpdate(
      { userId, memberId },
      { preferences },
      { upsert: true, new: true }
    );

    return updated;
  },

  /**
   * Get notification preferences
   */
  getPreferences: async (userId: string, memberId: string) =>
    await getNotificationPreferences(userId, memberId),

  /**
   * Send email using template
   */
  sendTemplatedEmail: async (
    templateName: string,
    to: string,
    variables: Record<string, any> = {},
    memberId?: string
  ) => {
    const template = await Template.findOne({
      name: templateName,
      isActive: true,
      $or: [{ memberId }, { memberId: { $exists: false } }],
    });

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Replace variables in template
    let subject = template.subject;
    let htmlContent = template.content;
    // let textContent = template.textContent;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, "g"), String(value));
      htmlContent = htmlContent.replace(
        new RegExp(placeholder, "g"),
        String(value)
      );
      // textContent = textContent.replace(
      //   new RegExp(placeholder, "g"),
      //   String(value)
      // );
    }

    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    logger.info(`Sending email to ${to}`, {
      subject,
      template: templateName,
    });

    return { success: true, subject, to };
  },

  /**
   * Process scheduled notifications
   */
  processScheduledNotifications: async () => {
    const now = new Date();
    const scheduledNotifications = await Notification.find({
      status: "pending",
      scheduledFor: { $lte: now },
    });

    for (const notification of scheduledNotifications) {
      await deliverNotification(
        (notification._id as mongoose.Types.ObjectId).toString()
      );
    }

    return { processed: scheduledNotifications.length };
  },
};

/**
 * Get notification preferences with defaults
 */
async function getNotificationPreferences(userId: string, memberId?: string) {
  const query: FilterQuery<INotificationPreference> = {
    userId,
  };

  if (memberId) {
    query.memberId = memberId;
  }

  let preferences = await NotificationPreference.findOne(query);

  if (!preferences) {
    // Create default preferences
    preferences = await NotificationPreference.create({
      userId,
      memberId,
      preferences: {
        email: { enabled: true, types: ["info", "warning", "error"] },
        sms: { enabled: false, types: ["error"] },
        push: { enabled: true, types: ["info", "warning", "error"] },
        in_app: {
          enabled: true,
          types: ["info", "warning", "error", "success"],
        },
        whatsapp: { enabled: false, types: ["warning", "error"] },
      },
    });
  }

  return preferences;
}

/**
 * Deliver notification based on channel
 */
async function deliverNotification(notificationId: string) {
  try {
    const notification =
      await Notification.findById(notificationId).populate("userId");

    if (!notification) return;

    const user = notification.userId as any;

    switch (notification.channel) {
      case "email":
        await deliverEmail(notification, user);
        break;
      case "sms":
        await deliverSMS(notification, user);
        break;
      case "push":
        await deliverPush(notification, user);
        break;
      case "whatsapp":
        await deliverWhatsApp(notification, user);
        break;
      case "in_app":
        // In-app notifications are already stored in database
        notification.status = "delivered";
        notification.sentAt = new Date();
        break;
      default:
        break;
    }

    // notification.status = "sent";
    // notification.sentAt = new Date();

    await notification.save();
    logger.info(`Notification delivered: ${notificationId}`);
  } catch (error) {
    logger.error(`Failed to deliver notification: ${notificationId}`, error);

    await Notification.findByIdAndUpdate(notificationId, {
      status: "failed",
    });
  }
}

/**
 * Deliver email notification
 */
function deliverEmail(notification: INotification, user: IUser) {
  try {
    // 			await this.emailTransporter.sendMail({
    // 				from: env.EMAIL_USER,
    // 				to: user.email,
    // 				subject: notification.title,
    // 				html: `
    //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //             <h2>${notification.title}</h2>
    //             <p>${notification.message}</p>
    //             ${notification.data ? `<pre>${JSON.stringify(notification.data, null, 2)}</pre>` : ""}
    //           </div>
    //         `,
    // 			});

    logger.info("Email notification sent", {
      notificationId: notification._id,
      email: user.contact.email,
    });

    // In production, integrate with email service
    logger.info(`Sending email notification to ${user.contact.email}`, {
      title: notification.title,
      message: notification.message,
    });

    notification.status = "sent";
    notification.sentAt = new Date();
  } catch (error) {
    logger.error("Failed to send email notification", error);
    throw error;
  }
}

/**
 * Deliver SMS notification
 */
function deliverSMS(notification: any, user: any) {
  // In production, integrate with SMS service (Twilio, etc.)
  logger.info(`Sending SMS notification to ${user.phone}`, {
    message: notification.message,
  });

  notification.status = "sent";
  notification.sentAt = new Date();
}

/**
 * Deliver push notification
 */
async function deliverPush(notification: any, user: any) {
  try {
    const { pushNotificationService } = await import(
      "./push-notification.service"
    );

    const result = await pushNotificationService.sendToUser(
      user._id.toString(),
      {
        title: notification.title,
        body: notification.message,
        data: notification.data
          ? Object.fromEntries(
              Object.entries(notification.data).map(([k, v]) => [k, String(v)])
            )
          : undefined,
      }
    );

    if (result.successCount > 0) {
      notification.status = "sent";
      notification.sentAt = new Date();
      logger.info(`Push notification sent to user ${user._id}`, {
        title: notification.title,
        successCount: result.successCount,
      });
    } else {
      notification.status = "failed";
      logger.warn(`Push notification failed for user ${user._id}`, {
        title: notification.title,
        failureCount: result.failureCount,
      });
    }
  } catch (error) {
    logger.error("Failed to send push notification:", error);
    notification.status = "failed";
  }
}

/**
 * Deliver WhatsApp notification
 */
async function deliverWhatsApp(notification: any, user: any) {
  try {
    // Import WhatsApp service dynamically to avoid circular dependencies
    const { whatsappService } = await import("./whatsapp.service");

    await whatsappService.sendMessage({
      to: user.phone,
      message: notification.message,
      title: notification.title,
      data: notification.data,
    });

    logger.info("WhatsApp notification sent", {
      notificationId: notification._id,
      phone: user.phone,
    });

    notification.status = "sent";
    notification.sentAt = new Date();
  } catch (error) {
    logger.error("Failed to send WhatsApp notification", error);
    notification.status = "failed";
  }
}

// Start scheduled notification processor
setInterval(() => {
  // notificationService.processScheduledNotifications();
}, 60_000); // Process every minute
