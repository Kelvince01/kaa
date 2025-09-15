import cors from "@elysiajs/cors";
import jwt from "@elysiajs/jwt";
import config from "@kaa/config/api";
import { type Elysia, t } from "elysia";

// Security headers plugin
export const securityHeadersPlugin = (app: Elysia) =>
  app.onAfterHandle(({ set }) => {
    // Security headers
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    set.headers["Permissions-Policy"] =
      "camera=(), microphone=(), geolocation=()";

    // HSTS in production
    if (config.env === "production") {
      set.headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains; preload";
    }

    // CSP header
    set.headers["Content-Security-Policy"] =
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'; frame-ancestors 'none';";
  });

export const corsPlugin = (app: Elysia) =>
  app.use(
    cors({
      origin:
        config.env === "production" ? [config.clientUrl].filter(Boolean) : true, // Allow all origins in development
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Session-ID",
        "Accept",
        "Origin",
        "X-Correlation-ID",
        "X-CSRF-Token",
        "X-Signature",
        "X-Timestamp",
        "X-Nonce",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
        "Content-Security-Policy",
      ],
      exposeHeaders: [
        "X-Correlation-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
        "Content-Security-Policy",
      ],
      credentials: true,
      preflight: true,
      maxAge: 86_400, // 24 hours
    })
  );

const jwtSchema = t.Object({
  sub: t.String(),
  iss: t.String(),
  exp: t.Number(),
});

export const jwtPlugin = jwt({
  name: config.jwt.name,
  secret: config.jwt.secret,
  schema: jwtSchema,
});
