import {
  Application,
  Document,
  Notification,
  Property,
  Tenant,
  User,
} from "@kaa/models";
import {
  ApplicationStatus,
  type IApplication,
  NotificationCategory,
  TimelineEventStatus,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import mongoose, { type FilterQuery } from "mongoose";
import { accessPlugin } from "~/features/rbac/rbac.plugin";
import { tenantPlugin } from "~/features/users/tenants/tenant.plugin";

export const applicationController = new Elysia().group("applications", (app) =>
  app
    .use(tenantPlugin)
    /**
     * Create a new application
     */
    .post(
      "/",
      async ({ set, body, tenant }) => {
        try {
          const { property, moveInDate, offerAmount, notes, documents } = body;

          // Check if property exists
          const propertyExists = await Property.findById(property);
          if (!propertyExists) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          // Check if user already has an active application for this property
          const existingApplication = await Application.findOne({
            property,
            tenant: tenant.id,
            status: {
              $nin: [ApplicationStatus.WITHDRAWN, ApplicationStatus.REJECTED],
            },
          });

          if (existingApplication) {
            set.status = 400;
            return {
              status: "error",
              message:
                "You already have an active application for this property",
            };
          }

          // Create new application
          const application = new Application({
            property,
            tenant: tenant.id,
            moveInDate: new Date(moveInDate),
            offerAmount,
            notes,
            landlord: propertyExists.landlord,
            documents: documents || [],
            status: ApplicationStatus.DRAFT,
            appliedAt: new Date(),
            timeline: [
              {
                title: "Application Started",
                description:
                  "Application has been created and is in draft status",
                date: new Date(),
                status: TimelineEventStatus.COMPLETED,
                actor: tenant.id,
              },
            ],
          });

          await application.save();

          // Return the new application
          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to create application",
          };
        }
      },
      {
        body: t.Object({
          property: t.String(),
          moveInDate: t.String(),
          offerAmount: t.Number(),
          notes: t.String(),
          documents: t.Array(t.String()),
        }),
        detail: {
          tags: ["applications"],
          summary: "Create an application",
          description: "Create an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )

    /**
     * Submit an application (change from draft to submitted)
     */
    .post(
      "/:id/submit",
      async ({ params, set, user, tenant }) => {
        try {
          const { id } = params;

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check if user is the tenant who created the application
          if (application.tenant.toString() !== tenant.id) {
            set.status = 403;
            return {
              status: "error",
              message: "You do not have permission to submit this application",
            };
          }

          // Check if application is in draft status
          if (application.status !== ApplicationStatus.DRAFT) {
            set.status = 400;
            return {
              status: "error",
              message: "Only draft applications can be submitted",
            };
          }

          // Update application status and add timeline event
          application.status = ApplicationStatus.SUBMITTED;
          application.timeline.push({
            title: "Application Submitted",
            description: "Your application has been submitted for review",
            date: new Date(),
            status: TimelineEventStatus.COMPLETED,
            actor: new mongoose.Types.ObjectId(user.id),
          });

          await application.save();

          // Notify landlord
          const property = await Property.findById(
            application.property
          ).populate("landlord");

          if (property?.landlord) {
            const landlordId = (property.landlord as mongoose.Types.ObjectId)
              ._id;
            const tenant = await User.findById(user.id);

            await Notification.create({
              user: landlordId,
              title: "New Application Received",
              message: `${tenant?.profile.firstName} ${tenant?.profile.lastName} has applied for your property: ${property.title}`,
              type: NotificationCategory.APPLICATION,
              data: {
                applicationId: application._id,
                propertyId: property._id,
              },
              createdAt: new Date(),
            });
          }

          // Return updated application
          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
              { path: "documents" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to submit application",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["applications"],
          summary: "Submit an application",
          description: "Submit an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .use(accessPlugin("applications", "read"))
    .get(
      "/",
      async ({ user, query, role, set }) => {
        try {
          const { status, propertyId, page = 1, limit = 10 } = query;

          // Build query based on user role
          const queryFilter: FilterQuery<IApplication> = {};

          if (role.name === "tenant") {
            queryFilter.tenant = user.id;
          } else if (role.name === "landlord") {
            queryFilter.landlord = user.id;
          }

          // Add status filter if provided
          if (
            status &&
            Object.values(ApplicationStatus).includes(
              status as ApplicationStatus
            )
          ) {
            queryFilter.status = status;
          }

          // Add property filter if provided
          if (propertyId) {
            queryFilter.property = propertyId;
          }

          // Calculate pagination
          const skip = (Number(page) - 1) * Number(limit);

          // Get total count
          const total = await Application.countDocuments(query);

          // Get applications with pagination
          const applications = await Application.find(query)
            .populate("property", "title address media pricing")
            .populate("tenant", "firstName lastName email")
            .populate("documents")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

          return {
            status: "success",
            items: applications,
            pagination: {
              pages: Math.ceil(total / Number(limit)),
              total,
              page,
              limit,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get applications",
          };
        }
      },
      {
        query: t.Object({
          status: t.Optional(
            t.String({ description: "Filter by application status" })
          ),
          propertyId: t.Optional(
            t.String({ description: "Filter by property ID" })
          ),
          page: t.Optional(
            t.Numeric({ default: 1, description: "Page number for pagination" })
          ),
          limit: t.Optional(
            t.Numeric({ default: 10, description: "Number of items per page" })
          ),
        }),
        detail: {
          tags: ["applications"],
          summary: "Get all applications",
          description: "Get all applications",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .use(accessPlugin("applications", "read"))
    .get(
      "/:id",
      async ({ params, user, set, role }) => {
        try {
          const { id } = params;

          // Find application with full population
          const application = await Application.findById(id)
            .populate("property")
            .populate("tenant", "firstName lastName email phone")
            .populate("documents")
            .populate("landlord", "firstName lastName email phone")
            .populate({
              path: "messages",
              options: { sort: { createdAt: -1 } },
            });

          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check permissions
          const isTenant =
            (application.tenant as mongoose.Types.ObjectId)._id.toString() ===
            user.id;
          const isLandlord =
            (application.landlord as mongoose.Types.ObjectId)._id.toString() ===
            user.id;
          const isAdmin = role.name === "admin";

          if (!(isTenant || isLandlord || isAdmin)) {
            set.status = 403;
            return {
              status: "error",
              message: "You do not have permission to view this application",
            };
          }

          return {
            status: "success",
            data: application,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get application",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["applications"],
          summary: "Get an application by ID",
          description: "Get an application by ID",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .use(accessPlugin("applications", "update"))
    .patch(
      "/:id/status",
      async ({ params, body, user, set, role }) => {
        try {
          const { id } = params;
          const { status, reason } = body;

          // Validate status
          if (!(status && Object.values(ApplicationStatus).includes(status))) {
            set.status = 400;
            return {
              status: "error",
              message: "Invalid status",
            };
          }

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check permissions
          const isLandlord =
            application.landlord && application.landlord.toString() === user.id;
          const isAdmin = role.name === "admin";

          if (!(isLandlord || isAdmin)) {
            set.status = 403;
            return {
              status: "error",
              message: "You do not have permission to update this application",
            };
          }

          // If rejecting, require a reason
          if (status === ApplicationStatus.REJECTED && !reason) {
            set.status = 400;
            return {
              status: "error",
              message: "Reason is required when rejecting an application",
            };
          }

          // Update application status
          application.status = status;

          // Set additional fields based on status
          if (status === ApplicationStatus.REJECTED) {
            application.rejectionReason = reason;
            application.timeline.push({
              title: "Application Rejected",
              description: reason || "No reason provided",
              date: new Date(),
              status: TimelineEventStatus.ERROR,
              actor: new mongoose.Types.ObjectId(user.id),
            });
          } else if (status === ApplicationStatus.APPROVED) {
            application.approvedBy = new mongoose.Types.ObjectId(user.id);
            application.approvedAt = new Date();
            application.timeline.push({
              title: "Application Approved",
              description: "Your application has been approved",
              date: new Date(),
              status: TimelineEventStatus.COMPLETED,
              actor: new mongoose.Types.ObjectId(user.id),
            });
          } else if (status === ApplicationStatus.IN_REVIEW) {
            application.timeline.push({
              title: "Application Under Review",
              description: "Your application is being reviewed",
              date: new Date(),
              status: TimelineEventStatus.IN_PROGRESS,
              actor: new mongoose.Types.ObjectId(user.id),
            });
          }

          await application.save();

          // Notify tenant about status change
          const tenant = await User.findById(application.tenant);
          const property = await Property.findById(application.property);

          if (tenant) {
            await Notification.create({
              user: application.tenant,
              title: `Application ${status === ApplicationStatus.APPROVED ? "Approved" : status === ApplicationStatus.REJECTED ? "Rejected" : "Updated"}`,
              message: `Your application for ${property?.title || "a property"} has been ${status === ApplicationStatus.APPROVED ? "approved" : status === ApplicationStatus.REJECTED ? "rejected" : `updated to ${status}`}.`,
              type: NotificationCategory.APPLICATION,
              data: {
                applicationId: application._id,
                propertyId: application.property,
                status,
              },
              createdAt: new Date(),
            });
          }

          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
              { path: "documents" },
              { path: "landlord", select: "firstName lastName email" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update application status",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          status: t.Enum(ApplicationStatus),
          reason: t.Optional(t.String()),
        }),
        detail: {
          tags: ["applications"],
          summary: "Update an application status",
          description: "Update an application status",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .use(accessPlugin("applications", "update"))
    .put(
      "/:id",
      async ({ params, body, user, set, tenant }) => {
        try {
          const { id } = params;
          const { moveInDate, offerAmount, notes, documents } = body;

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check if user is the tenant who created the application
          if (application.tenant.toString() !== tenant.id) {
            set.status = 403;
            return {
              status: "error",
              message: "You do not have permission to update this application",
            };
          }

          // Check if application is in draft status
          if (application.status !== ApplicationStatus.DRAFT) {
            set.status = 400;
            return {
              status: "error",
              message: "Only draft applications can be updated",
            };
          }

          // Update fields
          if (moveInDate) application.moveInDate = new Date(moveInDate);
          if (offerAmount !== undefined) application.offerAmount = offerAmount;
          if (notes !== undefined) application.notes = notes;
          if (documents)
            application.documents = documents.map(
              (id: string) => new mongoose.Types.ObjectId(id)
            );

          // Add timeline event
          application.timeline.push({
            title: "Application Updated",
            description: "Application details were updated",
            date: new Date(),
            status: TimelineEventStatus.COMPLETED,
            actor: new mongoose.Types.ObjectId(user.id),
          });

          await application.save();

          // Return updated application
          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
              { path: "documents" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update application",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          moveInDate: t.Optional(t.String()),
          offerAmount: t.Optional(t.Number()),
          notes: t.Optional(t.String()),
          documents: t.Optional(t.Array(t.String())),
        }),
        detail: {
          tags: ["applications"],
          summary: "Update an application",
          description: "Update an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .post(
      "/:id/withdraw",
      async ({ params, user, set, tenant }) => {
        try {
          const { id } = params;

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check if user is the tenant who created the application
          if (application.tenant.toString() !== tenant.id) {
            set.status = 403;
            return {
              status: "error",
              message:
                "You do not have permission to withdraw this application",
            };
          }

          // Check if application is in a state that can be withdrawn
          if (
            [
              ApplicationStatus.APPROVED,
              ApplicationStatus.REJECTED,
              ApplicationStatus.WITHDRAWN,
            ].includes(application.status)
          ) {
            set.status = 400;
            return {
              status: "error",
              message: `Application cannot be withdrawn when in ${application.status} status`,
            };
          }

          // Update application status
          application.status = ApplicationStatus.WITHDRAWN;
          application.timeline.push({
            title: "Application Withdrawn",
            description: "You have withdrawn your application",
            date: new Date(),
            status: TimelineEventStatus.COMPLETED,
            actor: new mongoose.Types.ObjectId(user.id),
          });

          await application.save();

          // Notify landlord
          if (application.landlord) {
            const tenant = await Tenant.findById(application.tenant);
            const property = await Property.findById(application.property);

            await Notification.create({
              user: application.landlord,
              title: "Application Withdrawn",
              message: `${tenant?.personalInfo.firstName} ${tenant?.personalInfo.lastName} has withdrawn their application for ${property?.title || "your property"}.`,
              type: NotificationCategory.APPLICATION,
              data: {
                applicationId: application._id,
                propertyId: application.property,
              },
              createdAt: new Date(),
            });
          }
          // Return updated application
          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
              { path: "documents" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to withdraw application",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["applications"],
          summary: "Withdraw an application",
          description: "Withdraw an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .post(
      "/:id/documents",
      async ({ params, body, user, set, tenant }) => {
        try {
          const { id } = params;
          const { documentId } = body;

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check if user is the tenant who created the application
          if (application.tenant.toString() !== tenant.id) {
            set.status = 403;
            return {
              status: "error",
              message:
                "You do not have permission to add documents to this application",
            };
          }

          // Check if application is in a state that can be updated
          if (
            ![ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED].includes(
              application.status
            )
          ) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Documents can only be added to draft or submitted applications",
            };
          }

          // Check if document exists and belongs to user
          const document = await Document.findOne({
            _id: documentId,
            tenant: tenant.id,
          });

          if (!document) {
            set.status = 404;
            return {
              status: "error",
              message: "Document not found",
            };
          }

          // Check if document is already in the application
          if (application.documents.includes(document._id)) {
            set.status = 400;
            return {
              status: "error",
              message: "Document is already added to this application",
            };
          }

          // Add document to application
          application.documents.push(document._id);
          application.timeline.push({
            title: "Document Added",
            description: `Document "${document.name}" has been added to your application`,
            date: new Date(),
            status: TimelineEventStatus.COMPLETED,
            actor: new mongoose.Types.ObjectId(user.id),
          });

          await application.save();

          // Return updated application
          return {
            status: "success",
            data: await application.populate([
              { path: "property", select: "title address media pricing" },
              { path: "tenant", select: "firstName lastName email" },
              { path: "documents" },
            ]),
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add document to application",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          documentId: t.String(),
        }),
        detail: {
          tags: ["applications"],
          summary: "Add a document to an application",
          description: "Add a document to an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    .delete(
      "/:id",
      async ({ params, set, tenant }) => {
        try {
          const { id } = params;

          // Find application
          const application = await Application.findById(id);
          if (!application) {
            set.status = 404;
            return {
              status: "error",
              message: "Application not found",
            };
          }

          // Check if user is the tenant who created the application
          if (application.tenant.toString() !== tenant.id) {
            set.status = 403;
            return {
              status: "error",
              message: "You do not have permission to delete this application",
            };
          }

          // Check if application is in a state that can be deleted
          if (application.status !== ApplicationStatus.DRAFT) {
            set.status = 400;
            return {
              status: "error",
              message: "Only draft applications can be deleted",
            };
          }

          // Delete application
          await application.deleteOne();

          // Return success message
          return {
            status: "success",
            message: "Application deleted successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete application",
          };
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: {
          tags: ["applications"],
          summary: "Delete an application",
          description: "Delete an application",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    /**
     * Get application status counts for the current tenant
     */
    .get(
      "/stats/status",
      async ({ set, tenant }) => {
        try {
          // Aggregate counts of applications by status for the current tenant
          const statusCounts = await Application.aggregate([
            { $match: { tenant: new mongoose.Types.ObjectId(tenant.id) } },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ]);

          // Convert aggregation result to a record of status: count
          const counts: Record<string, number> = {};
          for (const { _id, count } of statusCounts) {
            counts[_id] = count;
          }

          // Ensure all statuses are present, even if zero
          for (const status of Object.values(ApplicationStatus)) {
            if (!(status in counts)) {
              counts[status] = 0;
            }
          }

          return {
            status: "success",
            data: counts,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get application status counts",
          };
        }
      },
      {
        detail: {
          tags: ["applications"],
          summary: "Get application status counts",
          description:
            "Get the count of applications by status for the current tenant",
          security: [{ bearerAuth: [] }],
        },
      }
    )
    /**
     * Get estimated offer amount (min and max) for applications of the current tenant
     */
    .get(
      "/estimated-amount",
      async ({ set, tenant }) => {
        try {
          // Aggregate min and max offerAmount for the current tenant's applications
          const result = await Application.aggregate([
            { $match: { tenant: new mongoose.Types.ObjectId(tenant.id) } },
            {
              $group: {
                _id: null,
                min: { $min: "$offerAmount" },
                max: { $max: "$offerAmount" },
              },
            },
          ]);

          const min = result[0]?.min ?? 0;
          const max = result[0]?.max ?? 0;

          return {
            status: "success",
            data: { min, max },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to get estimated offer amount",
          };
        }
      },
      {
        detail: {
          tags: ["applications"],
          summary: "Get estimated offer amount (min and max)",
          description:
            "Get the minimum and maximum offerAmount for the current tenant's applications",
          security: [{ bearerAuth: [] }],
        },
      }
    )
);
