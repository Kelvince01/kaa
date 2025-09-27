import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { TemplateCategory } from "./template.type";

export type CommType = "email" | "sms" | "push" | "webhook";

export type CommStatus =
  | "pending"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "bounced"
  | "expired"
  | "cancelled";

export type CommPriority = "low" | "normal" | "high" | "urgent";

export type CommRecipient = {
  phoneNumber?: string;
  email?: string;
  name?: string;
  metadata?: Record<string, any>;
};

export type CommContext = {
  userId?: string;
  orgId?: string;
  campaignId?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  tags?: string[];
};

export type CommContent = {
  subject?: string;
  body: string;
  html?: string;
  text?: string;
  segments?: number;
  encoding?: "GSM_7BIT" | "UCS2";
  attachments?: Array<{
    filename: string;
    content: Buffer;
    type?: string;
    size?: number;
  }>;
};

export type CommSettings = {
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

export type DeliveryStatus = {
  delivered: number;
  failed: number;
  pending: number;
  total: number;
  lastUpdated: Date;
  providerStatus?: string;
  providerError?: string;
};

export type CommError = {
  code: string;
  message: string;
  provider?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  stack?: string;
};

export type IComm = {
  _id?: string;
  type: CommType;
  status: CommStatus;
  priority: CommPriority;
  to: string[];
  content: CommContent;
  template?: mongoose.Types.ObjectId;
  provider: string;
  providerMessageId?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  cost?: number;
  deliveryStatus?: DeliveryStatus;
  context: CommContext;
  settings: CommSettings;
  error?: CommError;
  metadata?: Record<string, any>;
};

export type BulkCommProgress = {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  percentage: number;
};

export type IBulkComm = {
  name: string;
  description?: string;
  type: CommType;
  priority: CommPriority;
  recipients: CommRecipient[];
  template?: mongoose.Types.ObjectId;
  settings: CommSettings;
  status:
    | "draft"
    | "scheduled"
    | "sending"
    | "completed"
    | "failed"
    | "cancelled";
  progress: BulkCommProgress;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  commIds: string[];
  context: CommContext;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type SendCommunicationRequest = {
  type: CommType;
  to: string | string[] | CommRecipient[];
  templateId?: string;
  template?: any;
  data?: Record<string, any>;
  content?: Partial<CommContent>;
  priority?: CommPriority;
  scheduledAt?: Date;
  context?: Partial<CommContext>;
  settings?: Partial<CommSettings>;
  metadata?: Record<string, any>;
};

export type SendBulkCommunicationRequest = {
  name: string;
  description?: string;
  type: CommType;
  recipients: CommRecipient[];
  templateId?: string;
  template?: any;
  data?: Record<string, any>;
  priority?: CommPriority;
  scheduledAt?: Date;
  context?: Partial<CommContext>;
  settings?: Partial<CommSettings>;
};

export type CommunicationResult = {
  success: boolean;
  communicationId?: string;
  messageId?: string;
  segments?: number;
  cost?: number;
  error?: CommError;
};

export type BulkCommunicationResult = {
  success: boolean;
  bulkId?: string;
  totalCommunications: number;
  successfulCommunications: number;
  failedCommunications: number;
  results?: CommunicationResult[];
  error?: string;
};

export type ICommDeliveryReport = {
  commId: string;
  providerMessageId: string;
  recipient: CommRecipient;
  status: CommStatus;
  cost?: number;
  networkCode?: string;
  errorCode?: string;
  errorMessage?: string;
  deliveredAt?: Date;
  provider: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

// Analytics types
export type CommMetrics = {
  total: number;
  delivered: number;
  failed: number;
  bounced: number;
  pending: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
  averageDeliveryTime?: number; // minutes
  averageCost?: number;
};

export type ICommAnalytics = {
  period: {
    start: Date;
    end: Date;
  };
  totals: CommMetrics;
  byType: Record<CommType, CommMetrics>;
  byStatus: Record<CommStatus, number>;
  byProvider: Record<string, CommMetrics>;
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
    byType: Record<CommType, number>;
    averagePerMessage: number;
  };
  performance: {
    averageSendTime: number;
    averageRenderTime: number;
    queueWaitTime: number;
    successRate: number;
  };
  createdAt?: Date;
};

export type CommWebhookPayload = {
  type: "delivery" | "bounce" | "complaint" | "open" | "click";
  communicationId: string;
  providerMessageId?: string;
  recipient?: string;
  timestamp: Date;
  status?: string;
  error?: {
    code: string;
    message: string;
  };
  metadata?: Record<string, any>;
};

// Queue job types
export type SendCommJob = {
  communicationId: string;
  priority?: CommPriority;
  retryCount?: number;
};

export type SendBulkCommJob = {
  bulkId: string;
  batchIndex: number;
  communicationIds: string[];
};

export type ProcessWebhookJob = {
  type: string;
  payload: CommWebhookPayload;
};

export type RetryCommJob = {
  communicationId: string;
  reason?: string;
};

export type ScheduleCommJob = {
  communicationId: string;
  scheduledAt: Date;
};

export type CommJob =
  | SendCommJob
  | SendBulkCommJob
  | ProcessWebhookJob
  | RetryCommJob
  | ScheduleCommJob;

export type Comm = IComm & Document;
export type BulkComm = IBulkComm & Document;
export type CommDeliveryReport = ICommDeliveryReport & Document;
export type CommAnalytics = ICommAnalytics & Document;

// PROVIDER TYPES
export type ProviderType = "email" | "sms" | "push" | "webhook";

export type ProviderConfig = {
  name: string;
  type: ProviderType;
  enabled: boolean;
  credentials: Record<string, any>;
  settings: {
    rateLimit?: {
      requests: number;
      period: number; // seconds
    };
    timeout?: number; // seconds
    retryAttempts?: number;
    retryDelay?: number; // seconds
  };
  webhooks?: {
    delivery?: string;
    bounce?: string;
    complaint?: string;
    open?: string;
    click?: string;
  };
  metadata?: Record<string, any>;
};

export type SendOptions = {
  priority?: "low" | "normal" | "high" | "urgent";
  scheduledAt?: Date;
  tracking?: {
    enabled: boolean;
    pixel?: boolean;
    links?: boolean;
  };
  attachments?: Array<{
    filename: string;
    content: Buffer;
    type?: string;
  }>;
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

export type ProviderDeliveryStatus = {
  status: "delivered" | "failed" | "bounced" | "expired" | "unknown";
  deliveredAt?: Date;
  error?: {
    code: string;
    message: string;
  };
  cost?: number;
  providerStatus?: string;
  metadata?: Record<string, any>;
};

export type ProviderCapabilities = {
  supportsBulk: boolean;
  supportsScheduling: boolean;
  supportsTracking: boolean;
  supportsAttachments: boolean;
  maxRecipientsPerMessage?: number;
  maxMessageSize?: number; // bytes
  supportedFormats: string[];
  costPerMessage?: number;
  features: {
    deliveryReports: boolean;
    bounceReports: boolean;
    openTracking: boolean;
    clickTracking: boolean;
    unsubscribeLinks: boolean;
  };
};

export type CommunicationProvider = {
  readonly name: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;
  initialized: boolean;

  initialize(config: ProviderConfig): Promise<void>;
  validateConfig(config: ProviderConfig): boolean;

  send(communication: Comm): Promise<SendResult>;
  sendBulk(communications: Comm[]): Promise<SendResult[]>;

  getStatus(messageId: string): Promise<ProviderDeliveryStatus>;
  getBulkStatus(
    messageIds: string[]
  ): Promise<Record<string, ProviderDeliveryStatus>>;

  cancel(messageId: string): Promise<boolean>;
  cancelBulk(messageIds: string[]): Promise<Record<string, boolean>>;

  processWebhook(payload: CommWebhookPayload): Promise<void>;

  getBalance?(): Promise<number>;
  getUsage?(startDate: Date, endDate: Date): Promise<any>;

  dispose(): Promise<void>;
};

// Email provider specific types
export type EmailProviderConfig = ProviderConfig & {
  type: "email";
  credentials: {
    apiKey: string;
    domain?: string;
    fromEmail: string;
    fromName: string;
  };
  settings: ProviderConfig["settings"] & {
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    webhooks?: {
      delivery: string;
      bounce: string;
      complaint: string;
      open: string;
      click: string;
    };
  };
};

// SMS provider specific types
export type SmsProviderConfig = ProviderConfig & {
  type: "sms";
  credentials: {
    apiKey: string;
    username: string;
    shortCode?: string;
    appName?: string;
  };
  settings: ProviderConfig["settings"] & {
    webhooks?: {
      delivery: string;
    };
    encoding?: "GSM_7BIT" | "UCS2";
  };
};

// Push notification provider specific types
export type PushProviderConfig = ProviderConfig & {
  type: "push";
  credentials: {
    serverKey?: string; // FCM
    teamId?: string; // APNS
    keyId?: string; // APNS
    bundleId?: string; // APNS
    privateKey?: string; // APNS
  };
  settings: ProviderConfig["settings"] & {
    platform: "ios" | "android" | "web" | "all";
  };
};

// Provider registry types
export type ProviderRegistry = {
  register(provider: CommunicationProvider): void;
  unregister(name: string): void;
  get(name: string): CommunicationProvider | undefined;
  getByType(type: ProviderType): CommunicationProvider[];
  getDefault(type: ProviderType): CommunicationProvider | undefined;
  list(): CommunicationProvider[];
  validateConfig(name: string, config: ProviderConfig): boolean;
};

// Provider factory types
export type ProviderFactory = {
  create(config: ProviderConfig): CommunicationProvider;
  getSupportedTypes(): ProviderType[];
  validateConfig(config: ProviderConfig): boolean;
};

// Rate limiting types
export type RateLimit = {
  requests: number;
  period: number; // seconds
  strategy: "fixed" | "sliding";
};

export type RateLimitStatus = {
  current: number;
  limit: number;
  resetTime: Date;
  isLimited: boolean;
};

export type RateLimiter = {
  check(key: string, limit: RateLimit): Promise<RateLimitStatus>;
  consume(key: string, limit: RateLimit): Promise<RateLimitStatus>;
  reset(key: string): Promise<void>;
};

// Analytics types
export type CommunicationMetrics = {
  total: number;
  delivered: number;
  failed: number;
  bounced: number;
  pending: number;
  deliveryRate: number;
  failureRate: number;
  bounceRate: number;
  averageDeliveryTime?: number; // minutes
  averageCost?: number;
};

export type CommunicationAnalytics = {
  period: {
    start: Date;
    end: Date;
  };
  totals: CommMetrics;
  byType: Record<CommType, CommMetrics>;
  byStatus: Record<CommStatus, number>;
  byProvider: Record<string, CommMetrics>;
  byTemplate: Record<string, CommMetrics>;
  byCategory: Record<TemplateCategory, CommMetrics>;
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
    byType: Record<CommType, number>;
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
  category: TemplateCategory;
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
  type: CommType;
  metrics: CommMetrics;
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
  communications: CommunicationAnalytics;
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
    byType: Record<CommType, number>;
    byStatus: Record<CommStatus, number>;
  };
  preferences: {
    unsubscribed: boolean;
    categories: Record<TemplateCategory, boolean>;
    channels: Record<CommType, boolean>;
  };
  engagement: {
    openRate?: number;
    clickRate?: number;
    lastActivity: Date;
  };
};

export type GeographicAnalytics = {
  byCountry: Record<string, CommMetrics>;
  byRegion: Record<string, CommMetrics>;
  byCity: Record<string, CommMetrics>;
  topPerforming: {
    countries: Array<{ code: string; metrics: CommMetrics }>;
    regions: Array<{ code: string; metrics: CommMetrics }>;
    cities: Array<{ code: string; metrics: CommMetrics }>;
  };
};

export type TimeBasedAnalytics = {
  byHour: Record<number, CommMetrics>;
  byDayOfWeek: Record<number, CommMetrics>;
  byMonth: Record<number, CommMetrics>;
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
  type?: CommType;
  status?: CommStatus[];
  provider?: string[];
  templateId?: string[];
  category?: TemplateCategory[];
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
  data: CommunicationAnalytics;
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
export type AlertCondition = {
  metric: string;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;
  duration?: number; // minutes
};

export type AlertRule = {
  id: string;
  name: string;
  description?: string;
  conditions: AlertCondition[];
  channels: CommType[];
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
};

export type Alert = {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  triggeredAt: Date;
  resolvedAt?: Date;
  data: Record<string, any>;
};
