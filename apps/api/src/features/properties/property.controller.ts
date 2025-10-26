/**
 * Property Controller
 *
 * Handles all property-related API endpoints including:
 * - CRUD operations
 * - Search and filtering
 * - Analytics and statistics
 * - Moderation and verification
 * - Bulk operations
 * - Recommendations and insights
 */

import {
  type IBaseProperty,
  ListingType,
  PropertyStatus,
} from "@kaa/models/types";
import { AmenityService, propertyService } from "@kaa/services";
import { clearCache, logger, slugify } from "@kaa/utils";
import Elysia, { t } from "elysia";
import mongoose from "mongoose";
import * as prom from "prom-client";
// import { authPlugin } from "~/features/auth/auth.plugin";
import { accessPlugin } from "../rbac/rbac.plugin";
// import { rateLimitMiddleware } from "~/plugins/rate-limit.plugin";
// import { getRateLimitForEndpoint } from "./property.integration";
// import { accessPlugin } from "~/features/rbac/rbac.plugin";
import {
  addImageSchema,
  bulkStatusUpdateSchema,
  createPropertySchema,
  moderationSchema,
  propertyQuerySchema,
  updateAvailabilitySchema,
  updatePricingSchema,
  updatePropertySchema,
} from "./property.schema";

// ==================== METRICS ====================

const activePropertiesGauge = new prom.Gauge({
  name: "kaa_active_properties",
  help: "Current number of active properties",
});

const verifiedPropertiesGauge = new prom.Gauge({
  name: "kaa_verified_properties",
  help: "Current number of verified properties",
});

const propertyOperationsCounter = new prom.Counter({
  name: "kaa_property_operations",
  help: "Count of property operations",
  labelNames: ["operation"],
});

// ==================== CONTROLLER ====================

export const propertyController = new Elysia()
  // ==================== PUBLIC ENDPOINTS ====================

  /**
   * Get all properties with filtering
   * Public endpoint - returns only active, approved properties
   */
  .get(
    "/",
    async ({ set, query }) => {
      try {
        propertyOperationsCounter.inc({ operation: "list" });

        const filters: any = {
          page: query.page ? Number.parseInt(query.page, 10) : 1,
          limit: query.limit ? Number.parseInt(query.limit, 10) : 20,
          sortBy: query.sortBy || "createdAt",
          sortOrder: (query.sortOrder as "asc" | "desc") || "desc",
        };

        // Status filter
        if (query.status) {
          filters.status = query.status.split(",");
        }

        // Type filter
        if (query.type) {
          filters.type = query.type.split(",");
        }

        // Listing type filter
        if (query.listingType) {
          filters.listingType = query.listingType.split(",");
        }

        // Owner filters
        if (query.landlordId) filters.landlordId = query.landlordId;
        if (query.agentId) filters.agentId = query.agentId;
        if (query.memberId) filters.memberId = query.memberId;
        if (query.organizationId) filters.organizationId = query.organizationId;

        // Location filters
        if (query.county) {
          filters.county = query.county.includes(",")
            ? query.county.split(",")
            : query.county;
        }
        if (query.estate) {
          filters.estate = query.estate.includes(",")
            ? query.estate.split(",")
            : query.estate;
        }

        // Price filters
        if (query.minRent) filters.minRent = Number.parseInt(query.minRent, 10);
        if (query.maxRent) filters.maxRent = Number.parseInt(query.maxRent, 10);

        // Bedroom filters
        if (query.minBedrooms)
          filters.minBedrooms = Number.parseInt(query.minBedrooms, 10);
        if (query.maxBedrooms)
          filters.maxBedrooms = Number.parseInt(query.maxBedrooms, 10);

        // Bathroom filters
        if (query.minBathrooms)
          filters.minBathrooms = Number.parseInt(query.minBathrooms, 10);
        if (query.maxBathrooms)
          filters.maxBathrooms = Number.parseInt(query.maxBathrooms, 10);

        // Amenities filter
        if (query.amenities) {
          filters.amenities = query.amenities.split(",");
        }

        // Boolean filters
        if (query.featured) filters.featured = query.featured === "true";
        if (query.verified) filters.verified = query.verified === "true";
        if (query.isAvailable)
          filters.isAvailable = query.isAvailable === "true";

        // Moderation status
        if (query.moderationStatus) {
          filters.moderationStatus = query.moderationStatus.split(",");
        }

        // Search
        if (query.search) filters.search = query.search;

        // Tags
        if (query.tags) {
          filters.tags = query.tags.split(",");
        }

        // Location-based search
        if (query.latitude && query.longitude) {
          filters.nearLocation = {
            latitude: Number.parseFloat(query.latitude),
            longitude: Number.parseFloat(query.longitude),
            maxDistance: query.maxDistance
              ? Number.parseInt(query.maxDistance, 10)
              : 5000,
          };
        }

        // Date filters
        if (query.publishedAfter)
          filters.publishedAfter = new Date(query.publishedAfter);
        if (query.publishedBefore)
          filters.publishedBefore = new Date(query.publishedBefore);

        const result = await propertyService.getProperties(filters);

        set.status = 200;
        return {
          status: "success",
          properties: result.items,
          pagination: result.pagination,
          filters: result.filters,
          meta: result.meta,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      // beforeHandle: [
      //   rateLimitMiddleware(getRateLimitForEndpoint("GET /properties")),
      // ],
      query: propertyQuerySchema,
      detail: {
        summary: "Get all properties",
        description:
          "Get a list of properties with optional filtering and pagination",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get property by ID
   */
  .get(
    "/:id",
    async ({ set, params }) => {
      try {
        propertyOperationsCounter.inc({ operation: "get" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.getPropertyById(params.id);

        // Increment view count asynchronously
        propertyService.incrementViews(params.id).catch(console.error);

        set.status = 200;
        return {
          status: "success",
          property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get property by ID",
        description: "Get a single property by its ID",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get featured properties
   */
  .get(
    "/featured/list",
    async ({ set, query }) => {
      try {
        const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;
        const properties = await propertyService.getFeaturedProperties(limit);

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get featured properties",
        description: "Get a list of featured properties",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get verified properties
   */
  .get(
    "/verified/list",
    async ({ set, query }) => {
      try {
        const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;
        const properties = await propertyService.getVerifiedProperties(limit);

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get verified properties",
        description: "Get a list of verified properties",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get recent properties
   */
  .get(
    "/recent/list",
    async ({ set, query }) => {
      try {
        const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;
        const properties = await propertyService.getRecentProperties(limit);

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get recent properties",
        description: "Get a list of recently added properties",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get similar properties
   */
  .get(
    "/:id/similar",
    async ({ set, params, query }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const limit = query.limit ? Number.parseInt(query.limit, 10) : 5;
        const properties = await propertyService.getSimilarProperties_v2(
          params.id,
          limit
        );

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get similar properties",
        description: "Get properties similar to the specified property",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get properties near location
   */
  .get(
    "/nearby/search",
    async ({ set, query }) => {
      try {
        if (!(query.latitude && query.longitude)) {
          set.status = 400;
          return {
            status: "error",
            message: "Latitude and longitude are required",
          };
        }

        const latitude = Number.parseFloat(query.latitude);
        const longitude = Number.parseFloat(query.longitude);
        const radius = query.radius ? Number.parseInt(query.radius, 10) : 5000;
        const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;

        const properties = await propertyService.getPropertiesNearLocation(
          latitude,
          longitude,
          radius,
          limit
        );

        set.status = 200;
        return {
          status: "success",
          properties: properties.properties,
          pagination: properties.pagination,
          filters: properties.filters,
          meta: properties.meta,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        latitude: t.String(),
        longitude: t.String(),
        radius: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get properties near location",
        description: "Get properties near specified coordinates within radius",
        tags: ["properties"],
      },
    }
  )

  // ==================== AUTHENTICATED ENDPOINTS ====================

  /**
   * Create a new property
   */
  .use(accessPlugin("properties", "create"))
  .post(
    "/",
    async ({ set, body, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "create" });

        // Ensure landlord is set to current user if not provided
        /*const propertyData_ = {
          ...body,
          landlord: new mongoose.Types.ObjectId(body.landlord || user.id),
          agent: body.agent
            ? new mongoose.Types.ObjectId(body.agent)
            : undefined,
          organizationId: body.organizationId
            ? new mongoose.Types.ObjectId(body.organizationId)
            : undefined,
          memberId: new mongoose.Types.ObjectId(body.memberId || user.memberId),
          location: {
            ...body.location,
            nearbyTransport: body.location?.nearbyTransport || [],
            walkingDistanceToRoad: body.location?.walkingDistanceToRoad || 0,
            accessRoad: body.location?.accessRoad || "tarmac",
            nearbyAmenities: body.location?.nearbyAmenities || [],
          },
          pricing: {
            ...body.pricing,
            paymentFrequency: body.pricing?.paymentFrequency || "monthly",
          },
        };*/

        const propertyData: IBaseProperty = {
          title: body.title,
          description: body.description,
          type: body.type,
          slug: slugify(body.title),
          landlord: new mongoose.Types.ObjectId(user.id),
          status: PropertyStatus.DRAFT,
          aiInsights: {
            marketValue: 0,
            rentPrediction: 0,
            occupancyScore: 0,
            investmentScore: 0,
            maintenanceRisk: "low",
            lastUpdated: new Date(),
          },
          utilities: {
            electricity: {
              provider: "KPLC",
              meterNumber: "1234567890",
              averageMonthlyBill: 0,
            },
            water: {
              provider: "Nairobi Water",
              meterNumber: "1234567890",
              averageMonthlyBill: 0,
            },
            internet: {
              available: true,
              providers: ["Safaricom", "Airtel", "Vodafone"],
            },
            waste: {
              collectionDay: "Monday",
              provider: "Kahawa Waste Management",
            },
            // garbage: {
            //   collectionDay: "",
            //   provider: "",
            // },
          },
          compliance: {
            titleDeed: false,
            occupancyCertificate: false,
            fireCompliance: false,
            environmentalCompliance: false,
            countyApprovals: ["Building Permit", "Occupancy Certificate"],
            insurancePolicy: "KPLC Insurance",
            lastInspection: new Date("2025-01-01"),
          },
          listingType: ListingType.RENT,
          specifications: {
            bedrooms: body.bedrooms,
            bathrooms: body.bathrooms,
            furnished: body.furnished,
            totalArea: body.totalArea,
            condition: body.condition,
            halfBaths: 0, //  body.halfBaths,
            kitchens: 1, //  body.kitchens,
            livingRooms: 1, //  body.livingRooms,
            diningRooms: 0, //  body.diningRooms,
            floors: 1, //  body.floors,
          },
          location: {
            country: "Kenya",
            county: body.county,
            constituency: "Westlands",
            ward: "Westlands",
            estate: body.estate,
            address: {
              line1: body.address,
              town: "Nairobi",
              postalCode: "00100",
            },
            coordinates: {
              latitude: body.coordinates.latitude,
              longitude: body.coordinates.longitude,
            },
            nearbyTransport: ["matatu", "bus", "train"],
            walkingDistanceToRoad: 0,
            accessRoad: "tarmac",
            nearbyAmenities: ["school", "hospital", "shopping", "church"],
          },
          geolocation: {
            type: "Point",
            coordinates: [
              body.coordinates.longitude,
              body.coordinates.latitude,
            ],
          },
          amenities: {
            water: true,
            electricity: true,
            parking: true,
            security: true,
            generator: true,
            internet: true,
            lift: true,
            compound: true,
            gate: true,
            perimeter: true,
            cctv: true,
            garden: true,
            swimmingPool: true,
            gym: true,
            solarPower: true,
            dstv: true,
            cableTv: true,
            storeRoom: true,
            servantQuarter: true,
            studyRoom: true,
            balcony: true,
            laundry: true,
            cleaning: true,
            caretaker: true,
            borehole: true,
          },
          pricing: {
            rent: body.rent,
            deposit: body.deposit,
            serviceFee: body.serviceFee,
            currency: "KES",
            paymentFrequency: body.paymentFrequency || "monthly",
            advanceMonths: body.advanceMonths || 1,
            depositMonths: body.depositMonths || 2,
            utilitiesIncluded: {
              water: true,
              electricity: true,
              internet: true,
              garbage: true,
              security: true,
            },
            negotiable: false,
          },
          rules: {
            petsAllowed: body.petsAllowed,
            minimumLease: body.minimumLease,
            smokingAllowed: false,
            partiesAllowed: false,
            childrenAllowed: true,
            creditCheckRequired: false,
            employmentVerification: false,
            previousLandlordReference: false,
            customRules: [],
          },
          availability: {
            isAvailable: true,
            viewingDays: [
              {
                day: "monday",
                startTime: "09:00",
                endTime: "17:00",
              },
            ],
            viewingContact: {
              name: body.viewingContact.name,
              phone: body.viewingContact.phone,
              preferredMethod: "call",
            },
            availableFrom: body.availableFrom
              ? new Date(body.availableFrom)
              : undefined,
          },
          media: {
            images: body.images.map((image) => ({
              id: image,
              url: image,
              thumbnailUrl: image,
              caption: image,
              isPrimary: true,
              order: 0,
              uploadedAt: new Date(),
            })),
          },
          tags: body.tags || [],
          featured: false,
          verified: false,
          governingLaw: "Laws of Kenya",
          jurisdiction: "Kenya",
          moderationStatus: "pending",
          lastUpdatedAt: new Date(),
          isPromoted: false,
          stats: {
            views: 0,
            inquiries: 0,
            applications: 0,
            bookmarks: 0,
          },
        };

        const property = await propertyService.createProperty(propertyData);

        // Clear cache
        await clearCache("properties:*");

        set.status = 201;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("required") ? 400 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      body: createPropertySchema,
      detail: {
        summary: "Create a new property",
        description: "Create a new property listing",
        tags: ["properties"],
      },
    }
  )

  /**
   * Update a property
   */
  .use(accessPlugin("properties", "update"))
  .patch(
    "/:id",
    async ({ set, params, body, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "update" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.updateProperty(
          params.id,
          body as any,
          user.id
        );

        // Clear cache
        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          property,
        };
      } catch (error) {
        const err = error as Error;
        let status = 500;
        if (err.message.includes("not found")) status = 404;
        if (err.message.includes("permission")) status = 403;

        set.status = status;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updatePropertySchema,
      detail: {
        summary: "Update a property",
        description: "Update an existing property",
        tags: ["properties"],
      },
    }
  )

  /**
   * Delete a property (soft delete)
   */
  .use(accessPlugin("properties", "delete"))
  .delete(
    "/:id",
    async ({ set, params, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "delete" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const result = await propertyService.deleteProperty(params.id, user.id);

        if (!result) {
          set.status = 404;
          return {
            status: "error",
            message: "Property not found",
          };
        }

        // Clear cache
        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          message: "Property deleted successfully",
        };
      } catch (error) {
        const err = error as Error;
        let status = 500;
        if (err.message.includes("not found")) status = 404;
        if (err.message.includes("permission")) status = 403;

        set.status = status;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Delete a property",
        description: "Soft delete a property (marks as inactive)",
        tags: ["properties"],
      },
    }
  )

  /**
   * Check if property can be published
   */
  .get(
    "/:id/can-publish",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const result = await propertyService.canPublish(params.id);

        set.status = 200;
        return {
          status: "success",
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Check if property can be published",
        description: "Check if property meets requirements for publishing",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get property statistics
   */
  .get(
    "/:id/stats",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const stats = await propertyService.getPropertyStats(params.id);

        if (!stats) {
          set.status = 404;
          return {
            status: "error",
            message: "Property not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: stats,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get property statistics",
        description: "Get engagement and performance statistics",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get pricing insights for property
   */
  .get(
    "/:id/pricing-insights",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const insights = await propertyService.getPricingInsights(params.id);

        if (!insights) {
          set.status = 404;
          return {
            status: "error",
            message: "Property not found or insufficient comparable data",
          };
        }

        set.status = 200;
        return {
          status: "success",
          data: insights,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Get pricing insights",
        description: "Get market pricing insights for the property area",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get personalized property recommendations
   */
  .get(
    "/recommendations/for-me",
    async ({ set, user, query }) => {
      try {
        const limit = query.limit ? Number.parseInt(query.limit, 10) : 10;
        const properties = await propertyService.getRecommendations(
          user.id,
          limit
        );

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get personalized recommendations",
        description: "Get property recommendations based on user preferences",
        tags: ["properties"],
      },
    }
  )

  /**
   * Update property pricing
   */
  .patch(
    "/:id/pricing",
    async ({ set, params, body }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const { reason, ...pricingData } = body;
        const property = await propertyService.updatePropertyPricing(
          params.id,
          pricingData as any,
          reason
        );

        await clearCache(`property:${params.id}`);

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updatePricingSchema,
      detail: {
        summary: "Update property pricing",
        description: "Update property pricing with history tracking",
        tags: ["properties"],
      },
    }
  )

  /**
   * Add property image
   */
  .post(
    "/:id/images",
    async ({ set, params, body }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.addPropertyImage(
          params.id,
          body
        );

        await clearCache(`property:${params.id}`);

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: addImageSchema,
      detail: {
        summary: "Add property image",
        description: "Add a new image to property media",
        tags: ["properties"],
      },
    }
  )

  /**
   * Remove property image
   */
  .delete(
    "/:id/images/:imageId",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.removePropertyImage(
          params.id,
          params.imageId
        );

        await clearCache(`property:${params.id}`);

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
        imageId: t.String(),
      }),
      detail: {
        summary: "Remove property image",
        description: "Remove an image from property media",
        tags: ["properties"],
      },
    }
  )

  /**
   * Update property availability
   */
  .patch(
    "/:id/availability",
    async ({ set, params, body }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const availableFrom = body.availableFrom
          ? new Date(body.availableFrom)
          : undefined;

        const property = await propertyService.updatePropertyAvailability(
          params.id,
          body.isAvailable,
          availableFrom
        );

        await clearCache(`property:${params.id}`);

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: updateAvailabilitySchema,
      detail: {
        summary: "Update property availability",
        description: "Update property availability status",
        tags: ["properties"],
      },
    }
  )

  /**
   * Increment property inquiry count
   */
  .post(
    "/:id/inquire",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        await propertyService.incrementInquiries(params.id);

        set.status = 200;
        return {
          status: "success",
          message: "Inquiry recorded",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Record property inquiry",
        description: "Increment property inquiry count",
        tags: ["properties"],
      },
    }
  )

  /**
   * Bookmark a property
   */
  .post(
    "/:id/bookmark",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        await propertyService.incrementBookmarks(params.id);

        set.status = 200;
        return {
          status: "success",
          message: "Property bookmarked",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Bookmark property",
        description: "Add property to bookmarks",
        tags: ["properties"],
      },
    }
  )

  // ==================== ADMIN/MODERATOR ENDPOINTS ====================

  /**
   * Get properties pending moderation
   */
  //   .use(accessPlugin({ requiredPermissions: ["properties:moderate"] }))
  .get(
    "/moderation/pending",
    async ({ set }) => {
      try {
        const properties =
          await propertyService.getPropertiesPendingModeration();

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      detail: {
        summary: "Get properties pending moderation",
        description: "Get all properties awaiting moderation",
        tags: ["properties"],
      },
    }
  )

  /**
   * Approve a property
   */
  .post(
    "/:id/approve",
    async ({ set, params, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "approve" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.approveProperty(
          params.id,
          user.id
        );

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        // Update metrics
        activePropertiesGauge.inc();

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Approve property",
        description: "Approve a pending property",
        tags: ["properties"],
      },
    }
  )

  /**
   * Reject a property
   */
  .post(
    "/:id/reject",
    async ({ set, params, body, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "reject" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        if (!body.reason) {
          set.status = 400;
          return {
            status: "error",
            message: "Rejection reason is required",
          };
        }

        const property = await propertyService.rejectProperty(
          params.id,
          user.id,
          body.reason
        );

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: moderationSchema,
      detail: {
        summary: "Reject property",
        description: "Reject a pending property with reason",
        tags: ["properties"],
      },
    }
  )

  /**
   * Flag a property
   */
  .post(
    "/:id/flag",
    async ({ set, params, body }) => {
      try {
        propertyOperationsCounter.inc({ operation: "flag" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        if (!body.reason) {
          set.status = 400;
          return {
            status: "error",
            message: "Flag reason is required",
          };
        }

        const property = await propertyService.flagProperty(
          params.id,
          body.reason
        );

        await clearCache(`property:${params.id}`);

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: moderationSchema,
      detail: {
        summary: "Flag property",
        description: "Flag a property for review",
        tags: ["properties"],
      },
    }
  )

  /**
   * Verify a property
   */
  .post(
    "/:id/verify",
    async ({ set, params, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "verify" });

        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.verifyProperty(
          params.id,
          user.id
        );

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        // Update metrics
        verifiedPropertiesGauge.inc();

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Verify property",
        description: "Mark property as verified",
        tags: ["properties"],
      },
    }
  )

  /**
   * Unverify a property
   */
  .post(
    "/:id/unverify",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.unverifyProperty(params.id);

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        // Update metrics
        verifiedPropertiesGauge.dec();

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Unverify property",
        description: "Remove verified status from property",
        tags: ["properties"],
      },
    }
  )

  /**
   * Feature a property
   */
  .post(
    "/:id/feature",
    async ({ set, params, query }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const duration = query.duration
          ? Number.parseInt(query.duration, 10)
          : undefined;

        const property = await propertyService.featureProperty(
          params.id,
          duration
        );

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        duration: t.Optional(t.String()),
      }),
      detail: {
        summary: "Feature property",
        description: "Mark property as featured with optional duration",
        tags: ["properties"],
      },
    }
  )

  /**
   * Unfeature a property
   */
  .post(
    "/:id/unfeature",
    async ({ set, params }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(params.id)) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid property ID",
          };
        }

        const property = await propertyService.unfeatureProperty(params.id);

        await clearCache(`property:${params.id}`);
        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          data: property,
        };
      } catch (error) {
        const err = error as Error;
        set.status = err.message.includes("not found") ? 404 : 500;
        return {
          status: "error",
          message: err.message,
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        summary: "Unfeature property",
        description: "Remove featured status from property",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get property analytics
   */
  .get(
    "/analytics/overview",
    async ({ set, query }) => {
      try {
        const filters: any = {};

        if (query.landlordId) filters.landlordId = query.landlordId;
        if (query.organizationId) filters.organizationId = query.organizationId;
        if (query.status) filters.status = query.status;

        const analytics = await propertyService.getPropertyAnalytics(filters);

        set.status = 200;
        return {
          status: "success",
          data: analytics,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        landlordId: t.Optional(t.String()),
        organizationId: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get property analytics",
        description: "Get comprehensive property analytics and statistics",
        tags: ["properties"],
      },
    }
  )

  /**
   * Bulk update property status
   */
  .patch(
    "/bulk/status",
    async ({ set, body, user }) => {
      try {
        propertyOperationsCounter.inc({ operation: "bulk_update" });

        const result = await propertyService.bulkUpdateStatus(
          body.propertyIds,
          body.status,
          user.id,
          user.role || "user"
        );

        await clearCache("properties:*");

        set.status = 200;
        return {
          status: "success",
          data: result,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      body: bulkStatusUpdateSchema,
      detail: {
        summary: "Bulk update property status",
        description: "Update status for multiple properties at once",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get expiring properties
   */
  .get(
    "/expiring/list",
    async ({ set, query }) => {
      try {
        const daysAhead = query.days ? Number.parseInt(query.days, 10) : 30;
        const properties =
          await propertyService.getExpiringProperties(daysAhead);

        set.status = 200;
        return {
          status: "success",
          data: properties,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: (error as Error).message,
        };
      }
    },
    {
      query: t.Object({
        days: t.Optional(t.String()),
      }),
      detail: {
        summary: "Get expiring properties",
        description: "Get properties expiring within specified days",
        tags: ["properties"],
      },
    }
  )

  /**
   * Get nearby amenities
   * GET /properties/nearby-amenities?lat=0&lng=0&radius=2000
   */
  .get(
    "/nearby-amenities",
    async ({ query, set }) => {
      try {
        const { lat, lng, radius = 2000 } = query;

        // const amenities = await propertyService.getNearbyAmenities(lat, lng, radius);
        const amenities = await AmenityService.findNearbyAmenities({
          latitude: Number(lat),
          longitude: Number(lng),
          radius: Number(radius),
        });

        set.status = 200;
        return {
          status: "success",
          amenities,
        };
      } catch (error) {
        logger.error("Error in nearby amenities endpoint:", error);
        set.status = 500;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Internal server error",
        };
      }
    },
    {
      query: t.Object({
        lat: t.Number(),
        lng: t.Number(),
        radius: t.Optional(t.Number()), // { minimum: 0.1, maximum: 10, default: 2 }
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          amenities: t.Array(t.Any()),
        }),
        500: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["properties"],
        summary: "Get nearby amenities",
        description: "Get nearby amenities",
      },
    }
  )

  /**
   * Get property with nearby amenities
   * GET /properties/{id}/with-amenities?radius=2
   */
  .get(
    "/:id/with-amenities",
    async ({ params, query, set }) => {
      try {
        const { id } = params;
        const { radius = "2" } = query;

        const property = await propertyService.getPropertyWithAmenities(
          id,
          Number(radius)
        );

        if (!property) {
          set.status = 404;
          return {
            status: "error",
            message: "Property not found",
          };
        }

        set.status = 200;
        return {
          status: "success",
          property: property as any,
        };
      } catch (error) {
        logger.error("Error in property with amenities endpoint:", error);
        set.status = 500;
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
      query: t.Object({
        radius: t.Optional(t.Number({ minimum: 0.1, maximum: 10, default: 2 })),
      }),
      response: {
        200: t.Object({
          status: t.Literal("success"),
          property: t.Object(t.Any()), // Property with amenities data
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
        tags: ["properties"],
        summary: "Get property with nearby amenities",
        description:
          "Get property details enhanced with nearby amenities and amenity score",
      },
    }
  );
