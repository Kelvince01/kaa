import { Elysia } from "elysia";

import { aiController } from "./features/ai/ai.controller";
import { csrfController } from "./features/auth/csrf.controller";
import { securityMonitoringController } from "./features/auth/security-monitoring.controller";
import { monitoringController } from "./features/misc/monitoring/monitoring.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(csrfController)
  .use(securityMonitoringController)
  .use(aiController)
  .use(monitoringController);

export { routes as AppRoutes };
