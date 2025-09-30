import config from "@kaa/config/api";
import type { IIncident } from "@kaa/models/types";
import emailService from "./email.service";

type IncidentNotificationOptions = {
  recipientEmail: string;
  recipientName: string;
  incident: IIncident;
  dashboardUrl: string;
};

/**
 * Send incident notification email to stakeholders
 */
export const sendIncidentNotificationEmail = async ({
  recipientEmail,
  recipientName,
  incident,
  dashboardUrl,
}: IncidentNotificationOptions): Promise<boolean> => {
  try {
    return await emailService.sendEmail({
      to: recipientEmail,
      subject: `[${incident.status.toUpperCase()}] ${incident.title}`,
      template: "incident-notification",
      context: {
        recipientName,
        incident: {
          ...incident,
          createdAt: formatDate(incident.createdAt),
          timeline: incident.timeline?.map((update: any) => ({
            ...update,
            updatedAt: formatDate(update.updatedAt),
          })),
        },
        dashboardUrl,
        appName: config.app.name,
        appUrl: config.clientUrl,
        supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
        year: new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error("Error sending incident notification email:", error);
    return false;
  }
};

/**
 * Format date to a readable string
 */
const formatDate = (date: Date | string): string =>
  new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: true,
  });
