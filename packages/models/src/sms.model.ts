import { type Document, model, Schema } from "mongoose";
import {
  type ISmsAnalytics,
  type ISmsBulkMessage,
  type ISmsDeliveryReport,
  type ISmsMessage,
  type ISmsRecipient,
  KenyaNetworkCode,
  SMS_CONSTANTS,
  SmsCategory,
  SmsDeliveryStatus,
  SmsPriority,
  SmsTemplateType,
} from "./types/sms.type";

const smsRecipientSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  name: String,
  metadata: { type: Schema.Types.Mixed },
});

// SMS Message Schema
const smsMessageSchema = new Schema<ISmsMessage & Document>(
  {
    to: {
      type: [smsRecipientSchema], // Can be string, array of strings, or array of SmsRecipient
      required: true,
      validate: {
        validator(recipients: ISmsRecipient[]) {
          return (
            recipients.length > 0 &&
            recipients.length <= 1000 &&
            recipients.every((recipient) =>
              SMS_CONSTANTS.PHONE_REGEX.test(recipient.phoneNumber)
            )
          );
        },
        message: "Invalid phone numbers or too many recipients (max 1000)",
      },
    },
    message: {
      type: String,
      maxlength: 1600, // Support for long SMS
      trim: true,
      validate: {
        validator: (v: string) => v.trim().length > 0,
        message: "Message content cannot be empty",
      },
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: "SmsTemplate",
    },
    templateType: {
      type: String,
      enum: Object.values(SmsTemplateType),
      index: true,
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

    // Africa's Talking specific
    from: {
      type: String,
      maxlength: 11, // Africa's Talking limit for alphanumeric sender ID
    },
    bulkSMSMode: {
      type: Boolean,
      required: true,
      default: false,
    },
    messageId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
      index: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    currencyCode: {
      type: String,
      enum: ["KES", "USD"],
      default: "KES",
    },

    // Tracking
    status: {
      type: String,
      enum: Object.values(SmsDeliveryStatus),
      required: true,
      default: SmsDeliveryStatus.QUEUED,
      index: true,
    },
    deliveryAttempts: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
      max: 10,
    },
    failureReason: {
      type: String,
      maxlength: 500,
    },
    networkCode: {
      type: String,
      enum: Object.values(KenyaNetworkCode),
      index: true,
    },

    // Metadata
    priority: {
      type: String,
      enum: Object.values(SmsPriority),
      required: true,
      default: SmsPriority.NORMAL,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(SmsCategory),
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 tags allowed",
      },
    },
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
    scheduledFor: {
      type: Date,
      index: true,
    },
    sentAt: {
      type: Date,
      index: true,
    },
    deliveredAt: {
      type: Date,
      index: true,
    },
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
        index: true,
      },
      orgId: {
        type: Schema.Types.ObjectId,
        ref: "Organization",
      },
      campaignId: String,
      propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Property",
        index: true,
      },
      applicationId: {
        type: String,
        ref: "Application",
        index: true,
      },
      paymentId: {
        type: String,
        ref: "Payment",
        index: true,
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

    // Kenya-specific features
    isSwahili: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    respectBusinessHours: {
      type: Boolean,
      required: true,
      default: false,
    },
    respectOptOut: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Flags
    isTest: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
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
smsMessageSchema.index({ type: 1 });
smsMessageSchema.index({ scheduledAt: 1 });
smsMessageSchema.index({ createdAt: -1 });
smsMessageSchema.index({ "context.orgId": 1 });

// Compound indexes
smsMessageSchema.index({ status: 1, priority: -1, scheduledFor: 1 });
smsMessageSchema.index({ "context.orgId": 1, createdAt: -1 });
smsMessageSchema.index({ "context.userId": 1, createdAt: -1 }); // User SMS history
smsMessageSchema.index({ templateType: 1, category: 1, createdAt: -1 }); // Template analytics
smsMessageSchema.index({ to: 1, createdAt: -1 }); // Phone number lookup
smsMessageSchema.index({ category: 1, status: 1, createdAt: -1 }); // Category analytics
smsMessageSchema.index({ isSwahili: 1, respectBusinessHours: 1 }); // Kenya-specific queries
smsMessageSchema.index({ networkCode: 1, status: 1 }); // Network analysis

// Text search index
smsMessageSchema.index(
  { message: "text" },
  {
    name: "sms_text_search",
    default_language: "english",
  }
);

/**
 * Auto-detect Swahili content before saving SMS
 */
smsMessageSchema.pre("save", function () {
  if (!this.isSwahili && this.detectSwahili()) {
    this.isSwahili = true;
  }
});

// Virtual for recipient count
smsMessageSchema.virtual("recipientCount").get(function () {
  if (typeof this.to === "string") return 1;
  if (Array.isArray(this.to)) return this.to.length;
  return 0;
});

// TTL index for test SMS (auto-delete after 7 days)
smsMessageSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { isTest: true },
  }
);

// ==================== SMS SCHEMA METHODS ====================

/**
 * Mark SMS as sent
 */
smsMessageSchema.methods.markAsSent = function (
  messageId?: string,
  cost?: number
) {
  this.status = SmsDeliveryStatus.SENT;
  this.sentAt = new Date();
  this.deliveryAttempts += 1;
  if (messageId) this.messageId = messageId;
  if (cost) this.cost = cost;
  return this.save();
};

/**
 * Mark SMS as delivered
 */
smsMessageSchema.methods.markAsDelivered = function (
  networkCode?: KenyaNetworkCode
) {
  this.status = SmsDeliveryStatus.DELIVERED;
  this.deliveredAt = new Date();
  if (networkCode) this.networkCode = networkCode;
  return this.save();
};

/**
 * Mark SMS as failed
 */
smsMessageSchema.methods.markAsFailed = function (reason: string) {
  this.status = SmsDeliveryStatus.FAILED;
  this.failureReason = reason;
  this.deliveryAttempts += 1;
  return this.save();
};

/**
 * Check if SMS can be retried
 */
smsMessageSchema.methods.canRetry = function (): boolean {
  return (
    this.deliveryAttempts < this.maxAttempts &&
    this.status !== SmsDeliveryStatus.DELIVERED &&
    this.status !== SmsDeliveryStatus.REJECTED
  );
};

/**
 * Get total recipients count
 */
smsMessageSchema.methods.getRecipientsCount = function (): number {
  return this.to.length;
};

/**
 * Check if message contains Swahili keywords
 */
smsMessageSchema.methods.detectSwahili = function (): boolean {
  const swahiliWords = [
    "hujambo",
    "asante",
    "karibu",
    "sawa",
    "habari",
    "tafadhali",
    "pole",
    "baadaye",
  ];
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  const messageWords = this.message.toLowerCase().split(/\s+/);
  return swahiliWords.some((word) => messageWords.includes(word));
};

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
      enum: Object.values(SmsPriority),
      required: true,
      default: SmsPriority.NORMAL,
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
/*smsBulkMessageSchema.pre("save", function () {
  if (this.progress.total > 0) {
    this.progress.percentage = Math.round(
      ((this.progress.sent + this.progress.delivered + this.progress.failed) /
        this.progress.total) *
        100
    );
  }
});*/

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

// ==================== SMS ANALYTICS SCHEMA ====================

/**
 * SMS analytics schema - simplified for daily aggregates
 * Note: This is a simplified version. The full ISmsAnalytics type is used for API responses
 * that aggregate data from multiple documents.
 */
const SmsAnalyticsSchema = new Schema(
  {
    period: {
      type: String,
      enum: ["hour", "day", "week", "month"],
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    templateType: {
      type: String,
      enum: Object.values(SmsTemplateType),
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(SmsCategory),
      required: true,
      index: true,
    },

    // Totals
    totals: {
      sent: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      delivered: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      failed: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      cost: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },

    // By type breakdown
    byType: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // By provider breakdown
    byProvider: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Calculated rates
    deliveryRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    failureRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    averageCostPerSms: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Top templates
    topTemplates: [
      {
        templateId: String,
        templateName: String,
        usage: Number,
        deliveryRate: Number,
      },
    ],

    // Trends data
    trends: [
      {
        date: Date,
        sent: Number,
        delivered: Number,
        failed: Number,
        cost: Number,
      },
    ],

    // Kenya-specific metrics
    kenyaMetrics: {
      safaricomCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      airtelCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      telkomCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      businessHoursSms: {
        type: Number,
        default: 0,
        min: 0,
      },
      swahiliSms: {
        type: Number,
        default: 0,
        min: 0,
      },
      otpSms: {
        type: Number,
        default: 0,
        min: 0,
      },
      mpesaSms: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes
SmsAnalyticsSchema.index({ startDate: -1, endDate: -1 });
SmsAnalyticsSchema.index({ period: 1, startDate: -1 });
SmsAnalyticsSchema.index({ category: 1, startDate: -1 });
SmsAnalyticsSchema.index({ templateType: 1, startDate: -1 });

// Unique compound index to prevent duplicates
SmsAnalyticsSchema.index(
  { period: 1, startDate: 1, endDate: 1, templateType: 1, category: 1 },
  { unique: true, partialFilterExpression: { templateType: { $exists: true } } }
);
SmsAnalyticsSchema.index(
  { period: 1, startDate: 1, endDate: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { templateType: { $exists: false } },
  }
);

// ==================== ANALYTICS METHODS ====================

/**
 * Calculate delivery rate (as percentage)
 */
SmsAnalyticsSchema.methods.calculateDeliveryRate = function () {
  if (this.totals.sent === 0) return 0;
  this.deliveryRate = (this.totals.delivered / this.totals.sent) * 100;
  return this.deliveryRate;
};

/**
 * Calculate failure rate (as percentage)
 */
SmsAnalyticsSchema.methods.calculateFailureRate = function () {
  if (this.totals.sent === 0) return 0;
  this.failureRate = (this.totals.failed / this.totals.sent) * 100;
  return this.failureRate;
};

/**
 * Calculate average cost per SMS
 */
SmsAnalyticsSchema.methods.calculateAverageCost = function () {
  if (this.totals.sent === 0) return 0;
  this.averageCostPerSms = this.totals.cost / this.totals.sent;
  return this.averageCostPerSms;
};

/**
 * Auto-calculate rates before saving analytics
 */
SmsAnalyticsSchema.pre("save", function () {
  // @ts-expect-error
  this.calculateDeliveryRate();
  // @ts-expect-error
  this.calculateFailureRate();
  // @ts-expect-error
  this.calculateAverageCost();
});

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
export const SmsAnalytics = model<ISmsAnalytics & Document>(
  "SmsAnalytics",
  SmsAnalyticsSchema
);

// Export schemas for potential extension
export {
  smsMessageSchema,
  smsBulkMessageSchema,
  smsDeliveryReportSchema,
  SmsAnalyticsSchema,
};

export default {
  SmsMessage,
  SmsBulkMessage,
  SmsDeliveryReport,
  SmsAnalytics,
};
