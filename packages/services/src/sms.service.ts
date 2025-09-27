import config from "@kaa/config/api";
import {
  SmsDeliveryReport,
  SmsMessage as SmsMessageModel,
  Template,
} from "@kaa/models";
import type {
  CommWebhookPayload,
  DeliveryStatus,
  ISmsMessage,
  ISmsRecipient,
  ITemplate,
  SendResult,
  SmsPriority,
  SmsProvider,
  SmsServiceResponse,
  SmsType,
} from "@kaa/models/types";
import { genRandom6DigitString, logger } from "@kaa/utils";
import AfricasTalking from "africastalking";
import { DateTime } from "luxon";
import { TemplateEngine } from "./engines/template.engine";
import { smsQueue } from "./queues/sms.queue";

const africasTalking = (apiKey: string, username: string) =>
  AfricasTalking({
    apiKey,
    username,
  });

type KeyOptions = {
  apiKey: string;
  username: string;
  app_name: string;
  shortcode: string;
};

type SMSMessageData = {
  Message: string;
  Recipients: {
    statusCode: number;
    number: string;
    status: "fulfilled" | "failed";
    cost: string;
    messageId: string;
  };
};

type SmsData = {
  to: string | string[];
  message: string;
  from?: string;
};

class SmsService {
  keyOptions: KeyOptions;
  private readonly defaultProvider: SmsProvider = "africastalking";

  constructor() {
    this.keyOptions = {
      apiKey: config.africasTalking.apiKey,
      username: config.africasTalking.username,
      app_name: config.africasTalking.appName,
      shortcode: config.africasTalking.shortCode,
    };
  }

  /**
   * Send SMS using template
   */
  async sendSmsWithTemplate(options: {
    to: string | string[] | ISmsRecipient[];
    templateId?: string;
    template?: ITemplate;
    data: Record<string, any>;
    type: SmsType;
    priority?: SmsPriority;
    context?: any;
    settings?: any;
    scheduledAt?: Date;
  }): Promise<SmsServiceResponse> {
    try {
      const {
        to,
        templateId,
        template: inlineTemplate,
        data,
        type,
        priority = "normal",
        context,
        settings,
        scheduledAt,
      } = options;

      // Get template from database if templateId provided
      let template = inlineTemplate;
      if (templateId && !template) {
        const templateDoc = await Template.findById(templateId);
        if (!templateDoc) {
          throw new Error(`Template with ID ${templateId} not found`);
        }
        template = templateDoc.toObject();
        await templateDoc.incrementUsage();
      }

      if (!template) {
        throw new Error("Either templateId or template must be provided");
      }

      // Render template
      const renderResult = await TemplateEngine.render({
        template: {
          name: template.name,
          description: template.description,
          category: "sms",
          type: template.category,
          content: template.content,
          variables: template.variables.map((v) => ({
            ...v,
            type: v.type as any,
          })),
          engine: "handlebars",
          format: "sms",
          version: 1,
          isActive: template.isActive,
          tags: template.tags,
          metadata: {},
        } as any,
        data,
        options: {
          format: "sms",
          maxLength: template.maxLength,
        },
      });

      // Create SMS message record
      const smsMessage = new SmsMessageModel({
        to,
        message: renderResult.content,
        template: {
          templateId,
          template: inlineTemplate,
          data,
          options: {
            maxLength: template.maxLength,
          },
        },
        type,
        priority,
        status: scheduledAt ? "pending" : "queued",
        scheduledAt,
        context,
        settings: {
          enableDeliveryReports: true,
          maxRetries: 3,
          retryInterval: 5,
          provider: this.defaultProvider,
          ...settings,
        },
        segments: this.calculateSegments(
          renderResult.content,
          template.encoding
        ),
        encoding: template.encoding,
      });

      const savedMessage = await smsMessage.save();

      // Queue for sending if not scheduled
      if (!scheduledAt) {
        await this.queueSms(savedMessage._id.toString());
      }

      return {
        success: true,
        messageId: savedMessage._id.toString(),
        segments: savedMessage.segments,
      };
    } catch (error) {
      logger.error("Failed to send SMS with template:", error);
      return {
        success: false,
        error: {
          code: "TEMPLATE_RENDER_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Send raw SMS message
   */
  async sendSms(options: {
    to: string | string[] | ISmsRecipient[];
    message: string;
    type: SmsType;
    priority?: SmsPriority;
    context?: any;
    settings?: any;
    scheduledAt?: Date;
  }): Promise<SmsServiceResponse> {
    try {
      const {
        to,
        message,
        type,
        priority = "normal",
        context,
        settings,
        scheduledAt,
      } = options;

      const recipients = Array.isArray(to) ? to : [to];

      // Convert recipients to phone numbers
      const phoneNumbers = recipients
        .map((recipient) =>
          typeof recipient === "string" ? recipient : recipient.phoneNumber
        )
        .filter((phone) => phone)
        .map((phone) => this.normalizePhoneNumber(phone as string));

      if (phoneNumbers.length === 0) {
        throw new Error("No valid phone number recipients found");
      }

      // Create SMS message record
      const smsMessage = new SmsMessageModel({
        to: phoneNumbers,
        message,
        type,
        priority,
        status: scheduledAt ? "pending" : "queued",
        scheduledAt,
        context,
        settings: {
          enableDeliveryReports: true,
          maxRetries: 3,
          retryInterval: 5,
          provider: this.defaultProvider,
          ...settings,
        },
        segments: this.calculateSegments(message),
        encoding: "GSM_7BIT",
      });

      const savedMessage = await smsMessage.save();

      // Queue for sending if not scheduled
      if (!scheduledAt) {
        await this.queueSms(savedMessage._id.toString());
      }

      return {
        success: true,
        messageId: savedMessage._id.toString(),
        segments: savedMessage.segments,
      };
    } catch (error) {
      logger.error("Failed to send SMS:", error);
      return {
        success: false,
        error: {
          code: "SMS_SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Send SMS immediately via provider (internal use)
   */
  async sendSMSImmediate({
    to,
    message,
    from,
  }: SmsData): Promise<SMSMessageData> {
    try {
      const response = await africasTalking(
        this.keyOptions.apiKey,
        this.keyOptions.username
      ).SMS.send({
        to,
        from: from ? from : this.keyOptions.shortcode,
        message,
      });

      if (response.Recipients.status !== "fulfilled") {
        throw new Error(
          `Failed to send SMS: ${response.Recipients.statusCode}`
        );
      }

      logger.info(`SMS sent successfully to ${to}`);

      return response;
    } catch (error) {
      logger.error("Error sending SMS:", error);
      throw new Error("Failed to send SMS");
    }
  }

  async sendBulk(smsMessages: ISmsMessage[]): Promise<SendResult[]> {
    // Africa's Talking supports bulk sending
    const results: SendResult[] = [];

    // Group communications by similar content for efficiency
    const contentGroups = new Map<string, ISmsMessage[]>();

    for (const smsMessage of smsMessages) {
      const key = smsMessage.message || "";
      if (!contentGroups.has(key)) {
        contentGroups.set(key, []);
      }
      contentGroups.get(key)?.push(smsMessage);
    }

    for (const [content, groupSmsMessages] of contentGroups) {
      try {
        // Combine all recipients for this content
        const allRecipients: string[] = [];
        for (const smsMessage of groupSmsMessages) {
          const recipients = Array.isArray(smsMessage.to)
            ? smsMessage.to
            : [smsMessage.to];

          const phones = recipients
            .map((recipient: any) =>
              typeof recipient === "string" ? recipient : recipient.phoneNumber
            )
            .filter((phone) => phone)
            .map((phone) => this.normalizePhoneNumber(phone as string));

          allRecipients.push(...phones);
        }

        // Send bulk SMS
        const smsData = {
          to: allRecipients,
          message: content,
          from: this.keyOptions.shortcode || "",
        };

        const response = await africasTalking(
          this.keyOptions.apiKey,
          this.keyOptions.username
        ).SMS.send(smsData);

        // Process results for each recipient
        const recipients = [response.Recipients];
        for (const recipient of recipients) {
          const result: SendResult = {
            success: recipient.status === "fulfilled",
            providerMessageId: recipient.messageId,
            cost: Number.parseFloat(recipient.cost || "0"),
            segments: this.calculateSegments(content),
            metadata: {
              // networkCode: recipient.networkCode,
            },
          };

          if (!result.success) {
            result.error = {
              code: "SMS_SEND_ERROR",
              message: recipient.status || "Send failed",
            };
          }

          results.push(result);
        }
      } catch (error) {
        logger.error("Failed to send bulk SMS via Africa's Talking:", error);

        // Mark all in this group as failed
        for (const smsMessage of groupSmsMessages) {
          const recipients = Array.isArray(smsMessage.to)
            ? smsMessage.to
            : [smsMessage.to];

          const phoneCount = recipients.filter((recipient: any) =>
            typeof recipient === "string" ? recipient : recipient.phoneNumber
          ).length;

          for (let i = 0; i < phoneCount; i++) {
            results.push({
              success: false,
              error: {
                code: "SMS_SEND_ERROR",
                message:
                  error instanceof Error ? error.message : "Unknown error",
              },
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Process SMS from queue
   */
  async processSmsMessage(messageId: string): Promise<void> {
    try {
      const message = await SmsMessageModel.findById(messageId);
      if (!message) {
        throw new Error(`SMS message ${messageId} not found`);
      }

      if (message.status !== "queued" && message.status !== "pending") {
        logger.warn(
          `SMS message ${messageId} already processed with status: ${message.status}`
        );
        return;
      }

      // Update status to sending
      message.status = "sending";
      message.sentAt = new Date();
      await message.save();

      // Prepare recipients
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const phoneNumbers = recipients.map((recipient) =>
        typeof recipient === "string" ? recipient : recipient.phoneNumber
      );

      // Send via provider
      const response = await this.sendSMSImmediate({
        to: phoneNumbers,
        // biome-ignore lint/style/noNonNullAssertion: message is required
        message: message.message!,
        from: message.from,
      });

      // Update message with provider response
      message.status = "sent";
      message.messageId = response.Recipients.messageId;
      message.cost = response.Recipients.cost;
      message.deliveryStatus = {
        delivered: 0,
        failed: 0,
        pending: phoneNumbers.length,
        total: phoneNumbers.length,
        lastUpdated: new Date(),
      };

      await message.save();

      logger.info(`SMS message ${messageId} sent successfully`);
    } catch (error) {
      logger.error(`Failed to process SMS message ${messageId}:`, error);

      // Update message with error
      await SmsMessageModel.findByIdAndUpdate(messageId, {
        status: "failed",
        error: {
          code: "SEND_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          provider: this.defaultProvider,
          retryCount: 0,
          lastRetryAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Queue SMS for sending
   */
  private async queueSms(messageId: string, delay = 0): Promise<void> {
    await smsQueue.add(
      "sendSms",
      { messageId },
      {
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );
  }

  /**
   * Calculate SMS segments based on message length and encoding
   */
  private calculateSegments(
    message: string,
    encoding: "GSM_7BIT" | "UCS2" = "GSM_7BIT"
  ): number {
    const maxLength = encoding === "GSM_7BIT" ? 160 : 70;
    const concatenatedLength = encoding === "GSM_7BIT" ? 153 : 67;

    if (message.length <= maxLength) {
      return 1;
    }

    return Math.ceil(message.length / concatenatedLength);
  }

  /**
   * Utility method to normalize phone numbers
   */
  protected normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters except +
    let normalized = phoneNumber.replace(/[^\d+]/g, "");

    // Ensure it starts with +
    if (!normalized.startsWith("+")) {
      // Assume Kenyan numbers if no country code
      if (normalized.startsWith("0")) {
        normalized = `+254${normalized.substring(1)}`;
      } else {
        normalized = `+${normalized}`;
      }
    }

    return normalized;
  }

  /**
   * Update delivery status from webhook
   */
  async updateDeliveryStatus(data: {
    messageId: string;
    phoneNumber: string;
    status: string;
    errorCode?: string;
    errorMessage?: string;
    cost?: string;
    networkCode?: string;
  }): Promise<void> {
    try {
      const {
        messageId,
        phoneNumber,
        status,
        errorCode,
        errorMessage,
        cost,
        networkCode,
      } = data;

      // Create delivery report
      const deliveryReport = new SmsDeliveryReport({
        messageId,
        providerMessageId: messageId,
        phoneNumber,
        status: this.mapProviderStatus(status),
        cost,
        networkCode,
        errorCode,
        errorMessage,
        deliveredAt: status === "delivered" ? new Date() : undefined,
      });

      await deliveryReport.save();

      // Update message delivery status
      const message = await SmsMessageModel.findOne({ messageId });
      if (message?.deliveryStatus) {
        const deliveryStatus = message.deliveryStatus;

        if (status === "delivered") {
          deliveryStatus.delivered += 1;
          deliveryStatus.pending -= 1;
          message.deliveredAt = new Date();
        } else if (status === "failed") {
          deliveryStatus.failed += 1;
          deliveryStatus.pending -= 1;
        }

        deliveryStatus.lastUpdated = new Date();

        // Update overall message status
        if (deliveryStatus.pending === 0) {
          message.status = deliveryStatus.failed > 0 ? "failed" : "delivered";
        }

        await message.save();
      }

      logger.info(
        `Updated delivery status for message ${messageId}, phone ${phoneNumber}: ${status}`
      );
    } catch (error) {
      logger.error("Failed to update delivery status:", error);
    }
  }

  /**
   * Map provider-specific status to our standard status
   */
  private mapProviderStatus(providerStatus: string): any {
    const statusMap: Record<string, any> = {
      Success: "delivered",
      Sent: "sent",
      Failed: "failed",
      Rejected: "failed",
      Expired: "expired",
    };

    return statusMap[providerStatus] || "failed";
  }

  /**
   * Get SMS analytics
   */
  async getAnalytics(orgId: string, startDate: Date, endDate: Date) {
    try {
      const pipeline = [
        {
          $match: {
            "context.orgId": orgId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSent: { $sum: 1 },
            totalDelivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            totalFailed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            totalCost: { $sum: { $toDouble: { $ifNull: ["$cost", "0"] } } },
            byType: {
              $push: {
                type: "$type",
                status: "$status",
                cost: { $toDouble: { $ifNull: ["$cost", "0"] } },
              },
            },
          },
        },
      ];

      const results = await SmsMessageModel.aggregate(pipeline);
      const data = results[0] || {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalCost: 0,
        byType: [],
      };

      const deliveryRate =
        data.totalSent > 0 ? (data.totalDelivered / data.totalSent) * 100 : 0;
      const failureRate =
        data.totalSent > 0 ? (data.totalFailed / data.totalSent) * 100 : 0;

      return {
        totals: {
          sent: data.totalSent,
          delivered: data.totalDelivered,
          failed: data.totalFailed,
          cost: data.totalCost,
        },
        deliveryRate,
        failureRate,
        averageCostPerSms:
          data.totalSent > 0 ? data.totalCost / data.totalSent : 0,
      };
    } catch (error) {
      logger.error("Failed to get SMS analytics:", error);
      throw error;
    }
  }

  getStatus(_messageId: string): Promise<DeliveryStatus> {
    // Africa's Talking doesn't provide real-time status checking
    // Status is typically updated via webhooks
    return Promise.resolve({
      delivered: 0,
      failed: 0,
      pending: 0,
      total: 0,
      lastUpdated: new Date(),
    });
  }

  async processWebhook(payload: CommWebhookPayload): Promise<void> {
    try {
      // Africa's Talking sends delivery reports via webhook
      if (payload.type === "delivery") {
        logger.info(
          `SMS delivery status: ${payload.communicationId} - ${payload.status}`
        );

        // Here you would update the communication record in the database
        // For now, we'll just log the event
      } else {
        logger.warn(`Unknown SMS webhook type: ${payload.type}`);
      }
      return await Promise.resolve();
    } catch (error) {
      logger.error("Failed to process SMS webhook:", error);
    }
  }

  async getBalance?(): Promise<number> {
    // Africa's Talking doesn't provide balance checking via API
    // This would need to be checked via the dashboard
    return await Promise.resolve(0);
  }
}

export const smsService = new SmsService();

export class SmsServiceFactory {
  /**
   * Send welcome SMS using template
   */
  async sendWelcome({
    phoneNumber,
    firstName,
    context,
  }: {
    phoneNumber: string;
    firstName: string;
    context?: any;
  }) {
    return smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("welcome"),
      data: {
        firstName,
        appName: "Kaa",
        appUrl: "https://app.kaa.com",
      },
      type: "notification",
      context,
    });
  }

  /**
   * Send MFA SMS with template
   */
  sendSmsMfa = async (phoneNumber: string, context?: any) => {
    const mfaCode = genRandom6DigitString();

    const result = await smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("mfa-verification"),
      data: {
        mfaCode,
        appName: "Kaa",
      },
      type: "verification",
      priority: "high",
      context,
    });

    return result.success ? mfaCode : null;
  };

  /**
   * Send payment reminder using template
   */
  async sendPaymentReminder({
    phoneNumber,
    tenantName,
    amount,
    dueDate,
    unitNumber,
    paymentLink,
    context,
  }: {
    phoneNumber: string;
    tenantName: string;
    amount: number;
    dueDate: string;
    unitNumber: string;
    paymentLink: string;
    context?: any;
  }) {
    return smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("payment-reminder"),
      data: {
        tenantName,
        amount,
        dueDate: DateTime.fromISO(dueDate).toLocaleString(DateTime.DATE_FULL),
        unitNumber,
        paymentLink,
      },
      type: "reminder",
      priority: "high",
      context,
    });
  }

  /**
   * Send payment confirmation using template
   */
  async sendPaymentConfirmation({
    phoneNumber,
    tenantName,
    amount,
    receiptNumber,
    unitNumber,
    context,
  }: {
    phoneNumber: string;
    tenantName: string;
    amount: number;
    receiptNumber: string;
    unitNumber: string;
    context?: any;
  }) {
    return smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("payment-confirmation"),
      data: {
        tenantName,
        amount,
        receiptNumber,
        unitNumber,
      },
      type: "notification",
      context,
    });
  }

  /**
   * Send payment overdue using template
   */
  async sendPaymentOverdue({
    phoneNumber,
    tenantName,
    amount,
    daysOverdue,
    unitNumber,
    paymentLink,
    context,
  }: {
    phoneNumber: string;
    tenantName: string;
    amount: number;
    daysOverdue: number;
    unitNumber: string;
    paymentLink: string;
    context?: any;
  }) {
    return smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("payment-overdue"),
      data: {
        tenantName,
        amount,
        daysOverdue,
        unitNumber,
        paymentLink,
      },
      type: "alert",
      priority: "urgent",
      context,
    });
  }

  /**
   * Send maintenance update using template
   */
  async sendMaintenanceUpdate({
    phoneNumber,
    tenantName,
    unitNumber,
    status,
    description,
    context,
  }: {
    phoneNumber: string;
    tenantName: string;
    unitNumber: string;
    status: string;
    description: string;
    context?: any;
  }) {
    return smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("maintenance-update"),
      data: {
        tenantName,
        unitNumber,
        status,
        description,
      },
      type: "notification",
      context,
    });
  }

  /**
   * Send bulk SMS using template
   */
  async sendBulkSms({
    recipients,
    templateId,
    templateData,
    type,
    priority = "normal",
    context,
  }: {
    recipients: ISmsRecipient[];
    templateId: string;
    templateData: Record<string, any>;
    type: SmsType;
    priority?: SmsPriority;
    context?: any;
  }) {
    // For bulk SMS, we'll create individual messages for each recipient
    // In production, you might want to use a dedicated bulk SMS service
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        smsService.sendSmsWithTemplate({
          to: [recipient],
          templateId,
          data: {
            ...templateData,
            // Merge recipient-specific data
            ...recipient.metadata,
          },
          type,
          priority,
          context,
        })
      )
    );

    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    return {
      success: failed === 0,
      totalMessages: results.length,
      successfulMessages: successful,
      failedMessages: failed,
      results,
    };
  }

  /**
   * Get template ID by name (with caching)
   */
  private async getTemplateIdByName(name: string): Promise<string | undefined> {
    try {
      const template = await Template.findOne({ name, isActive: true });
      return template?._id?.toString();
    } catch (error) {
      logger.error(`Failed to get template ID for ${name}:`, error);
      // biome-ignore lint/nursery/noUselessUndefined: return undefined
      return undefined;
    }
  }

  /**
   * Create default SMS templates if they don't exist
   */
  async createDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      {
        name: "welcome",
        description: "Welcome message for new users",
        category: "welcome" as const,
        content:
          "Hi {{firstName}}, Welcome to {{appName}}! Thank you for joining our platform. Login to your account to explore properties and manage your rentals.",
        variables: [
          {
            name: "firstName",
            type: "string" as const,
            required: true,
            description: "User first name",
          },
          {
            name: "appName",
            type: "string" as const,
            required: false,
            defaultValue: "Kaa",
            description: "Application name",
          },
          {
            name: "appUrl",
            type: "string" as const,
            required: false,
            defaultValue: "https://app.kaa.com",
            description: "Application URL",
          },
        ],
        maxLength: 160,
        encoding: "GSM_7BIT" as const,
        tags: ["welcome", "onboarding"],
      },
      {
        name: "mfa-verification",
        description: "MFA verification code message",
        category: "verification" as const,
        content:
          "Your {{appName}} verification code is: {{mfaCode}}. This code expires in 5 minutes.",
        variables: [
          {
            name: "mfaCode",
            type: "string" as const,
            required: true,
            description: "MFA verification code",
          },
          {
            name: "appName",
            type: "string" as const,
            required: false,
            defaultValue: "Kaa",
            description: "Application name",
          },
        ],
        maxLength: 160,
        encoding: "GSM_7BIT" as const,
        tags: ["mfa", "verification", "security"],
      },
      {
        name: "payment-reminder",
        description: "Payment reminder message",
        category: "payment" as const,
        content:
          "Hi {{tenantName}}, your rent payment of {{formatCurrency amount}} for unit {{unitNumber}} is due on {{dueDate}}. Pay now: {{paymentLink}}",
        variables: [
          {
            name: "tenantName",
            type: "string" as const,
            required: true,
            description: "Tenant name",
          },
          {
            name: "amount",
            type: "number" as const,
            required: true,
            description: "Payment amount",
          },
          {
            name: "unitNumber",
            type: "string" as const,
            required: true,
            description: "Unit number",
          },
          {
            name: "dueDate",
            type: "string" as const,
            required: true,
            description: "Payment due date",
          },
          {
            name: "paymentLink",
            type: "string" as const,
            required: true,
            description: "Payment link",
          },
        ],
        maxLength: 320,
        encoding: "GSM_7BIT" as const,
        tags: ["payment", "reminder"],
      },
      {
        name: "payment-confirmation",
        description: "Payment confirmation message",
        category: "payment" as const,
        content:
          "Hi {{tenantName}}, we've received your payment of {{formatCurrency amount}} for unit {{unitNumber}}. Receipt number: {{receiptNumber}}. Thank you!",
        variables: [
          {
            name: "tenantName",
            type: "string" as const,
            required: true,
            description: "Tenant name",
          },
          {
            name: "amount",
            type: "number" as const,
            required: true,
            description: "Payment amount",
          },
          {
            name: "unitNumber",
            type: "string" as const,
            required: true,
            description: "Unit number",
          },
          {
            name: "receiptNumber",
            type: "string" as const,
            required: true,
            description: "Receipt number",
          },
        ],
        maxLength: 160,
        encoding: "GSM_7BIT" as const,
        tags: ["payment", "confirmation"],
      },
      {
        name: "payment-overdue",
        description: "Payment overdue alert message",
        category: "payment" as const,
        content:
          "URGENT: Hi {{tenantName}}, your rent payment of {{formatCurrency amount}} for unit {{unitNumber}} is {{daysOverdue}} days overdue. Please pay now: {{paymentLink}}",
        variables: [
          {
            name: "tenantName",
            type: "string" as const,
            required: true,
            description: "Tenant name",
          },
          {
            name: "amount",
            type: "number" as const,
            required: true,
            description: "Payment amount",
          },
          {
            name: "unitNumber",
            type: "string" as const,
            required: true,
            description: "Unit number",
          },
          {
            name: "daysOverdue",
            type: "number" as const,
            required: true,
            description: "Days overdue",
          },
          {
            name: "paymentLink",
            type: "string" as const,
            required: true,
            description: "Payment link",
          },
        ],
        maxLength: 320,
        encoding: "GSM_7BIT" as const,
        tags: ["payment", "overdue", "urgent"],
      },
      {
        name: "maintenance-update",
        description: "Maintenance request update message",
        category: "maintenance" as const,
        content:
          "Hi {{tenantName}}, maintenance update for unit {{unitNumber}}: {{status}}. {{description}}",
        variables: [
          {
            name: "tenantName",
            type: "string" as const,
            required: true,
            description: "Tenant name",
          },
          {
            name: "unitNumber",
            type: "string" as const,
            required: true,
            description: "Unit number",
          },
          {
            name: "status",
            type: "string" as const,
            required: true,
            description: "Maintenance status",
          },
          {
            name: "description",
            type: "string" as const,
            required: false,
            defaultValue: "",
            description: "Update description",
          },
        ],
        maxLength: 160,
        encoding: "GSM_7BIT" as const,
        tags: ["maintenance", "update"],
      },
    ];

    for (const templateData of defaultTemplates) {
      try {
        const existingTemplate = await Template.findOne({
          name: templateData.name,
        });
        if (!existingTemplate) {
          const template = new Template(templateData);
          await template.save();
          logger.info(`Created default SMS template: ${templateData.name}`);
        }
      } catch (error) {
        logger.error(`Failed to create template ${templateData.name}:`, error);
      }
    }
  }
}

export const smsServiceFactory = new SmsServiceFactory();

/*
const capabilities: ProviderCapabilities = {
      supportsBulk: true,
      supportsScheduling: true,
      supportsTracking: true,
      supportsAttachments: type === "email",
      maxRecipientsPerMessage:
        type === "email" ? 50 : type === "sms" ? 1000 : 100,
      maxMessageSize: type === "email" ? 10 * 1024 * 1024 : 160,
      supportedFormats:
        type === "email"
          ? ["html", "text"]
          : type === "sms"
            ? ["text", "sms"]
            : ["json"],
      costPerMessage: 0, // Free for testing
      features: {
        deliveryReports: true,
        bounceReports: type === "email",
        openTracking: type === "email",
        clickTracking: type === "email",
        unsubscribeLinks: type === "email",
      },
    };
    */
