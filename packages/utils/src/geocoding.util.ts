/**
 * Geocoding utility functions for converting addresses to coordinates
 */

import axios from "axios";

/**
 * Simple cache to avoid repeated API calls for the same location
 */
const geocodeCache: Record<string, [number, number]> = {};

/**
 * Convert an address string to coordinates [longitude, latitude]
 * Uses Nominatim/OpenStreetMap API for geocoding
 *
 * @param address The address string to geocode
 * @returns Promise that resolves to [longitude, latitude] coordinates
 */
export const geocodeAddress = async (
  address: string
): Promise<[number, number]> => {
  // Check cache first
  if (geocodeCache[address]) {
    return geocodeCache[address];
  }

  try {
    // Use Nominatim (OpenStreetMap) for geocoding - free and doesn't require API key
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: address,
          format: "json",
          limit: 1,
        },
        headers: {
          "User-Agent": "Kaa/1.0", // Required by Nominatim's ToS
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      // Note that Nominatim returns [lat, lon] but MongoDB GeoJSON expects [lon, lat]
      const coordinates: [number, number] = [
        Number.parseFloat(result.lon),
        Number.parseFloat(result.lat),
      ];

      // Cache the result
      geocodeCache[address] = coordinates;
      return coordinates;
    }

    // If no results found, return default coordinates (0,0)
    return [0, 0];
  } catch (error) {
    console.error("Error geocoding address:", error);
    return [0, 0];
  }
};

/**
 * Extract coordinates from UK postal code
 * This is a simpler fallback if full address geocoding fails
 *
 * @param postalCode UK postal code
 * @returns Promise that resolves to [longitude, latitude] coordinates
 */
export const geocodePostalCode = async (
  postalCode: string
): Promise<[number, number]> => {
  if (!postalCode) return [0, 0];

  return await geocodeAddress(postalCode);
};

/**
 * Calculate distance between two coordinates in kilometers
 * Using Haversine formula
 *
 * @param coords1 First coordinates [longitude, latitude]
 * @param coords2 Second coordinates [longitude, latitude]
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  coords1: [number, number],
  coords2: [number, number]
): number => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within Kenya's bounds
 */
export function isWithinKenya(latitude: number, longitude: number): boolean {
  // Kenya's approximate bounds
  const KENYA_BOUNDS = {
    north: 5.019,
    south: -4.678,
    east: 41.899,
    west: 33.909,
  };

  return (
    latitude >= KENYA_BOUNDS.south &&
    latitude <= KENYA_BOUNDS.north &&
    longitude >= KENYA_BOUNDS.west &&
    longitude <= KENYA_BOUNDS.east
  );
}

export async function reverseGeocodingAPI(lat: number, lon: number) {
  const resp = await fetch(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${
      // biome-ignore lint/correctness/noUndeclaredVariables: GEOAPIFY_API_KEY is declared in the .env file
      Bun.env.GEOAPIFY_API_KEY
    }`
  );
  const jsonResp = await resp.json();
  const data = jsonResp?.features[0]?.properties;
  return data;
}
