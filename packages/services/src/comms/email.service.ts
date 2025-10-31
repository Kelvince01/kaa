import { Email } from "@kaa/models";
import type {
  EmailDeliveryStatus,
  IEmail,
  IEmailWebhookPayload,
  QueryEmails,
  SendBulkEmail,
  SendBulkEmailWithTemplate,
  SendEmail,
  SendEmailWithTemplate,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type { FilterQuery } from "mongoose";
import { emailQueue } from "../queues/email.queue";

class EmailService {
  async sendEmail(email: SendEmail) {
    const recipients = Array.isArray(email.to) ? email.to : [email.to];

    // Convert recipients to email addresses
    const toEmails = recipients
      .map((recipient) =>
        typeof recipient === "string" ? recipient : (recipient as any).email
      )
      .filter((email) => email && this.validateEmail(email));

    if (toEmails.length === 0) {
      throw new Error("No valid email recipients found");
    }

    return await emailQueue.add("sendEmail", {
      ...email,
      to: toEmails,
      status: "queued",
      priority: email.priority || "normal",
      settings: email.settings || {
        enableDeliveryReports: true,
        maxRetries: 3,
        retryInterval: 5,
        provider: "resend",
      },
    });
  }

  async sendEmailWithTemplate(
    email: Omit<SendEmailWithTemplate, "subject" | "content">
  ) {
    return await emailQueue.add("sendEmailWithTemplate", email);
  }

  async sendBulkEmail(email: SendBulkEmail) {
    return await emailQueue.add("sendBulkEmail", email);
  }

  async sendBulkEmailWithTemplate(email: SendBulkEmailWithTemplate) {
    return await emailQueue.add("sendBulkEmailWithTemplate", email);
  }

  async getEmail(emailId: string) {
    const email = await Email.findById(emailId);
    return email;
  }

  async getEmails(query: QueryEmails) {
    const {
      page: pageQuery,
      limit: limitQuery,
      recipients,
      templateId,
      data,
      metadata,
      subject,
      content,
      startDate,
      endDate,
      status,
    } = query;

    const limit = limitQuery || 20;
    const page = pageQuery || 1;

    const dbQuery: FilterQuery<IEmail> = {
      // "context.orgId": orgId,
      $or: [{ to: { $in: recipients } }],
    };

    if (status) dbQuery.status = status;
    if (templateId) dbQuery.templateId = { $in: templateId };
    if (data) dbQuery.data = { $in: data };
    if (metadata) dbQuery.metadata = { $in: metadata };
    if (subject) dbQuery.content.subject = { $in: subject };
    if (content) dbQuery.content.body = { $in: content };

    if (startDate || endDate) {
      dbQuery.createdAt = {};
      if (startDate) dbQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dbQuery.createdAt.$lte = new Date(endDate);
    }

    const emails = await Email.find(dbQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Email.countDocuments(dbQuery);

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };

    return {
      emails,
      pagination,
    };
  }

  async updateEmail(emailId: string, email: IEmail) {
    return await Email.findByIdAndUpdate(emailId, email, { new: true });
  }

  async getStatus(_messageId: string): Promise<EmailDeliveryStatus> {
    // Resend doesn't provide real-time status checking
    // Status is typically updated via webhooks
    return await Promise.resolve({
      delivered: 0,
      failed: 0,
      pending: 0,
      total: 0,
      lastUpdated: new Date(),
    });
  }

  async processWebhook(payload: IEmailWebhookPayload): Promise<void> {
    const email = await Email.findById(payload.emailId);
    if (!email) {
      logger.warn(`Email not found: ${payload.emailId}`);
      return;
    }

    try {
      // Process different webhook types
      switch (payload.type) {
        case "delivery":
          // Email delivered
          logger.info(`Email delivered: ${payload.emailId}`);
          email.markAsDelivered();
          break;
        case "bounce":
          // Email bounced
          logger.warn(`Email bounced: ${payload.emailId}`, payload.error);
          email.markAsBounced(
            payload.error?.code as any,
            payload.error?.message || "Unknown error"
          );
          break;
        case "complaint":
          // Spam complaint
          logger.warn(`Spam complaint: ${payload.emailId}`);
          // email.markAsSpam();
          break;
        case "open":
          // Email opened
          logger.info(`Email opened: ${payload.emailId}`);
          email.markAsOpened();
          break;
        case "click":
          // Link clicked
          logger.info(`Email link clicked: ${payload.emailId}`);
          email.markAsClicked();
          break;
        default:
          logger.warn(`Unknown webhook type: ${payload.type}`);
      }

      // Here you would typically update the communication record in the database
      // For now, we'll just log the event
      return await Promise.resolve();
    } catch (error) {
      logger.error("Failed to process email webhook:", error);
    }
  }

  async getUsage?(_startDate: Date, _endDate: Date): Promise<any> {
    // Resend doesn't provide usage checking via API
    // This would need to be checked via the dashboard
    return await Promise.resolve({
      total: 0,
      sent: 0,
      delivered: 0,
    });
  }

  /**
   * Utility method to validate email addresses
   */
  protected validateEmail(email: string): boolean {
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Utility method to chunk array for bulk operations
   */
  protected chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export const emailService = new EmailService();
