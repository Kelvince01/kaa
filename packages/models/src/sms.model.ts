import { type Document, model, Schema } from "mongoose";
import type {
  ISmsBulkMessage,
  ISmsDeliveryReport,
  ISmsMessage,
} from "./types/sms.type";

// SMS Message Schema
const smsMessageSchema = new Schema<ISmsMessage & Document>(
  {
    to: {
      type: Schema.Types.Mixed, // Can be string, array of strings, or array of SmsRecipient
      required: true,
      validate: {
        validator: (v: any) => {
          // biome-ignore lint/performance/useTopLevelRegex: false positive
          if (typeof v === "string") return /^\+?[1-9]\d{1,14}$/.test(v);
          if (Array.isArray(v)) {
            return v.every((item) => {
              if (typeof item === "string")
                // biome-ignore lint/performance/useTopLevelRegex: false positive
                return /^\+?[1-9]\d{1,14}$/.test(item);
              return (
                // biome-ignore lint/performance/useTopLevelRegex: false positive
                item.phoneNumber && /^\+?[1-9]\d{1,14}$/.test(item.phoneNumber)
              );
            });
          }
          return false;
        },
        message: "Invalid phone number format",
      },
    },
    message: {
      type: String,
      maxlength: 1600, // Support for long SMS
      trim: true,
    },
    template: {
      templateId: {
        type: Schema.Types.ObjectId,
        ref: "SmsTemplate",
      },
      template: Schema.Types.Mixed, // Template object for inline templates
      data: {
        type: Schema.Types.Mixed,
        default: {},
      },
      options: {
        maxLength: {
          type: Number,
          default: 160,
        },
        truncateMessage: {
          type: String,
          default: "...",
        },
      },
    },
    from: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "transactional",
        "promotional",
        "notification",
        "alert",
        "reminder",
        "verification",
        "bulk",
      ],
      required: true,
      default: "transactional",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      required: true,
      default: "normal",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "expired",
      ],
      required: true,
      default: "pending",
    },

    // Metadata
    messageId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
    },
    cost: String,
    segments: {
      type: Number,
      min: 1,
      default: 1,
    },
    encoding: {
      type: String,
      enum: ["GSM_7BIT", "UCS2"],
      default: "GSM_7BIT",
    },

    // Scheduling
    scheduledAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },

    // Tracking
    deliveryStatus: {
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      total: { type: Number, default: 1 },
      lastUpdated: { type: Date, default: Date.now },
    },

    // Error handling
    error: {
      code: String,
      message: String,
      provider: String,
      retryCount: { type: Number, default: 0 },
      lastRetryAt: Date,
    },

    // Context
    context: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      orgId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
      campaignId: String,
      propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
      unitId: {
        type: Schema.Types.ObjectId,
        ref: "Unit",
      },
      tenantId: {
        type: Schema.Types.ObjectId,
        ref: "Tenant",
      },
      requestId: String,
      ipAddress: String,
      userAgent: String,
    },

    // Settings
    settings: {
      enableDeliveryReports: { type: Boolean, default: true },
      maxRetries: { type: Number, default: 3 },
      retryInterval: { type: Number, default: 5 }, // minutes
      provider: {
        type: String,
        enum: ["africastalking", "twilio", "aws-sns", "mock"],
      },
      webhookUrl: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
smsMessageSchema.index({ status: 1 });
smsMessageSchema.index({ type: 1 });
smsMessageSchema.index({ priority: 1 });
smsMessageSchema.index({ scheduledAt: 1 });
smsMessageSchema.index({ createdAt: -1 });
smsMessageSchema.index({ "context.userId": 1 });
smsMessageSchema.index({ "context.orgId": 1 });

// Compound indexes
smsMessageSchema.index({ status: 1, priority: -1, scheduledAt: 1 });
smsMessageSchema.index({ "context.orgId": 1, createdAt: -1 });

// Virtual for recipient count
smsMessageSchema.virtual("recipientCount").get(function () {
  if (typeof this.to === "string") return 1;
  if (Array.isArray(this.to)) return this.to.length;
  return 0;
});

// SMS Bulk Message Schema
const smsBulkMessageSchema = new Schema<ISmsBulkMessage & Document>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    recipients: [
      {
        phoneNumber: {
          type: String,
          required: true,
          validate: {
            // biome-ignore lint/performance/useTopLevelRegex: false positive
            validator: (v: string) => /^\+?[1-9]\d{1,14}$/.test(v),
            message: "Invalid phone number format",
          },
        },
        name: String,
        metadata: Schema.Types.Mixed,
      },
    ],
    template: {
      templateId: {
        type: Schema.Types.ObjectId,
        ref: "SmsTemplate",
      },
      template: Schema.Types.Mixed,
      data: {
        type: Schema.Types.Mixed,
        default: {},
      },
      options: {
        maxLength: { type: Number, default: 160 },
        truncateMessage: { type: String, default: "..." },
      },
    },
    type: {
      type: String,
      enum: [
        "transactional",
        "promotional",
        "notification",
        "alert",
        "reminder",
        "verification",
        "bulk",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      required: true,
      default: "normal",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "sending",
        "completed",
        "failed",
        "cancelled",
      ],
      required: true,
      default: "draft",
    },

    // Scheduling
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,

    // Progress tracking
    progress: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
    },

    // Settings
    settings: {
      batchSize: { type: Number, default: 100 },
      batchInterval: { type: Number, default: 60 }, // seconds
      enableDeliveryReports: { type: Boolean, default: true },
      maxRetries: { type: Number, default: 3 },
      provider: {
        type: String,
        enum: ["africastalking", "twilio", "aws-sns", "mock"],
      },
      webhookUrl: String,
    },

    // Individual message IDs for tracking
    messageIds: [String],

    context: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      orgId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
      campaignId: String,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for bulk messages
smsBulkMessageSchema.index({ status: 1 });
smsBulkMessageSchema.index({ scheduledAt: 1 });
smsBulkMessageSchema.index({ "context.orgId": 1 });
smsBulkMessageSchema.index({ createdBy: 1 });
smsBulkMessageSchema.index({ createdAt: -1 });

// Update progress percentage before saving
smsBulkMessageSchema.pre("save", function () {
  if (this.progress.total > 0) {
    this.progress.percentage = Math.round(
      ((this.progress.sent + this.progress.delivered + this.progress.failed) /
        this.progress.total) *
        100
    );
  }
});

// SMS Delivery Report Schema
const smsDeliveryReportSchema = new Schema<ISmsDeliveryReport & Document>(
  {
    messageId: {
      type: String,
      required: true,
      index: true,
    },
    providerMessageId: {
      type: String,
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        // biome-ignore lint/performance/useTopLevelRegex: false positive
        validator: (v: string) => /^\+?[1-9]\d{1,14}$/.test(v),
        message: "Invalid phone number format",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "expired",
      ],
      required: true,
    },
    cost: String,
    networkCode: String,
    errorCode: String,
    errorMessage: String,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for delivery reports
smsDeliveryReportSchema.index({ phoneNumber: 1 });
smsDeliveryReportSchema.index({ status: 1 });
smsDeliveryReportSchema.index({ createdAt: -1 });

// Create and export models
export const SmsMessage = model<ISmsMessage & Document>(
  "SmsMessage",
  smsMessageSchema
);
export const SmsBulkMessage = model<ISmsBulkMessage & Document>(
  "SmsBulkMessage",
  smsBulkMessageSchema
);
export const SmsDeliveryReport = model<ISmsDeliveryReport & Document>(
  "SmsDeliveryReport",
  smsDeliveryReportSchema
);

// Export schemas for potential extension
export { smsMessageSchema, smsBulkMessageSchema, smsDeliveryReportSchema };

export default {
  SmsMessage,
  SmsBulkMessage,
  SmsDeliveryReport,
};
