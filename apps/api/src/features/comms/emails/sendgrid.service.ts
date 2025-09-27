/**
 * Email Service
 *
 * Comprehensive email service with SendGrid integration
 * Handles sending, templates, analytics, and Kenya-specific features
 */

import { Email, EmailAnalytics, EmailBounce, Template } from "@kaa/models";
import {
  BounceType,
  type BulkEmailRequest,
  EMAIL_CONSTANTS,
  type EmailAnalyticsResponse,
  EmailCategory,
  EmailError,
  type EmailFilters,
  type EmailListResponse,
  EmailPriority,
  type EmailResponse,
  EmailStatus,
  type EmailTemplateType,
  type IEmailAddress,
  type ITemplate,
  type SendEmailRequest,
  SendGridEventType,
  type SendGridWebhookPayload,
  type UnsubscribeRequest,
} from "@kaa/models/types";
import { TemplateService } from "@kaa/services";
import { TemplateEngine } from "@kaa/services/engines";
import sgMail from "@sendgrid/mail";
import type mongoose from "mongoose";

/**
 * Email Service Configuration
 */
type EmailServiceConfig = {
  sendGridApiKey: string;
  fromEmail: string;
  fromName: string;
  webhookEndpoint?: string;
  sandboxMode?: boolean;
};

/**
 * Email Service Class
 */
export class EmailService {
  private readonly config: EmailServiceConfig;
  private isInitialized = false;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    this.initialize();
  }

  // ==================== INITIALIZATION ====================

  /**
   * Initialize SendGrid and email service
   */
  private initialize(): void {
    try {
      sgMail.setApiKey(this.config.sendGridApiKey);
      this.isInitialized = true;
      console.log("Email service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize email service:", error);
      throw new EmailError(
        "SENDGRID_API_ERROR",
        "Failed to initialize SendGrid",
        500
      );
    }
  }

  // ==================== EMAIL SENDING METHODS ====================

  /**
   * Send a single email
   */
  async sendEmail(request: SendEmailRequest): Promise<EmailResponse> {
    try {
      this.validateInitialization();

      // Normalize recipients
      const to = this.normalizeAddresses(request.to);
      const cc = request.cc ? this.normalizeAddresses(request.cc) : undefined;
      const bcc = request.bcc
        ? this.normalizeAddresses(request.bcc)
        : undefined;
      const from =
        this.normalizeAddress(request.from as any) ||
        EMAIL_CONSTANTS.DEFAULT_FROM;
      const replyTo = request.replyTo
        ? this.normalizeAddress(request.replyTo)
        : undefined;

      // Validate business hours if required
      if (request.respectBusinessHours && !this.isKenyanBusinessHours()) {
        throw new EmailError(
          "BUSINESS_HOURS_RESTRICTION",
          "Emails can only be sent during business hours (8 AM - 6 PM EAT)",
          400
        );
      }

      // Check for opt-out if enabled
      if (request.respectOptOut !== false) {
        await this.checkOptOutStatus(to);
      }

      let subject = request.subject;
      let text = request.text;
      let html = request.html;
      let template: ITemplate | undefined;

      // Handle template-based emails
      if (request.templateType) {
        template = await TemplateService.getTemplateBy({
          type: request.templateType,
        });
        if (!template.isActive) {
          throw new EmailError(
            "TEMPLATE_NOT_FOUND",
            "Template is not active",
            404
          );
        }

        // Render template
        const rendered = await TemplateEngine.render({
          template,
          //   request.language || "en"
          data: {},
        });
        subject = rendered.subject;
        text = rendered.content;
        html = rendered.content;
      }

      if (!subject || subject.trim().length === 0) {
        throw new EmailError(
          "INVALID_EMAIL_ADDRESS",
          "Email subject is required",
          400
        );
      }

      // Create email record
      const email = new Email({
        templateType: request.templateType,
        to,
        cc,
        bcc,
        from,
        replyTo,
        subject,
        text,
        html,
        attachments: request.attachments || [],
        templateId: template?._id,
        category: request.category || EmailCategory.TRANSACTIONAL,
        priority: request.priority || EmailPriority.NORMAL,
        tags: request.tags || [],
        status: EmailStatus.QUEUED,
        deliveryAttempts: 0,
        maxAttempts: EMAIL_CONSTANTS.RETRY_SETTINGS.MAX_ATTEMPTS,
        language: request.language || "en",
        businessHoursOnly: request.respectBusinessHours,
        respectOptOut: request.respectOptOut !== false,
        scheduledFor: request.scheduledFor,
        userId: request.userId,
        propertyId: request.propertyId,
        applicationId: request.applicationId,
        paymentId: request.paymentId,
        isTest: request.isTest,
      });

      const savedEmail = await email.save();

      // Send immediately or queue for later
      if (request.scheduledFor && request.scheduledFor > new Date()) {
        await this.queueEmail(savedEmail);
      } else {
        await this.sendEmailNow(savedEmail);
      }

      return await this.getEmailResponse(
        (savedEmail._id as mongoose.Types.ObjectId).toString()
      );
    } catch (error) {
      throw this.handleError(error, "Failed to send email");
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(request: BulkEmailRequest): Promise<{
    batchId: string;
    totalEmails: number;
    queuedEmails: number;
    failedEmails: number;
    errors: Array<{ recipient: string; error: string }>;
  }> {
    try {
      this.validateInitialization();

      const template = await TemplateService.getTemplateBy({
        type: request.templateType,
      });
      if (!template.isActive) {
        throw new EmailError(
          "TEMPLATE_NOT_FOUND",
          "Template is not active",
          404
        );
      }

      const batchId = Date.now().toString();
      const batchSize =
        request.batchSize || EMAIL_CONSTANTS.RATE_LIMITS.BULK_BATCH_SIZE;
      const results = {
        batchId,
        totalEmails: request.recipients.length,
        queuedEmails: 0,
        failedEmails: 0,
        errors: [] as Array<{ recipient: string; error: string }>,
      };

      // Process in batches
      for (let i = 0; i < request.recipients.length; i += batchSize) {
        const batch = request.recipients.slice(i, i + batchSize);

        for (const recipient of batch) {
          try {
            const to = this.normalizeAddress(recipient.to);

            // Create individual email request
            const emailRequest: SendEmailRequest = {
              templateType: request.templateType,
              to,
              priority: request.priority || EmailPriority.NORMAL,
              category: request.category || EmailCategory.MARKETING,
              tags: [...(request.tags || []), `batch:${batchId}`],
              language: request.language || "en",
              scheduledFor: request.scheduledFor,
              respectBusinessHours: request.respectBusinessHours,
              respectOptOut: request.respectOptOut !== false,
              isTest: request.isTest,
            };

            await this.sendEmail(emailRequest);
            results.queuedEmails++;
          } catch (error) {
            results.failedEmails++;
            results.errors.push({
              recipient:
                typeof recipient.to === "string"
                  ? recipient.to
                  : recipient.to.email,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // Add delay between batches if specified
        if (
          request.delayBetweenBatches &&
          i + batchSize < request.recipients.length
        ) {
          await this.delay(request.delayBetweenBatches);
        }
      }

      return results;
    } catch (error) {
      throw this.handleError(error, "Failed to send bulk emails");
    }
  }

  /**
   * Send email immediately via SendGrid
   */
  private async sendEmailNow(email: any): Promise<void> {
    try {
      const msg = {
        to: email.to.map((addr: IEmailAddress) => ({
          email: addr.email,
          name: addr.name,
        })),
        cc: email.cc?.map((addr: IEmailAddress) => ({
          email: addr.email,
          name: addr.name,
        })),
        bcc: email.bcc?.map((addr: IEmailAddress) => ({
          email: addr.email,
          name: addr.name,
        })),
        from: {
          email: email.from.email,
          name: email.from.name || this.config.fromName,
        },
        replyTo: email.replyTo
          ? {
              email: email.replyTo.email,
              name: email.replyTo.name,
            }
          : undefined,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments?.map((att: any) => ({
          content: att.content,
          filename: att.filename,
          type: att.mimeType,
          disposition: att.disposition,
          contentId: att.contentId,
        })),
        categories: [email.category, ...email.tags],
        customArgs: {
          emailId: email._id.toString(),
          userId: email.userId,
          propertyId: email.propertyId,
          applicationId: email.applicationId,
          paymentId: email.paymentId,
          language: email.language,
          isTest: email.isTest.toString(),
        },
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
          subscriptionTracking: { enable: false },
        },
        mailSettings: {
          sandboxMode: this.config.sandboxMode ? { enable: true } : undefined,
        },
      };

      const response = await sgMail.send(msg);
      const messageId = response[0].headers["x-message-id"];

      await email.markAsSent(messageId);
      await this.updateAnalytics(email, "sent");

      console.log(`Email sent successfully: ${email._id}`);
    } catch (error) {
      console.error(`Failed to send email ${email._id}:`, error);
      await email.markAsFailed(
        error instanceof Error ? error.message : "Unknown error"
      );
      await this.updateAnalytics(email, "failed");
      throw error;
    }
  }

  // ==================== EMAIL MANAGEMENT ====================

  /**
   * Get email by ID
   */
  async getEmail(emailId: string): Promise<EmailResponse> {
    try {
      return await this.getEmailResponse(emailId);
    } catch (error) {
      throw this.handleError(error, "Failed to get email");
    }
  }

  /**
   * List emails with filters
   */
  async listEmails(filters: EmailFilters): Promise<EmailListResponse> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

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
      if (filters.priority) {
        query.priority = Array.isArray(filters.priority)
          ? { $in: filters.priority }
          : filters.priority;
      }
      if (filters.language) query.language = filters.language;
      if (filters.userId) query.userId = filters.userId;
      if (filters.propertyId) query.propertyId = filters.propertyId;
      if (filters.applicationId) query.applicationId = filters.applicationId;
      if (filters.paymentId) query.paymentId = filters.paymentId;

      // Date filters
      if (filters.sentAfter || filters.sentBefore) {
        query.sentAt = {};
        if (filters.sentAfter) query.sentAt.$gte = filters.sentAfter;
        if (filters.sentBefore) query.sentAt.$lte = filters.sentBefore;
      }

      if (filters.scheduledAfter || filters.scheduledBefore) {
        query.scheduledFor = {};
        if (filters.scheduledAfter)
          query.scheduledFor.$gte = filters.scheduledAfter;
        if (filters.scheduledBefore)
          query.scheduledFor.$lte = filters.scheduledBefore;
      }

      // Tracking filters
      if (typeof filters.hasOpened === "boolean") {
        query.openedAt = filters.hasOpened
          ? { $exists: true }
          : { $exists: false };
      }
      if (typeof filters.hasClicked === "boolean") {
        query.clickedAt = filters.hasClicked
          ? { $exists: true }
          : { $exists: false };
      }
      if (typeof filters.hasBounced === "boolean") {
        query.bouncedAt = filters.hasBounced
          ? { $exists: true }
          : { $exists: false };
      }

      // Search
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Tags
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      // Execute query
      const [emails, total] = await Promise.all([
        Email.find(query)
          .sort({
            [filters.sortBy || "createdAt"]:
              filters.sortOrder === "asc" ? 1 : -1,
          })
          .skip(skip)
          .limit(limit),
        Email.countDocuments(query),
      ]);

      // Get summary
      const [
        totalEmails,
        sentEmails,
        deliveredEmails,
        failedEmails,
        pendingEmails,
      ] = await Promise.all([
        Email.countDocuments({}),
        Email.countDocuments({ status: EmailStatus.SENT }),
        Email.countDocuments({ status: EmailStatus.DELIVERED }),
        Email.countDocuments({ status: EmailStatus.FAILED }),
        Email.countDocuments({
          status: { $in: [EmailStatus.QUEUED, EmailStatus.SENDING] },
        }),
      ]);

      // Transform emails
      const emailResponses = await Promise.all(
        emails.map((email) =>
          this.getEmailResponse(
            (email._id as mongoose.Types.ObjectId).toString()
          )
        )
      );

      return {
        emails: emailResponses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        summary: {
          totalEmails,
          sentEmails,
          deliveredEmails,
          failedEmails,
          pendingEmails,
        },
        filters,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to list emails");
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get email analytics
   */
  async getAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      templateType?: EmailTemplateType;
      category?: EmailCategory;
      language?: "en" | "sw";
    }
  ): Promise<EmailAnalyticsResponse> {
    try {
      const query: any = {
        date: { $gte: startDate, $lte: endDate },
      };

      if (filters?.templateType) query.templateType = filters.templateType;
      if (filters?.category) query.category = filters.category;

      const analytics = await EmailAnalytics.find(query).sort({ date: -1 });

      // Calculate summary
      const summary = analytics.reduce(
        (acc, day) => ({
          totalEmails: acc.totalEmails + day.totalEmails,
          deliveryRate: acc.deliveryRate + day.deliveryRate,
          openRate: acc.openRate + day.openRate,
          clickRate: acc.clickRate + day.clickRate,
          bounceRate: acc.bounceRate + day.bounceRate,
          unsubscribeRate: acc.unsubscribeRate + day.unsubscribeRate,
          averageDeliveryTime:
            acc.averageDeliveryTime + day.averageDeliveryTime,
        }),
        {
          totalEmails: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
          unsubscribeRate: 0,
          averageDeliveryTime: 0,
        }
      );

      const days = analytics.length;
      if (days > 0) {
        summary.deliveryRate /= days;
        summary.openRate /= days;
        summary.clickRate /= days;
        summary.bounceRate /= days;
        summary.unsubscribeRate /= days;
        summary.averageDeliveryTime /= days;
      }

      // Kenya-specific summary
      const kenyaSummary = analytics.reduce(
        (acc, day) => {
          const kenya = day.kenyaMetrics;
          if (kenya) {
            return {
              swahiliEmailsPercent:
                acc.swahiliEmailsPercent +
                (kenya.swahiliEmails / day.totalEmails || 0),
              englishEmailsPercent:
                acc.englishEmailsPercent +
                (kenya.englishEmails / day.totalEmails || 0),
              businessHoursEmailsPercent:
                acc.businessHoursEmailsPercent +
                (kenya.businessHoursEmails / day.totalEmails || 0),
              mpesaRelatedPercent:
                acc.mpesaRelatedPercent +
                (kenya.mpesaRelatedEmails / day.totalEmails || 0),
              peakHour: acc.peakHour, // Would need more complex calculation
            };
          }
          return acc;
        },
        {
          swahiliEmailsPercent: 0,
          englishEmailsPercent: 0,
          businessHoursEmailsPercent: 0,
          peakHour: "10:00",
          mpesaRelatedPercent: 0,
        }
      );

      if (days > 0) {
        kenyaSummary.swahiliEmailsPercent =
          (kenyaSummary.swahiliEmailsPercent / days) * 100;
        kenyaSummary.englishEmailsPercent =
          (kenyaSummary.englishEmailsPercent / days) * 100;
        kenyaSummary.businessHoursEmailsPercent =
          (kenyaSummary.businessHoursEmailsPercent / days) * 100;
        kenyaSummary.mpesaRelatedPercent =
          (kenyaSummary.mpesaRelatedPercent / days) * 100;
      }

      return {
        analytics,
        summary,
        kenyaSummary,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get analytics");
    }
  }

  // ==================== WEBHOOK HANDLING ====================

  /**
   * Handle SendGrid webhook events
   */
  async handleWebhook(events: SendGridWebhookPayload[]): Promise<void> {
    try {
      for (const event of events) {
        await this.processWebhookEvent(event);
      }
    } catch (error) {
      console.error("Failed to process webhook events:", error);
      throw new EmailError(
        "WEBHOOK_VALIDATION_ERROR",
        "Failed to process webhook",
        500
      );
    }
  }

  /**
   * Process individual webhook event
   */
  private async processWebhookEvent(
    event: SendGridWebhookPayload
  ): Promise<void> {
    try {
      const emailId = event.unique_args?.emailId;
      if (!emailId) {
        console.warn("Webhook event missing emailId:", event);
        return;
      }

      const email = await Email.findById(emailId);
      if (!email) {
        console.warn(`Email not found for webhook event: ${emailId}`);
        return;
      }

      switch (event.event) {
        case SendGridEventType.DELIVERED:
          await email.markAsDelivered();
          await this.updateAnalytics(email, "delivered");
          break;

        case SendGridEventType.OPEN:
          await email.markAsOpened();
          await this.updateAnalytics(email, "opened");
          break;

        case SendGridEventType.CLICK:
          await email.markAsClicked();
          await this.updateAnalytics(email, "clicked");
          break;

        case SendGridEventType.BOUNCE: {
          const bounceType = this.mapBounceType(event.type);
          await email.markAsBounced(
            bounceType,
            event.reason || "Unknown bounce reason"
          );
          await this.createBounceRecord(email, event);
          await this.updateAnalytics(email, "bounced");
          break;
        }

        case SendGridEventType.DROPPED:
          await email.markAsFailed(event.reason || "Email dropped by SendGrid");
          await this.updateAnalytics(email, "failed");
          break;

        case SendGridEventType.UNSUBSCRIBE:
          await this.handleUnsubscribe({
            email: event.email,
            reason: "SendGrid unsubscribe",
          });
          await this.updateAnalytics(email, "unsubscribed");
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.event}`);
      }
    } catch (error) {
      console.error(
        `Failed to process webhook event for ${event.sg_message_id}:`,
        error
      );
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Handle unsubscribe requests
   */
  async handleUnsubscribe(request: UnsubscribeRequest): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Add email to unsubscribe list
      // 2. Update user preferences
      // 3. Log the unsubscribe event
      await Promise.resolve({});
      console.log(
        `Unsubscribe request for ${request.email}: ${request.reason}`
      );
    } catch (error) {
      console.error("Failed to handle unsubscribe:", error);
    }
  }

  /**
   * Check if current time is within Kenyan business hours
   */
  private isKenyanBusinessHours(): boolean {
    const now = new Date();
    const nairobiTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: EMAIL_CONSTANTS.BUSINESS_HOURS.TIMEZONE,
      })
    );

    const hour = nairobiTime.getHours();
    const isWeekend = nairobiTime.getDay() === 0 || nairobiTime.getDay() === 6;

    return (
      !isWeekend &&
      hour >= EMAIL_CONSTANTS.BUSINESS_HOURS.START &&
      hour < EMAIL_CONSTANTS.BUSINESS_HOURS.END
    );
  }

  /**
   * Queue email for later sending
   */
  private async queueEmail(email: any): Promise<void> {
    // In a real implementation, you would add to a job queue
    // For now, just update status
    email.status = EmailStatus.QUEUED;
    await email.save();
    console.log(`Email queued for sending: ${email._id}`);
  }

  /**
   * Update email analytics
   */
  private async updateAnalytics(email: any, event: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const update: any = {
        $inc: {
          totalEmails: event === "sent" ? 1 : 0,
          sent: event === "sent" ? 1 : 0,
          delivered: event === "delivered" ? 1 : 0,
          bounced: event === "bounced" ? 1 : 0,
          failed: event === "failed" ? 1 : 0,
          opened: event === "opened" ? 1 : 0,
          clicked: event === "clicked" ? 1 : 0,
          unsubscribed: event === "unsubscribed" ? 1 : 0,
        },
      };

      // Kenya-specific metrics
      if (email.language === "sw") {
        update.$inc["kenyaMetrics.swahiliEmails"] = 1;
      } else {
        update.$inc["kenyaMetrics.englishEmails"] = 1;
      }

      if (this.isKenyanBusinessHours()) {
        update.$inc["kenyaMetrics.businessHoursEmails"] = 1;
      }

      if (this.containsMpesaContent(`${email.subject} ${email.text || ""}`)) {
        update.$inc["kenyaMetrics.mpesaRelatedEmails"] = 1;
      }

      await EmailAnalytics.findOneAndUpdate(
        {
          date: today,
          ...(email.templateType ? { templateType: email.templateType } : {}),
          category: email.category,
        },
        update,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error("Failed to update analytics:", error);
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate service initialization
   */
  private validateInitialization(): void {
    if (!this.isInitialized) {
      throw new EmailError(
        "SENDGRID_API_ERROR",
        "Email service not initialized",
        500
      );
    }
  }

  /**
   * Normalize email addresses
   */
  private normalizeAddresses(
    addresses: IEmailAddress | IEmailAddress[] | string | string[]
  ): IEmailAddress[] {
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    return addressArray.map((addr) => this.normalizeAddress(addr));
  }

  /**
   * Normalize single email address
   */
  private normalizeAddress(address: IEmailAddress | string): IEmailAddress {
    if (typeof address === "string") {
      return { email: address.toLowerCase().trim() };
    }
    return {
      email: address.email.toLowerCase().trim(),
      name: address.name?.trim(),
    };
  }

  /**
   * Check opt-out status for recipients
   */
  private checkOptOutStatus(recipients: IEmailAddress[]): void {
    // In a real implementation, check against opt-out database
    // For now, just validate email addresses
    for (const recipient of recipients) {
      if (
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        !(recipient.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))
      ) {
        throw new EmailError(
          "INVALID_EMAIL_ADDRESS",
          `Invalid email: ${recipient.email}`,
          400
        );
      }
    }
  }

  /**
   * Map SendGrid bounce type to our enum
   */
  private mapBounceType(sendGridType?: string): BounceType {
    if (!sendGridType) return BounceType.TEMPORARY;

    if (sendGridType.includes("hard") || sendGridType.includes("permanent")) {
      return BounceType.HARD;
    }
    if (sendGridType.includes("soft") || sendGridType.includes("temporary")) {
      return BounceType.SOFT;
    }

    return BounceType.TEMPORARY;
  }

  /**
   * Create bounce record
   */
  private async createBounceRecord(
    email: any,
    event: SendGridWebhookPayload
  ): Promise<void> {
    try {
      const bounce = new EmailBounce({
        emailId: email._id.toString(),
        email: event.email,
        bounceType: this.mapBounceType(event.type),
        bounceReason: event.reason || "Unknown bounce reason",
        bouncedAt: new Date(event.timestamp * 1000),
        sendGridEventId: event.sg_event_id,
        shouldRetry: event.type !== "hard" && event.type !== "permanent",
        isBlacklisted: event.type === "hard" || event.type === "permanent",
      });

      await bounce.save();
    } catch (error) {
      console.error("Failed to create bounce record:", error);
    }
  }

  /**
   * Check if content contains M-Pesa keywords
   */
  private containsMpesaContent(content: string): boolean {
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
   * Get email response with additional data
   */
  private async getEmailResponse(emailId: string): Promise<EmailResponse> {
    const email = await Email.findById(emailId);
    if (!email) {
      throw new EmailError("TEMPLATE_NOT_FOUND", "Email not found", 404);
    }

    const template = email.templateId
      ? await Template.findById(email.templateId)
      : undefined;

    // Get analytics
    const [opens, clicks, bounces] = await Promise.all([
      Email.countDocuments({ _id: emailId, openedAt: { $exists: true } }),
      Email.countDocuments({ _id: emailId, clickedAt: { $exists: true } }),
      Email.countDocuments({ _id: emailId, bouncedAt: { $exists: true } }),
    ]);

    return {
      email: email.toObject(),
      template: template?.toObject(),
      analytics: { opens, clicks, bounces },
      canRetry: email.canRetry(),
      canCancel: email.status === EmailStatus.QUEUED,
    };
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof EmailError) {
      return error;
    }

    if (error.name === "ValidationError") {
      return new EmailError("TEMPLATE_VALIDATION_ERROR", error.message, 400);
    }

    if (error.name === "CastError") {
      return new EmailError("INVALID_EMAIL_ADDRESS", "Invalid ID format", 400);
    }

    console.error(defaultMessage, error);
    return new EmailError("SENDGRID_API_ERROR", defaultMessage, 500);
  }
}
