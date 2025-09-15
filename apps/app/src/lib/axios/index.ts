// Main exports

// Configuration
export { createConfig, httpClientConfig } from "./config/http-client.config";
export * from "./error";
export { api, cleanup, httpClient } from "./http-client";
export * from "./interceptors/request.interceptor";
export * from "./interceptors/response.interceptor";
export * from "./monitoring";
// Component exports for advanced usage
export * from "./performance";
export * from "./security";
// Type exports
export type {
  ApiError,
  ApiResponse,
  EnhancedAxiosRequestConfig,
  HttpClientConfig,
  LogEntry,
  LogLevel,
  PerformanceMetrics,
  RequestMetadata,
  SecurityEvent,
} from "./types";

// Utilities
export {
  extractCorrelationId,
  generateCorrelationId,
  isValidCorrelationId,
} from "./utils/correlation";
