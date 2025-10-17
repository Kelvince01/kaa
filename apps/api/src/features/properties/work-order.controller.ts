import { Contractor, WorkOrder } from "@kaa/models";
import {
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderType,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const workOrderController = new Elysia().group("work-orders", (app) =>
  app
    .use(accessPlugin("work_order", "create"))
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const workOrder = new WorkOrder({
            ...body,
            createdBy: user.id,
          });

          await workOrder.save();

          // Populate related fields
          await workOrder.populate([
            { path: "property", select: "title address" },
            { path: "assignedContractor", select: "name company email phone" },
            { path: "createdBy", select: "firstName lastName" },
          ]);

          return {
            status: "success",
            message: "Work order created successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create work order",
          };
        }
      },
      {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          type: t.Enum(WorkOrderType),
          priority: t.Optional(t.Enum(WorkOrderPriority)),
          property: t.String(),
          unit: t.Optional(t.String()),
          maintenanceRequest: t.Optional(t.String()),
          assignedContractor: t.Optional(t.String()),
          scheduledDate: t.Optional(t.String()),
          estimatedDuration: t.Optional(t.Number()),
          estimatedCost: t.Optional(t.Number()),
          qualityCheckRequired: t.Optional(t.Boolean()),
          tags: t.Optional(t.Array(t.String())),
          notes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Create a new work order",
        },
      }
    )
    .use(accessPlugin("work_order", "read"))
    .get(
      "/",
      async ({ query }) => {
        try {
          const {
            status,
            priority,
            type,
            property,
            contractor,
            overdue,
            sortBy = "createdAt",
            sortOrder = "desc",
            page = 1,
            limit = 20,
          } = query;

          // Build filter
          const filter: any = {};

          if (status) filter.status = status;
          if (priority) filter.priority = priority;
          if (type) filter.type = type;
          if (property) filter.property = property;
          if (contractor) filter.assignedContractor = contractor;

          if (overdue === "true") {
            filter.scheduledDate = { $lt: new Date() };
            filter.status = {
              $in: [WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS],
            };
          }

          // Build sort
          const sort: any = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Calculate pagination
          const skip = (Number(page) - 1) * Number(limit);

          const [workOrders, total] = await Promise.all([
            WorkOrder.find(filter)
              .sort(sort)
              .skip(skip)
              .limit(Number(limit))
              .populate("property", "title address")
              .populate("assignedContractor", "name company email phone")
              .populate("createdBy", "firstName lastName"),
            WorkOrder.countDocuments(filter),
          ]);

          return {
            status: "success",
            message: "Work orders fetched successfully",
            data: {
              workOrders,
              pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
              },
            },
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch work orders",
          };
        }
      },
      {
        query: t.Object({
          status: t.Optional(t.Enum(WorkOrderStatus)),
          priority: t.Optional(t.Enum(WorkOrderPriority)),
          type: t.Optional(t.Enum(WorkOrderType)),
          property: t.Optional(t.String()),
          contractor: t.Optional(t.String()),
          overdue: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Get work orders with filtering and pagination",
        },
      }
    )
    .get(
      "/statistics",
      async ({ query }) => {
        try {
          const { startDate, endDate } = query;

          const start = startDate ? new Date(startDate) : undefined;
          const end = endDate ? new Date(endDate) : undefined;

          const matchStage: any = {};

          if (start && end) {
            matchStage.createdAt = { $gte: start, $lte: end };
          }

          const stats = await WorkOrder.aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: null,
                totalWorkOrders: { $sum: 1 },
                draftWorkOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
                },
                scheduledWorkOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
                },
                inProgressWorkOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
                },
                completedWorkOrders: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                emergencyWorkOrders: {
                  $sum: { $cond: [{ $eq: ["$priority", "emergency"] }, 1, 0] },
                },
                totalCost: { $sum: "$totalCost" },
                avgCost: { $avg: "$totalCost" },
                avgDuration: {
                  $avg: {
                    $cond: [
                      { $and: ["$actualStartDate", "$actualEndDate"] },
                      { $subtract: ["$actualEndDate", "$actualStartDate"] },
                      null,
                    ],
                  },
                },
              },
            },
          ]);

          return {
            status: "success",
            message: "Work order statistics fetched successfully",
            data: stats,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch work order statistics",
          };
        }
      },
      {
        query: t.Object({
          startDate: t.Optional(t.String()),
          endDate: t.Optional(t.String()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Get work order statistics",
        },
      }
    )
    .get(
      "/overdue",
      async () => {
        try {
          const now = new Date();

          const overdueWorkOrders = await WorkOrder.find({
            scheduledDate: { $lt: now },
            status: {
              $in: [WorkOrderStatus.SCHEDULED, WorkOrderStatus.IN_PROGRESS],
            },
          })
            .sort({ scheduledDate: 1 })
            .populate("property", "title address")
            .populate("assignedContractor", "name company email phone")
            .populate("createdBy", "firstName lastName");

          return {
            status: "success",
            message: "Overdue work orders fetched successfully",
            data: overdueWorkOrders,
          };
        } catch (error) {
          return {
            status: "error",
            message: "Failed to fetch overdue work orders",
          };
        }
      },
      {
        detail: {
          tags: ["work-orders"],
          summary: "Get overdue work orders",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const workOrder = await WorkOrder.findById(params.id)
            .populate("property", "title address")
            .populate("unit", "unitNumber type")
            .populate("maintenanceRequest")
            .populate("assignedContractor")
            .populate("createdBy", "firstName lastName")
            .populate("timeEntries.contractor", "name company")
            .populate("updates.updatedBy", "firstName lastName")
            .populate("qualityCheckBy", "firstName lastName");

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          return {
            status: "success",
            message: "Work order fetched successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch work order",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Get work order by ID",
        },
      }
    )
    .use(accessPlugin("work_order", "update"))
    .put(
      "/:id",
      async ({ params, body, set, user }) => {
        try {
          const workOrder = await WorkOrder.findById(params.id);

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          // Update fields
          Object.assign(workOrder, body);

          // Add update to history if message provided
          if (body.updateMessage) {
            workOrder.updates.push({
              message: body.updateMessage,
              updatedBy: new mongoose.Types.ObjectId(user.id),
              status: body.status,
            } as any);
          }

          await workOrder.save();

          // Populate for response
          await workOrder.populate([
            { path: "property", select: "title address" },
            { path: "assignedContractor", select: "name company email phone" },
            { path: "createdBy", select: "firstName lastName" },
          ]);

          return {
            status: "success",
            message: "Work order updated successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update work order",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
          status: t.Optional(t.Enum(WorkOrderStatus)),
          priority: t.Optional(t.Enum(WorkOrderPriority)),
          assignedContractor: t.Optional(t.String()),
          scheduledDate: t.Optional(t.String()),
          estimatedDuration: t.Optional(t.Number()),
          estimatedCost: t.Optional(t.Number()),
          completionNotes: t.Optional(t.String()),
          qualityCheckRequired: t.Optional(t.Boolean()),
          tags: t.Optional(t.Array(t.String())),
          notes: t.Optional(t.String()),
          updateMessage: t.Optional(t.String()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Update work order",
        },
      }
    )
    .post(
      "/:id/assign",
      async ({ params, body, set, user }) => {
        try {
          const workOrder = await WorkOrder.findById(params.id);

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          // Verify contractor exists
          const contractor = await Contractor.findById(body.contractorId);
          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          workOrder.assignedContractor = new mongoose.Types.ObjectId(
            body.contractorId
          );
          workOrder.status = WorkOrderStatus.SCHEDULED;

          // Add assignment update
          workOrder.updates.push({
            message: `Work order assigned to ${contractor.name}`,
            updatedBy: new mongoose.Types.ObjectId(user.id),
            status: WorkOrderStatus.SCHEDULED,
          } as any);

          await workOrder.save();

          return {
            status: "success",
            message: "Work order assigned successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to assign work order",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          contractorId: t.String(),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Assign work order to contractor",
        },
      }
    )
    .post(
      "/:id/time-entry",
      async ({ params, body, set }) => {
        try {
          const workOrder = await WorkOrder.findById(params.id);

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          workOrder.timeEntries.push(body as any);
          await workOrder.save();

          return {
            status: "success",
            message: "Time entry added successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add time entry",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          startTime: t.String(),
          endTime: t.Optional(t.String()),
          description: t.String(),
          contractor: t.String(),
          hourlyRate: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Add time entry to work order",
        },
      }
    )
    .post(
      "/:id/material",
      async ({ params, body, set }) => {
        try {
          const workOrder = await WorkOrder.findById(params.id);

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          workOrder.materials.push(body as any);
          await workOrder.save();

          return {
            status: "success",
            message: "Material added successfully",
            data: workOrder,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add material",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.String(),
          description: t.Optional(t.String()),
          quantity: t.Number(),
          unitCost: t.Number(),
          totalCost: t.Number(),
          supplier: t.Optional(t.String()),
          partNumber: t.Optional(t.String()),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Add material to work order",
        },
      }
    )
    .use(accessPlugin("work_order", "delete"))
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const workOrder = await WorkOrder.findByIdAndDelete(params.id);

          if (!workOrder) {
            set.status = 404;
            return {
              status: "error",
              message: "Work order not found",
            };
          }

          return {
            status: "success",
            message: "Work order deleted successfully",
            data: null,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete work order",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["work-orders"],
          summary: "Delete work order",
        },
      }
    )
);
