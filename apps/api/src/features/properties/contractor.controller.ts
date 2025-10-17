import { Contractor, Schedule, WorkOrder } from "@kaa/models";
import {
  ContractorSpecialty,
  ContractorStatus,
  type IContractor,
  type IContractorRating,
} from "@kaa/models/types";
import Elysia, { t } from "elysia";
import { accessPlugin } from "~/features/rbac/rbac.plugin";

export const contractorController = new Elysia().group("contractors", (app) =>
  app
    .use(accessPlugin("contractor", "create"))
    .post(
      "/",
      async ({ body, set, user }) => {
        try {
          const contractor = new Contractor({
            ...body,
            addedBy: user.id,
          });

          await contractor.save();

          return {
            status: "success",
            message: "Contractor created successfully",
            data: contractor,
          };
        } catch (error: any) {
          if (error.code === 11_000) {
            set.status = 400;
            return {
              status: "error",
              message: "Contractor with this email already exists",
            };
          }

          set.status = 500;
          return {
            status: "error",
            message: "Failed to create contractor",
          };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          company: t.Optional(t.String()),
          email: t.String(),
          phone: t.String(),
          address: t.Optional(
            t.Object({
              street: t.String(),
              city: t.String(),
              state: t.String(),
              zipCode: t.String(),
              country: t.String(),
            })
          ),
          specialties: t.Array(t.Enum(ContractorSpecialty)),
          licenseNumber: t.Optional(t.String()),
          insuranceInfo: t.Optional(
            t.Object({
              provider: t.String(),
              policyNumber: t.String(),
              expiryDate: t.String(),
              coverageAmount: t.Number(),
            })
          ),
          hourlyRate: t.Optional(t.Number()),
          serviceAreas: t.Array(t.String()),
          emergencyAvailable: t.Optional(t.Boolean()),
          notes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Create a new contractor",
        },
      }
    )
    .use(accessPlugin("contractor", "read"))
    // Get contractor statistics
    .get(
      "/stats",
      async ({ query, set }) => {
        try {
          const { contractorId } = query;
          let filter = {};

          if (contractorId) {
            filter = { _id: contractorId };
          }

          const contractors = await Contractor.find(filter);

          // Calculate aggregate stats
          const stats = {
            totalJobs: 0,
            completedJobs: 0,
            averageRating:
              contractors.reduce(
                (sum: number, c: IContractor) => sum + (c.averageRating || 0),
                0
              ) / contractors.length || 0,
            onTimePercentage: 85, // Mock data - would be calculated from work orders
            totalEarnings: 0, // Mock data - would be calculated from payments
          };

          return {
            status: "success",
            message: "Contractor statistics fetched successfully",
            data: { stats },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch contractor statistics",
          };
        }
      },
      {
        query: t.Object({
          contractorId: t.Optional(t.String()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractor statistics",
        },
      }
    )
    // Search contractors
    .get(
      "/search",
      async ({ query, set }) => {
        try {
          const { q } = query;

          if (!q) {
            set.status = 400;
            return {
              status: "error",
              message: "Search query is required",
            };
          }

          const contractors = await Contractor.find({
            $or: [
              { name: { $regex: q, $options: "i" } },
              { company: { $regex: q, $options: "i" } },
              { email: { $regex: q, $options: "i" } },
              { specialties: { $in: [new RegExp(q, "i")] } },
              { serviceAreas: { $in: [new RegExp(q, "i")] } },
            ],
          }).populate("addedBy", "firstName lastName");

          return {
            status: "success",
            message: "Contractors search completed",
            data: { contractors },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to search contractors",
          };
        }
      },
      {
        query: t.Object({
          q: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Search contractors by name, company, email, or specialty",
        },
      }
    )
    // Export contractors
    .get(
      "/export",
      async ({ query, set }) => {
        try {
          const { format = "csv", ...filters } = query;

          const contractors = await Contractor.find(filters).populate(
            "addedBy",
            "firstName lastName"
          );

          // In a real implementation, you'd generate the actual file
          // For now, return the data that would be exported
          return {
            status: "success",
            message: `Contractors exported in ${format} format`,
            data: {
              format,
              count: contractors.length,
              contractors,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to export contractors",
          };
        }
      },
      {
        query: t.Object({
          format: t.Optional(t.String()),
          status: t.Optional(t.Enum(ContractorStatus)),
          specialty: t.Optional(t.Enum(ContractorSpecialty)),
          serviceArea: t.Optional(t.String()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Export contractors data",
        },
      }
    )
    .get(
      "/",
      async ({ query }) => {
        try {
          const {
            status,
            specialty,
            serviceArea,
            emergencyOnly,
            sortBy = "averageRating",
            sortOrder = "desc",
            page = 1,
            limit = 20,
          } = query;

          // Build filter
          const filter: any = {};

          if (status) {
            filter.status = status;
          }

          if (specialty) {
            filter.specialties = specialty;
          }

          if (serviceArea) {
            filter.serviceAreas = serviceArea;
          }

          if (emergencyOnly === "true") {
            filter.emergencyAvailable = true;
          }

          // Build sort
          const sort: any = {};
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;

          // Calculate pagination
          const skip = (Number(page) - 1) * Number(limit);

          const [contractors, total] = await Promise.all([
            Contractor.find(filter)
              .sort(sort)
              .skip(skip)
              .limit(Number(limit))
              .populate("addedBy", "firstName lastName"),
            Contractor.countDocuments(filter),
          ]);

          return {
            status: "success",
            message: "Contractors fetched successfully",
            data: {
              contractors,
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
            message: "Failed to fetch contractors",
          };
        }
      },
      {
        query: t.Object({
          status: t.Optional(t.Enum(ContractorStatus)),
          specialty: t.Optional(t.Enum(ContractorSpecialty)),
          serviceArea: t.Optional(t.String()),
          emergencyOnly: t.Optional(t.String()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractors with filtering and pagination",
        },
      }
    )
    .get(
      "/available",
      async ({ query, set }) => {
        try {
          const { specialty, serviceArea, date, startTime, endTime } = query;

          if (!(specialty && serviceArea && date && startTime && endTime)) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Missing required parameters: specialty, serviceArea, date, startTime, endTime",
            };
          }

          const searchDate = new Date(date);
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const dayOfWeek = dayNames[searchDate.getDay()];

          const contractors = await Contractor.find({
            status: ContractorStatus.ACTIVE,
            specialties: specialty,
            serviceAreas: serviceArea,
            [`availability.${dayOfWeek}.available`]: true,
            [`availability.${dayOfWeek}.start`]: { $lte: startTime },
            [`availability.${dayOfWeek}.end`]: { $gte: endTime },
          }).sort({ averageRating: -1, completedJobs: -1 });

          return {
            status: "success",
            message: "Available contractors fetched successfully",
            data: contractors,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch available contractors",
          };
        }
      },
      {
        query: t.Object({
          specialty: t.String(),
          serviceArea: t.String(),
          date: t.String(),
          startTime: t.String(),
          endTime: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Find available contractors for specific time slot",
        },
      }
    )
    // Get contractors by specialty
    .get(
      "/specialty/:specialty",
      async ({ params, set }) => {
        try {
          const contractors = await Contractor.find({
            specialties: params.specialty,
            status: ContractorStatus.ACTIVE,
          }).populate("addedBy", "firstName lastName");

          return {
            status: "success",
            message: "Contractors by specialty fetched successfully",
            data: { contractors },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch contractors by specialty",
          };
        }
      },
      {
        params: t.Object({
          specialty: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractors by specialty",
        },
      }
    )
    // Get contractors by service area
    .get(
      "/service-area/:serviceArea",
      async ({ params, set }) => {
        try {
          const contractors = await Contractor.find({
            serviceAreas: params.serviceArea,
            status: ContractorStatus.ACTIVE,
          }).populate("addedBy", "firstName lastName");

          return {
            status: "success",
            message: "Contractors by service area fetched successfully",
            data: { contractors },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch contractors by service area",
          };
        }
      },
      {
        params: t.Object({
          serviceArea: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractors by service area",
        },
      }
    )
    // Get contractor recommendations for work order
    .get(
      "/recommendations/:workOrderId",
      async ({ set }) => {
        try {
          // This would typically involve complex logic to match contractors
          // based on work order requirements, location, availability, ratings, etc.
          // For now, return top-rated contractors
          const recommendations = await Contractor.find({
            status: ContractorStatus.ACTIVE,
            averageRating: { $gte: 4.0 },
          })
            .sort({ averageRating: -1 })
            .limit(5)
            .populate("addedBy", "firstName lastName");

          return {
            status: "success",
            message: "Contractor recommendations fetched successfully",
            data: { recommendations },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch contractor recommendations",
          };
        }
      },
      {
        params: t.Object({
          workOrderId: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractor recommendations for work order",
        },
      }
    )
    .get(
      "/emergency",
      async ({ query, set }) => {
        try {
          const { specialty, serviceArea } = query;

          if (!(specialty && serviceArea)) {
            set.status = 400;
            return {
              status: "error",
              message: "Missing required parameters: specialty, serviceArea",
            };
          }

          const contractors = await Contractor.find({
            status: ContractorStatus.ACTIVE,
            specialties: specialty,
            serviceAreas: serviceArea,
            emergencyAvailable: true,
          }).sort({ averageRating: -1 });

          return {
            status: "success",
            message: "Emergency contractors fetched successfully",
            data: contractors,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch emergency contractors",
          };
        }
      },
      {
        query: t.Object({
          specialty: t.String(),
          serviceArea: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Find emergency contractors",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const contractor = await Contractor.findById(params.id)
            .populate("addedBy", "firstName lastName")
            .populate("ratings.ratedBy", "firstName lastName");

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          return {
            status: "success",
            message: "Contractor fetched successfully",
            data: contractor,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch contractor",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractor by ID",
        },
      }
    )
    // Get contractor work history
    .get(
      "/:id/work-history",
      async ({ params, query, set }) => {
        try {
          const { limit = 10 } = query;

          const contractor = await Contractor.findById(params.id);
          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          // Get work orders assigned to the contractor
          const workOrders = await WorkOrder.find({
            assignedTo: contractor._id,
          })
            .sort({ createdAt: -1 })
            .limit(limit);

          return {
            status: "success",
            message: "Work history fetched successfully",
            data: { workOrders },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch work history",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractor work history",
        },
      }
    )
    // Get contractor calendar
    .get(
      "/:id/calendar",
      async ({ params, query, set }) => {
        try {
          const { startDate, endDate } = query;

          const contractor = await Contractor.findById(params.id);
          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          const events = await Schedule.find({
            $or: [
              { "participants.contractor": contractor._id },
              { organizer: contractor._id },
            ],
            startDate: { $gte: new Date(startDate) },
            endDate: { $lte: new Date(endDate) },
          })
            .populate("property", "name address")
            .populate("organizer", "firstName lastName")
            .populate("participants.user", "firstName lastName")
            .populate("participants.contractor", "name company");

          return {
            status: "success",
            message: "Calendar events fetched successfully",
            data: { events },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch calendar events",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        query: t.Object({
          startDate: t.String(),
          endDate: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Get contractor calendar events",
        },
      }
    )
    .use(accessPlugin("contractor", "update"))
    .put(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const contractor = await Contractor.findByIdAndUpdate(
            params.id,
            body,
            {
              new: true,
              runValidators: true,
            }
          );

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          return {
            status: "success",
            message: "Contractor updated successfully",
            data: contractor,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update contractor",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          name: t.Optional(t.String()),
          company: t.Optional(t.String()),
          email: t.Optional(t.String()),
          phone: t.Optional(t.String()),
          address: t.Optional(
            t.Object({
              street: t.String(),
              city: t.String(),
              state: t.String(),
              zipCode: t.String(),
              country: t.String(),
            })
          ),
          specialties: t.Optional(t.Array(t.Enum(ContractorSpecialty))),
          status: t.Optional(t.Enum(ContractorStatus)),
          licenseNumber: t.Optional(t.String()),
          insuranceInfo: t.Optional(
            t.Object({
              provider: t.String(),
              policyNumber: t.String(),
              expiryDate: t.String(),
              coverageAmount: t.Number(),
            })
          ),
          hourlyRate: t.Optional(t.Number()),
          serviceAreas: t.Optional(t.Array(t.String())),
          emergencyAvailable: t.Optional(t.Boolean()),
          notes: t.Optional(t.String()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Update contractor",
        },
      }
    )
    .post(
      "/:id/rate",
      async ({ params, body, set, user }) => {
        try {
          const contractor = await Contractor.findById(params.id);

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          // Add rating
          contractor.ratings.push({
            ...body,
            ratedBy: user.id,
          } as any);

          // Recalculate average rating
          if (contractor.ratings.length === 0) {
            contractor.averageRating = 0;
            return 0;
          }

          const sum = contractor.ratings.reduce(
            (acc: number, rating: IContractorRating) => acc + rating.rating,
            0
          );
          contractor.averageRating = sum / contractor.ratings.length;

          await contractor.save();

          return {
            status: "success",
            message: "Rating added successfully",
            data: contractor,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to add rating",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          workOrder: t.String(),
          rating: t.Number({ minimum: 1, maximum: 5 }),
          comment: t.Optional(t.String()),
          qualityRating: t.Number({ minimum: 1, maximum: 5 }),
          timelinessRating: t.Number({ minimum: 1, maximum: 5 }),
          communicationRating: t.Number({ minimum: 1, maximum: 5 }),
          professionalismRating: t.Number({ minimum: 1, maximum: 5 }),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Rate a contractor",
        },
      }
    )
    // Update contractor availability
    .patch(
      "/:id/availability",
      async ({ params, body, set }) => {
        try {
          const contractor = await Contractor.findByIdAndUpdate(
            params.id,
            { availability: body.availability },
            { new: true, runValidators: true }
          );

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          return {
            status: "success",
            message: "Contractor availability updated successfully",
            data: contractor,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to update contractor availability",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          availability: t.Any(), // Would be properly typed based on contractor model
        }),
        detail: {
          tags: ["contractors"],
          summary: "Update contractor availability",
        },
      }
    )
    // Bulk update contractors
    .patch(
      "/bulk-update",
      async ({ body, set }) => {
        try {
          const { contractorIds, updates } = body;

          const result = await Contractor.updateMany(
            { _id: { $in: contractorIds } },
            { $set: updates }
          );

          return {
            status: "success",
            message: "Contractors updated successfully",
            data: {
              updated: result.modifiedCount,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to bulk update contractors",
          };
        }
      },
      {
        body: t.Object({
          contractorIds: t.Array(t.String()),
          updates: t.Any(), // Would be properly typed based on contractor model
        }),
        detail: {
          tags: ["contractors"],
          summary: "Bulk update contractors",
        },
      }
    )
    // Verify contractor license
    .post(
      "/:id/verify-license",
      async ({ params, set }) => {
        try {
          const contractor = await Contractor.findById(params.id);

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          // Mock license verification - in real app, this would call external API
          const verified = Boolean(contractor.licenseNumber);

          return {
            status: "success",
            message: "License verification completed",
            data: {
              verified,
              details: verified
                ? "License is valid"
                : "No license number provided",
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to verify license",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Verify contractor license",
        },
      }
    )
    // Send contractor invitation
    .post(
      "/:id/invite",
      async ({ params, set }) => {
        try {
          const contractor = await Contractor.findById(params.id);

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          // Mock invitation sending - in real app, this would send email/SMS
          return {
            status: "success",
            message: "Invitation sent successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to send invitation",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: t.Object({
          workOrderId: t.String(),
          message: t.Optional(t.String()),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Send contractor invitation for work order",
        },
      }
    )
    .use(accessPlugin("contractor", "delete"))
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const contractor = await Contractor.findByIdAndDelete(params.id);

          if (!contractor) {
            set.status = 404;
            return {
              status: "error",
              message: "Contractor not found",
            };
          }

          return {
            status: "success",
            message: "Contractor deleted successfully",
            data: null,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Failed to delete contractor",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["contractors"],
          summary: "Delete contractor",
        },
      }
    )
);
