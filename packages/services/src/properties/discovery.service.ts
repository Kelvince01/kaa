import {
  AmenityApprovalStatus,
  AmenityCategory,
  AmenitySource,
  AmenityType,
  type IAmenity,
} from "@kaa/models/types";
import { logger } from "@kaa/utils";
import axios from "axios";
import type { Types } from "mongoose";
import { AmenityService } from "./amenity.service";

/**
 * External API configuration
 */
type DiscoveryConfig = {
  googlePlacesApiKey?: string;
  useOpenStreetMap: boolean;
  maxRadius: number;
  batchSize: number;
};

/**
 * Google Places API types
 */
type GooglePlace = {
  place_id: string;
  name: string;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  formatted_phone_number?: string;
  website?: string;
};

/**
 * OpenStreetMap Overpass API types
 */
type OSMElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags: Record<string, string>;
};

/**
 * Amenity discovery service for automated population
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AmenityDiscoveryService {
  private static config: DiscoveryConfig = {
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    useOpenStreetMap: true,
    maxRadius: 5, // km
    batchSize: 20,
  };

  /**
   * Mapping Google Places types to our amenity types
   */
  private static googlePlacesTypeMapping: Record<
    string,
    { type: AmenityType; category: AmenityCategory }
  > = {
    // Education
    school: {
      type: AmenityType.PRIMARY_SCHOOL,
      category: AmenityCategory.EDUCATION,
    },
    primary_school: {
      type: AmenityType.PRIMARY_SCHOOL,
      category: AmenityCategory.EDUCATION,
    },
    secondary_school: {
      type: AmenityType.SECONDARY_SCHOOL,
      category: AmenityCategory.EDUCATION,
    },
    university: {
      type: AmenityType.UNIVERSITY,
      category: AmenityCategory.EDUCATION,
    },

    // Healthcare
    hospital: {
      type: AmenityType.HOSPITAL,
      category: AmenityCategory.HEALTHCARE,
    },
    doctor: { type: AmenityType.CLINIC, category: AmenityCategory.HEALTHCARE },
    pharmacy: {
      type: AmenityType.PHARMACY,
      category: AmenityCategory.HEALTHCARE,
    },
    health: { type: AmenityType.CLINIC, category: AmenityCategory.HEALTHCARE },

    // Shopping
    supermarket: {
      type: AmenityType.SUPERMARKET,
      category: AmenityCategory.SHOPPING,
    },
    shopping_mall: {
      type: AmenityType.SHOPPING_MALL,
      category: AmenityCategory.SHOPPING,
    },
    grocery_or_supermarket: {
      type: AmenityType.SUPERMARKET,
      category: AmenityCategory.SHOPPING,
    },

    // Transport
    bus_station: {
      type: AmenityType.BUS_STOP,
      category: AmenityCategory.TRANSPORT,
    },
    transit_station: {
      type: AmenityType.BUS_STOP,
      category: AmenityCategory.TRANSPORT,
    },
    airport: { type: AmenityType.AIRPORT, category: AmenityCategory.TRANSPORT },

    // Banking
    bank: { type: AmenityType.BANK, category: AmenityCategory.BANKING },
    atm: { type: AmenityType.ATM, category: AmenityCategory.BANKING },

    // Entertainment
    restaurant: {
      type: AmenityType.RESTAURANT,
      category: AmenityCategory.ENTERTAINMENT,
    },
    bar: { type: AmenityType.BAR, category: AmenityCategory.ENTERTAINMENT },
    movie_theater: {
      type: AmenityType.CINEMA,
      category: AmenityCategory.ENTERTAINMENT,
    },
    park: { type: AmenityType.PARK, category: AmenityCategory.ENTERTAINMENT },

    // Religious
    church: { type: AmenityType.CHURCH, category: AmenityCategory.RELIGIOUS },
    mosque: { type: AmenityType.MOSQUE, category: AmenityCategory.RELIGIOUS },
    hindu_temple: {
      type: AmenityType.TEMPLE,
      category: AmenityCategory.RELIGIOUS,
    },
    place_of_worship: {
      type: AmenityType.CHURCH,
      category: AmenityCategory.RELIGIOUS,
    },

    // Government
    police: {
      type: AmenityType.POLICE_STATION,
      category: AmenityCategory.GOVERNMENT,
    },
    post_office: {
      type: AmenityType.POST_OFFICE,
      category: AmenityCategory.GOVERNMENT,
    },
    local_government_office: {
      type: AmenityType.GOVERNMENT_OFFICE,
      category: AmenityCategory.GOVERNMENT,
    },

    // Sports
    gym: { type: AmenityType.GYM, category: AmenityCategory.SPORTS },
    stadium: {
      type: AmenityType.SPORTS_GROUND,
      category: AmenityCategory.SPORTS,
    },
  };

  /**
   * OpenStreetMap tag mapping to our amenity types
   */
  private static osmTagMapping: Record<
    string,
    { type: AmenityType; category: AmenityCategory }
  > = {
    // Education
    "amenity=school": {
      type: AmenityType.PRIMARY_SCHOOL,
      category: AmenityCategory.EDUCATION,
    },
    "amenity=university": {
      type: AmenityType.UNIVERSITY,
      category: AmenityCategory.EDUCATION,
    },
    "amenity=college": {
      type: AmenityType.COLLEGE,
      category: AmenityCategory.EDUCATION,
    },
    "amenity=kindergarten": {
      type: AmenityType.NURSERY,
      category: AmenityCategory.EDUCATION,
    },

    // Healthcare
    "amenity=hospital": {
      type: AmenityType.HOSPITAL,
      category: AmenityCategory.HEALTHCARE,
    },
    "amenity=clinic": {
      type: AmenityType.CLINIC,
      category: AmenityCategory.HEALTHCARE,
    },
    "amenity=pharmacy": {
      type: AmenityType.PHARMACY,
      category: AmenityCategory.HEALTHCARE,
    },
    "amenity=doctors": {
      type: AmenityType.CLINIC,
      category: AmenityCategory.HEALTHCARE,
    },

    // Shopping
    "shop=supermarket": {
      type: AmenityType.SUPERMARKET,
      category: AmenityCategory.SHOPPING,
    },
    "shop=mall": {
      type: AmenityType.SHOPPING_MALL,
      category: AmenityCategory.SHOPPING,
    },
    "amenity=marketplace": {
      type: AmenityType.MARKET,
      category: AmenityCategory.SHOPPING,
    },
    "shop=kiosk": {
      type: AmenityType.KIOSK,
      category: AmenityCategory.SHOPPING,
    },

    // Transport
    "amenity=bus_station": {
      type: AmenityType.BUS_STOP,
      category: AmenityCategory.TRANSPORT,
    },
    "public_transport=station": {
      type: AmenityType.BUS_STOP,
      category: AmenityCategory.TRANSPORT,
    },
    "aeroway=aerodrome": {
      type: AmenityType.AIRPORT,
      category: AmenityCategory.TRANSPORT,
    },
    "highway=bus_stop": {
      type: AmenityType.BUS_STOP,
      category: AmenityCategory.TRANSPORT,
    },

    // Banking
    "amenity=bank": {
      type: AmenityType.BANK,
      category: AmenityCategory.BANKING,
    },
    "amenity=atm": { type: AmenityType.ATM, category: AmenityCategory.BANKING },

    // Entertainment
    "amenity=restaurant": {
      type: AmenityType.RESTAURANT,
      category: AmenityCategory.ENTERTAINMENT,
    },
    "amenity=bar": {
      type: AmenityType.BAR,
      category: AmenityCategory.ENTERTAINMENT,
    },
    "amenity=cinema": {
      type: AmenityType.CINEMA,
      category: AmenityCategory.ENTERTAINMENT,
    },
    "leisure=park": {
      type: AmenityType.PARK,
      category: AmenityCategory.ENTERTAINMENT,
    },

    // Religious
    "amenity=place_of_worship": {
      type: AmenityType.CHURCH,
      category: AmenityCategory.RELIGIOUS,
    },
    "building=church": {
      type: AmenityType.CHURCH,
      category: AmenityCategory.RELIGIOUS,
    },

    // Government
    "amenity=police": {
      type: AmenityType.POLICE_STATION,
      category: AmenityCategory.GOVERNMENT,
    },
    "amenity=post_office": {
      type: AmenityType.POST_OFFICE,
      category: AmenityCategory.GOVERNMENT,
    },

    // Sports
    "leisure=fitness_centre": {
      type: AmenityType.GYM,
      category: AmenityCategory.SPORTS,
    },
    "leisure=sports_centre": {
      type: AmenityType.SPORTS_GROUND,
      category: AmenityCategory.SPORTS,
    },
  };

  /**
   * Discover amenities near a location using Google Places API
   */
  private static async discoverWithGooglePlaces(
    latitude: number,
    longitude: number,
    radius = 2000, // meters
    types: string[] = []
  ): Promise<Partial<IAmenity>[]> {
    try {
      if (!AmenityDiscoveryService.config.googlePlacesApiKey) {
        logger.warn("Google Places API key not configured");
        return [];
      }

      const baseUrl =
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
      const defaultTypes = [
        "hospital",
        "school",
        "university",
        "bank",
        "atm",
        "supermarket",
        "shopping_mall",
        "restaurant",
        "bus_station",
        "police",
        "pharmacy",
        "church",
        "mosque",
        "post_office",
        "park",
        "gym",
      ];

      const searchTypes = types.length > 0 ? types : defaultTypes;
      const discoveredAmenities: Partial<IAmenity>[] = [];

      // Google Places API allows only one type per request, so we batch them
      for (const type of searchTypes) {
        try {
          const response = await axios.get(baseUrl, {
            params: {
              location: `${latitude},${longitude}`,
              radius,
              type,
              key: AmenityDiscoveryService.config.googlePlacesApiKey,
            },
            timeout: 10_000,
          });

          if (response.data.status === "OK") {
            const places = response.data.results as GooglePlace[];

            for (const place of places) {
              const amenityMapping =
                AmenityDiscoveryService.googlePlacesTypeMapping[type];
              if (!amenityMapping) continue;

              // Get additional details if needed
              let placeDetails: GooglePlace | null = null;
              try {
                const detailsResponse = await axios.get(
                  "https://maps.googleapis.com/maps/api/place/details/json",
                  {
                    params: {
                      place_id: place.place_id,
                      fields:
                        "formatted_phone_number,website,opening_hours,formatted_address",
                      key: AmenityDiscoveryService.config.googlePlacesApiKey,
                    },
                    timeout: 5000,
                  }
                );
                placeDetails = detailsResponse.data.result;
              } catch (error) {
                logger.warn(
                  `Failed to get details for place ${place.place_id}`
                );
              }

              const amenity: Partial<IAmenity> = {
                name: place.name,
                type: amenityMapping.type,
                category: amenityMapping.category,
                description: "Discovered via Google Places API",
                source: AmenitySource.AUTO_DISCOVERED_GOOGLE,
                isAutoDiscovered: true,
                approvalStatus: AmenityApprovalStatus.PENDING,
                discoveredAt: new Date(),
                verificationLevel: "unverified",
                location: {
                  country: "Kenya",
                  county: AmenityDiscoveryService.getCountyFromCoordinates(
                    place.geometry.location.lat,
                    place.geometry.location.lng
                  ),
                  address: {
                    line1:
                      placeDetails?.formatted_address || place.vicinity || "",
                    town: "Nairobi", // Default, can be improved with reverse geocoding
                  },
                  coordinates: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  },
                },
                contact: {
                  phone: placeDetails?.formatted_phone_number,
                  website: placeDetails?.website,
                },
                rating: place.rating || 0,
                reviewCount: place.user_ratings_total || 0,
                verified: false, // Auto-discovered amenities need verification
                tags: ["auto-discovered", "google-places", type],
                isActive: true,
              };

              // Parse operating hours if available
              if (placeDetails?.opening_hours?.weekday_text) {
                amenity.operatingHours =
                  AmenityDiscoveryService.parseGoogleOpeningHours(
                    placeDetails?.opening_hours.weekday_text
                  );
              }

              discoveredAmenities.push(amenity);
            }
          }

          // Respect API rate limits
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          logger.warn(`Failed to search for type ${type}:`, error);
        }
      }

      logger.info(
        `Discovered ${discoveredAmenities.length} amenities using Google Places API`,
        {
          latitude,
          longitude,
          radius,
          types: searchTypes,
        }
      );

      return discoveredAmenities;
    } catch (error) {
      logger.error("Error discovering amenities with Google Places:", error);
      return [];
    }
  }

  /**
   * Discover amenities using OpenStreetMap Overpass API
   */
  private static async discoverWithOpenStreetMap(
    latitude: number,
    longitude: number,
    radius = 2000 // meters
  ): Promise<Partial<IAmenity>[]> {
    try {
      const radiusKm = radius / 1000;

      // Overpass QL query for various amenities
      const overpassQuery = `
				[out:json][timeout:25];
				(
					node["amenity"~"^(hospital|clinic|pharmacy|school|university|bank|atm|restaurant|bar|police|post_office)$"](around:${radius},${latitude},${longitude});
					node["shop"~"^(supermarket|mall|kiosk)$"](around:${radius},${latitude},${longitude});
					node["leisure"~"^(park|fitness_centre|sports_centre)$"](around:${radius},${latitude},${longitude});
					node["amenity"="place_of_worship"](around:${radius},${latitude},${longitude});
					node["public_transport"="station"](around:${radius},${latitude},${longitude});
					way["amenity"~"^(hospital|clinic|pharmacy|school|university|bank|restaurant|police)$"](around:${radius},${latitude},${longitude});
					way["shop"~"^(supermarket|mall)$"](around:${radius},${latitude},${longitude});
					way["leisure"~"^(park|fitness_centre)$"](around:${radius},${latitude},${longitude});
				);
				out center meta;
			`;

      const response = await axios.post(
        "https://overpass-api.de/api/interpreter",
        overpassQuery,
        {
          headers: { "Content-Type": "text/plain" },
          timeout: 30_000,
        }
      );

      const data = response.data;
      const discoveredAmenities: Partial<IAmenity>[] = [];

      if (data.elements) {
        for (const element of data.elements as OSMElement[]) {
          const amenityMapping = AmenityDiscoveryService.getOSMAmenityMapping(
            element.tags
          );
          if (!amenityMapping) continue;

          // Use center coordinates for ways, direct coordinates for nodes
          const elementLat = element.lat || (element as any).center?.lat;
          const elementLon = element.lon || (element as any).center?.lon;

          if (!(elementLat && elementLon)) continue;

          const amenity: Partial<IAmenity> = {
            name:
              element.tags.name || `${amenityMapping.type} (OSM ${element.id})`,
            type: amenityMapping.type,
            category: amenityMapping.category,
            description:
              element.tags.description || "Discovered via OpenStreetMap",
            source: AmenitySource.AUTO_DISCOVERED_OSM,
            isAutoDiscovered: true,
            approvalStatus: AmenityApprovalStatus.PENDING,
            discoveredAt: new Date(),
            verificationLevel: "unverified",
            location: {
              country: "Kenya",
              county: AmenityDiscoveryService.getCountyFromCoordinates(
                elementLat,
                elementLon
              ),
              address: {
                line1:
                  element.tags["addr:street"] ||
                  element.tags["addr:full"] ||
                  "Unknown",
                town: element.tags["addr:city"] || "Unknown",
                postalCode: element.tags["addr:postcode"],
              },
              coordinates: {
                latitude: elementLat,
                longitude: elementLon,
              },
            },
            geolocation: {
              type: "Point",
              coordinates: [elementLon, elementLat],
            },
            contact: {
              phone: element.tags.phone,
              website: element.tags.website,
              email: element.tags.email,
            },
            verified: false, // OSM data needs verification
            tags: [
              "auto-discovered",
              "openstreetmap",
              ...Object.keys(element.tags),
            ],
            isActive: true,
          };

          // Parse opening hours if available
          if (element.tags.opening_hours) {
            amenity.operatingHours =
              AmenityDiscoveryService.parseOSMOpeningHours(
                element.tags.opening_hours
              );
          }

          discoveredAmenities.push(amenity);
        }
      }

      logger.info(
        `Discovered ${discoveredAmenities.length} amenities using OpenStreetMap`,
        {
          latitude,
          longitude,
          radius,
        }
      );

      return discoveredAmenities;
    } catch (error) {
      logger.error("Error discovering amenities with OpenStreetMap:", error);
      return [];
    }
  }

  /**
   * Main discovery method that tries multiple sources
   */
  static async discoverNearbyAmenities(
    latitude: number,
    longitude: number,
    options: {
      radius?: number; // in meters
      sources?: ("google" | "osm")[];
      autoSave?: boolean;
      skipExisting?: boolean;
    } = {}
  ): Promise<{
    discovered: Partial<IAmenity>[];
    saved: number;
    errors: number;
    sources: string[];
  }> {
    try {
      const {
        radius = 2000,
        sources = ["google", "osm"],
        autoSave = false,
        skipExisting = true,
      } = options;

      const allDiscovered: Partial<IAmenity>[] = [];
      const usedSources: string[] = [];

      // Try Google Places API first
      if (
        sources.includes("google") &&
        AmenityDiscoveryService.config.googlePlacesApiKey
      ) {
        const googleAmenities =
          await AmenityDiscoveryService.discoverWithGooglePlaces(
            latitude,
            longitude,
            radius
          );
        allDiscovered.push(...googleAmenities);
        usedSources.push("google-places");
      }

      // Try OpenStreetMap as fallback or additional source
      if (sources.includes("osm")) {
        const osmAmenities =
          await AmenityDiscoveryService.discoverWithOpenStreetMap(
            latitude,
            longitude,
            radius
          );
        allDiscovered.push(...osmAmenities);
        usedSources.push("openstreetmap");
      }

      // Remove duplicates based on name and proximity (within 100m)
      const uniqueAmenities =
        await AmenityDiscoveryService.deduplicateAmenities(allDiscovered);

      // Filter out existing amenities if requested
      let finalAmenities = uniqueAmenities;
      if (skipExisting) {
        finalAmenities =
          await AmenityDiscoveryService.filterExistingAmenities(
            uniqueAmenities
          );
      }

      let saved = 0;
      let errors = 0;

      // Auto-save if requested
      if (autoSave && finalAmenities.length > 0) {
        const result = await AmenityService.bulkImportAmenities(finalAmenities);
        saved = result.created;
        errors = result.errors;
      }

      logger.info("Amenity discovery completed", {
        latitude,
        longitude,
        radius,
        discovered: allDiscovered.length,
        unique: uniqueAmenities.length,
        final: finalAmenities.length,
        saved,
        errors,
        sources: usedSources,
      });

      return {
        discovered: finalAmenities,
        saved,
        errors,
        sources: usedSources,
      };
    } catch (error) {
      logger.error("Error in amenity discovery:", error);
      throw new Error("Failed to discover nearby amenities");
    }
  }

  /**
   * Discover and populate amenities for a specific property
   */
  static async discoverPropertyAmenities(
    propertyId: string,
    options: {
      radius?: number;
      autoSave?: boolean;
      updatePropertyCache?: boolean;
    } = {}
  ): Promise<{
    discovered: Partial<IAmenity>[];
    saved: number;
    errors: number;
    propertyUpdated: boolean;
  }> {
    try {
      const {
        radius = 2000,
        autoSave = true,
        updatePropertyCache = true,
      } = options;

      // Get property coordinates
      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      const property = await Property.findById(propertyId).select(
        "location geolocation"
      );

      if (!property) {
        throw new Error("Property not found");
      }

      const latitude =
        property.geolocation?.coordinates?.[1] ||
        property.location?.coordinates?.latitude;
      const longitude =
        property.geolocation?.coordinates?.[0] ||
        property.location?.coordinates?.longitude;

      if (!(latitude && longitude)) {
        throw new Error("Property coordinates not found");
      }

      // Discover amenities
      const result = await AmenityDiscoveryService.discoverNearbyAmenities(
        latitude,
        longitude,
        {
          radius,
          autoSave,
          skipExisting: true,
        }
      );

      // Update property cache if requested
      let propertyUpdated = false;
      if (updatePropertyCache && autoSave && result.saved > 0) {
        const { updatePropertyAmenitiesCache } = await import(
          "./property.service"
        );
        propertyUpdated = await updatePropertyAmenitiesCache(propertyId);
      }

      logger.info(`Discovered amenities for property ${propertyId}`, {
        discovered: result.discovered.length,
        saved: result.saved,
        propertyUpdated,
      });

      return {
        ...result,
        propertyUpdated,
      };
    } catch (error) {
      logger.error("Error discovering property amenities:", error);
      throw new Error("Failed to discover property amenities");
    }
  }

  /**
   * Batch discover amenities for multiple properties
   */
  static async batchDiscoverPropertyAmenities(
    propertyIds: string[],
    options: {
      radius?: number;
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<{
    processed: number;
    totalDiscovered: number;
    totalSaved: number;
    errors: string[];
  }> {
    try {
      const { radius = 2000, batchSize = 5, delayMs = 1000 } = options;

      let processed = 0;
      let totalDiscovered = 0;
      let totalSaved = 0;
      const errors: string[] = [];

      // Process in batches to avoid overwhelming external APIs
      for (let i = 0; i < propertyIds.length; i += batchSize) {
        const batch = propertyIds.slice(i, i + batchSize);

        const batchPromises = batch.map(async (propertyId) => {
          try {
            const result =
              await AmenityDiscoveryService.discoverPropertyAmenities(
                propertyId,
                {
                  radius,
                  autoSave: true,
                  updatePropertyCache: true,
                }
              );

            processed++;
            totalDiscovered += result.discovered.length;
            totalSaved += result.saved;

            return result;
          } catch (error) {
            errors.push(
              `${propertyId}: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            return null;
          }
        });

        await Promise.all(batchPromises);

        // Delay between batches to respect API limits
        if (i + batchSize < propertyIds.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      logger.info("Batch amenity discovery completed", {
        totalProperties: propertyIds.length,
        processed,
        totalDiscovered,
        totalSaved,
        errors: errors.length,
      });

      return {
        processed,
        totalDiscovered,
        totalSaved,
        errors,
      };
    } catch (error) {
      logger.error("Error in batch amenity discovery:", error);
      throw new Error("Failed to batch discover amenities");
    }
  }

  /**
   * Remove duplicate amenities based on name and proximity
   */
  private static async deduplicateAmenities(
    amenities: Partial<IAmenity>[]
  ): Promise<Partial<IAmenity>[]> {
    const unique: Partial<IAmenity>[] = [];

    for (const amenity of amenities) {
      const isDuplicate = unique.some((existing) => {
        // Check if same name and type
        if (existing.name !== amenity.name || existing.type !== amenity.type) {
          return false;
        }

        // Check if within 100m of each other
        if (existing.location?.coordinates && amenity.location?.coordinates) {
          const distance = AmenityDiscoveryService.calculateDistance(
            existing.location.coordinates.latitude,
            existing.location.coordinates.longitude,
            amenity.location.coordinates.latitude,
            amenity.location.coordinates.longitude
          );
          return distance < 0.1; // 100m
        }

        return false;
      });

      if (!isDuplicate) {
        unique.push(amenity);
      }
    }

    return await Promise.resolve(unique);
  }

  /**
   * Filter out amenities that already exist in the database
   */
  private static async filterExistingAmenities(
    amenities: Partial<IAmenity>[]
  ): Promise<Partial<IAmenity>[]> {
    const { Amenity } = await import("@kaa/models");
    const filtered: Partial<IAmenity>[] = [];

    for (const amenity of amenities) {
      if (!amenity.location?.coordinates) continue;

      // Check if similar amenity exists within 200m
      const existing = await Amenity.findOne({
        name: { $regex: new RegExp(amenity.name || "", "i") },
        type: amenity.type,
        geolocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [
                amenity.location.coordinates.longitude,
                amenity.location.coordinates.latitude,
              ],
            },
            $maxDistance: 200, // 200 meters
          },
        },
      });

      if (!existing) {
        filtered.push(amenity);
      }
    }

    return filtered;
  }

  /**
   * Get OSM amenity mapping from tags
   */
  private static getOSMAmenityMapping(
    tags: Record<string, string>
  ): { type: AmenityType; category: AmenityCategory } | null {
    // Check various tag combinations
    for (const [key, value] of Object.entries(tags)) {
      const tagString = `${key}=${value}`;
      if (AmenityDiscoveryService.osmTagMapping[tagString]) {
        return AmenityDiscoveryService.osmTagMapping[tagString];
      }
    }

    // Check religion-specific mappings
    if (tags.amenity === "place_of_worship") {
      if (tags.religion === "christian") {
        return {
          type: AmenityType.CHURCH,
          category: AmenityCategory.RELIGIOUS,
        };
      }
      if (tags.religion === "muslim") {
        return {
          type: AmenityType.MOSQUE,
          category: AmenityCategory.RELIGIOUS,
        };
      }
      if (tags.religion === "hindu") {
        return {
          type: AmenityType.TEMPLE,
          category: AmenityCategory.RELIGIOUS,
        };
      }
      return { type: AmenityType.CHURCH, category: AmenityCategory.RELIGIOUS }; // Default
    }

    return null;
  }

  /**
   * Parse Google Places opening hours format
   */
  private static parseGoogleOpeningHours(
    weekdayText: string[]
  ): Record<string, string> {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const hours: Record<string, string> = {};

    weekdayText.forEach((text, index) => {
      if (index < days.length) {
        // Extract hours from "Monday: 9:00 AM – 5:00 PM" format
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        const hoursMatch = text.match(/:\s*(.+)$/);
        if (hoursMatch) {
          hours[days[index] as keyof typeof hours] =
            hoursMatch[1]?.trim() || "";
        }
      }
    });

    return hours;
  }

  /**
   * Parse OSM opening hours format
   */
  private static parseOSMOpeningHours(
    openingHours: string
  ): Record<string, string> {
    const hours: Record<string, string> = {};

    // Simple parsing for common formats like "Mo-Fr 09:00-17:00"
    // This is a basic implementation - OSM opening hours can be very complex
    if (openingHours.includes("Mo-Fr") || openingHours.includes("Mo-Su")) {
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      const timeMatch = openingHours.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
      if (timeMatch) {
        const timeRange = `${timeMatch[1]} - ${timeMatch[2]}`;

        if (openingHours.includes("Mo-Fr")) {
          for (const day of [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
          ]) {
            hours[day] = timeRange;
          }
        } else if (openingHours.includes("Mo-Su")) {
          for (const day of [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ]) {
            hours[day] = timeRange;
          }
        }
      }
    }

    return hours;
  }

  /**
   * Simple county mapping based on coordinates (can be enhanced with reverse geocoding)
   */
  private static getCountyFromCoordinates(
    latitude: number,
    longitude: number
  ): string {
    // Basic mapping for major Kenyan cities
    // This is simplified - in production, use proper reverse geocoding

    // Nairobi bounds (approximate)
    if (
      latitude >= -1.4 &&
      latitude <= -1.1 &&
      longitude >= 36.6 &&
      longitude <= 37.1
    ) {
      return "Nairobi";
    }

    // Mombasa bounds (approximate)
    if (
      latitude >= -4.2 &&
      latitude <= -3.9 &&
      longitude >= 39.5 &&
      longitude <= 39.8
    ) {
      return "Mombasa";
    }

    // Kisumu bounds (approximate)
    if (
      latitude >= -0.2 &&
      latitude <= 0.1 &&
      longitude >= 34.6 &&
      longitude <= 34.9
    ) {
      return "Kisumu";
    }

    // Nakuru bounds (approximate)
    if (
      latitude >= -0.4 &&
      latitude <= -0.2 &&
      longitude >= 35.9 &&
      longitude <= 36.2
    ) {
      return "Nakuru";
    }

    return "Unknown"; // Default fallback
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
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
  }

  /**
   * Discover amenities for all properties in a county
   */
  static async discoverCountyAmenities(
    county: string,
    options: {
      radius?: number;
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<{
    propertiesProcessed: number;
    totalDiscovered: number;
    totalSaved: number;
    errors: string[];
  }> {
    try {
      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      // Get all properties in the county
      const properties = await Property.find({
        "location.county": county,
        status: "active",
      })
        .select("_id location geolocation")
        .lean();

      if (properties.length === 0) {
        logger.info(`No active properties found in ${county}`);
        return {
          propertiesProcessed: 0,
          totalDiscovered: 0,
          totalSaved: 0,
          errors: [],
        };
      }

      const propertyIds = properties.map((p) =>
        (p._id as Types.ObjectId).toString()
      );

      logger.info(
        `Starting amenity discovery for ${properties.length} properties in ${county}`
      );

      const result =
        await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
          propertyIds,
          options
        );

      return {
        propertiesProcessed: result.processed,
        totalDiscovered: result.totalDiscovered,
        totalSaved: result.totalSaved,
        errors: result.errors,
      };
    } catch (error) {
      logger.error(`Error discovering amenities for county ${county}:`, error);
      throw new Error(`Failed to discover amenities for county ${county}`);
    }
  }

  /**
   * Get discovery service configuration
   */
  static getConfig(): DiscoveryConfig {
    return { ...AmenityDiscoveryService.config };
  }

  /**
   * Update discovery service configuration
   */
  static updateConfig(newConfig: Partial<DiscoveryConfig>): void {
    AmenityDiscoveryService.config = {
      ...AmenityDiscoveryService.config,
      ...newConfig,
    };
    logger.info("Updated discovery service configuration", newConfig);
  }
}
