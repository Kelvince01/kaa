import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import { api, cleanup, httpClient } from "../http-client";

// import { AxiosError } from "axios";

// Mock dependencies
vi.mock("@/modules/auth/auth.store", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      getAccessToken: vi.fn(() => "mock-token"),
      getRefreshToken: vi.fn(() => "mock-refresh-token"),
      setTokens: vi.fn(),
      setRefreshing: vi.fn(),
      logout: vi.fn(),
    })),
  },
}));

vi.mock("@/modules/auth/auth.service", () => ({
  authService: {
    refreshToken: vi.fn(() =>
      Promise.resolve({
        tokens: {
          access_token: "new-mock-token",
          refresh_token: "new-mock-refresh-token",
        },
      })
    ),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch globally
// @ts-expect-error
global.fetch = vi.fn();

describe("HTTP Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all components
    httpClient.clearCache();
    httpClient.resetCircuitBreakers();
    httpClient.resetMetrics();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Basic Functionality", () => {
    it("should create axios instance with correct configuration", () => {
      expect(api.defaults.baseURL).toBeDefined();
      expect(api.defaults.timeout).toBeDefined();
      expect(api.defaults.withCredentials).toBe(true);
    });

    it("should export httpClient utilities", () => {
      expect(httpClient.getMetrics).toBeDefined();
      expect(httpClient.getCacheStats).toBeDefined();
      expect(httpClient.getCircuitBreakerStats).toBeDefined();
      expect(httpClient.getHealthStatus).toBeDefined();
      expect(httpClient.clearCache).toBeDefined();
      expect(httpClient.resetCircuitBreakers).toBeDefined();
      expect(httpClient.resetMetrics).toBeDefined();
    });
  });

  describe("Performance Features", () => {
    it("should track metrics", () => {
      const initialMetrics = httpClient.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);

      // The actual HTTP request would update metrics through interceptors
      // This would be tested in integration tests with a real HTTP server
    });

    it("should provide cache statistics", () => {
      const cacheStats = httpClient.getCacheStats();
      expect(cacheStats).toBeDefined();
      expect(cacheStats.size).toBeDefined();
      expect(cacheStats.maxSize).toBeDefined();
    });

    it("should provide circuit breaker statistics", () => {
      const cbStats = httpClient.getCircuitBreakerStats();
      expect(cbStats).toBeDefined();
    });

    it("should clear cache", () => {
      httpClient.clearCache();
      const cacheStats = httpClient.getCacheStats();
      expect(cacheStats.size).toBe(0);
    });

    it("should reset metrics", () => {
      httpClient.resetMetrics();
      const metrics = httpClient.getMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });

    it("should reset circuit breakers", () => {
      httpClient.resetCircuitBreakers();
      const cbStats = httpClient.getCircuitBreakerStats();
      expect(Object.keys(cbStats)).toHaveLength(0);
    });
  });

  describe("Security Features", () => {
    it("should provide security event monitoring", () => {
      const securityEvents = httpClient.getSecurityEvents();
      expect(Array.isArray(securityEvents)).toBe(true);
    });

    it("should filter security events by severity", () => {
      const criticalEvents = httpClient.getSecurityEvents("critical");
      const highEvents = httpClient.getSecurityEvents("high");
      const mediumEvents = httpClient.getSecurityEvents("medium");
      const lowEvents = httpClient.getSecurityEvents("low");

      expect(Array.isArray(criticalEvents)).toBe(true);
      expect(Array.isArray(highEvents)).toBe(true);
      expect(Array.isArray(mediumEvents)).toBe(true);
      expect(Array.isArray(lowEvents)).toBe(true);
    });
  });

  describe("Health Monitoring", () => {
    it("should provide health status", () => {
      const healthStatus = httpClient.getHealthStatus();
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();
      expect(healthStatus.checks).toBeDefined();
      expect(healthStatus.metrics).toBeDefined();
    });

    it("should force health check", async () => {
      // Mock fetch for health check
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
      });

      const healthStatus = await httpClient.forceHealthCheck();
      expect(healthStatus).toBeDefined();
      expect(healthStatus.timestamp).toBeDefined();
    });
  });

  describe("Component Access", () => {
    it("should provide access to internal components", () => {
      const { components } = httpClient;

      expect(components.cache).toBeDefined();
      expect(components.deduplication).toBeDefined();
      expect(components.circuitBreaker).toBeDefined();
      expect(components.metrics).toBeDefined();
      expect(components.retryManager).toBeDefined();
      expect(components.csrfProtection).toBeDefined();
      expect(components.sanitizer).toBeDefined();
      expect(components.requestSigner).toBeDefined();
      expect(components.logger).toBeDefined();
      expect(components.securityLogger).toBeDefined();
      expect(components.healthChecker).toBeDefined();
      expect(components.errorHandler).toBeDefined();
    });
  });

  describe("Configuration", () => {
    it("should expose configuration", () => {
      expect(httpClient.config).toBeDefined();
      expect(httpClient.config.baseURL).toBeDefined();
      expect(httpClient.config.timeout).toBeDefined();
      expect(httpClient.config.retries).toBeDefined();
      expect(httpClient.config.cache).toBeDefined();
      expect(httpClient.config.circuitBreaker).toBeDefined();
      expect(httpClient.config.security).toBeDefined();
      expect(httpClient.config.monitoring).toBeDefined();
    });
  });
});

describe("Individual Components", () => {
  describe("RequestCache", () => {
    it("should generate cache keys", () => {
      const { cache } = httpClient.components;
      const key = cache.generateKey("GET", "/api/users", { page: 1 });
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });

    it("should store and retrieve cached data", () => {
      const { cache } = httpClient.components;
      const key = "test-key";
      const data = { test: "data" };
      const ttl = 60_000; // 1 minute

      cache.set(key, data, ttl);
      expect(cache.has(key)).toBe(true);
      expect(cache.get(key)).toEqual(data);
    });

    it("should expire cached data", () => {
      const { cache } = httpClient.components;
      const key = "test-key";
      const data = { test: "data" };
      const ttl = -1; // Already expired

      cache.set(key, data, ttl);
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeNull();
    });
  });

  describe("CircuitBreaker", () => {
    it("should allow execution when closed", () => {
      const { circuitBreaker } = httpClient.components;
      expect(circuitBreaker.canExecute("test-endpoint")).toBe(true);
    });

    it("should track success and failure", () => {
      const { circuitBreaker } = httpClient.components;
      const endpoint = "test-endpoint";

      circuitBreaker.onSuccess(endpoint);
      circuitBreaker.onFailure(endpoint);

      const stats = circuitBreaker.getStats();
      expect(stats[endpoint]).toBeDefined();
    });
  });

  describe("MetricsCollector", () => {
    it("should record request metrics", () => {
      const { metrics } = httpClient.components;
      const initialMetrics = metrics.getMetrics();

      metrics.recordRequest(100, true);

      const updatedMetrics = metrics.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(
        initialMetrics.totalRequests + 1
      );
      expect(updatedMetrics.averageResponseTime).toBeGreaterThan(0);
    });

    it("should calculate success rate", () => {
      const { metrics } = httpClient.components;

      metrics.recordRequest(100, true);
      metrics.recordRequest(150, true);
      metrics.recordRequest(200, false);

      const successRate = metrics.getSuccessRate();
      expect(successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe("DataSanitizer", () => {
    it("should sanitize request data", () => {
      const { sanitizer } = httpClient.components;
      const dangerousData = {
        name: 'John<script>alert("xss")</script>',
        email: "john@example.com",
      };

      const sanitized = sanitizer.sanitizeRequest(dangerousData);
      expect(sanitized.name).not.toContain("<script>");
      expect(sanitized.email).toBe("john@example.com");
    });

    it("should detect suspicious patterns", () => {
      const { sanitizer } = httpClient.components;
      const suspiciousData = {
        payload: 'javascript:alert("xss")',
      };

      const issues = sanitizer.detectSuspiciousPatterns(suspiciousData);
      expect(issues.length).toBeGreaterThan(0);
    });

    it("should validate request size", () => {
      const { sanitizer } = httpClient.components;
      const smallData = { test: "data" };
      const largeData = { data: "x".repeat(20 * 1024 * 1024) }; // 20MB

      expect(sanitizer.validateRequestSize(smallData)).toBe(true);
      expect(sanitizer.validateRequestSize(largeData)).toBe(false);
    });
  });
});
