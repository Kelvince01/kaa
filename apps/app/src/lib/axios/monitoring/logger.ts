import type { LogEntry, LogLevel } from "../types";

export type LoggerConfig = {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBatchSize: number;
  batchInterval: number;
};

export class Logger {
  private readonly config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private batchTimer?: NodeJS.Timeout;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.startBatchTimer();
  }

  debug(
    message: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): void {
    this.log("debug", message, correlationId, context);
  }

  info(
    message: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): void {
    this.log("info", message, correlationId, context);
  }

  warn(
    message: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): void {
    this.log("warn", message, correlationId, context);
  }

  error(
    message: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): void {
    this.log("error", message, correlationId, context);
  }

  private log(
    level: LogLevel,
    message: string,
    correlationId?: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableRemote) {
      this.addToBuffer(entry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const suffix = entry.correlationId ? ` (${entry.correlationId})` : "";

    const logFn = this.getConsoleFn(entry.level);

    if (entry.context) {
      logFn(`${prefix} ${entry.message}${suffix}`, entry.context);
    } else {
      logFn(`${prefix} ${entry.message}${suffix}`);
    }
  }

  private getConsoleFn(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case "debug":
        return console.debug;
      case "info":
        return console.info;
      case "warn":
        return console.warn;
      case "error":
        return console.error;
      default:
        return console.log;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.config.maxBatchSize) {
      this.flushBuffer();
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flushBuffer();
      }
    }, this.config.batchInterval);
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.sendLogsToRemote(logs);
    } catch (error) {
      console.error("Failed to send logs to remote endpoint:", error);
      // Re-add logs to buffer for retry (with limit to prevent memory leak)
      if (this.logBuffer.length < this.config.maxBatchSize * 2) {
        this.logBuffer.unshift(...logs);
      }
    }
  }

  private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    const response = await fetch(this.config.remoteEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logs }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
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
