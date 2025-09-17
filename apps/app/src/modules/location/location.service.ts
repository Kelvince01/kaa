import { httpClient } from "@/lib/axios";
import type {
  Address,
  AddressSuggestion,
  AddressValidationResult,
  Coordinates,
  PlaceSearchOptions,
} from "./location.type";

/**
 * Location service client for communicating with backend location APIs
 */
class LocationService {
  /**
   * Search for places and addresses
   */
  async searchPlaces(
    query: string,
    options: PlaceSearchOptions = {}
  ): Promise<AddressSuggestion[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: (options.limit || 10).toString(),
        countryCode: options.countryCode || "ke",
        includeDetails: (options.includeDetails !== false).toString(),
      });

      const response = await httpClient.api.get(`/locations/search?${params}`);

      if (response.data.status === "success") {
        return response.data.data.suggestions || [];
      }

      throw new Error(response.data.message || "Failed to search places");
    } catch (error) {
      console.error("Location search error:", error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(
    coordinates: Coordinates
  ): Promise<AddressSuggestion | null> {
    try {
      const params = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
      });

      const response = await httpClient.api.get(`/locations/reverse?${params}`);

      if (response.data.status === "success") {
        return response.data.data;
      }

      if (
        response.data.status === "error" &&
        response.data.message?.includes("No address found")
      ) {
        return null;
      }

      throw new Error(
        response.data.message || "Failed to reverse geocode coordinates"
      );
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  }

  /**
   * Validate an address
   */
  async validateAddress(
    address: Partial<Address>
  ): Promise<AddressValidationResult> {
    try {
      const response = await httpClient.api.post("/locations/validate", {
        address,
      });

      if (response.data.status === "success") {
        return response.data.data;
      }

      throw new Error(response.data.message || "Failed to validate address");
    } catch (error) {
      console.error("Address validation error:", error);
      throw error;
    }
  }

  /**
   * Get place details by ID
   */
  async getPlaceDetails(placeId: string): Promise<AddressSuggestion | null> {
    try {
      const response = await httpClient.api.get(`/locations/place/${placeId}`);

      if (response.data.status === "success") {
        return response.data.data;
      }

      if (
        response.data.status === "error" &&
        response.data.message?.includes("Place not found")
      ) {
        return null;
      }

      throw new Error(response.data.message || "Failed to get place details");
    } catch (error) {
      console.error("Place details error:", error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions for Kenyan counties
   */
  async getCountySuggestions(query: string, limit?: number): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: (limit || 10).toString(),
      });

      const response = await httpClient.api.get(
        `/locations/autocomplete/counties?${params}`
      );

      if (response.data.status === "success") {
        return response.data.data.suggestions || [];
      }

      throw new Error(
        response.data.message || "Failed to get county suggestions"
      );
    } catch (error) {
      console.error("County suggestions error:", error);
      return [];
    }
  }

  /**
   * Get autocomplete suggestions for neighborhoods
   */
  async getNeighborhoodSuggestions(
    query: string,
    limit?: number
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: (limit || 10).toString(),
      });

      const response = await httpClient.api.get(
        `/locations/autocomplete/neighborhoods?${params}`
      );

      if (response.data.status === "success") {
        return response.data.data.suggestions || [];
      }

      throw new Error(
        response.data.message || "Failed to get neighborhood suggestions"
      );
    } catch (error) {
      console.error("Neighborhood suggestions error:", error);
      return [];
    }
  }

  /**
   * Get nearby places
   */
  async getNearbyPlaces(
    coordinates: Coordinates,
    options: {
      radius?: number;
      categories?: string[];
      limit?: number;
    } = {}
  ): Promise<AddressSuggestion[]> {
    try {
      const params = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
        radius: (options.radius || 5000).toString(),
        limit: (options.limit || 10).toString(),
      });

      if (options.categories?.length) {
        params.append("categories", options.categories.join(","));
      }

      const response = await httpClient.api.get(`/locations/nearby?${params}`);

      if (response.data.status === "success") {
        return response.data.data.places || [];
      }

      throw new Error(response.data.message || "Failed to get nearby places");
    } catch (error) {
      console.error("Nearby places error:", error);
      return [];
    }
  }

  /**
   * Get current location using browser geolocation API
   */
  getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let message = "Failed to get current location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
            default:
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 300_000, // 5 minutes
        }
      );
    });
  }

  /**
   * Format an address object into a readable string
   */
  formatAddress(address: Address): string {
    const parts = [
      address.line1,
      address.line2,
      address.town,
      address.county,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Parse a formatted address string into an address object
   */
  parseAddress(formattedAddress: string): Partial<Address> {
    const parts = formattedAddress.split(",").map((part) => part.trim());
    const address: Partial<Address> = {};

    if (parts.length >= 1) address.line1 = parts[0];
    if (parts.length >= 2) address.town = parts[1];
    if (parts.length >= 3) address.county = parts[2];
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    if (parts.length >= 4 && parts[3]?.match(/^\d{5}$/)) {
      address.postalCode = parts[3];
      if (parts.length >= 5) address.country = parts[4];
    } else if (parts.length >= 4) {
      address.country = parts[3];
    }

    return address;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) *
        Math.cos(this.toRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export a singleton instance
export const locationService = new LocationService();
