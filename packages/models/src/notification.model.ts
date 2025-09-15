import { model, Schema } from "mongoose";
import type {
  IEmailTemplate,
  INotification,
  INotificationPreference,
  INotificationTemplate,
} from "./types/notification.type";

/**
 * Notification Schema
 */
const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    recipients: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    type: {
      type: String,
      required: true,
      enum: ["info", "warning", "error", "success", "marketing"],
    },
    channel: {
      type: String,
      required: true,
      enum: ["email", "sms", "push", "in_app", "whatsapp"],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    category: {
      type: String,
      enum: [
        "message",
        "booking",
        "payment",
        "property",
        "maintenance",
        "contract",
        "reference",
        "account",
        "other",
      ],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    link: {
      type: String,
      default: null,
    },
    linkText: {
      type: String,
      default: null,
    },
    image: {
      type: String,
      default: null,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: [
        "User",
        "Property",
        "Booking",
        "Message",
        "Conversation",
        "Contract",
        "Maintenance",
        "Reference",
        "Payment",
      ],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    scheduledFor: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ memberId: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

export const Notification = model<INotification>(
  "Notification",
  notificationSchema
);

const notificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    preferences: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        types: {
          type: [String],
          default: ["info", "warning", "error"],
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: false,
        },
        types: {
          type: [String],
          default: ["error"],
        },
      },
      push: {
        enabled: {
          type: Boolean,
          default: true,
        },
        types: {
          type: [String],
          default: ["info", "warning", "error"],
        },
      },
      in_app: {
        enabled: {
          type: Boolean,
          default: true,
        },
        types: {
          type: [String],
          default: ["info", "warning", "error", "success"],
        },
      },
      whatsapp: {
        enabled: {
          type: Boolean,
          default: false,
        },
        types: {
          type: [String],
          default: ["warning", "error"],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = model<INotificationPreference>(
  "NotificationPreference",
  notificationPreferenceSchema
);

const notificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    subject: { type: String, required: true },
    emailTemplate: String,
    pushTemplate: String,
    inAppTemplate: String,
    whatsappTemplate: String,
    variables: [String],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const NotificationTemplate = model<INotificationTemplate>(
  "NotificationTemplate",
  notificationTemplateSchema
);

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    textContent: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
    },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplate = model<IEmailTemplate>(
  "EmailTemplate",
  emailTemplateSchema
);
