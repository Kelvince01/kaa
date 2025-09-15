import { readFileSync } from "node:fs";
import path from "node:path";
import config from "@kaa/config/api";
import { logger } from "@kaa/utils";
import Handlebars from "handlebars";
import mjml2html from "mjml";
import { Resend, type Tag } from "resend";

type EmailOptions = {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  context?: Record<string, unknown>;
  text?: string;
  role?: string;
  headers?: Record<string, string>;
  tags?: Tag[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
};

export type EmailRecipient = {
  email: string;
  name: string;
  role?: string;
};

class EmailService {
  private resend: Resend | undefined;
  private readonly templates: Record<string, HandlebarsTemplateDelegate> = {};
  private readonly templatesDir = path.join(__dirname, "../templates");

  constructor() {
    this.initializeResend();
    this.loadTemplates();
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
   * Load all email templates
   */
  private loadTemplates(): void {
    try {
      // List of all templates
      const templateNames = [
        // Auth email templates
        "verification",
        "password-reset",
        "welcome",
        "notification",
        "login-alert",
        // Booking email templates
        "booking-notification",
        "booking-status-update",
        "booking-cancellation",
        // Payment email templates
        "payment-reminder",
        "payment-receipt",
        "payment-overdue",
        // Reports email templates
        "monthly-report",
        // Reference email templates
        "reference-request",
        "reference-reminder",
        "reference-completed",
        "reference-declined",
        "reference-provider-welcome",
        "reference-tenant-verification-status",
        "tenant-verification-complete",
        "tenant-verification-update",
      ];

      // Load each template
      for (const name of templateNames) {
        const filePath = path.join(this.templatesDir, `${name}.mjml`);
        const mjmlTemplate = readFileSync(filePath, "utf8");

        // Convert MJML to HTML
        const { html, errors } = mjml2html(mjmlTemplate, {
          validationLevel: "soft",
          fonts: {
            "DM Sans":
              "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
          },
        });

        if (errors.length > 0) {
          // console.warn("MJML compilation warnings:", errors);
          continue;
        }

        // Compile the template with Handlebars
        this.templates[name] = Handlebars.compile(html);
      }

      logger.info("Email templates loaded successfully");
    } catch (error) {
      logger.error("Error loading email templates:", error);
      throw error;
    }
  }

  /**
   * Send an email
   */
  async sendEmail({
    to,
    subject,
    template,
    html: htmlText,
    context,
    text,
    headers,
    tags,
    cc,
    bcc,
    replyTo,
    attachments,
  }: EmailOptions): Promise<boolean> {
    try {
      if (template && !this.templates[template]) {
        throw new Error(`Template "${template}" not found`);
      }

      // Render the template with the provided context
      let html = "";
      if (template) {
        html = this.templates[template]?.(context) || "";
      }
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
