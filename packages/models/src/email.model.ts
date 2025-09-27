/**
 * Email Models
 *
 * Mongoose models for comprehensive email system
 * Includes emails, templates, analytics, and bounce tracking
 */

import mongoose, { type Document, model, Schema, Types } from "mongoose";
import {
  BounceType,
  EMAIL_CONSTANTS,
  EmailAttachmentType,
  EmailCategory,
  EmailPriority,
  EmailStatus,
  EmailTemplateType,
  type IEmail,
  type IEmailAddress,
  type IEmailAnalytics,
  type IEmailAttachment,
  type IEmailBounce,
} from "./types/email.type";

const emailAttachmentSchema = new Schema<IEmailAttachment>(
  {
    _id: {
      type: String,
      default: () => new Types.ObjectId().toString(),
    },
    filename: {
      type: String,
      required: true,
      maxlength: 255,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(EmailAttachmentType),
      required: true,
    },
    disposition: {
      type: String,
      enum: ["attachment", "inline"],
      required: true,
      default: "attachment",
    },
    contentId: {
      type: String,
      maxlength: 100,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: 25 * 1024 * 1024, // 25MB max attachment size
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 100,
    },
    url: {
      type: String,
      validate: {
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: "URL must be a valid HTTP/HTTPS URL",
      },
    },
  },
  { _id: false, timestamps: false }
);

// Comm Error Schema
const emailErrorSchema = new Schema(
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

// Email Settings Schema
const emailSettingsSchema = new Schema(
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

/**
 * Email address schema
 */
const EmailAddressSchema = new Schema<IEmailAddress>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Invalid email address format",
      },
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

export const emailSchema = new Schema<IEmail>(
  {
    templateType: {
      type: String,
      enum: Object.values(EmailTemplateType),
      index: true,
    },

    // Recipients
    to: {
      type: [EmailAddressSchema],
      required: true,
      validate: {
        validator: (v: IEmailAddress[]) => v.length > 0 && v.length <= 50,
        message: "Must have 1-50 recipients",
      },
    },
    cc: {
      type: [EmailAddressSchema],
      validate: {
        validator: (v: IEmailAddress[]) => !v || v.length <= 50,
        message: "Maximum 50 CC recipients",
      },
    },
    bcc: {
      type: [EmailAddressSchema],
      validate: {
        validator: (v: IEmailAddress[]) => !v || v.length <= 50,
        message: "Maximum 50 BCC recipients",
      },
    },
    from: {
      type: EmailAddressSchema,
      required: true,
    },
    replyTo: {
      type: EmailAddressSchema,
    },

    // Content
    subject: {
      type: String,
      required: true,
      maxlength: 998, // RFC 2822 limit
      validate: {
        validator: (v: string) => v.trim().length > 0,
        message: "Subject cannot be empty",
      },
    },
    text: {
      type: String,
      maxlength: 100_000, // 100KB text limit
    },
    html: {
      type: String,
      maxlength: 500_000, // 500KB HTML limit
    },
    attachments: {
      type: [emailAttachmentSchema],
      default: [],
      validate: {
        validator: (v: IEmailAttachment[]) => v.length <= 10,
        message: "Maximum 10 attachments allowed",
      },
    },

    templateId: { type: String, ref: "Template", default: null },

    category: {
      type: String,
      enum: Object.values(EmailCategory),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(EmailPriority),
      required: true,
      default: EmailPriority.NORMAL,
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

    // Tracking
    status: {
      type: String,
      enum: Object.values(EmailStatus),
      required: true,
      default: EmailStatus.QUEUED,
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
      default: EMAIL_CONSTANTS.RETRY_SETTINGS.MAX_ATTEMPTS,
      min: 1,
      max: 10,
    },

    // Kenya-specific features
    language: {
      type: String,
      enum: ["en", "sw"],
      required: true,
      default: "en",
      index: true,
    },
    businessHoursOnly: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    respectOptOut: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Dates
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
    openedAt: {
      type: Date,
      index: true,
    },
    clickedAt: {
      type: Date,
      index: true,
    },
    bouncedAt: {
      type: Date,
      index: true,
    },
    failedAt: {
      type: Date,
      index: true,
    },

    // Error tracking
    lastError: {
      type: String,
      maxlength: 1000,
    },
    bounceReason: {
      type: String,
      maxlength: 500,
    },
    bounceType: {
      type: String,
      enum: Object.values(BounceType),
    },

    // Relations
    userId: {
      type: String,
      ref: "User",
      index: true,
    },
    propertyId: {
      type: String,
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

    // Flags
    isTest: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    headers: { type: Object },
    context: { type: Object },
    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() },

    // Timing
    scheduledAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },

    // Tracking
    cost: Number,
    deliveryStatus: deliveryStatusSchema,

    // Context and settings
    // context: {
    //   type: commContextSchema,
    //   default: {},
    // },
    settings: {
      type: emailSettingsSchema,
      required: true,
    },

    // Error handling
    error: emailErrorSchema,
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ==================== EMAIL SCHEMA INDEXES ====================

// Compound indexes for efficient queries
emailSchema.index({ status: 1, priority: -1, scheduledFor: 1 }); // Queue processing
emailSchema.index({ userId: 1, createdAt: -1 }); // User emails
emailSchema.index({ templateType: 1, category: 1, createdAt: -1 }); // Template analytics
emailSchema.index({ sendGridMessageId: 1 }, { sparse: true }); // SendGrid tracking
emailSchema.index({ "to.email": 1, createdAt: -1 }); // Recipient lookup
emailSchema.index({ category: 1, status: 1, createdAt: -1 }); // Category analytics
emailSchema.index({ language: 1, businessHoursOnly: 1 }); // Kenya-specific queries

// Text search index
emailSchema.index(
  { subject: "text", text: "text", html: "text" },
  {
    name: "email_text_search",
    default_language: "english",
  }
);

// TTL index for test emails (auto-delete after 7 days)
emailSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60, // 7 days
    partialFilterExpression: { isTest: true },
  }
);

// ==================== EMAIL SCHEMA METHODS ====================

/**
 * Mark email as sent
 */
emailSchema.methods.markAsSent = function (sendGridMessageId?: string) {
  this.status = EmailStatus.SENT;
  this.sentAt = new Date();
  this.deliveryAttempts += 1;
  if (sendGridMessageId) {
    this.sendGridMessageId = sendGridMessageId;
  }
  return this.save();
};

/**
 * Mark email as delivered
 */
emailSchema.methods.markAsDelivered = function () {
  this.status = EmailStatus.DELIVERED;
  this.deliveredAt = new Date();
  return this.save();
};

/**
 * Mark email as opened
 */
emailSchema.methods.markAsOpened = function () {
  if (this.status === EmailStatus.DELIVERED) {
    this.status = EmailStatus.OPENED;
  }
  this.openedAt = new Date();
  return this.save();
};

/**
 * Mark email as clicked
 */
emailSchema.methods.markAsClicked = function () {
  if (
    this.status === EmailStatus.DELIVERED ||
    this.status === EmailStatus.OPENED
  ) {
    this.status = EmailStatus.CLICKED;
  }
  this.clickedAt = new Date();
  return this.save();
};

/**
 * Mark email as bounced
 */
emailSchema.methods.markAsBounced = function (
  bounceType: BounceType,
  reason: string
) {
  this.status = EmailStatus.BOUNCED;
  this.bounceType = bounceType;
  this.bounceReason = reason;
  this.bouncedAt = new Date();
  return this.save();
};

/**
 * Mark email as failed
 */
emailSchema.methods.markAsFailed = function (error: string) {
  this.status = EmailStatus.FAILED;
  this.lastError = error;
  this.failedAt = new Date();
  this.deliveryAttempts += 1;
  return this.save();
};

/**
 * Check if email can be retried
 */
emailSchema.methods.canRetry = function (): boolean {
  return (
    this.deliveryAttempts < this.maxAttempts &&
    this.status !== EmailStatus.BOUNCED &&
    this.status !== EmailStatus.DELIVERED &&
    this.status !== EmailStatus.OPENED &&
    this.status !== EmailStatus.CLICKED
  );
};

/**
 * Get delivery time in milliseconds
 */
emailSchema.methods.getDeliveryTime = function (): number | null {
  if (this.sentAt && this.deliveredAt) {
    return this.deliveredAt.getTime() - this.sentAt.getTime();
  }
  return null;
};

// ==================== EMAIL ANALYTICS SCHEMA ====================

/**
 * Email analytics schema
 */
const EmailAnalyticsSchema = new Schema<IEmailAnalytics & Document>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    templateType: {
      type: String,
      enum: Object.values(EmailTemplateType),
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(EmailCategory),
      required: true,
      index: true,
    },

    // Basic metrics
    totalEmails: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
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
    bounced: {
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
    opened: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    clicked: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unsubscribed: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Calculated rates
    deliveryRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    openRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    clickRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    bounceRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },
    unsubscribeRate: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1,
    },

    // Kenya-specific metrics
    kenyaMetrics: {
      swahiliEmails: {
        type: Number,
        default: 0,
        min: 0,
      },
      englishEmails: {
        type: Number,
        default: 0,
        min: 0,
      },
      mpesaRelatedEmails: {
        type: Number,
        default: 0,
        min: 0,
      },
      businessHoursEmails: {
        type: Number,
        default: 0,
        min: 0,
      },
      peakHours: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
    },

    // Performance metrics
    averageDeliveryTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    averageOpenTime: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes
EmailAnalyticsSchema.index({ date: -1, category: 1 });
EmailAnalyticsSchema.index({ templateType: 1, date: -1 });
EmailAnalyticsSchema.index({ category: 1, date: -1 });

// Unique compound index to prevent duplicates
EmailAnalyticsSchema.index(
  { date: 1, templateType: 1, category: 1 },
  { unique: true, partialFilterExpression: { templateType: { $exists: true } } }
);
EmailAnalyticsSchema.index(
  { date: 1, category: 1 },
  {
    unique: true,
    partialFilterExpression: { templateType: { $exists: false } },
  }
);

// ==================== EMAIL BOUNCE SCHEMA ====================

/**
 * Email bounce tracking schema
 */
const EmailBounceSchema = new Schema<IEmailBounce & Document>(
  {
    emailId: {
      type: String,
      required: true,
      ref: "Email",
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    bounceType: {
      type: String,
      enum: Object.values(BounceType),
      required: true,
      index: true,
    },
    bounceReason: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    bouncedAt: {
      type: Date,
      required: true,
      index: true,
    },
    sendGridEventId: {
      type: String,
      index: true,
    },

    // Automatic handling
    shouldRetry: {
      type: Boolean,
      required: true,
      default: false,
    },
    retryAfter: {
      type: Date,
      index: true,
    },
    isBlacklisted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Bounce indexes
EmailBounceSchema.index({ email: 1, bounceType: 1 });
EmailBounceSchema.index({ bouncedAt: -1 });
EmailBounceSchema.index({ isBlacklisted: 1, email: 1 });

// ==================== EXPORT MODELS ====================

export const Email = mongoose.model<IEmail>("Email", emailSchema);
// export const Email = model<IEmail & Document>("Email", EmailSchema);
export const EmailAnalytics = model<IEmailAnalytics & Document>(
  "EmailAnalytics",
  EmailAnalyticsSchema
);
export const EmailBounce = model<IEmailBounce & Document>(
  "EmailBounce",
  EmailBounceSchema
);
