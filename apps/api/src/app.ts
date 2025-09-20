import "../instrument"; // Must be the first import

import cookie from "@elysiajs/cookie";
import { serverTiming } from "@elysiajs/server-timing";
import staticPlugin from "@elysiajs/static";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { i18next } from "elysia-i18next";
import prometheusPlugin from "elysia-prometheus";
import { Logestic } from "logestic";

import { AppRoutes } from "./app.routes";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  TRANSLATIONS,
} from "./config/locale.config";
import { MongooseSetup } from "./database/mongoose.setup";
import { performancePlugin as monitoringPlugin } from "./features/misc/monitoring/monitoring.plugin";
import { telemetryConfig } from "./instrument";
import setupBullBoard from "./plugins/bull-board.plugin";
import {
  optimizationPlugin,
  optimizations,
} from "./plugins/compression.plugin";
import { correlationPlugin } from "./plugins/correlation.plugin";
import { cronPlugin } from "./plugins/cron.plugin";
import { csrfPlugin } from "./plugins/csrf.plugin";
import { errorHandlerPlugin } from "./plugins/error-handler.plugin";
import {
  healthCheckPlugin,
  metricsEndpointPlugin,
} from "./plugins/metric.plugin";
import openapiDocs from "./plugins/openapi.plugin";
import { performancePlugin } from "./plugins/performance.plugin";
import { requestSigningPlugin } from "./plugins/request-signing.plugin";
import { corsPlugin } from "./plugins/security.plugin";
import sitePlugin, { publicPath } from "./plugins/site.plugin";

const app = new Elysia();

app
  // Add correlation ID middleware (replaces request ID)
  .use(correlationPlugin)
  // Add error handling middleware
  .use(errorHandlerPlugin)
  .use(
    i18next({
      initOptions: {
        lng: DEFAULT_LOCALE,
        resources: TRANSLATIONS,
        fallbackLng: DEFAULT_LOCALE,
        supportedLngs: SUPPORTED_LOCALES,
        detection: {
          order: ["header", "querystring"],
          lookupHeader: "accept-language",
          lookupQuerystring: "lang",
        },
      },
    })
  )
  .use(
    optimizationPlugin(
      optimizations.compression,
      optimizations.cache,
      optimizations.pagination,
      optimizations.chunking
    )
  )
  .onStart(() => {
    // Setup database
    new MongooseSetup();
  })
  .use(corsPlugin)
  .use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "unpkg.com",
            "cdn.jsdelivr.net",
          ],
          styleSrc: ["'self'", "'unsafe-inline'", "unpkg.com"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
    })
  )
  .use(cookie())
  .use(serverTiming())
  .use(Logestic.preset("fancy"))
  .use(
    staticPlugin({
      prefix: "/",
      assets: publicPath,
      indexHTML: true,
      noCache: true,
      alwaysStatic: true,
    })
  )
  .use(telemetryConfig)
  .use(sitePlugin)
  // Add security middleware
  .use(csrfPlugin)
  .use(requestSigningPlugin)
  .use(performancePlugin)
  .use(AppRoutes)
  .use(metricsEndpointPlugin)
  .use(healthCheckPlugin)
  .use(setupBullBoard)
  .use(openapiDocs)
  .use(cronPlugin)
  .use(
    prometheusPlugin({
      metricsPath: "/metrics/prometheus",
      staticLabels: { service: "api" },
      dynamicLabels: {
        userAgent: (ctx) => ctx.request.headers.get("user-agent") ?? "unknown",
      },
    })
  )
  .use(monitoringPlugin("api"));

export default app;
export type App = typeof app;
