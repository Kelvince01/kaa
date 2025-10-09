import config from "@kaa/config/api";
import {
  SmsAnalytics,
  SmsDeliveryReport,
  SmsMessage,
  Template,
} from "@kaa/models";
import {
  type AtIncomingMessagePayload,
  type CommWebhookPayload,
  type DeliveryStatus,
  type ISmsAnalytics,
  type ISmsMessage,
  type ISmsRecipient,
  type ITemplate,
  KenyaNetworkCode,
  type SendResult,
  SMS_CONSTANTS,
  SmsCategory,
  SmsDeliveryStatus,
  SmsError,
  type SmsFilters,
  type SmsListResponse,
  SmsPriority,
  type SmsProvider,
  type SmsResponse,
  type SmsServiceResponse,
  SmsTemplateType,
  type SmsType,
} from "@kaa/models/types";
import { genRandom6DigitString, logger } from "@kaa/utils";
import AfricasTalking from "africastalking";
import { DateTime } from "luxon";
import type { FilterQuery } from "mongoose";
import { TemplateEngine } from "../engines/template.engine";
import { smsQueue } from "../queues/sms.queue";

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
   * Get SMS by ID
   */
  async getSms(smsId: string): Promise<SmsResponse> {
    try {
      return await this.getSmsResponse(smsId);
    } catch (error) {
      throw this.handleError(error, "Failed to get SMS");
    }
  }

  /**
   * List SMS with filters
   */
  async listSms(filters: SmsFilters): Promise<SmsListResponse> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Build query
      const query: FilterQuery<ISmsMessage> = {};

      if (filters.status) {
        query.status = Array.isArray(filters.status)
          ? { $in: filters.status }
          : filters.status;
      }
      if (filters.category) {
        query.category = Array.isArray(filters.category)
          ? { $in: filters.category }
          : filters.category;
      }
      if (filters.templateType) {
        query.templateType = Array.isArray(filters.templateType)
          ? { $in: filters.templateType }
          : filters.templateType;
      }
      if (filters.networkCode) query.networkCode = filters.networkCode;
      if (filters.userId) query.userId = filters.userId;
      if (filters.propertyId) query.propertyId = filters.propertyId;
      if (filters.applicationId) query.applicationId = filters.applicationId;

      // Date filters
      if (filters.sentAfter || filters.sentBefore) {
        query.sentAt = {};
        if (filters.sentAfter) query.sentAt.$gte = filters.sentAfter;
        if (filters.sentBefore) query.sentAt.$lte = filters.sentBefore;
      }

      // Search
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Execute query
      const [smsMessages, total] = await Promise.all([
        SmsMessage.find(query)
          .sort({
            [filters.sortBy || "createdAt"]:
              filters.sortOrder === "asc" ? 1 : -1,
          })
          .skip(skip)
          .limit(limit),
        SmsMessage.countDocuments(query),
      ]);

      // Get summary
      const [totalSent, totalDelivered, totalFailed, costData] =
        await Promise.all([
          SmsMessage.countDocuments({ status: SmsDeliveryStatus.SENT }),
          SmsMessage.countDocuments({ status: SmsDeliveryStatus.DELIVERED }),
          SmsMessage.countDocuments({ status: SmsDeliveryStatus.FAILED }),
          SmsMessage.aggregate([
            { $match: { cost: { $exists: true } } },
            { $group: { _id: null, totalCost: { $sum: "$cost" } } },
          ]),
        ]);

      // Transform SMS
      const smsResponses = await Promise.all(
        smsMessages.map((sms) => this.getSmsResponse(sms._id.toString()))
      );

      return {
        smsMessages: smsResponses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary: {
          totalSent,
          totalDelivered,
          totalFailed,
          totalCost: costData[0]?.totalCost || 0,
        },
        filters,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to list SMS");
    }
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
      const smsMessage = new SmsMessage({
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
    to: ISmsRecipient[];
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

      const recipients = to;

      // Convert recipients to phone numbers
      const phoneNumbers = recipients
        .map((recipient) => recipient.phoneNumber)
        .filter((phone) => phone)
        .map((phone) => this.normalizePhoneNumber(phone));

      if (phoneNumbers.length === 0) {
        throw new Error("No valid phone number recipients found");
      }

      // Create SMS message record
      const smsMessage = new SmsMessage({
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
      const message = await SmsMessage.findById(messageId);
      if (!message) {
        throw new Error(`SMS message ${messageId} not found`);
      }

      if (message.status !== SmsDeliveryStatus.QUEUED) {
        logger.warn(
          `SMS message ${messageId} already processed with status: ${message.status}`
        );
        return;
      }

      // Update status to sending
      message.status = SmsDeliveryStatus.SENDING;
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
        message: message.message ?? "",
        from: message.from,
      });

      // Update message with provider response
      message.status = SmsDeliveryStatus.SENT;
      message.messageId = response.Recipients.messageId;
      message.cost = Number(response.Recipients.cost);
      message.deliveryStatus = {
        delivered: 0,
        failed: 0,
        pending: phoneNumbers.length,
        total: phoneNumbers.length,
        lastUpdated: new Date(),
      };

      await message.save();

      // Update analytics
      await this.updateAnalytics(message, "sent");

      logger.info(`SMS message ${messageId} sent successfully`);
    } catch (error) {
      logger.error(`Failed to process SMS message ${messageId}:`, error);

      // Update message with error
      const failedMessage = await SmsMessage.findByIdAndUpdate(
        messageId,
        {
          status: "failed",
          error: {
            code: "SEND_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            provider: this.defaultProvider,
            retryCount: 0,
            lastRetryAt: new Date(),
          },
        },
        { new: true }
      );

      // Update analytics for failure
      if (failedMessage) {
        await this.updateAnalytics(failedMessage, "failed");
      }

      throw error;
    }
  }

  /**
   * Handle incoming SMS messages
   */
  async handleIncomingMessage(
    message: AtIncomingMessagePayload
  ): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Store incoming message
      // 2. Process auto-replies
      // 3. Trigger webhooks
      console.log(`Incoming SMS from ${message.from}: ${message.text}`);
      await Promise.resolve({});
    } catch (error) {
      console.error("Failed to handle incoming message:", error);
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
   * Queue SMS for later sending
   */
  // async queueSms(sms: any): Promise<void> {
  //   // In a real implementation, you would add to a job queue
  //   // For now, just update status
  //   sms.status = SmsDeliveryStatus.QUEUED;
  //   await sms.save();
  //   console.log(`SMS queued for sending: ${sms._id}`);
  // }

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
      const message = await SmsMessage.findOne({ messageId });
      if (message?.deliveryStatus) {
        const deliveryStatus = message.deliveryStatus;

        if (status === "delivered") {
          deliveryStatus.delivered += 1;
          deliveryStatus.pending -= 1;
          message.deliveredAt = new Date();

          // Update analytics for delivery
          await this.updateAnalytics(message, "delivered");
        } else if (status === "failed") {
          deliveryStatus.failed += 1;
          deliveryStatus.pending -= 1;

          // Update analytics for failure
          await this.updateAnalytics(message, "failed");
        }

        deliveryStatus.lastUpdated = new Date();

        // Update overall message status
        if (deliveryStatus.pending === 0) {
          message.status =
            deliveryStatus.failed > 0
              ? SmsDeliveryStatus.FAILED
              : SmsDeliveryStatus.DELIVERED;
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
   * Get SMS analytics with optional filters
   */
  async getAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      orgId?: string;
      templateType?: SmsTemplateType;
      category?: SmsCategory;
      period?: "hour" | "day" | "week" | "month";
    }
  ): Promise<{
    analytics: ISmsAnalytics[];
    summary: {
      totalSent: number;
      totalDelivered: number;
      totalFailed: number;
      deliveryRate: number;
      totalCost: number;
      averageCost: number;
    };
    kenyaSummary: {
      safaricomPercentage: number;
      swahiliSmsPercentage: number;
      businessHoursSmsPercentage: number;
      otpSmsCount: number;
    };
  }> {
    try {
      const query: FilterQuery<ISmsAnalytics> = {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      };

      if (filters?.period) query.period = filters.period;
      if (filters?.templateType) query.templateType = filters.templateType;
      if (filters?.category) query.category = filters.category;

      const analytics = await SmsAnalytics.find(query).sort({ startDate: -1 });

      // Calculate summary from analytics documents
      const summary = analytics.reduce(
        (acc, doc) => ({
          totalSent: acc.totalSent + doc.totals.sent,
          totalDelivered: acc.totalDelivered + doc.totals.delivered,
          totalFailed: acc.totalFailed + doc.totals.failed,
          totalCost: acc.totalCost + doc.totals.cost,
          deliveryRate: 0,
          averageCost: 0,
        }),
        {
          totalSent: 0,
          totalDelivered: 0,
          totalFailed: 0,
          deliveryRate: 0,
          totalCost: 0,
          averageCost: 0,
        }
      );

      summary.deliveryRate =
        summary.totalSent > 0
          ? (summary.totalDelivered / summary.totalSent) * 100
          : 0;
      summary.averageCost =
        summary.totalSent > 0 ? summary.totalCost / summary.totalSent : 0;

      // Kenya-specific summary
      const kenyaMetrics = analytics.reduce(
        (acc, doc) => {
          const kenya = doc.kenyaMetrics;
          if (kenya) {
            return {
              safaricom: acc.safaricom + (kenya.safaricomCount || 0),
              swahili: acc.swahili + (kenya.swahiliSms || 0),
              businessHours: acc.businessHours + (kenya.businessHoursSms || 0),
              otp: acc.otp + (kenya.otpSms || 0),
            };
          }
          return acc;
        },
        { safaricom: 0, swahili: 0, businessHours: 0, otp: 0 }
      );

      const kenyaSummary = {
        safaricomPercentage:
          summary.totalSent > 0
            ? (kenyaMetrics.safaricom / summary.totalSent) * 100
            : 0,
        swahiliSmsPercentage:
          summary.totalSent > 0
            ? (kenyaMetrics.swahili / summary.totalSent) * 100
            : 0,
        businessHoursSmsPercentage:
          summary.totalSent > 0
            ? (kenyaMetrics.businessHours / summary.totalSent) * 100
            : 0,
        otpSmsCount: kenyaMetrics.otp,
      };

      return {
        analytics: analytics.map((doc) => doc.toObject()),
        summary,
        kenyaSummary,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get analytics");
    }
  }

  /**
   * Update SMS analytics for daily aggregates
   */
  private async updateAnalytics(sms: any, event: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const update: any = {
        $inc: {
          "totals.sent": event === "sent" ? 1 : 0,
          "totals.delivered": event === "delivered" ? 1 : 0,
          "totals.failed": event === "failed" ? 1 : 0,
          "totals.cost": event === "sent" ? sms.cost || 0 : 0,
        },
      };

      // Kenya-specific metrics
      if (sms.networkCode === KenyaNetworkCode.SAFARICOM) {
        update.$inc["kenyaMetrics.safaricomCount"] = 1;
      } else if (sms.networkCode === KenyaNetworkCode.AIRTEL) {
        update.$inc["kenyaMetrics.airtelCount"] = 1;
      } else if (sms.networkCode === KenyaNetworkCode.TELKOM) {
        update.$inc["kenyaMetrics.telkomCount"] = 1;
      }

      if (sms.isSwahili) {
        update.$inc["kenyaMetrics.swahiliSms"] = 1;
      }

      if (this.isKenyanBusinessHours()) {
        update.$inc["kenyaMetrics.businessHoursSms"] = 1;
      }

      if (sms.templateType === SmsTemplateType.OTP_VERIFICATION) {
        update.$inc["kenyaMetrics.otpSms"] = 1;
      }

      if (this.containsMpesaContent(sms.message)) {
        update.$inc["kenyaMetrics.mpesaSms"] = 1;
      }

      // Set defaults for new documents
      const setOnInsert = {
        period: "day",
        startDate: today,
        endDate: tomorrow,
        category: sms.category || SmsCategory.TRANSACTIONAL,
        deliveryRate: 0,
        failureRate: 0,
        averageCostPerSms: 0,
        byType: {},
        byProvider: {},
        topTemplates: [],
        trends: [],
      };

      if (sms.templateType) {
        // setOnInsert.templateType = sms.templateType;
      }

      await SmsAnalytics.findOneAndUpdate(
        {
          period: "day",
          startDate: today,
          endDate: tomorrow,
          ...(sms.templateType ? { templateType: sms.templateType } : {}),
          category: sms.category || SmsCategory.TRANSACTIONAL,
        },
        {
          ...update,
          $setOnInsert: setOnInsert,
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error("Failed to update analytics:", error);
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

  /**
   * Check if current time is within Kenyan business hours
   */
  isKenyanBusinessHours(): boolean {
    const now = new Date();
    const nairobiTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: SMS_CONSTANTS.BUSINESS_HOURS.TIMEZONE,
      })
    );

    const hour = nairobiTime.getHours();
    const isWeekend = nairobiTime.getDay() === 0 || nairobiTime.getDay() === 6;

    return (
      !isWeekend &&
      hour >= SMS_CONSTANTS.BUSINESS_HOURS.START &&
      hour < SMS_CONSTANTS.BUSINESS_HOURS.END
    );
  }

  /**
   * Check opt-out status for phone numbers
   */
  checkOptOutStatus(_phoneNumbers: string[]): void {
    // In a real implementation, check against opt-out database
    // For now, just return
    return;
  }

  /**
   * Generate OTP code
   */
  generateOtp(length = 6): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10);
    }
    return result;
  }

  /**
   * Check if content contains M-Pesa keywords
   */
  containsMpesaContent(content: string): boolean {
    const mpesaKeywords = [
      "mpesa",
      "m-pesa",
      "paybill",
      "lipa",
      "pesa",
      "malipo",
    ];
    const lowerContent = content.toLowerCase();
    return mpesaKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Get SMS response with additional data
   */
  async getSmsResponse(smsId: string): Promise<SmsResponse> {
    const sms = await SmsMessage.findById(smsId);
    if (!sms) {
      throw new SmsError("TEMPLATE_NOT_FOUND", "SMS not found", 404);
    }

    return {
      sms: sms.toObject(),
      canRetry: sms.canRetry(),
    };
  }

  /**
   * Handle errors consistently
   */
  handleError(error: any, defaultMessage: string): Error {
    if (error instanceof SmsError) {
      return error;
    }

    if (error.name === "ValidationError") {
      return new SmsError("INVALID_TEMPLATE_VARIABLES", error.message, 400);
    }

    if (error.name === "CastError") {
      return new SmsError("INVALID_PHONE_NUMBER", "Invalid ID format", 400);
    }

    console.error(defaultMessage, error);
    return new SmsError("AT_API_ERROR", defaultMessage, 500);
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
  sendSmsMfa = async (
    phoneNumber: string,
    context?: any,
    // userId?: string,
    options?: {
      length?: number;
      language?: "en" | "sw";
      expiryMinutes?: number;
    }
  ) => {
    const mfaCode = genRandom6DigitString();
    // const otpCode = this.generateOtp(options?.length || 6);

    const result = await smsService.sendSmsWithTemplate({
      to: phoneNumber,
      templateId: await this.getTemplateIdByName("mfa-verification"),
      data: {
        mfaCode,
        appName: "Kaa",
        expiryMinutes: options?.expiryMinutes || 10,
      },
      type: "verification",
      // language: options?.language || "en",
      // category: SmsCategory.AUTHENTICATION,
      priority: SmsPriority.HIGH,
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
      priority: SmsPriority.HIGH,
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
      priority: SmsPriority.URGENT,
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
    priority = SmsPriority.NORMAL,
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
          {
            name: "expiryMinutes",
            type: "string" as const,
            required: false,
            defaultValue: "Kaa",
            description: "OTP expiry time in minutes",
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
        translations: {
          sw: {
            template:
              "Nambari yako ya uhakiki ya Kenya Rentals ni {{otpCode}}. Ni halali kwa dakika {{expiryMinutes}}.",
          },
        },
        maxLength: 320,
        encoding: "GSM_7BIT" as const,
        tags: ["payment", "reminder"],
      },
      {
        name: "payment-confirmation",
        description: "Payment confirmation message",
        category: SmsCategory.TRANSACTIONAL,
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
        translations: {
          sw: {
            template:
              "Malipo ya KES {{amount}} yamepokelewa. Nambari ya M-Pesa: {{mpesaCode}}. Asante!",
          },
        },
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
