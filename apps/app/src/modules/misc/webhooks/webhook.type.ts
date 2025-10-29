import type {
  IWebhookFilters,
  IWebhookRateLimit,
  IWebhookRetryConfig,
  IWebhookSecurity,
  IWebhookTransformation,
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookMethod,
  WebhookPriority,
  WebhookStatus,
} from "@kaa/models/types";

// Re-export types from models
export type {
  IWebhookConfig,
  IWebhookDelivery,
  IWebhookEvent,
  IWebhookFilters,
  IWebhookRateLimit,
  IWebhookRetryConfig,
  IWebhookSecurity,
  IWebhookTransformation,
} from "@kaa/models/types";

// Re-export enums (as values, not types)
export {
  WebhookContentType,
  WebhookEnvironment,
  WebhookEventType,
  WebhookMethod,
  WebhookPriority,
  WebhookStatus,
} from "@kaa/models/types";

// Frontend-specific types
export type WebhookType = {
  _id: string;
  name: string;
  description?: string;
  url: string;
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
  lastTriggered?: string;
  nextRetryAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WebhookDeliveryType = {
  _id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
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
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  startedAt: string;
  completedAt?: string;
  duration?: number;
  nextRetryAt?: string;
  retryAfter?: number;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventTypeData = {
  type: WebhookEventType;
  resourceId: string;
  resourceType: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
  source: string;
  version: string;
  correlationId?: string;
};

export type CreateWebhookInput = {
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
  tags?: string[];
  metadata?: Record<string, any>;
};

export type UpdateWebhookInput = {
  name?: string;
  description?: string;
  url?: string;
  method?: WebhookMethod;
  isActive?: boolean;
  environment?: WebhookEnvironment;
  priority?: WebhookPriority;
  contentType?: WebhookContentType;
  timeout?: number;
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;
};

export type WebhookListQuery = {
  page?: number;
  limit?: number;
  status?: WebhookStatus;
  events?: WebhookEventType[];
  environment?: WebhookEnvironment;
  isActive?: boolean;
  search?: string;
};

export type WebhookListResponse = {
  webhooks: WebhookType[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type WebhookDeliveryListResponse = {
  data: WebhookDeliveryType[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type WebhookAnalytics = {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  averageResponseTime: number;
  lastDelivery?: string;
  deliveryTrend?: {
    date: string;
    success: number;
    failed: number;
  }[];
};

export type WebhookTestResult = {
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  response?: any;
};

export type SupportedEventsResponse = {
  events: WebhookEventType[];
  status: "success" | "error";
  message?: string;
};

export type RegenerateSecretResponse = {
  status: string;
  secret: string;
};
