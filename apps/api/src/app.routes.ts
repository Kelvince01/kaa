import { Elysia } from "elysia";

import { aiController } from "./features/ai/ai.controller";
import { authController } from "./features/auth/auth.controller";
import { csrfController } from "./features/auth/csrf.controller";
import { securityMonitoringController } from "./features/auth/security-monitoring.controller";
import { monitoringController } from "./features/misc/monitoring/monitoring.controller";
import { rbacController } from "./features/rbac/rbac.controller";
import { usersController } from "./features/users/user.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(csrfController)
  .use(securityMonitoringController)
  .use(authController)
  .use(rbacController)
  .use(usersController)
  .use(aiController)
  .use(monitoringController);

export { routes as AppRoutes };
