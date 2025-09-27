import { type Document, model, Schema } from "mongoose";
import type { IBulkComm, IComm, ICommDeliveryReport } from "./types/comms.type";

// Comm Context Schema
const commContextSchema = new Schema(
  {
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
    requestId: {
      type: String,
      index: true,
    },
    ipAddress: String,
    userAgent: String,
    source: String,
    tags: [String],
  },
  { _id: false }
);

// Comm Content Schema
const commContentSchema = new Schema(
  {
    subject: String,
    body: {
      type: String,
      required: true,
    },
    html: String,
    text: String,
    segments: {
      type: Number,
      default: 1,
    },
    encoding: {
      type: String,
      enum: ["GSM_7BIT", "UCS2"],
      default: "GSM_7BIT",
    },
    attachments: [
      {
        filename: String,
        content: Buffer,
        type: String,
        size: Number,
      },
    ],
  },
  { _id: false }
);

// Comm Settings Schema
const commSettingsSchema = new Schema(
  {
    enableDeliveryReports: {
      type: Boolean,
      default: true,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    retryInterval: {
      type: Number,
      default: 5, // minutes
    },
    timeout: {
      type: Number,
      default: 30, // seconds
    },
    provider: {
      type: String,
      required: true,
    },
    webhookUrl: String,
    tracking: {
      enabled: {
        type: Boolean,
        default: false,
      },
      pixel: {
        type: Boolean,
        default: false,
      },
      links: {
        type: Boolean,
        default: false,
      },
    },
  },
  { _id: false }
);

// Delivery Status Schema
const deliveryStatusSchema = new Schema(
  {
    delivered: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 1,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    providerStatus: String,
    providerError: String,
  },
  { _id: false }
);

// Comm Error Schema
const commErrorSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    provider: String,
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: Date,
    stack: String,
  },
  { _id: false }
);

// Comm Schema
const commSchema = new Schema<IComm & Document>(
  {
    type: {
      type: String,
      enum: ["email", "sms", "push", "webhook"],
      required: true,
      index: true,
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
        "bounced",
        "expired",
        "cancelled",
      ],
      required: true,
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
      index: true,
    },

    // Recipients
    to: {
      type: Schema.Types.Mixed, // Can be string, array of strings, or array of recipient objects
      required: true,
      validate: {
        validator: (v: any) => {
          if (typeof v === "string") return true;
          if (Array.isArray(v)) {
            return v.every((item) => {
              if (typeof item === "string") return true;
              return item && (item.email || item.phoneNumber);
            });
          }
          return false;
        },
        message: "Invalid recipient format",
      },
    },

    // Content
    content: {
      type: commContentSchema,
      required: true,
    },

    // Template information
    template: {
      type: Schema.Types.ObjectId,
      ref: "Template",
    },

    // Provider information
    provider: {
      type: String,
      required: true,
    },
    providerMessageId: String,

    // Timing
    scheduledAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },

    // Tracking
    cost: Number,
    deliveryStatus: deliveryStatusSchema,

    // Context and settings
    context: {
      type: commContextSchema,
      default: {},
    },
    settings: {
      type: commSettingsSchema,
      required: true,
    },

    // Error handling
    error: commErrorSchema,

    // Metadata
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    collection: "comms",
  }
);

// Indexes
commSchema.index({ "context.orgId": 1 });
commSchema.index({ "context.userId": 1 });
commSchema.index({ provider: 1 });
commSchema.index({ scheduledAt: 1 });
commSchema.index({ createdAt: -1 });
commSchema.index({ sentAt: -1 });

// Compound indexes
commSchema.index({ status: 1, priority: -1, scheduledAt: 1 });
commSchema.index({ type: 1, status: 1 });
commSchema.index({ "context.orgId": 1, createdAt: -1 });

// Virtual for recipient count
commSchema.virtual("recipientCount").get(function () {
  if (typeof this.to === "string") return 1;
  if (Array.isArray(this.to)) return this.to.length;
  return 0;
});

// Bulk Comm Progress Schema
const bulkCommProgressSchema = new Schema(
  {
    total: {
      type: Number,
      default: 0,
    },
    sent: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    pending: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

// Bulk Comm Recipients Schema
const bulkCommRecipientSchema = new Schema(
  {
    phoneNumber: String,
    email: String,
    name: String,
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

// Bulk Comm Schema
const bulkCommSchema = new Schema<IBulkComm & Document>(
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
    type: {
      type: String,
      enum: ["email", "sms", "push", "webhook"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Recipients
    recipients: [bulkCommRecipientSchema],

    // Template
    template: {
      type: Schema.Types.ObjectId,
      ref: "Template",
    },

    // Settings
    settings: {
      type: commSettingsSchema,
      required: true,
    },

    // Progress tracking
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
      default: "draft",
    },
    progress: {
      type: bulkCommProgressSchema,
      default: {},
    },

    // Timing
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,

    // Individual comm IDs
    commIds: [String],

    // Context
    context: {
      type: commContextSchema,
      default: {},
    },

    // Creator
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "bulk_comms",
  }
);

// Indexes for bulk comms
bulkCommSchema.index({ status: 1 });
bulkCommSchema.index({ type: 1 });
bulkCommSchema.index({ scheduledAt: 1 });
bulkCommSchema.index({ "context.orgId": 1 });
bulkCommSchema.index({ createdBy: 1 });
bulkCommSchema.index({ createdAt: -1 });

// Update progress percentage before saving
bulkCommSchema.pre("save", function () {
  if (this.progress.total > 0) {
    this.progress.percentage = Math.round(
      ((this.progress.sent + this.progress.delivered + this.progress.failed) /
        this.progress.total) *
        100
    );
  }
});

// Delivery Report Schema
const commDeliveryReportSchema = new Schema<ICommDeliveryReport & Document>(
  {
    commId: {
      type: String,
      required: true,
      index: true,
    },
    providerMessageId: {
      type: String,
      required: true,
      index: true,
    },
    recipient: {
      phoneNumber: String,
      email: String,
      name: String,
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
        "bounced",
        "expired",
      ],
      required: true,
    },
    cost: Number,
    networkCode: String,
    errorCode: String,
    errorMessage: String,
    deliveredAt: Date,
    provider: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    collection: "comm_delivery_reports",
  }
);

// Indexes for delivery reports
commDeliveryReportSchema.index({ commId: 1, createdAt: -1 });
commDeliveryReportSchema.index({ status: 1 });
commDeliveryReportSchema.index({ provider: 1 });
commDeliveryReportSchema.index({ createdAt: -1 });

// Create and export models
export const Comm = model<IComm & Document>("Comm", commSchema);
export const BulkComm = model<IBulkComm & Document>("BulkComm", bulkCommSchema);
export const CommDeliveryReport = model<ICommDeliveryReport & Document>(
  "CommDeliveryReport",
  commDeliveryReportSchema
);

// Export schemas for potential extension
export { commSchema, bulkCommSchema, commDeliveryReportSchema };

export default {
  Comm,
  BulkComm,
  CommDeliveryReport,
};
