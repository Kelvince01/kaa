import type { AxiosError } from "axios";
import { toast } from "sonner";
import type { LogLevel, SecurityEvent } from "../types";
import {
  CircuitBreakerError,
  createErrorFromAxiosError,
  type HttpError,
} from "./error-types";

export type ErrorHandlerConfig = {
  showToasts: boolean;
  logErrors: boolean;
  reportToService: boolean;
};

export class ErrorHandler {
  private readonly config: ErrorHandlerConfig;
  private readonly securityLogger?: (event: SecurityEvent) => void;
  private readonly errorLogger?: (
    level: LogLevel,
    message: string,
    context?: any
  ) => void;

  constructor(
    config: ErrorHandlerConfig,
    securityLogger?: (event: SecurityEvent) => void,
    errorLogger?: (level: LogLevel, message: string, context?: any) => void
  ) {
    this.config = config;
    this.securityLogger = securityLogger;
    this.errorLogger = errorLogger;
  }

  handle(error: AxiosError, correlationId?: string): Promise<never> {
    const httpError = createErrorFromAxiosError(error, correlationId);

    this.logError(httpError);
    this.showUserNotification(httpError);
    this.reportSecurityEvent(httpError);

    return Promise.reject(httpError);
  }

  handleCircuitBreakerError(
    endpoint: string,
    correlationId?: string
  ): Promise<never> {
    const error = new CircuitBreakerError(
      `Service temporarily unavailable: ${endpoint}`,
      correlationId
    );

    this.logError(error);
    this.showUserNotification(error);

    return Promise.reject(error);
  }

  private logError(error: HttpError): void {
    if (!(this.config.logErrors && this.errorLogger)) return;

    const logLevel: LogLevel = this.getLogLevel(error.status);
    const context = {
      status: error.status,
      code: error.code,
      details: error.details,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
    };

    this.errorLogger(logLevel, error.message, context);
  }

  private showUserNotification(error: HttpError): void {
    if (!this.config.showToasts) return;

    const message = this.getUserFriendlyMessage(error);

    switch (error.status) {
      case 401:
        toast.error(message, { description: "Please log in again" });
        break;
      case 403:
        toast.error(message, {
          description: "Contact support if this persists",
        });
        break;
      case 429:
        toast.warning(message, {
          description: "Please wait before trying again",
        });
        break;
      case 0:
        toast.error(message, { description: "Check your internet connection" });
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error(message, { description: "We're working to fix this" });
        break;
      default:
        if (error.status >= 400) {
          toast.error(message);
        }
    }
  }

  private reportSecurityEvent(error: HttpError): void {
    if (!this.securityLogger) return;

    const securityEvents: Record<number, SecurityEvent["type"]> = {
      401: "AUTH_FAILURE",
      403: "AUTH_FAILURE",
      429: "RATE_LIMIT",
    };

    const eventType = securityEvents[error.status];
    if (!eventType) return;

    const severity = this.getSecuritySeverity(error.status);

    this.securityLogger({
      type: eventType,
      details: {
        status: error.status,
        code: error.code,
        endpoint: error.details?.url,
        userAgent:
          typeof window !== "undefined" ? navigator.userAgent : "server",
        ...error.details,
      },
      endpoint: error.details?.url,
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      severity,
    });
  }

  private getUserFriendlyMessage(error: HttpError): string {
    const friendlyMessages: Record<number, string> = {
      0: "Connection failed",
      401: "Authentication required",
      403: "Access denied",
      404: "Resource not found",
      408: "Request timeout",
      422: "Invalid data provided",
      429: "Too many requests",
      500: "Server error",
      502: "Service unavailable",
      503: "Service temporarily down",
      504: "Service timeout",
    };

    return (
      friendlyMessages[error.status] || error.message || "An error occurred"
    );
  }

  private getLogLevel(status: number): LogLevel {
    if (status >= 500) return "error";
    if (status >= 400) return "warn";
    return "info";
  }

  private getSecuritySeverity(status: number): SecurityEvent["severity"] {
    switch (status) {
      case 401:
      case 403:
        return "high";
      case 429:
        return "medium";
      default:
        return "low";
    }
  }
}
