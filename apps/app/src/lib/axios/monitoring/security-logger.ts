import type { SecurityEvent } from "../types";

export type SecurityLoggerConfig = {
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBatchSize: number;
  batchInterval: number;
  alertThresholds: {
    criticalEvents: number;
    highEvents: number;
    timeWindow: number; // in minutes
  };
};

export class SecurityLogger {
  private readonly config: SecurityLoggerConfig;
  private eventBuffer: SecurityEvent[] = [];
  private recentEvents: SecurityEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private readonly alertCallback?: (events: SecurityEvent[]) => void;

  constructor(
    config: SecurityLoggerConfig,
    alertCallback?: (events: SecurityEvent[]) => void
  ) {
    this.config = config;
    this.alertCallback = alertCallback;
    this.startBatchTimer();
  }

  logSecurityEvent(event: SecurityEvent): void {
    // Add to recent events for threshold monitoring
    this.recentEvents.push(event);
    this.cleanupRecentEvents();

    if (this.config.enableConsole) {
      this.logToConsole(event);
    }

    if (this.config.enableRemote) {
      this.addToBuffer(event);
    }

    // Check alert thresholds
    this.checkAlertThresholds();
  }

  private logToConsole(event: SecurityEvent): void {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [SECURITY] [${event.severity.toUpperCase()}]`;
    const suffix = event.correlationId ? ` (${event.correlationId})` : "";

    const logFn = this.getConsoleFn(event.severity);
    logFn(`${prefix} ${event.type}: ${JSON.stringify(event.details)}${suffix}`);
  }

  private getConsoleFn(
    severity: SecurityEvent["severity"]
  ): (...args: unknown[]) => void {
    switch (severity) {
      case "critical":
      case "high":
        return console.error;
      case "medium":
        return console.warn;
      case "low":
        return console.info;
      default:
        return console.log;
    }
  }

  private addToBuffer(event: SecurityEvent): void {
    this.eventBuffer.push(event);

    if (this.eventBuffer.length >= this.config.maxBatchSize) {
      this.flushBuffer();
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushBuffer();
      }
    }, this.config.batchInterval);
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.sendEventsToRemote(events);
    } catch (error) {
      console.error(
        "Failed to send security events to remote endpoint:",
        error
      );
      // Re-add events to buffer for retry (with limit to prevent memory leak)
      if (this.eventBuffer.length < this.config.maxBatchSize * 2) {
        this.eventBuffer.unshift(...events);
      }
    }
  }

  private async sendEventsToRemote(events: SecurityEvent[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    const response = await fetch(this.config.remoteEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event-Type": "security",
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  private cleanupRecentEvents(): void {
    const BASE_TIME = 1000;
    const TIME_WINDOW = 60 * BASE_TIME;
    const cutoff =
      Date.now() - this.config.alertThresholds.timeWindow * TIME_WINDOW;
    this.recentEvents = this.recentEvents.filter(
      (event) => new Date(event.timestamp).getTime() > cutoff
    );
  }

  private checkAlertThresholds(): void {
    if (!this.alertCallback) {
      return;
    }

    const critical = this.recentEvents.filter((e) => e.severity === "critical");
    const high = this.recentEvents.filter((e) => e.severity === "high");

    const shouldAlert =
      critical.length >= this.config.alertThresholds.criticalEvents ||
      high.length >= this.config.alertThresholds.highEvents;

    if (shouldAlert) {
      this.alertCallback([...critical, ...high]);
    }
  }

  getRecentEvents(severity?: SecurityEvent["severity"]): SecurityEvent[] {
    this.cleanupRecentEvents();

    if (severity) {
      return this.recentEvents.filter((event) => event.severity === severity);
    }

    return [...this.recentEvents];
  }

  getEventsByType(type: SecurityEvent["type"]): SecurityEvent[] {
    this.cleanupRecentEvents();
    return this.recentEvents.filter((event) => event.type === type);
  }

  async flush(): Promise<void> {
    await this.flushBuffer();
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushBuffer();
  }
}
