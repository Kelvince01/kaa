import type { IContractor, IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import type mongoose from "mongoose";
import { typesenseService } from "./typesense.service";

/**
 * Service to sync MongoDB changes with Typesense
 */
class SearchSyncService {
  /**
   * Sync property to Typesense when created or updated
   */
  async syncProperty(
    property: IProperty,
    operation: "create" | "update" | "delete"
  ): Promise<void> {
    try {
      if (operation === "delete") {
        await typesenseService.deleteDocument(
          "properties",
          (property._id as mongoose.Types.ObjectId).toString()
        );
        logger.debug(`Property ${property._id} removed from search index`);
      } else {
        await typesenseService.indexProperty(property);
        logger.debug(`Property ${property._id} synced to search index`);
      }
    } catch (error) {
      logger.error(
        `Failed to sync property ${property._id} to search index:`,
        error
      );
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Sync contractor to Typesense when created or updated
   */
  async syncContractor(
    contractor: IContractor,
    operation: "create" | "update" | "delete"
  ): Promise<void> {
    try {
      if (operation === "delete") {
        await typesenseService.deleteDocument(
          "contractors",
          (contractor._id as mongoose.Types.ObjectId).toString()
        );
        logger.debug(`Contractor ${contractor._id} removed from search index`);
      } else {
        await typesenseService.indexContractor(contractor);
        logger.debug(`Contractor ${contractor._id} synced to search index`);
      }
    } catch (error) {
      logger.error(
        `Failed to sync contractor ${contractor._id} to search index:`,
        error
      );
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Batch sync multiple properties
   */
  async batchSyncProperties(properties: IProperty[]): Promise<void> {
    try {
      const documents = properties.map((property) => ({
        id: (property._id as mongoose.Types.ObjectId).toString(),
        body: {
          title: property.title,
          description: property.description,
          type: property.type,
          status: property.status,
          location: {
            coordinates: property.geolocation?.coordinates
              ? {
                  lat: property.geolocation.coordinates[1],
                  lon: property.geolocation.coordinates[0],
                }
              : null,
            address: property.location.address,
            county: property.location.county,
            constituency: property.location.constituency,
            ward: property.location.ward,
            estate: property.location.estate,
          },
          geolocation: property.geolocation?.coordinates
            ? {
                lat: property.geolocation.coordinates[1],
                lon: property.geolocation.coordinates[0],
              }
            : null,
          pricing: property.pricing,
          details: property.specifications,
          features: property.featured || [],
          amenities: property.amenities || [],
          available: property.availability.isAvailable,
          availableFrom: property.availability.availableFrom || undefined,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      }));

      await typesenseService.bulkIndex("properties", documents);
      logger.info(
        `Batch synced ${properties.length} properties to search index`
      );
    } catch (error) {
      logger.error("Failed to batch sync properties to search index:", error);
    }
  }

  /**
   * Batch sync multiple contractors
   */
  async batchSyncContractors(contractors: IContractor[]): Promise<void> {
    try {
      const documents = contractors.map((contractor) => ({
        id: (contractor._id as mongoose.Types.ObjectId).toString(),
        body: {
          name: contractor.name,
          company: contractor.company,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
          specialties: contractor.specialties,
          status: contractor.status,
          serviceAreas: contractor.serviceAreas,
          averageRating: contractor.averageRating,
          totalJobs: contractor.totalJobs,
          completedJobs: contractor.completedJobs,
          onTimePercentage: contractor.onTimePercentage,
          emergencyAvailable: contractor.emergencyAvailable,
          hourlyRate: contractor.hourlyRate,
          availability: contractor.availability,
          createdAt: contractor.createdAt,
          updatedAt: contractor.updatedAt,
        },
      }));

      await typesenseService.bulkIndex("contractors", documents);
      logger.info(
        `Batch synced ${contractors.length} contractors to search index`
      );
    } catch (error) {
      logger.error("Failed to batch sync contractors to search index:", error);
    }
  }
}

export const searchSyncService = new SearchSyncService();
