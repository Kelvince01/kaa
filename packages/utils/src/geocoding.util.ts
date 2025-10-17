/**
 * Geocoding utility functions for converting addresses to coordinates
 */

import axios from "axios";

export type GeoPoint = {
  lat: number;
  lon: number;
};

export type GeoBounds = {
  topLeft: GeoPoint;
  bottomRight: GeoPoint;
};

export type GeoDistance = {
  point: GeoPoint;
  distance: string;
  unit?: "km" | "m" | "mi" | "yd";
};

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

/**
 * Create a bounding box around a center point with given distance
 */
export function createBoundingBox(
  center: GeoPoint,
  distance: string
): GeoBounds {
  const distanceValue = parseDistance(distance);
  const distanceInKm = convertToKm(distanceValue.value, distanceValue.unit);

  // Approximate degrees per km (varies by latitude)
  const latDegreePerKm = 1 / 111.32;
  const lonDegreePerKm = 1 / (111.32 * Math.cos(toRadians(center.lat)));

  const latOffset = distanceInKm * latDegreePerKm;
  const lonOffset = distanceInKm * lonDegreePerKm;

  return {
    topLeft: {
      lat: center.lat + latOffset,
      lon: center.lon - lonOffset,
    },
    bottomRight: {
      lat: center.lat - latOffset,
      lon: center.lon + lonOffset,
    },
  };
}

/**
 * Parse distance string (e.g., "10km", "5mi", "1000m")
 */
export function parseDistance(distance: string): {
  value: number;
  unit: string;
} {
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  const match = distance.match(/^(\d+(?:\.\d+)?)(km|m|mi|yd)?$/i);
  if (!match) {
    throw new Error(`Invalid distance format: ${distance}`);
  }

  return {
    value: Number.parseFloat(match[1] || "0"),
    unit: match[2]?.toLowerCase() || "km",
  };
}

/**
 * Convert distance to kilometers
 */
export function convertToKm(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case "km":
      return value;
    case "m":
      return value / 1000;
    case "mi":
      return value * 1.609_34;
    case "yd":
      return value * 0.000_914_4;
    default:
      return value; // assume km
  }
}

/**
 * Validate geo coordinates
 */
export function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    typeof point.lat === "number" &&
    typeof point.lon === "number" &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lon >= -180 &&
    point.lon <= 180
  );
}

/**
 * Create Elasticsearch geo-distance query
 */
export function createGeoDistanceQuery(
  field: string,
  center: GeoPoint,
  distance: string
) {
  return {
    geo_distance: {
      distance,
      [field]: {
        lat: center.lat,
        lon: center.lon,
      },
    },
  };
}

/**
 * Create Elasticsearch geo-bounding box query
 */
export function createGeoBoundingBoxQuery(field: string, bounds: GeoBounds) {
  return {
    geo_bounding_box: {
      [field]: {
        top_left: {
          lat: bounds.topLeft.lat,
          lon: bounds.topLeft.lon,
        },
        bottom_right: {
          lat: bounds.bottomRight.lat,
          lon: bounds.bottomRight.lon,
        },
      },
    },
  };
}

/**
 * Create Elasticsearch geo-polygon query
 */
export function createGeoPolygonQuery(field: string, points: GeoPoint[]) {
  return {
    geo_polygon: {
      [field]: {
        points: points.map((p) => ({ lat: p.lat, lon: p.lon })),
      },
    },
  };
}

/**
 * Get nearby locations within a certain distance
 */
export function getNearbyQuery(
  center: GeoPoint,
  distance: string,
  field = "geolocation"
) {
  return createGeoDistanceQuery(field, center, distance);
}

/**
 * Sort by distance from a point
 */
export function createGeoDistanceSort(
  field: string,
  center: GeoPoint,
  order: "asc" | "desc" = "asc"
) {
  return {
    _geo_distance: {
      [field]: {
        lat: center.lat,
        lon: center.lon,
      },
      order,
      unit: "km",
      mode: "min",
      distance_type: "arc",
      ignore_unmapped: true,
    },
  };
}

/**
 * Kenya-specific location utilities
 */
export const KenyaGeo = {
  // Major cities coordinates
  cities: {
    nairobi: { lat: -1.2921, lon: 36.8219 },
    mombasa: { lat: -4.0435, lon: 39.6682 },
    kisumu: { lat: -0.0917, lon: 34.768 },
    nakuru: { lat: -0.3031, lon: 36.08 },
    eldoret: { lat: 0.5143, lon: 35.2698 },
    thika: { lat: -1.0332, lon: 37.0692 },
    malindi: { lat: -3.2175, lon: 40.1167 },
    kitale: { lat: 1.0157, lon: 35.0062 },
    garissa: { lat: -0.4536, lon: 39.6401 },
    kakamega: { lat: 0.2827, lon: 34.7519 },
  },

  // Kenya bounding box
  bounds: {
    topLeft: { lat: 5.019, lon: 33.908 },
    bottomRight: { lat: -4.677, lon: 41.899 },
  },

  // Check if point is within Kenya
  isWithinKenya(point: GeoPoint): boolean {
    return (
      point.lat >= this.bounds.bottomRight.lat &&
      point.lat <= this.bounds.topLeft.lat &&
      point.lon >= this.bounds.topLeft.lon &&
      point.lon <= this.bounds.bottomRight.lon
    );
  },

  // Get nearest major city
  getNearestCity(point: GeoPoint): { name: string; distance: number } | null {
    if (!this.isWithinKenya(point)) return null;

    let nearest: { name: string; distance: number } | null = null;

    for (const [name, cityPoint] of Object.entries(this.cities)) {
      const distance = calculateDistance(
        [point.lon, point.lat],
        [cityPoint.lon, cityPoint.lat]
      );
      if (!nearest || distance < nearest.distance) {
        nearest = { name, distance };
      }
    }

    return nearest;
  },
};
