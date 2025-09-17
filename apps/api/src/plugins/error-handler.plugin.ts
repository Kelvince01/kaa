import * as Sentry from "@sentry/bun";
import Elysia from "elysia";
import { logSecurityEvent } from "~/shared/utils/security-logger.util";

export const errorHandlerPlugin = new Elysia().onError(
  ({ error, set, headers, request }) => {
    Sentry.captureException(error);

    const correlationId = headers["x-correlation-id"] || crypto.randomUUID();
    const timestamp = new Date().toISOString();

    set.headers = set.headers || {};
    set.headers["x-correlation-id"] = correlationId;

    // Log security events for authentication/authorization errors
    if (
      (error as Error).message?.includes("Unauthorized") ||
      (error as Error).message?.includes("Forbidden")
    ) {
      logSecurityEvent({
        type: "AUTH_FAILURE",
        details: {
          error: (error as Error).message,
          endpoint: new URL(request.url).pathname,
          method: request.method,
        },
        correlationId,
        timestamp,
        severity: "medium",
      });
    }

    // Determine error type and status code
    let statusCode = 500;
    let errorCode = "INTERNAL_SERVER_ERROR";

    if ((error as Error).message?.includes("Validation")) {
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
    } else if ((error as Error).message?.includes("Unauthorized")) {
      statusCode = 401;
      errorCode = "UNAUTHORIZED";
    } else if ((error as Error).message?.includes("Forbidden")) {
      statusCode = 403;
      errorCode = "FORBIDDEN";
    } else if ((error as Error).message?.includes("Not Found")) {
      statusCode = 404;
      errorCode = "NOT_FOUND";
    } else if ((error as Error).message?.includes("Rate limit")) {
      statusCode = 429;
      errorCode = "RATE_LIMIT_EXCEEDED";
    }

    set.status = statusCode;

    // Return standardized error format
    return {
      code: errorCode,
      message: (error as Error).message,
      details:
        process.env.NODE_ENV === "development"
          ? { stack: (error as Error).stack }
          : undefined,
      correlationId,
      timestamp,
    };
  }
);
