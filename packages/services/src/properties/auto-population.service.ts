import type { IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type { Types } from "mongoose";
import { amenityDiscoveryQueue } from "../queues/amenity.queue";
import { AmenityService } from "./amenity.service";
import { AmenityDiscoveryService } from "./discovery.service";

/**
 * Automated amenity population service
 * Handles background tasks for discovering and updating amenities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AutoPopulationService {
  /**
   * Queue for processing property amenity discovery
   */
  private static discoveryQueue: Set<string> = new Set();
  private static isProcessing = false;

  /**
   * Automatically discover amenities when a property is created
   */
  static async onPropertyCreated(propertyId: string): Promise<void> {
    try {
      logger.info(
        `Scheduling amenity discovery for new property: ${propertyId}`
      );

      // Add job to queue for background processing
      await amenityDiscoveryQueue.add(
        "discover-property-amenities",
        {
          propertyId,
          options: {
            radius: 2000,
            autoSave: true,
            updatePropertyCache: true,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );

      logger.info(`Added property ${propertyId} to amenity discovery queue`);
    } catch (error) {
      logger.error(
        "Error scheduling amenity discovery for new property:",
        error
      );
    }
  }

  /**
   * Update amenities when a property location is updated
   */
  static async onPropertyLocationUpdated(propertyId: string): Promise<void> {
    try {
      logger.info(
        `Scheduling amenity update for property location change: ${propertyId}`
      );

      // Clear existing cached amenities for this property
      await AutoPopulationService.clearPropertyAmenitiesCache(propertyId);

      // Add job to queue for background processing
      await amenityDiscoveryQueue.add(
        "discover-property-amenities",
        {
          propertyId,
          options: {
            radius: 2000,
            autoSave: true,
            updatePropertyCache: true,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        }
      );

      logger.info(
        `Added property ${propertyId} to amenity discovery queue after location update`
      );
    } catch (error) {
      logger.error(
        "Error scheduling amenity update for property location change:",
        error
      );
    }
  }

  /**
   * Process the discovery queue in the background
   * @deprecated Use the queue-based approach instead
   */
  static async processDiscoveryQueue(): Promise<void> {
    if (AutoPopulationService.isProcessing) return;

    AutoPopulationService.isProcessing = true;

    try {
      while (AutoPopulationService.discoveryQueue.size > 0) {
        const propertyIds = Array.from(
          AutoPopulationService.discoveryQueue
        ).slice(0, 5); // Process 5 at a time

        // Remove from queue
        for (const id of propertyIds) {
          AutoPopulationService.discoveryQueue.delete(id);
        }

        logger.info(
          `Processing amenity discovery for ${propertyIds.length} properties`
        );

        // Process batch
        const result =
          await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
            propertyIds,
            {
              radius: 2000, // 2km radius
              batchSize: 3,
              delayMs: 1500, // Respect API limits
            }
          );

        logger.info("Batch amenity discovery completed", {
          processed: result.processed,
          discovered: result.totalDiscovered,
          saved: result.totalSaved,
          errors: result.errors.length,
        });

        // Wait between batches
        if (AutoPopulationService.discoveryQueue.size > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch (error) {
      logger.error("Error processing discovery queue:", error);
    } finally {
      AutoPopulationService.isProcessing = false;
    }
  }

  /**
   * Clear cached amenities for a property
   */
  private static async clearPropertyAmenitiesCache(
    propertyId: string
  ): Promise<void> {
    try {
      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      await Property.findByIdAndUpdate(
        propertyId,
        { "location.nearbyAmenities": [] },
        { new: true }
      );

      logger.info(`Cleared amenities cache for property ${propertyId}`);
    } catch (error) {
      logger.error("Error clearing property amenities cache:", error);
    }
  }

  /**
   * Scheduled job to discover amenities for properties without amenities
   */
  static async discoverMissingAmenities(
    options: {
      batchSize?: number;
      maxProperties?: number;
      county?: string;
    } = {}
  ): Promise<{
    processed: number;
    discovered: number;
    saved: number;
  }> {
    try {
      const { batchSize = 10, maxProperties = 100, county } = options;

      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      // Find properties without cached amenities
      const filter: any = {
        status: "active",
        $or: [
          { "location.nearbyAmenities": { $exists: false } },
          { "location.nearbyAmenities": { $size: 0 } },
        ],
      };

      if (county) {
        filter["location.county"] = county;
      }

      const properties = await Property.find(filter)
        .select("_id location geolocation")
        .limit(maxProperties)
        .lean();

      if (properties.length === 0) {
        logger.info("No properties found without amenities");
        return { processed: 0, discovered: 0, saved: 0 };
      }

      logger.info(`Found ${properties.length} properties without amenities`);

      const propertyIds = properties.map((p) =>
        (p._id as Types.ObjectId).toString()
      );

      const result =
        await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
          propertyIds,
          {
            radius: 2000,
            batchSize,
            delayMs: 2000,
          }
        );

      logger.info("Completed discovering missing amenities", {
        processed: result.processed,
        discovered: result.totalDiscovered,
        saved: result.totalSaved,
      });

      return {
        processed: result.processed,
        discovered: result.totalDiscovered,
        saved: result.totalSaved,
      };
    } catch (error) {
      logger.error("Error discovering missing amenities:", error);
      throw new Error("Failed to discover missing amenities");
    }
  }

  /**
   * Refresh amenities for properties older than specified days
   */
  static async refreshStaleAmenities(
    daysOld = 30,
    options: {
      batchSize?: number;
      maxProperties?: number;
      county?: string;
    } = {}
  ): Promise<{
    processed: number;
    discovered: number;
    saved: number;
  }> {
    try {
      const { batchSize = 5, maxProperties = 50, county } = options;

      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Find properties with old amenity data
      const filter: any = {
        status: "active",
        updatedAt: { $lt: cutoffDate },
        "location.nearbyAmenities": { $exists: true, $not: { $size: 0 } },
      };

      if (county) {
        filter["location.county"] = county;
      }

      const properties = await Property.find(filter)
        .select("_id location geolocation updatedAt")
        .limit(maxProperties)
        .lean();

      if (properties.length === 0) {
        logger.info("No properties found with stale amenities");
        return { processed: 0, discovered: 0, saved: 0 };
      }

      logger.info(
        `Found ${properties.length} properties with stale amenities (older than ${daysOld} days)`
      );

      const propertyIds = properties.map((p) =>
        (p._id as Types.ObjectId).toString()
      );

      const result =
        await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
          propertyIds,
          {
            radius: 2000,
            batchSize,
            delayMs: 2000,
          }
        );

      logger.info("Completed refreshing stale amenities", {
        processed: result.processed,
        discovered: result.totalDiscovered,
        saved: result.totalSaved,
      });

      return {
        processed: result.processed,
        discovered: result.totalDiscovered,
        saved: result.totalSaved,
      };
    } catch (error) {
      logger.error("Error refreshing stale amenities:", error);
      throw new Error("Failed to refresh stale amenities");
    }
  }

  /**
   * Get discovery queue status
   */
  static getQueueStatus(): {
    queueSize: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: AutoPopulationService.discoveryQueue.size,
      isProcessing: AutoPopulationService.isProcessing,
    };
  }

  /**
   * Clear the discovery queue (emergency stop)
   */
  static clearQueue(): void {
    AutoPopulationService.discoveryQueue.clear();
    logger.info("Discovery queue cleared");
  }

  /**
   * Validate amenity data quality and suggest improvements
   */
  static async validateAmenityData(county?: string): Promise<{
    totalAmenities: number;
    unverifiedCount: number;
    missingContactCount: number;
    missingHoursCount: number;
    duplicatesCount: number;
    suggestions: string[];
  }> {
    try {
      const { Amenity } = await import("@kaa/models");

      const filter: any = { isActive: true };
      if (county) {
        filter["location.county"] = county;
      }

      const [
        totalAmenities,
        unverifiedAmenities,
        missingContactAmenities,
        missingHoursAmenities,
        duplicates,
      ] = await Promise.all([
        Amenity.countDocuments(filter),
        Amenity.countDocuments({ ...filter, verified: false }),
        Amenity.countDocuments({
          ...filter,
          $or: [
            { "contact.phone": { $exists: false } },
            { "contact.phone": "" },
            { "contact.email": { $exists: false } },
            { "contact.email": "" },
          ],
        }),
        Amenity.countDocuments({
          ...filter,
          operatingHours: { $exists: false },
        }),
        AmenityService.findDuplicateAmenities(),
      ]);

      const suggestions: string[] = [];

      if (unverifiedAmenities > totalAmenities * 0.3) {
        suggestions.push(
          `${unverifiedAmenities} amenities need verification (${Math.round((unverifiedAmenities / totalAmenities) * 100)}%)`
        );
      }

      if (missingContactAmenities > totalAmenities * 0.5) {
        suggestions.push(
          `${missingContactAmenities} amenities missing contact information`
        );
      }

      if (missingHoursAmenities > totalAmenities * 0.4) {
        suggestions.push(
          `${missingHoursAmenities} amenities missing operating hours`
        );
      }

      if (duplicates.length > 0) {
        suggestions.push(
          `${duplicates.length} potential duplicate groups found`
        );
      }

      if (totalAmenities < 100 && !county) {
        suggestions.push(
          "Consider running discovery for more counties to improve coverage"
        );
      }

      return {
        totalAmenities,
        unverifiedCount: unverifiedAmenities,
        missingContactCount: missingContactAmenities,
        missingHoursCount: missingHoursAmenities,
        duplicatesCount: duplicates.length,
        suggestions,
      };
    } catch (error) {
      logger.error("Error validating amenity data:", error);
      throw new Error("Failed to validate amenity data");
    }
  }

  /**
   * Auto-discover amenities for properties in a specific area
   * This can be run as a cron job or triggered manually
   */
  static async autoDiscoverForArea(
    county: string,
    options: {
      maxPropertiesPerRun?: number;
      radiusMeters?: number;
      onlyMissingAmenities?: boolean;
    } = {}
  ): Promise<{
    propertiesProcessed: number;
    amenitiesDiscovered: number;
    amenitiesSaved: number;
    errors: string[];
  }> {
    try {
      const {
        maxPropertiesPerRun = 20,
        radiusMeters = 2000,
        onlyMissingAmenities = true,
      } = options;

      const mongoose = await import("mongoose");
      const Property = mongoose.model("Property");

      // Build filter for properties to process
      const filter: any = {
        "location.county": county,
        status: "active",
      };

      if (onlyMissingAmenities) {
        filter.$or = [
          { "location.nearbyAmenities": { $exists: false } },
          { "location.nearbyAmenities": { $size: 0 } },
        ];
      }

      const properties = await Property.find(filter)
        .select("_id")
        .limit(maxPropertiesPerRun)
        .lean();

      if (properties.length === 0) {
        logger.info(`No properties to process in ${county}`);
        return {
          propertiesProcessed: 0,
          amenitiesDiscovered: 0,
          amenitiesSaved: 0,
          errors: [],
        };
      }

      const propertyIds = properties.map((p) =>
        (p._id as Types.ObjectId).toString()
      );

      logger.info(
        `Auto-discovering amenities for ${properties.length} properties in ${county}`
      );

      const result =
        await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
          propertyIds,
          {
            radius: radiusMeters,
            batchSize: 3, // Conservative batch size for background processing
            delayMs: 2000, // Longer delay to be respectful to external APIs
          }
        );

      logger.info(`Auto-discovery completed for ${county}`, result);

      return {
        propertiesProcessed: result.processed,
        amenitiesDiscovered: result.totalDiscovered,
        amenitiesSaved: result.totalSaved,
        errors: result.errors,
      };
    } catch (error) {
      logger.error(`Error in auto-discovery for ${county}:`, error);
      throw new Error(`Failed to auto-discover amenities for ${county}`);
    }
  }

  /**
   * Property lifecycle hook - call this when properties are created
   */
  static async handlePropertyCreated(propertyData: IProperty): Promise<void> {
    try {
      if (!propertyData._id) return;

      // Schedule discovery for background processing using queue
      await AutoPopulationService.onPropertyCreated(
        propertyData._id.toString()
      );

      logger.info("Scheduled amenity discovery for new property", {
        propertyId: propertyData._id,
        county: propertyData.location?.county,
      });
    } catch (error) {
      logger.error("Error handling property creation:", error);
    }
  }

  /**
   * Property lifecycle hook - call this when property location is updated
   */
  static async handlePropertyLocationUpdated(
    propertyId: string,
    oldLocation: any,
    newLocation: any
  ): Promise<void> {
    try {
      // Check if coordinates actually changed
      const oldLat = oldLocation?.coordinates?.latitude;
      const oldLng = oldLocation?.coordinates?.longitude;
      const newLat = newLocation?.coordinates?.latitude;
      const newLng = newLocation?.coordinates?.longitude;

      if (oldLat && oldLng && newLat && newLng) {
        const distance = AutoPopulationService.calculateDistance(
          oldLat,
          oldLng,
          newLat,
          newLng
        );

        // Only trigger if moved more than 500m
        if (distance > 0.5) {
          await AutoPopulationService.onPropertyLocationUpdated(propertyId);

          logger.info("Scheduled amenity update for property location change", {
            propertyId,
            distanceMoved: distance,
            oldCounty: oldLocation?.county,
            newCounty: newLocation?.county,
          });
        }
      } else if (newLat && newLng && !(oldLat && oldLng)) {
        // New coordinates added
        await AutoPopulationService.onPropertyCreated(propertyId);
      }
    } catch (error) {
      logger.error("Error handling property location update:", error);
    }
  }

  /**
   * Calculate distance between two points
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
   * Health check for the auto-population service
   */
  static async getHealthStatus() {
    try {
      // Get queue count from BullMQ
      const queueCount = await amenityDiscoveryQueue.count();

      const config = AmenityDiscoveryService.getConfig();

      return {
        queueSize: queueCount,
        isProcessing: false, // With BullMQ, processing status is managed by the queue system
        configStatus: {
          googlePlacesConfigured: !!config.googlePlacesApiKey,
          osmEnabled: config.useOpenStreetMap,
        },
      };
    } catch (error) {
      logger.error("Error getting auto-population health status:", error);
      throw new Error("Failed to get auto-population health status");
    }
  }

  /**
   * Emergency stop - clears queue and stops processing
   * @deprecated Use BullMQ queue management instead
   */
  static emergencyStop(): void {
    AutoPopulationService.clearQueue();
    AutoPopulationService.isProcessing = false;
    logger.warn("Emergency stop triggered for auto-population service");
  }

  /**
   * Get statistics about auto-discovered amenities
   */
  static async getAutoDiscoveryStats(county?: string): Promise<{
    totalAutoDiscovered: number;
    sourceBreakdown: Record<string, number>;
    verificationRate: number;
    categoryCounts: Record<string, number>;
  }> {
    try {
      const { Amenity } = await import("@kaa/models");

      const filter: any = {
        isActive: true,
        tags: "auto-discovered",
      };

      if (county) {
        filter["location.county"] = county;
      }

      const [totalStats, sourceStats, verifiedStats, categoryStats] =
        await Promise.all([
          Amenity.countDocuments(filter),
          Amenity.aggregate([
            { $match: filter },
            { $unwind: "$tags" },
            { $match: { tags: { $in: ["google-places", "openstreetmap"] } } },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
          ]),
          Amenity.countDocuments({ ...filter, verified: true }),
          Amenity.aggregate([
            { $match: filter },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ]),
        ]);

      const sourceBreakdown: Record<string, number> = {};
      for (const stat of sourceStats) {
        sourceBreakdown[stat._id] = stat.count;
      }

      const categoryCounts: Record<string, number> = {};
      for (const stat of categoryStats) {
        categoryCounts[stat._id] = stat.count;
      }

      const verificationRate =
        totalStats > 0 ? Math.round((verifiedStats / totalStats) * 100) : 0;

      return {
        totalAutoDiscovered: totalStats,
        sourceBreakdown,
        verificationRate,
        categoryCounts,
      };
    } catch (error) {
      logger.error("Error getting auto-discovery stats:", error);
      throw new Error("Failed to get auto-discovery statistics");
    }
  }
}
