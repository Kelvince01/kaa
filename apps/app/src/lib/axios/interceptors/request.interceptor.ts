import type { InternalAxiosRequestConfig } from "axios";
import type {
  CircuitBreaker,
  RequestCache,
  RequestDeduplication,
} from "../performance";
import type { CSRFProtection, DataSanitizer, RequestSigner } from "../security";
import type { EnhancedAxiosRequestConfig, HttpClientConfig } from "../types";
import { generateCorrelationId } from "../utils/correlation";

export class RequestInterceptor {
  constructor(
    private readonly config: HttpClientConfig,
    private readonly cache: RequestCache,
    private readonly deduplication: RequestDeduplication,
    private readonly circuitBreaker: CircuitBreaker,
    private readonly csrfProtection: CSRFProtection,
    private readonly requestSigner: RequestSigner,
    private readonly sanitizer: DataSanitizer,
    private readonly onSecurityEvent?: (event: any) => void
  ) {}

  async handle(
    config: InternalAxiosRequestConfig
  ): Promise<EnhancedAxiosRequestConfig> {
    const enhancedConfig = config as EnhancedAxiosRequestConfig;
    const startTime = Date.now();
    const correlationId = generateCorrelationId();

    // Initialize metadata
    enhancedConfig.metadata = {
      startTime,
      correlationId,
      retryCount: enhancedConfig.metadata?.retryCount || 0,
    };

    // Circuit breaker check
    if (this.config.circuitBreaker.enabled && !enhancedConfig._circuitBreaker) {
      const endpoint = this.getEndpoint(enhancedConfig);
      if (!this.circuitBreaker.canExecute(endpoint)) {
        throw new Error(`Circuit breaker is open for ${endpoint}`);
      }
    }

    // Check cache first (for GET requests)
    if (this.shouldUseCache(enhancedConfig)) {
      const cacheKey = this.cache.generateKey(
        enhancedConfig.method || "GET",
        enhancedConfig.url || "",
        enhancedConfig.params
      );

      if (this.cache.has(cacheKey)) {
        enhancedConfig.metadata.cacheKey = cacheKey;
      }
    }

    // Request deduplication
    if (this.shouldDeduplicate(enhancedConfig)) {
      const dedupeKey = this.deduplication.generateKey(
        enhancedConfig.method || "GET",
        enhancedConfig.url || "",
        enhancedConfig.data
      );

      if (this.deduplication.hasPendingRequest(dedupeKey)) {
        // Return the pending request instead of making a new one
        const pendingRequest = this.deduplication.getPendingRequest(dedupeKey);
        if (pendingRequest) {
          return Promise.resolve(pendingRequest as any);
        }
      }
    }

    // Security headers
    await this.addSecurityHeaders(enhancedConfig);

    // Data sanitization
    if (this.config.security.enableSanitization && enhancedConfig.data) {
      try {
        enhancedConfig.data = this.sanitizer.sanitizeRequest(
          enhancedConfig.data
        );

        // Validate request size
        if (!this.sanitizer.validateRequestSize(enhancedConfig.data)) {
          throw new Error("Request payload too large");
        }

        // Check for suspicious patterns
        const suspiciousPatterns = this.sanitizer.detectSuspiciousPatterns(
          enhancedConfig.data
        );
        if (suspiciousPatterns.length > 0 && this.onSecurityEvent) {
          this.onSecurityEvent({
            type: "SUSPICIOUS_ACTIVITY",
            details: {
              patterns: suspiciousPatterns,
              data: enhancedConfig.data,
            },
            correlationId,
            timestamp: new Date().toISOString(),
            severity: "high",
          });
        }
      } catch (error) {
        if (this.onSecurityEvent) {
          this.onSecurityEvent({
            type: "SUSPICIOUS_ACTIVITY",
            details: { error: (error as Error).message, stage: "sanitization" },
            correlationId,
            timestamp: new Date().toISOString(),
            severity: "critical",
          });
        }
        throw error;
      }
    }

    // Request signing
    if (this.config.security.enableRequestSigning) {
      await this.signRequest(enhancedConfig);
    }

    // Add correlation ID header
    enhancedConfig.headers = enhancedConfig.headers || {};
    enhancedConfig.headers["X-Correlation-ID"] = correlationId;

    return enhancedConfig;
  }

  private shouldUseCache(config: EnhancedAxiosRequestConfig): boolean {
    return (
      this.config.cache.enabled &&
      !config._skipCache &&
      (config.method || "GET").toUpperCase() === "GET"
    );
  }

  private shouldDeduplicate(config: EnhancedAxiosRequestConfig): boolean {
    const method = (config.method || "GET").toUpperCase();
    return ["GET", "HEAD", "OPTIONS"].includes(method);
  }

  private getEndpoint(config: EnhancedAxiosRequestConfig): string {
    return `${config.method?.toUpperCase() || "GET"} ${config.url || ""}`;
  }

  private async addSecurityHeaders(
    config: EnhancedAxiosRequestConfig
  ): Promise<void> {
    config.headers = config.headers || {};

    // Add standard security headers
    config.headers["X-Requested-With"] = "XMLHttpRequest";
    config.headers["X-Frame-Options"] = "DENY";
    config.headers["X-Content-Type-Options"] = "nosniff";

    // CSRF protection - Skip for CSRF token endpoint itself to prevent infinite loop
    const isCSRFTokenRequest = config.url?.includes("/csrf-token");
    if (this.config.security.enableCSRF && !isCSRFTokenRequest) {
      try {
        const csrfToken = await this.csrfProtection.getCSRFToken();
        if (csrfToken) {
          config.headers["X-CSRF-Token"] = csrfToken;
        }
      } catch (error) {
        console.warn("Failed to get CSRF token:", error);
      }
    }
  }

  private async signRequest(config: EnhancedAxiosRequestConfig): Promise<void> {
    try {
      const signature = await this.requestSigner.signRequest(
        config.method || "GET",
        config.url || "",
        config.data
      );

      config.headers = config.headers || {};
      config.headers.Authorization =
        this.requestSigner.createAuthorizationHeader(signature);
    } catch (error) {
      if (this.onSecurityEvent) {
        this.onSecurityEvent({
          type: "REQUEST_SIGNATURE_INVALID",
          details: { error: (error as Error).message },
          correlationId: config.metadata?.correlationId,
          timestamp: new Date().toISOString(),
          severity: "high",
        });
      }
      throw new Error("Failed to sign request");
    }
  }
}
