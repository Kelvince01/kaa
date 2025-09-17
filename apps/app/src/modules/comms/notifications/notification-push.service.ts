import { httpClient } from "@/lib/axios";

// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class NotificationPushService {
  private static readonly PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

  static async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  static async registerServiceWorker() {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        return registration;
      }
      return null;
    } catch (error) {
      console.error("Error registering service worker:", error);
      return null;
    }
  }

  static async subscribeToPushNotifications() {
    try {
      const registration =
        await NotificationPushService.registerServiceWorker();
      if (!registration) return null;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: NotificationPushService.PUBLIC_VAPID_KEY,
      });

      // Send the subscription to the server
      await httpClient.api.post("/notifications/push/subscribe", subscription);

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return null;
    }
  }

  static async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify the server
        await httpClient.api.post(
          "/notifications/push/unsubscribe",
          subscription
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  static async sendNotification(data: {
    title: string;
    body: string;
    url?: string;
    priority: string;
  }) {
    try {
      const response = await httpClient.api.post("/notifications/push", data);
      return response.status === 200;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return false;
    }
  }
}
