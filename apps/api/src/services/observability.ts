import { randomUUID } from "node:crypto";
import { Elysia } from "elysia";

// Types for monitoring and observability
type MetricLabels = {
  [key: string]: string;
};

type MetricValue = {
  value: number;
  labels?: MetricLabels;
  timestamp?: number;
};

type HealthCheck = {
  name: string;
  status: "healthy" | "unhealthy" | "warning";
  message?: string;
  details?: any;
  timestamp: number;
  responseTime?: number;
};

type LogEntry = {
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  timestamp: number;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
  service: string;
  environment: string;
  metadata?: any;
};

type TraceSpan = {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "ok" | "error" | "timeout";
  tags: { [key: string]: any };
  logs: { timestamp: number; message: string; level: string }[];
};

type AlertRule = {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  channels: ("email" | "sms" | "webhook" | "slack")[];
  cooldownMinutes: number;
  lastTriggered?: number;
};

class MetricsCollector {
  private readonly counters = new Map<string, number>();
  private readonly gauges = new Map<string, number>();
  private readonly histograms = new Map<string, number[]>();
  private readonly summaries = new Map<
    string,
    { sum: number; count: number; quantiles: number[] }
  >();

  // Counter metrics
  increment(name: string, labels?: MetricLabels, value = 1): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  // Gauge metrics
  set(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  // Histogram metrics
  observe(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)?.push(value);
  }

  // Summary metrics
  record(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    if (!this.summaries.has(key)) {
      this.summaries.set(key, { sum: 0, count: 0, quantiles: [] });
    }
    // biome-ignore lint/style/noNonNullAssertion: ingore
    const summary = this.summaries.get(key)!;
    summary.sum += value;
    summary.count++;
    summary.quantiles.push(value);
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return `${name}{${labelStr}}`;
  }

  // Export metrics in Prometheus format
  exportPrometheus(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`# TYPE ${this.extractMetricName(key)} counter`);
      lines.push(`${key} ${value}`);
    }

    // Gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`# TYPE ${this.extractMetricName(key)} gauge`);
      lines.push(`${key} ${value}`);
    }

    // Histograms
    for (const [key, values] of this.histograms.entries()) {
      const metricName = this.extractMetricName(key);
      lines.push(`# TYPE ${metricName} histogram`);

      values.sort((a, b) => a - b);
      const buckets = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 1.0];

      for (const bucket of buckets) {
        const threshold = this.quantile(values, bucket);
        lines.push(`${key}_bucket{le="${threshold}"} ${values.length}`);
      }

      lines.push(`${key}_sum ${values.reduce((a, b) => a + b, 0)}`);
      lines.push(`${key}_count ${values.length}`);
    }

    return lines.join("\n");
  }

  private extractMetricName(key: string): string {
    return key.split("{")[0];
  }

  private quantile(values: number[], q: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * q) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
  }

  getMetrics(): {
    counters: Map<string, number>;
    gauges: Map<string, number>;
    histograms: Map<string, number[]>;
    summaries: Map<string, { sum: number; count: number; quantiles: number[] }>;
  } {
    return {
      counters: new Map(this.counters),
      gauges: new Map(this.gauges),
      histograms: new Map(this.histograms),
      summaries: new Map(this.summaries),
    };
  }
}

class StructuredLogger {
  private readonly service: string;
  private readonly environment: string;
  private readonly logLevel: string;

  constructor(service = "kaa-api", environment = "development") {
    this.service = service;
    this.environment = environment;
    this.logLevel = process.env.LOG_LEVEL || "info";
  }

  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error", "fatal"];
    const configLevel = levels.indexOf(this.logLevel);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logData = {
      timestamp: new Date(entry.timestamp).toISOString(),
      level: entry.level.toUpperCase(),
      service: entry.service,
      environment: entry.environment,
      message: entry.message,
      ...(entry.traceId && { traceId: entry.traceId }),
      ...(entry.spanId && { spanId: entry.spanId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.metadata && { metadata: entry.metadata }),
    };

    // Output as structured JSON
    console.log(JSON.stringify(logData));

    // For production, you might want to send to external logging service
    if (this.environment === "production") {
      // TODO: Send to CloudWatch, ELK stack, or other logging service
    }
  }

  debug(message: string, metadata?: any): void {
    this.log({
      level: "debug",
      message,
      timestamp: Date.now(),
      service: this.service,
      environment: this.environment,
      metadata,
    });
  }

  info(message: string, metadata?: any): void {
    this.log({
      level: "info",
      message,
      timestamp: Date.now(),
      service: this.service,
      environment: this.environment,
      metadata,
    });
  }

  warn(message: string, metadata?: any): void {
    this.log({
      level: "warn",
      message,
      timestamp: Date.now(),
      service: this.service,
      environment: this.environment,
      metadata,
    });
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.log({
      level: "error",
      message,
      timestamp: Date.now(),
      service: this.service,
      environment: this.environment,
      metadata: {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
    });
  }

  fatal(message: string, error?: Error, metadata?: any): void {
    this.log({
      level: "fatal",
      message,
      timestamp: Date.now(),
      service: this.service,
      environment: this.environment,
      metadata: {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
    });
  }

  child(context: {
    traceId?: string;
    spanId?: string;
    userId?: string;
    requestId?: string;
  }): StructuredLogger {
    const childLogger = new StructuredLogger(this.service, this.environment);
    (childLogger as any).context = context;

    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (entry: LogEntry) => {
      originalLog({
        ...entry,
        ...context,
      });
    };

    return childLogger;
  }
}

class DistributedTracer {
  private readonly activeSpans = new Map<string, TraceSpan>();
  private completedSpans: TraceSpan[] = [];

  startSpan(operationName: string, parentSpan?: TraceSpan): TraceSpan {
    const traceId = parentSpan?.traceId || this.generateId();
    const spanId = this.generateId();

    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId: parentSpan?.spanId,
      operationName,
      startTime: Date.now(),
      status: "ok",
      tags: {},
      logs: [],
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  finishSpan(spanId: string, status: "ok" | "error" | "timeout" = "ok"): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);

    // Clean up old spans (keep last 1000)
    if (this.completedSpans.length > 1000) {
      this.completedSpans = this.completedSpans.slice(-1000);
    }
  }

  addTag(spanId: string, key: string, value: any): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  addLog(spanId: string, message: string, level = "info"): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        level,
      });
    }
  }

  getSpan(spanId: string): TraceSpan | undefined {
    return this.activeSpans.get(spanId);
  }

  getTrace(traceId: string): TraceSpan[] {
    const spans = [
      ...Array.from(this.activeSpans.values()),
      ...this.completedSpans,
    ];

    return spans.filter((span) => span.traceId === traceId);
  }

  private generateId(): string {
    return randomUUID().replace(/-/g, "").slice(0, 16);
  }
}

class HealthMonitor {
  private readonly checks = new Map<string, () => Promise<HealthCheck>>();
  private readonly lastResults = new Map<string, HealthCheck>();
  private readonly alertRules = new Map<string, AlertRule>();

  addCheck(name: string, checkFn: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFn);
  }

  async runCheck(name: string): Promise<HealthCheck> {
    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return {
        name,
        status: "unhealthy",
        message: "Check not found",
        timestamp: Date.now(),
      };
    }

    const startTime = Date.now();
    try {
      const result = await Promise.race([
        checkFn(),
        new Promise<HealthCheck>((_, reject) =>
          setTimeout(() => reject(new Error("Health check timeout")), 10_000)
        ),
      ]);

      result.responseTime = Date.now() - startTime;
      this.lastResults.set(name, result);
      return result;
    } catch (error) {
      const result: HealthCheck = {
        name,
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };

      this.lastResults.set(name, result);
      return result;
    }
  }

  async runAllChecks(): Promise<{
    status: string;
    checks: HealthCheck[];
    timestamp: number;
  }> {
    const results = await Promise.allSettled(
      Array.from(this.checks.keys()).map((name) => this.runCheck(name))
    );

    const checks = results.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            name: "unknown",
            status: "unhealthy" as const,
            message: "Check failed to run",
            timestamp: Date.now(),
          }
    );

    const overallStatus = checks.some((check) => check.status === "unhealthy")
      ? "unhealthy"
      : checks.some((check) => check.status === "warning")
        ? "warning"
        : "healthy";

    return {
      status: overallStatus,
      checks,
      timestamp: Date.now(),
    };
  }

  addAlert(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlert(ruleId: string): void {
    this.alertRules.delete(ruleId);
  }

  async checkAlerts(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Simple cooldown check
      if (
        rule.lastTriggered &&
        Date.now() - rule.lastTriggered < rule.cooldownMinutes * 60 * 1000
      ) {
        continue;
      }

      // TODO: Implement alert condition evaluation
      // This would typically evaluate the condition against current metrics
      await Promise.resolve();
    }
  }
}

// Initialize global instances
const metrics = new MetricsCollector();
const logger = new StructuredLogger();
const tracer = new DistributedTracer();
const healthMonitor = new HealthMonitor();

// Add default health checks
healthMonitor.addCheck("database", async () => {
  try {
    // TODO: Implement actual database health check
    return await Promise.resolve({
      name: "database",
      status: "healthy",
      message: "MongoDB connection is healthy",
      timestamp: Date.now(),
    });
  } catch (error) {
    return await Promise.resolve({
      name: "database",
      status: "unhealthy",
      message:
        error instanceof Error ? error.message : "Database connection failed",
      timestamp: Date.now(),
    });
  }
});

healthMonitor.addCheck("redis", async () => {
  try {
    // TODO: Implement actual Redis health check
    return await Promise.resolve({
      name: "redis",
      status: "healthy",
      message: "Redis connection is healthy",
      timestamp: Date.now(),
    });
  } catch (error) {
    return await Promise.resolve({
      name: "redis",
      status: "unhealthy",
      message:
        error instanceof Error ? error.message : "Redis connection failed",
      timestamp: Date.now(),
    });
  }
});

healthMonitor.addCheck("memory", async () => {
  const memUsage = process.memoryUsage();
  const totalMB = memUsage.heapTotal / 1024 / 1024;
  const usedMB = memUsage.heapUsed / 1024 / 1024;
  const usagePercent = (usedMB / totalMB) * 100;

  return await Promise.resolve({
    name: "memory",
    status:
      usagePercent > 90
        ? "unhealthy"
        : usagePercent > 75
          ? "warning"
          : "healthy",
    message: `Memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`,
    timestamp: Date.now(),
    details: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      usagePercent: usagePercent.toFixed(1),
    },
  });
});

export function observabilityPlugin() {
  return (
    new Elysia({ name: "observability" })
      .decorate("metrics", metrics)
      .decorate("logger", logger)
      .decorate("tracer", tracer)
      .decorate("health", healthMonitor)

      // Request tracing and metrics
      .onBeforeHandle(({ request, set }) => {
        const requestId = randomUUID();
        const span = tracer.startSpan(
          `${request.method} ${new URL(request.url).pathname}`
        );

        // Add request context
        (request as any)._requestId = requestId;
        (request as any)._span = span;
        (request as any)._startTime = Date.now();

        // Track request metrics
        metrics.increment("http_requests_total", {
          method: request.method,
          path: new URL(request.url).pathname,
        });

        // Add trace headers
        set.headers = {
          ...(set.headers as any),
          "x-request-id": requestId,
          "x-trace-id": span.traceId,
        };
      })

      .onAfterHandle(({ request, set }) => {
        const requestId = (request as any)._requestId;
        const span = (request as any)._span;
        const startTime = (request as any)._startTime;

        if (span && startTime) {
          const duration = Date.now() - startTime;
          const status = set.status || 200;

          // Finish span
          tracer.addTag(span.spanId, "http.status_code", status);
          tracer.addTag(span.spanId, "http.method", request.method);
          tracer.addTag(span.spanId, "http.url", request.url);
          tracer.finishSpan(
            span.spanId,
            Number(status) >= 400 ? "error" : "ok"
          );

          // Track response metrics
          metrics.observe("http_request_duration_seconds", duration / 1000, {
            method: request.method,
            status: status.toString(),
          });

          metrics.increment("http_responses_total", {
            method: request.method,
            status: status.toString(),
          });

          // Log request
          logger
            .child({ requestId, traceId: span.traceId })
            .info(
              `${request.method} ${new URL(request.url).pathname} ${status} ${duration}ms`
            );
        }
      })

      .onError(({ request, error, set }) => {
        const requestId = (request as any)._requestId;
        const span = (request as any)._span;

        if (span) {
          tracer.addTag(span.spanId, "error", true);
          tracer.addLog(span.spanId, (error as Error).message, "error");
          tracer.finishSpan(span.spanId, "error");
        }

        // Track error metrics
        metrics.increment("http_errors_total", {
          method: request.method,
          error: (error as Error).name,
        });

        // Log error
        logger
          .child({ requestId, traceId: span?.traceId })
          .error(`Request failed: ${(error as Error).message}`, error as Error);

        set.status = 500;
        return { error: "Internal server error" };
      })

      // Expose monitoring endpoints
      .get(
        "/metrics",
        () =>
          new Response(metrics.exportPrometheus(), {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          })
      )

      .get("/health", async () => await healthMonitor.runAllChecks())

      .get(
        "/health/:check",
        async ({ params }) => await healthMonitor.runCheck(params.check)
      )
  );
}

// Kenya-specific monitoring
export const monitoringRules: AlertRule[] = [
  {
    id: "mpesa-failure-rate",
    name: "M-Pesa Transaction Failure Rate",
    condition: "mpesa_transaction_failure_rate > 0.05",
    threshold: 0.05,
    severity: "high",
    enabled: true,
    channels: ["sms", "email"],
    cooldownMinutes: 15,
  },
  {
    id: "sms-delivery-failure",
    name: "SMS Delivery Failure Rate",
    condition: "sms_delivery_failure_rate > 0.1",
    threshold: 0.1,
    severity: "medium",
    enabled: true,
    channels: ["email"],
    cooldownMinutes: 30,
  },
  {
    id: "api-response-time",
    name: "API Response Time",
    condition: "http_request_duration_p95 > 2.0",
    threshold: 2.0,
    severity: "medium",
    enabled: true,
    channels: ["webhook"],
    cooldownMinutes: 10,
  },
  {
    id: "database-connections",
    name: "Database Connection Pool",
    condition: "mongodb_connections_active > 80",
    threshold: 80,
    severity: "high",
    enabled: true,
    channels: ["email", "sms"],
    cooldownMinutes: 5,
  },
];

export {
  MetricsCollector,
  StructuredLogger,
  DistributedTracer,
  HealthMonitor,
  type HealthCheck,
  type AlertRule,
  type TraceSpan,
  type LogEntry,
  type MetricLabels,
  type MetricValue,
};
