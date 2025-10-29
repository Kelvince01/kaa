import {
  type SearchQuery,
  searchAnalyticsService,
  typesenseService,
} from "@kaa/services";
import { logger } from "@kaa/utils";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  searchMiddleware,
  searchRateLimitMiddleware,
  searchValidationMiddleware,
} from "./search.middleware";

/**
 * Advanced search controller with Typesense integration
 */
export const advancedSearchController = new Elysia({
  detail: {
    tags: ["advanced-search"],
  },
})
  .use(searchRateLimitMiddleware)
  .use(searchValidationMiddleware)
  .use(searchMiddleware)
  .group("/advanced-search", (app) =>
    app
      .get(
        "/properties",
        async ({ set, query }) => {
          try {
            const {
              q,
              lat,
              lon,
              distance,
              propertyType,
              minPrice,
              maxPrice,
              bedrooms,
              bathrooms,
              furnished,
              petsAllowed,
              features,
              sortBy,
              sortOrder = "desc",
              page = 1,
              limit = 10,
            } = query;

            // Build search query
            const searchQuery: SearchQuery = {
              query: q,
              pagination: { page, limit },
            };

            // Add location-based search
            if (lat && lon) {
              searchQuery.location = {
                lat: Number(lat),
                lon: Number(lon),
                distance: distance || "10km",
              };
            }

            // Add filters
            searchQuery.filters = {};

            if (propertyType) {
              searchQuery.filters.propertyType = Array.isArray(propertyType)
                ? propertyType
                : [propertyType];
            }

            if (minPrice || maxPrice) {
              searchQuery.filters.priceRange = {};
              if (minPrice)
                searchQuery.filters.priceRange.min = Number(minPrice);
              if (maxPrice)
                searchQuery.filters.priceRange.max = Number(maxPrice);
            }

            if (bedrooms) {
              searchQuery.filters.bedrooms = Array.isArray(bedrooms)
                ? bedrooms.map(Number)
                : [Number(bedrooms)];
            }

            if (bathrooms) {
              searchQuery.filters.bathrooms = Array.isArray(bathrooms)
                ? bathrooms.map(Number)
                : [Number(bathrooms)];
            }

            if (furnished !== undefined) {
              searchQuery.filters.furnished = String(furnished) === "true";
            }

            if (petsAllowed !== undefined) {
              searchQuery.filters.petsAllowed = String(petsAllowed) === "true";
            }

            if (features) {
              searchQuery.filters.features = Array.isArray(features)
                ? features
                : [features];
            }

            // Add sorting
            if (sortBy) {
              searchQuery.sort = [
                { field: sortBy, order: sortOrder as "asc" | "desc" },
              ];
            }

            const results =
              await typesenseService.searchProperties(searchQuery);

            set.status = 200;
            return {
              status: "success",
              data: {
                properties: results.hits.map((hit) => ({
                  ...hit.document,
                  _id: hit.id,
                  _score: hit.score,
                  highlight: hit.highlight,
                  geo_distance_meters: hit.geo_distance_meters,
                })),
                pagination: {
                  total: results.total,
                  page,
                  limit,
                  pages: Math.ceil(results.total / limit),
                },
                facets: results.facets,
              },
            };
          } catch (error) {
            logger.error("Advanced property search failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Search service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            q: t.Optional(t.String()),
            lat: t.Optional(t.Number()),
            lon: t.Optional(t.Number()),
            distance: t.Optional(t.String()),
            propertyType: t.Optional(
              t.Union([t.String(), t.Array(t.String())])
            ),
            minPrice: t.Optional(t.Number()),
            maxPrice: t.Optional(t.Number()),
            bedrooms: t.Optional(t.Union([t.Number(), t.Array(t.Number())])),
            bathrooms: t.Optional(t.Union([t.Number(), t.Array(t.Number())])),
            furnished: t.Optional(t.Boolean()),
            petsAllowed: t.Optional(t.Boolean()),
            features: t.Optional(t.Union([t.String(), t.Array(t.String())])),
            sortBy: t.Optional(t.String()),
            sortOrder: t.Optional(
              t.Union([t.Literal("asc"), t.Literal("desc")])
            ),
            page: t.Optional(t.Number()),
            limit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Advanced property search with Typesense",
            description:
              "Search properties using advanced filters, geo-location, and full-text search capabilities",
          },
        }
      )
      .get(
        "/contractors",
        async ({ set, query }) => {
          try {
            const {
              q,
              lat,
              lon,
              distance,
              specialties,
              serviceAreas,
              minRating,
              emergencyAvailable,
              minRate,
              maxRate,
              sortBy,
              sortOrder = "desc",
              page = 1,
              limit = 10,
            } = query;

            // Build search query
            const searchQuery: SearchQuery & {
              filters?: {
                specialties?: string[];
                serviceAreas?: string[];
                minRating?: number;
                emergencyAvailable?: boolean;
                priceRange?: { min?: number; max?: number };
              };
            } = {
              query: q,
              pagination: { page, limit },
            };

            // Add location-based search
            if (lat && lon) {
              searchQuery.location = {
                lat: Number(lat),
                lon: Number(lon),
                distance: distance || "50km",
              };
            }

            // Add filters
            searchQuery.filters = {};

            if (specialties) {
              searchQuery.filters.specialties = Array.isArray(specialties)
                ? specialties
                : [specialties];
            }

            if (serviceAreas) {
              searchQuery.filters.serviceAreas = Array.isArray(serviceAreas)
                ? serviceAreas
                : [serviceAreas];
            }

            if (minRating) {
              searchQuery.filters.minRating = Number(minRating);
            }

            if (emergencyAvailable !== undefined) {
              searchQuery.filters.emergencyAvailable =
                String(emergencyAvailable) === "true";
            }

            if (minRate || maxRate) {
              searchQuery.filters.priceRange = {};
              if (minRate) searchQuery.filters.priceRange.min = Number(minRate);
              if (maxRate) searchQuery.filters.priceRange.max = Number(maxRate);
            }

            // Add sorting
            if (sortBy) {
              searchQuery.sort = [
                { field: sortBy, order: sortOrder as "asc" | "desc" },
              ];
            }

            const results =
              await typesenseService.searchContractors(searchQuery);

            set.status = 200;
            return {
              status: "success",
              data: {
                contractors: results.hits.map((hit) => ({
                  ...hit.document,
                  _id: hit.id,
                  _score: hit.score,
                  highlight: hit.highlight,
                  geo_distance_meters: hit.geo_distance_meters,
                })),
                pagination: {
                  total: results.total,
                  page,
                  limit,
                  pages: Math.ceil(results.total / limit),
                },
                facets: results.facets,
              },
            };
          } catch (error) {
            logger.error("Advanced contractor search failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Search service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            q: t.Optional(t.String()),
            lat: t.Optional(t.Number()),
            lon: t.Optional(t.Number()),
            distance: t.Optional(t.String()),
            specialties: t.Optional(t.Union([t.String(), t.Array(t.String())])),
            serviceAreas: t.Optional(
              t.Union([t.String(), t.Array(t.String())])
            ),
            minRating: t.Optional(t.Number()),
            emergencyAvailable: t.Optional(t.Boolean()),
            minRate: t.Optional(t.Number()),
            maxRate: t.Optional(t.Number()),
            sortBy: t.Optional(t.String()),
            sortOrder: t.Optional(
              t.Union([t.Literal("asc"), t.Literal("desc")])
            ),
            page: t.Optional(t.Number()),
            limit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Advanced contractor search with Typesense",
            description:
              "Search contractors using advanced filters, geo-location, and specialties",
          },
        }
      )
      .get(
        "/suggestions",
        async ({ set, query }) => {
          try {
            const { q, type = "properties" } = query;

            if (!q || q.length < 2) {
              set.status = 200;
              return {
                status: "success",
                data: { suggestions: [] },
              };
            }

            const suggestions = await typesenseService.getSuggestions(
              q,
              type as "properties" | "contractors"
            );

            set.status = 200;
            return {
              status: "success",
              data: { suggestions },
            };
          } catch (error) {
            logger.error("Search suggestions failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Suggestions service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            q: t.String(),
            type: t.Optional(
              t.Union([t.Literal("properties"), t.Literal("contractors")])
            ),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Get search suggestions",
            description: "Get autocomplete suggestions for search queries",
          },
        }
      )
      .get(
        "/nearby",
        async ({ set, query }) => {
          try {
            const {
              lat,
              lon,
              distance = "5km",
              type = "properties",
              limit = 20,
            } = query;

            if (!(lat && lon)) {
              set.status = 400;
              return {
                status: "error",
                message: "Latitude and longitude are required",
              };
            }

            const searchQuery: SearchQuery = {
              location: {
                lat: Number(lat),
                lon: Number(lon),
                distance,
              },
              pagination: { page: 1, limit: Number(limit) },
            };

            let results: any;
            if (type === "contractors") {
              results = await typesenseService.searchContractors(searchQuery);
            } else {
              results = await typesenseService.searchProperties(searchQuery);
            }

            set.status = 200;
            return {
              status: "success",
              data: {
                items: results.hits.map((hit: any) => ({
                  ...hit.document,
                  _id: hit.id,
                  _score: hit.score,
                  geo_distance_meters: hit.geo_distance_meters,
                })),
                total: results.total,
                center: { lat: Number(lat), lon: Number(lon) },
                radius: distance,
              },
            };
          } catch (error) {
            logger.error("Nearby search failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Nearby search service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            lat: t.Number(),
            lon: t.Number(),
            distance: t.Optional(t.String()),
            type: t.Optional(
              t.Union([t.Literal("properties"), t.Literal("contractors")])
            ),
            limit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Find nearby properties or contractors",
            description:
              "Search for properties or contractors within a specified distance from coordinates",
          },
        }
      )
      .get(
        "/analytics",
        ({ set, query }) => {
          try {
            const { hours = 24 } = query;
            const analytics = searchAnalyticsService.getAnalytics(
              Number(hours)
            );

            set.status = 200;
            return {
              status: "success",
              data: analytics,
            };
          } catch (error) {
            logger.error("Search analytics failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Analytics service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            hours: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Get search analytics",
            description:
              "Get search analytics and performance metrics for a specified time period",
          },
        }
      )
      .get(
        "/trending",
        ({ set, query }) => {
          try {
            const { limit = 10 } = query;
            const analytics = searchAnalyticsService.getAnalytics(168); // Last 7 days

            const trending = {
              queries: analytics.popularQueries.slice(0, Number(limit)),
              locations: analytics.searchesByLocation.slice(0, Number(limit)),
              filters: analytics.popularFilters.slice(0, Number(limit)),
            };

            set.status = 200;
            return {
              status: "success",
              data: trending,
            };
          } catch (error) {
            logger.error("Trending search data failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Trending data service temporarily unavailable",
            };
          }
        },
        {
          query: t.Object({
            limit: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["advanced-search"],
            summary: "Get trending search data",
            description: "Get trending search queries, locations, and filters",
          },
        }
      )
      .use(authPlugin)
      .post(
        "/reindex",
        ({ set, user }) => {
          try {
            // Only allow admin users to trigger reindexing
            if (String(user.role) !== "admin") {
              set.status = 403;
              return {
                status: "error",
                message: "Insufficient permissions",
              };
            }

            // Trigger reindexing in background
            typesenseService.reindexAll().catch((error) => {
              logger.error("Background reindexing failed:", error);
            });

            set.status = 202;
            return {
              status: "success",
              message: "Reindexing started in background",
            };
          } catch (error) {
            logger.error("Reindex trigger failed:", error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to trigger reindexing",
            };
          }
        },
        {
          detail: {
            tags: ["advanced-search"],
            summary: "Trigger Typesense reindexing",
            description:
              "Reindex all properties and contractors in Typesense (Admin only)",
            security: [{ bearerAuth: [] }],
          },
        }
      )
      .get(
        "/health",
        ({ set }) => {
          try {
            const isHealthy = typesenseService.isHealthy();

            set.status = isHealthy ? 200 : 503;
            return {
              status: isHealthy ? "healthy" : "unhealthy",
              service: "typesense",
              timestamp: new Date().toISOString(),
            };
          } catch (error) {
            set.status = 503;
            return {
              status: "unhealthy",
              service: "typesense",
              error: "Service check failed",
              timestamp: new Date().toISOString(),
            };
          }
        },
        {
          detail: {
            tags: ["advanced-search"],
            summary: "Check Typesense health",
            description: "Check if Typesense service is available and healthy",
          },
        }
      )
  );
