import { whatsappService } from "@kaa/services";
import { logger } from "@kaa/utils";

export type WhatsAppTemplate = {
  name: string;
  category:
    | "booking"
    | "payment"
    | "property"
    | "maintenance"
    | "general"
    | "emergency";
  title: string;
  message: string;
  variables: string[];
  priority: "low" | "medium" | "high";
  useEmoji: boolean;
};

// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class WhatsAppNotificationTemplates {
  private static templates: Record<string, WhatsAppTemplate> = {
    // Booking Templates
    booking_confirmation: {
      name: "booking_confirmation",
      category: "booking",
      title: "🏠 Booking Confirmed",
      message:
        "Hi {{tenantName}}, your booking for {{propertyName}} has been confirmed!\n\n📅 Check-in: {{checkInDate}}\n📅 Check-out: {{checkOutDate}}\n🆔 Booking ID: {{bookingId}}\n\nWe look forward to hosting you!",
      variables: [
        "tenantName",
        "propertyName",
        "checkInDate",
        "checkOutDate",
        "bookingId",
      ],
      priority: "medium",
      useEmoji: true,
    },
    booking_cancellation: {
      name: "booking_cancellation",
      category: "booking",
      title: "❌ Booking Cancelled",
      message:
        "Hi {{tenantName}}, your booking for {{propertyName}} has been cancelled.\n\n🆔 Booking ID: {{bookingId}}\n💰 Refund will be processed within 3-5 business days.\n\nIf you have any questions, please contact us.",
      variables: ["tenantName", "propertyName", "bookingId"],
      priority: "high",
      useEmoji: true,
    },
    booking_reminder: {
      name: "booking_reminder",
      category: "booking",
      title: "🔔 Check-in Reminder",
      message:
        "Hi {{tenantName}}, this is a friendly reminder that your check-in at {{propertyName}} is tomorrow!\n\n📅 Check-in: {{checkInDate}}\n🕐 Time: {{checkInTime}}\n📍 Address: {{propertyAddress}}\n\nSafe travels!",
      variables: [
        "tenantName",
        "propertyName",
        "checkInDate",
        "checkInTime",
        "propertyAddress",
      ],
      priority: "medium",
      useEmoji: true,
    },

    // Payment Templates
    payment_confirmation: {
      name: "payment_confirmation",
      category: "payment",
      title: "✅ Payment Received",
      message:
        "Hi {{tenantName}}, we've received your payment of KES {{amount}} for {{propertyName}}.\n\n🧾 Receipt: {{receiptNumber}}\n📅 Date: {{paymentDate}}\n\nThank you for your prompt payment!",
      variables: [
        "tenantName",
        "amount",
        "propertyName",
        "receiptNumber",
        "paymentDate",
      ],
      priority: "medium",
      useEmoji: true,
    },
    payment_reminder: {
      name: "payment_reminder",
      category: "payment",
      title: "💰 Payment Reminder",
      message:
        "Hi {{tenantName}}, friendly reminder that your rent payment of KES {{amount}} for {{propertyName}} is due on {{dueDate}}.\n\n💳 Pay easily: {{paymentLink}}\n\nThank you!",
      variables: [
        "tenantName",
        "amount",
        "propertyName",
        "dueDate",
        "paymentLink",
      ],
      priority: "medium",
      useEmoji: true,
    },
    payment_overdue: {
      name: "payment_overdue",
      category: "payment",
      title: "🚨 Payment Overdue",
      message:
        "URGENT: Hi {{tenantName}}, your rent payment of KES {{amount}} for {{propertyName}} is {{daysOverdue}} days overdue.\n\n💳 Pay now: {{paymentLink}}\n\nLate fees may apply. Please pay immediately.",
      variables: [
        "tenantName",
        "amount",
        "propertyName",
        "daysOverdue",
        "paymentLink",
      ],
      priority: "high",
      useEmoji: true,
    },
    payment_failed: {
      name: "payment_failed",
      category: "payment",
      title: "❌ Payment Failed",
      message:
        "Hi {{tenantName}}, your payment of KES {{amount}} for {{propertyName}} failed.\n\n💳 Try again: {{paymentLink}}\n\nReason: {{failureReason}}\n\nContact us if you need assistance.",
      variables: [
        "tenantName",
        "amount",
        "propertyName",
        "paymentLink",
        "failureReason",
      ],
      priority: "high",
      useEmoji: true,
    },

    // Property Templates
    property_approved: {
      name: "property_approved",
      category: "property",
      title: "🎉 Property Approved",
      message:
        'Congratulations {{ownerName}}! Your property "{{propertyName}}" has been approved and is now live on our platform.\n\n🆔 Property ID: {{propertyId}}\n📊 Start attracting tenants today!\n\nGood luck with your listings!',
      variables: ["ownerName", "propertyName", "propertyId"],
      priority: "medium",
      useEmoji: true,
    },
    property_rejected: {
      name: "property_rejected",
      category: "property",
      title: "❌ Property Rejected",
      message:
        'Hi {{ownerName}}, unfortunately your property "{{propertyName}}" has been rejected.\n\n📝 Reason: {{rejectionReason}}\n\nPlease address the issues and resubmit. Contact us if you need help.',
      variables: ["ownerName", "propertyName", "rejectionReason"],
      priority: "medium",
      useEmoji: true,
    },
    new_inquiry: {
      name: "new_inquiry",
      category: "property",
      title: "📧 New Property Inquiry",
      message:
        "Hi {{ownerName}}, you have a new inquiry for {{propertyName}}!\n\n👤 From: {{inquirerName}}\n📞 Phone: {{inquirerPhone}}\n✉️ Email: {{inquirerEmail}}\n\nRespond quickly to secure the booking!",
      variables: [
        "ownerName",
        "propertyName",
        "inquirerName",
        "inquirerPhone",
        "inquirerEmail",
      ],
      priority: "high",
      useEmoji: true,
    },

    // Maintenance Templates
    maintenance_request: {
      name: "maintenance_request",
      category: "maintenance",
      title: "🔧 Maintenance Request",
      message:
        "Hi {{tenantName}}, we've received your maintenance request for {{propertyName}}.\n\n🆔 Request ID: {{requestId}}\n📝 Issue: {{issueDescription}}\n⏰ We'll address this within {{responseTime}}.\n\nThank you for reporting!",
      variables: [
        "tenantName",
        "propertyName",
        "requestId",
        "issueDescription",
        "responseTime",
      ],
      priority: "medium",
      useEmoji: true,
    },
    maintenance_update: {
      name: "maintenance_update",
      category: "maintenance",
      title: "🔄 Maintenance Update",
      message:
        "Hi {{tenantName}}, update on your maintenance request for {{propertyName}}:\n\n🆔 Request ID: {{requestId}}\n📊 Status: {{status}}\n📝 Notes: {{updateNotes}}\n\nThank you for your patience!",
      variables: [
        "tenantName",
        "propertyName",
        "requestId",
        "status",
        "updateNotes",
      ],
      priority: "medium",
      useEmoji: true,
    },
    maintenance_completed: {
      name: "maintenance_completed",
      category: "maintenance",
      title: "✅ Maintenance Completed",
      message:
        "Hi {{tenantName}}, great news! The maintenance work for {{propertyName}} has been completed.\n\n🆔 Request ID: {{requestId}}\n👨‍🔧 Completed by: {{technicianName}}\n📅 Date: {{completionDate}}\n\nPlease let us know if everything is working properly!",
      variables: [
        "tenantName",
        "propertyName",
        "requestId",
        "technicianName",
        "completionDate",
      ],
      priority: "medium",
      useEmoji: true,
    },

    // General Templates
    welcome: {
      name: "welcome",
      category: "general",
      title: "🎉 Welcome to Kaa!",
      message:
        "Hi {{firstName}}, welcome to Kaa! 🎉\n\nThank you for joining our platform. You can now:\n\n🏠 Browse properties\n💰 Make payments\n📞 Contact support\n\nGet started today and find your perfect home!",
      variables: ["firstName"],
      priority: "low",
      useEmoji: true,
    },
    document_shared: {
      name: "document_shared",
      category: "general",
      title: "📄 Document Shared",
      message:
        "Hi {{recipientName}}, a new document has been shared with you.\n\n📂 Document: {{documentName}}\n👤 Shared by: {{senderName}}\n🔗 Access: {{documentLink}}\n\nPlease review at your earliest convenience.",
      variables: [
        "recipientName",
        "documentName",
        "senderName",
        "documentLink",
      ],
      priority: "medium",
      useEmoji: true,
    },
    inspection_scheduled: {
      name: "inspection_scheduled",
      category: "general",
      title: "📋 Inspection Scheduled",
      message:
        "Hi {{ownerName}}, an inspection has been scheduled for {{propertyName}}.\n\n📅 Date: {{inspectionDate}}\n🕐 Time: {{inspectionTime}}\n👤 Inspector: {{inspectorName}}\n\nPlease ensure the property is accessible.",
      variables: [
        "ownerName",
        "propertyName",
        "inspectionDate",
        "inspectionTime",
        "inspectorName",
      ],
      priority: "high",
      useEmoji: true,
    },

    // Emergency Templates
    emergency_alert: {
      name: "emergency_alert",
      category: "emergency",
      title: "🚨 EMERGENCY ALERT",
      message:
        "🚨 URGENT ALERT 🚨\n\nHi {{recipientName}}, {{alertMessage}}\n\n🏠 Property: {{propertyName}}\n📞 Emergency Contact: {{emergencyContact}}\n\nPlease take immediate action or contact emergency services if needed.",
      variables: [
        "recipientName",
        "alertMessage",
        "propertyName",
        "emergencyContact",
      ],
      priority: "high",
      useEmoji: true,
    },
    security_breach: {
      name: "security_breach",
      category: "emergency",
      title: "🔒 Security Alert",
      message:
        "🔒 SECURITY ALERT\n\nHi {{recipientName}}, we detected unusual activity on your account.\n\n⏰ Time: {{alertTime}}\n📱 Device: {{deviceInfo}}\n🌍 Location: {{location}}\n\nIf this wasn't you, please contact us immediately and change your password.",
      variables: ["recipientName", "alertTime", "deviceInfo", "location"],
      priority: "high",
      useEmoji: true,
    },
  };

  /**
   * Get a template by name
   */
  static getTemplate(name: string): WhatsAppTemplate | null {
    return WhatsAppNotificationTemplates.templates[name] || null;
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): Record<string, WhatsAppTemplate> {
    return WhatsAppNotificationTemplates.templates;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(
    category: WhatsAppTemplate["category"]
  ): WhatsAppTemplate[] {
    return Object.values(WhatsAppNotificationTemplates.templates).filter(
      (template) => template.category === category
    );
  }

  /**
   * Send a templated WhatsApp message
   */
  static async sendTemplatedMessage(
    templateName: string,
    phoneNumber: string,
    variables: Record<string, string>
  ): Promise<any> {
    try {
      const template = WhatsAppNotificationTemplates.getTemplate(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      // Replace variables in title and message
      let title = template.title;
      let message = template.message;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        title = title.replace(new RegExp(placeholder, "g"), value);
        message = message.replace(new RegExp(placeholder, "g"), value);
      }

      // Validate that all variables have been replaced
      const remainingPlaceholders = message.match(/\{\{[^}]+\}\}/g);
      if (remainingPlaceholders) {
        logger.warn("Template has unreplaced variables", {
          templateName,
          remainingPlaceholders,
        });
      }

      // Send the message
      const result = await whatsappService.sendMessage({
        to: phoneNumber,
        title,
        message,
      });

      logger.info("Templated WhatsApp message sent", {
        templateName,
        phoneNumber,
        success: result.success,
      });

      return result;
    } catch (error) {
      logger.error("Error sending templated WhatsApp message:", error);
      throw error;
    }
  }

  /**
   * Validate template variables
   */
  static validateTemplate(
    templateName: string,
    variables: Record<string, string>
  ): {
    valid: boolean;
    missingVariables: string[];
    extraVariables: string[];
  } {
    const template = WhatsAppNotificationTemplates.getTemplate(templateName);
    if (!template) {
      return {
        valid: false,
        missingVariables: [],
        extraVariables: [],
      };
    }

    const providedVars = new Set(Object.keys(variables));
    const requiredVars = new Set(template.variables);

    const missingVariables = template.variables.filter(
      (v) => !providedVars.has(v)
    );
    const extraVariables = Object.keys(variables).filter(
      (v) => !requiredVars.has(v)
    );

    return {
      valid: missingVariables.length === 0,
      missingVariables,
      extraVariables,
    };
  }

  /**
   * Add a custom template
   */
  static addTemplate(template: WhatsAppTemplate): void {
    WhatsAppNotificationTemplates.templates[template.name] = template;
  }

  /**
   * Remove a template
   */
  static removeTemplate(name: string): boolean {
    if (WhatsAppNotificationTemplates.templates[name]) {
      delete WhatsAppNotificationTemplates.templates[name];
      return true;
    }
    return false;
  }
}

export { WhatsAppNotificationTemplates as WhatsAppTemplates };
