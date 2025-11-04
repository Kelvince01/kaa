import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/modules/auth/auth.store";
import { httpClientConfig } from "./config/http-client.config";
import { ErrorHandler } from "./error";
import { RequestInterceptor } from "./interceptors/request.interceptor";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { HealthChecker, Logger, SecurityLogger } from "./monitoring";
import {
  CircuitBreaker,
  MetricsCollector,
  RequestCache,
  RequestDeduplication,
  RetryManager,
} from "./performance";
import { CSRFProtection, DataSanitizer, RequestSigner } from "./security";

// Initialize components
const cache = new RequestCache(httpClientConfig.cache.maxSize);
const deduplication = new RequestDeduplication();
const circuitBreaker = new CircuitBreaker(httpClientConfig.circuitBreaker);
const metrics = new MetricsCollector();
const retryManager = new RetryManager(httpClientConfig.retries);

// Security components
const csrfProtection = new CSRFProtection();
const sanitizer = new DataSanitizer({
  enableInputSanitization: httpClientConfig.security.enableSanitization,
  enableOutputSanitization: httpClientConfig.security.enableSanitization,
  allowedHtmlTags: [], // No HTML allowed by default
  maxStringLength: 10_000_000,
  maxObjectDepth: 10,
});

const requestSigner = new RequestSigner({
  secretKey: process.env.NEXT_PUBLIC_REQUEST_SIGNING_KEY || "default-dev-key",
  algorithm: httpClientConfig.security.signatureAlgorithm,
  includeTimestamp: true,
  timestampTolerance: 300, // 5 minutes
});

// Monitoring components
const logger = new Logger({
  level: httpClientConfig.monitoring.logLevel,
  enableConsole: httpClientConfig.monitoring.enableLogging,
  enableRemote: false, // Configure as needed
  maxBatchSize: 50,
  batchInterval: 30_000,
});

const securityLogger = new SecurityLogger(
  {
    enableConsole: httpClientConfig.monitoring.enableLogging,
    enableRemote: false, // Configure as needed
    maxBatchSize: 20,
    batchInterval: 10_000,
    alertThresholds: {
      criticalEvents: 5,
      highEvents: 10,
      timeWindow: 15, // 15 minutes
    },
  },
  (events) => {
    // Security alert callback
    console.error("Security alert triggered:", events);
  }
);

// Get base URL for health checks (without /api/v1 suffix)
const healthCheckBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  httpClientConfig.baseURL.replace("/api/v1", "") ||
  "http://localhost:5000";

const healthChecker = new HealthChecker(
  {
    interval: 60_000, // 1 minute
    endpoints: [healthCheckBaseUrl],
    timeout: 5000,
    healthyThreshold: 80,
    unhealthyThreshold: 50,
  },
  () => metrics.getMetrics(),
  () => circuitBreaker.getStats()
);

// Error handler
const errorHandler = new ErrorHandler(
  {
    showToasts: true,
    logErrors: httpClientConfig.monitoring.enableLogging,
    reportToService: false,
  },
  (event) => securityLogger.logSecurityEvent(event),
  (level, message, context) => {
    switch (level) {
      case "debug":
        logger.debug(message, context?.correlationId, context);
        break;
      case "info":
        logger.info(message, context?.correlationId, context);
        break;
      case "warn":
        logger.warn(message, context?.correlationId, context);
        break;
      case "error":
        logger.error(message, context?.correlationId, context);
        break;
      default:
        break;
    }
  }
);

// Create axios instance
export const api = axios.create({
  baseURL: httpClientConfig.baseURL,
  timeout: httpClientConfig.timeout,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const mlApi = axios.create({
  baseURL: httpClientConfig.mlBaseURL,
  timeout: httpClientConfig.timeout,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": httpClientConfig.mlApiKey,
  },
});

// Initialize interceptors
const requestInterceptor = new RequestInterceptor(
  httpClientConfig,
  cache,
  deduplication,
  circuitBreaker,
  csrfProtection,
  requestSigner,
  sanitizer,
  (event) => securityLogger.logSecurityEvent(event)
);

const responseInterceptor = new ResponseInterceptor(
  httpClientConfig,
  cache,
  circuitBreaker,
  metrics,
  retryManager,
  errorHandler,
  sanitizer,
  (event) => securityLogger.logSecurityEvent(event)
);

// Add interceptors to axios instance
api.interceptors.request.use(
  (config) =>
    requestInterceptor.handle(config) as Promise<
      InternalAxiosRequestConfig<any>
    >,
  (error) => {
    logger.error("Request interceptor error", undefined, {
      error: error.message,
    });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => responseInterceptor.handleSuccess(response),
  (error) => responseInterceptor.handleError(error)
);

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export utilities for monitoring and management
export const httpClient = {
  // Main API instance
  api,
  mlApi,

  // Performance metrics
  getMetrics: () => metrics.getMetrics(),
  getCacheStats: () => cache.getStats(),
  getCircuitBreakerStats: () => circuitBreaker.getStats(),

  // Security monitoring
  getSecurityEvents: (severity?: any) =>
    securityLogger.getRecentEvents(severity),

  // Health monitoring
  getHealthStatus: () => healthChecker.getHealthStatus(),
  forceHealthCheck: () => healthChecker.forceHealthCheck(),

  // Management functions
  clearCache: () => cache.clear(),
  resetCircuitBreakers: () => circuitBreaker.reset(),
  resetMetrics: () => metrics.reset(),

  // Configuration
  config: httpClientConfig,

  // Component instances for advanced usage
  components: {
    cache,
    deduplication,
    circuitBreaker,
    metrics,
    retryManager,
    csrfProtection,
    sanitizer,
    requestSigner,
    logger,
    securityLogger,
    healthChecker,
    errorHandler,
  },
};

// Set up health monitoring callback
healthChecker.onHealthChange((status) => {
  logger.info("Health status changed", undefined, { status: status.status });

  if (status.status === "unhealthy") {
    securityLogger.logSecurityEvent({
      type: "SUSPICIOUS_ACTIVITY",
      details: {
        reason: "System health degraded",
        checks: status.checks,
        metrics: status.metrics,
      },
      timestamp: new Date().toISOString(),
      severity: "medium",
    });
  }
});

// Cleanup function for proper shutdown
export const cleanup = () => {
  logger.destroy();
  securityLogger.destroy();
  healthChecker.destroy();
};

// Auto-cleanup on page unload in browser
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanup);
}

export default api;
