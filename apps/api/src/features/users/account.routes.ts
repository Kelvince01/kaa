import { Elysia } from "elysia";
import { adminController } from "./admin/admin.controller";
import { landlordController } from "./landlords/landlord.controller";
import { tenantController } from "./tenants/tenant.controller";
import { usersController } from "./user.controller";

export const accountRoutes = new Elysia()
  .use(usersController)
  .use(landlordController)
  .use(tenantController)
  .use(adminController);
