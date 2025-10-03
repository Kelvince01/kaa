// import { Elysia, t } from "elysia";
// import { TenantScreeningService } from "./tenant-screening.service";
// import { ScreeningType } from "./tenant-screening.model";

// export const tenantScreeningController = new Elysia({ prefix: "/tenant-screening" })
// 	.post(
// 		"/",
// 		async ({ body }) => {
// 			return await TenantScreeningService.initiateScreening(body);
// 		},
// 		{
// 			body: t.Object({
// 				tenantId: t.String(),
// 				propertyId: t.String(),
// 				landlordId: t.String(),
// 				applicationId: t.String(),
// 				screeningType: t.Enum(ScreeningType),
// 				requestedBy: t.String(),
// 			}),
// 		}
// 	)

// 	.get("/:id", async ({ params }) => {
// 		return await TenantScreeningService.getScreeningById(params.id);
// 	})

// 	.get("/tenant/:tenantId", async ({ params }) => {
// 		return await TenantScreeningService.getScreeningsByTenant(params.tenantId);
// 	})

// 	.get("/landlord/:landlordId", async ({ params }) => {
// 		return await TenantScreeningService.getScreeningsByLandlord(params.landlordId);
// 	});
