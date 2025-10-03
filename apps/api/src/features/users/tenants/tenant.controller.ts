import { Contract, Property, Unit } from "@kaa/models";
import { TenantStatus } from "@kaa/models/types";
import { tenantService } from "@kaa/services";
// import { triggerWebhooks } from "~/features/misc/webhooks/webhooks.service";
import { clearCache } from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import * as prom from "prom-client";
import { authPlugin } from "~/features/auth/auth.plugin";
// import { tenantPlugin } from "./tenant.plugin";
import {
  createTenantSchema,
  searchTenantSchema,
  tenantQuerySchema,
  updateTenantSchema,
  updateVerificationSchema,
} from "./tenant.schema";

// Metrics for tenants
const activeTenantsGauge = new prom.Gauge({
  name: "kaa_active_tenants",
  help: "Current number of active tenants",
});

const verifiedTenantsGauge = new prom.Gauge({
  name: "kaa_verified_tenants",
  help: "Current number of verified tenants",
});

const tenantOperationsCounter = new prom.Counter({
  name: "kaa_tenant_operations",
  help: "Count of tenant operations",
  labelNames: ["operation"],
});

export const tenantController = new Elysia().group("tenants", (app) =>
  app
    .use(authPlugin)
    .get(
      "/",
      async ({ query, set }) => {
        try {
          const page = Number.parseInt(query.page as string, 10) || 1;
          const limit = Number.parseInt(query.limit as string, 10) || 10;

          const queryParams = {
            page,
            limit,
            sortBy: query.sortField || "createdAt",
            status: query.status as TenantStatus,
            property: query.property,
            unit: query.unit,
            contract: query.contract,
            isActive:
              query.isActive === "true"
                ? true
                : query.isActive === "false"
                  ? false
                  : undefined,
            startDateFrom: query.startDateFrom
              ? new Date(query.startDateFrom)
              : undefined,
            startDateTo: query.startDateTo
              ? new Date(query.startDateTo)
              : undefined,
            endDateFrom: query.endDateFrom
              ? new Date(query.endDateFrom)
              : undefined,
            endDateTo: query.endDateTo ? new Date(query.endDateTo) : undefined,
          };

          const result = await tenantService.getTenants(queryParams);

          // Update metrics
          const activeTenantsCount = await mongoose
            .model("Tenant")
            .countDocuments({
              status: TenantStatus.ACTIVE,
              isActive: true,
            });
          const verifiedTenantsCount = await mongoose
            .model("Tenant")
            .countDocuments({
              isVerified: true,
              isActive: true,
            });

          activeTenantsGauge.set(activeTenantsCount);
          verifiedTenantsGauge.set(verifiedTenantsCount);

          return {
            status: "success",
            items: result.items,
            pagination: result.pagination,
            message: "Tenants fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching tenants:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch tenants",
          };
        }
      },
      {
        query: tenantQuerySchema,
        detail: {
          tags: ["tenants"],
          summary: "Get all tenants",
          description: "Get all tenants with pagination and filters",
        },
      }
    )
    .get(
      "/search",
      async ({ query, set }) => {
        try {
          const result = await tenantService.getTenantBy(query);

          return {
            status: "success",
            data: result,
            message: result ? "Tenant found" : "Tenant not found",
          };
        } catch (error) {
          console.error("Error searching tenant:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to search tenant",
          };
        }
      },
      {
        query: searchTenantSchema,
        detail: {
          tags: ["tenants"],
          summary: "Search tenant",
          description: "Search tenant by memberId, email, username, or phone",
        },
      }
    )
    .get(
      "/stats",
      async ({ set }) => {
        try {
          const stats = await tenantService.getTenantStats();

          return {
            status: "success",
            data: stats,
            message: "Tenant statistics fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching tenant stats:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch tenant statistics",
          };
        }
      },
      {
        detail: {
          tags: ["tenants"],
          summary: "Get tenant statistics",
          description:
            "Get tenant statistics including total, active, inactive, and suspended counts",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const { id } = params;
          const result = await tenantService.getTenantById(id);

          return {
            status: "success",
            data: result,
            message: "Tenant fetched successfully",
          };
        } catch (error: any) {
          console.error("Error fetching tenant:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to fetch tenant",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["tenants"],
          summary: "Get tenant by ID",
          description: "Get tenant by ID with populated references",
        },
      }
    )
    .post(
      "/",
      async ({ body, user, set }) => {
        try {
          const tenantData = body;

          // Verify the property exists
          const property = await Property.findById(tenantData.property);
          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Verify the unit exists and belongs to the property
          const unit = await Unit.findById(tenantData.unit);
          if (!unit || unit.property.toString() !== tenantData.property) {
            set.status = 404;
            return {
              status: "error",
              message:
                "Unit not found or does not belong to the specified property",
            };
          }

          // Verify the contract exists
          const contract = await Contract.findById(tenantData.contract);
          if (!contract) {
            set.status = 404;
            return {
              status: "error",
              message: "Contract not found",
            };
          }

          // Check if tenant already exists for this unit
          const existingTenant = await mongoose.model("Tenant").findOne({
            unit: tenantData.unit,
            status: TenantStatus.ACTIVE,
            isActive: true,
          });

          if (existingTenant) {
            set.status = 400;
            return {
              status: "error",
              message: "An active tenant already exists for this unit",
            };
          }

          // Add memberId from authenticated user
          const createData = {
            ...tenantData,
            property: new mongoose.Types.ObjectId(tenantData.property),
            contract: new mongoose.Types.ObjectId(tenantData.contract),
            unit: new mongoose.Types.ObjectId(tenantData.unit),
            user: new mongoose.Types.ObjectId(user.id),
            memberId: new mongoose.Types.ObjectId(user.memberId),
            personalInfo: {
              ...tenantData.personalInfo,
              dateOfBirth: new Date(tenantData.personalInfo.dateOfBirth),
            },
            startDate: new Date(tenantData.startDate),
            endDate: tenantData.endDate
              ? new Date(tenantData.endDate)
              : undefined,
          };

          const newTenant = await tenantService.createTenant(createData);

          // Increment tenant operations counter
          tenantOperationsCounter.inc({ operation: "create" });

          // Clear cache
          await clearCache(`property:${tenantData.property}:tenants`);
          await clearCache(`unit:${tenantData.unit}:tenant`);

          // Trigger webhooks
          // await webhookService.triggerWebhooks(user.memberId as string, "tenant.created", newTenant);

          set.status = 201;
          return {
            status: "success",
            data: newTenant,
            message: "Tenant created successfully",
          };
        } catch (error: any) {
          console.error("Error creating tenant:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to create tenant",
          };
        }
      },
      {
        body: createTenantSchema,
        detail: {
          tags: ["tenants"],
          summary: "Create tenant",
          description: "Create a new tenant",
        },
      }
    )
    .patch(
      "/:id",
      async ({ params, body, user, set }) => {
        try {
          const { id } = params;
          const updateData = body;

          // Check if tenant exists
          const existingTenant = await mongoose.model("Tenant").findById(id);
          if (!existingTenant) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // If updating property, verify it exists
          if (updateData.property) {
            const property = await Property.findById(updateData.property);
            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }
          }

          // If updating unit, verify it exists and belongs to property
          if (updateData.unit) {
            const unit = await Unit.findById(updateData.unit);
            const propertyId =
              updateData.property || existingTenant.property.toString();

            if (!unit || unit.property.toString() !== propertyId) {
              set.status = 404;
              return {
                status: "error",
                message:
                  "Unit not found or does not belong to the specified property",
              };
            }
          }

          // If updating contract, verify it exists
          if (updateData.contract) {
            const contract = await Contract.findById(updateData.contract);
            if (!contract) {
              set.status = 404;
              return {
                status: "error",
                message: "Contract not found",
              };
            }
          }

          // Prepare update data with date conversion
          const processedUpdateData = {
            ...updateData,
            property: new mongoose.Types.ObjectId(updateData.property),
            contract: new mongoose.Types.ObjectId(updateData.contract),
            unit: new mongoose.Types.ObjectId(updateData.unit),
            user: new mongoose.Types.ObjectId(user.id),
            memberId: new mongoose.Types.ObjectId(user.memberId),
            endDate: updateData.endDate
              ? new Date(updateData.endDate)
              : undefined,
            personalInfo: {
              ...updateData.personalInfo,
              dateOfBirth: updateData.personalInfo?.dateOfBirth
                ? new Date(updateData.personalInfo.dateOfBirth)
                : undefined,
            },
          };

          const updatedTenant = await tenantService.updateTenant(
            id,
            processedUpdateData
          );

          // Increment tenant operations counter
          tenantOperationsCounter.inc({ operation: "update" });

          // Clear cache
          await clearCache(`property:${existingTenant.property}:tenants`);
          await clearCache(`unit:${existingTenant.unit}:tenant`);
          await clearCache(`tenant:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "tenant.updated", updatedTenant);

          return {
            status: "success",
            data: updatedTenant,
            message: "Tenant updated successfully",
          };
        } catch (error: any) {
          console.error("Error updating tenant:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to update tenant",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: updateTenantSchema,
        detail: {
          tags: ["tenants"],
          summary: "Update tenant",
          description: "Update tenant information",
        },
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const { id } = params;

          // Check if tenant exists
          const existingTenant = await mongoose.model("Tenant").findById(id);
          if (!existingTenant) {
            set.status = 404;
            return {
              status: "error",
              message: "Tenant not found",
            };
          }

          // Check if tenant is active - might want to prevent deletion of active tenants
          if (existingTenant.status === TenantStatus.ACTIVE) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Cannot delete an active tenant. Please deactivate the tenant first.",
            };
          }

          await tenantService.deleteTenant(id);

          // Increment tenant operations counter
          tenantOperationsCounter.inc({ operation: "delete" });

          // Clear cache
          await clearCache(`property:${existingTenant.property}:tenants`);
          await clearCache(`unit:${existingTenant.unit}:tenant`);
          await clearCache(`tenant:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "tenant.deleted", existingTenant);

          return {
            status: "success",
            message: "Tenant deleted successfully",
          };
        } catch (error: any) {
          console.error("Error deleting tenant:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to delete tenant",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["tenants"],
          summary: "Delete tenant",
          description: "Delete a tenant",
        },
      }
    )
    .patch(
      "/:id/verify",
      async ({ params, set }) => {
        try {
          const { id } = params;

          const verifiedTenant = await tenantService.verifyTenant(id);

          // Increment tenant operations counter
          tenantOperationsCounter.inc({ operation: "verify" });

          // Clear cache
          await clearCache(`tenant:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "tenant.verified", verifiedTenant);

          return {
            status: "success",
            data: verifiedTenant,
            message: "Tenant verified successfully",
          };
        } catch (error: any) {
          console.error("Error verifying tenant:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to verify tenant",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["tenants"],
          summary: "Verify tenant",
          description: "Mark tenant as verified",
        },
      }
    )
    // .use(tenantPlugin)
    .patch(
      "/:id/verification",
      async ({ params, body, set }) => {
        try {
          const { id } = params;
          const { verificationData, verificationProgress } = body;

          const updatedTenant = await tenantService.updateTenantVerification(
            id,
            {
              ...(verificationData as any),
              verificationProgress,
            } as any
          );

          // Increment tenant operations counter
          tenantOperationsCounter.inc({ operation: "update_verification" });

          // Clear cache
          await clearCache(`tenant:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(
          // 	user.memberId as string,
          // 	"tenant.verification_updated",
          //	updatedTenant
          // );

          return {
            status: "success",
            data: updatedTenant,
            message: "Tenant verification updated successfully",
          };
        } catch (error: any) {
          console.error("Error updating tenant verification:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to update tenant verification",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: updateVerificationSchema,
        detail: {
          tags: ["tenants"],
          summary: "Update tenant verification",
          description: "Update tenant verification progress",
        },
      }
    )
);
