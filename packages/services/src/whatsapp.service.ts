import config from "@kaa/config/api";
import { logger } from "@kaa/utils";
import axios from "axios";

type WhatsAppMessageData = {
  to: string;
  message: string;
  title?: string;
  data?: Record<string, any>;
  templateName?: string;
  templateParams?: string[];
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document" | "audio";
};

type WhatsAppTemplateMessage = {
  to: string;
  templateName: string;
  templateParams?: string[];
  languageCode?: string;
};

type WhatsAppResponse = {
  success: boolean;
  messageId?: string;
  error?: string;
};

class WhatsAppService {
  private readonly twilioAccountSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioWhatsAppNumber: string;
  private readonly twilioApiUrl: string;

  constructor() {
    this.twilioAccountSid = config.twilio?.accountSid || "";
    this.twilioAuthToken = config.twilio?.authToken || "";
    this.twilioWhatsAppNumber = config.twilio?.whatsappNumber || "";
    this.twilioApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;
  }

  /**
   * Send a simple WhatsApp message
   */
  async sendMessage({
    to,
    message,
    title,
  }: WhatsAppMessageData): Promise<WhatsAppResponse> {
    try {
      // Format phone number for WhatsApp (must start with whatsapp:)
      const whatsappTo = this.formatWhatsAppNumber(to);
      const whatsappFrom = this.formatWhatsAppNumber(this.twilioWhatsAppNumber);

      // Combine title and message if title exists
      const fullMessage = title ? `*${title}*\n\n${message}` : message;

      const response = await axios.post(
        this.twilioApiUrl,
        new URLSearchParams({
          To: whatsappTo,
          From: whatsappFrom,
          Body: fullMessage,
        }),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      logger.info(`WhatsApp message sent successfully to ${to}`, {
        messageId: response.data.sid,
        to: whatsappTo,
      });

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      logger.error("Error sending WhatsApp message:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to send WhatsApp message",
      };
    }
  }

  /**
   * Send WhatsApp template message
   */
  async sendTemplateMessage({
    to,
    templateName,
    templateParams = [],
    languageCode = "en",
  }: WhatsAppTemplateMessage): Promise<WhatsAppResponse> {
    try {
      const whatsappTo = this.formatWhatsAppNumber(to);
      const whatsappFrom = this.formatWhatsAppNumber(this.twilioWhatsAppNumber);

      // Build template content
      const contentSid = `${templateName}_${languageCode}`;

      const params: any = {
        To: whatsappTo,
        From: whatsappFrom,
        ContentSid: contentSid,
      };

      // Add template parameters if provided
      templateParams.forEach((param, index) => {
        params.ContentVariables = JSON.stringify({ [index + 1]: param });
      });

      const response = await axios.post(
        this.twilioApiUrl,
        new URLSearchParams(params),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      logger.info(`WhatsApp template message sent successfully to ${to}`, {
        messageId: response.data.sid,
        templateName,
        to: whatsappTo,
      });

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      logger.error("Error sending WhatsApp template message:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to send WhatsApp template message",
      };
    }
  }

  /**
   * Send WhatsApp message with media
   */
  async sendMediaMessage({
    to,
    message,
    mediaUrl,
    mediaType,
    title,
  }: WhatsAppMessageData): Promise<WhatsAppResponse> {
    try {
      const whatsappTo = this.formatWhatsAppNumber(to);
      const whatsappFrom = this.formatWhatsAppNumber(this.twilioWhatsAppNumber);

      const fullMessage = title ? `*${title}*\n\n${message}` : message;

      const params: any = {
        To: whatsappTo,
        From: whatsappFrom,
        Body: fullMessage,
      };

      // Add media URL based on type
      if (mediaUrl) {
        params.MediaUrl = mediaUrl;
      }

      const response = await axios.post(
        this.twilioApiUrl,
        new URLSearchParams(params),
        {
          auth: {
            username: this.twilioAccountSid,
            password: this.twilioAuthToken,
          },
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      logger.info(`WhatsApp media message sent successfully to ${to}`, {
        messageId: response.data.sid,
        mediaType,
        to: whatsappTo,
      });

      return {
        success: true,
        messageId: response.data.sid,
      };
    } catch (error: any) {
      logger.error("Error sending WhatsApp media message:", error);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to send WhatsApp media message",
      };
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatWhatsAppNumber(phoneNumber: string): string {
    // Remove any existing whatsapp: prefix
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    let cleanNumber = phoneNumber.replace(/^whatsapp:/, "") as string;

    // Remove all non-digit characters except +
    cleanNumber = cleanNumber.replace(/[^\d+]/g, "") as string;

    // Add + if not present and number doesn't start with it
    if (!cleanNumber.startsWith("+")) {
      cleanNumber = `+${cleanNumber}`;
    }

    // Return with whatsapp: prefix
    return `whatsapp:${cleanNumber}`;
  }

  /**
   * Validate WhatsApp service configuration
   */
  isConfigured(): boolean {
    return !!(
      this.twilioAccountSid &&
      this.twilioAuthToken &&
      this.twilioWhatsAppNumber
    );
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      configured: this.isConfigured(),
      accountSid: this.twilioAccountSid
        ? `***${this.twilioAccountSid.slice(-4)}`
        : null,
      whatsappNumber: this.twilioWhatsAppNumber || null,
    };
  }
}

export const whatsappService = new WhatsAppService();

// Template message factory for common notification types
// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class WhatsAppTemplateFactory {
  /**
   * Send payment reminder via WhatsApp
   */
  static async sendPaymentReminder({
    phoneNumber,
    tenantName,
    amount,
    dueDate,
    unitNumber,
    paymentLink,
  }: {
    phoneNumber: string;
    tenantName: string;
    amount: number;
    dueDate: string;
    unitNumber: string;
    paymentLink: string;
  }) {
    const message = `Hi ${tenantName}, your rent payment of KES ${amount.toLocaleString()} for unit ${unitNumber} is due on ${dueDate}. Pay now: ${paymentLink}`;

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Payment Reminder",
    });
  }

  /**
   * Send payment confirmation via WhatsApp
   */
  static async sendPaymentConfirmation({
    phoneNumber,
    tenantName,
    amount,
    receiptNumber,
    unitNumber,
  }: {
    phoneNumber: string;
    tenantName: string;
    amount: number;
    receiptNumber: string;
    unitNumber: string;
  }) {
    const message = `Hi ${tenantName}, we've received your payment of KES ${amount.toLocaleString()} for unit ${unitNumber}. Receipt number: ${receiptNumber}. Thank you!`;

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Payment Confirmed",
    });
  }

  /**
   * Send maintenance update via WhatsApp
   */
  static async sendMaintenanceUpdate({
    phoneNumber,
    tenantName,
    unitNumber,
    status,
    description,
  }: {
    phoneNumber: string;
    tenantName: string;
    unitNumber: string;
    status: string;
    description: string;
  }) {
    const message = `Hi ${tenantName}, maintenance update for unit ${unitNumber}: ${status}. ${description}`;

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Maintenance Update",
    });
  }

  /**
   * Send booking confirmation via WhatsApp
   */
  static async sendBookingConfirmation({
    phoneNumber,
    tenantName,
    propertyName,
    checkInDate,
    checkOutDate,
    bookingId,
  }: {
    phoneNumber: string;
    tenantName: string;
    propertyName: string;
    checkInDate: string;
    checkOutDate: string;
    bookingId: string;
  }) {
    const message = `Hi ${tenantName}, your booking for ${propertyName} has been confirmed!\n\nCheck-in: ${checkInDate}\nCheck-out: ${checkOutDate}\nBooking ID: ${bookingId}`;

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Booking Confirmed",
    });
  }

  /**
   * Send property approval notification via WhatsApp
   */
  static async sendPropertyApproval({
    phoneNumber,
    ownerName,
    propertyName,
    propertyId,
  }: {
    phoneNumber: string;
    ownerName: string;
    propertyName: string;
    propertyId: string;
  }) {
    const message = `Hi ${ownerName}, great news! Your property "${propertyName}" has been approved and is now live on our platform. Property ID: ${propertyId}`;

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Property Approved",
    });
  }

  /**
   * Send emergency notification via WhatsApp
   */
  static async sendEmergencyAlert({
    phoneNumber,
    recipientName,
    alertMessage,
    propertyName,
    contactNumber,
  }: {
    phoneNumber: string;
    recipientName: string;
    alertMessage: string;
    propertyName?: string;
    contactNumber?: string;
  }) {
    let message = `🚨 URGENT ALERT 🚨\n\nHi ${recipientName}, ${alertMessage}`;

    if (propertyName) {
      message += `\n\nProperty: ${propertyName}`;
    }

    if (contactNumber) {
      message += `\n\nFor immediate assistance, call: ${contactNumber}`;
    }

    return await whatsappService.sendMessage({
      to: phoneNumber,
      message,
      title: "Emergency Alert",
    });
  }
}

export const whatsappTemplateFactory = new WhatsAppTemplateFactory();
