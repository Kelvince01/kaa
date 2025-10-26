import { Maintenance, Property } from "@kaa/models";
import type { IMaintenance, IMaintenanceUpdate } from "@kaa/models/types";
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
  RecurrenceFrequency,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
import {
  optionalTenantPlugin,
  tenantPlugin,
} from "~/features/users/tenants/tenant.plugin";

export const maintenanceController = new Elysia().group("maintenance", (app) =>
  app
    .use(accessPlugin("maintenance", "create"))
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const {
            property,
            title,
            description,
            maintenanceType,
            priority,
            attachments,
            isRecurring,
            recurrencePattern,
            notes,
          } = body;

          // Find property and ensure user has access (either as tenant or landlord)
          const propertyObj = await Property.findById(property);

          if (!propertyObj) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Check if user is a tenant of this property or the landlord
          const isLandlord =
            (propertyObj.landlord as mongoose.Types.ObjectId).toString() ===
            user.id;
          const isTenant = propertyObj.currentTenants?.some(
            (tenant) =>
              (tenant as mongoose.Types.ObjectId).toString() === user.id
          );

          if (!(isLandlord || isTenant)) {
            set.status = 403;
            return {
              status: "error",
              message:
                "Not authorized to create maintenance requests for this property",
            };
          }

          // Create the maintenance request
          const maintenanceRequest = new Maintenance({
            property: propertyObj._id,
            tenant: isTenant
              ? user.id
              : propertyObj.currentTenants?.[0] || null,
            landlord: propertyObj.landlord,
            title,
            description,
            maintenanceType,
            priority: priority || MaintenancePriority.MEDIUM,
            status: MaintenanceStatus.PENDING,
            attachments: attachments || [],
            updates: [
              {
                message: `Maintenance request created by ${isTenant ? "tenant" : "landlord"}`,
                updatedBy: user.id,
                updatedAt: new Date(),
                status: MaintenanceStatus.PENDING,
              },
            ],
            isRecurring,
            recurrencePattern,
            notes,
          });

          await maintenanceRequest.save();

          // Populate related fields for the response
          await maintenanceRequest.populate(
            "tenant",
            "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
          );
          await maintenanceRequest.populate(
            "landlord",
            "firstName lastName email phone"
          );
          await maintenanceRequest.populate("property", "title location");

          return {
            status: "success",
            message: "Maintenance request created successfully",
            data: maintenanceRequest,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create maintenance request",
          };
        }
      },
      {
        body: t.Object({
          property: t.String(),
          title: t.String(),
          description: t.String(),
          maintenanceType: t.Enum(MaintenanceType),
          priority: t.Enum(MaintenancePriority),
          scheduledDate: t.Optional(t.Date()),
          isRecurring: t.Boolean(),
          recurrencePattern: t.Partial(
            t.Object({
              frequency: t.Enum(RecurrenceFrequency),
              interval: t.Number(),
              nextDate: t.Date(),
            })
          ),
          notes: t.Optional(t.String()),
          attachments: t.Optional(
            t.Array(
              t.Object({
                url: t.String(),
                fileName: t.String(),
                fileType: t.String(),
                size: t.Number(),
              })
            )
          ),
        }),
        detail: {
          tags: ["maintenance"],
          summary: "Create a maintenance request",
        },
      }
    )
    .use(accessPlugin("maintenance", "update"))
    .use(optionalTenantPlugin)
    .post(
      "/:requestId/updates",
      async ({ params, body, set, user }) => {
        try {
          const { requestId } = params;
          const { message, status, attachments } = body;

          const maintenanceRequest = await Maintenance.findById(requestId);

          if (!maintenanceRequest) {
            set.status = 404;
            return {
              status: "error",
              message: "Maintenance request not found",
            };
          }

          const update: IMaintenanceUpdate | any = {
            message,
            updatedBy: new mongoose.Types.ObjectId(user.id),
            updatedAt: new Date(),
            status: status || MaintenanceStatus.PENDING,
            attachments: attachments || [],
          };

          maintenanceRequest.updates.push(update);

          await maintenanceRequest.save();

          return {
            status: "success",
            message: "Maintenance update added successfully",
            data: maintenanceRequest,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add maintenance update",
          };
        }
      },
      {
        params: t.Object({
          requestId: t.String(),
        }),
        body: t.Object({
          message: t.String(),
          status: t.Optional(t.Enum(MaintenanceStatus)),
          attachments: t.Optional(
            t.Array(
              t.Object({
                url: t.String(),
                fileName: t.String(),
                fileType: t.String(),
                size: t.Number(),
              })
            )
          ),
        }),
        detail: {
          tags: ["maintenance"],
          summary: "Add a maintenance update",
        },
      }
    )
    .use(accessPlugin("maintenance", "read"))
    .use(optionalTenantPlugin)
    .get(
      "/property/:propertyId",
      async ({ params, query, set }) => {
        try {
          const { propertyId } = params;

          const property = await Property.findById(propertyId);

          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Parse query parameters for filtering
          const {
            status,
            priority,
            type,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Build filter
          const filter: FilterQuery<IMaintenance> = { property: propertyId };

          if (status) {
            filter.status = status;
          }

          if (priority) {
            filter.priority = priority;
          }

          if (type) {
            filter.maintenanceType = type;
          }

          // Build sort object
          const sort: Record<string, 1 | -1> = {};
          sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

          const maintenanceRequests = await Maintenance.find(filter)
            .sort(sort)
            .populate("tenant", "firstName lastName email phone")
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title address")
            .populate("updates.updatedBy", "firstName lastName");

          return {
            status: "success",
            message: "Maintenance requests fetched successfully",
            data: maintenanceRequests,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get maintenance requests",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        query: t.Object({
          status: t.String(),
          priority: t.String(),
          type: t.String(),
          sortBy: t.String(),
          sortOrder: t.String(),
        }),
        detail: {
          tags: ["maintenance"],
          summary: "Get maintenance requests for a property",
        },
      }
    )
    .use(accessPlugin("maintenance", "read"))
    .use(optionalTenantPlugin)
    .get(
      "/user",
      async ({ query, set, user, tenant, role }) => {
        try {
          // Parse query parameters
          const {
            status,
            priority,
            sortBy = "createdAt",
            sortOrder = "desc",
          } = query;

          // Determine if user is landlord or tenant
          const isLandlord = role.name === "landlord";

          // Build filter
          const filter: FilterQuery<IMaintenance> = {};

          if (isLandlord) {
            filter.landlord = user.id;
          } else {
            filter.tenant = tenant?.id;
          }

          if (status) {
            filter.status = status;
          }

          if (priority) {
            filter.priority = priority;
          }

          // Build sort object
          const sort: Record<string, 1 | -1> = {};
          sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

          const maintenanceRequests = await Maintenance.find(filter)
            .sort(sort)
            .populate(
              "tenant",
              "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
            )
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title location")
            .populate("updates.updatedBy", "firstName lastName");

          return {
            status: "success",
            message: "Maintenance requests fetched successfully",
            data: maintenanceRequests,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get maintenance requests",
          };
        }
      },
      {
        detail: {
          tags: ["maintenance"],
          summary: "Get maintenance requests for a user",
        },
      }
    )
    .use(accessPlugin("maintenance", "read"))
    .use(optionalTenantPlugin)
    .get(
      "/:requestId",
      async ({ params, set, user, tenant }) => {
        try {
          const { requestId } = params;

          // Find the maintenance request with populated fields
          const maintenanceRequest = await Maintenance.findById(requestId)
            .populate(
              "tenant",
              "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
            )
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title location")
            .populate("updates.updatedBy", "firstName lastName")
            .lean();

          if (!maintenanceRequest) {
            set.status = 404;
            return {
              status: "error",
              message: "Maintenance request not found",
            };
          }

          // Ensure user has access (tenant or landlord)
          const isTenant =
            maintenanceRequest?.tenant?._id.toString() === tenant?.id;
          const isLandlord =
            maintenanceRequest?.landlord?._id.toString() === user.id;

          if (!(isTenant || isLandlord)) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to view this maintenance request",
            };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Maintenance request fetched successfully",
            data: maintenanceRequest,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get maintenance request",
          };
        }
      },
      {
        params: t.Object({
          requestId: t.String(),
        }),
        detail: {
          tags: ["maintenance"],
          summary: "Get a maintenance request",
        },
      }
    )
    .use(accessPlugin("maintenance", "update"))
    .use(optionalTenantPlugin)
    .patch(
      "/:requestId",
      async ({ params, body, set, user, role, tenant }) => {
        try {
          const { requestId } = params;
          const {
            status,
            priority,
            scheduledDate,
            assignedContractor,
            cost,
            paidBy,
            updateMessage,
            attachments,
          } = body;

          // Find the maintenance request
          const maintenanceRequest = await Maintenance.findById(requestId);

          if (!maintenanceRequest) {
            set.status = 404;
            return {
              status: "error",
              message: "Maintenance request not found",
            };
          }

          // Ensure user has access
          const isTenant = maintenanceRequest.tenant.toString() === tenant?.id;
          const isLandlord = maintenanceRequest.landlord.toString() === user.id;

          if (!(isTenant || isLandlord) && role.name !== "admin") {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to update this maintenance request",
            };
          }

          // Some fields can only be updated by the landlord or admin
          if (
            (status || assignedContractor || cost || paidBy) &&
            !isLandlord &&
            role.name !== "admin"
          ) {
            set.status = 403;
            return {
              status: "error",
              message:
                "Only landlords can update status, contractor, or cost details",
            };
          }

          // Update fields
          if (status) {
            maintenanceRequest.status = status;

            // Update status timestamp and reset notification flag
            maintenanceRequest.statusUpdatedAt = new Date();
            maintenanceRequest.notificationSent = false;

            // Set completed date if status is completed
            if (status === MaintenanceStatus.COMPLETED) {
              maintenanceRequest.completedDate = new Date();
            }
          }

          if (priority && (isLandlord || role.name === "admin")) {
            maintenanceRequest.priority = priority;
          }

          if (scheduledDate && (isLandlord || role.name === "admin")) {
            maintenanceRequest.scheduledDate = new Date(scheduledDate);
          }

          if (assignedContractor && (isLandlord || role.name === "admin")) {
            maintenanceRequest.assignedContractor = assignedContractor;
          }

          if (cost !== undefined && (isLandlord || role.name === "admin")) {
            maintenanceRequest.cost = cost;
          }

          if (paidBy && (isLandlord || role.name === "admin")) {
            maintenanceRequest.paidBy = paidBy;
          }

          // Add update to history
          const update: IMaintenanceUpdate | any = {
            message: updateMessage || "",
            updatedBy: new mongoose.Types.ObjectId(user.id),
            updatedAt: new Date(),
            status: status || MaintenanceStatus.PENDING,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            attachments: attachments || [],
          };

          if (updateMessage) {
            maintenanceRequest.updates.push(update);
          }

          await maintenanceRequest.save();

          // Populate for response
          await maintenanceRequest.populate(
            "tenant",
            "personalInfo.firstName personalInfo.lastName personalInfo.email personalInfo.phone"
          );
          await maintenanceRequest.populate(
            "landlord",
            "firstName lastName email phone"
          );
          await maintenanceRequest.populate("property", "title location");
          await maintenanceRequest.populate(
            "updates.updatedBy",
            "firstName lastName"
          );

          return {
            status: "success",
            message: "Maintenance request updated successfully",
            data: maintenanceRequest,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update maintenance request",
          };
        }
      },
      {
        params: t.Object({
          requestId: t.String(),
        }),
        body: t.Object({
          status: t.Optional(t.Enum(MaintenanceStatus)),
          priority: t.Optional(t.Enum(MaintenancePriority)),
          scheduledDate: t.Optional(t.Date()),
          assignedContractor: t.Optional(
            t.Object({
              name: t.String(),
              phone: t.String(),
              email: t.String(),
              company: t.String(),
            })
          ),
          cost: t.Optional(t.Number()),
          paidBy: t.Optional(
            t.Enum({
              LANDLORD: "landlord",
              TENANT: "tenant",
            })
          ),
          updateMessage: t.Optional(t.String()),
          attachments: t.Optional(
            t.Array(
              t.Object({
                url: t.String(),
                fileName: t.String(),
                fileType: t.String(),
                size: t.Number(),
              })
            )
          ),
        }),
        detail: {
          tags: ["maintenance"],
          summary: "Update a maintenance request",
        },
      }
    )
    .group("/", (app) =>
      app
        .use(accessPlugin("maintenance", "delete"))
        .use(tenantPlugin)
        .delete(
          "/:requestId",
          async ({ params, set }) => {
            try {
              const { requestId } = params;

              const maintenanceRequest = await Maintenance.findById(requestId);

              if (!maintenanceRequest) {
                set.status = 404;
                return {
                  status: "error",
                  message: "Maintenance request not found",
                };
              }

              await maintenanceRequest.deleteOne();

              return {
                status: "success",
                data: null,
                message: "Maintenance request deleted successfully",
              };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message: "Failed to delete maintenance request",
              };
            }
          },
          {
            params: t.Object({
              requestId: t.String(),
            }),
            detail: {
              tags: ["maintenance"],
              summary: "Delete a maintenance request",
            },
          }
        )
    )
);
