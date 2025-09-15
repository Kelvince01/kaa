import { openapi } from "@elysiajs/openapi";
import config from "@kaa/config/api";

const openapiDocs = openapi({
  path: "/api/docs",
  specPath: "/api/docs/json",
  documentation: {
    info: {
      title: config.app.name,
      description: config.app.description,
      version: config.app.version,
      termsOfService: "https://docs.kaapro.dev/api/usage",
      license: {
        name: "MIT",
        url: "https://opensource.org/license/mit/",
      },
      contact: {
        name: "API Support",
        url: "https://kaapro.dev",
        email: "support@kaapro.dev",
      },
    },
    servers: [
      {
        url:
          config.env === "development"
            ? `http://localhost:${config.port}`
            : `${config.app.url}`,
        description:
          config.env === "development"
            ? "Development server"
            : "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  provider: "scalar",
  swagger: {
    persistAuthorization: true,
    autoDarkMode: true,
  },
  scalar: {
    version: "latest",
    layout: "modern",
    spec: {
      url: "/api/docs/json",
    },
    theme: "bluePlanet",
  },
  exclude: {
    paths: [
      "/",
      "/metrics",
      "/health",
      "/ws",
      "/stop",
      "/api/docs",
    ] as string[],
  },
});

export default openapiDocs;
