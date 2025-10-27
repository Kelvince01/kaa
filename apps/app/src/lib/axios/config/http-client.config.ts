import { authConfig } from "@/modules/auth/auth.config";
import type { HttpClientConfig } from "../types";

export const httpClientConfig: HttpClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  mlBaseURL:
    process.env.NEXT_PUBLIC_TFML_API_URL || "http://localhost:5001/api/v1",
  mlApiKey: process.env.NEXT_PUBLIC_TFML_API_KEY,
  timeout: Number.parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "30000", 10),

  retries: {
    maxAttempts: Number.parseInt(
      process.env.NEXT_PUBLIC_RETRY_MAX_ATTEMPTS || "3",
      10
    ),
    baseDelay: Number.parseInt(
      process.env.NEXT_PUBLIC_RETRY_BASE_DELAY || "1000",
      10
    ),
    maxDelay: Number.parseInt(
      process.env.NEXT_PUBLIC_RETRY_MAX_DELAY || "10000",
      10
    ),
    backoffFactor: Number.parseFloat(
      process.env.NEXT_PUBLIC_RETRY_BACKOFF_FACTOR || "2"
    ),
  },

  cache: {
    enabled: process.env.NEXT_PUBLIC_CACHE_ENABLED !== "false",
    defaultTTL: Number.parseInt(
      process.env.NEXT_PUBLIC_CACHE_DEFAULT_TTL || "300000",
      10
    ), // 5 minutes
    maxSize: Number.parseInt(
      process.env.NEXT_PUBLIC_CACHE_MAX_SIZE || "100",
      10
    ),
  },

  circuitBreaker: {
    enabled: process.env.NEXT_PUBLIC_CIRCUIT_BREAKER_ENABLED !== "false",
    failureThreshold: Number.parseInt(
      process.env.NEXT_PUBLIC_CB_FAILURE_THRESHOLD || "5",
      10
    ),
    recoveryTimeout: Number.parseInt(
      process.env.NEXT_PUBLIC_CB_RECOVERY_TIMEOUT || "60000",
      10
    ),
    monitoringPeriod: Number.parseInt(
      process.env.NEXT_PUBLIC_CB_MONITORING_PERIOD || "60000",
      10
    ),
  },

  security: {
    enableRequestSigning: process.env.NODE_ENV === "production",
    enableCSRF: authConfig.enableCSRF,
    enableSanitization: true,
    signatureAlgorithm: "HMAC-SHA256",
  },

  monitoring: {
    enableMetrics: true,
    enableLogging: process.env.NODE_ENV === "development",
    logLevel: (process.env.NEXT_PUBLIC_LOG_LEVEL as any) || "info",
    metricsInterval: Number.parseInt(
      process.env.NEXT_PUBLIC_METRICS_INTERVAL || "60000",
      10
    ),
  },
};

export const createConfig = (
  overrides?: Partial<HttpClientConfig>
): HttpClientConfig => ({
  ...httpClientConfig,
  ...overrides,
});
