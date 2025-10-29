import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

// Enum for webhook events remains the same
export enum WebhookEventType {
  FILE_UPLOADED = "file.uploaded",
  FILE_DELETED = "file.deleted",
  // User Events
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_VERIFIED = "user.verified",
  USER_DELETED = "user.deleted",
  USER_SUSPENDED = "user.suspended",
  USER_REACTIVATED = "user.reactivated",

  // Property Events
  PROPERTY_CREATED = "property.created",
  PROPERTY_UPDATED = "property.updated",
  PROPERTY_PUBLISHED = "property.published",
  PROPERTY_UNPUBLISHED = "property.unpublished",
  PROPERTY_DELETED = "property.deleted",
  PROPERTY_FEATURED = "property.featured",

  // Listing Events
  LISTING_CREATED = "listing.created",
  LISTING_UPDATED = "listing.updated",
  LISTING_ACTIVATED = "listing.activated",
  LISTING_DEACTIVATED = "listing.deactivated",
  LISTING_EXPIRED = "listing.expired",
  LISTING_RENEWED = "listing.renewed",

  // Application Events
  APPLICATION_SUBMITTED = "application.submitted",
  APPLICATION_APPROVED = "application.approved",
  APPLICATION_REJECTED = "application.rejected",
  APPLICATION_WITHDRAWN = "application.withdrawn",
  APPLICATION_DOCUMENTS_UPLOADED = "application.documents_uploaded",
  APPLICATION_DOCUMENTS_VERIFIED = "application.documents_verified",

  // Booking Events
  BOOKING_CREATED = "booking.created",
  BOOKING_CONFIRMED = "booking.confirmed",
  BOOKING_CANCELLED = "booking.cancelled",
  BOOKING_COMPLETED = "booking.completed",
  BOOKING_NO_SHOW = "booking.no_show",

  // Payment Events
  PAYMENT_INITIATED = "payment.initiated",
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",
  PAYMENT_REFUNDED = "payment.refunded",
  PAYMENT_DISPUTED = "payment.disputed",

  // M-Pesa Specific Events
  MPESA_CALLBACK = "mpesa.callback",
  MPESA_TIMEOUT = "mpesa.timeout",
  MPESA_REVERSAL = "mpesa.reversal",

  // Review Events
  REVIEW_CREATED = "review.created",
  REVIEW_UPDATED = "review.updated",
  REVIEW_FLAGGED = "review.flagged",
  REVIEW_APPROVED = "review.approved",
  REVIEW_REJECTED = "review.rejected",

  // Message Events
  MESSAGE_SENT = "message.sent",
  MESSAGE_DELIVERED = "message.delivered",
  MESSAGE_READ = "message.read",
  CONVERSATION_STARTED = "conversation.started",

  // Notification Events
  NOTIFICATION_SENT = "notification.sent",
  NOTIFICATION_DELIVERED = "notification.delivered",
  NOTIFICATION_FAILED = "notification.failed",
  NOTIFICATION_CLICKED = "notification.clicked",

  // System Events
  SYSTEM_MAINTENANCE = "system.maintenance",
  SYSTEM_ERROR = "system.error",
  SYSTEM_BACKUP = "system.backup",
  SYSTEM_UPDATE = "system.update",

  // Admin Events
  ADMIN_ACTION = "admin.action",
  CONTENT_MODERATED = "content.moderated",
  USER_BANNED = "user.banned",
  BULK_OPERATION = "bulk.operation",

  // External Service Events
  EXTERNAL_SERVICE_DOWN = "external.service_down",
  EXTERNAL_SERVICE_UP = "external.service_up",
  RATE_LIMIT_EXCEEDED = "rate.limit_exceeded",

  // Custom Events
  CUSTOM = "custom",
}

// Webhook Status
export enum WebhookStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  FAILED = "failed",
  RETRYING = "retrying",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

// Webhook HTTP Methods
export enum WebhookMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

// Webhook Security Types
export enum WebhookSecurityType {
  NONE = "none",
  API_KEY = "api_key",
  BEARER_TOKEN = "bearer_token",
  HMAC_SHA256 = "hmac_sha256",
  BASIC_AUTH = "basic_auth",
  OAUTH2 = "oauth2",
}

// Webhook Priority Levels
export enum WebhookPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

// Webhook Retry Strategy
export enum WebhookRetryStrategy {
  EXPONENTIAL_BACKOFF = "exponential_backoff",
  LINEAR_BACKOFF = "linear_backoff",
  FIXED_DELAY = "fixed_delay",
  IMMEDIATE = "immediate",
}

// Webhook Content Types
export enum WebhookContentType {
  JSON = "application/json",
  FORM_URLENCODED = "application/x-www-form-urlencoded",
  XML = "application/xml",
  TEXT = "text/plain",
}

// Webhook Environment
export enum WebhookEnvironment {
  PRODUCTION = "production",
  STAGING = "staging",
  DEVELOPMENT = "development",
  TEST = "test",
}

// Webhook Failure Reasons
export enum WebhookFailureReason {
  TIMEOUT = "timeout",
  CONNECTION_ERROR = "connection_error",
  DNS_ERROR = "dns_error",
  SSL_ERROR = "ssl_error",
  HTTP_ERROR = "http_error",
  INVALID_RESPONSE = "invalid_response",
  RATE_LIMITED = "rate_limited",
  AUTHENTICATION_FAILED = "authentication_failed",
  AUTHORIZATION_FAILED = "authorization_failed",
  PAYLOAD_TOO_LARGE = "payload_too_large",
  INVALID_URL = "invalid_url",
  CANCELLED = "cancelled",
  UNKNOWN = "unknown",
}

// Interface extending Document
export interface IWebhookConfig extends BaseDocument {
  memberId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  url: string;
  // secret?: string;
  method: WebhookMethod;
  events: WebhookEventType[];
  isActive: boolean;
  environment: WebhookEnvironment;
  priority: WebhookPriority;
  contentType: WebhookContentType;
  timeout: number;
  headers?: Record<string, string>;
  security: IWebhookSecurity;
  retryConfig: IWebhookRetryConfig;
  filters?: IWebhookFilters;
  transformation?: IWebhookTransformation;
  rateLimit?: IWebhookRateLimit;
  metadata?: Record<string, any>;
  tags?: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  nextRetryAt?: Date;

  // lastResponse?: {
  //   statusCode: number;
  //   message: string;
  // };

  toJSON(): any;
  updateLastTriggered(): Promise<void>;
}

// Webhook Security Configuration
export type IWebhookSecurity = {
  type: WebhookSecurityType;
  apiKey?: string;
  bearerToken?: string;
  hmacSecret?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    scope?: string[];
  };
  customHeaders?: Record<string, string>;
  ipWhitelist?: string[];
  userAgent?: string;
};

// Webhook Retry Configuration
export type IWebhookRetryConfig = {
  strategy: WebhookRetryStrategy;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier?: number;
  retryOnStatus?: number[];
  stopOnStatus?: number[];
  enabled: boolean;
};

// Webhook Event Data
export type IWebhookEvent = {
  id: string;
  type: WebhookEventType;
  resourceId: string;
  resourceType: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  source: string;
  version: string;
  correlationId?: string;
  causedBy?: {
    userId?: string;
    adminId?: string;
    system?: string;
    ip?: string;
    userAgent?: string;
  };
};

export interface IWebhookDelivery extends BaseDocument {
  webhookId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  attempt: number;
  // payload: Record<string, any>;
  status: WebhookStatus;
  httpStatus?: number;
  response?: {
    statusCode: number;
    statusMessage?: string;
    headers?: Record<string, string>;
    body?: string;
    duration: number;
    size: number;
  };
  request?: {
    url: string;
    method: WebhookMethod;
    headers: Record<string, string>;
    body: string;
    size: number;
  };
  error?: {
    code: WebhookFailureReason;
    message: string;
    details?: any;
    stack?: string;
  };
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  nextRetryAt?: Date;
  retryAfter?: number;
  metadata?: Record<string, any>;
}

// Request/Response Types
export type CreateWebhookRequest = {
  name: string;
  description?: string;
  url: string;
  method?: WebhookMethod;
  events: WebhookEventType[];
  environment?: WebhookEnvironment;
  priority?: WebhookPriority;
  contentType?: WebhookContentType;
  timeout?: number;
  headers?: Record<string, string>;
  security?: Partial<IWebhookSecurity>;
  retryConfig?: Partial<IWebhookRetryConfig>;
  metadata?: Record<string, any>;
  tags?: string[];
};

export type UpdateWebhookRequest = {
  name?: string;
  description?: string;
  url?: string;
  method?: WebhookMethod;
  events?: WebhookEventType[];
  isActive?: boolean;
  environment?: WebhookEnvironment;
  priority?: WebhookPriority;
  contentType?: WebhookContentType;
  timeout?: number;
  headers?: Record<string, string>;
  security?: Partial<IWebhookSecurity>;
  retryConfig?: Partial<IWebhookRetryConfig>;
  metadata?: Record<string, any>;
  tags?: string[];
};

// Filter interfaces
export type IWebhookFilters = {
  userTypes?: string[];
  propertyTypes?: string[];
  counties?: string[];
  minAmount?: number;
  maxAmount?: number;
  timeWindow?: {
    start: string;
    end: string;
    timezone?: string;
  };
  conditions?: IWebhookCondition[];
};

export type IWebhookCondition = {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "in"
    | "nin"
    | "exists"
    | "regex";
  value: any;
  logicalOperator?: "and" | "or";
};

export type IWebhookTransformation = {
  template?: string;
  mapping?: Record<string, string>;
  includeFields?: string[];
  excludeFields?: string[];
  addFields?: Record<string, any>;
  script?: string;
};

export type IWebhookRateLimit = {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
  skipOnError?: boolean;
};

// Kenya-specific Constants
export const WEBHOOK_CONSTANTS = {
  BUSINESS_HOURS: {
    start: "08:00",
    end: "18:00",
    timezone: "Africa/Nairobi",
  },

  COUNTIES: [
    "Nairobi",
    "Mombasa",
    "Kiambu",
    "Nakuru",
    "Machakos",
    "Kajiado",
    "Murang'a",
    "Kisumu",
    "Uasin Gishu",
    "Meru",
  ],

  TIMEOUTS: {
    LOCAL: 10_000,
    MPESA: 30_000,
    SMS: 15_000,
    EMAIL: 20_000,
    DEFAULT: 15_000,
  },

  RETRY_CONFIGS: {
    MPESA: {
      strategy: WebhookRetryStrategy.EXPONENTIAL_BACKOFF,
      maxAttempts: 5,
      initialDelay: 5000,
      maxDelay: 300_000,
      backoffMultiplier: 2,
      maxBackoffDelay: 60_000,
    },
    SMS: {
      strategy: WebhookRetryStrategy.LINEAR_BACKOFF,
      maxAttempts: 3,
      initialDelay: 10_000,
      maxDelay: 60_000,
      backoffMultiplier: 2,
      maxBackoffDelay: 60_000,
    },
    DEFAULT: {
      strategy: WebhookRetryStrategy.EXPONENTIAL_BACKOFF,
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30_000,
      backoffMultiplier: 2,
      maxBackoffDelay: 60_000,
    },
  },
};

export interface IAPIVersion extends Document {
  version: string;
  isActive: boolean;
  isDefault: boolean;
  deprecatedAt: Date;
  sunsetAt: Date;
  changelog: string;
  createdAt: Date;
  updatedAt: Date;
}
