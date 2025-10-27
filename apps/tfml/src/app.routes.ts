import Elysia from "elysia";
import { aiController } from "#/features/ai/ai.controller";
import { mlAnalyticsController } from "#/features/ai/ml-analytics.controller";
import { authController } from "#/features/auth/auth.controller";

const routes = new Elysia({ prefix: "api/v1" })
  .use(authController)
  .use(aiController)
  .use(mlAnalyticsController);

export { routes };
