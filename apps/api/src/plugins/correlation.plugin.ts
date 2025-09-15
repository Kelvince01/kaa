import Elysia from "elysia";

export const correlationPlugin = new Elysia()
  .onRequest(({ set }) => {
    // Generate or extract correlation ID
    const correlationId =
      set.headers["x-correlation-id"] || crypto.randomUUID();

    // Add to response headers
    set.headers = set.headers || {};
    set.headers["x-correlation-id"] = correlationId;

    // Store in context for use in responses
    (set as any).correlationId = correlationId;
  })
  .onAfterHandle(({ response, set }) => {
    // Ensure correlation ID is in response for API responses
    if (response && typeof response === "object" && !Array.isArray(response)) {
      const correlationId = (set as any).correlationId;
      if (correlationId && !(response as any).correlationId) {
        (response as any).correlationId = correlationId;
      }
    }
  });
