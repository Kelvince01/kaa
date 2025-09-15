import Elysia from "elysia";
import { verifyRequestSignature } from "~/shared/utils/request-signing.util";
import { logSecurityEvent } from "~/shared/utils/security-logger.util";

export const requestSigningPlugin = new Elysia().onBeforeHandle(
  ({ request, set, headers, body }) => {
    // Skip verification for GET, HEAD, OPTIONS requests
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      return;
    }

    // Skip if request signing is disabled or in development
    if (
      process.env.ENABLE_REQUEST_SIGNING === "false" ||
      process.env.NODE_ENV === "development"
    ) {
      return;
    }

    const correlationId = headers["x-correlation-id"] || crypto.randomUUID();

    try {
      // Get request body as string
      let bodyString = "";
      if (body) {
        if (typeof body === "string") {
          bodyString = body;
        } else if (typeof body === "object") {
          bodyString = JSON.stringify(body);
        }
      }

      const url = new URL(request.url);
      const isValid = verifyRequestSignature(
        request.method,
        url.pathname + url.search,
        bodyString,
        headers
      );

      if (!isValid) {
        logSecurityEvent({
          type: "REQUEST_SIGNATURE_INVALID",
          details: {
            reason: "Invalid request signature",
            endpoint: url.pathname,
            method: request.method,
          },
          correlationId,
          timestamp: new Date().toISOString(),
          severity: "high",
        });

        set.status = 401;
        set.headers["x-correlation-id"] = correlationId;

        return {
          code: "REQUEST_SIGNATURE_INVALID",
          message: "Request signature is invalid",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      logSecurityEvent({
        type: "REQUEST_SIGNATURE_INVALID",
        details: {
          reason: "Signature verification failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        correlationId,
        timestamp: new Date().toISOString(),
        severity: "critical",
      });

      set.status = 401;
      set.headers["x-correlation-id"] = correlationId;

      return {
        code: "REQUEST_SIGNATURE_ERROR",
        message: "Request signature verification failed",
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }
  }
);
