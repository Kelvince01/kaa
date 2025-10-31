/**
 * Email Service Types
 *
 * Comprehensive email system for Kenya rental platform
 * Includes SendGrid integration, templates, delivery tracking, and analytics
 */

import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { ITemplate } from "./template.type";

/**
 * Email template types
 */
export enum EmailTemplateType {
  WELCOME = "welcome",
  LOGIN_ALERT = "login_alert",
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  APPLICATION_STATUS = "application_status",
  PROPERTY_INQUIRY = "property_inquiry",
  PAYMENT_CONFIRMATION = "payment_confirmation",
  PAYMENT_REMINDER = "payment_reminder",
  MAINTENANCE_REQUEST = "maintenance_request",
  LEASE_AGREEMENT = "lease_agreement",
  MONTHLY_STATEMENT = "monthly_statement",
  SYSTEM_NOTIFICATION = "system_notification",
  MARKETING_NEWSLETTER = "marketing_newsletter",
  PROPERTY_ALERT = "property_alert",
  RENTAL_RECEIPT = "rental_receipt",
  MPESA_CONFIRMATION = "mpesa_confirmation",
}

/**
 * Email status states
 */
export enum EmailStatus {
  DRAFT = "draft",
  QUEUED = "queued",
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  OPENED = "opened",
  CLICKED = "clicked",
  BOUNCED = "bounced",
  FAILED = "failed",
  SPAM = "spam",
  UNSUBSCRIBED = "unsubscribed",
}

/**
 * Email priority levels
 */
export enum EmailPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Email categories for analytics
 */
export enum EmailCategory {
  AUTHENTICATION = "authentication",
  TRANSACTIONAL = "transactional",
  NOTIFICATION = "notification",
  MARKETING = "marketing",
  SUPPORT = "support",
  SYSTEM = "system",
  BILLING = "billing",
}

/**
 * Email attachment types
 */
export enum EmailAttachmentType {
  PDF = "pdf",
  IMAGE = "image",
  DOCUMENT = "document",
  RECEIPT = "receipt",
  CONTRACT = "contract",
  INVOICE = "invoice",
}

/**
 * Email bounce types
 */
export enum BounceType {
  HARD = "hard",
  SOFT = "soft",
  TEMPORARY = "temporary",
}

export type EmailSettings = {
  enableDeliveryReports: boolean;
  maxRetries: number;
  retryInterval: number; // minutes
  timeout?: number; // seconds
  provider: string;
  webhookUrl?: string;
  tracking?: {
    enabled: boolean;
    pixel?: boolean;
    links?: boolean;
  };
};

export type IEmailError = {
  code: string;
  message: string;
  provider?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  stack?: string;
};

export type EmailDeliveryStatus = {
  delivered: number;
  failed: number;
  pending: number;
  total: number;
  lastUpdated: Date;
  providerStatus?: string;
  providerError?: string;
};

/**
 * Email attachment interface
 */
export type IEmailAttachment = {
  _id: string;
  filename: string;
  content: string; // Base64 encoded
  type: EmailAttachmentType;
  disposition: "attachment" | "inline";
  contentId?: string; // For inline images
  size: number;
  mimeType: string;
  url?: string; // For URL-based attachments
};

/**
 * Email address interface
 */
export type IEmailAddress = {
  email: string;
  name?: string;
};

export type EmailContext = {
  userId?: mongoose.Types.ObjectId;
  orgId?: mongoose.Types.ObjectId;
  campaignId?: string;
  applicationId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  unitId?: mongoose.Types.ObjectId;
  tenantId?: mongoose.Types.ObjectId;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  tags?: string[];
};

export type EmailContent = {
  subject?: string;
  body: string;
  html?: string;
  text?: string;
  attachments?: IEmailAttachment[];
};

export interface IEmail extends BaseDocument {
  templateType?: EmailTemplateType;

  // Recipients
  to: IEmailAddress[];
  cc?: IEmailAddress[];
  bcc?: IEmailAddress[];
  from: IEmailAddress;
  replyTo?: IEmailAddress;

  // Content
  content: EmailContent;

  // Metadata
  templateId?: mongoose.Types.ObjectId;
  category: EmailCategory;
  priority: EmailPriority;

  // Tracking
  status: EmailStatus;
  deliveryAttempts: number;
  maxAttempts: number;

  // Kenya-specific features
  language: "en" | "sw";
  businessHoursOnly: boolean;
  respectOptOut: boolean;

  // Dates
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;

  // Error tracking
  lastError?: string;
  bounceReason?: string;
  bounceType?: BounceType;

  // Flags
  isTest: boolean;

  headers?: Record<string, string>;
  context?: EmailContext;
  metadata?: Record<string, any>;

  scheduledAt?: Date;
  settings: EmailSettings;
  expiresAt?: Date;
  deliveryStatus?: EmailDeliveryStatus;
  error?: IEmailError;

  markAsDelivered(): Promise<void>;
  markAsOpened(): Promise<void>;
  markAsClicked(): Promise<void>;
  markAsBounced(bounceType: BounceType, reason: string): Promise<void>;
  markAsFailed(reason: string): Promise<void>;
  canRetry(): boolean;
}

// export type IEmailQueue = {
//   type: "sendEmail" | "sendEmailWithTemplate" | "sendBulkEmail" | "sendBulkEmailWithTemplate";
//   data: IEmail | IEmailWithTemplate | IEmailBulk | IEmailBulkWithTemplate;
//   options?: {
//     delay?: number;
//     attempts?: number;
//     backoff?: {
//       type: "fixed" | "exponential";
//       delay: number;
//     };
//   };
// }

// Analytics types
export type EmailMetrics = {
  total: number;
  delivered: number;
  failed: number;
  bounced: number;
  pending: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
  averageDeliveryTime?: number; // minutes
};

/**
 * Email analytics interface
 */
export type IEmailAnalytics = {
  _id: string;
  date: Date;
  templateType?: EmailTemplateType;
  category: EmailCategory;

  // Basic metrics
  totalEmails: number;
  sent: number;
  delivered: number;
  bounced: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;

  // Calculated rates
  deliveryRate: number; // delivered / sent
  openRate: number; // opened / delivered
  clickRate: number; // clicked / delivered
  bounceRate: number; // bounced / sent
  unsubscribeRate: number; // unsubscribed / delivered

  // Kenya-specific metrics
  kenyaMetrics?: {
    swahiliEmails: number;
    englishEmails: number;
    mpesaRelatedEmails: number;
    businessHoursEmails: number;
    peakHours: Record<string, number>;
  };

  // Performance metrics
  averageDeliveryTime: number; // in seconds
  averageOpenTime: number; // in seconds from delivery

  createdAt: Date;
  updatedAt: Date;
};

/**
 * Email bounce tracking interface
 */
export type IEmailBounce = {
  _id: string;
  emailId: string;
  email: string;
  bounceType: BounceType;
  bounceReason: string;
  bouncedAt: Date;
  sendGridEventId?: string;

  // Automatic handling
  shouldRetry: boolean;
  retryAfter?: Date;
  isBlacklisted: boolean;

  createdAt: Date;
};

export type EmailBulkProgress = {
  total: number;
  sent: number;
  delivered: number;
  pending: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  unsubscribed: number;
  percentage: number;
};

export type IEmailBulk = {
  name: string;
  description?: string;
  priority: EmailPriority;
  recipients: IEmailAddress[];
  template?: mongoose.Types.ObjectId;
  settings: EmailSettings;
  status: EmailStatus;
  progress: EmailBulkProgress;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  emailIds: string[];
  context: EmailContext;
  createdBy?: mongoose.Types.ObjectId;
} & BaseDocument;

export type IEmailWebhookPayload = {
  type: "delivery" | "bounce" | "complaint" | "open" | "click";
  emailId: string;
  recipient?: IEmailAddress;
  timestamp: Date;
  status?: EmailStatus;
  error?: {
    code: string;
    message: string;
  };
  metadata?: Record<string, any>;
};

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Send email request
 */
export type SendEmailRequest = {
  templateType?: EmailTemplateType;
  to: IEmailAddress[];
  cc?: IEmailAddress[];
  bcc?: IEmailAddress[];
  from?: IEmailAddress;
  replyTo?: IEmailAddress;

  // Content (for non-template emails)
  content: EmailContent;

  // Settings
  priority?: EmailPriority;
  category?: EmailCategory;
  language?: "en" | "sw";
  scheduledAt?: Date;
  context?: EmailContext;
  metadata?: Record<string, any>;
  settings: EmailSettings;

  // Options
  respectBusinessHours?: boolean;
  respectOptOut?: boolean;
  isTest?: boolean;
};

/**
 * Bulk email request
 */
export type BulkEmailRequest = {
  name: string;
  description?: string;
  templateType: EmailTemplateType;
  recipients: Array<{
    to: IEmailAddress;
    cc?: IEmailAddress;
    bcc?: IEmailAddress;
  }>;
  template?: mongoose.Types.ObjectId;

  // Settings
  priority?: EmailPriority;
  category?: EmailCategory;
  tags?: string[];
  language?: "en" | "sw";
  scheduledFor?: Date;
  context?: EmailContext;
  metadata?: Record<string, any>;
  settings: EmailSettings;

  // Bulk options
  batchSize?: number;
  delayBetweenBatches?: number; // in milliseconds
  respectBusinessHours?: boolean;
  respectOptOut?: boolean;
  isTest?: boolean;
};

/**
 * Email template request
 */
export type EmailTemplateRequest = {
  type: EmailTemplateType;
  name: string;
  description: string;
  category: EmailCategory;
  subject: string;
  textContent?: string;
  htmlContent?: string;

  // Multi-language
  translations?: {
    [language: string]: {
      subject: string;
      textContent?: string;
      htmlContent?: string;
    };
  };

  // SendGrid
  sendGridTemplateId?: string;

  // Variables
  requiredVariables?: string[];
  optionalVariables?: string[];

  // Settings
  isActive?: boolean;
  isDefault?: boolean;
  respectBusinessHours?: boolean;
  defaultLanguage?: "en" | "sw";
};

/**
 * Email filters
 */
export type EmailFilters = {
  status?: EmailStatus | EmailStatus[];
  category?: EmailCategory | EmailCategory[];
  templateType?: EmailTemplateType | EmailTemplateType[];
  priority?: EmailPriority | EmailPriority[];
  language?: "en" | "sw";

  // Date filters
  sentAfter?: Date;
  sentBefore?: Date;
  scheduledAfter?: Date;
  scheduledBefore?: Date;

  // Relations
  userId?: string;
  propertyId?: string;
  applicationId?: string;
  paymentId?: string;

  // Tracking filters
  hasOpened?: boolean;
  hasClicked?: boolean;
  hasBounced?: boolean;

  // Search
  search?: string; // searches subject and content
  tags?: string[];

  // Pagination
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "sentAt" | "status" | "priority";
  sortOrder?: "asc" | "desc";
};

/**
 * Email response
 */
export type EmailResponse = {
  email: IEmail;
  template?: ITemplate;
  analytics?: {
    opens: number;
    clicks: number;
    bounces: number;
  };
  canRetry: boolean;
  canCancel: boolean;
};

/**
 * Email list response
 */
export type EmailListResponse = {
  emails: EmailResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalEmails: number;
    sentEmails: number;
    deliveredEmails: number;
    failedEmails: number;
    pendingEmails: number;
  };
  filters: EmailFilters;
};

/**
 * Email analytics response
 */
export type EmailAnalyticsResponse = {
  analytics: IEmailAnalytics[];
  summary: {
    totalEmails: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
    averageDeliveryTime: number;
  };
  kenyaSummary?: {
    swahiliEmailsPercent: number;
    englishEmailsPercent: number;
    businessHoursEmailsPercent: number;
    peakHour: string;
    mpesaRelatedPercent: number;
  };
};

/**
 * Template test request
 */
export type EmailTemplateTestRequest = {
  templateType: EmailTemplateType;
  testEmail: string;
  language?: "en" | "sw";
};

// ==================== WEBHOOK TYPES ====================

/**
 * SendGrid webhook event types
 */
export enum SendGridEventType {
  PROCESSED = "processed",
  DROPPED = "dropped",
  DELIVERED = "delivered",
  DEFERRED = "deferred",
  BOUNCE = "bounce",
  OPEN = "open",
  CLICK = "click",
  SPAM_REPORT = "spamreport",
  UNSUBSCRIBE = "unsubscribe",
  GROUP_UNSUBSCRIBE = "group_unsubscribe",
  GROUP_RESUBSCRIBE = "group_resubscribe",
}

/**
 * SendGrid webhook payload
 */
export type SendGridWebhookPayload = {
  email: string;
  event: SendGridEventType;
  timestamp: number;
  "smtp-id"?: string;
  sg_event_id: string;
  sg_message_id: string;

  // Event-specific data
  reason?: string; // for bounce, dropped
  status?: string; // for bounce
  type?: string; // for bounce
  url?: string; // for click
  useragent?: string; // for open, click
  ip?: string; // for open, click

  // Custom data
  unique_args?: Record<string, any>;
  category?: string[];

  // Marketing campaign data
  marketing_campaign_id?: string;
  marketing_campaign_name?: string;
};

// ==================== CONFIGURATION TYPES ====================

/**
 * SendGrid configuration
 */
export type SendGridConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  webhookEndpoint?: string;
  webhookSigningKey?: string;
  sandboxMode?: boolean;
  templates?: Record<EmailTemplateType, string>;
};

/**
 * Email service configuration
 */
export type EmailServiceConfig = {
  sendGrid: SendGridConfig;
  defaultFrom: IEmailAddress;

  // Queue settings
  maxRetries: number;
  retryDelay: number; // in milliseconds
  batchSize: number;
  rateLimit: {
    maxEmailsPerHour: number;
    maxEmailsPerDay: number;
  };

  // Kenya-specific settings
  kenyaSettings: {
    businessHours: {
      start: number; // hour (0-23)
      end: number; // hour (0-23)
      timezone: string;
      excludeWeekends: boolean;
    };
    defaultLanguage: "en" | "sw";
    respectOptOut: boolean;
  };

  // Feature flags
  features: {
    enableAnalytics: boolean;
    enableWebhooks: boolean;
    enableTemplateCache: boolean;
    enableBounceHandling: boolean;
  };
};

export type EmailAnalytics = {
  period: {
    start: Date;
    end: Date;
  };
  totals: EmailMetrics;
  byStatus: Record<EmailStatus, number>;
  byProvider: Record<string, EmailMetrics>;
  byTemplate: Record<string, EmailMetrics>;
  byCategory: Record<EmailCategory, EmailMetrics>;
  trends: {
    hourly: Array<{
      hour: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
    daily: Array<{
      date: string;
      sent: number;
      delivered: number;
      failed: number;
    }>;
  };
  costs: {
    total: number;
    byProvider: Record<string, number>;
    averagePerMessage: number;
  };
  performance: {
    averageSendTime: number;
    averageRenderTime: number;
    queueWaitTime: number;
    successRate: number;
  };
};

export type TemplateAnalytics = {
  templateId: string;
  templateName: string;
  category: EmailCategory;
  usage: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  performance: {
    averageRenderTime: number;
    averageDeliveryTime?: number;
    cacheHitRate?: number;
  };
  metrics: {
    delivered?: number;
    opened?: number; // Email only
    clicked?: number; // Email only
    bounced?: number;
    complained?: number;
    unsubscribed?: number;
  };
  rates: {
    deliveryRate?: number;
    openRate?: number;
    clickRate?: number;
    bounceRate?: number;
    complaintRate?: number;
    unsubscribeRate?: number;
  };
  lastUsed?: Date;
};

export type ProviderAnalytics = {
  provider: string;
  metrics: EmailMetrics;
  costs: {
    total: number;
    averagePerMessage: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
  };
  limits: {
    rateLimit?: {
      current: number;
      limit: number;
      resetTime: Date;
    };
    quota?: {
      used: number;
      limit: number;
      resetTime: Date;
    };
  };
  status: "healthy" | "degraded" | "unhealthy";
};

export type CampaignAnalytics = {
  campaignId: string;
  campaignName?: string;
  communications: EmailAnalytics;
  templates: TemplateAnalytics[];
  providers: ProviderAnalytics[];
  abTests?: ABTestAnalytics[];
  goals?: {
    name: string;
    target: number;
    achieved: number;
    conversionRate: number;
  }[];
};

export type ABTestAnalytics = {
  testId: string;
  testName: string;
  status: "running" | "completed" | "stopped";
  variants: Array<{
    variantId: string;
    variantName: string;
    weight: number;
    sampleSize: number;
    metrics: {
      sent: number;
      delivered: number;
      opened?: number;
      clicked?: number;
      converted?: number;
    };
    rates: {
      deliveryRate?: number;
      openRate?: number;
      clickRate?: number;
      conversionRate?: number;
    };
  }>;
  winner?: {
    variantId: string;
    variantName: string;
    confidence: number;
    improvement: number;
  };
  startedAt: Date;
  endedAt?: Date;
  duration: number; // days
};

export type UserAnalytics = {
  userId: string;
  communications: {
    total: number;
    // byType: Record<EmailType, number>;
    byStatus: Record<EmailStatus, number>;
  };
  preferences: {
    unsubscribed: boolean;
    categories: Record<EmailCategory, boolean>;
    // channels: Record<EmailType, boolean>;
  };
  engagement: {
    openRate?: number;
    clickRate?: number;
    lastActivity: Date;
  };
};

export type GeographicAnalytics = {
  byCountry: Record<string, EmailMetrics>;
  byRegion: Record<string, EmailMetrics>;
  byCity: Record<string, EmailMetrics>;
  topPerforming: {
    countries: Array<{ code: string; metrics: EmailMetrics }>;
    regions: Array<{ code: string; metrics: EmailMetrics }>;
    cities: Array<{ code: string; metrics: EmailMetrics }>;
  };
};

export type TimeBasedAnalytics = {
  byHour: Record<number, EmailMetrics>;
  byDayOfWeek: Record<number, EmailMetrics>;
  byMonth: Record<number, EmailMetrics>;
  peakHours: Array<{
    hour: number;
    volume: number;
    deliveryRate: number;
  }>;
  bestPerformingTimes: {
    hour: number;
    dayOfWeek: number;
    deliveryRate: number;
  };
};

export type AnalyticsQuery = {
  startDate: Date;
  endDate: Date;
  status?: EmailStatus[];
  provider?: string[];
  templateId?: string[];
  category?: EmailCategory[];
  userId?: string;
  orgId?: string;
  campaignId?: string;
  groupBy?:
    | "hour"
    | "day"
    | "week"
    | "month"
    | "provider"
    | "template"
    | "type";
  metrics?: string[]; // Specific metrics to include
};

export type AnalyticsReport = {
  id: string;
  name: string;
  description?: string;
  query: AnalyticsQuery;
  data: EmailAnalytics;
  generatedAt: Date;
  generatedBy?: string;
  format: "json" | "csv" | "pdf";
  scheduled?: {
    frequency: "daily" | "weekly" | "monthly";
    nextRun: Date;
  };
};

export type RealTimeMetrics = {
  activeJobs: number;
  queuedJobs: number;
  failedJobs: number;
  processingRate: number; // messages per second
  averageQueueTime: number; // seconds
  errorRate: number;
  providers: Record<
    string,
    {
      status: "healthy" | "degraded" | "unhealthy";
      activeJobs: number;
      errorRate: number;
    }
  >;
};

// Alert and monitoring types
export type EmailAlertCondition = {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  duration?: number; // minutes
};

export type AlertRule = {
  id: string;
  name: string;
  description?: string;
  conditions: EmailAlertCondition[];
  // channels: EmailType[];
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
};

export type EmailAlert = {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: Date;
  resolvedAt?: Date;
  data: Record<string, any>;
};

// ==================== CONSTANTS ====================

/**
 * Kenya-specific email constants
 */
export const EMAIL_CONSTANTS = {
  // Business hours (East Africa Time)
  BUSINESS_HOURS: {
    START: 8, // 8 AM
    END: 18, // 6 PM
    TIMEZONE: "Africa/Nairobi",
  },

  // Default email addresses
  DEFAULT_FROM: {
    email: "no-reply@kenyarentals.com",
    name: "Kenya Rentals Platform",
  },

  SUPPORT_EMAIL: {
    email: "support@kenyarentals.com",
    name: "Kenya Rentals Support",
  },

  BILLING_EMAIL: {
    email: "billing@kenyarentals.com",
    name: "Kenya Rentals Billing",
  },

  // Template defaults
  DEFAULT_TEMPLATES: {
    [EmailTemplateType.WELCOME]: "Welcome to Kenya Rentals Platform!",
    [EmailTemplateType.EMAIL_VERIFICATION]: "Verify your email address",
    [EmailTemplateType.PASSWORD_RESET]: "Reset your password",
    [EmailTemplateType.MPESA_CONFIRMATION]: "M-Pesa Payment Confirmed",
    [EmailTemplateType.PAYMENT_REMINDER]: "Payment Reminder - Due Soon",
  },

  // Rate limits
  RATE_LIMITS: {
    MAX_EMAILS_PER_HOUR: 1000,
    MAX_EMAILS_PER_DAY: 10_000,
    BULK_BATCH_SIZE: 100,
  },

  // Retry settings
  RETRY_SETTINGS: {
    MAX_ATTEMPTS: 3,
    BACKOFF_MULTIPLIER: 2,
    INITIAL_DELAY: 60_000, // 1 minute
  },

  // Swahili common phrases
  SWAHILI_PHRASES: {
    GREETING: "Hujambo",
    THANK_YOU: "Asante sana",
    WELCOME: "Karibu",
    PAYMENT_CONFIRMED: "Malipo yamethibitishwa",
    DUE_DATE: "Tarehe ya malipo",
    CONTACT_SUPPORT: "Wasiliana na msaada",
  },
} as const;

/**
 * Email error codes
 */
export const EMAIL_ERROR_CODES = {
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  INVALID_EMAIL_ADDRESS: "INVALID_EMAIL_ADDRESS",
  SENDGRID_API_ERROR: "SENDGRID_API_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TEMPLATE_VALIDATION_ERROR: "TEMPLATE_VALIDATION_ERROR",
  ATTACHMENT_TOO_LARGE: "ATTACHMENT_TOO_LARGE",
  INVALID_TEMPLATE_VARIABLES: "INVALID_TEMPLATE_VARIABLES",
  EMAIL_BOUNCE_LIMIT_EXCEEDED: "EMAIL_BOUNCE_LIMIT_EXCEEDED",
  BUSINESS_HOURS_RESTRICTION: "BUSINESS_HOURS_RESTRICTION",
  USER_OPTED_OUT: "USER_OPTED_OUT",
  QUEUE_PROCESSING_ERROR: "QUEUE_PROCESSING_ERROR",
  WEBHOOK_VALIDATION_ERROR: "WEBHOOK_VALIDATION_ERROR",
} as const;

/**
 * Custom error class for email system
 */
export class EmailError extends Error {
  constructor(
    _code: keyof typeof EMAIL_ERROR_CODES,
    message: string,
    _statusCode = 400,
    _details?: any
  ) {
    super(message);
    this.name = "EmailError";
  }
}

// ==================== UTILITY TYPES ====================

/**
 * Email queue item
 */
export type EmailQueueItem = {
  id: string;
  emailId: string;
  priority: EmailPriority;
  scheduledFor: Date;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextAttemptAt?: Date;
  error?: string;
  createdAt: Date;
};

/**
 * Email delivery report
 */
export type IEmailDeliveryReport = {
  emailId: string;
  templateType?: EmailTemplateType;
  recipient: IEmailAddress;
  status: EmailStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  bounceReason?: string;
  deliveryTimeMs?: number;
  sendGridMessageId?: string;
  generatedAt: Date;
};

/**
 * Unsubscribe request
 */
export type UnsubscribeRequest = {
  email: string;
  categories?: EmailCategory[];
  reason?: string;
  unsubscribeToken?: string;
};

/**
 * Email preview request
 */
export type EmailPreviewRequest = {
  templateType: EmailTemplateType;
  language?: "en" | "sw";
};

/**
 * Email preview response
 */
export type EmailPreviewResponse = {
  subject: string;
  textContent?: string;
  htmlContent?: string;
  template: ITemplate;
};

// =========================== //
export type SendEmailBase = {
  metadata?: Record<string, any> | undefined;
  priority?: string | undefined;
  settings?:
    | {
        enableDeliveryReports?: boolean | undefined;
        maxRetries?: number | undefined;
        retryInterval?: number | undefined;
        provider?: string | undefined;
      }
    | undefined;
  to: string[];
  subject: string;
  content: string;
  headers?: Record<string, any> | undefined;
  tags?: string[] | undefined;
  cc?: string | string[] | undefined;
  bcc?: string | string[] | undefined;
  replyTo?: string | undefined;
  attachments?:
    | {
        content: ArrayBuffer;
        filename: string;
      }[]
    | undefined;
};

export type SendEmail = SendEmailBase & {
  html?: string | undefined;
  text?: string | undefined;
};

export type SendEmailWithTemplate = SendEmailBase & {
  data?: Record<string, any> | undefined;
  template?: Record<string, any> | undefined;
  userId: string;
  content: string;
  templateId: string;
  requestMetadata: {
    requestId: string;
    ipAddress: string;
    userAgent: string;
  };
};

export type SendBulkEmail = {
  priority?: string | undefined;
  settings?:
    | {
        enableDeliveryReports?: boolean | undefined;
        maxRetries?: number | undefined;
        retryInterval?: number | undefined;
        provider?: string | undefined;
      }
    | undefined;
  subject: string;
  content: string;
  recipients: string[];
};

export type SendBulkEmailWithTemplate = {
  data?: Record<string, any> | undefined;
  metadata?: Record<string, any> | undefined;
  priority?: string | undefined;
  settings?:
    | {
        enableDeliveryReports?: boolean | undefined;
        maxRetries?: number | undefined;
        retryInterval?: number | undefined;
        provider?: string | undefined;
      }
    | undefined;
  recipients: string[];
  templateId: string;
};

export type QueryEmails = {
  data?: Record<string, any> | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  subject?: string | undefined;
  content?: string | undefined;
  metadata?: Record<string, any> | undefined;
  priority?: string | undefined;
  recipients?: string[] | undefined;
  templateId?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  status?: string | undefined;
};

export default {
  EmailTemplateType,
  EmailStatus,
  EmailPriority,
  EmailCategory,
  EmailAttachmentType,
  BounceType,
  SendGridEventType,
  KENYA_EMAIL_CONSTANTS: EMAIL_CONSTANTS,
  EMAIL_ERROR_CODES,
  EmailError,
};
