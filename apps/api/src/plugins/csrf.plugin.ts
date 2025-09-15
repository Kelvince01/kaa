import Elysia from "elysia";
import { extractCSRFToken, verifyCSRFToken } from "~/shared/utils/csrf.util";
import { logSecurityEvent } from "~/shared/utils/security-logger.util";

export const csrfPlugin = new Elysia().onBeforeHandle(
  ({ request, set, headers }) => {
    // Skip CSRF validation for GET, HEAD, and OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return;
    }

    // Skip CSRF validation for /csrf-token endpoint
    if (request.url.includes("/csrf-token")) {
      return;
    }

    // Skip if CSRF protection is disabled
    if (process.env.ENABLE_CSRF_PROTECTION === "false") {
      return;
    }

    const correlationId = headers["x-correlation-id"] || crypto.randomUUID();
    const csrfToken = extractCSRFToken(headers);

    if (!csrfToken) {
      logSecurityEvent({
        type: "CSRF_VALIDATION_FAILED",
        details: { reason: "Missing CSRF token", endpoint: request.url },
        correlationId,
        timestamp: new Date().toISOString(),
        severity: "high",
      });

      set.status = 403;
      set.headers["x-correlation-id"] = correlationId;

      return {
        code: "CSRF_TOKEN_MISSING",
        message: "CSRF token is required",
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }

    if (!verifyCSRFToken(csrfToken)) {
      logSecurityEvent({
        type: "CSRF_VALIDATION_FAILED",
        details: { reason: "Invalid CSRF token", endpoint: request.url },
        correlationId,
        timestamp: new Date().toISOString(),
        severity: "high",
      });

      set.status = 403;
      set.headers["x-correlation-id"] = correlationId;

      return {
        code: "CSRF_TOKEN_INVALID",
        message: "Invalid CSRF token",
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }
  }
);
