import { ScreeningType } from "@kaa/models/types";
import { TenantScreeningService } from "@kaa/services";
import { Elysia, t } from "elysia";

export const tenantScreeningController = new Elysia({
  prefix: "/screening",
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
      detail: {
        tags: ["tenant-screening"],
        summary: "Initiate tenant screening",
        description: "Initiate a tenant screening process",
      },
    }
  )

  .get(
    "/:id",
    async ({ params }) =>
      await TenantScreeningService.getScreeningById(params.id),
    {
      params: t.Object({ id: t.String() }),
      detail: {
        tags: ["tenant-screening"],
        summary: "Get tenant screening by ID",
        description: "Get a tenant screening by ID",
      },
    }
  )

  .get(
    "/tenant/:tenantId",
    async ({ params }) =>
      await TenantScreeningService.getScreeningsByTenant(params.tenantId),
    {
      params: t.Object({ tenantId: t.String() }),
      detail: {
        tags: ["tenant-screening"],
        summary: "Get tenant screenings by tenant ID",
        description: "Get tenant screenings by tenant ID",
      },
    }
  )

  .get(
    "/landlord/:landlordId",
    async ({ params }) =>
      await TenantScreeningService.getScreeningsByLandlord(params.landlordId),
    {
      params: t.Object({ landlordId: t.String() }),
      detail: {
        tags: ["tenant-screening"],
        summary: "Get tenant screenings by landlord ID",
        description: "Get tenant screenings by landlord ID",
      },
    }
  );
