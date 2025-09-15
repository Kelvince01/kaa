// Legacy axios.lib.ts - Now using the new enhanced HTTP client
// This file is maintained for backward compatibility

// Re-export the new HTTP client as the main API
// biome-ignore lint/performance/noBarrelFile: false positive
export { api, httpClient as enhancedApi } from "./axios";

// Re-export legacy functions for backward compatibility
export const getPerformanceMetrics = () => {
  const { api: httpClientApi, getMetrics } = require("./axios");
  return getMetrics();
};

export const getSecurityLogs = () => {
  const { httpClient } = require("./axios");
  return httpClient.getSecurityEvents();
};

// Migration notice for developers
if (process.env.NODE_ENV === "development") {
  console.info(
    "%c📦 HTTP Client Migration Notice",
    "color: #4f46e5; font-weight: bold; font-size: 14px;",
    "\n\nThe HTTP client has been upgraded with enhanced features:\n" +
      "• Performance optimizations (caching, deduplication, retry logic)\n" +
      "• Enhanced security (request signing, CSRF protection, sanitization)\n" +
      "• Comprehensive monitoring (metrics, health checks, logging)\n" +
      "• Circuit breaker pattern for resilience\n\n" +
      "Consider migrating to the new httpClient export for full feature access.\n" +
      'Import: import { httpClient } from "@/lib/axios";\n'
  );
}
