import { Elysia } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";
import { rateLimitPlugin } from "~/plugins/rate-limit.plugin";
import { LocationsController } from "./location.controller";

const locationsController = new LocationsController();

export const locationsRoutes = new Elysia({ prefix: "/locations" })
  .use(authPlugin)
  .use(rateLimitPlugin())

  // Create location (admin only)
  .post("/", locationsController.createLocation.bind(locationsController), {
    // beforeHandle: ({ requireAdmin }) => requireAdmin(),
    detail: {
      tags: ["Locations"],
      summary: "Create location",
      description: "Create a new location (admin only)",
    },
  })

  // Get location by ID
  .get(
    "/:locationId",
    locationsController.getLocation.bind(locationsController),
    {
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
    locationsController.searchLocations.bind(locationsController),
    {
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
    locationsController.getNearbyLocations.bind(locationsController),
    {
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
    locationsController.geocodeAddress.bind(locationsController),
    {
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
    locationsController.reverseGeocode.bind(locationsController),
    {
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
    locationsController.getLocationSuggestions.bind(locationsController),
    {
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
    locationsController.updateLocation.bind(locationsController),
    {
      // beforeHandle: ({ requireAdmin }) => requireAdmin(),
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
    locationsController.deleteLocation.bind(locationsController),
    {
      // beforeHandle: ({ requireAdmin }) => requireAdmin(),
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
    locationsController.getLocationAnalytics.bind(locationsController),
    {
      // beforeHandle: ({ requireAuth }) => requireAuth(),
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
    locationsController.getKenyaCounties.bind(locationsController),
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
    locationsController.getPlacesByCounty.bind(locationsController),
    {
      detail: {
        tags: ["Locations", "Kenya"],
        summary: "Get places by county",
        description: "Get all places within a specific Kenyan county",
      },
    }
  );
