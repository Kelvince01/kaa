import mongoose, { model, Schema } from "mongoose";
import {
  type IAPIVersion,
  type IWebhookConfig as IWebhook,
  type IWebhookDelivery,
  type IWebhookEvent,
  WEBHOOK_CONSTANTS,
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookFailureReason,
  WebhookMethod,
  WebhookPriority,
  WebhookRetryStrategy,
  WebhookSecurityType,
  WebhookStatus,
} from "./types/webhook.type";

// Webhook Security Schema
const webhookSecuritySchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(WebhookSecurityType),
      default: WebhookSecurityType.NONE,
      required: true,
    },
    apiKey: {
      type: String,
      select: false, // Don't include by default for security
    },
    bearerToken: {
      type: String,
      select: false,
    },
    hmacSecret: {
      type: String,
      select: false,
    },
    basicAuth: {
      username: {
        type: String,
        select: false,
      },
      password: {
        type: String,
        select: false,
      },
    },
    oauth2: {
      clientId: {
        type: String,
        select: false,
      },
      clientSecret: {
        type: String,
        select: false,
      },
      tokenUrl: String,
      scope: [String],
    },
    customHeaders: {
      type: Map,
      of: String,
      default: new Map(),
    },
    ipWhitelist: [String],
    userAgent: {
      type: String,
      default: "Kaa-Rental-Platform/1.0",
    },
  },
  { _id: false }
);

// Webhook Retry Configuration Schema
const webhookRetryConfigSchema = new Schema(
  {
    strategy: {
      type: String,
      enum: Object.values(WebhookRetryStrategy),
      default: WebhookRetryStrategy.EXPONENTIAL_BACKOFF,
      required: true,
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    initialDelay: {
      type: Number,
      default: 1000,
      min: 100,
      max: 60_000,
    },
    maxDelay: {
      type: Number,
      default: 300_000,
      min: 1000,
      max: 3_600_000,
    },
    backoffMultiplier: {
      type: Number,
      default: 2,
      min: 1,
      max: 10,
    },
    retryOnStatus: {
      type: [Number],
      default: [408, 429, 500, 502, 503, 504, 522, 524],
    },
    stopOnStatus: {
      type: [Number],
      default: [400, 401, 403, 404, 410, 422],
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

// Webhook Filters Schema
const webhookFiltersSchema = new Schema(
  {
    userTypes: [String],
    propertyTypes: [String],
    counties: {
      type: [String],
      validate: {
        validator(counties: string[]) {
          return counties.every((county) =>
            WEBHOOK_CONSTANTS.COUNTIES.includes(county)
          );
        },
        message: "Invalid county specified",
      },
    },
    minAmount: {
      type: Number,
      min: 0,
    },
    maxAmount: {
      type: Number,
      min: 0,
    },
    timeWindow: {
      start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      },
      timezone: {
        type: String,
        default: "Africa/Nairobi",
      },
    },
    conditions: [
      {
        field: {
          type: String,
          required: true,
        },
        operator: {
          type: String,
          enum: [
            "eq",
            "ne",
            "gt",
            "gte",
            "lt",
            "lte",
            "in",
            "nin",
            "exists",
            "regex",
          ],
          required: true,
        },
        value: Schema.Types.Mixed,
        logicalOperator: {
          type: String,
          enum: ["and", "or"],
          default: "and",
        },
      },
    ],
  },
  { _id: false }
);

// Webhook Transformation Schema
const webhookTransformationSchema = new Schema(
  {
    template: String, // Handlebars template
    mapping: {
      type: Map,
      of: String,
    },
    includeFields: [String],
    excludeFields: [String],
    addFields: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    script: String, // JavaScript transformation script
  },
  { _id: false }
);

// Webhook Rate Limit Schema
const webhookRateLimitSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    maxRequests: {
      type: Number,
      default: 100,
      min: 1,
    },
    windowMs: {
      type: Number,
      default: 60_000, // 1 minute
      min: 1000,
    },
    skipOnError: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Mongoose Schema
const webhookSchema = new Schema<IWebhook>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (url: string) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        message: "Invalid URL format",
      },
    },
    method: {
      type: String,
      enum: Object.values(WebhookMethod),
      default: WebhookMethod.POST,
      required: true,
    },
    events: {
      type: [String],
      enum: Object.values(WebhookEventType),
      required: true,
      validate: {
        validator: (events: string[]) => events.length > 0,
        message: "At least one event type must be specified",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    environment: {
      type: String,
      enum: Object.values(WebhookEnvironment),
      default: WebhookEnvironment.PRODUCTION,
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(WebhookPriority),
      default: WebhookPriority.MEDIUM,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: Object.values(WebhookContentType),
      default: WebhookContentType.JSON,
      required: true,
    },
    timeout: {
      type: Number,
      default: WEBHOOK_CONSTANTS.TIMEOUTS.DEFAULT,
      min: 1000,
      max: 120_000,
    },
    headers: {
      type: Map,
      of: String,
      default: new Map(),
    },
    security: {
      type: webhookSecuritySchema,
      required: true,
      default: () => ({ type: WebhookSecurityType.NONE }),
    },
    retryConfig: {
      type: webhookRetryConfigSchema,
      required: true,
      default: () => WEBHOOK_CONSTANTS.RETRY_CONFIGS.DEFAULT,
    },
    filters: webhookFiltersSchema,
    transformation: webhookTransformationSchema,
    rateLimit: webhookRateLimitSchema,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
    tags: {
      type: [String],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message: "Maximum 10 tags allowed",
      },
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastTriggered: {
      type: Date,
      index: true,
    },
    nextRetryAt: {
      type: Date,
    },

    // secret: { type: String },
    // lastResponse: {
    //   statusCode: { type: Number },
    //   message: { type: String },
    // },
  },
  {
    timestamps: true,
    collection: "webhooks",
    toJSON: {
      transform: (_doc, ret) => {
        //// biome-ignore lint/performance/noDelete: ignore
        // delete ret.secret;
        return ret;
      },
    },
  }
);

webhookSchema.index({ memberId: 1 });
webhookSchema.index({ events: 1 });
// Indexes for webhook config
webhookSchema.index({ createdBy: 1, isActive: 1 });
webhookSchema.index({ environment: 1, priority: 1 });
webhookSchema.index({ events: 1, isActive: 1 });
webhookSchema.index({ nextRetryAt: 1 }, { sparse: true });

// Methods for webhook config
webhookSchema.methods.activate = function () {
  this.isActive = true;
  this.updatedAt = new Date();
  return this.save();
};

webhookSchema.methods.deactivate = function () {
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

webhookSchema.methods.updateLastTriggered = function () {
  this.lastTriggered = new Date();
  return this.save();
};

webhookSchema.methods.shouldRetry = function () {
  return (
    this.retryConfig.enabled &&
    this.nextRetryAt &&
    this.nextRetryAt <= new Date()
  );
};

export const getAvailableEvents = (): string[] =>
  Object.values(WebhookEventType);

// Create and export the model
export const Webhook = model<IWebhook>("Webhook", webhookSchema);

// Webhook Event Schema
const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    type: {
      type: String,
      enum: Object.values(WebhookEventType),
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0",
    },
    correlationId: {
      type: String,
    },
    causedBy: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      adminId: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
      },
      system: String,
      ip: String,
      userAgent: String,
    },
  },
  {
    timestamps: true,
    collection: "webhook_events",
  }
);

// Indexes for webhook events
webhookEventSchema.index({ type: 1, timestamp: -1 });
webhookEventSchema.index({ resourceId: 1, resourceType: 1 });
webhookEventSchema.index({ source: 1, timestamp: -1 });
webhookEventSchema.index({ correlationId: 1 }, { sparse: true });
webhookEventSchema.index({ "causedBy.userId": 1 }, { sparse: true });
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2_592_000 }); // 30 days TTL

export const WebhookEvent = model<IWebhookEvent>(
  "WebhookEvent",
  webhookEventSchema
);

const webhookDeliverySchema = new Schema<IWebhookDelivery>(
  {
    webhookId: {
      type: Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookEvent",
      required: true,
      index: true,
    },
    attempt: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(WebhookStatus),
      default: WebhookStatus.PENDING,
      required: true,
      index: true,
    },
    httpStatus: {
      type: Number,
      min: 100,
      max: 599,
      index: true,
    },
    response: {
      statusCode: Number,
      statusMessage: String,
      headers: {
        type: Map,
        of: String,
      },
      body: String,
      duration: {
        type: Number,
        min: 0,
      },
      size: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    request: {
      url: {
        type: String,
        required: true,
      },
      method: {
        type: String,
        enum: Object.values(WebhookMethod),
        required: true,
      },
      headers: {
        type: Map,
        of: String,
        required: true,
      },
      body: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    error: {
      code: {
        type: String,
        enum: Object.values(WebhookFailureReason),
      },
      message: String,
      details: Schema.Types.Mixed,
      stack: String,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      index: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    nextRetryAt: {
      type: Date,
    },
    retryAfter: {
      type: Number,
      min: 0,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map(),
    },

    // payload: {
    //   type: Schema.Types.Mixed,
    //   required: true,
    // },
  },
  {
    timestamps: true,
  }
);

webhookDeliverySchema.index({ webhookId: 1 });
webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });

export const WebhookDelivery = mongoose.model<IWebhookDelivery>(
  "WebhookDelivery",
  webhookDeliverySchema
);

const apiVersionSchema = new Schema<IAPIVersion>(
  {
    version: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deprecatedAt: {
      type: Date,
    },
    sunsetAt: {
      type: Date,
    },
    changelog: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const APIVersion = mongoose.model<IAPIVersion>(
  "APIVersion",
  apiVersionSchema
);
