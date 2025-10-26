import type { AxiosError, AxiosResponse } from "axios";
import { authService } from "@/modules/auth/auth.service";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { ErrorHandler } from "../error/error-handler";
import type {
  CircuitBreaker,
  MetricsCollector,
  RequestCache,
  RetryManager,
} from "../performance";
import type { DataSanitizer } from "../security";
import type { EnhancedAxiosRequestConfig, HttpClientConfig } from "../types";

export class ResponseInterceptor {
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];
  private isRefreshing = false;

  constructor(
    private readonly config: HttpClientConfig,
    private readonly cache: RequestCache,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly metrics: MetricsCollector,
    private readonly retryManager: RetryManager,
    private readonly errorHandler: ErrorHandler,
    private readonly sanitizer: DataSanitizer,
    private readonly onSecurityEvent?: (event: any) => void
  ) {}

  handleSuccess(response: AxiosResponse): Promise<AxiosResponse> {
    const config = response.config as EnhancedAxiosRequestConfig;
    const correlationId = config.metadata?.correlationId;

    // Calculate response time
    const responseTime = config.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : 0;

    // Update metrics
    this.metrics.recordRequest(responseTime, true, false);

    // Update circuit breaker
    if (this.config.circuitBreaker.enabled) {
      const endpoint = this.getEndpoint(config);
      this.circuitBreaker.onSuccess(endpoint);
    }

    // Cache successful GET responses
    if (this.shouldCacheResponse(config, response)) {
      const cacheKey = this.cache.generateKey(
        config.method || "GET",
        config.url || "",
        config.params
      );

      const ttl = config._cacheTTL || this.config.cache.defaultTTL;
      const etag = response.headers.etag;

      this.cache.set(cacheKey, response.data, ttl, etag);
      this.metrics.recordCacheHit();
    }

    // Data sanitization for response
    if (this.config.security.enableSanitization) {
      try {
        response.data = this.sanitizer.sanitizeResponse(response.data);
      } catch (error) {
        if (this.onSecurityEvent) {
          this.onSecurityEvent({
            type: "SUSPICIOUS_ACTIVITY",
            details: {
              error: (error as Error).message,
              stage: "response_sanitization",
            },
            correlationId,
            timestamp: new Date().toISOString(),
            severity: "high",
          });
        }
      }
    }

    // Security checks
    this.performSecurityChecks(response, correlationId);

    // Log slow requests
    if (responseTime > 5000) {
      console.warn(`Slow API request: ${config.url} took ${responseTime}ms`, {
        correlationId,
        url: config.url,
        method: config.method,
      });
    }

    return response as any;
  }

  handleError(error: AxiosError): Promise<never> {
    const config = error.config as EnhancedAxiosRequestConfig;
    const correlationId = config?.metadata?.correlationId;

    // Calculate response time for failed requests
    const responseTime = config?.metadata?.startTime
      ? Date.now() - config.metadata.startTime
      : 0;

    // Update metrics
    this.metrics.recordRequest(responseTime, false, false);

    // Update circuit breaker
    if (this.config.circuitBreaker.enabled && config) {
      const endpoint = this.getEndpoint(config);
      this.circuitBreaker.onFailure(endpoint);
    }

    // Handle 401 errors (token refresh)
    // Skip refresh for refresh endpoint itself to prevent infinite loop
    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !config.url?.includes("/auth/refresh")
    ) {
      return this.handleTokenRefresh(error, config);
    }

    // Retry logic
    if (config && this.shouldRetry(error, config)) {
      return this.handleRetry(error, config);
    }

    // Use error handler
    return this.errorHandler.handle(error, correlationId);
  }

  private shouldCacheResponse(
    config: EnhancedAxiosRequestConfig,
    response: AxiosResponse
  ): boolean {
    return (
      this.config.cache.enabled &&
      (config.method || "GET").toUpperCase() === "GET" &&
      response.status >= 200 &&
      response.status < 300 &&
      !config._skipCache
    );
  }

  private shouldRetry(
    error: AxiosError,
    config: EnhancedAxiosRequestConfig
  ): boolean {
    const retryCount = config.metadata?.retryCount || 0;
    return this.retryManager.shouldRetry(error, retryCount);
  }

  private async handleRetry(
    _error: AxiosError,
    config: EnhancedAxiosRequestConfig
  ): Promise<never> {
    const retryCount = config.metadata?.retryCount || 0;
    const delay = this.retryManager.calculateDelay(retryCount);

    this.metrics.recordRetryAttempt();

    await this.retryManager.delay(delay);

    const updatedConfig = this.retryManager.updateRequestConfig(
      config,
      retryCount
    );

    // Re-import axios to avoid circular dependency
    const { api } = await import("../http-client");
    return api.request(updatedConfig);
  }

  private async handleTokenRefresh(
    _error: AxiosError,
    config: EnhancedAxiosRequestConfig
  ): Promise<never> {
    const authStore = useAuthStore.getState();

    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise<any>((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then(async (token) => {
          if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          const { api } = await import("../http-client");
          return api(config);
        })
        .catch((err) => Promise.reject(err)) as Promise<never>;
    }

    config._retry = true;
    this.isRefreshing = true;
    authStore.setRefreshing(true);

    try {
      const refreshToken = authStore.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const { tokens } = await authService.refreshToken();

      console.log("Response Interceptor: Token refresh successful", {
        correlationId: config.metadata?.correlationId,
        url: config.url,
        method: config.method,
        hasNewTokens: !!(tokens.access_token && tokens.refresh_token),
        timestamp: new Date().toISOString(),
      });

      authStore.setTokens(tokens);

      if (config.headers) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }

      this.processQueue(null, tokens.access_token);

      const { api } = await import("../http-client");
      return api(config);
    } catch (refreshError) {
      console.error("Response Interceptor: Token refresh failed", {
        error: refreshError,
        correlationId: config.metadata?.correlationId,
        url: config.url,
        method: config.method,
        timestamp: new Date().toISOString(),
      });

      this.processQueue(refreshError, null);
      authStore.logout();

      if (this.onSecurityEvent) {
        this.onSecurityEvent({
          type: "TOKEN_REFRESH_FAILED",
          details: { error: refreshError },
          correlationId: config.metadata?.correlationId,
          timestamp: new Date().toISOString(),
          severity: "high",
        });
      }

      // Redirect to login
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1000);
      }

      return Promise.reject(refreshError);
    } finally {
      this.isRefreshing = false;
      authStore.setRefreshing(false);
    }
  }

  private processQueue(error: unknown, token: string | null = null): void {
    for (const prom of this.failedQueue) {
      if (error) {
        prom.reject(error);
      } else {
        // biome-ignore lint/style/noNonNullAssertion: false positive
        prom.resolve(token!);
      }
    }
    this.failedQueue = [];
  }

  private performSecurityChecks(
    response: AxiosResponse,
    correlationId?: string
  ): void {
    // Check for security warnings in headers
    if (response.headers["x-security-warning"] && this.onSecurityEvent) {
      this.onSecurityEvent({
        type: "SUSPICIOUS_ACTIVITY",
        details: { warning: response.headers["x-security-warning"] },
        endpoint: response.config.url,
        correlationId,
        timestamp: new Date().toISOString(),
        severity: "medium",
      });
    }

    // Validate content type
    const contentType = response.headers["content-type"];
    if (
      contentType &&
      !this.isValidContentType(contentType) &&
      this.onSecurityEvent
    ) {
      this.onSecurityEvent({
        type: "SUSPICIOUS_ACTIVITY",
        details: {
          warning: "Unexpected content type",
          contentType,
          expected: "application/json, application/pdf, or other valid types",
        },
        endpoint: response.config.url,
        correlationId,
        timestamp: new Date().toISOString(),
        severity: "low",
      });
    }
  }

  private isValidContentType(contentType: string): boolean {
    const validTypes = [
      "application/json",
      "application/xml",
      "text/plain",
      "text/html",
      "multipart/form-data",
      "application/x-www-form-urlencoded",
      "application/pdf",
      "image/",
      "video/",
      "audio/",
    ];

    return validTypes.some((type) => contentType.includes(type));
  }

  private getEndpoint(config: EnhancedAxiosRequestConfig): string {
    return `${config.method?.toUpperCase() || "GET"} ${config.url || ""}`;
  }
}
