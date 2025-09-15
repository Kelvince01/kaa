import type { PerformanceMetrics } from "../types";

export class MetricsCollector {
  private metrics: PerformanceMetrics = {
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    totalRequests: 0,
    failedRequests: 0,
    cacheHitRate: 0,
    circuitBreakerTrips: 0,
    retryAttempts: 0,
    lastUpdated: new Date().toISOString(),
  };

  private responseTimes: number[] = [];
  private cacheHits = 0;
  private cacheRequests = 0;
  private readonly maxResponseTimeSamples = 1000;

  recordRequest(
    responseTime: number,
    success: boolean,
    fromCache = false
  ): void {
    this.metrics.totalRequests++;

    if (!success) {
      this.metrics.failedRequests++;
    }

    if (fromCache) {
      this.cacheHits++;
    }
    this.cacheRequests++;

    // Record response time for percentile calculations
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimeSamples) {
      this.responseTimes.shift();
    }

    this.updateCalculatedMetrics();
  }

  recordCacheHit(): void {
    this.cacheHits++;
    this.cacheRequests++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    this.cacheRequests++;
    this.updateCacheHitRate();
  }

  recordCircuitBreakerTrip(): void {
    this.metrics.circuitBreakerTrips++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  recordRetryAttempt(): void {
    this.metrics.retryAttempts++;
    this.metrics.lastUpdated = new Date().toISOString();
  }

  private updateCalculatedMetrics(): void {
    if (this.responseTimes.length === 0) return;

    // Calculate average response time
    const sum = this.responseTimes.reduce((acc, time) => acc + time, 0);
    this.metrics.averageResponseTime = sum / this.responseTimes.length;

    // Calculate percentiles
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    this.metrics.p95ResponseTime = sorted[p95Index] || 0;
    this.metrics.p99ResponseTime = sorted[p99Index] || 0;

    this.updateCacheHitRate();
    this.metrics.lastUpdated = new Date().toISOString();
  }

  private updateCacheHitRate(): void {
    this.metrics.cacheHitRate =
      this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      totalRequests: 0,
      failedRequests: 0,
      cacheHitRate: 0,
      circuitBreakerTrips: 0,
      retryAttempts: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.responseTimes = [];
    this.cacheHits = 0;
    this.cacheRequests = 0;
  }

  getSuccessRate(): number {
    return this.metrics.totalRequests > 0
      ? ((this.metrics.totalRequests - this.metrics.failedRequests) /
          this.metrics.totalRequests) *
          100
      : 100;
  }
}
