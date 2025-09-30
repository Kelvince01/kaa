import { KenyanCounty } from "@kaa/models/types";
import { locationService } from "@kaa/services";
import type { Context } from "elysia";
import { LocationSchema, LocationSearchSchema } from "./location.schema";

export class LocationsController {
  /**
   * @description Create a new location
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async createLocation(context: Context): Promise<any> {
    const validation = LocationSchema.safeParse(context.body);

    if (!validation.success) {
      context.set.status = 400;
      return {
        error: "Invalid location data",
        details: validation.error.flatten(),
      };
    }

    try {
      const location = await locationService.createLocation(
        validation.data as any
      );
      return { success: true, data: location };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to create location", details: error.message };
    }
  }

  /**
   * @description Get location by ID
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getLocation(context: Context): Promise<any> {
    try {
      const { locationId } = context.params as { locationId: string };

      if (!locationId) {
        context.set.status = 400;
        return { error: "Location ID is required" };
      }

      const location = await locationService.getLocation(locationId);
      if (!location) {
        context.set.status = 404;
        return { error: "Location not found" };
      }

      return { success: true, data: location };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to get location", details: error.message };
    }
  }

  /**
   * @description Search locations
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async searchLocations(context: Context): Promise<any> {
    const validation = LocationSearchSchema.safeParse(context.query);

    if (!validation.success) {
      context.set.status = 400;
      return {
        error: "Invalid search parameters",
        details: validation.error.flatten(),
      };
    }

    try {
      const results = await locationService.searchLocations(validation.data);
      return { success: true, data: results };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to search locations", details: error.message };
    }
  }

  /**
   * @description Get nearby locations
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getNearbyLocations(context: Context): Promise<any> {
    try {
      const {
        latitude,
        longitude,
        radius = "1000",
        limit = "20",
      } = context.query as {
        latitude: string;
        longitude: string;
        radius?: string;
        limit?: string;
      };

      if (!(latitude && longitude)) {
        context.set.status = 400;
        return { error: "Latitude and longitude are required" };
      }

      const results = await locationService.getNearbyLocations(
        Number.parseFloat(latitude),
        Number.parseFloat(longitude),
        Number.parseInt(radius, 10),
        Number.parseInt(limit, 10)
      );

      return { success: true, data: results };
    } catch (error: any) {
      context.set.status = 500;
      return {
        error: "Failed to get nearby locations",
        details: error.message,
      };
    }
  }

  /**
   * @description Geocode an address
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async geocodeAddress(context: Context): Promise<any> {
    try {
      const { address } = context.query as { address: string };

      if (!address) {
        context.set.status = 400;
        return { error: "Address is required" };
      }

      const result = await locationService.geocodeAddress(address);
      return { success: true, data: result };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to geocode address", details: error.message };
    }
  }

  /**
   * @description Reverse geocode coordinates
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async reverseGeocode(context: Context): Promise<any> {
    try {
      const { latitude, longitude } = context.query as {
        latitude: string;
        longitude: string;
      };

      if (!(latitude && longitude)) {
        context.set.status = 400;
        return { error: "Latitude and longitude are required" };
      }

      const result = await locationService.reverseGeocode(
        Number.parseFloat(latitude),
        Number.parseFloat(longitude)
      );

      return { success: true, data: result };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to reverse geocode", details: error.message };
    }
  }

  /**
   * @description Get location suggestions (autocomplete)
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getLocationSuggestions(context: Context): Promise<any> {
    try {
      const { query, limit = "10" } = context.query as {
        query: string;
        limit?: string;
      };

      if (!query) {
        context.set.status = 400;
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

      return { success: true, data: suggestions };
    } catch (error: any) {
      context.set.status = 500;
      return {
        error: "Failed to get location suggestions",
        details: error.message,
      };
    }
  }

  /**
   * @description Get location analytics
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getLocationAnalytics(context: Context): Promise<any> {
    try {
      const { locationId } = context.params as { locationId: string };

      if (!locationId) {
        context.set.status = 400;
        return { error: "Location ID is required" };
      }

      const analytics = await locationService.getLocationAnalytics(locationId);
      return { success: true, data: analytics };
    } catch (error: any) {
      context.set.status = 500;
      return {
        error: "Failed to get location analytics",
        details: error.message,
      };
    }
  }

  /**
   * @description Update location
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async updateLocation(context: Context): Promise<any> {
    try {
      const { locationId } = context.params as { locationId: string };

      if (!locationId) {
        context.set.status = 400;
        return { error: "Location ID is required" };
      }

      const validation = LocationSchema.partial().safeParse(context.body);
      if (!validation.success) {
        context.set.status = 400;
        return {
          error: "Invalid location data",
          details: validation.error.flatten(),
        };
      }

      const location = await locationService.updateLocation(
        locationId,
        validation.data as any
      );
      if (!location) {
        context.set.status = 404;
        return { error: "Location not found" };
      }

      return { success: true, data: location };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to update location", details: error.message };
    }
  }

  /**
   * @description Delete location
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async deleteLocation(context: Context): Promise<any> {
    try {
      const { locationId } = context.params as { locationId: string };

      if (!locationId) {
        context.set.status = 400;
        return { error: "Location ID is required" };
      }

      await locationService.deleteLocation(locationId);
      return { success: true, message: "Location deleted successfully" };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to delete location", details: error.message };
    }
  }

  /**
   * @description Get all Kenya counties
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getKenyaCounties(context: Context): Promise<any> {
    try {
      // const counties = await locationService.getKenyaCounties();
      const counties = await locationService.getLocationsByCounty(
        KenyanCounty.NAIROBI
      );
      return { success: true, data: counties };
    } catch (error: any) {
      context.set.status = 500;
      return { error: "Failed to get Kenya counties", details: error.message };
    }
  }

  /**
   * @description Get places by county
   * @param {Context} context
   * @returns {Promise<any>}
   */
  async getPlacesByCounty(context: Context): Promise<any> {
    try {
      const { county } = context.params as { county: KenyanCounty };

      if (!county) {
        context.set.status = 400;
        return { error: "County is required" };
      }

      // const places = await locationService.getPlacesByCounty(county);
      const places = await locationService.getLocationsByCounty(county);
      return { success: true, data: places };
    } catch (error: any) {
      context.set.status = 500;
      return {
        error: "Failed to get places by county",
        details: error.message,
      };
    }
  }
}
