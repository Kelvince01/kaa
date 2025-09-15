import { User } from "@kaa/models";
import type { INotification } from "@kaa/models/types";
import emailService from "./email.service";

/**
 * Send an email notification
 */
export const sendNotificationEmail = async (
  userId: string,
  notification: INotification
): Promise<boolean> => {
  try {
    // Find user
    const user = await User.findById(userId);
    if (!user?.email) return false;

    // Skip if user has disabled email notifications
    if (user.settings?.disableEmailNotifications) return false;

    const firstName = user.firstName || "there";

    return emailService.sendEmail({
      to: user.email,
      subject: `Notification: ${notification.title}`,
      template: "notification",
      context: {
        firstName,
        notificationTitle: notification.title,
        notificationMessage: notification.message,
        notificationDate: new Date().toLocaleDateString(),
        actionUrl: notification.link || `${process.env.CLIENT_URL}/dashboard`,
        actionText: notification.linkText || "View Details",
        supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
        year: new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error("Error sending notification email:", error);
    return false;
  }
};
