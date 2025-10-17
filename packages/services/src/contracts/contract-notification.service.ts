/**
 * Contract Notification Service
 * Handles automated notifications for renewals, amendments, and other contract events
 */

import { emailService } from "@kaa/email";
import { logger } from "@kaa/utils";
import { contractRenewalService } from "./contract-renewal.service";

export type NotificationTemplate = {
  subject: string;
  body: string;
  type: "email" | "sms" | "push";
};

export type NotificationData = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  contractId: string;
  propertyName: string;
  daysUntilExpiry: number;
  currentRent: number;
  expiryDate: string;
  role: "landlord" | "tenant";
};

export class ContractNotificationService {
  /**
   * Send renewal reminder notifications
   */
  async sendRenewalReminders(): Promise<{ sent: number; errors: string[] }> {
    try {
      // Get renewal notifications to send
      const notifications =
        await contractRenewalService.getRenewalNotifications([
          90, 60, 30, 7, 1,
        ]);

      let sent = 0;
      const errors: string[] = [];

      for (const notification of notifications) {
        try {
          // Send to landlord
          await this.sendRenewalNotification({
            ...notification,
            userId: notification.landlordId,
            role: "landlord",
            email: "",
            firstName: "",
            lastName: "",
          });

          // Send to tenants
          for (const tenantId of notification.tenantIds) {
            await this.sendRenewalNotification({
              ...notification,
              userId: tenantId,
              role: "tenant",
              email: "",
              firstName: "",
              lastName: "",
            });
          }

          sent++;
        } catch (error) {
          errors.push(
            `Contract ${notification.contractId}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      logger.info(`Sent ${sent} renewal reminder notifications`, {
        sent,
        errors: errors.length,
      });
      return { sent, errors };
    } catch (error) {
      logger.error("Error sending renewal reminders:", error);
      throw error;
    }
  }

  /**
   * Send amendment approval notification
   */
  async sendAmendmentNotification(
    contractId: string,
    amendmentId: string,
    status: "approved" | "rejected",
    recipientId: string,
    approverName: string,
    propertyName: string,
    amendmentReason: string
  ): Promise<void> {
    try {
      const template = this.getAmendmentNotificationTemplate(
        status,
        approverName,
        propertyName,
        amendmentReason
      );

      // In a real implementation, you would send the notification here
      // For now, we'll just log it
      logger.info("Amendment notification sent", {
        contractId,
        amendmentId,
        status,
        recipientId,
        template,
      });

      await emailService.sendEmail({
        to: recipientId,
        subject: template.subject,
        html: template.body,
      });
    } catch (error) {
      logger.error("Error sending amendment notification:", error);
      throw error;
    }
  }

  /**
   * Send contract signing reminder
   */
  async sendSigningReminder(
    contractId: string,
    recipientId: string,
    propertyName: string,
    daysOverdue: number
  ): Promise<void> {
    try {
      const template = this.getSigningReminderTemplate(
        propertyName,
        daysOverdue
      );

      logger.info("Signing reminder sent", {
        contractId,
        recipientId,
        template,
      });

      // Send email
      await emailService.sendEmail({
        to: recipientId,
        subject: template.subject,
        html: template.body,
      });
    } catch (error) {
      logger.error("Error sending signing reminder:", error);
      throw error;
    }
  }

  /**
   * Send contract expiration alert
   */
  async sendExpirationAlert(
    contractId: string,
    recipientId: string,
    propertyName: string,
    daysUntilExpiry: number
  ): Promise<void> {
    try {
      const template = this.getExpirationAlertTemplate(
        propertyName,
        daysUntilExpiry
      );

      logger.info("Expiration alert sent", {
        contractId,
        recipientId,
        template,
      });

      // Send email
      await emailService.sendEmail({
        to: recipientId,
        subject: template.subject,
        html: template.body,
      });
    } catch (error) {
      logger.error("Error sending expiration alert:", error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async sendRenewalNotification(data: NotificationData): Promise<void> {
    const template = this.getRenewalReminderTemplate(data);

    // Send email log
    logger.info("Renewal reminder sent", {
      userId: data.userId,
      contractId: data.contractId,
      daysUntilExpiry: data.daysUntilExpiry,
      role: data.role,
      template,
    });

    // Send email
    await emailService.sendEmail({
      to: data.email,
      subject: template.subject,
      html: template.body,
    });
  }

  private getRenewalReminderTemplate(
    data: NotificationData
  ): NotificationTemplate {
    const {
      firstName,
      propertyName,
      daysUntilExpiry,
      currentRent,
      expiryDate,
      role,
    } = data;

    let subject: string;
    let urgencyLevel: string;
    let actionText: string;

    // Determine urgency and messaging based on days until expiry
    if (daysUntilExpiry <= 1) {
      urgencyLevel = "URGENT";
      subject = `🚨 URGENT: Contract expires ${daysUntilExpiry === 0 ? "today" : "tomorrow"}`;
    } else if (daysUntilExpiry <= 7) {
      urgencyLevel = "HIGH";
      subject = `⚠️ Contract expires in ${daysUntilExpiry} days`;
    } else if (daysUntilExpiry <= 30) {
      urgencyLevel = "MEDIUM";
      subject = `📅 Contract renewal reminder - ${daysUntilExpiry} days remaining`;
    } else {
      urgencyLevel = "LOW";
      subject = `📋 Contract renewal notice - ${daysUntilExpiry} days until expiry`;
    }

    // Role-specific action text
    if (role === "landlord") {
      actionText =
        daysUntilExpiry <= 30
          ? "Please contact your tenant to discuss renewal options or prepare for move-out procedures."
          : "Consider reaching out to your tenant to discuss renewal preferences.";
    } else {
      actionText =
        daysUntilExpiry <= 30
          ? "Please contact your landlord to discuss renewal or provide notice of your intentions."
          : "Start considering your renewal options and discuss with your landlord.";
    }

    const body = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: ${this.getUrgencyColor(urgencyLevel)}; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">${urgencyLevel} - Contract Renewal Notice</h1>
				</div>
				
				<div style="padding: 30px; background-color: #f9f9f9;">
					<p style="font-size: 16px; margin-bottom: 20px;">Dear ${firstName},</p>
					
					<p style="font-size: 16px; line-height: 1.6;">
						This is a ${urgencyLevel.toLowerCase()} reminder that your tenancy agreement for 
						<strong>${propertyName}</strong> is set to expire in <strong>${daysUntilExpiry} days</strong> 
						on <strong>${new Date(expiryDate).toLocaleDateString()}</strong>.
					</p>
					
					<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #333; margin-top: 0;">Contract Details:</h3>
						<ul style="list-style: none; padding: 0;">
							<li style="padding: 5px 0;"><strong>Property:</strong> ${propertyName}</li>
							<li style="padding: 5px 0;"><strong>Current Rent:</strong> KES ${currentRent.toLocaleString()}</li>
							<li style="padding: 5px 0;"><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</li>
							<li style="padding: 5px 0;"><strong>Days Remaining:</strong> ${daysUntilExpiry}</li>
						</ul>
					</div>
					
					<p style="font-size: 16px; line-height: 1.6;">
						<strong>Action Required:</strong> ${actionText}
					</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/dashboard/contracts" 
						   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							View Contract Details
						</a>
					</div>
					
					<p style="font-size: 14px; color: #666; margin-top: 30px;">
						This is an automated reminder from Kaa SaaS. If you have any questions, please contact support.
					</p>
				</div>
			</div>
		`;

    return {
      subject,
      body,
      type: "email",
    };
  }

  private getAmendmentNotificationTemplate(
    status: "approved" | "rejected",
    approverName: string,
    propertyName: string,
    amendmentReason: string
  ): NotificationTemplate {
    const subject = `Contract Amendment ${status === "approved" ? "Approved" : "Rejected"} - ${propertyName}`;
    const statusColor = status === "approved" ? "#10B981" : "#EF4444";
    const statusIcon = status === "approved" ? "✅" : "❌";

    const body = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">${statusIcon} Amendment ${status === "approved" ? "Approved" : "Rejected"}</h1>
				</div>
				
				<div style="padding: 30px; background-color: #f9f9f9;">
					<p style="font-size: 16px; line-height: 1.6;">
						Your contract amendment request for <strong>${propertyName}</strong> has been 
						<strong>${status}</strong> by ${approverName}.
					</p>
					
					<div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3 style="color: #333; margin-top: 0;">Amendment Details:</h3>
						<p><strong>Reason:</strong> ${amendmentReason}</p>
						<p><strong>Status:</strong> ${status === "approved" ? "Approved and Applied" : "Rejected"}</p>
						<p><strong>Processed by:</strong> ${approverName}</p>
					</div>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/dashboard/contracts" 
						   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							View Contract Details
						</a>
					</div>
				</div>
			</div>
		`;

    return {
      subject,
      body,
      type: "email",
    };
  }

  private getSigningReminderTemplate(
    propertyName: string,
    daysOverdue: number
  ): NotificationTemplate {
    const subject = `Contract Signing Reminder - ${propertyName}`;

    const body = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: #F59E0B; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">📝 Contract Signing Reminder</h1>
				</div>
				
				<div style="padding: 30px; background-color: #f9f9f9;">
					<p style="font-size: 16px; line-height: 1.6;">
						You have a contract for <strong>${propertyName}</strong> that requires your signature.
						${daysOverdue > 0 ? `This contract has been pending for ${daysOverdue} days.` : ""}
					</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/dashboard/contracts/sign" 
						   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							Sign Contract Now
						</a>
					</div>
				</div>
			</div>
		`;

    return {
      subject,
      body,
      type: "email",
    };
  }

  private getExpirationAlertTemplate(
    propertyName: string,
    daysUntilExpiry: number
  ): NotificationTemplate {
    const subject = `Contract Expiring Soon - ${propertyName}`;

    const body = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<div style="background-color: #EF4444; color: white; padding: 20px; text-align: center;">
					<h1 style="margin: 0; font-size: 24px;">⚠️ Contract Expiration Alert</h1>
				</div>
				
				<div style="padding: 30px; background-color: #f9f9f9;">
					<p style="font-size: 16px; line-height: 1.6;">
						Your contract for <strong>${propertyName}</strong> will expire in <strong>${daysUntilExpiry} days</strong>.
						Please take action to avoid any disruption.
					</p>
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${process.env.FRONTEND_URL}/dashboard/contracts" 
						   style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
							Manage Contracts
						</a>
					</div>
				</div>
			</div>
		`;

    return {
      subject,
      body,
      type: "email",
    };
  }

  private getUrgencyColor(urgencyLevel: string): string {
    switch (urgencyLevel) {
      case "URGENT":
        return "#DC2626"; // Red
      case "HIGH":
        return "#EA580C"; // Orange
      case "MEDIUM":
        return "#D97706"; // Amber
      case "LOW":
        return "#059669"; // Green
      default:
        return "#6B7280"; // Gray
    }
  }
}

// Export singleton instance
export const contractNotificationService = new ContractNotificationService();
