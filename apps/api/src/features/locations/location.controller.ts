import { KenyanCounty } from "@kaa/models/types";
import { locationService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rateLimitPlugin } from "~/plugins/rate-limit.plugin";
import { LocationSchema, LocationSearchSchema } from "./location.schema";

export const locationsController = new Elysia({ prefix: "/locations" })
  .use(authPlugin)
  .use(rateLimitPlugin())

  // Create location (admin only)
  .post(
    "/",
    async ({ set, body }) => {
      try {
        const location = await locationService.createLocation(body as any);
        return { status: "success", data: location };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to create location",
          details: error.message,
        };
      }
    },
    {
      // beforeHandle: ({ requireAdmin }) => requireAdmin(),
      body: LocationSchema,
      detail: {
        tags: ["Locations"],
        summary: "Create location",
        description: "Create a new location (admin only)",
      },
    }
  )

  // Get location by ID
  .get(
    "/:locationId",
    async ({ set, params }) => {
      try {
        const { locationId } = params;

        const location = await locationService.getLocation(locationId);
        if (!location) {
          set.status = 404;
          return { status: "error", error: "Location not found" };
        }

        return { status: "success", data: location };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get location",
          details: error.message,
        };
      }
    },
    {
      params: t.Object({
        locationId: t.String(),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Get location",
        description: "Get location details by ID",
      },
    }
  )

  // Search locations
  .get(
    "/search",
    async ({ set, query }) => {
      try {
        const results = await locationService.searchLocations(query);
        return { status: "success", data: results };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to search locations",
          details: error.message,
        };
      }
    },
    {
      query: LocationSearchSchema,
      detail: {
        tags: ["Locations"],
        summary: "Search locations",
        description: "Search locations with filters",
      },
    }
  )

  // Get nearby locations
  .get(
    "/nearby",
    async ({ set, query }) => {
      try {
        const { latitude, longitude, radius = "1000", limit = "20" } = query;

        if (!(latitude && longitude)) {
          set.status = 400;
          return {
            status: "error",
            error: "Latitude and longitude are required",
          };
        }

        const results = await locationService.getNearbyLocations(
          Number.parseFloat(latitude),
          Number.parseFloat(longitude),
          Number.parseInt(radius, 10),
          Number.parseInt(limit, 10)
        );

        return { status: "success", data: results };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get nearby locations",
          details: error.message,
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
        tags: ["Locations"],
        summary: "Get nearby locations",
        description: "Get locations within a specified radius",
      },
    }
  )

  // Geocode address
  .get(
    "/geocode",
    async ({ set, query }) => {
      try {
        const { address } = query;

        if (!address) {
          set.status = 400;
          return { status: "error", error: "Address is required" };
        }

        const result = await locationService.geocodeAddress(address);
        return { status: "success", data: result };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to geocode address",
          details: error.message,
        };
      }
    },
    {
      query: t.Object({
        address: t.String(),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Geocode address",
        description: "Convert address to coordinates",
      },
    }
  )

  // Reverse geocode
  .get(
    "/reverse-geocode",
    async ({ set, query }) => {
      try {
        const { latitude, longitude } = query;

        if (!(latitude && longitude)) {
          set.status = 400;
          return { error: "Latitude and longitude are required" };
        }

        const result = await locationService.reverseGeocode(
          Number.parseFloat(latitude),
          Number.parseFloat(longitude)
        );

        return { status: "success", data: result };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to reverse geocode",
          details: error.message,
        };
      }
    },
    {
      query: t.Object({
        latitude: t.String(),
        longitude: t.String(),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Reverse geocode",
        description: "Convert coordinates to address",
      },
    }
  )

  // Get location suggestions
  .get(
    "/suggestions",
    async ({ set, query: Query }) => {
      try {
        const { query, limit = "10" } = Query;

        if (!query) {
          set.status = 400;
          return { error: "Query parameter is required" };
        }

        // const suggestions = await locationService.getLocationSuggestions(
        //   query,
        //   Number.parseInt(limit, 10)
        // );

        const suggestions = await locationService.getPopularLocations(
          // query,
          Number.parseInt(limit, 10)
        );

        return { status: "success", data: suggestions };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get location suggestions",
          details: error.message,
        };
      }
    },
    {
      query: t.Object({
        query: t.String(),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Locations"],
        summary: "Get location suggestions",
        description: "Get autocomplete suggestions for locations",
      },
    }
  )

  // Update location (admin only)
  .put(
    "/:locationId",
    async ({ set, params, body }) => {
      try {
        const { locationId } = params;

        const location = await locationService.updateLocation(
          locationId,
          body as any
        );

        if (!location) {
          set.status = 404;
          return { status: "error", message: "Location not found" };
        }

        return { status: "success", data: location };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to update location",
          details: error.message,
        };
      }
    },
    {
      // beforeHandle: ({ requireAdmin }) => requireAdmin(),
      params: t.Object({ locationId: t.String() }),
      body: LocationSchema,
      detail: {
        tags: ["Locations"],
        summary: "Update location",
        description: "Update location details (admin only)",
      },
    }
  )

  // Delete location (admin only)
  .delete(
    "/:locationId",
    async ({ set, params }) => {
      try {
        const { locationId } = params;

        await locationService.deleteLocation(locationId);
        return { status: "success", message: "Location deleted successfully" };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to delete location",
          details: error.message,
        };
      }
    },
    {
      // beforeHandle: ({ requireAdmin }) => requireAdmin(),
      params: t.Object({ locationId: t.String() }),
      detail: {
        tags: ["Locations"],
        summary: "Delete location",
        description: "Delete a location (admin only)",
      },
    }
  )

  // Get location analytics
  .get(
    "/:locationId/analytics",
    async ({ set, params }) => {
      try {
        const { locationId } = params;

        const analytics =
          await locationService.getLocationAnalytics(locationId);
        return { status: "success", data: analytics };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get location analytics",
          details: error.message,
        };
      }
    },
    {
      // beforeHandle: ({ requireAuth }) => requireAuth(),
      params: t.Object({ locationId: t.String() }),
      detail: {
        tags: ["Locations"],
        summary: "Get location analytics",
        description: "Get analytics for a specific location",
      },
    }
  )

  // Kenya-specific routes
  .get(
    "/kenya/counties",
    async ({ set }) => {
      try {
        // const counties = await locationService.getKenyaCounties();
        const counties = await locationService.getLocationsByCounty(
          KenyanCounty.NAIROBI
        );
        return { status: "success", data: counties };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get Kenya counties",
          details: error.message,
        };
      }
    },
    {
      detail: {
        tags: ["Locations", "Kenya"],
        summary: "Get Kenya counties",
        description: "Get all counties in Kenya",
      },
    }
  )

  .get(
    "/kenya/counties/:county/places",
    async ({ set, params }) => {
      try {
        const { county } = params;

        // const places = await locationService.getPlacesByCounty(county);
        const places = await locationService.getLocationsByCounty(county);
        return { status: "success", data: places };
      } catch (error: any) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get places by county",
          details: error.message,
        };
      }
    },
    {
      params: t.Object({ county: t.Enum(KenyanCounty) }),
      detail: {
        tags: ["Locations", "Kenya"],
        summary: "Get places by county",
        description: "Get all places within a specific Kenyan county",
      },
    }
  );
