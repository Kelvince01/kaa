import { User } from "@kaa/models";
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from "@kaa/models/types";
import { notificationService } from "@kaa/services";
import { logger } from "@kaa/utils";
import { WhatsAppTemplates } from "./whatsapp-templates";

export type NotificationOptions = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  memberId?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  templateName?: string;
  templateVariables?: Record<string, string>;
  scheduledFor?: Date;
  expiresAt?: Date;
};

// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class NotificationUtils {
  /**
   * Send a smart notification that automatically selects the best channels
   */
  static async sendSmartNotification(
    options: NotificationOptions
  ): Promise<any> {
    try {
      // Get user preferences and determine optimal channels
      const optimalChannels = await NotificationUtils.determineOptimalChannels(
        options.userId,
        options.type,
        options.priority || NotificationPriority.MEDIUM,
        options.memberId,
        options.channels
      );

      // If WhatsApp template is specified, send via WhatsApp
      if (
        options.templateName &&
        optimalChannels.includes(NotificationChannel.WHATSAPP)
      ) {
        await NotificationUtils.sendWhatsAppTemplateNotification(
          options.userId,
          options.templateName,
          options.templateVariables || {}
        );
      }

      // Send via other channels
      const otherChannels = optimalChannels.filter(
        (ch) => ch !== NotificationChannel.WHATSAPP
      );
      if (otherChannels.length > 0) {
        return await notificationService.sendNotification(
          options.userId,
          {
            type: options.type,
            title: options.title,
            message: options.message,
            channels: otherChannels,
            data: options.data,
            scheduledFor: options.scheduledFor,
          },
          options.memberId
        );
      }

      return { success: true };
    } catch (error) {
      logger.error("Error sending smart notification:", error);
      throw error;
    }
  }

  /**
   * Send WhatsApp notification using template
   */
  static async sendWhatsAppTemplateNotification(
    userId: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<any> {
    try {
      // Get user phone number
      const user = await User.findById(userId);
      if (!user?.phone) {
        throw new Error("User phone number not found");
      }

      // Validate template
      const validation = WhatsAppTemplates.validateTemplate(
        templateName,
        variables
      );
      if (!validation.valid) {
        throw new Error(
          `Template validation failed: Missing variables: ${validation.missingVariables.join(", ")}`
        );
      }

      // Send templated message
      return await WhatsAppTemplates.sendTemplatedMessage(
        templateName,
        user.phone,
        variables
      );
    } catch (error) {
      logger.error("Error sending WhatsApp template notification:", error);
      throw error;
    }
  }

  /**
   * Determine optimal notification channels based on user preferences and urgency
   */
  static async determineOptimalChannels(
    userId: string,
    type: NotificationType,
    priority: NotificationPriority,
    memberId?: string,
    preferredChannels?: NotificationChannel[]
  ): Promise<NotificationChannel[]> {
    try {
      // Get user notification preferences
      const preferences = await notificationService.getPreferences(
        userId,
        memberId || ""
      );

      // Start with preferred channels if provided
      let channels = preferredChannels ?? [];

      // If no preferred channels, determine based on type and priority
      if (channels?.length === 0) {
        channels = [NotificationChannel.IN_APP]; // Always include in-app

        // Add email for most notifications
        if (
          preferences.preferences.email.enabled &&
          preferences.preferences.email.types.includes(type)
        ) {
          channels.push(NotificationChannel.EMAIL);
        }

        // Add SMS for urgent notifications
        if (
          (priority === NotificationPriority.HIGH ||
            type === NotificationType.SYSTEM_ALERT) &&
          preferences.preferences.sms.enabled &&
          preferences.preferences.sms.types.includes(type)
        ) {
          channels.push(NotificationChannel.SMS);
        }

        // Add WhatsApp for urgent or error notifications
        if (
          (priority === NotificationPriority.HIGH ||
            type === NotificationType.SYSTEM_ALERT ||
            type === NotificationType.SYSTEM) &&
          preferences.preferences.whatsapp?.enabled &&
          preferences.preferences.whatsapp.types.includes(type)
        ) {
          channels.push(NotificationChannel.WHATSAPP);
        }

        // Add push for most notifications
        if (
          preferences.preferences.push.enabled &&
          preferences.preferences.push.types.includes(type)
        ) {
          channels.push(NotificationChannel.PUSH);
        }
      }

      // Filter based on user preferences
      return channels?.filter((channel) => {
        const channelPrefs =
          preferences.preferences[
            channel as keyof typeof preferences.preferences
          ];
        return channelPrefs?.enabled && channelPrefs.types.includes(type);
      });
    } catch (error) {
      logger.error("Error determining optimal channels:", error);
      // Fallback to in-app only
      return [NotificationChannel.IN_APP];
    }
  }

  /**
   * Format message for specific channel
   */
  static formatMessageForChannel(
    title: string,
    message: string,
    channel: NotificationChannel,
    _data?: Record<string, any>
  ): { title: string; message: string } {
    switch (channel) {
      case NotificationChannel.WHATSAPP:
        // WhatsApp supports emojis and formatting
        return {
          title: `*${title}*`,
          message: message.replace(/\n/g, "\n"),
        };
      case NotificationChannel.SMS: {
        // SMS has character limits, keep it concise
        const smsMessage = `${title}: ${message}`;
        return {
          title,
          message:
            smsMessage.length > 160
              ? `${smsMessage.substring(0, 157)}...`
              : smsMessage,
        };
      }
      case NotificationChannel.EMAIL:
        // Email can be more detailed
        return { title, message };
      case NotificationChannel.PUSH:
        // Push notifications should be brief
        return {
          title,
          message:
            message.length > 100 ? `${message.substring(0, 97)}...` : message,
        };
      default:
        return { title, message };
    }
  }

  /**
   * Create notification data with property and user context
   */
  static async enrichNotificationData(
    userId: string,
    _propertyId?: string,
    additionalData?: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const data: Record<string, any> = {
        userId,
        timestamp: new Date(),
        ...additionalData,
      };

      // Add property context if provided
      //   if (propertyId) {
      //     const property = await Property.findById(propertyId).select(
      //       "title address landlord agent"
      //     );
      //     if (property) {
      //       data.property = {
      //         id: property._id,
      //         title: property.title,
      //         location: property.location,
      //         landlord: property.landlord,
      //         agent: property.agent,
      //       };
      //     }
      //   }

      // Add user context
      const user = await User.findById(userId).select(
        "firstName lastName email phone"
      );
      if (user) {
        data.user = {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
        };
      }

      return data;
    } catch (error) {
      logger.error("Error enriching notification data:", error);
      return additionalData || {};
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(
    userIds: string[],
    options: Omit<NotificationOptions, "userId">
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const userId of userIds) {
      try {
        await NotificationUtils.sendSmartNotification({
          ...options,
          userId,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.error(`Failed to send notification to user ${userId}:`, error);
      }
    }

    logger.info(
      `Bulk notification complete: ${success} sent, ${failed} failed`
    );
    return { success, failed, errors };
  }

  /**
   * Schedule a notification
   */
  static async scheduleNotification(
    options: NotificationOptions,
    scheduledFor: Date
  ): Promise<any> {
    return await NotificationUtils.sendSmartNotification({
      ...options,
      scheduledFor,
    });
  }

  /**
   * Send emergency notification to all relevant users
   */
  static async sendEmergencyNotification(
    propertyId: string,
    alertMessage: string,
    emergencyContact?: string
  ): Promise<any> {
    try {
      // Get property with landlord and agent info
      //   const property = await Property.findById(propertyId)
      //     .populate("landlord", "firstName lastName phone")
      //     .populate("agent", "firstName lastName phone");

      const property: any = {} as any;

      if (!property) {
        throw new Error("Property not found");
      }

      const recipients: { userId: string; name: string; phone: string }[] = [];

      // Add landlord
      if (property.landlord) {
        recipients.push({
          userId: (property.landlord as any)._id.toString(),
          name: `${(property.landlord as any).firstName} ${(property.landlord as any).lastName}`,
          phone: (property.landlord as any).phone,
        });
      }

      // Add agent if different from landlord
      if (property.agent && property.agent !== property.landlord) {
        recipients.push({
          userId: (property.agent as any)._id.toString(),
          name: `${(property.agent as any).firstName} ${(property.agent as any).lastName}`,
          phone: (property.agent as any).phone,
        });
      }

      // Send WhatsApp emergency alerts
      const whatsappResults: { success: boolean; messageId: string }[] = [];
      for (const recipient of recipients) {
        if (recipient.phone) {
          try {
            const result = await WhatsAppTemplates.sendTemplatedMessage(
              "emergency_alert",
              recipient.phone,
              {
                recipientName: recipient.name,
                alertMessage,
                propertyName: property.title,
                emergencyContact: emergencyContact || "911",
              }
            );
            whatsappResults.push(result);
          } catch (error) {
            logger.error(
              `Failed to send emergency WhatsApp to ${recipient.phone}:`,
              error
            );
          }
        }
      }

      // Send regular notifications
      const userIds = recipients.map((r) => r.userId);
      const bulkResult = await NotificationUtils.sendBulkNotifications(
        userIds,
        {
          type: NotificationType.SYSTEM_ALERT,
          title: "🚨 EMERGENCY ALERT",
          message: alertMessage,
          priority: NotificationPriority.HIGH,
          channels: [
            NotificationChannel.EMAIL,
            NotificationChannel.SMS,
            NotificationChannel.PUSH,
            NotificationChannel.IN_APP,
          ],
          data: {
            propertyId,
            alertType: "emergency",
            emergencyContact,
          },
        }
      );

      return {
        whatsappSent: whatsappResults.filter((r) => r.success).length,
        regularNotifications: bulkResult,
      };
    } catch (error) {
      logger.error("Error sending emergency notification:", error);
      throw error;
    }
  }

  /**
   * Get notification analytics
   */
  static getNotificationAnalytics(
    _userId: string,
    _memberId?: string,
    days = 30
  ): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - days * 24 * 60 * 60 * 1000
      );

      // This would typically query the notification collection for analytics
      // For now, returning a placeholder structure
      return Promise.resolve({
        period: { startDate, endDate, days },
        totalSent: 0,
        byChannel: {
          email: 0,
          sms: 0,
          whatsapp: 0,
          push: 0,
          in_app: 0,
        },
        byType: {
          info: 0,
          success: 0,
          warning: 0,
          error: 0,
        },
        deliveryRates: {
          email: 0,
          sms: 0,
          whatsapp: 0,
          push: 0,
        },
      });
    } catch (error) {
      logger.error("Error getting notification analytics:", error);
      throw error;
    }
  }
}
