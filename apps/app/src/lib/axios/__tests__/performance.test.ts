import { beforeEach, describe, expect, it } from "vitest";
import {
  CircuitBreaker,
  MetricsCollector,
  RequestCache,
  RequestDeduplication,
  RetryManager,
} from "../performance";

describe("Performance Components", () => {
  describe("RequestCache", () => {
    let cache: RequestCache;

    beforeEach(() => {
      cache = new RequestCache(5); // Small cache for testing
    });

    it("should generate consistent cache keys", () => {
      const key1 = cache.generateKey("GET", "/api/users", { page: 1 });
      const key2 = cache.generateKey("GET", "/api/users", { page: 1 });
      const key3 = cache.generateKey("GET", "/api/users", { page: 2 });

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it("should store and retrieve data", () => {
      const key = "test-key";
      const data = { result: "success" };
      const ttl = 1000;

      cache.set(key, data, ttl);
      expect(cache.get(key)).toEqual(data);
      expect(cache.has(key)).toBe(true);
    });

    it("should expire data after TTL", async () => {
      const key = "test-key";
      const data = { result: "success" };
      const ttl = 10; // 10ms

      cache.set(key, data, ttl);
      expect(cache.has(key)).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(cache.has(key)).toBe(false);
      expect(cache.get(key)).toBeNull();
    });

    it("should respect max size limit", () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 10; i++) {
        cache.set(`key-${i}`, `data-${i}`, 1000);
      }

      expect(cache.size()).toBeLessThanOrEqual(5);
    });

    it("should clear all entries", () => {
      cache.set("key1", "data1", 1000);
      cache.set("key2", "data2", 1000);

      expect(cache.size()).toBe(2);
      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe("RequestDeduplication", () => {
    let deduplication: RequestDeduplication;

    beforeEach(() => {
      deduplication = new RequestDeduplication();
    });

    it("should generate consistent keys for same requests", () => {
      const key1 = deduplication.generateKey("GET", "/api/users", {
        filter: "active",
      });
      const key2 = deduplication.generateKey("GET", "/api/users", {
        filter: "active",
      });
      const key3 = deduplication.generateKey("POST", "/api/users", {
        filter: "active",
      });

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it("should track pending requests", () => {
      const key = "test-key";
      const mockPromise = Promise.resolve({ data: "test" }) as any;

      expect(deduplication.hasPendingRequest(key)).toBe(false);

      deduplication.addPendingRequest(key, mockPromise);
      expect(deduplication.hasPendingRequest(key)).toBe(true);

      const retrieved = deduplication.getPendingRequest(key);
      expect(retrieved).toBe(mockPromise);
    });

    it("should clean up completed requests", async () => {
      const key = "test-key";
      const mockPromise = Promise.resolve({ data: "test" }) as any;

      deduplication.addPendingRequest(key, mockPromise);
      expect(deduplication.hasPendingRequest(key)).toBe(true);

      await mockPromise;
      // Give a small delay for cleanup
      await new Promise((resolve) => setTimeout(resolve, 1));

      expect(deduplication.hasPendingRequest(key)).toBe(false);
    });
  });

  describe("RetryManager", () => {
    let retryManager: RetryManager;

    beforeEach(() => {
      retryManager = new RetryManager({
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
      });
    });

    it("should determine retryable errors correctly", () => {
      const networkError = { response: undefined } as any;
      const serverError = { response: { status: 500 } } as any;
      const clientError = { response: { status: 400 } } as any;
      const timeoutError = { response: { status: 408 } } as any;
      const rateLimitError = { response: { status: 429 } } as any;

      expect(retryManager.shouldRetry(networkError, 0)).toBe(true);
      expect(retryManager.shouldRetry(serverError, 0)).toBe(true);
      expect(retryManager.shouldRetry(clientError, 0)).toBe(false);
      expect(retryManager.shouldRetry(timeoutError, 0)).toBe(true);
      expect(retryManager.shouldRetry(rateLimitError, 0)).toBe(true);
    });

    it("should respect max attempts", () => {
      const serverError = { response: { status: 500 } } as any;

      expect(retryManager.shouldRetry(serverError, 0)).toBe(true);
      expect(retryManager.shouldRetry(serverError, 1)).toBe(true);
      expect(retryManager.shouldRetry(serverError, 2)).toBe(true);
      expect(retryManager.shouldRetry(serverError, 3)).toBe(false);
    });

    it("should calculate exponential backoff delay", () => {
      const delay0 = retryManager.calculateDelay(0, false);
      const delay1 = retryManager.calculateDelay(1, false);
      const delay2 = retryManager.calculateDelay(2, false);

      expect(delay0).toBe(100);
      expect(delay1).toBe(200);
      expect(delay2).toBe(400);
    });

    it("should respect max delay", () => {
      const largeDelay = retryManager.calculateDelay(10, false);
      expect(largeDelay).toBeLessThanOrEqual(1000);
    });

    it("should add jitter when requested", () => {
      const delay1 = retryManager.calculateDelay(1, true);
      const delay2 = retryManager.calculateDelay(1, true);

      // With jitter, delays should be different (most of the time)
      // We'll just check they're in a reasonable range
      expect(delay1).toBeGreaterThan(150);
      expect(delay1).toBeLessThan(250);
      expect(delay2).toBeGreaterThan(150);
      expect(delay2).toBeLessThan(250);
    });
  });

  describe("CircuitBreaker", () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 100,
        monitoringPeriod: 60_000,
      });
    });

    it("should start in closed state", () => {
      expect(circuitBreaker.canExecute("test-endpoint")).toBe(true);
    });

    it("should track failures and open circuit", () => {
      const endpoint = "test-endpoint";

      // Circuit should be closed initially
      expect(circuitBreaker.canExecute(endpoint)).toBe(true);

      // Add failures up to threshold
      for (let i = 0; i < 3; i++) {
        circuitBreaker.onFailure(endpoint);
      }

      // Circuit should now be open
      expect(circuitBreaker.canExecute(endpoint)).toBe(false);
    });

    it("should reset failure count on success", () => {
      const endpoint = "test-endpoint";

      circuitBreaker.onFailure(endpoint);
      circuitBreaker.onFailure(endpoint);
      expect(circuitBreaker.canExecute(endpoint)).toBe(true);

      circuitBreaker.onSuccess(endpoint);

      // Should still be closed after success
      expect(circuitBreaker.canExecute(endpoint)).toBe(true);
    });

    it("should transition to half-open after recovery timeout", async () => {
      const endpoint = "test-endpoint";

      // Force circuit to open
      for (let i = 0; i < 3; i++) {
        circuitBreaker.onFailure(endpoint);
      }
      expect(circuitBreaker.canExecute(endpoint)).toBe(false);

      // Wait for recovery timeout
      await new Promise((resolve) => setTimeout(resolve, 110));

      // Should now be in half-open state (allowing execution)
      expect(circuitBreaker.canExecute(endpoint)).toBe(true);
    });

    it("should provide stats for all endpoints", () => {
      circuitBreaker.onFailure("endpoint1");
      circuitBreaker.onFailure("endpoint2");

      const stats = circuitBreaker.getStats();
      expect(stats.endpoint1).toBeDefined();
      expect(stats.endpoint2).toBeDefined();
      expect(stats.endpoint1?.failureCount).toBe(1);
      expect(stats.endpoint2?.failureCount).toBe(1);
    });
  });

  describe("MetricsCollector", () => {
    let metrics: MetricsCollector;

    beforeEach(() => {
      metrics = new MetricsCollector();
    });

    it("should record request metrics", () => {
      const initialMetrics = metrics.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);

      metrics.recordRequest(100, true);

      const updatedMetrics = metrics.getMetrics();
      expect(updatedMetrics.totalRequests).toBe(1);
      expect(updatedMetrics.averageResponseTime).toBe(100);
      expect(updatedMetrics.failedRequests).toBe(0);
    });

    it("should track failed requests", () => {
      metrics.recordRequest(100, false);

      const metricsData = metrics.getMetrics();
      expect(metricsData.totalRequests).toBe(1);
      expect(metricsData.failedRequests).toBe(1);
    });

    it("should calculate average response time", () => {
      metrics.recordRequest(100, true);
      metrics.recordRequest(200, true);
      metrics.recordRequest(300, true);

      const metricsData = metrics.getMetrics();
      expect(metricsData.averageResponseTime).toBe(200);
    });

    it("should calculate percentiles", () => {
      // Add enough data points for meaningful percentiles
      const responseTimes = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

      for (const time of responseTimes) {
        metrics.recordRequest(time, true);
      }

      const metricsData = metrics.getMetrics();
      expect(metricsData.p95ResponseTime).toBeGreaterThan(
        metricsData.averageResponseTime
      );
      expect(metricsData.p99ResponseTime).toBeGreaterThan(
        metricsData.p95ResponseTime
      );
    });

    it("should track cache hit rate", () => {
      metrics.recordCacheHit();
      metrics.recordCacheMiss();
      metrics.recordCacheHit();

      const metricsData = metrics.getMetrics();
      expect(metricsData.cacheHitRate).toBeCloseTo(66.67, 1);
    });

    it("should track circuit breaker trips and retries", () => {
      metrics.recordCircuitBreakerTrip();
      metrics.recordRetryAttempt();

      const metricsData = metrics.getMetrics();
      expect(metricsData.circuitBreakerTrips).toBe(1);
      expect(metricsData.retryAttempts).toBe(1);
    });

    it("should calculate success rate", () => {
      metrics.recordRequest(100, true);
      metrics.recordRequest(150, true);
      metrics.recordRequest(200, false);

      const successRate = metrics.getSuccessRate();
      expect(successRate).toBeCloseTo(66.67, 1);
    });

    it("should reset all metrics", () => {
      metrics.recordRequest(100, true);
      metrics.recordCacheHit();
      metrics.recordCircuitBreakerTrip();

      metrics.reset();

      const metricsData = metrics.getMetrics();
      expect(metricsData.totalRequests).toBe(0);
      expect(metricsData.failedRequests).toBe(0);
      expect(metricsData.cacheHitRate).toBe(0);
      expect(metricsData.circuitBreakerTrips).toBe(0);
    });
  });
});
