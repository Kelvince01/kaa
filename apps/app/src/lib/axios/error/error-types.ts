import type { AxiosError } from "axios";
import type { ApiError } from "../types";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, any>;
  readonly correlationId?: string;
  readonly timestamp: string;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

export class NetworkError extends HttpError {
  constructor(message = "Network error occurred", correlationId?: string) {
    super(message, 0, "NETWORK_ERROR", undefined, correlationId);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends HttpError {
  constructor(message = "Request timeout", correlationId?: string) {
    super(message, 408, "TIMEOUT_ERROR", undefined, correlationId);
    this.name = "TimeoutError";
  }
}

export class RateLimitError extends HttpError {
  constructor(
    message = "Rate limit exceeded",
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, 429, "RATE_LIMIT_ERROR", details, correlationId);
    this.name = "RateLimitError";
  }
}

export class AuthenticationError extends HttpError {
  constructor(
    message = "Authentication failed",
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, 401, "AUTHENTICATION_ERROR", details, correlationId);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends HttpError {
  constructor(
    message = "Access forbidden",
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, 403, "AUTHORIZATION_ERROR", details, correlationId);
    this.name = "AuthorizationError";
  }
}

export class ValidationError extends HttpError {
  constructor(
    message = "Validation failed",
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, 422, "VALIDATION_ERROR", details, correlationId);
    this.name = "ValidationError";
  }
}

export class ServerError extends HttpError {
  constructor(
    message = "Internal server error",
    status = 500,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, status, "SERVER_ERROR", details, correlationId);
    this.name = "ServerError";
  }
}

export class CircuitBreakerError extends HttpError {
  constructor(message = "Circuit breaker is open", correlationId?: string) {
    super(message, 503, "CIRCUIT_BREAKER_OPEN", undefined, correlationId);
    this.name = "CircuitBreakerError";
  }
}

export function createErrorFromAxiosError(
  axiosError: AxiosError,
  correlationId?: string
): HttpError {
  const status = axiosError.response?.status || 0;
  const responseData = axiosError.response?.data as any;

  const details = {
    url: axiosError.config?.url,
    method: axiosError.config?.method,
    ...(responseData && typeof responseData === "object" ? responseData : {}),
  };

  switch (status) {
    case 0:
      if (axiosError.code === "ECONNABORTED") {
        return new TimeoutError(axiosError.message, correlationId);
      }
      return new NetworkError(axiosError.message, correlationId);

    case 401:
      return new AuthenticationError(
        responseData?.message || axiosError.message,
        details,
        correlationId
      );

    case 403:
      return new AuthorizationError(
        responseData?.message || axiosError.message,
        details,
        correlationId
      );

    case 422:
      return new ValidationError(
        responseData?.message || axiosError.message,
        details,
        correlationId
      );

    case 429:
      return new RateLimitError(
        responseData?.message || axiosError.message,
        details,
        correlationId
      );

    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(
        responseData?.message || axiosError.message,
        status,
        details,
        correlationId
      );

    default:
      return new HttpError(
        responseData?.message || axiosError.message,
        status,
        responseData?.code || "HTTP_ERROR",
        details,
        correlationId
      );
  }
}
