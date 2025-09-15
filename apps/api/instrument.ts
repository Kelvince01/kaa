import config from "@kaa/config/api";
// biome-ignore lint/performance/noNamespaceImport: false positive
import * as Sentry from "@sentry/bun";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.env,
  integrations: [
    Sentry.bunServerIntegration(),
    // Enable HTTP calls tracing
    Sentry.httpIntegration(),
    // nodeProfilingIntegration(),
    Sentry.requestDataIntegration(),
  ],
  tracesSampleRate: config.env === "production" ? 0.2 : 1.0, // Adjust this value for performance monitoring - Capture 100% of the transactions for production

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // Set sampling rate for profiling - this is evaluated only once per SDK.init call
  // profilesSampleRate: config.env === "production" ? 0.1 : 1.0,
  // Trace lifecycle automatically enables profiling during active traces
  // profileLifecycle: "trace",
  // Enable debug in development
  // debug: config.env !== "production",
  // Adjust the traces sample rate in production
  beforeSend(event) {
    if (config.env === "production") {
      // Don't send users' personal information
      // biome-ignore lint/style/useCollapsedIf: false positive
      if (event.user) {
        // biome-ignore lint/performance/noDelete: false positive
        delete event.user.email;
        // biome-ignore lint/performance/noDelete: false positive
        delete event.user.ip_address;
      }
    }
    return event;
  },
});
