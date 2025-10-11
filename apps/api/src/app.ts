import "../instrument"; // Must be the first import

import { etag } from "@bogeychan/elysia-etag";
import { logger } from "@chneau/elysia-logger";
import cookie from "@elysiajs/cookie";
import { serverTiming } from "@elysiajs/server-timing";
import staticPlugin from "@elysiajs/static";
import config from "@kaa/config/api";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { i18next } from "elysia-i18next";
import prometheusPlugin from "elysia-prometheus";
import { rateLimit } from "elysia-rate-limit";
import { elysiaXSS } from "elysia-xss";
import { Logestic } from "logestic";
import { WebSocketServer } from "ws";

import { AppRoutes } from "./app.routes";
import { MongooseSetup } from "./database/mongoose.setup";
import { videoCallingService } from "./features/comms";
import { i18nRoutes } from "./features/i18n";
import { performancePlugin as monitoringPlugin } from "./features/misc/monitoring/monitoring.plugin";
import { wsRoutes } from "./features/ws";
import { i18n } from "./i18n";
import { telemetryConfig } from "./instrument";
import setupBullBoard from "./plugins/bull-board.plugin";
import {
  compression,
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
import { geoIP } from "./shared/utils/geo-ip.util";

const idDev = config.env !== "production";
const app = new Elysia();

app
  .use(logger())
  // Add correlation ID middleware (replaces request ID)
  .use(correlationPlugin)
  // Add error handling middleware
  .use(errorHandlerPlugin)
  .use(i18next({ instance: i18n }))
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
  .use(geoIP) // required geo id db in data/GeoLite2-Country.mmdb
  .use(i18nRoutes)
  .use(AppRoutes)
  .use(wsRoutes)
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

if (!idDev)
  app.use(
    rateLimit({
      max: 100,
    })
  );

app.use(elysiaXSS({}));
if (!idDev) app.use(compression());
if (!idDev) app.use(etag());

const wsServer = new WebSocketServer({ port: 8080 });
videoCallingService.initialize(wsServer);

export default app;
export type App = typeof app;
