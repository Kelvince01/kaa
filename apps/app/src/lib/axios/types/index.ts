import type { AxiosRequestConfig } from "axios";

export type RequestMetadata = {
  startTime: number;
  correlationId: string;
  fingerprint?: string;
  retryCount?: number;
  cacheKey?: string;
};

export interface EnhancedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: RequestMetadata;
  _retry?: boolean;
  _circuitBreaker?: boolean;
  _skipCache?: boolean;
  _cacheTTL?: number;
}

export type ApiResponse<T = any> = {
  data: T;
  message?: string;
  status: number;
  correlationId?: string;
  timestamp: string;
};

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, any>;
  correlationId?: string;
  timestamp: string;
  stack?: string;
};

export type SecurityEvent = {
  type:
    | "AUTH_FAILURE"
    | "RATE_LIMIT"
    | "SUSPICIOUS_ACTIVITY"
    | "TOKEN_REFRESH_FAILED"
    | "CSRF_VALIDATION_FAILED"
    | "REQUEST_SIGNATURE_INVALID";
  details: Record<string, any>;
  endpoint?: string;
  correlationId?: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
};

export type PerformanceMetrics = {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  failedRequests: number;
  cacheHitRate: number;
  circuitBreakerTrips: number;
  retryAttempts: number;
  lastUpdated: string;
};

export type CacheEntry<T = any> = {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
};

export type CircuitBreakerState = {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
};

export type RateLimitState = {
  count: number;
  resetTime: number;
  windowStart: number;
};

export type RequestSignature = {
  signature: string;
  timestamp: number;
  nonce: string;
};

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  message: string;
  correlationId?: string;
  timestamp: string;
  context?: Record<string, any>;
};

export type HttpClientConfig = {
  baseURL: string;
  timeout: number;
  retries: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  };
  security: {
    enableRequestSigning: boolean;
    enableCSRF: boolean;
    enableSanitization: boolean;
    signatureAlgorithm: "HMAC-SHA256" | "HMAC-SHA512";
  };
  monitoring: {
    enableMetrics: boolean;
    enableLogging: boolean;
    logLevel: LogLevel;
    metricsInterval: number;
  };
};
