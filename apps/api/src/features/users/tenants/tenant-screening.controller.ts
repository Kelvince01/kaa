import { ScreeningType } from "@kaa/models/types";
import { TenantScreeningService } from "@kaa/services";
import { Elysia, t } from "elysia";

export const tenantScreeningController = new Elysia({
  prefix: "/tenant-screening",
})
  .post(
    "/",
    async ({ body }) => await TenantScreeningService.initiateScreening(body),
    {
      body: t.Object({
        tenantId: t.String(),
        propertyId: t.String(),
        landlordId: t.String(),
        applicationId: t.String(),
        screeningType: t.Enum(ScreeningType),
        requestedBy: t.String(),
      }),
    }
  )

  .get(
    "/:id",
    async ({ params }) =>
      await TenantScreeningService.getScreeningById(params.id),
    {
      params: t.Object({ id: t.String() }),
    }
  )

  .get(
    "/tenant/:tenantId",
    async ({ params }) =>
      await TenantScreeningService.getScreeningsByTenant(params.tenantId),
    {
      params: t.Object({ tenantId: t.String() }),
    }
  )

  .get(
    "/landlord/:landlordId",
    async ({ params }) =>
      await TenantScreeningService.getScreeningsByLandlord(params.landlordId),
    {
      params: t.Object({ landlordId: t.String() }),
    }
  );
