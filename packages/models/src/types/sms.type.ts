import type mongoose from "mongoose";

export type SmsStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "expired";
export type SmsType =
  | "transactional"
  | "promotional"
  | "notification"
  | "alert"
  | "reminder"
  | "verification"
  | "bulk";
export type SmsPriority = "low" | "normal" | "high" | "urgent";
export type SmsProvider = "africastalking" | "twilio" | "aws-sns" | "mock";

export type ISmsRecipient = {
  phoneNumber: string;
  name?: string;
  metadata?: Record<string, any>;
};

export type ISmsMessage = {
  _id?: string;
  to: string | string[] | ISmsRecipient[];
  message?: string; // Raw message content
  template?: mongoose.Types.ObjectId; // Template-based message
  from?: string;
  type: SmsType;
  priority: SmsPriority;
  status: SmsStatus;

  // Metadata
  messageId?: string; // Provider message ID
  cost?: string;
  segments?: number; // Number of SMS segments
  encoding?: "GSM_7BIT" | "UCS2";

  // Scheduling
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;

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
  status: SmsStatus;
  cost?: string;
  networkCode?: string;
  errorCode?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  createdAt?: Date;
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

export type SmsAnalytics = {
  period: "hour" | "day" | "week" | "month";
  startDate: Date;
  endDate: Date;

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
