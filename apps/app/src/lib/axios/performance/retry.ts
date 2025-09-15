import type { AxiosError } from "axios";
import type { EnhancedAxiosRequestConfig } from "../types";
import { generateCorrelationId } from "../utils/correlation";

export type RetryConfig = {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
};

export class RetryManager {
  private readonly config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  shouldRetry(error: AxiosError, retryCount: number): boolean {
    if (retryCount >= this.config.maxAttempts) return false;

    // Don't retry 4xx errors except for specific ones
    if (
      error.response?.status &&
      error.response.status >= 400 &&
      error.response.status < 500
    ) {
      const retryableClientErrors = [408, 429]; // Request Timeout, Too Many Requests
      return retryableClientErrors.includes(error.response.status);
    }

    // Retry network errors and 5xx errors
    if (!error.response || error.response.status >= 500) {
      return true;
    }

    return false;
  }

  calculateDelay(retryCount: number, jitter = true): number {
    const exponentialDelay = Math.min(
      this.config.baseDelay * this.config.backoffFactor ** retryCount,
      this.config.maxDelay
    );

    if (!jitter) return exponentialDelay;

    // Add jitter to prevent thundering herd
    const jitterAmount = exponentialDelay * 0.1; // 10% jitter
    const jitterOffset = (Math.random() - 0.5) * 2 * jitterAmount;

    return Math.max(0, exponentialDelay + jitterOffset);
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  updateRequestConfig(
    config: EnhancedAxiosRequestConfig,
    retryCount: number
  ): EnhancedAxiosRequestConfig {
    return {
      ...config,
      metadata: {
        ...config.metadata,
        retryCount: retryCount + 1,
        startTime: config.metadata?.startTime || Date.now(),
        correlationId:
          config.metadata?.correlationId || generateCorrelationId(),
      },
      _retry: true,
    };
  }
}
