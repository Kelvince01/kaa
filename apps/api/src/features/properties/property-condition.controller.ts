import { Property, PropertyCondition } from "@kaa/models";
import type { IPropertyCondition } from "@kaa/models/types";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const propertyConditionController = new Elysia({
  detail: {
    tags: ["conditions"],
    summary: "Property conditions",
    description: "Property conditions endpoints",
    security: [{ bearerAuth: [] }],
  },
}).group("/properties/conditions", (app) =>
  app
    .use(authPlugin)
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const {
            propertyId,
            tenantId,
            reportType,
            reportDate,
            items,
            overallCondition,
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

          // Check if user is the landlord of this property
          const isLandlord =
            (property.landlord as mongoose.Types.ObjectId).toString() ===
            user.id;
          const isAgent = property.agent?.toString() === user.id;

          if (!(isLandlord || isAgent)) {
            set.status = 403;
            return {
              status: "error",
              message:
                "Not authorized to create condition reports for this property",
            };
          }

          // Create the property condition report
          const conditionReport = new PropertyCondition({
            property: propertyId,
            tenant: tenantId || null,
            landlord: property.landlord,
            reportType,
            reportDate: reportDate || new Date(),
            items,
            overallCondition,
            notes: notes || "",
            signedByLandlord: isLandlord,
            landlordSignatureDate: isLandlord ? new Date() : undefined,
            createdBy: user.id,
            attachments: attachments || [],
          });

          await conditionReport.save();

          // Populate related fields for the response
          await conditionReport.populate(
            "tenant",
            "firstName lastName email phone"
          );
          await conditionReport.populate(
            "landlord",
            "firstName lastName email phone"
          );
          await conditionReport.populate("property", "title address");
          await conditionReport.populate(
            "createdBy",
            "firstName lastName email"
          );

          set.status = 201;
          return {
            status: "success",
            message: "Property condition report created successfully",
            data: { conditionReport },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create property condition report",
          };
        }
      },
      {
        body: t.Object({
          propertyId: t.String(),
          tenantId: t.String(),
          reportType: t.String(),
          reportDate: t.String(),
          items: t.Array(
            t.Object({
              item: t.String(),
              condition: t.String(),
            })
          ),
          overallCondition: t.String(),
          notes: t.String(),
          attachments: t.Array(t.String()),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Create a new property condition report",
          description: "Create a new property condition report",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .get(
      "/property/:propertyId/reports",
      async ({ params, query, set, user }) => {
        try {
          const { propertyId } = params;
          const { page, limit, reportType } = query;

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
              message:
                "Not authorized to view condition reports for this property",
            };
          }

          // Build query
          const queryFilter: FilterQuery<IPropertyCondition> = {
            property: propertyId,
          };

          // Add report type filter if provided
          if (reportType) {
            queryFilter.reportType = reportType;
          }

          // If user is a tenant, only show reports related to them
          if (isTenant && !isLandlord && !isAgent) {
            queryFilter.tenant = user.id;
          }

          const conditionReports = await PropertyCondition.find(queryFilter)
            .populate("tenant", "firstName lastName email phone")
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title address")
            .populate("createdBy", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

          return {
            status: "success",
            message: "Property condition reports fetched successfully",
            data: { conditionReports },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch property condition reports",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        query: t.Object({
          page: t.Number(),
          limit: t.Number(),
          reportType: t.String(),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Get all property condition reports",
          description: "Get all property condition reports",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .get(
      "/:reportId",
      async ({ params, set, user }) => {
        try {
          const { reportId } = params;

          const conditionReport = await PropertyCondition.findById(reportId)
            .populate("tenant", "firstName lastName email phone")
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title address")
            .populate("createdBy", "firstName lastName email");

          if (!conditionReport) {
            set.status = 404;
            return {
              status: "error",
              message: "Property condition report not found",
            };
          }

          // Find property and ensure user has access
          const property = await Property.findById(conditionReport.property);

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
          const isReportTenant = conditionReport.tenant?.toString() === user.id;

          if (!(isLandlord || isAgent || isTenant || isReportTenant)) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to view this condition report",
            };
          }

          set.status = 200;
          return {
            status: "success",
            message: "Property condition report fetched successfully",
            data: { conditionReport },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch property condition report",
          };
        }
      },
      {
        params: t.Object({
          reportId: t.String(),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Get a property condition report by ID",
          description: "Get a property condition report by ID",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .get(
      "/:reportId/pdf",
      async ({ params, set, user }) => {
        try {
          const { reportId } = params;

          const conditionReport = await PropertyCondition.findById(reportId)
            .populate("tenant", "firstName lastName email phone")
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title address")
            .populate("createdBy", "firstName lastName email");

          if (!conditionReport) {
            set.status = 404;
            return {
              status: "error",
              message: "Property condition report not found",
            };
          }

          // Find property and ensure user has access
          const property = await Property.findById(conditionReport.property);

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
          const isReportTenant = conditionReport.tenant?.toString() === user.id;

          if (!(isLandlord || isAgent || isTenant || isReportTenant)) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to view this condition report",
            };
          }

          // Generate PDF
          // const pdf = await generatePropertyConditionReportPDF(conditionReport);

          /*
            // In a real implementation, you would generate a PDF here using a library like PDFKit or html-pdf
            // For now, we'll just send a mock PDF response

            // Set response headers for PDF download
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="property-condition-report-${reportId}.pdf"`
            );

            // In a real implementation, you would generate and stream the PDF here
            // For this example, we'll just send a placeholder message
            res.send(Buffer.from("This is a placeholder for the actual PDF content"));
            */

          set.status = 200;
          return {
            status: "success",
            message: "Property condition report fetched successfully",
            data: { conditionReport },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch property condition report",
          };
        }
      },
      {
        params: t.Object({
          reportId: t.String(),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Get a property condition report by ID",
          description: "Get a property condition report by ID",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .patch(
      "/:reportId",
      async ({ params, body, set, user }) => {
        try {
          const { reportId } = params;
          const {
            items,
            overallCondition,
            notes,
            signedByTenant,
            signedByLandlord,
            attachments,
          } = body;

          const conditionReport = await PropertyCondition.findById(reportId);

          if (!conditionReport) {
            set.status = 404;
            return {
              status: "error",
              message: "Property condition report not found",
            };
          }

          // Find property and ensure user has access
          const property = await Property.findById(conditionReport.property);

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
          const isReportTenant = conditionReport.tenant?.toString() === user.id;

          if (!(isLandlord || isAgent || isTenant || isReportTenant)) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to update this condition report",
            };
          }

          // Update the condition report
          const updateData: any = {};

          // Landlord or agent can update all fields
          if (isLandlord || isAgent) {
            if (items) updateData.items = items;
            if (overallCondition)
              updateData.overallCondition = overallCondition;
            if (notes !== undefined) updateData.notes = notes;
            if (attachments) updateData.attachments = attachments;
          }

          // Handle signatures
          if (isLandlord && signedByLandlord) {
            updateData.signedByLandlord = true;
            updateData.landlordSignatureDate = new Date();
          }

          if (isTenant && signedByTenant) {
            updateData.signedByTenant = true;
            updateData.tenantSignatureDate = new Date();
          }

          // If no updates were made
          if (Object.keys(updateData).length === 0) {
            set.status = 400;
            return {
              status: "error",
              message: "No valid updates provided",
            };
          }

          const updatedReport = await PropertyCondition.findByIdAndUpdate(
            reportId,
            { $set: updateData },
            { new: true }
          )
            .populate("tenant", "firstName lastName email phone")
            .populate("landlord", "firstName lastName email phone")
            .populate("property", "title address")
            .populate("createdBy", "firstName lastName email");

          return {
            status: "success",
            message: "Property condition report updated successfully",
            data: { conditionReport: updatedReport },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update property condition report",
          };
        }
      },
      {
        params: t.Object({
          reportId: t.String(),
        }),
        body: t.Object({
          items: t.Array(t.String()),
          overallCondition: t.String(),
          notes: t.String(),
          signedByTenant: t.Boolean(),
          signedByLandlord: t.Boolean(),
          attachments: t.Array(t.String()),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Update a property condition report",
          description: "Update a property condition report",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .delete(
      "/:reportId",
      async ({ params, set, user }) => {
        try {
          const { reportId } = params;

          const conditionReport = await PropertyCondition.findById(reportId);

          if (!conditionReport) {
            set.status = 404;
            return {
              status: "error",
              message: "Property condition report not found",
            };
          }

          // Find property and ensure user has access
          const property = await Property.findById(conditionReport.property);

          if (!property) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Verify the user is the landlord for the property
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
              message: "You do not have permission to delete this report",
            };
          }

          // Delete the report
          await PropertyCondition.findByIdAndDelete(reportId);

          return {
            status: "success",
            message: "Property condition report deleted successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete property condition report",
          };
        }
      },
      {
        params: t.Object({
          reportId: t.String(),
        }),
        detail: {
          tags: ["conditions"],
          summary: "Delete a property condition report",
          description: "Delete a property condition report",
          security: [{ bearerAuth: [] }],
        },
      }
    )
);
