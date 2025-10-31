/**
 * SMS Service Types
 *
 * Comprehensive SMS system for Kenya rental platform
 * Includes Africa's Talking integration, delivery reports, and Kenya optimization
 */

import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { ITemplate } from "./template.type";

/**
 * SMS template types
 */
export enum SmsTemplateType {
  OTP_VERIFICATION = "otp_verification",
  WELCOME_MESSAGE = "welcome_message",
  PAYMENT_CONFIRMATION = "payment_confirmation",
  PAYMENT_REMINDER = "payment_reminder",
  APPLICATION_STATUS = "application_status",
  PROPERTY_ALERT = "property_alert",
  MAINTENANCE_UPDATE = "maintenance_update",
  MARKETING_CAMPAIGN = "marketing_campaign",
  SYSTEM_ALERT = "system_alert",
}

/**
 * SMS delivery status
 */
export enum SmsDeliveryStatus {
  QUEUED = "Queued",
  SENDING = "Sending",
  SENT = "Sent",
  DELIVERED = "Success",
  FAILED = "Failed",
  REJECTED = "Rejected",
  BUFFERED = "Buffered",
}

export enum SmsType {
  TRANSACTIONAL = "transactional",
  PROMOTIONAL = "promotional",
  NOTIFICATION = "notification",
  ALERT = "alert",
  REMINDER = "reminder",
  VERIFICATION = "verification",
  BULK = "bulk",
}

/**
 * SMS priority levels
 */
export enum SmsPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * SMS message category
 */
export enum SmsCategory {
  AUTHENTICATION = "authentication",
  TRANSACTIONAL = "transactional",
  NOTIFICATION = "notification",
  MARKETING = "marketing",
  SYSTEM = "system",
}

/**
 * Kenyan mobile network codes
 */
export enum KenyaNetworkCode {
  SAFARICOM = "63902",
  AIRTEL = "63903",
  TELKOM = "63907",
  EQUITEL = "63905",
  JTL = "63901",
}

export enum SmsProvider {
  AFRICASTALKING = "africastalking",
  TWILIO = "twilio",
  AWS_SNS = "aws-sns",
  MOCK = "mock",
}

export type ISmsRecipient = {
  phoneNumber: string;
  name?: string;
  metadata?: Record<string, any>;
};

export type ISmsMessage = BaseDocument & {
  to: ISmsRecipient[];
  message?: string; // Raw message content
  template?: mongoose.Types.ObjectId; // Template-based message
  templateType?: SmsTemplateType;
  type: SmsType;

  // Africa's Talking specific
  from?: string; // Shortcode or Alphanumeric
  bulkSMSMode: boolean;
  messageId?: string; // Provider message ID
  cost?: number;
  currencyCode?: string;

  // Metadata
  segments?: number; // Number of SMS segments
  encoding?: "GSM_7BIT" | "UCS2";
  priority: SmsPriority;
  tags: string[];
  category: SmsCategory;

  // Scheduling
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;

  // Tracking
  status: SmsDeliveryStatus;
  deliveryAttempts: number;
  maxAttempts: number;
  failureReason?: string;
  networkCode?: KenyaNetworkCode;

  // Kenya-specific features
  isSwahili: boolean;
  respectBusinessHours: boolean;
  respectOptOut: boolean;

  // Flags
  isTest: boolean;

  // Tracking
  deliveryStatus?: {
    delivered: number;
    failed: number;
    pending: number;
    total: number;
    lastUpdated: Date;
  };

  // Error handling
  error?: {
    code: string;
    message: string;
    provider?: string;
    retryCount?: number;
    lastRetryAt?: Date;
  };

  // Context
  context?: {
    userId?: string;
    orgId?: string;
    campaignId?: string;
    propertyId?: string;
    applicationId?: string;
    paymentId?: string;
    unitId?: string;
    tenantId?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
  };

  // Settings
  settings?: {
    enableDeliveryReports?: boolean;
    maxRetries?: number;
    retryInterval?: number; // in minutes
    provider?: SmsProvider;
    webhookUrl?: string;
  };

  createdAt?: Date;
  updatedAt?: Date;

  detectSwahili: () => void;
  canRetry: () => boolean;
};

export type ISmsBulkMessage = {
  _id?: string;
  name: string;
  description?: string;
  recipients: ISmsRecipient[];
  template: mongoose.Types.ObjectId;
  type: SmsType;
  priority: SmsPriority;
  status:
    | "draft"
    | "scheduled"
    | "sending"
    | "completed"
    | "failed"
    | "cancelled";

  // Scheduling
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Progress tracking
  progress: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
    percentage: number;
  };

  // Settings
  settings: {
    batchSize?: number; // Number of SMS to send per batch
    batchInterval?: number; // Interval between batches in seconds
    enableDeliveryReports: boolean;
    maxRetries: number;
    provider?: SmsProvider;
    webhookUrl?: string;
  };

  // Individual message IDs for tracking
  messageIds: string[];

  context?: {
    userId?: string;
    orgId?: string;
    campaignId?: string;
  };

  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ISmsDeliveryReport = {
  _id?: string;
  messageId: string;
  providerMessageId: string;
  phoneNumber: string;
  status: SmsDeliveryStatus;
  cost?: string;
  networkCode?: string;
  errorCode?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  createdAt?: Date;
};

export type SmsDeliveryStatusTracking = {
  delivered: number;
  failed: number;
  pending: number;
  total: number;
  lastUpdated: Date;
  providerStatus?: string;
  providerError?: string;
};

export type SmsWebhookPayload = {
  type: "delivery" | "bounce" | "complaint" | "open" | "click";
  smsId: string;
  providerMessageId?: string;
  recipient?: ISmsRecipient;
  timestamp: Date;
  status?: SmsDeliveryStatus;
  error?: {
    code: string;
    message: string;
  };
  metadata?: Record<string, any>;
};

export type SendResult = {
  success: boolean;
  providerMessageId?: string;
  cost?: number;
  segments?: number;
  status?: string;
  error?: {
    code: string;
    message: string;
    providerCode?: string;
  };
  metadata?: Record<string, any>;
};

export type SmsConfig = {
  provider: SmsProvider;
  settings: {
    africastalking?: {
      apiKey: string;
      username: string;
      appName: string;
      shortCode: string;
    };
    twilio?: {
      accountSid: string;
      authToken: string;
      fromNumber: string;
    };
    awsSns?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
    };
  };

  // Global settings
  defaults: {
    maxRetries: number;
    retryInterval: number; // in minutes
    enableDeliveryReports: boolean;
    maxLength: number;
    expiryHours: number;
  };

  // Rate limiting
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
    maxPerDay: number;
  };

  // Webhooks
  webhooks: {
    deliveryReports?: string;
    inboundSms?: string;
  };
};

export type ISmsAnalytics = {
  period: "hour" | "day" | "week" | "month";
  startDate: Date;
  endDate: Date;
  templateType: SmsTemplateType;
  category: SmsCategory;

  totals: {
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  };

  byType: Record<
    SmsType,
    {
      sent: number;
      delivered: number;
      failed: number;
      cost: number;
    }
  >;

  byProvider: Record<
    SmsProvider,
    {
      sent: number;
      delivered: number;
      failed: number;
      cost: number;
    }
  >;

  deliveryRate: number; // percentage
  failureRate: number; // percentage
  averageCostPerSms: number;

  topTemplates: Array<{
    templateId: string;
    templateName: string;
    usage: number;
    deliveryRate: number;
  }>;

  trends: Array<{
    date: Date;
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  }>;

  // Kenya-specific metrics
  kenyaMetrics?: {
    safaricomCount: number;
    airtelCount: number;
    telkomCount: number;
    businessHoursSms: number;
    swahiliSms: number;
    otpSms: number;
    mpesaSms: number;
  };

  calculateDeliveryRate: () => void;
  calculateFailureRate: () => void;
  calculateAverageCost: () => void;
};

// Service interfaces
export type SmsServiceResponse = {
  success: boolean;
  messageId?: string;
  providerMessageId?: string;
  cost?: string;
  segments?: number;
  error?: {
    code: string;
    message: string;
  };
};

export type SmsBulkServiceResponse = {
  success: boolean;
  bulkId: string;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  cost?: string;
  errors?: Array<{
    phoneNumber: string;
    error: string;
  }>;
};

export type SmsQueueJob = {
  type: "send_sms" | "send_bulk_sms" | "process_delivery_report";
  data: ISmsMessage | ISmsBulkMessage | ISmsDeliveryReport;
  options?: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: "fixed" | "exponential";
      delay: number;
    };
  };
};

// Validation schemas (for use with validation libraries)
export type SmsValidationRules = {
  phoneNumber: {
    pattern: RegExp;
    minLength: number;
    maxLength: number;
  };
  message: {
    maxLength: number;
    minLength: number;
  };
  template: {
    requiredFields: string[];
    maxVariables: number;
  };
};

// Event types for SMS webhooks and notifications
export type SmsEvent = {
  type:
    | "sms.sent"
    | "sms.delivered"
    | "sms.failed"
    | "sms.expired"
    | "bulk.completed"
    | "template.used";
  timestamp: Date;
  messageId: string;
  data: Record<string, any>;
  metadata?: {
    provider: SmsProvider;
    cost?: string;
    segments?: number;
  };
};

export type SmsSendResult = {
  success: boolean;
  providerMessageId?: string;
  cost?: number;
  segments?: number;
  status?: string;
  error?: {
    code: string;
    message: string;
    providerCode?: string;
  };
  metadata?: Record<string, any>;
};

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Send SMS request
 */
export type SendSmsRequest = {
  to: string | string[];
  message?: string;
  templateType?: SmsTemplateType;
  template?: ITemplate;

  // Options
  from?: string; // Shortcode or Alphanumeric
  priority?: SmsPriority;
  category?: SmsCategory;
  tags?: string[];
  language?: "en" | "sw";
  scheduledFor?: Date;

  // Kenya-specific
  respectBusinessHours?: boolean;
  respectOptOut?: boolean;

  // Relations
  userId?: string;
  propertyId?: string;
  applicationId?: string;
  paymentId?: string;

  isTest?: boolean;
};

/**
 * Bulk SMS request
 */
export type BulkSmsRequest = {
  recipients: Array<{
    to: string;
  }>;
  templateType: SmsTemplateType;
  language?: "en" | "sw";
  scheduledFor?: Date;
  respectBusinessHours?: boolean;
  respectOptOut?: boolean;
};

/**
 * SMS response
 */
export type SmsResponse = {
  sms: ISmsMessage;
  deliveryReport?: any;
  canRetry: boolean;
};

/**
 * SMS list filters
 */
export type SmsFilters = {
  status?: SmsDeliveryStatus | SmsDeliveryStatus[];
  category?: SmsCategory | SmsCategory[];
  templateType?: SmsTemplateType | SmsTemplateType[];
  networkCode?: KenyaNetworkCode;

  // Date filters
  sentAfter?: Date;
  sentBefore?: Date;

  // Relations
  userId?: string;
  propertyId?: string;
  applicationId?: string;

  // Search
  search?: string; // searches message content

  // Pagination
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "sentAt" | "status";
  sortOrder?: "asc" | "desc";
};

/**
 * SMS list response
 */
export type SmsListResponse = {
  smsMessages: SmsResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalCost: number;
  };
  filters: SmsFilters;
};

// ==================== WEBHOOK TYPES ====================

/**
 * Africa's Talking delivery report payload
 */
export type AtDeliveryReportPayload = {
  id: string;
  status: SmsDeliveryStatus;
  phoneNumber: string;
  networkCode: KenyaNetworkCode;
  retryCount?: number;
  failureReason?: string;
};

/**
 * Africa's Talking incoming message payload
 */
export type AtIncomingMessagePayload = {
  from: string;
  to: string;
  text: string;
  date: string;
  id: string;
  linkId?: string;
};

// ==================== CONFIGURATION TYPES ====================

/**
 * Africa's Talking configuration
 */
export type AtConfig = {
  apiKey: string;
  username: string;
  from?: string; // Default shortcode or alphanumeric
  webhookEndpoint?: string;
  sandbox?: boolean;
};

/**
 * SMS service configuration
 */
export type SmsServiceConfig = {
  at: AtConfig;
  defaultLanguage: "en" | "sw";
  respectBusinessHours: boolean;
  maxRetries: number;
};

// ==================== CONSTANTS ====================

/**
 * Kenya-specific SMS constants
 */
export const SMS_CONSTANTS = {
  // Phone number regex for validation
  PHONE_REGEX: /^(\+?254|0)?(7\d{8}|1\d{8})$/,

  // Business hours (East Africa Time)
  BUSINESS_HOURS: {
    START: 8, // 8 AM
    END: 20, // 8 PM
    TIMEZONE: "Africa/Nairobi",
  },

  // Common OTP template
  OTP_TEMPLATE:
    "Your verification code for Kenya Rentals is {{otpCode}}. Do not share this code.",

  // Common Swahili phrases
  SWAHILI_PHRASES: {
    GREETING: "Hujambo",
    THANK_YOU: "Asante",
    CONFIRMED: "Imethibitishwa",
    RECEIVED: "Imepokelewa",
  },
} as const;

/**
 * SMS error codes
 */
export const SMS_ERROR_CODES = {
  INVALID_PHONE_NUMBER: "INVALID_PHONE_NUMBER",
  TEMPLATE_NOT_FOUND: "TEMPLATE_NOT_FOUND",
  INVALID_TEMPLATE_VARIABLES: "INVALID_TEMPLATE_VARIABLES",
  AT_API_ERROR: "AT_API_ERROR",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  USER_OPTED_OUT: "USER_OPTED_OUT",
  BUSINESS_HOURS_RESTRICTION: "BUSINESS_HOURS_RESTRICTION",
} as const;

/**
 * Custom error class for SMS system
 */
export class SmsError extends Error {
  constructor(
    _code: keyof typeof SMS_ERROR_CODES,
    message: string,
    _statusCode = 400,
    _details?: any
  ) {
    super(message);
    this.name = "SmsError";
  }
}

export default {
  SmsTemplateType,
  SmsDeliveryStatus,
  SmsPriority,
  SmsCategory,
  KenyaNetworkCode,
  SMS_CONSTANTS,
  SMS_ERROR_CODES,
  SmsError,
};
