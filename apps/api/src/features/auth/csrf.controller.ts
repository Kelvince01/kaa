import Elysia, { t } from "elysia";
import { generateCSRFToken, verifyCSRFToken } from "~/shared/utils/csrf.util";

export const csrfController = new Elysia()
  .get(
    "/csrf-token",
    ({ set, headers }) => {
      try {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        const token = generateCSRFToken();

        set.headers["x-correlation-id"] = correlationId;
        set.status = 200;

        return {
          data: { token },
          message: "CSRF token generated successfully",
          status: 200,
          correlationId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const correlationId =
          headers["x-correlation-id"] || crypto.randomUUID();
        set.headers["x-correlation-id"] = correlationId;
        set.status = 500;

        return {
          code: "CSRF_TOKEN_GENERATION_FAILED",
          message: "Failed to generate CSRF token",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      response: {
        200: t.Object({
          data: t.Object({
            token: t.String(),
          }),
          message: t.String(),
          status: t.Number(),
          correlationId: t.String(),
          timestamp: t.String(),
        }),
        500: t.Object({
          code: t.String(),
          message: t.String(),
          correlationId: t.String(),
          timestamp: t.String(),
        }),
      },
      detail: {
        summary: "Generate CSRF Token",
        description: "Generate a CSRF token",
        tags: ["csrf"],
      },
    }
  )
  .get(
    "/verify/csrf-token/:token",
    ({ set, headers, params }) => {
      try {
        const correlationId = headers["x-correlation-id"];

        if (!correlationId) {
          set.status = 400;
          return {
            message: "Correlation ID is missing",
            timestamp: new Date().toISOString(),
          };
        }

        const token = params.token;
        const isValid = verifyCSRFToken(token);
        if (isValid) {
          set.status = 200;
          return {
            message: "CSRF token is valid",
            correlationId,
            timestamp: new Date().toISOString(),
          };
        }
        set.status = 403;
        return {
          message: "CSRF token is invalid",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        const correlationId = headers["x-correlation-id"];
        set.status = 500;
        return {
          message: "Failed to verify CSRF token",
          correlationId,
          timestamp: new Date().toISOString(),
        };
      }
    },
    {
      response: {
        200: t.Object({
          message: t.String(),
          correlationId: t.String(),
          timestamp: t.String(),
        }),
        400: t.Object({
          message: t.String(),
          timestamp: t.String(),
        }),
        403: t.Object({
          message: t.String(),
          correlationId: t.String(),
          timestamp: t.String(),
        }),
        500: t.Object({
          message: t.String(),
          correlationId: t.String(),
          timestamp: t.String(),
        }),
      },
      detail: {
        summary: "Verify CSRF Token",
        description: "Verify a CSRF token",
        tags: ["csrf"],
      },
    }
  );
