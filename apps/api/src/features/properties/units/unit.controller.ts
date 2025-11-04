// import { triggerWebhooks } from "~/features/misc/webhooks/webhooks.service";
import { Property, Tenant, Unit } from "@kaa/models";
import { type IUnit, UnitStatus } from "@kaa/models/types";
import { landlordService } from "@kaa/services";
import { clearCache } from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose, { type FilterQuery } from "mongoose";
import * as prom from "prom-client";
import { optionalTenantPlugin } from "~/features/users/tenants/tenant.plugin";
import {
  assignTenantSchema,
  createUnitSchema,
  updateMeterReadingsSchema,
  updateUnitSchema,
  updateUnitStatusSchema,
} from "./unit.schema";

// Metrics for units
const activeUnitsGauge = new prom.Gauge({
  name: "kaa_active_units",
  help: "Current number of active rental units",
});

const vacantUnitsGauge = new prom.Gauge({
  name: "kaa_vacant_units",
  help: "Current number of vacant rental units",
});

const occupiedUnitsGauge = new prom.Gauge({
  name: "kaa_occupied_units",
  help: "Current number of occupied rental units",
});

const unitOperationsCounter = new prom.Counter({
  name: "kaa_unit_operations",
  help: "Count of unit operations",
  labelNames: ["operation"],
});

export const unitController = new Elysia().group("units", (app) =>
  app
    .get(
      "/",
      async ({ query, set }) => {
        try {
          const page = Number.parseInt(query.page as string, 10) || 1;
          const limit = Number.parseInt(query.limit as string, 10) || 10;
          const skip = (page - 1) * limit;

          const filter: FilterQuery<IUnit> = {};

          // Filter by property
          if (query.property) {
            filter.property = new mongoose.Types.ObjectId(
              query.property as string
            );
          }

          // Filter by status
          if (query.status) {
            filter.status = query.status;
          }

          // Filter by unit type
          if (query.unitType) {
            filter.type = query.unitType;
          }

          // Filter by rent range
          if (query.minRent || query.maxRent) {
            filter.rent = {};
            if (query.minRent) {
              filter.rent.$gte = Number.parseInt(query.minRent as string, 10);
            }
            if (query.maxRent) {
              filter.rent.$lte = Number.parseInt(query.maxRent as string, 10);
            }
          }

          // Filter by bedrooms
          if (query.bedrooms) {
            filter.bedrooms = Number.parseInt(query.bedrooms as string, 10);
          }

          // Filter by bathrooms
          if (query.bathrooms) {
            filter.bathrooms = Number.parseInt(query.bathrooms as string, 10);
          }

          // Filter by availability
          if (query.available === "true") {
            filter.status = UnitStatus.VACANT;
          }

          // Filter by tenant
          if (query.tenant) {
            filter.currentTenant = new mongoose.Types.ObjectId(
              query.tenant as string
            );
          }

          // Only show active units by default
          if (filter.isActive === undefined) {
            filter.isActive = true;
          }

          // Get sort field and order
          const sortField = (query.sortField as string) || "createdAt";
          const sortOrder = (query.sortOrder as string) === "asc" ? 1 : -1;
          const sort: Record<string, number> = { [sortField]: sortOrder };

          // Count total documents for pagination
          const total = await Unit.countDocuments(filter);

          // Get units with pagination
          const units = await Unit.find(filter)
            .sort(sort as any)
            .skip(skip)
            .limit(limit)
            .populate("property", "title location media")
            .populate("currentTenant", "personalInfo")
            .lean();

          // Update metrics
          const activeUnitsCount = await Unit.countDocuments({
            isActive: true,
          });
          const vacantUnitsCount = await Unit.countDocuments({
            status: UnitStatus.VACANT,
            isActive: true,
          });
          const occupiedUnitsCount = await Unit.countDocuments({
            status: UnitStatus.OCCUPIED,
            isActive: true,
          });

          activeUnitsGauge.set(activeUnitsCount);
          vacantUnitsGauge.set(vacantUnitsCount);
          occupiedUnitsGauge.set(occupiedUnitsCount);

          const pages = Math.ceil(total / limit);

          return {
            status: "success",
            items: units,
            pagination: {
              page,
              limit,
              total,
              pages,
            },
            meta: {
              active: activeUnitsCount,
              vacant: vacantUnitsCount,
              occupied: occupiedUnitsCount,
            },
            message: "Units fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch units",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          limit: t.Optional(t.String()),
          sortField: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
          property: t.Optional(t.String()),
          status: t.Optional(t.String()),
          unitType: t.Optional(t.String()),
          minRent: t.Optional(t.String()),
          maxRent: t.Optional(t.String()),
          bedrooms: t.Optional(t.String()),
          bathrooms: t.Optional(t.String()),
          available: t.Optional(t.String()),
          tenant: t.Optional(t.String()),
        }),
        detail: {
          tags: ["units"],
          summary: "Get all units",
          description: "Get all units",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const { id } = params;

          const unit = await Unit.findById(id)
            .populate("property", "title location address")
            .populate("currentTenant", "firstName lastName email phone")
            .lean();

          if (!unit) {
            set.status = 404;
            return {
              status: "error",
              message: "Unit not found",
            };
          }

          return {
            status: "success",
            data: unit,
            message: "Unit fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch unit",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["units"],
          summary: "Get unit by ID",
          description: "Get unit by ID",
        },
      }
    )
    .get(
      "/property/:propertyId",
      async ({ params, query, set }) => {
        try {
          const { propertyId } = params;

          const page = Number.parseInt(query.page as string, 10) || 1;
          const limit = Number.parseInt(query.limit as string, 10) || 10;
          const skip = (page - 1) * limit;

          const filter: FilterQuery<IUnit> = { property: propertyId };

          // Filter by status
          if (query.status) {
            filter.status = query.status;
          }

          // Get sort field and order
          const sortField = (query.sortField as string) || "createdAt";
          const sortOrder = (query.sortOrder as string) === "asc" ? 1 : -1;
          const sort: Record<string, number> = { [sortField]: sortOrder };

          // Count total documents for pagination
          const total = await Unit.countDocuments(filter);

          // Get units with pagination
          const units = await Unit.find(filter)
            .sort(sort as any)
            .skip(skip)
            .limit(limit)
            .populate("property", "title location address")
            .populate("currentTenant", "firstName lastName email phone")
            .lean();

          return {
            status: "success",
            data: {
              items: units,
              pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
              },
            },
            message: "Units fetched successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch units",
          };
        }
      },
      {
        detail: {
          tags: ["units"],
          summary: "Get units by property ID",
          description: "Get units by property ID",
        },
      }
    )
    .group("", (app) =>
      app
        .use(optionalTenantPlugin)
        .post(
          "/",
          async ({ body, set, user }) => {
            try {
              const unitData = body;

              // Verify the property exists and belongs to the user
              const property = await Property.findById(unitData.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              // Check if the user is the landlord of the property
              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message:
                    "You do not have permission to add units to this property",
                };
              }

              // Check if a unit with the same number already exists in this property
              const existingUnit = await Unit.findOne({
                property: unitData.property,
                unitNumber: unitData.unitNumber,
              });

              if (existingUnit) {
                set.status = 400;
                return {
                  status: "error",
                  message:
                    "A unit with this number already exists in this property",
                };
              }

              // Create the unit
              const newUnit = await Unit.create(unitData);

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "create" });

              // Clear cache
              await clearCache(`property:${unitData.property}:units`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.created", newUnit);

              // Notify property owner
              // notifyUser((property.landlord as ObjectId).toString(), {
              // 	title: "New Unit Added",
              // 	message: `Unit ${newUnit.unitNumber} has been added to your property ${property.title}`,
              // 	type: "unit",
              // 	data: { unitId: newUnit._id },
              // });

              set.status = 201;
              return {
                status: "success",
                data: newUnit,
                message: "Unit created successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to create unit",
              };
            }
          },
          {
            body: createUnitSchema,
            detail: {
              tags: ["units"],
              summary: "Create unit",
              description: "Create unit",
            },
          }
        )
        .patch(
          "/:id",
          async ({ params, body, user, set }) => {
            try {
              const { id } = params;
              const updateData = body;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message: "You do not have permission to update this unit",
                };
              }

              if (
                updateData?.unitNumber &&
                updateData.unitNumber !== unit?.unitNumber
              ) {
                const existingUnit = await Unit.findOne({
                  property: unit?.property,
                  unitNumber: updateData.unitNumber,
                  _id: { $ne: id },
                });

                if (existingUnit) {
                  set.status = 400;
                  return {
                    status: "error",
                    message:
                      "A unit with this number already exists in this property",
                  };
                }
              }

              // Update the unit
              const updatedUnit = await Unit.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
              })
                .populate("property", "title location media")
                .populate(
                  "currentTenant",
                  "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
                );

              if (!updatedUnit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "update" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.updated", updatedUnit);

              return {
                status: "success",
                data: updatedUnit,
                message: "Unit updated successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to update unit",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: updateUnitSchema,
            detail: {
              tags: ["units"],
              summary: "Update unit",
              description: "Update unit",
            },
          }
        )
        .delete(
          "/:id",
          async ({ params, user, set }) => {
            try {
              const { id } = params;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message: "You do not have permission to delete this unit",
                };
              }

              if (unit?.status === UnitStatus.OCCUPIED) {
                set.status = 400;
                return {
                  status: "error",
                  message:
                    "Cannot delete an occupied unit. Please vacate the unit first.",
                };
              }

              // Delete the unit
              await Unit.findByIdAndDelete(id);

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "delete" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.deleted", unit);

              return {
                status: "success",
                message: "Unit deleted successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to delete unit",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            detail: {
              tags: ["units"],
              summary: "Delete unit",
              description: "Delete unit",
            },
          }
        )
        .post(
          "/:id/tenant",
          async ({ params, body, user, set }) => {
            try {
              const { id } = params;
              const {
                tenantId,
                leaseStartDate,
                leaseEndDate,
                depositPaid,
                notes,
              } = body;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message:
                    "You do not have permission to assign tenants to this unit",
                };
              }

              if (unit?.status === UnitStatus.OCCUPIED && unit?.currentTenant) {
                set.status = 400;
                return {
                  status: "error",
                  message: "This unit is already occupied",
                };
              }

              const tenantObj = await Tenant.findById(tenantId);

              if (!tenantObj) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Tenant not found",
                };
              }

              // Update the unit with tenant information
              const updatedUnit = await Unit.findByIdAndUpdate(
                id,
                {
                  currentTenant: tenantId,
                  status: UnitStatus.OCCUPIED,
                  leaseStartDate: new Date(leaseStartDate),
                  leaseEndDate: new Date(leaseEndDate),
                  notes: notes || unit?.notes,
                },
                {
                  new: true,
                  runValidators: true,
                }
              )
                .populate("property", "title location media")
                .populate(
                  "currentTenant",
                  "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
                );

              if (!updatedUnit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "assign_tenant" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.tenant_assigned", updatedUnit);

              // Notify tenant
              // notifyUser(tenantId, {
              // 	title: "Unit Assignment",
              // 	message: `You have been assigned to Unit ${unit?.unitNumber} at ${(property as any).title}`,
              // 	type: "unit",
              // 	data: { unitId: unit?._id, propertyId: property?._id },
              // });

              // // Broadcast to property dashboard
              // broadcast({
              // 	type: "unit_updated",
              // 	data: {
              // 		unitId: unit?._id,
              // 		status: UnitStatus.OCCUPIED,
              // 	},
              // });

              return {
                status: "success",
                data: updatedUnit,
                message: "Tenant assigned successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to assign tenant",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: assignTenantSchema,
            detail: {
              tags: ["units"],
              summary: "Assign tenant",
              description: "Assign tenant",
            },
          }
        )
        .delete(
          "/:id/tenant",
          async ({ params, user, set }) => {
            try {
              const { id } = params;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Get the property to check ownership
              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message:
                    "You do not have permission to remove tenants from this unit",
                };
              }

              // Check if the unit has a tenant
              if (
                unit?.status !== UnitStatus.OCCUPIED ||
                !unit?.currentTenant
              ) {
                set.status = 400;
                return {
                  status: "error",
                  message: "This unit does not have a tenant assigned",
                };
              }

              // Store tenant ID for notification
              const tenantId = unit?.currentTenant;

              // Remove tenant from the unit
              const updatedUnit = await Unit.findByIdAndUpdate(
                id,
                {
                  currentTenant: null,
                  status: UnitStatus.VACANT,
                  leaseStartDate: null,
                  leaseEndDate: null,
                },
                {
                  new: true,
                  runValidators: true,
                }
              )
                .populate("property", "title location media")
                .populate(
                  "currentTenant",
                  "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
                );

              if (!updatedUnit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "remove_tenant" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.tenant_removed", updatedUnit);

              // Notify tenant
              // notifyUser(tenantId?.toString() || "", {
              // 	title: "Unit Vacated",
              // 	message: `You have been removed from Unit ${unit?.unitNumber} at ${(property as any).title}`,
              // 	type: "unit",
              // 	data: { unitId: unit?._id, propertyId: property?._id },
              // });

              // // Broadcast to property dashboard
              // broadcast({
              // 	type: "unit_updated",
              // 	data: {
              // 		unitId: unit?._id,
              // 		status: UnitStatus.VACANT,
              // 	},
              // });

              return {
                status: "success",
                data: updatedUnit,
                message: "Tenant removed successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to remove tenant",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            detail: {
              tags: ["units"],
              summary: "Remove tenant",
              description: "Remove tenant",
            },
          }
        )
        .patch(
          "/:id/status",
          async ({ params, body, user, set }) => {
            try {
              const { id } = params;
              const { status, notes } = body;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message:
                    "You do not have permission to update this unit's status",
                };
              }

              if (status === UnitStatus.OCCUPIED && !unit?.currentTenant) {
                set.status = 400;
                return {
                  status: "error",
                  message:
                    "Cannot set status to OCCUPIED without assigning a tenant first",
                };
              }

              if (status === UnitStatus.VACANT && unit?.currentTenant) {
                set.status = 400;
                return {
                  status: "error",
                  message:
                    "Cannot set status to VACANT while a tenant is assigned. Remove the tenant first.",
                };
              }

              // Update the unit status
              const updatedUnit = await Unit.findByIdAndUpdate(
                id,
                {
                  status,
                  notes: notes || unit?.notes,
                },
                {
                  new: true,
                  runValidators: true,
                }
              )
                .populate("property", "title location media")
                .populate(
                  "currentTenant",
                  "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
                );

              if (!updatedUnit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "update_status" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(user.memberId as string, "unit.status_updated", updatedUnit);

              // Broadcast to property dashboard
              // broadcast({
              // 	type: "unit_updated",
              // 	data: {
              // 		unitId: unit?._id,
              // 		status,
              // 	},
              // });

              return {
                status: "success",
                data: updatedUnit,
                message: "Unit status updated successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to update unit status",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: updateUnitStatusSchema,
            detail: {
              tags: ["units"],
              summary: "Update unit status",
              description: "Update unit status",
            },
          }
        )
        .patch(
          "/:id/meter-readings",
          async ({ params, body, user, set }) => {
            try {
              const { id } = params;
              const {
                waterMeterReading,
                electricityMeterReading,
                readingDate,
                notes,
              } = body;

              const unit = await Unit.findById(id);

              if (!unit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              const property = await Property.findById(unit?.property);

              if (!property) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Property not found",
                };
              }

              const landlord = await landlordService.getLandlordBy({
                userId: user.id,
              });

              if (property.landlord.toString() !== landlord?.id) {
                set.status = 403;
                return {
                  status: "error",
                  message:
                    "You do not have permission to update meter readings for this unit",
                };
              }

              const updateData: Record<string, any> = {
                lastMeterReadingDate: new Date(readingDate),
              };

              if (waterMeterReading !== undefined) {
                updateData.waterMeterReading = waterMeterReading;
              }

              if (electricityMeterReading !== undefined) {
                updateData.electricityMeterReading = electricityMeterReading;
              }

              if (notes) {
                updateData.notes = notes;
              }

              const updatedUnit = await Unit.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
              })
                .populate("property", "title location media")
                .populate(
                  "currentTenant",
                  "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
                )
                .lean();

              if (!updatedUnit) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Unit not found",
                };
              }

              // Increment unit operations counter
              unitOperationsCounter.inc({ operation: "update_meter_readings" });

              // Clear cache
              await clearCache(`property:${unit?.property}:units`);
              await clearCache(`unit:${id}`);

              // Trigger webhooks
              // await triggerWebhooks(
              // 	user.memberId as string,
              // 	"unit.meter_readings_updated",
              // 	updatedUnit
              // );

              // Notify tenant if unit is occupied
              // if (updatedUnit?.currentTenant) {
              // 	notifyUser(updatedUnit.currentTenant.toString(), {
              // 		title: "Meter Readings Updated",
              // 		message: `Meter readings for your unit ${updatedUnit.unitNumber} at ${property?.title} have been updated`,
              // 		type: "unit",
              // 		data: { unitId: updatedUnit._id, propertyId: property?._id },
              // 	});
              // }

              return {
                status: "success",
                data: updatedUnit,
                message: "Unit meter readings updated successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to update unit meter readings",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: updateMeterReadingsSchema,
            detail: {
              tags: ["units"],
              summary: "Update unit meter readings",
              description: "Update unit meter readings",
            },
          }
        )
    )
);
