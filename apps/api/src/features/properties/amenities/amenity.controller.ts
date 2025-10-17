import {
  AmenityApprovalStatus,
  AmenityCategory,
  AmenitySource,
} from "@kaa/models/types";
import {
  AmenityDiscoveryService,
  AmenityService,
  AutoPopulationService,
} from "@kaa/services";
import { logger } from "@kaa/utils";
import Elysia, { t } from "elysia";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  amenityMetadataResponseSchema,
  amenityResponseSchema,
  amenityScoreQuerySchema,
  amenityScoreResponseSchema,
  amenityWithDistanceResponseSchema,
  areaStatsResponseSchema,
  bulkImportResponseSchema,
  createAmenitySchema,
  groupedAmenitiesResponseSchema,
  nearbyAmenitiesQuerySchema,
  searchAmenitiesQuerySchema,
  updateAmenitySchema,
} from "./amenity.schema";

export const amenityController = new Elysia({ prefix: "/amenities" })

  /**
   * Get nearby amenities based on coordinates
   * GET /amenities/nearby?latitude=-1.2921&longitude=36.8219&radius=5&categories=education,healthcare
   */
  .get(
    "/nearby",
    async ({ query, set }) => {
      try {
        const amenities = await AmenityService.findNearbyAmenities(query);

        return {
          status: "success",
          data: amenities.map((amenity) => ({
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          })),
          count: amenities.length,
        };
      } catch (error) {
        logger.error("Error in nearby amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: nearbyAmenitiesQuerySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(amenityWithDistanceResponseSchema),
          count: t.Number(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Find nearby amenities",
        description:
          "Get amenities near a specific location with distance and travel time estimates",
      },
    }
  )

  /**
   * Get nearby amenities grouped by category
   * GET /amenities/nearby/grouped?latitude=-1.2921&longitude=36.8219&radius=5
   */
  .get(
    "/nearby/grouped",
    async ({ query, set }) => {
      try {
        const {
          latitude,
          longitude,
          radius = 5,
          categories,
          limit = 10,
          verified,
        } = query;

        const groupedAmenities =
          await AmenityService.findNearbyAmenitiesGrouped(
            latitude,
            longitude,
            radius,
            { categories: categories as AmenityCategory[], limit, verified }
          );

        set.status = StatusCodes.OK;
        return {
          status: "success",
          data: groupedAmenities.map((group) => ({
            ...group,
            amenities: group.amenities.map((amenity) => ({
              ...amenity,
              _id: (amenity._id as Types.ObjectId).toString(),
              rating: amenity.rating || 0,
              reviewCount: amenity.reviewCount || 0,
            })),
          })),
          message: "Amenities fetched successfully",
        };
      } catch (error) {
        logger.error("Error in grouped nearby amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        latitude: t.Number({ minimum: -90, maximum: 90 }),
        longitude: t.Number({ minimum: -180, maximum: 180 }),
        radius: t.Optional(t.Number({ minimum: 0.1, maximum: 50, default: 5 })),
        categories: t.Optional(t.Array(t.String())),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 20, default: 10 })),
        verified: t.Optional(t.Boolean()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(groupedAmenitiesResponseSchema),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Find nearby amenities grouped by category",
        description:
          "Get amenities near a location organized by category (education, healthcare, etc.)",
      },
    }
  )

  /**
   * Get amenities for a specific property
   * GET /amenities/property/{propertyId}?radius=2
   */
  .get(
    "/property/:propertyId",
    async ({ params, query, set }) => {
      try {
        const { propertyId } = params;
        const { radius = 2 } = query;

        const amenities = await AmenityService.getPropertyAmenities(
          propertyId,
          radius
        );

        return {
          status: "success",
          data: amenities.map((amenity) => ({
            ...amenity,
            amenities: amenity.amenities.map((amenity) => ({
              ...amenity,
              _id: (amenity._id as Types.ObjectId).toString(),
              rating: amenity.rating || 0,
              reviewCount: amenity.reviewCount || 0,
            })),
          })),
          propertyId,
          radius,
        };
      } catch (error) {
        logger.error("Error in property amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      query: t.Object({
        radius: t.Optional(t.Number({ minimum: 0.1, maximum: 10, default: 2 })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(groupedAmenitiesResponseSchema),
          propertyId: t.String(),
          radius: t.Number(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get amenities for a property",
        description:
          "Get nearby amenities for a specific property, useful for property listings",
      },
    }
  )

  /**
   * Calculate amenity score for a location
   * GET /amenities/score?latitude=-1.2921&longitude=36.8219&radius=2
   */
  .get(
    "/score",
    async ({ query, set }) => {
      try {
        const { latitude, longitude, radius = 2 } = query;

        const score = await AmenityService.calculateAmenityScore(
          latitude,
          longitude,
          radius
        );

        return {
          status: "success",
          data: {
            ...score,
            breakdown: {
              ...score.breakdown,
              [AmenityCategory.EDUCATION]:
                score.breakdown?.[AmenityCategory.EDUCATION] || 0,
              [AmenityCategory.HEALTHCARE]:
                score.breakdown?.[AmenityCategory.HEALTHCARE] || 0,
              [AmenityCategory.SHOPPING]:
                score.breakdown?.[AmenityCategory.SHOPPING] || 0,
              [AmenityCategory.TRANSPORT]:
                score.breakdown?.[AmenityCategory.TRANSPORT] || 0,
              [AmenityCategory.BANKING]:
                score.breakdown?.[AmenityCategory.BANKING] || 0,
              [AmenityCategory.ENTERTAINMENT]:
                score.breakdown?.[AmenityCategory.ENTERTAINMENT] || 0,
              [AmenityCategory.RELIGIOUS]:
                score.breakdown?.[AmenityCategory.RELIGIOUS] || 0,
              [AmenityCategory.GOVERNMENT]:
                score.breakdown?.[AmenityCategory.GOVERNMENT] || 0,
              [AmenityCategory.UTILITIES]:
                score.breakdown?.[AmenityCategory.UTILITIES] || 0,
              [AmenityCategory.FOOD]:
                score.breakdown?.[AmenityCategory.FOOD] || 0,
              [AmenityCategory.SECURITY]:
                score.breakdown?.[AmenityCategory.SECURITY] || 0,
              [AmenityCategory.SPORTS]:
                score.breakdown?.[AmenityCategory.SPORTS] || 0,
            },
          },
        };
      } catch (error) {
        logger.error("Error in amenity score endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: amenityScoreQuerySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityScoreResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Calculate amenity score for location",
        description:
          "Calculate a weighted amenity score (0-100) for a location based on nearby amenities",
      },
    }
  )

  /**
   * Search amenities by name or description
   * GET /amenities/search?q=hospital&county=Nairobi&categories=healthcare
   */
  .get(
    "/search",
    async ({ query, set }) => {
      try {
        const amenities = await AmenityService.searchAmenities(query.q, {
          county: query.county,
          categories: query.categories,
          types: query.types,
          limit: query.limit,
          verified: query.verified,
        });

        return {
          status: "success",
          data: amenities.map((amenity) => ({
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          })),
          count: amenities.length,
          query: query.q,
        };
      } catch (error) {
        logger.error("Error in search amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: searchAmenitiesQuerySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(amenityResponseSchema),
          count: t.Number(),
          query: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Search amenities",
        description:
          "Search amenities by name or description with optional filters",
      },
    }
  )

  /**
   * Get amenities by county
   * GET /amenities/county/Nairobi?category=education&verified=true
   */
  .get(
    "/county/:county",
    async ({ params, query, set }) => {
      try {
        const { county } = params;
        const amenities = await AmenityService.getAmenitiesByCounty(
          county,
          query.category as AmenityCategory,
          {
            limit: query.limit,
            verified: query.verified,
          }
        );

        return {
          status: "success",
          data: amenities.map((amenity) => ({
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
            operatingHours: amenity.operatingHours || {},
          })),
          count: amenities.length,
          county,
        };
      } catch (error) {
        logger.error("Error in county amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        county: t.String(),
      }),
      query: t.Object({
        category: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 50 })),
        verified: t.Optional(t.Boolean()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(amenityResponseSchema),
          count: t.Number(),
          county: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get amenities by county",
        description:
          "Get all amenities in a specific county with optional category filter",
      },
    }
  )

  /**
   * Get area amenity statistics
   * GET /amenities/stats/Nairobi?ward=Westlands
   */
  .get(
    "/stats/:county",
    async ({ params, query, set }) => {
      try {
        const { county } = params;
        const { ward } = query;

        const stats = await AmenityService.getAreaAmenityStats(county, ward);

        return {
          status: "success",
          data: stats,
          county,
          ward,
        };
      } catch (error) {
        logger.error("Error in area stats endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        county: t.String(),
      }),
      query: t.Object({
        ward: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: areaStatsResponseSchema,
          county: t.String(),
          ward: t.Optional(t.String()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get area amenity statistics",
        description:
          "Get amenity statistics for a county or ward including counts by category",
      },
    }
  )

  /**
   * Get amenity metadata (categories, types, mappings)
   * GET /amenities/metadata
   */
  .get(
    "/metadata",
    ({ set }) => {
      try {
        const metadata = AmenityService.getAmenityMetadata();

        return {
          status: "success",
          data: metadata,
        };
      } catch (error) {
        logger.error("Error in amenity metadata endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityMetadataResponseSchema,
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get amenity metadata",
        description:
          "Get available amenity categories, types, and their mappings",
      },
    }
  )

  // Protected routes requiring authentication
  .use(authPlugin)

  /**
   * Create a new amenity
   * POST /amenities
   */
  .post(
    "/",
    async ({ body, set, user }) => {
      try {
        const amenity = await AmenityService.createAmenity({
          ...body,
          source: AmenitySource.MANUAL,
          isAutoDiscovered: false, // Manual entry
          approvalStatus: AmenityApprovalStatus.APPROVED, // Manual entries are pre-approved
          verificationLevel: "basic", // Manual entries get basic verification
          verifiedBy: new Types.ObjectId(user?.id),
          verified: true,
          verifiedAt: new Date(),
          lastVerificationDate: new Date(),
          approvedBy: new Types.ObjectId(user?.id),
          approvedAt: new Date(),
          verificationHistory: [
            {
              verifiedBy: new Types.ObjectId(user?.id),
              verifiedAt: new Date(),
              verificationLevel: "basic",
              notes: "Manually created and verified",
            },
          ],
        });

        set.status = StatusCodes.CREATED;
        return {
          status: "success",
          data: amenity,
          message: "Amenity created successfully",
        };
      } catch (error) {
        logger.error("Error in create amenity endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: createAmenitySchema,
      response: {
        201: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Create a new amenity",
        description: "Create a new amenity with location and details",
      },
    }
  )

  /**
   * Update an existing amenity
   * PUT /amenities/{id}
   */
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const { id } = params;
        const amenity = await AmenityService.updateAmenity(id, body);

        if (!amenity) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          data: {
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          },
          message: "Amenity updated successfully",
        };
      } catch (error) {
        logger.error("Error in update amenity endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateAmenitySchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Update an amenity",
        description: "Update an existing amenity's information",
      },
    }
  )

  /**
   * Delete an amenity
   * DELETE /amenities/{id}
   */
  .delete(
    "/:id",
    async ({ params, set }) => {
      try {
        const { id } = params;
        const success = await AmenityService.deleteAmenity(id);

        if (!success) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          message: "Amenity deleted successfully",
        };
      } catch (error) {
        logger.error("Error in delete amenity endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Delete an amenity",
        description: "Soft delete an amenity (sets isActive to false)",
      },
    }
  )

  /**
   * Verify an amenity (basic verification)
   * POST /amenities/{id}/verify
   */
  .post(
    "/:id/verify",
    async ({ params, set, user }) => {
      try {
        const { id } = params;

        if (!user?.id) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            status: "error",
            message: "Authentication required",
          };
        }

        const amenity = await AmenityService.verifyAmenity(id, user.id);

        if (!amenity) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          data: {
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          },
          message: "Amenity verified successfully",
        };
      } catch (error) {
        logger.error("Error in verify amenity endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Verify an amenity (basic)",
        description: "Mark an amenity as verified by an authenticated user",
      },
    }
  )

  /**
   * Enhanced verification with levels
   * POST /amenities/{id}/verify-enhanced
   */
  .post(
    "/:id/verify-enhanced",
    async ({ params, body, set, user }) => {
      try {
        const { id } = params;
        const { verificationLevel, notes } = body;

        if (!user?.id) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            status: "error",
            message: "Authentication required",
          };
        }

        const amenity = await AmenityService.verifyAmenityWithLevel(
          id,
          user.id,
          verificationLevel,
          notes
        );

        if (!amenity) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          data: {
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          },
          message: `Amenity verified with ${verificationLevel} level`,
        };
      } catch (error) {
        logger.error("Error in enhanced verify amenity endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        verificationLevel: t.Union([
          t.Literal("basic"),
          t.Literal("full"),
          t.Literal("community_verified"),
        ]),
        notes: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Enhanced verification with levels",
        description:
          "Verify an amenity with specific verification level and notes",
      },
    }
  )

  /**
   * Get amenities by discovery status
   * GET /amenities/by-discovery-status?isAutoDiscovered=true&county=Nairobi
   */
  .get(
    "/by-discovery-status",
    async ({ query, set }) => {
      try {
        const {
          isAutoDiscovered,
          county,
          approvalStatus,
          verificationLevel,
          limit = 20,
          skip = 0,
        } = query;

        const result = await AmenityService.getAmenitiesByDiscoveryStatus(
          isAutoDiscovered === "true",
          {
            county,
            approvalStatus: approvalStatus as AmenityApprovalStatus,
            verificationLevel,
            limit: limit as number,
            skip: skip as number,
          }
        );

        return {
          status: "success",
          data: result.amenities.map((amenity) => ({
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          })),
          pagination: {
            total: result.total,
            limit,
            skip,
            hasMore: result.hasMore,
          },
        };
      } catch (error) {
        logger.error("Error getting amenities by discovery status:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        isAutoDiscovered: t.Optional(t.String()),
        county: t.Optional(t.String()),
        approvalStatus: t.Optional(
          t.Union([
            t.Literal("pending"),
            t.Literal("approved"),
            t.Literal("rejected"),
            t.Literal("needs_review"),
          ])
        ),
        verificationLevel: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
        skip: t.Optional(t.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(amenityResponseSchema),
          pagination: t.Object({
            total: t.Number(),
            limit: t.Number(),
            skip: t.Number(),
            hasMore: t.Boolean(),
          }),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get amenities by discovery status",
        description:
          "Get amenities filtered by whether they were auto-discovered or manually entered",
      },
    }
  )

  /**
   * Get verification statistics
   * GET /amenities/verification-stats?county=Nairobi
   */
  .get(
    "/verification-stats",
    async ({ query, set }) => {
      try {
        const { county } = query;
        const stats = await AmenityService.getVerificationStats(county);

        return {
          status: "success",
          data: stats,
          county,
        };
      } catch (error) {
        logger.error("Error getting verification stats:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        county: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            byLevel: t.Record(t.String(), t.Number()),
            byDiscoveryStatus: t.Object({
              autoDiscovered: t.Object({
                verified: t.Number(),
                unverified: t.Number(),
              }),
              manual: t.Object({
                verified: t.Number(),
                unverified: t.Number(),
              }),
            }),
            totalVerified: t.Number(),
            totalUnverified: t.Number(),
            verificationRate: t.Number(),
          }),
          county: t.Optional(t.String()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get verification statistics",
        description:
          "Get detailed verification statistics by level and discovery status",
      },
    }
  )

  /**
   * Bulk import amenities
   * POST /amenities/bulk-import
   */
  .post(
    "/bulk-import",
    async ({ body, set }) => {
      try {
        const result = await AmenityService.bulkImportAmenities(body.amenities);

        return {
          status: "success",
          data: result,
          message: `Bulk import completed: ${result.created} created, ${result.errors} errors`,
        };
      } catch (error) {
        logger.error("Error in bulk import endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        amenities: t.Array(createAmenitySchema),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: bulkImportResponseSchema,
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Bulk import amenities",
        description: "Import multiple amenities at once",
      },
    }
  )

  /**
   * Find duplicate amenities
   * GET /amenities/duplicates
   */
  .get(
    "/duplicates",
    async ({ set }) => {
      try {
        const duplicates = await AmenityService.findDuplicateAmenities();

        return {
          status: "success",
          data: duplicates.map((duplicate) => {
            return {
              ...duplicate,
              // _id: (duplicate._id as Types.ObjectId).toString(),
              // rating: duplicate.rating || 0,
              // reviewCount: duplicate.reviewCount || 0,
            } as any;
          }),
          count: duplicates.length,
        };
      } catch (error) {
        logger.error("Error in find duplicates endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(
            t.Object({
              name: t.String(),
              type: t.String(),
              duplicates: t.Array(amenityResponseSchema),
            })
          ),
          count: t.Number(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Find duplicate amenities",
        description:
          "Find amenities that might be duplicates based on name and proximity",
      },
    }
  )

  /**
   * Get pending amenities for approval
   * GET /amenities/pending?county=Nairobi&source=auto_discovered_google
   */
  .get(
    "/pending",
    async ({ query, set }) => {
      try {
        const { county, source, limit = 20, skip = 0 } = query;

        const result = await AmenityService.getPendingAmenities({
          county,
          source: source as AmenitySource,
          limit: limit as number,
          skip: skip as number,
        });

        return {
          status: "success",
          data: result.amenities.map((amenity) => ({
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          })),
          pagination: {
            total: result.total,
            limit,
            skip,
            hasMore: result.hasMore,
          },
        };
      } catch (error) {
        logger.error("Error getting pending amenities:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        county: t.Optional(t.String()),
        source: t.Optional(t.String()),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
        skip: t.Optional(t.Number({ minimum: 0, default: 0 })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Array(amenityResponseSchema),
          pagination: t.Object({
            total: t.Number(),
            limit: t.Number(),
            skip: t.Number(),
            hasMore: t.Boolean(),
          }),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get pending amenities for approval",
        description:
          "Get amenities that are pending approval, with optional filtering",
      },
    }
  )

  /**
   * Get approval statistics
   * GET /amenities/approval-stats?county=Nairobi
   */
  .get(
    "/approval-stats",
    async ({ query, set }) => {
      try {
        const { county } = query;
        const stats = await AmenityService.getApprovalStats(county);

        return {
          status: "success",
          data: stats,
          county,
        };
      } catch (error) {
        logger.error("Error getting approval stats:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        county: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            pending: t.Number(),
            approved: t.Number(),
            rejected: t.Number(),
            bySource: t.Any(),
          }),
          county: t.Optional(t.String()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get approval statistics",
        description: "Get statistics about amenity approval status by source",
      },
    }
  )

  /**
   * Discover amenities near coordinates using external APIs
   * POST /amenities/discover
   */
  .post(
    "/discover",
    async ({ body, set }) => {
      try {
        const {
          latitude,
          longitude,
          radius = 2000,
          sources = ["google", "osm"],
          autoSave = false,
        } = body;

        const result = await AmenityDiscoveryService.discoverNearbyAmenities(
          latitude,
          longitude,
          {
            radius,
            sources,
            autoSave,
            skipExisting: true,
          }
        );

        return {
          status: "success",
          data: result,
          message: `Discovered ${result.discovered.length} amenities${autoSave ? `, saved ${result.saved}` : ""}`,
        };
      } catch (error) {
        logger.error("Error in discover amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        latitude: t.Number({ minimum: -90, maximum: 90 }),
        longitude: t.Number({ minimum: -180, maximum: 180 }),
        radius: t.Optional(
          t.Number({ minimum: 500, maximum: 5000, default: 2000 })
        ),
        sources: t.Optional(
          t.Array(t.Union([t.Literal("google"), t.Literal("osm")]), {
            default: ["google", "osm"],
          })
        ),
        autoSave: t.Optional(t.Boolean({ default: false })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            discovered: t.Array(t.Any()),
            saved: t.Number(),
            errors: t.Number(),
            sources: t.Array(t.String()),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Discover amenities using external APIs",
        description:
          "Automatically discover amenities near coordinates using Google Places and/or OpenStreetMap",
      },
    }
  )

  /**
   * Discover amenities for a specific property
   * POST /amenities/discover/property/{propertyId}
   */
  .post(
    "/discover/property/:propertyId",
    async ({ params, body, set }) => {
      try {
        const { propertyId } = params;
        const {
          radius = 2000,
          autoSave = true,
          updatePropertyCache = true,
        } = body;

        const result = await AmenityDiscoveryService.discoverPropertyAmenities(
          propertyId,
          {
            radius,
            autoSave,
            updatePropertyCache,
          }
        );

        return {
          status: "success",
          data: result,
          message: `Discovered ${result.discovered.length} amenities for property, saved ${result.saved}`,
        };
      } catch (error) {
        logger.error("Error in discover property amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        propertyId: t.String(),
      }),
      body: t.Object({
        radius: t.Optional(
          t.Number({ minimum: 500, maximum: 5000, default: 2000 })
        ),
        autoSave: t.Optional(t.Boolean({ default: true })),
        updatePropertyCache: t.Optional(t.Boolean({ default: true })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            discovered: t.Array(t.Any()),
            saved: t.Number(),
            errors: t.Number(),
            propertyUpdated: t.Boolean(),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Discover amenities for a property",
        description:
          "Automatically discover and save amenities near a specific property",
      },
    }
  )

  /**
   * Batch discover amenities for multiple properties
   * POST /amenities/discover/batch
   */
  .post(
    "/discover/batch",
    async ({ body, set }) => {
      try {
        const {
          propertyIds,
          radius = 2000,
          batchSize = 5,
          delayMs = 1000,
        } = body;

        const result =
          await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
            propertyIds,
            {
              radius,
              batchSize,
              delayMs,
            }
          );

        return {
          status: "success",
          data: result,
          message: `Processed ${result.processed} properties, discovered ${result.totalDiscovered} amenities, saved ${result.totalSaved}`,
        };
      } catch (error) {
        logger.error("Error in batch discover amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        propertyIds: t.Array(t.String()),
        radius: t.Optional(
          t.Number({ minimum: 500, maximum: 5000, default: 2000 })
        ),
        batchSize: t.Optional(
          t.Number({ minimum: 1, maximum: 10, default: 5 })
        ),
        delayMs: t.Optional(
          t.Number({ minimum: 500, maximum: 5000, default: 1000 })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            processed: t.Number(),
            totalDiscovered: t.Number(),
            totalSaved: t.Number(),
            errors: t.Array(t.String()),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Batch discover amenities for properties",
        description:
          "Discover amenities for multiple properties in batch with rate limiting",
      },
    }
  )

  /**
   * Discover amenities for all properties in a county
   * POST /amenities/discover/county/{county}
   */
  .post(
    "/discover/county/:county",
    async ({ params, body, set }) => {
      try {
        const { county } = params;
        const { radius = 2000, batchSize = 3, delayMs = 2000 } = body;

        const result = await AmenityDiscoveryService.discoverCountyAmenities(
          county,
          {
            radius,
            batchSize,
            delayMs,
          }
        );

        return {
          status: "success",
          data: result,
          message: `Processed ${result.propertiesProcessed} properties in ${county}, discovered ${result.totalDiscovered} amenities`,
        };
      } catch (error) {
        logger.error("Error in discover county amenities endpoint:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        county: t.String(),
      }),
      body: t.Object({
        radius: t.Optional(
          t.Number({ minimum: 500, maximum: 5000, default: 2000 })
        ),
        batchSize: t.Optional(t.Number({ minimum: 1, maximum: 5, default: 3 })),
        delayMs: t.Optional(
          t.Number({ minimum: 1000, maximum: 10_000, default: 2000 })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            propertiesProcessed: t.Number(),
            totalDiscovered: t.Number(),
            totalSaved: t.Number(),
            errors: t.Array(t.String()),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Discover amenities for county properties",
        description:
          "Automatically discover amenities for all properties in a county",
      },
    }
  )

  /**
   * Get auto-population service status
   * GET /amenities/auto-population/status
   */
  .get(
    "/auto-population/status",
    async ({ set }) => {
      try {
        const status = await AutoPopulationService.getHealthStatus();

        set.status = StatusCodes.OK;
        return {
          status: "success",
          data: status,
        };
      } catch (error) {
        logger.error("Error getting auto-population status:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            queueSize: t.Number(),
            isProcessing: t.Boolean(),
            configStatus: t.Object({
              googlePlacesConfigured: t.Boolean(),
              osmEnabled: t.Boolean(),
            }),
          }),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get auto-population service status",
        description:
          "Get the current status of the automated amenity discovery service",
      },
    }
  )

  /**
   * Get auto-discovery statistics
   * GET /amenities/auto-population/stats?county=Nairobi
   */
  .get(
    "/auto-population/stats",
    async ({ query, set }) => {
      try {
        const { county } = query;
        const stats = await AutoPopulationService.getAutoDiscoveryStats(county);

        return {
          status: "success",
          data: stats,
          county,
        };
      } catch (error) {
        logger.error("Error getting auto-discovery stats:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        county: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            totalAutoDiscovered: t.Number(),
            sourceBreakdown: t.Record(t.String(), t.Number()),
            verificationRate: t.Number(),
            categoryCounts: t.Record(t.String(), t.Number()),
          }),
          county: t.Optional(t.String()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Get auto-discovery statistics",
        description: "Get statistics about automatically discovered amenities",
      },
    }
  )

  /**
   * Validate amenity data quality
   * GET /amenities/auto-population/validate?county=Nairobi
   */
  .get(
    "/auto-population/validate",
    async ({ query, set }) => {
      try {
        const { county } = query;
        const validation =
          await AutoPopulationService.validateAmenityData(county);

        return {
          status: "success",
          data: validation,
          county,
        };
      } catch (error) {
        logger.error("Error validating amenity data:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        county: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            totalAmenities: t.Number(),
            unverifiedCount: t.Number(),
            missingContactCount: t.Number(),
            missingHoursCount: t.Number(),
            duplicatesCount: t.Number(),
            suggestions: t.Array(t.String()),
          }),
          county: t.Optional(t.String()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Validate amenity data quality",
        description:
          "Analyze amenity data quality and get improvement suggestions",
      },
    }
  )

  /**
   * Discover missing amenities for properties
   * POST /amenities/auto-population/discover-missing
   */
  .post(
    "/auto-population/discover-missing",
    async ({ body, set }) => {
      try {
        const { county, batchSize = 10, maxProperties = 100 } = body;

        const result = await AutoPopulationService.discoverMissingAmenities({
          county,
          batchSize,
          maxProperties,
        });

        return {
          status: "success",
          data: result,
          message: `Processed ${result.processed} properties, discovered ${result.discovered} amenities`,
        };
      } catch (error) {
        logger.error("Error discovering missing amenities:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        county: t.Optional(t.String()),
        batchSize: t.Optional(
          t.Number({ minimum: 1, maximum: 20, default: 10 })
        ),
        maxProperties: t.Optional(
          t.Number({ minimum: 1, maximum: 200, default: 100 })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            processed: t.Number(),
            discovered: t.Number(),
            saved: t.Number(),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Discover missing amenities",
        description:
          "Find and populate amenities for properties that don't have any",
      },
    }
  )

  /**
   * Refresh stale amenities
   * POST /amenities/auto-population/refresh-stale
   */
  .post(
    "/auto-population/refresh-stale",
    async ({ body, set }) => {
      try {
        const {
          daysOld = 30,
          county,
          batchSize = 5,
          maxProperties = 50,
        } = body;

        const result = await AutoPopulationService.refreshStaleAmenities(
          daysOld,
          {
            county,
            batchSize,
            maxProperties,
          }
        );

        return {
          status: "success",
          data: result,
          message: `Refreshed amenities for ${result.processed} properties older than ${daysOld} days`,
        };
      } catch (error) {
        logger.error("Error refreshing stale amenities:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        daysOld: t.Optional(
          t.Number({ minimum: 1, maximum: 365, default: 30 })
        ),
        county: t.Optional(t.String()),
        batchSize: t.Optional(
          t.Number({ minimum: 1, maximum: 10, default: 5 })
        ),
        maxProperties: t.Optional(
          t.Number({ minimum: 1, maximum: 100, default: 50 })
        ),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            processed: t.Number(),
            discovered: t.Number(),
            saved: t.Number(),
          }),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Refresh stale amenities",
        description: "Update amenity data for properties with old information",
      },
    }
  )

  /**
   * Emergency stop auto-population
   * POST /amenities/auto-population/emergency-stop
   */
  .post(
    "/auto-population/emergency-stop",
    ({ set }) => {
      try {
        AutoPopulationService.emergencyStop();

        return {
          status: "success",
          message: "Auto-population service stopped and queue cleared",
        };
      } catch (error) {
        logger.error("Error stopping auto-population:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      response: {
        200: t.Object({
          status: t.Literal("success"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Emergency stop auto-population",
        description:
          "Stop the auto-population service and clear the processing queue",
      },
    }
  )

  /**
   * Approve an amenity
   * POST /amenities/{id}/approve
   */
  .post(
    "/:id/approve",
    async ({ params, body, set, user }) => {
      try {
        const { id } = params;
        const { notes } = body;

        if (!user?.id) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            status: "error",
            message: "Authentication required",
          };
        }

        const amenity = await AmenityService.approveAmenity(id, user.id, notes);

        if (!amenity) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          data: {
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          },
          message: "Amenity approved successfully",
        };
      } catch (error) {
        logger.error("Error approving amenity:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        notes: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Approve an amenity",
        description: "Approve a pending amenity",
      },
    }
  )

  /**
   * Reject an amenity
   * POST /amenities/{id}/reject
   */
  .post(
    "/:id/reject",
    async ({ params, body, set, user }) => {
      try {
        const { id } = params;
        const { reason } = body;

        if (!user?.id) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            status: "error",
            message: "Authentication required",
          };
        }

        const amenity = await AmenityService.rejectAmenity(id, user.id, reason);

        if (!amenity) {
          set.status = StatusCodes.NOT_FOUND;
          return {
            status: "error",
            message: "Amenity not found",
          };
        }

        return {
          status: "success",
          data: {
            ...amenity,
            _id: (amenity._id as Types.ObjectId).toString(),
            rating: amenity.rating || 0,
            reviewCount: amenity.reviewCount || 0,
          },
          message: "Amenity rejected successfully",
        };
      } catch (error) {
        logger.error("Error rejecting amenity:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        reason: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: amenityResponseSchema,
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        404: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Reject an amenity",
        description: "Reject a pending amenity with reason",
      },
    }
  )

  /**
   * Bulk approve amenities
   * POST /amenities/bulk-approve
   */
  .post(
    "/bulk-approve",
    async ({ body, set, user }) => {
      try {
        const { amenityIds } = body;

        if (!user?.id) {
          set.status = StatusCodes.UNAUTHORIZED;
          return {
            status: "error",
            message: "Authentication required",
          };
        }

        const result = await AmenityService.bulkApproveAmenities(
          amenityIds,
          user.id
        );

        return {
          status: "success",
          data: result,
          message: `Bulk approval completed: ${result.approved} approved, ${result.errors} errors`,
        };
      } catch (error) {
        logger.error("Error in bulk approve:", error);
        set.status = StatusCodes.INTERNAL_SERVER_ERROR;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        amenityIds: t.Array(t.String()),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: t.Object({
            approved: t.Number(),
            errors: t.Number(),
            errorDetails: t.Array(t.String()),
          }),
          message: t.String(),
        }),
        401: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["amenities"],
        summary: "Bulk approve amenities",
        description: "Approve multiple amenities at once",
      },
    }
  );

/**
 * Discover amenities near coordinates using external APIs
 */
