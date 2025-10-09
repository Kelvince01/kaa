import { Notification, Property, Tenant, User } from "@kaa/models";
import {
  type IBooking,
  type IPayment,
  type IProperty,
  type IReview,
  NotificationPriority,
  NotificationType,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
// import { WhatsAppTemplates } from "./whatsapp-templates";
import type { Types } from "mongoose";
import { notificationService } from "./notification.service";
import { NotificationUtils } from "./notification.utils";

// Create a notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data: any = {},
  channel?: string,
  priority?: string,
  category?: string,
  expiresAt?: Date,
  scheduledFor?: Date,
  sentAt?: Date
) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      data,
      channel,
      priority,
      category,
      expiresAt,
      scheduledFor,
      sentAt,
    });

    await notification.save();

    // Send real-time notification via WebSocket
    // wsManager.sendNotification(userId, notification);
    logger.info("Notification created and sent via WebSocket", {
      userId,
      notificationId: notification._id,
    });

    return notification;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw error;
  }
};

// Create notifications for booking events
export const createBookingNotification = async (
  booking: IBooking,
  type: NotificationType
) => {
  try {
    const property = await Property.findById(booking.property)
      .populate("landlord", "firstName lastName phone")
      .populate("agent", "firstName lastName phone");

    const tenant = await Tenant.findById(booking.tenant);

    if (!(property && tenant)) {
      logger.warn("Missing property or tenant for booking notification", {
        bookingId: booking._id,
        propertyId: booking.property,
        tenantId: booking.tenant,
      });
      return;
    }

    // Determine WhatsApp template and variables based on notification type
    let whatsappTemplate = "";
    let templateVariables: Record<string, string> = {};

    switch (type) {
      case NotificationType.BOOKING_REQUEST:
        whatsappTemplate = "";
        break;
      case NotificationType.BOOKING_CONFIRMED:
        whatsappTemplate = "booking_confirmation";
        templateVariables = {
          tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          propertyName: property.title,
          checkInDate: booking.checkInDate?.toLocaleDateString() || "TBD",
          checkOutDate: booking.checkOutDate?.toLocaleDateString() || "TBD",
          bookingId: (booking._id as Types.ObjectId).toString(),
        };
        break;
      case NotificationType.BOOKING_CANCELLED:
        whatsappTemplate = "booking_cancellation";
        templateVariables = {
          tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          propertyName: property.title,
          bookingId: (booking._id as Types.ObjectId).toString(),
        };
        break;
      default:
        break;
    }

    // Send notification to tenant using smart notification system
    await NotificationUtils.sendSmartNotification({
      userId: (booking?.tenant as mongoose.Types.ObjectId).toString(),
      type:
        type === NotificationType.BOOKING_CONFIRMED
          ? NotificationType.BOOKING_CONFIRMED
          : type === NotificationType.BOOKING_CANCELLED
            ? NotificationType.BOOKING_CANCELLED
            : NotificationType.SYSTEM,
      title: getTitleForBookingType(type, "tenant"),
      message: getMessageForBookingType(type, "tenant", property, tenant),
      templateName: whatsappTemplate,
      templateVariables,
      priority:
        type === NotificationType.BOOKING_CANCELLED
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      data: {
        bookingId: booking._id,
        propertyId: property._id,
      },
    });

    // Send notification to property owner
    await NotificationUtils.sendSmartNotification({
      userId: (property?.landlord as mongoose.Types.ObjectId).toString(),
      type:
        type === NotificationType.BOOKING_CONFIRMED
          ? NotificationType.BOOKING_CONFIRMED
          : NotificationType.SYSTEM,
      title: getTitleForBookingType(type, "owner"),
      message: getMessageForBookingType(type, "owner", property, tenant),
      priority: NotificationPriority.MEDIUM,
      data: {
        bookingId: booking._id,
        propertyId: property._id,
        tenantId: tenant._id,
      },
    });

    // If there's an agent, notify them too
    if (property?.agent) {
      await NotificationUtils.sendSmartNotification({
        userId: (property.agent as mongoose.Types.ObjectId).toString(),
        type:
          type === NotificationType.BOOKING_CONFIRMED
            ? NotificationType.BOOKING_CONFIRMED
            : NotificationType.SYSTEM,
        title: getTitleForBookingType(type, "agent"),
        message: getMessageForBookingType(type, "agent", property, tenant),
        priority: NotificationPriority.MEDIUM,
        data: {
          bookingId: booking._id,
          propertyId: property._id,
          tenantId: tenant._id,
        },
      });
    }
  } catch (error) {
    logger.error("Error creating booking notification:", error);
  }
};

// Create notifications for payment events
export const createPaymentNotification = async (
  payment: IPayment,
  type: NotificationType
) => {
  try {
    const property = await Property.findById(payment.property);
    const tenant = await Tenant.findById(payment.tenant);

    if (!(property && tenant)) {
      logger.warn("Missing property or tenant for payment notification", {
        paymentId: payment._id,
        propertyId: payment.property,
        tenantId: payment.tenant,
      });
      return;
    }

    // Determine WhatsApp template and variables
    let whatsappTemplate = "";
    let templateVariables: Record<string, string> = {};

    switch (type) {
      case NotificationType.PAYMENT_RECEIVED:
        whatsappTemplate = "payment_confirmation";
        templateVariables = {
          tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          amount: payment.amount.toLocaleString(),
          propertyName: property.title,
          receiptNumber:
            payment.referenceNumber ||
            (payment._id as Types.ObjectId).toString(),
          paymentDate: new Date().toLocaleDateString(),
        };
        break;
      case NotificationType.PAYMENT_FAILED:
        whatsappTemplate = "payment_failed";
        templateVariables = {
          tenantName: `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`,
          amount: payment.amount.toLocaleString(),
          propertyName: property.title,
          paymentLink: `${process.env.CLIENT_URL}/payments/${payment._id}`,
          failureReason: payment.failureReason || "Unknown error",
        };
        break;
      default:
        break;
    }

    // Send notification to tenant
    await NotificationUtils.sendSmartNotification({
      userId: (payment.tenant as mongoose.Types.ObjectId).toString(),
      type:
        type === NotificationType.PAYMENT_RECEIVED
          ? NotificationType.BOOKING_CONFIRMED
          : NotificationType.PAYMENT_FAILED,
      title: getTitleForPaymentType(type, "tenant"),
      message: getMessageForPaymentType(type, "tenant", property, payment),
      templateName: whatsappTemplate,
      templateVariables,
      priority:
        type === NotificationType.PAYMENT_FAILED
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      data: {
        paymentId: payment._id,
        propertyId: property._id,
        bookingId: payment.booking,
      },
    });

    // Send notification to property owner
    await NotificationUtils.sendSmartNotification({
      userId: (payment.landlord as mongoose.Types.ObjectId).toString(),
      type:
        type === NotificationType.PAYMENT_RECEIVED
          ? NotificationType.BOOKING_CONFIRMED
          : NotificationType.PAYMENT_FAILED,
      title: getTitleForPaymentType(type, "owner"),
      message: getMessageForPaymentType(type, "owner", property, payment),
      priority: NotificationPriority.MEDIUM,
      data: {
        paymentId: payment._id,
        propertyId: property._id,
        bookingId: payment.booking,
        tenantId: payment.tenant,
      },
    });
  } catch (error) {
    logger.error("Error creating payment notification:", error);
  }
};

// Create notification for property approval/rejection
export const createPropertyNotification = async (
  property: IProperty,
  type: NotificationType
) => {
  try {
    const owner = await User.findById(property.landlord);
    if (!owner) {
      logger.warn("Missing property owner for property notification", {
        propertyId: property._id,
        landlordId: property.landlord,
      });
      return;
    }

    // Determine WhatsApp template and variables
    let whatsappTemplate = "";
    let templateVariables: Record<string, string> = {};

    switch (type) {
      case NotificationType.PROPERTY_APPROVED:
        whatsappTemplate = "property_approved";
        templateVariables = {
          ownerName: `${owner.profile.firstName} ${owner.profile.lastName}`,
          propertyName: property.title,
          propertyId: (property._id as Types.ObjectId).toString(),
        };
        break;
      case NotificationType.PROPERTY_REJECTED:
        whatsappTemplate = "property_rejected";
        templateVariables = {
          ownerName: `${owner.profile.firstName} ${owner.profile.lastName}`,
          propertyName: property.title,
          rejectionReason:
            property.rejectionReason || "Please review the requirements",
        };
        break;
      default:
        break;
    }

    // Send notification to property owner
    await NotificationUtils.sendSmartNotification({
      userId: (property?.landlord as mongoose.Types.ObjectId).toString(),
      type:
        type === NotificationType.PROPERTY_APPROVED
          ? NotificationType.BOOKING_CONFIRMED
          : NotificationType.PAYMENT_FAILED,
      title: getTitleForPropertyType(type),
      message: getMessageForPropertyType(type, property),
      templateName: whatsappTemplate,
      templateVariables,
      priority: NotificationPriority.MEDIUM,
      data: { propertyId: property._id },
    });

    // If there's an agent, notify them too
    if (property.agent) {
      await NotificationUtils.sendSmartNotification({
        userId: (property?.agent as mongoose.Types.ObjectId).toString(),
        type:
          type === NotificationType.PROPERTY_APPROVED
            ? NotificationType.BOOKING_CONFIRMED
            : NotificationType.PAYMENT_FAILED,
        title: getTitleForPropertyType(type),
        message: getMessageForPropertyType(type, property),
        priority: NotificationPriority.MEDIUM,
        data: { propertyId: property._id },
      });
    }
  } catch (error) {
    logger.error("Error creating property notification:", error);
  }
};

// Create notification for new review
export const createReviewNotification = async (review: IReview) => {
  try {
    const property = await Property.findById(review.property);
    const reviewer = await User.findById(review.reviewer);

    if (!(property && reviewer)) {
      logger.warn("Missing property or reviewer for review notification", {
        reviewId: (review._id as Types.ObjectId).toString(),
        propertyId: review.property,
        reviewerId: review.reviewer,
      });
      return;
    }

    // Send notification to property owner
    await NotificationUtils.sendSmartNotification({
      userId: (property?.landlord as mongoose.Types.ObjectId).toString(),
      type: NotificationType.SYSTEM,
      title: "New Review Received",
      message: `${reviewer?.profile.firstName} ${reviewer?.profile.lastName} has left a ${review.rating}-star review for your property "${property?.title}".`,
      priority: NotificationPriority.LOW,
      data: {
        reviewId: review._id,
        propertyId: property?._id,
        reviewerId: reviewer?._id,
      },
    });

    // If there's an agent, notify them too
    if (property?.agent) {
      await NotificationUtils.sendSmartNotification({
        userId: (property.agent as mongoose.Types.ObjectId).toString(),
        type: NotificationType.SYSTEM,
        title: "New Review Received",
        message: `${reviewer?.profile.firstName} ${reviewer?.profile.lastName} has left a ${review.rating}-star review for the property "${property?.title}".`,
        priority: NotificationPriority.LOW,
        data: {
          reviewId: review._id,
          propertyId: property?._id,
          reviewerId: reviewer?._id,
        },
      });
    }
  } catch (error) {
    logger.error("Error creating review notification:", error);
  }
};

// Helper functions for generating titles and messages
function getTitleForBookingType(
  type: NotificationType,
  recipient: "tenant" | "owner" | "agent"
): string {
  switch (type) {
    case NotificationType.BOOKING_REQUEST:
      return recipient === "tenant"
        ? "Booking Request Submitted"
        : "New Booking Request";
    case NotificationType.BOOKING_CONFIRMED:
      return recipient === "tenant" ? "Booking Confirmed" : "Booking Confirmed";
    case NotificationType.BOOKING_CANCELLED:
      return recipient === "tenant" ? "Booking Cancelled" : "Booking Cancelled";
    default:
      return "Booking Update";
  }
}

function getMessageForBookingType(
  type: NotificationType,
  recipient: "tenant" | "owner" | "agent",
  property: any,
  tenant: any
): string {
  switch (type) {
    case NotificationType.BOOKING_REQUEST:
      return recipient === "tenant"
        ? `Your booking request for ${property?.title} has been submitted and is awaiting confirmation.`
        : `${tenant?.firstName} ${tenant?.lastName} has requested to book ${property?.title}.`;
    case NotificationType.BOOKING_CONFIRMED:
      return recipient === "tenant"
        ? `Your booking for ${property?.title} has been confirmed.`
        : `You have confirmed ${tenant?.firstName} ${tenant?.lastName}'s booking for ${property?.title}.`;
    case NotificationType.BOOKING_CANCELLED:
      return recipient === "tenant"
        ? `Your booking for ${property?.title} has been cancelled.`
        : `The booking for ${property?.title} by ${tenant?.firstName} ${tenant?.lastName} has been cancelled.`;
    default:
      return "Booking status updated.";
  }
}

function getTitleForPaymentType(
  type: NotificationType,
  recipient: "tenant" | "owner"
): string {
  switch (type) {
    case NotificationType.PAYMENT_RECEIVED:
      return recipient === "tenant" ? "Payment Successful" : "Payment Received";
    case NotificationType.PAYMENT_FAILED:
      return recipient === "tenant" ? "Payment Failed" : "Payment Failed";
    default:
      return "Payment Update";
  }
}

function getMessageForPaymentType(
  type: NotificationType,
  recipient: "tenant" | "owner",
  property: any,
  payment: any
): string {
  switch (type) {
    case NotificationType.PAYMENT_RECEIVED:
      return recipient === "tenant"
        ? `Your payment of KES ${payment.amount.toLocaleString()} for ${property?.title} has been received.`
        : `You have received a payment of KES ${payment.amount.toLocaleString()} for ${property?.title}.`;
    case NotificationType.PAYMENT_FAILED:
      return recipient === "tenant"
        ? `Your payment of KES ${payment.amount.toLocaleString()} for ${property?.title} has failed.`
        : `A payment of KES ${payment.amount.toLocaleString()} for ${property?.title} has failed.`;
    default:
      return "Payment status updated.";
  }
}

function getTitleForPropertyType(type: NotificationType): string {
  switch (type) {
    case NotificationType.PROPERTY_APPROVED:
      return "Property Approved";
    case NotificationType.PROPERTY_REJECTED:
      return "Property Rejected";
    default:
      return "Property Update";
  }
}

function getMessageForPropertyType(
  type: NotificationType,
  property: any
): string {
  switch (type) {
    case NotificationType.PROPERTY_APPROVED:
      return `Your property "${property.title}" has been approved and is now listed on the platform.`;
    case NotificationType.PROPERTY_REJECTED:
      return `Your property "${property.title}" has been rejected. Please review the requirements and resubmit.`;
    default:
      return "Property status updated.";
  }
}

/**
 * Send payment due notification
 */
export const sendPaymentDueNotification = async (
  payment: any
): Promise<void> => {
  try {
    const property = await Property.findById(payment.property);
    const tenant = await User.findById(payment.tenant);

    if (!(tenant && property)) {
      logger.warn("Missing tenant or property for payment due notification", {
        paymentId: payment._id,
        tenantId: payment.tenant,
        propertyId: payment.property,
      });
      return;
    }

    await notificationService.sendNotification(
      (tenant._id as Types.ObjectId).toString(),
      {
        type: "warning",
        title: "Payment Due",
        message: `Your payment of KES ${payment.amount.toLocaleString()} for ${property.title} is due soon.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          paymentId: payment._id,
          propertyId: property._id,
          amount: payment.amount,
          dueDate: payment.dueDate,
        },
      },
      payment.memberId?.toString()
    );

    logger.info(`Payment due notification sent for payment ${payment._id}`);
  } catch (error) {
    logger.error("Error sending payment due notification:", error);
    throw error;
  }
};

/**
 * Send payment failure notification
 */
export const sendPaymentFailureNotification = async (
  recurringPayment: any,
  error: string
): Promise<void> => {
  try {
    const property = await Property.findById(recurringPayment.property);
    const tenant = await User.findById(recurringPayment.tenant);

    if (!(tenant && property)) {
      logger.warn(
        "Missing tenant or property for payment failure notification",
        {
          recurringPaymentId: recurringPayment._id,
          tenantId: recurringPayment.tenant,
          propertyId: recurringPayment.property,
        }
      );
      return;
    }

    await notificationService.sendNotification(
      (tenant._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Payment Failed",
        message: `Your recurring payment of KES ${recurringPayment.amount.toLocaleString()} for ${property.title} has failed. Error: ${error}`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recurringPaymentId: recurringPayment._id,
          propertyId: property._id,
          amount: recurringPayment.amount,
          error,
        },
      },
      recurringPayment.memberId?.toString()
    );

    logger.info(
      `Payment failure notification sent for recurring payment ${recurringPayment._id}`
    );
  } catch (error) {
    logger.error("Error sending payment failure notification:", error);
    throw error;
  }
};

/**
 * Send payment reminder notification
 */
export const sendPaymentReminderNotification = async (
  recurringPayment: any,
  daysUntilDue: number
): Promise<void> => {
  try {
    const property = await Property.findById(recurringPayment.property);
    const tenant = await User.findById(recurringPayment.tenant);

    if (!(tenant && property)) {
      logger.warn(
        "Missing tenant or property for payment reminder notification",
        {
          recurringPaymentId: recurringPayment._id,
          tenantId: recurringPayment.tenant,
          propertyId: recurringPayment.property,
        }
      );
      return;
    }

    const urgencyLevel =
      daysUntilDue <= 1 ? "high" : daysUntilDue <= 3 ? "medium" : "low";
    const messageType = daysUntilDue <= 1 ? "error" : "warning";

    await notificationService.sendNotification(
      (tenant._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: `Payment Reminder - ${daysUntilDue} days left`,
        message: `Reminder: Your payment of KES ${recurringPayment.amount.toLocaleString()} for ${property.title} is due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recurringPaymentId: recurringPayment._id,
          propertyId: property._id,
          amount: recurringPayment.amount,
          daysUntilDue,
          urgencyLevel,
        },
      },
      recurringPayment.memberId?.toString()
    );

    logger.info(
      `Payment reminder notification sent for recurring payment ${recurringPayment._id}, due in ${daysUntilDue} days`
    );
  } catch (error) {
    logger.error("Error sending payment reminder notification:", error);
    throw error;
  }
};

/**
 * Send late fee notification
 */
export const sendLateFeeNotification = async (
  payment: any,
  lateFeePayment: any,
  daysLate: number
): Promise<void> => {
  try {
    const property = await Property.findById(payment.property);
    const tenant = await User.findById(payment.tenant);

    if (!(tenant && property)) {
      logger.warn("Missing tenant or property for late fee notification", {
        paymentId: payment._id,
        tenantId: payment.tenant,
        propertyId: payment.property,
      });
      return;
    }

    await notificationService.sendNotification(
      (tenant._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Late Fee Applied",
        message: `A late fee of KES ${lateFeePayment.amount.toLocaleString()} has been applied to your account for ${property.title}. Your payment was ${daysLate} days late.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          paymentId: payment._id,
          lateFeePaymentId: lateFeePayment._id,
          propertyId: property._id,
          lateFeeAmount: lateFeePayment.amount,
          daysLate,
        },
      },
      payment.memberId?.toString()
    );

    logger.info(
      `Late fee notification sent for payment ${payment._id}, ${daysLate} days late`
    );
  } catch (error) {
    logger.error("Error sending late fee notification:", error);
    throw error;
  }
};

/**
 * Send claim submission notification
 */
export const sendClaimSubmissionNotification = async (
  claim: any
): Promise<void> => {
  try {
    const property = await Property.findById(claim.property);
    const claimant = await User.findById(claim.claimant);

    if (!claimant) {
      logger.warn("Missing claimant for claim submission notification", {
        claimId: claim._id,
        claimantId: claim.claimant,
      });
      return;
    }

    await notificationService.sendNotification(
      (claimant._id as Types.ObjectId).toString(),
      {
        type: "info",
        title: "Claim Submitted Successfully",
        message: `Your insurance claim ${claim.claimNumber} has been submitted successfully${property ? ` for ${property.title}` : ""}. We will review and get back to you soon.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          claimId: claim._id,
          claimNumber: claim.claimNumber,
          propertyId: property?._id,
          submissionDate: claim.createdAt,
        },
      },
      claim.memberId?.toString()
    );

    logger.info(
      `Claim submission notification sent for claim ${claim.claimNumber}`
    );
  } catch (error) {
    logger.error("Error sending claim submission notification:", error);
    throw error;
  }
};

/**
 * Send claim status update notification
 */
export const sendClaimStatusUpdateNotification = async (
  claim: any
): Promise<void> => {
  try {
    const property = await Property.findById(claim.property);
    const claimant = await User.findById(claim.claimant);

    if (!claimant) {
      logger.warn("Missing claimant for claim status update notification", {
        claimId: claim._id,
        claimantId: claim.claimant,
      });
      return;
    }

    const statusMessages = {
      pending: "Your claim is pending review",
      under_review: "Your claim is currently under review",
      approved: "Your claim has been approved",
      rejected: "Your claim has been rejected",
      settled: "Your claim has been settled",
    };

    const messageType =
      claim.status === "approved" || claim.status === "settled"
        ? "success"
        : claim.status === "rejected"
          ? "error"
          : "info";

    await notificationService.sendNotification(
      (claimant._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: "Claim Status Update",
        message: `Claim ${claim.claimNumber}: ${statusMessages[claim.status as keyof typeof statusMessages] || `Status updated to ${claim.status}`}${property ? ` for ${property.title}` : ""}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          claimId: claim._id,
          claimNumber: claim.claimNumber,
          propertyId: property?._id,
          status: claim.status,
          updateDate: new Date(),
        },
      },
      claim.memberId?.toString()
    );

    logger.info(
      `Claim status update notification sent for claim ${claim.claimNumber}`
    );
  } catch (error) {
    logger.error("Error sending claim status update notification:", error);
    throw error;
  }
};

/**
 * Send claim approval notification
 */
export const sendClaimApprovalNotification = async (
  claim: any
): Promise<void> => {
  try {
    const property = await Property.findById(claim.property);
    const claimant = await User.findById(claim.claimant);

    if (!claimant) {
      logger.warn("Missing claimant for claim approval notification", {
        claimId: claim._id,
        claimantId: claim.claimant,
      });
      return;
    }

    await notificationService.sendNotification(
      (claimant._id as Types.ObjectId).toString(),
      {
        type: "success",
        title: "Claim Approved!",
        message: `Great news! Your insurance claim ${claim.claimNumber}${property ? ` for ${property.title}` : ""} has been approved for KES ${claim.approvedAmount?.toLocaleString() || claim.claimAmount?.toLocaleString()}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          claimId: claim._id,
          claimNumber: claim.claimNumber,
          propertyId: property?._id,
          approvedAmount: claim.approvedAmount || claim.claimAmount,
          approvalDate: claim.approvedAt || new Date(),
        },
      },
      claim.memberId?.toString()
    );

    logger.info(
      `Claim approval notification sent for claim ${claim.claimNumber}`
    );
  } catch (error) {
    logger.error("Error sending claim approval notification:", error);
    throw error;
  }
};

/**
 * Send claim rejection notification
 */
export const sendClaimRejectionNotification = async (
  claim: any,
  reason: string
): Promise<void> => {
  try {
    const property = await Property.findById(claim.property);
    const claimant = await User.findById(claim.claimant);

    if (!claimant) {
      logger.warn("Missing claimant for claim rejection notification", {
        claimId: claim._id,
        claimantId: claim.claimant,
      });
      return;
    }

    await notificationService.sendNotification(
      (claimant._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Claim Rejected",
        message: `Your insurance claim ${claim.claimNumber}${property ? ` for ${property.title}` : ""} has been rejected. Reason: ${reason}`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          claimId: claim._id,
          claimNumber: claim.claimNumber,
          propertyId: property?._id,
          rejectionReason: reason,
          rejectionDate: claim.rejectedAt || new Date(),
        },
      },
      claim.memberId?.toString()
    );

    logger.info(
      `Claim rejection notification sent for claim ${claim.claimNumber}: ${reason}`
    );
  } catch (error) {
    logger.error("Error sending claim rejection notification:", error);
    throw error;
  }
};

/**
 * Send claim settlement notification
 */
export const sendClaimSettlementNotification = async (
  claim: any
): Promise<void> => {
  try {
    const property = await Property.findById(claim.property);
    const claimant = await User.findById(claim.claimant);

    if (!claimant) {
      logger.warn("Missing claimant for claim settlement notification", {
        claimId: claim._id,
        claimantId: claim.claimant,
      });
      return;
    }

    await notificationService.sendNotification(
      (claimant._id as Types.ObjectId).toString(),
      {
        type: "success",
        title: "Claim Settled",
        message: `Your insurance claim ${claim.claimNumber}${property ? ` for ${property.title}` : ""} has been settled. Payment of KES ${claim.settledAmount?.toLocaleString() || claim.approvedAmount?.toLocaleString()} has been processed.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          claimId: claim._id,
          claimNumber: claim.claimNumber,
          propertyId: property?._id,
          settledAmount: claim.settledAmount || claim.approvedAmount,
          settlementDate: claim.settledAt || new Date(),
        },
      },
      claim.memberId?.toString()
    );

    logger.info(
      `Claim settlement notification sent for claim ${claim.claimNumber}`
    );
  } catch (error) {
    logger.error("Error sending claim settlement notification:", error);
    throw error;
  }
};

/**
 * Send policy expiry reminder
 */
export const sendPolicyExpiryReminder = async (
  policy: any,
  daysUntilExpiry: number
): Promise<void> => {
  try {
    const property = await Property.findById(policy.property);
    const policyholder = await User.findById(policy.policyholder);

    if (!policyholder) {
      logger.warn("Missing policyholder for policy expiry reminder", {
        policyId: policy._id,
        policyholderId: policy.policyholder,
      });
      return;
    }

    const urgencyLevel =
      daysUntilExpiry <= 7 ? "high" : daysUntilExpiry <= 30 ? "medium" : "low";
    const messageType = daysUntilExpiry <= 7 ? "error" : "warning";

    await notificationService.sendNotification(
      (policyholder._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: `Policy Expiry Reminder - ${daysUntilExpiry} days left`,
        message: `Your insurance policy ${policy.policyNumber}${property ? ` for ${property.title}` : ""} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? "s" : ""}. Please renew to maintain coverage.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          propertyId: property?._id,
          expiryDate: policy.expiryDate,
          daysUntilExpiry,
          urgencyLevel,
        },
      },
      policy.memberId?.toString()
    );

    logger.info(
      `Policy expiry reminder sent for policy ${policy.policyNumber}, expires in ${daysUntilExpiry} days`
    );
  } catch (error) {
    logger.error("Error sending policy expiry reminder:", error);
    throw error;
  }
};

/**
 * Send payment overdue notification
 */
export const sendPaymentOverdueNotification = async (
  policy: any,
  daysOverdue: number
): Promise<void> => {
  try {
    const property = await Property.findById(policy.property);
    const policyholder = await User.findById(policy.policyholder);

    if (!policyholder) {
      logger.warn("Missing policyholder for payment overdue notification", {
        policyId: policy._id,
        policyholderId: policy.policyholder,
      });
      return;
    }

    await notificationService.sendNotification(
      (policyholder._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Payment Overdue",
        message: `URGENT: Your insurance policy payment for ${policy.policyNumber}${property ? ` (${property.title})` : ""} is ${daysOverdue} days overdue. Please pay immediately to avoid policy suspension.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          propertyId: property?._id,
          daysOverdue,
          amount: policy.premiumAmount,
        },
      },
      policy.memberId?.toString()
    );

    logger.info(
      `Payment overdue notification sent for policy ${policy.policyNumber}, ${daysOverdue} days overdue`
    );
  } catch (error) {
    logger.error("Error sending payment overdue notification:", error);
    throw error;
  }
};

/**
 * Send policy renewal confirmation
 */
export const sendPolicyRenewalConfirmation = async (
  policy: any
): Promise<void> => {
  try {
    const property = await Property.findById(policy.property);
    const policyholder = await User.findById(policy.policyholder);

    if (!policyholder) {
      logger.warn("Missing policyholder for policy renewal confirmation", {
        policyId: policy._id,
        policyholderId: policy.policyholder,
      });
      return;
    }

    await notificationService.sendNotification(
      (policyholder._id as Types.ObjectId).toString(),
      {
        type: "success",
        title: "Policy Renewed Successfully",
        message: `Your insurance policy ${policy.policyNumber}${property ? ` for ${property.title}` : ""} has been renewed successfully. Coverage continues until ${new Date(policy.expiryDate).toLocaleDateString()}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          propertyId: property?._id,
          renewalDate: policy.renewedAt || new Date(),
          newExpiryDate: policy.expiryDate,
        },
      },
      policy.memberId?.toString()
    );

    logger.info(
      `Policy renewal confirmation sent for policy ${policy.policyNumber}`
    );
  } catch (error) {
    logger.error("Error sending policy renewal confirmation:", error);
    throw error;
  }
};

/**
 * Send policy cancellation notification
 */
export const sendPolicyCancellationNotification = async (
  policy: any,
  reason: string
): Promise<void> => {
  try {
    const property = await Property.findById(policy.property);
    const policyholder = await User.findById(policy.policyholder);

    if (!policyholder) {
      logger.warn("Missing policyholder for policy cancellation notification", {
        policyId: policy._id,
        policyholderId: policy.policyholder,
      });
      return;
    }

    await notificationService.sendNotification(
      (policyholder._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Policy Cancelled",
        message: `Your insurance policy ${policy.policyNumber}${property ? ` for ${property.title}` : ""} has been cancelled. Reason: ${reason}`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          propertyId: property?._id,
          cancellationReason: reason,
          cancellationDate: policy.cancelledAt || new Date(),
        },
      },
      policy.memberId?.toString()
    );

    logger.info(
      `Policy cancellation notification sent for policy ${policy.policyNumber}: ${reason}`
    );
  } catch (error) {
    logger.error("Error sending policy cancellation notification:", error);
    throw error;
  }
};

/**
 * Send policy suspension notification
 */
export const sendPolicySuspensionNotification = async (
  policy: any,
  reason: string
): Promise<void> => {
  try {
    const property = await Property.findById(policy.property);
    const policyholder = await User.findById(policy.policyholder);

    if (!policyholder) {
      logger.warn("Missing policyholder for policy suspension notification", {
        policyId: policy._id,
        policyholderId: policy.policyholder,
      });
      return;
    }

    await notificationService.sendNotification(
      (policyholder._id as Types.ObjectId).toString(),
      {
        type: "warning",
        title: "Policy Suspended",
        message: `Your insurance policy ${policy.policyNumber}${property ? ` for ${property.title}` : ""} has been suspended. Reason: ${reason}. Please contact us to resolve this issue.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          policyId: policy._id,
          policyNumber: policy.policyNumber,
          propertyId: property?._id,
          suspensionReason: reason,
          suspensionDate: policy.suspendedAt || new Date(),
        },
      },
      policy.memberId?.toString()
    );

    logger.info(
      `Policy suspension notification sent for policy ${policy.policyNumber}: ${reason}`
    );
  } catch (error) {
    logger.error("Error sending policy suspension notification:", error);
    throw error;
  }
};

/**
 * Send compliance status update
 */
export const sendComplianceStatusUpdate = async (
  record: any
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for compliance status update", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    const statusMessages = {
      compliant: "Your property is fully compliant",
      non_compliant: "Your property has compliance issues",
      pending: "Compliance status is pending review",
      expired: "Your compliance status has expired",
    };

    const messageType =
      record.status === "compliant"
        ? "success"
        : record.status === "non_compliant" || record.status === "expired"
          ? "error"
          : "info";

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: "Compliance Status Update",
        message: `${statusMessages[record.status as keyof typeof statusMessages] || `Compliance status updated to ${record.status}`}${property ? ` for ${property.title}` : ""}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          status: record.status,
          updateDate: new Date(),
          complianceType: record.type,
        },
      },
      record.memberId?.toString()
    );

    logger.info(
      `Compliance status update notification sent for record ${record._id}`
    );
  } catch (error) {
    logger.error("Error sending compliance status update:", error);
    throw error;
  }
};

/**
 * Send compliance violation alert
 */
export const sendComplianceViolationAlert = async (
  record: any,
  violation: any
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for compliance violation alert", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: "error",
        title: "Compliance Violation Alert",
        message: `A compliance violation has been identified${property ? ` for ${property.title}` : ""}. Violation: ${violation.description || violation.type}. Immediate action required.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          violationType: violation.type,
          violationDescription: violation.description,
          severity: violation.severity,
          dueDate: violation.resolutionDeadline,
        },
      },
      record.memberId?.toString()
    );

    logger.info(`Compliance violation alert sent for record ${record._id}`);
  } catch (error) {
    logger.error("Error sending compliance violation alert:", error);
    throw error;
  }
};

/**
 * Send violation resolution notification
 */
export const sendViolationResolutionNotification = async (
  record: any,
  violationIndex: number
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for violation resolution notification", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    const violation = record.violations?.[violationIndex];

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: "success",
        title: "Violation Resolved",
        message: `The compliance violation${violation ? ` "${violation.type}"` : ` #${violationIndex + 1}`}${property ? ` for ${property.title}` : ""} has been successfully resolved.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          violationIndex,
          violationType: violation?.type,
          resolutionDate: new Date(),
        },
      },
      record.memberId?.toString()
    );

    logger.info(
      `Violation resolution notification sent for record ${record._id}, violation ${violationIndex}`
    );
  } catch (error) {
    logger.error("Error sending violation resolution notification:", error);
    throw error;
  }
};

/**
 * Send inspection result notification
 */
export const sendInspectionResultNotification = async (
  record: any,
  inspection: any
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for inspection result notification", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    const resultMessages = {
      passed: "passed successfully",
      failed: "failed and requires attention",
      partial: "passed with minor issues",
    };

    const messageType =
      inspection.result === "passed"
        ? "success"
        : inspection.result === "failed"
          ? "error"
          : "warning";

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: "Inspection Results Available",
        message: `The inspection for ${property?.title || "your property"} has ${resultMessages[inspection.result as keyof typeof resultMessages] || `completed with result: ${inspection.result}`}.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          inspectionId: inspection._id,
          inspectionDate: inspection.date,
          result: inspection.result,
          notes: inspection.notes,
        },
      },
      record.memberId?.toString()
    );

    logger.info(`Inspection result notification sent for record ${record._id}`);
  } catch (error) {
    logger.error("Error sending inspection result notification:", error);
    throw error;
  }
};

/**
 * Send compliance expiry reminder
 */
export const sendComplianceExpiryReminder = async (
  record: any,
  daysUntilExpiry: number
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for compliance expiry reminder", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    const urgencyLevel =
      daysUntilExpiry <= 7 ? "high" : daysUntilExpiry <= 30 ? "medium" : "low";
    const messageType = daysUntilExpiry <= 7 ? "error" : "warning";

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: `Compliance Expiry Reminder - ${daysUntilExpiry} days left`,
        message: `Your compliance certification${property ? ` for ${property.title}` : ""} expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? "s" : ""}. Please renew to maintain compliance status.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          expiryDate: record.expiryDate,
          daysUntilExpiry,
          urgencyLevel,
          complianceType: record.type,
        },
      },
      record.memberId?.toString()
    );

    logger.info(
      `Compliance expiry reminder sent for record ${record._id}, expires in ${daysUntilExpiry} days`
    );
  } catch (error) {
    logger.error("Error sending compliance expiry reminder:", error);
    throw error;
  }
};

/**
 * Send inspection reminder
 */
export const sendInspectionReminder = async (
  record: any,
  daysUntilInspection: number
): Promise<void> => {
  try {
    const property = await Property.findById(record.property);
    const owner = await User.findById(record.owner || property?.landlord);

    if (!owner) {
      logger.warn("Missing owner for inspection reminder", {
        recordId: record._id,
        ownerId: record.owner,
        propertyId: record.property,
      });
      return;
    }

    const urgencyLevel =
      daysUntilInspection <= 3
        ? "high"
        : daysUntilInspection <= 7
          ? "medium"
          : "low";
    const messageType = daysUntilInspection <= 3 ? "warning" : "info";

    await notificationService.sendNotification(
      (owner._id as Types.ObjectId).toString(),
      {
        type: messageType,
        title: `Inspection Reminder - ${daysUntilInspection} days left`,
        message: `You have a scheduled inspection${property ? ` for ${property.title}` : ""} in ${daysUntilInspection} day${daysUntilInspection > 1 ? "s" : ""}. Please ensure the property is ready.`,
        channels: ["email", "sms", "push", "in_app"],
        data: {
          recordId: record._id,
          propertyId: property?._id,
          inspectionDate: record.nextInspectionDate,
          daysUntilInspection,
          urgencyLevel,
          inspectionType: record.inspectionType,
        },
      },
      record.memberId?.toString()
    );

    logger.info(
      `Inspection reminder sent for record ${record._id}, inspection in ${daysUntilInspection} days`
    );
  } catch (error) {
    logger.error("Error sending inspection reminder:", error);
    throw error;
  }
};
