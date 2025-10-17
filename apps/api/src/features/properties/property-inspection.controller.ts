import { Property, PropertyInspection } from "@kaa/models";
import { InspectionStatus, type IPropertyInspection } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type { FilterQuery } from "mongoose";
import mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const propertyInspectionController = new Elysia().group(
  "/inspections",
  (app) =>
    app
      .use(authPlugin)
      .post(
        "/",
        async ({ body, set, user }) => {
          try {
            const {
              propertyId,
              scheduledDate,
              inspectorId,
              tenantId,
              type,
              notes,
              attachments,
            } = body;

            // Find property and ensure user has access (either as landlord or agent)
            const property = await Property.findById(propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord or agent of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;

            if (!(isLandlord || isAgent)) {
              set.status = 403;
              return {
                status: "error",
                message:
                  "Not authorized to schedule inspections for this property",
              };
            }

            // Create the property inspection
            const inspection = new PropertyInspection({
              property: propertyId,
              scheduledDate: new Date(scheduledDate),
              inspector: inspectorId || user.id, // Default to the current user if no inspector specified
              tenant: tenantId,
              type,
              status: InspectionStatus.SCHEDULED,
              notes: notes || "",
              followUpRequired: false,
              createdBy: user.id,
              notificationSent: false,
              tenantConfirmed: false,
              attachments: attachments || [],
            });

            await inspection.save();

            // Populate related fields for the response
            await inspection.populate(
              "tenant",
              "firstName lastName email phone"
            );
            await inspection.populate(
              "inspector",
              "firstName lastName email phone"
            );
            await inspection.populate("property", "title address");
            await inspection.populate("createdBy", "firstName lastName email");

            set.status = 201;
            return {
              status: "success",
              message: "Property inspection created successfully",
              data: {
                inspection,
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to create property inspection",
            };
          }
        },
        {
          body: t.Object({
            propertyId: t.String(),
            scheduledDate: t.String(),
            inspectorId: t.String(),
            tenantId: t.String(),
            type: t.String(),
            notes: t.String(),
            attachments: t.Array(t.String()),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Create a new property inspection",
            description: "Create a new property inspection",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/:propertyId",
        async ({ params, query, set, user }) => {
          try {
            const { propertyId } = params;
            const { status, type } = query;

            // Find property and ensure user has access
            const property = await Property.findById(propertyId);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, or tenant of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );

            if (!(isLandlord || isAgent || isTenant)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view inspections for this property",
              };
            }

            // Build query
            const queryFilter: FilterQuery<IPropertyInspection> = {
              property: propertyId,
            };

            // Add status filter if provided
            if (status) {
              queryFilter.status = status;
            }

            // Add type filter if provided
            if (type) {
              queryFilter.type = type;
            }

            // If user is a tenant, only show inspections related to them
            if (isTenant && !isLandlord && !isAgent) {
              queryFilter.tenant = user.id;
            }

            const inspections = await PropertyInspection.find(queryFilter)
              .populate("tenant", "firstName lastName email phone")
              .populate("inspector", "firstName lastName email phone")
              .populate("property", "title address")
              .populate("createdBy", "firstName lastName email")
              .sort({ scheduledDate: -1 });

            set.status = 200;
            return {
              status: "success",
              message: "Property inspections retrieved successfully",
              data: { inspections },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve property inspections",
            };
          }
        },
        {
          query: t.Object({
            status: t.String(),
            type: t.String(),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Get property inspections for a property",
            description: "Get property inspections for a property",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/property/:inspectionId",
        async ({ params, set, user }) => {
          try {
            const { inspectionId } = params;

            const inspection = await PropertyInspection.findById(inspectionId)
              .populate("tenant", "firstName lastName email phone")
              .populate("inspector", "firstName lastName email phone")
              .populate("property", "title address")
              .populate("createdBy", "firstName lastName email");

            if (!inspection) {
              set.status = 404;
              return {
                status: "error",
                message: "Property inspection not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(inspection.property);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, tenant, or inspector of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );
            const isInspector = inspection.inspector.toString() === user.id;

            if (!(isLandlord || isAgent || isTenant || isInspector)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to view this inspection",
              };
            }

            set.status = 200;
            return {
              status: "success",
              message: "Property inspection retrieved successfully",
              data: { inspection },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve property inspection",
            };
          }
        },
        {
          params: t.Object({
            inspectionId: t.String(),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Get property inspection by ID",
            description: "Get property inspection by ID",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .patch(
        "/:inspectionId",
        async ({ params, body, set, user }) => {
          try {
            const { inspectionId } = params;
            const {
              scheduledDate,
              actualDate,
              inspectorId,
              status,
              notes,
              findings,
              recommendations,
              followUpRequired,
              followUpDate,
              attachments,
              conditionReportId,
            } = body;

            const inspection = await PropertyInspection.findById(inspectionId);

            if (!inspection) {
              set.status = 404;
              return {
                status: "error",
                message: "Property inspection not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(inspection.property);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, tenant, or inspector of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );
            const isInspector = inspection.inspector.toString() === user.id;

            if (!(isLandlord || isAgent || isTenant || isInspector)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to update this inspection",
              };
            }

            // Update fields
            const updateData: Record<string, any> = {
              updatedBy: user.id,
            };

            if (scheduledDate)
              updateData.scheduledDate = new Date(scheduledDate);
            if (actualDate) updateData.actualDate = new Date(actualDate);
            if (inspectorId) updateData.inspector = inspectorId;
            if (status) updateData.status = status;
            if (notes !== undefined) updateData.notes = notes;
            if (findings !== undefined) updateData.findings = findings;
            if (recommendations !== undefined)
              updateData.recommendations = recommendations;
            if (followUpRequired !== undefined)
              updateData.followUpRequired = followUpRequired;
            if (followUpDate) updateData.followUpDate = new Date(followUpDate);
            if (attachments) updateData.attachments = attachments;
            if (conditionReportId)
              updateData.conditionReportId = conditionReportId;

            // If no updates were made
            if (Object.keys(updateData).length === 1) {
              // Only updatedBy
              set.status = 400;
              return {
                status: "error",
                message: "No valid updates provided",
              };
            }

            const updatedInspection =
              await PropertyInspection.findByIdAndUpdate(
                inspectionId,
                { $set: updateData },
                { new: true }
              )
                .populate("tenant", "firstName lastName email phone")
                .populate("inspector", "firstName lastName email phone")
                .populate("property", "title address")
                .populate("createdBy", "firstName lastName email")
                .populate("updatedBy", "firstName lastName email");

            set.status = 200;
            return {
              status: "success",
              message: "Property inspection updated successfully",
              data: { inspection: updatedInspection },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to update property inspection",
            };
          }
        },
        {
          params: t.Object({
            inspectionId: t.String(),
          }),
          body: t.Object({
            scheduledDate: t.String(),
            actualDate: t.String(),
            inspectorId: t.String(),
            status: t.String(),
            notes: t.String(),
            findings: t.String(),
            recommendations: t.String(),
            followUpRequired: t.Boolean(),
            followUpDate: t.String(),
            attachments: t.Array(t.String()),
            conditionReportId: t.String(),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Update property inspection",
            description: "Update property inspection",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .delete(
        "/:inspectionId",
        async ({ params, set, user }) => {
          try {
            const { inspectionId } = params;

            const inspection = await PropertyInspection.findById(inspectionId);

            if (!inspection) {
              set.status = 404;
              return {
                status: "error",
                message: "Property inspection not found",
              };
            }

            // Find property and ensure user has access
            const property = await Property.findById(inspection.property);

            if (!property) {
              set.status = 404;
              return {
                status: "error",
                message: "Property not found",
              };
            }

            // Check if user is the landlord, agent, tenant, or inspector of this property
            const isLandlord =
              (property.landlord as mongoose.Types.ObjectId).toString() ===
              user.id;
            const isAgent = property.agent?.toString() === user.id;
            const isTenant = property.currentTenants?.some(
              (tenant: any) => tenant.toString() === user.id
            );
            const isInspector = inspection.inspector.toString() === user.id;

            if (!(isLandlord || isAgent || isTenant || isInspector)) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to delete this inspection",
              };
            }

            // Delete the inspection
            await PropertyInspection.findByIdAndDelete(inspectionId);

            return {
              status: "success",
              message: "Property inspection deleted successfully",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to delete property inspection",
            };
          }
        },
        {
          params: t.Object({
            inspectionId: t.String(),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Delete property inspection",
            description: "Delete property inspection",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .post(
        "/:inspectionId/confirm",
        async ({ params, set, user }) => {
          try {
            const { inspectionId } = params;

            const inspection = await PropertyInspection.findById(inspectionId);

            if (!inspection) {
              set.status = 404;
              return {
                status: "error",
                message: "Property inspection not found",
              };
            }

            // Check if user is the tenant for this inspection
            const isTenant =
              (inspection.tenant as mongoose.Types.ObjectId).toString() ===
              user.id;

            if (!isTenant) {
              set.status = 403;
              return {
                status: "error",
                message: "Not authorized to confirm this inspection",
              };
            }

            // Update the inspection status
            inspection.tenantConfirmed = true;
            inspection.updatedBy = new mongoose.Types.ObjectId(user.id);
            await inspection.save();

            return {
              status: "success",
              inspection,
              message: "Property inspection confirmed successfully",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to confirm property inspection",
            };
          }
        },
        {
          detail: {
            params: t.Object({
              inspectionId: t.String(),
            }),
            tags: ["inspections"],
            summary: "Confirm property inspection",
            description: "Confirm property inspection",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/upcoming",
        async ({ query, set, user }) => {
          try {
            const { page, limit, role } = query;

            const queryFilter: FilterQuery<IPropertyInspection> = {
              scheduledDate: { $gte: new Date() },
              status: InspectionStatus.SCHEDULED,
            };

            if (role === "tenant") {
              queryFilter.tenant = user.id;
            } else if (role === "inspector") {
              queryFilter.inspector = user.id;
            } else {
              // For landlords/agents, find properties they own/manage
              const properties = await Property.find({
                $or: [{ landlord: user.id }, { agent: user.id }],
              }).select("_id");

              if (properties.length === 0) {
                set.status = 404;
                return {
                  status: "error",
                  data: { inspections: [] },
                  message: "No upcoming inspections found",
                };
              }

              queryFilter.property = { $in: properties.map((p) => p._id) };
            }

            const inspections = await PropertyInspection.find(queryFilter)
              .populate("tenant", "firstName lastName email phone")
              .populate("inspector", "firstName lastName email phone")
              .populate("property", "title address")
              .populate("createdBy", "firstName lastName email")
              .sort({ scheduledDate: -1 })
              .skip((page - 1) * limit)
              .limit(limit);

            set.status = 200;
            return {
              status: "success",
              message: "Upcoming property inspections retrieved successfully",
              data: { inspections },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to retrieve upcoming property inspections",
            };
          }
        },
        {
          query: t.Object({
            page: t.Number(),
            limit: t.Number(),
            role: t.String(),
          }),
          detail: {
            tags: ["inspections"],
            summary: "Get upcoming property inspections",
            description: "Get upcoming property inspections",
            security: [{ bearerAuth: [] }],
          },
        }
      )
);
