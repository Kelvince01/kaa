import type { CircuitBreakerState, PerformanceMetrics } from "../types";

export type HealthCheckConfig = {
  interval: number; // in milliseconds
  endpoints: string[];
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
};

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    [endpoint: string]: {
      status: "up" | "down";
      responseTime?: number;
      error?: string;
      lastCheck: string;
    };
  };
  metrics: PerformanceMetrics;
  circuitBreakers: Record<string, CircuitBreakerState>;
};

export class HealthChecker {
  private readonly config: HealthCheckConfig;
  private healthStatus: HealthStatus;
  private checkTimer?: NodeJS.Timeout;
  private healthCallbacks: Array<(status: HealthStatus) => void> = [];

  constructor(
    config: HealthCheckConfig,
    private readonly getMetrics: () => PerformanceMetrics,
    private readonly getCircuitBreakerStates: () => Record<
      string,
      CircuitBreakerState
    >
  ) {
    this.config = config;
    this.healthStatus = this.createInitialStatus();
    this.startHealthChecks();
  }

  private createInitialStatus(): HealthStatus {
    const checks: HealthStatus["checks"] = {};

    for (const endpoint of this.config.endpoints) {
      checks[endpoint] = {
        status: "down",
        lastCheck: new Date().toISOString(),
      };
    }

    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
      metrics: this.getMetrics(),
      circuitBreakers: this.getCircuitBreakerStates(),
    };
  }

  private startHealthChecks(): void {
    this.performHealthCheck();

    this.checkTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.interval);
  }

  private async performHealthCheck(): Promise<void> {
    const checks: HealthStatus["checks"] = {};
    const checkPromises = this.config.endpoints.map((endpoint) =>
      this.checkEndpoint(endpoint)
    );

    const results = await Promise.allSettled(checkPromises);

    for (let i = 0; i < this.config.endpoints.length; i++) {
      const endpoint = this.config.endpoints[i] || "";
      const result = results[i];

      if (result?.status === "fulfilled") {
        checks[endpoint] = result.value as HealthStatus["checks"][string];
      } else {
        checks[endpoint] = {
          status: "down",
          error: result?.reason?.message || "Health check failed",
          lastCheck: new Date().toISOString(),
        };
      }
    }

    this.healthStatus = {
      status: this.calculateOverallStatus(checks),
      timestamp: new Date().toISOString(),
      checks,
      metrics: this.getMetrics(),
      circuitBreakers: this.getCircuitBreakerStates(),
    };

    // Notify callbacks
    for (const callback of this.healthCallbacks) {
      try {
        callback(this.healthStatus);
      } catch (error) {
        console.error("Health check callback error:", error);
      }
    }
  }

  private async checkEndpoint(
    endpoint: string
  ): Promise<HealthStatus["checks"][string]> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(
        `${endpoint.replace("/api/v1", "")}/health`,
        {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        }
      );

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: "up",
          responseTime,
          lastCheck: new Date().toISOString(),
        };
      }
      return {
        status: "down",
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "down",
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
        lastCheck: new Date().toISOString(),
      };
    }
  }

  private calculateOverallStatus(
    checks: HealthStatus["checks"]
  ): HealthStatus["status"] {
    const upCount = Object.values(checks).filter(
      (check) => check.status === "up"
    ).length;
    const totalCount = Object.keys(checks).length;

    if (totalCount === 0) {
      return "unhealthy";
    }

    const BASE_HEALTH_PERCENTAGE = 100;
    const healthPercentage = (upCount / totalCount) * BASE_HEALTH_PERCENTAGE;

    if (healthPercentage >= this.config.healthyThreshold) {
      return "healthy";
    }
    if (healthPercentage >= this.config.unhealthyThreshold) {
      return "degraded";
    }
    return "unhealthy";
  }

  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  onHealthChange(callback: (status: HealthStatus) => void): void {
    this.healthCallbacks.push(callback);
  }

  async forceHealthCheck(): Promise<HealthStatus> {
    await this.performHealthCheck();
    return this.getHealthStatus();
  }

  isHealthy(): boolean {
    return this.healthStatus.status === "healthy";
  }

  isDegraded(): boolean {
    return this.healthStatus.status === "degraded";
  }

  isUnhealthy(): boolean {
    return this.healthStatus.status === "unhealthy";
  }

  destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    this.healthCallbacks = [];
  }
}
