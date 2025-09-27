import config from "@kaa/config/api";
import { Email } from "@kaa/models";
import {
  EMAIL_CONSTANTS,
  EmailCategory,
  EmailPriority,
  EmailStatus,
  type ITemplate,
} from "@kaa/models/types";
import { TemplateService } from "@kaa/services";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
import { Resend, type Tag } from "resend";

type BaseEmailOptions = {
  to: string[];
  headers?: Record<string, string>;
  tags?: Tag[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
  role?: string;
};

type EmailOptions = BaseEmailOptions & {
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  data?: Record<string, any>;
};

type EmailWithTemplateOptions = BaseEmailOptions & {
  templateId?: string;
  template?: ITemplate;
  data?: Record<string, any>;
};

type EmailWithTemplateRecipient = EmailWithTemplateOptions & {
  userId: string;
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  };
};

export type EmailRecipient = {
  email: string;
  name: string;
  role?: string;
};

class EmailService {
  private resend: Resend | undefined;

  constructor() {
    this.initializeResend();
  }

  /**
   * Initialize Resend client
   */
  private initializeResend(): void {
    try {
      const apiKey = config.resendApiKey;

      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }

      this.resend = new Resend(apiKey);
      logger.info("Resend client initialized");
    } catch (error) {
      logger.error("Error initializing Resend client:", error);
      throw error;
    }
  }

  /**
   * Send an email
   */
  async sendEmail({
    to,
    subject,
    html: htmlText,
    text,
    headers,
    tags,
    cc,
    bcc,
    replyTo,
    attachments,
  }: EmailOptions): Promise<boolean> {
    try {
      // Render the template with the provided context
      let html = "";
      if (htmlText) html = htmlText;

      // Send the email using Resend
      const { data, error } = await (this.resend as Resend).emails.send({
        from: `${process.env.EMAIL_FROM_NAME || "Kaa"} <${process.env.EMAIL_FROM || "noreply@kaapro.dev"}>`,
        to,
        subject,
        html,
        text: text ? text : this.htmlToText(html),
        headers,
        tags,
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        replyTo,
        attachments,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      logger.info(`Email sent with Resend ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send an email with a template
   */
  async sendEmailWithTemplate({
    to,
    templateId,
    template: inlineTemplate,
    data: context,
    headers,
    tags,
    cc,
    bcc,
    replyTo,
    attachments,
    userId,
    requestMetadata,
  }: EmailWithTemplateOptions & {
    userId: string;
    requestMetadata: {
      requestId: string;
      ipAddress: string;
      userAgent: string;
    };
  }): Promise<boolean> {
    try {
      let template: ITemplate | null = null;
      let html = "";
      let subject = "";

      template = inlineTemplate || null;
      if (templateId && !template) {
        template = await TemplateService.getTemplateById(templateId as string);

        if (!template) {
          throw new Error(`Template ${templateId} not found`);
        }

        const result = await TemplateService.renderTemplate(
          {
            templateId: (template?._id as mongoose.Types.ObjectId).toString(),
            data: (context as any) || {},
            options: {},
          },
          userId,
          requestMetadata
        );

        html = result.output?.content || "";
        subject = result.output?.subject || "";
      }

      // const fromAddress = `${process.env.EMAIL_FROM_NAME || "Kaa"} <${process.env.EMAIL_FROM || "noreply@kaapro.dev"}>`;
      const fromName = process.env.EMAIL_FROM_NAME || "Kaa";
      const fromEmail = process.env.EMAIL_FROM || "noreply@kaapro.dev";
      const fromAddress = `${fromName} <${fromEmail}>`;
      const emailData = new Email({
        to: to.map((email) => ({ email, name: email.split("@")[0] })),
        from: {
          email: fromEmail,
          name: fromName, // EMAIL_CONSTANTS.DEFAULT_FROM.name,
        },
        subject,
        html,
        headers,
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        replyTo,
        attachments,
        templateId: template?._id,
        category: EmailCategory.TRANSACTIONAL,
        priority: EmailPriority.NORMAL,
        tags: tags || [],
        status: EmailStatus.QUEUED,
        deliveryAttempts: 0,
        maxAttempts: EMAIL_CONSTANTS.RETRY_SETTINGS.MAX_ATTEMPTS,
        language: "en",
        businessHoursOnly: false,
        respectOptOut: false,
        userId,
        requestMetadata,
        settings: {
          enableDeliveryReports: true,
          maxRetries: 3,
          retryInterval: 5,
          provider: "resend",
        },
      });
      await emailData.save();

      // Send the email using Resend
      const { data, error } = await (this.resend as Resend).emails.send({
        from: fromAddress,
        to,
        subject,
        html,
        headers,
        tags,
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        replyTo,
        attachments,
      });

      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }

      logger.info(`Email sent with Resend ID: ${data?.id}`);
      return true;
    } catch (error) {
      logger.error("Error sending email:", error);
      return false;
    }
  }

  async sendBulkEmail(emails: EmailOptions[]): Promise<boolean> {
    const results = await Promise.all(
      emails.map(async (email) => {
        return await this.sendEmail(email);
      })
    );

    if (results.some((result) => !result)) {
      throw new Error(
        `Resend API error: ${results.find((result) => !result)?.toString()}`
      );
    }

    return await Promise.resolve(results.every((result) => result));
  }

  async sendBulkEmailWithTemplate(
    emails: EmailWithTemplateRecipient[]
  ): Promise<boolean> {
    const results = await Promise.all(
      emails.map(async (email) => {
        return await this.sendEmailWithTemplate({
          ...email,
          to: email.to,
          userId: email.userId,
          requestMetadata: email.requestMetadata,
        });
      })
    );

    if (results.some((result) => !result)) {
      throw new Error(
        `Resend API error: ${results.find((result) => !result)?.toString()}`
      );
    }

    return await Promise.resolve(results.every((result) => result));
  }

  /**
   * Basic HTML to text conversion for fallback
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export default new EmailService();
