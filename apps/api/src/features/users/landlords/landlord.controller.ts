import {
  LandlordStatus,
  LandlordType,
  VerificationStatus,
} from "@kaa/models/types";
import { landlordService } from "@kaa/services";
// import { triggerWebhooks } from "~/features/misc/webhooks/webhooks.service";
import { clearCache } from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import * as prom from "prom-client";
import { authPlugin } from "~/features/auth/auth.plugin";

// Metrics for landlords
const activeLandlordsGauge = new prom.Gauge({
  name: "kaa_active_landlords",
  help: "Current number of active landlords",
});

const verifiedLandlordsGauge = new prom.Gauge({
  name: "kaa_verified_landlords",
  help: "Current number of verified landlords",
});

const landlordOperationsCounter = new prom.Counter({
  name: "kaa_landlord_operations",
  help: "Count of landlord operations",
  labelNames: ["operation"],
});

// Define schemas for validation
const createLandlordSchema = t.Object({
  landlordType: t.Union([
    t.Literal(LandlordType.INDIVIDUAL),
    t.Literal(LandlordType.COMPANY),
    t.Literal(LandlordType.TRUST),
    t.Literal(LandlordType.PARTNERSHIP),
    t.Literal(LandlordType.LLC),
    t.Literal(LandlordType.CORPORATION),
  ]),
  personalInfo: t.Optional(
    t.Object({
      firstName: t.Optional(t.String()),
      middleName: t.Optional(t.String()),
      lastName: t.Optional(t.String()),
      email: t.String(),
      phone: t.String(),
      alternatePhone: t.Optional(t.String()),
      dateOfBirth: t.Optional(t.String()),
      nationality: t.Optional(t.String()),
      nationalId: t.Optional(t.String()),
      passportNumber: t.Optional(t.String()),
      gender: t.Optional(
        t.Union([
          t.Literal("male"),
          t.Literal("female"),
          t.Literal("other"),
          t.Literal("prefer_not_to_say"),
        ])
      ),
      occupation: t.Optional(t.String()),
      preferredLanguage: t.Optional(t.String()),
    })
  ),
  businessInfo: t.Optional(
    t.Object({
      companyName: t.Optional(t.String()),
      registrationNumber: t.Optional(t.String()),
      taxId: t.Optional(t.String()),
      vatNumber: t.Optional(t.String()),
      industry: t.Optional(t.String()),
      companyType: t.Optional(
        t.Union([
          t.Literal("sole_proprietorship"),
          t.Literal("partnership"),
          t.Literal("llc"),
          t.Literal("corporation"),
          t.Literal("trust"),
          t.Literal("other"),
        ])
      ),
      establishedDate: t.Optional(t.String()),
      website: t.Optional(t.String()),
      description: t.Optional(t.String()),
      directors: t.Optional(
        t.Array(
          t.Object({
            name: t.String(),
            position: t.String(),
            nationalId: t.String(),
            sharePercentage: t.Optional(t.Number()),
            isPrimary: t.Optional(t.Boolean()),
          })
        )
      ),
      authorizedPersons: t.Optional(
        t.Array(
          t.Object({
            name: t.String(),
            position: t.String(),
            email: t.String(),
            phone: t.String(),
            nationalId: t.String(),
            canSignContracts: t.Optional(t.Boolean()),
            canManageFinances: t.Optional(t.Boolean()),
          })
        )
      ),
    })
  ),
  contactInfo: t.Object({
    primaryAddress: t.Object({
      line1: t.String(),
      town: t.String(),
      county: t.String(),
      city: t.String(),
      state: t.String(),
      country: t.String(),
      postalCode: t.String(),
      coordinates: t.Optional(
        t.Object({
          latitude: t.Number(),
          longitude: t.Number(),
        })
      ),
    }),
    mailingAddress: t.Optional(
      t.Object({
        line1: t.String(),
        town: t.String(),
        county: t.String(),
        city: t.String(),
        state: t.String(),
        country: t.String(),
        postalCode: t.String(),
      })
    ),
    businessAddress: t.Optional(
      t.Object({
        line1: t.String(),
        town: t.String(),
        county: t.String(),
        city: t.String(),
        state: t.String(),
        country: t.String(),
        postalCode: t.String(),
      })
    ),
    emergencyContact: t.Object({
      name: t.String(),
      relationship: t.String(),
      phone: t.String(),
      email: t.Optional(t.String()),
    }),
  }),
  financialInfo: t.Object({
    bankingDetails: t.Object({
      primaryBank: t.String(),
      accountName: t.String(),
      accountNumber: t.String(),
      isVerified: t.Boolean(),
    }),
  }),
  communicationPreferences: t.Optional(
    t.Object({
      preferredMethod: t.Optional(
        t.Union([
          t.Literal("email"),
          t.Literal("sms"),
          t.Literal("whatsapp"),
          t.Literal("phone"),
          t.Literal("in_app"),
        ])
      ),
      language: t.Optional(t.String()),
      timezone: t.Optional(t.String()),
      receiveMarketingEmails: t.Optional(t.Boolean()),
      receivePropertyAlerts: t.Optional(t.Boolean()),
      receiveMaintenanceUpdates: t.Optional(t.Boolean()),
      receiveRegulatoryUpdates: t.Optional(t.Boolean()),
      receivePerformanceReports: t.Optional(t.Boolean()),
    })
  ),
  subscription: t.Optional(
    t.Object({
      plan: t.Optional(
        t.Union([
          t.Literal("basic"),
          t.Literal("standard"),
          t.Literal("premium"),
          t.Literal("enterprise"),
        ])
      ),
      billingCycle: t.Optional(
        t.Union([
          t.Literal("monthly"),
          t.Literal("quarterly"),
          t.Literal("yearly"),
        ])
      ),
      paymentMethod: t.Optional(
        t.Union([
          t.Literal("card"),
          t.Literal("bank_transfer"),
          t.Literal("mobile_money"),
        ])
      ),
      autoRenewal: t.Optional(t.Boolean()),
    })
  ),
  metadata: t.Optional(
    t.Object({
      source: t.Optional(
        t.Union([
          t.Literal("website"),
          t.Literal("referral"),
          t.Literal("agent"),
          t.Literal("marketing"),
          t.Literal("api"),
          t.Literal("import"),
        ])
      ),
      referredBy: t.Optional(t.String()),
      campaignId: t.Optional(t.String()),
      tags: t.Optional(t.Array(t.String())),
      notes: t.Optional(t.String()),
      internalNotes: t.Optional(t.String()),
    })
  ),
});

const updateLandlordSchema = t.Partial(createLandlordSchema);

const landlordQuerySchema = t.Object({
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  status: t.Optional(t.String()),
  landlordType: t.Optional(t.String()),
  verificationStatus: t.Optional(t.String()),
  riskLevel: t.Optional(t.String()),
  search: t.Optional(t.String()),
  tags: t.Optional(t.String()),
  city: t.Optional(t.String()),
  state: t.Optional(t.String()),
  country: t.Optional(t.String()),
  createdFrom: t.Optional(t.String()),
  createdTo: t.Optional(t.String()),
  verifiedFrom: t.Optional(t.String()),
  verifiedTo: t.Optional(t.String()),
  minNetWorth: t.Optional(t.String()),
  maxNetWorth: t.Optional(t.String()),
  minPropertyValue: t.Optional(t.String()),
  maxPropertyValue: t.Optional(t.String()),
  minOccupancyRate: t.Optional(t.String()),
  maxOccupancyRate: t.Optional(t.String()),
  minCollectionRate: t.Optional(t.String()),
  maxCollectionRate: t.Optional(t.String()),
  hasValidLicense: t.Optional(t.String()),
  hasActiveViolations: t.Optional(t.String()),
  complianceExpiring: t.Optional(t.String()),
});

const searchLandlordSchema = t.Object({
  memberId: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  companyName: t.Optional(t.String()),
  registrationNumber: t.Optional(t.String()),
  taxId: t.Optional(t.String()),
  nationalId: t.Optional(t.String()),
  userId: t.Optional(t.String()),
});

const updateVerificationSchema = t.Object({
  verificationType: t.Union([
    t.Literal("identity"),
    t.Literal("address"),
    t.Literal("financial"),
    t.Literal("business"),
  ]),
  verificationData: t.Record(t.String(), t.Any()),
  notes: t.Optional(t.String()),
});

const bulkOperationSchema = t.Object({
  landlordIds: t.Array(t.String()),
  updateData: t.Optional(t.Record(t.String(), t.Any())),
});

export const landlordController = new Elysia().group("landlords", (app) =>
  app
    .get(
      "/",
      async ({ query, set }) => {
        try {
          const page = Number.parseInt(query.page as string, 10) || 1;
          const limit = Number.parseInt(query.limit as string, 10) || 10;

          const queryParams = {
            page,
            limit,
            sortBy: query.sortBy || "createdAt",
            sortOrder: (query.sortOrder as "asc" | "desc") || "desc",
            status: query.status as LandlordStatus,
            landlordType: query.landlordType as LandlordType,
            verificationStatus: query.verificationStatus as VerificationStatus,
            riskLevel: query.riskLevel,
            search: query.search,
            tags: query.tags,
            city: query.city,
            state: query.state,
            country: query.country,
            createdFrom: query.createdFrom
              ? new Date(query.createdFrom)
              : undefined,
            createdTo: query.createdTo ? new Date(query.createdTo) : undefined,
            verifiedFrom: query.verifiedFrom
              ? new Date(query.verifiedFrom)
              : undefined,
            verifiedTo: query.verifiedTo
              ? new Date(query.verifiedTo)
              : undefined,
            minNetWorth: query.minNetWorth
              ? Number(query.minNetWorth)
              : undefined,
            maxNetWorth: query.maxNetWorth
              ? Number(query.maxNetWorth)
              : undefined,
            minPropertyValue: query.minPropertyValue
              ? Number(query.minPropertyValue)
              : undefined,
            maxPropertyValue: query.maxPropertyValue
              ? Number(query.maxPropertyValue)
              : undefined,
            minOccupancyRate: query.minOccupancyRate
              ? Number(query.minOccupancyRate)
              : undefined,
            maxOccupancyRate: query.maxOccupancyRate
              ? Number(query.maxOccupancyRate)
              : undefined,
            minCollectionRate: query.minCollectionRate
              ? Number(query.minCollectionRate)
              : undefined,
            maxCollectionRate: query.maxCollectionRate
              ? Number(query.maxCollectionRate)
              : undefined,
            hasValidLicense:
              query.hasValidLicense === "true"
                ? true
                : query.hasValidLicense === "false"
                  ? false
                  : undefined,
            hasActiveViolations:
              query.hasActiveViolations === "true"
                ? true
                : query.hasActiveViolations === "false"
                  ? false
                  : undefined,
            complianceExpiring: query.complianceExpiring === "true",
          };

          const result = await landlordService.getLandlords(queryParams as any);

          // Update metrics
          const activeLandlordsCount = await mongoose
            .model("Landlord")
            .countDocuments({
              status: LandlordStatus.ACTIVE,
              isActive: true,
            });
          const verifiedLandlordsCount = await mongoose
            .model("Landlord")
            .countDocuments({
              "verification.status": VerificationStatus.COMPLETED,
              isActive: true,
            });

          activeLandlordsGauge.set(activeLandlordsCount);
          verifiedLandlordsGauge.set(verifiedLandlordsCount);

          return {
            status: "success",
            items: result.items,
            pagination: result.pagination,
            message: "Landlords fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching landlords:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch landlords",
          };
        }
      },
      {
        query: landlordQuerySchema,
        detail: {
          tags: ["landlords"],
          summary: "Get all landlords",
          description: "Get all landlords with pagination and filters",
        },
      }
    )
    .get(
      "/search",
      async ({ query, set }) => {
        try {
          const result = await landlordService.getLandlordBy(query);

          return {
            status: "success",
            data: result,
            message: result ? "Landlord found" : "Landlord not found",
          };
        } catch (error) {
          console.error("Error searching landlord:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to search landlord",
          };
        }
      },
      {
        query: searchLandlordSchema,
        detail: {
          tags: ["landlords"],
          summary: "Search landlord",
          description: "Search landlord by various criteria",
        },
      }
    )
    .get(
      "/stats",
      async ({ set }) => {
        try {
          const stats = await landlordService.getLandlordStats();

          return {
            status: "success",
            data: stats,
            message: "Landlord statistics fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching landlord stats:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch landlord statistics",
          };
        }
      },
      {
        detail: {
          tags: ["landlords"],
          summary: "Get landlord statistics",
          description: "Get comprehensive landlord statistics and analytics",
        },
      }
    )
    .get(
      "/analytics",
      async ({ set }) => {
        try {
          // Parse query parameters for analytics filters
          const filters = {
            // Add any specific filters for analytics
          };

          const analytics = await landlordService.getLandlordAnalytics(filters);

          return {
            status: "success",
            data: analytics,
            message: "Landlord analytics fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching landlord analytics:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch landlord analytics",
          };
        }
      },
      {
        detail: {
          tags: ["landlords"],
          summary: "Get landlord analytics",
          description: "Get detailed analytics and insights about landlords",
        },
      }
    )
    .get(
      "/follow-up",
      async ({ set }) => {
        try {
          const landlords =
            await landlordService.getLandlordsRequiringFollowUp();

          return {
            status: "success",
            items: landlords,
            message: "Landlords requiring follow-up fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching landlords requiring follow-up:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch landlords requiring follow-up",
          };
        }
      },
      {
        detail: {
          tags: ["landlords"],
          summary: "Get landlords requiring follow-up",
          description: "Get landlords that require follow-up actions",
        },
      }
    )
    .get(
      "/expiring-documents",
      async ({ query, set }) => {
        try {
          const daysAhead = query.daysAhead ? Number(query.daysAhead) : 30;
          const landlords =
            await landlordService.getExpiringLandlordDocuments(daysAhead);

          return {
            status: "success",
            items: landlords,
            message: "Landlords with expiring documents fetched successfully",
          };
        } catch (error) {
          console.error("Error fetching expiring documents:", error);
          set.status = 500;
          return {
            status: "error",
            message: "Failed to fetch expiring documents",
          };
        }
      },
      {
        query: t.Object({
          daysAhead: t.Optional(t.String()),
        }),
        detail: {
          tags: ["landlords"],
          summary: "Get landlords with expiring documents",
          description:
            "Get landlords whose documents are expiring within specified days",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const { id } = params;
          const result = await landlordService.getLandlordById(id);

          return {
            status: "success",
            data: result,
            message: "Landlord fetched successfully",
          };
        } catch (error: any) {
          console.error("Error fetching landlord:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to fetch landlord",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["landlords"],
          summary: "Get landlord by ID",
          description: "Get landlord by ID with populated references",
        },
      }
    )
    .use(authPlugin)
    .post(
      "/",
      async ({ body, user, set }) => {
        try {
          const landlordData = body;

          // Add memberId from authenticated user
          const createData = {
            ...landlordData,
            user: new mongoose.Types.ObjectId(user.id),
            memberId: new mongoose.Types.ObjectId(user.memberId),
            personalInfo: {
              ...landlordData.personalInfo,
              dateOfBirth: new Date(
                landlordData.personalInfo?.dateOfBirth as string
              ),
            },
            businessInfo: {
              ...landlordData.businessInfo,
              directors: landlordData.businessInfo?.directors?.map(
                (director) => ({
                  ...director,
                  isPrimary: director.isPrimary ?? false,
                })
              ),
              authorizedPersons:
                landlordData.businessInfo?.authorizedPersons?.map(
                  (authorizedPerson) => ({
                    ...authorizedPerson,
                    canSignContracts:
                      authorizedPerson.canSignContracts ?? false,
                    canManageFinances:
                      authorizedPerson.canManageFinances ?? false,
                  })
                ),
              establishedDate: new Date(
                landlordData.businessInfo?.establishedDate as string
              ),
            },
          };

          const newLandlord = await landlordService.createLandlord(
            createData as any
          );

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "create" });

          // Clear cache
          await clearCache("landlords:list");

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "landlord.created", newLandlord);

          set.status = 201;
          return {
            status: "success",
            data: newLandlord,
            message: "Landlord created successfully",
          };
        } catch (error: any) {
          console.error("Error creating landlord:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to create landlord",
          };
        }
      },
      {
        body: createLandlordSchema,
        detail: {
          tags: ["landlords"],
          summary: "Create landlord",
          description: "Create a new landlord",
        },
      }
    )
    .patch(
      "/:id",
      async ({ params, body, set }) => {
        try {
          const { id } = params;
          const updateData = body;

          // Check if landlord exists
          const existingLandlord = await mongoose
            .model("Landlord")
            .findById(id);
          if (!existingLandlord) {
            set.status = 404;
            return {
              status: "error",
              message: "Landlord not found",
            };
          }

          const updatedLandlord = await landlordService.updateLandlord(id, {
            ...updateData,
            personalInfo: {
              ...updateData.personalInfo,
              dateOfBirth: updateData.personalInfo?.dateOfBirth
                ? new Date(updateData.personalInfo.dateOfBirth)
                : undefined,
            },
            businessInfo: {
              ...updateData.businessInfo,
              directors: updateData.businessInfo?.directors?.map(
                (director) => ({
                  ...director,
                  isPrimary: director.isPrimary ?? false,
                })
              ),
              authorizedPersons:
                updateData.businessInfo?.authorizedPersons?.map(
                  (authorizedPerson) => ({
                    ...authorizedPerson,
                    canSignContracts:
                      authorizedPerson.canSignContracts ?? false,
                    canManageFinances:
                      authorizedPerson.canManageFinances ?? false,
                  })
                ),
              establishedDate: updateData.businessInfo?.establishedDate
                ? new Date(updateData.businessInfo.establishedDate)
                : undefined,
            },
            contactInfo: {
              ...updateData.contactInfo,
              primaryAddress: updateData.contactInfo?.primaryAddress
                ? {
                    ...updateData.contactInfo.primaryAddress,
                    coordinates: updateData.contactInfo.primaryAddress
                      .coordinates
                      ? {
                          ...updateData.contactInfo.primaryAddress.coordinates,
                        }
                      : undefined,
                    line1: updateData.contactInfo.primaryAddress.line1,
                    town: updateData.contactInfo.primaryAddress.town,
                    county: updateData.contactInfo.primaryAddress.county,
                  }
                : undefined,
              mailingAddress: updateData.contactInfo?.mailingAddress
                ? {
                    ...updateData.contactInfo.mailingAddress,
                    line1: updateData.contactInfo.mailingAddress.line1,
                    town: updateData.contactInfo.mailingAddress.town,
                    county: updateData.contactInfo.mailingAddress.county,
                  }
                : undefined,
              businessAddress: updateData.contactInfo?.businessAddress
                ? {
                    ...updateData.contactInfo.businessAddress,
                  }
                : undefined,
              emergencyContact: updateData.contactInfo?.emergencyContact
                ? {
                    ...updateData.contactInfo.emergencyContact,
                  }
                : undefined,
            },
            metadata: {
              ...updateData.metadata,
              referredBy: updateData.metadata?.referredBy
                ? new mongoose.Types.ObjectId(updateData.metadata.referredBy)
                : undefined,
            },
          });

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "update" });

          // Clear cache
          await clearCache("landlords:list");
          await clearCache(`landlord:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "landlord.updated", updatedLandlord);

          return {
            status: "success",
            data: updatedLandlord,
            message: "Landlord updated successfully",
          };
        } catch (error: any) {
          console.error("Error updating landlord:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to update landlord",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: updateLandlordSchema,
        detail: {
          tags: ["landlords"],
          summary: "Update landlord",
          description: "Update landlord information",
        },
      }
    )
    .delete(
      "/:id",
      async ({ params, set }) => {
        try {
          const { id } = params;

          // Check if landlord exists
          const existingLandlord = await mongoose
            .model("Landlord")
            .findById(id);
          if (!existingLandlord) {
            set.status = 404;
            return {
              status: "error",
              message: "Landlord not found",
            };
          }

          // Check if landlord has active properties - might want to prevent deletion
          if (
            existingLandlord.properties &&
            existingLandlord.properties.length > 0
          ) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Cannot delete landlord with active properties. Please transfer or remove properties first.",
            };
          }

          await landlordService.deleteLandlord(id);

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "delete" });

          // Clear cache
          await clearCache("landlords:list");
          await clearCache(`landlord:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "landlord.deleted", existingLandlord);

          return {
            status: "success",
            message: "Landlord deleted successfully",
          };
        } catch (error: any) {
          console.error("Error deleting landlord:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to delete landlord",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["landlords"],
          summary: "Delete landlord",
          description: "Delete a landlord",
        },
      }
    )
    .patch(
      "/:id/verify",
      async ({ params, set }) => {
        try {
          const { id } = params;

          const verifiedLandlord = await landlordService.verifyLandlord(id);

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "verify" });

          // Clear cache
          await clearCache(`landlord:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(user.memberId as string, "landlord.verified", verifiedLandlord);

          return {
            status: "success",
            data: verifiedLandlord,
            message: "Landlord verified successfully",
          };
        } catch (error: any) {
          console.error("Error verifying landlord:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to verify landlord",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        detail: {
          tags: ["landlords"],
          summary: "Verify landlord",
          description: "Mark landlord as verified",
        },
      }
    )
    .patch(
      "/:id/verification",
      async ({ params, body, set }) => {
        try {
          const { id } = params;
          const { verificationType, verificationData } = body;

          const updatedLandlord =
            await landlordService.updateLandlordVerification(
              id,
              verificationType,
              verificationData
            );

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "update_verification" });

          // Clear cache
          await clearCache(`landlord:${id}`);

          // Trigger webhooks
          // await triggerWebhooks(
          // 	user.memberId as string,
          // 	"landlord.verification_updated",
          // 	updatedLandlord
          // );

          return {
            status: "success",
            data: updatedLandlord,
            message: "Landlord verification updated successfully",
          };
        } catch (error: any) {
          console.error("Error updating landlord verification:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to update landlord verification",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: updateVerificationSchema,
        detail: {
          tags: ["landlords"],
          summary: "Update landlord verification",
          description: "Update landlord verification progress",
        },
      }
    )
    .patch(
      "/bulk-update",
      async ({ body, set }) => {
        try {
          const { landlordIds, updateData } = body;

          const result = await landlordService.bulkUpdateLandlords(
            landlordIds,
            updateData as any
          );

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "bulk_update" });

          // Clear cache
          await clearCache("landlords:list");

          return {
            status: "success",
            data: result,
            message: `Bulk update completed: ${result.success} successful, ${result.failed} failed`,
          };
        } catch (error: any) {
          console.error("Error in bulk update:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to bulk update landlords",
          };
        }
      },
      {
        body: bulkOperationSchema,
        detail: {
          tags: ["landlords"],
          summary: "Bulk update landlords",
          description: "Update multiple landlords at once",
        },
      }
    )
    .delete(
      "/bulk-delete",
      async ({ body, set }) => {
        try {
          const { landlordIds } = body;

          const result = await landlordService.bulkDeleteLandlords(landlordIds);

          // Increment landlord operations counter
          landlordOperationsCounter.inc({ operation: "bulk_delete" });

          // Clear cache
          await clearCache("landlords:list");

          return {
            status: "success",
            data: result,
            message: `Bulk delete completed: ${result.success} successful, ${result.failed} failed`,
          };
        } catch (error: any) {
          console.error("Error in bulk delete:", error);
          set.status = error.status || 500;
          return {
            status: "error",
            message: error.message || "Failed to bulk delete landlords",
          };
        }
      },
      {
        body: t.Object({
          landlordIds: t.Array(t.String()),
        }),
        detail: {
          tags: ["landlords"],
          summary: "Bulk delete landlords",
          description: "Delete multiple landlords at once",
        },
      }
    )
);
