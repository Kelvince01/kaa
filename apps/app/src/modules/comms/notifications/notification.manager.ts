import { httpClient } from "@/lib/axios";
import { NotificationPushService } from "./notification-push.service";

type NotificationChannel = "email" | "sms" | "push" | "whatsapp" | "telegram";
type NotificationType =
  | "payment_due"
  | "payment_received"
  | "payment_overdue"
  | "maintenance_request"
  | "lease_expiring"
  | "announcement";

type NotificationPreferences = {
  channels: {
    [key in NotificationChannel]: {
      enabled: boolean;
      priority: "high" | "normal" | "low";
    };
  };
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
};

export class NotificationManager {
  private static instance: NotificationManager;
  private preferences: NotificationPreferences | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async initialize() {
    // Load user preferences from the server
    const response = await httpClient.api.get("/notifications/preferences");
    this.preferences = response.data;

    // Initialize push notifications if enabled
    if (this.preferences?.channels.push.enabled) {
      await NotificationPushService.requestPermission();
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    try {
      const response = await httpClient.api.put(
        "/notifications/preferences",
        preferences
      );

      if (!response.data) throw new Error("Failed to update preferences");

      this.preferences = response.data;
      return true;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      return false;
    }
  }

  async sendNotification(
    type: NotificationType,
    data: {
      title: string;
      body: string;
      url?: string;
      recipients: {
        userId: string;
        email?: string;
        phone?: string;
        whatsapp?: string;
        telegram?: string;
      }[];
    }
  ) {
    if (!this.preferences) return false;

    const notificationConfig = this.preferences.types[type];
    if (!notificationConfig?.enabled) return false;

    const channels = notificationConfig.channels.filter(
      (channel) => this.preferences?.channels[channel].enabled
    );

    const promises = channels.map((channel) =>
      this.sendToChannel(channel, type, data)
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error sending notifications:", error);
      return false;
    }
  }

  private async sendToChannel(
    channel: NotificationChannel,
    _type: NotificationType,
    data: any
  ) {
    const priority = this.preferences?.channels[channel].priority || "normal";

    switch (channel) {
      case "email":
        return await this.sendEmail(data, priority);
      case "sms":
        return await this.sendSMS(data, priority);
      case "push":
        return await this.sendPush(data, priority);
      case "whatsapp":
        return await this.sendWhatsApp(data, priority);
      case "telegram":
        return await this.sendTelegram(data, priority);
      default:
        throw new Error(`Unsupported notification channel: ${channel}`);
    }
  }

  private async sendEmail(data: any, priority: string) {
    const response = await httpClient.api.post("/notifications/email", {
      ...data,
      priority,
    });
    return response.data;
  }

  private async sendSMS(data: any, priority: string) {
    const response = await httpClient.api.post("/notifications/sms", {
      ...data,
      priority,
    });

    return response.data;
  }

  private async sendPush(data: any, priority: string) {
    return await NotificationPushService.sendNotification({
      ...data,
      priority,
    });
  }

  private async sendWhatsApp(data: any, priority: string) {
    const response = await httpClient.api.post("/notifications/whatsapp", {
      ...data,
      priority,
    });
    return response.data;
  }

  private async sendTelegram(data: any, priority: string) {
    const response = await httpClient.api.post("/notifications/telegram", {
      ...data,
      priority,
    });
    return response.data;
  }
}
