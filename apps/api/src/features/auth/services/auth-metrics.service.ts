import { EventEmitter } from "node:events";
import { logger, redisClient } from "@kaa/utils";

type AuthMetrics = {
  loginAttempts: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    max: number;
  };
  cachePerformance: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
  security: {
    rateLimitHits: number;
    blockedIPs: number;
    suspiciousActivity: number;
  };
  timestamps: {
    lastUpdated: Date;
    period: string;
  };
};

type PerformanceMeasurement = {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
};

class AuthMetricsService extends EventEmitter {
  private metrics: AuthMetrics;
  private measurements: PerformanceMeasurement[] = [];
  private readonly maxMeasurements = 1000;
  private readonly metricsKey = "auth_metrics";

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.loadMetricsFromCache();
    this.startPeriodicSave();
    this.startCleanup();
  }

  private initializeMetrics(): AuthMetrics {
    return {
      loginAttempts: {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
      },
      responseTime: {
        average: 0,
        p95: 0,
        p99: 0,
        max: 0,
      },
      cachePerformance: {
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
      },
      security: {
        rateLimitHits: 0,
        blockedIPs: 0,
        suspiciousActivity: 0,
      },
      timestamps: {
        lastUpdated: new Date(),
        period: "current",
      },
    };
  }

  // Performance measurement
  recordMeasurement(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    const measurement: PerformanceMeasurement = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      metadata,
    };

    this.measurements.push(measurement);

    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements = this.measurements.slice(-this.maxMeasurements);
    }

    // Update response time metrics
    this.updateResponseTimeMetrics();

    // Emit event for real-time monitoring
    this.emit("measurement", measurement);

    logger.debug("Performance measurement recorded", {
      operation,
      duration: `${duration}ms`,
      success,
    });
  }

  private updateResponseTimeMetrics() {
    const durations = this.measurements
      .map((m) => m.duration)
      .sort((a, b) => a - b);

    if (durations.length === 0) return;

    this.metrics.responseTime.average =
      durations.reduce((a, b) => a + b, 0) / durations.length;
    this.metrics.responseTime.max = Math.max(...durations);

    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    this.metrics.responseTime.p95 = durations[p95Index] || 0;
    this.metrics.responseTime.p99 = durations[p99Index] || 0;
  }

  // Login attempt tracking
  recordLoginAttempt(
    success: boolean,
    responseTime: number,
    metadata?: Record<string, any>
  ) {
    this.metrics.loginAttempts.total++;

    if (success) {
      this.metrics.loginAttempts.successful++;
    } else {
      this.metrics.loginAttempts.failed++;
    }

    this.metrics.loginAttempts.successRate =
      (this.metrics.loginAttempts.successful /
        this.metrics.loginAttempts.total) *
      100;

    this.recordMeasurement("login", responseTime, success, metadata);
    this.updateTimestamp();

    this.emit("loginAttempt", { success, responseTime, metadata });
  }

  // Cache performance tracking
  recordCacheHit(operation: string, hit: boolean) {
    if (hit) {
      this.metrics.cachePerformance.totalHits++;
    } else {
      this.metrics.cachePerformance.totalMisses++;
    }

    const total =
      this.metrics.cachePerformance.totalHits +
      this.metrics.cachePerformance.totalMisses;
    this.metrics.cachePerformance.hitRate =
      total > 0 ? (this.metrics.cachePerformance.totalHits / total) * 100 : 0;

    this.emit("cacheOperation", { operation, hit });
  }

  // Security event tracking
  recordSecurityEvent(
    type: "rateLimit" | "blockedIP" | "suspiciousActivity",
    metadata?: Record<string, any>
  ) {
    switch (type) {
      case "rateLimit":
        this.metrics.security.rateLimitHits++;
        break;
      case "blockedIP":
        this.metrics.security.blockedIPs++;
        break;
      case "suspiciousActivity":
        this.metrics.security.suspiciousActivity++;
        break;
      default:
        break;
    }

    this.emit("securityEvent", { type, metadata });
    logger.warn("Security event recorded", { type, metadata });
  }

  // Get current metrics
  getMetrics(): AuthMetrics {
    return { ...this.metrics };
  }

  // Get performance measurements
  getMeasurements(
    operation?: string,
    limit?: number
  ): PerformanceMeasurement[] {
    let filtered = this.measurements;

    if (operation) {
      filtered = filtered.filter((m) => m.operation === operation);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  // Get performance summary
  getPerformanceSummary(
    operation?: string,
    timeWindow?: number
  ): {
    count: number;
    averageDuration: number;
    p95Duration: number;
    p99Duration: number;
    maxDuration: number;
    successRate: number;
    errorRate: number;
  } {
    let measurements = this.measurements;

    if (operation) {
      measurements = measurements.filter((m) => m.operation === operation);
    }

    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow);
      measurements = measurements.filter((m) => m.timestamp >= cutoff);
    }

    if (measurements.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        maxDuration: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    const durations = measurements.map((m) => m.duration).sort((a, b) => a - b);
    const successful = measurements.filter((m) => m.success).length;
    const failed = measurements.length - successful;

    return {
      count: measurements.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0,
      maxDuration: Math.max(...durations),
      successRate: (successful / measurements.length) * 100,
      errorRate: (failed / measurements.length) * 100,
    };
  }

  // Health check
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check response times
    if (this.metrics.responseTime.average > 1000) {
      issues.push("High average response time");
      recommendations.push(
        "Consider optimizing database queries or adding caching"
      );
    }

    if (this.metrics.responseTime.p95 > 2000) {
      issues.push("High P95 response time");
      recommendations.push(
        "Investigate slow operations and optimize critical paths"
      );
    }

    // Check success rate
    if (
      this.metrics.loginAttempts.successRate < 80 &&
      this.metrics.loginAttempts.total > 10
    ) {
      issues.push("Low login success rate");
      recommendations.push("Review authentication logic and user experience");
    }

    // Check cache performance
    if (
      this.metrics.cachePerformance.hitRate < 50 &&
      this.metrics.cachePerformance.totalHits +
        this.metrics.cachePerformance.totalMisses >
        100
    ) {
      issues.push("Low cache hit rate");
      recommendations.push("Review caching strategy and TTL settings");
    }

    // Check security metrics
    if (this.metrics.security.rateLimitHits > 100) {
      issues.push("High rate limit hits");
      recommendations.push("Review rate limiting configuration");
    }

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (issues.length > 2) {
      status = "unhealthy";
    } else if (issues.length > 0) {
      status = "degraded";
    }

    return { status, issues, recommendations };
  }

  // Cache operations
  private async loadMetricsFromCache() {
    try {
      const cached = await redisClient.get(this.metricsKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        this.metrics = { ...this.metrics, ...parsed };
        logger.debug("Metrics loaded from cache");
      }
    } catch (error) {
      logger.error("Failed to load metrics from cache", { error });
    }
  }

  private async saveMetricsToCache() {
    try {
      await redisClient.setEx(
        this.metricsKey,
        3600,
        JSON.stringify(this.metrics)
      ); // 1 hour TTL
      logger.debug("Metrics saved to cache");
    } catch (error) {
      logger.error("Failed to save metrics to cache", { error });
    }
  }

  private updateTimestamp() {
    this.metrics.timestamps.lastUpdated = new Date();
  }

  private startPeriodicSave() {
    // Save metrics every 5 minutes
    setInterval(
      () => {
        this.saveMetricsToCache();
      },
      5 * 60 * 1000
    );
  }

  private startCleanup() {
    // Clean up old measurements every hour
    setInterval(
      () => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        const before = this.measurements.length;
        this.measurements = this.measurements.filter(
          (m) => m.timestamp >= cutoff
        );
        const after = this.measurements.length;

        if (before !== after) {
          logger.debug("Cleaned up old measurements", {
            removed: before - after,
          });
        }
      },
      60 * 60 * 1000
    ); // Every hour
  }

  // Reset metrics (for testing or maintenance)
  resetMetrics() {
    this.metrics = this.initializeMetrics();
    this.measurements = [];
    logger.info("Metrics reset");
  }

  // Export metrics for external monitoring
  exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        performance: this.getPerformanceSummary(),
        health: this.getHealthStatus(),
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

export const authMetricsService = new AuthMetricsService();

// Performance decorator for easy measurement
export function measurePerformance(operation: string) {
  return (
    _target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      let success = true;
      let error: Error | null = null;

      try {
        const result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err as Error;
        throw err;
      } finally {
        const duration = Date.now() - start;
        authMetricsService.recordMeasurement(operation, duration, success, {
          method: propertyName,
          error: error?.message,
        });
      }
    };

    return descriptor;
  };
}

// Convenience functions
export const authMetrics = {
  recordLogin: (
    success: boolean,
    responseTime: number,
    metadata?: Record<string, any>
  ) => {
    authMetricsService.recordLoginAttempt(success, responseTime, metadata);
  },

  recordCacheHit: (operation: string, hit: boolean) => {
    authMetricsService.recordCacheHit(operation, hit);
  },

  recordSecurityEvent: (
    type: "rateLimit" | "blockedIP" | "suspiciousActivity",
    metadata?: Record<string, any>
  ) => {
    authMetricsService.recordSecurityEvent(type, metadata);
  },

  getHealth: () => authMetricsService.getHealthStatus(),
  getMetrics: () => authMetricsService.getMetrics(),
  getPerformance: (operation?: string, timeWindow?: number) =>
    authMetricsService.getPerformanceSummary(operation, timeWindow),
};
