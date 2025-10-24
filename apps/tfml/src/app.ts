import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import logixlysia from "logixlysia";

import { MongooseSetup } from "~/database/mongoose.setup";
import { routes } from "./app.routes";
import setupBullBoard from "./common/plugins/bull-board.plugin";

// import "./features/ai/ai.queue"; // initialize AI training worker

const app = new Elysia()
  .use(
    logixlysia({
      config: {
        showStartupMessage: false,
        startupMessageFormat: "banner",
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss.SSS",
        },
        logFilePath: "./logs/example.log",
        ip: true,
        customLogFormat:
          "🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}",
      },
    }),
  )
  .use(
    openapi({
      documentation: {
        info: {
          title: "TFML API",
          description: "This is the server for TFML API.",
          termsOfService: "https://tfml.kaapro.dev/terms",
          contact: {
            name: "API Support",
            url: "https://tfml.kaapro.dev/support",
            email: "support@tfml.kaapro.dev",
          },
          license: {
            name: "MIT",
            url: "https://tfml.kaapro.dev/license",
          },
          version: "1.0.0",
        },
      },
      // path: "/api/docs",
      // specPath: "/api/docs/json",
      scalar: {
        layout: "classic",
        spec: {
          // url: "/api/docs/json",
        },
        theme: "kepler", // alternate, default, moon, purple, solarized, bluePlanet, saturn, kepler, mars, deepSpace, laserwave, none
        customCss: "body { background-color: #BADA55;}",
      },
    }),
  )
  .onStart(() => {
    // Setup database
    new MongooseSetup();
  })
  .get("/", () => "Hello TFML")
  .use(routes)
  // Bull dashboard
  .use(setupBullBoard);

export default app;
