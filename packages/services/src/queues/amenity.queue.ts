import { createQueue, logger, redisOptions } from "@kaa/utils";
import { Worker } from "bullmq";
import { AmenityDiscoveryService } from "../properties/discovery.service";
// import { AutoPopulationService } from "../properties/auto-population.service";

// Create queue for amenity discovery
export const amenityDiscoveryQueue = createQueue("amenity-discovery");

// Store worker instance for graceful shutdown
let amenityDiscoveryWorker: Worker | null = null;

// Function to initialize the worker
export function initializeAmenityDiscoveryWorker() {
  if (amenityDiscoveryWorker) {
    logger.warn("Amenity discovery worker already initialized");
    return amenityDiscoveryWorker;
  }

  // Create worker to process amenity discovery jobs
  amenityDiscoveryWorker = new Worker(
    "amenity-discovery",
    async (job) => {
      logger.info(`Processing amenity discovery job ${job.id}`, {
        name: job.name,
      });

      try {
        if (job.name === "discover-property-amenities") {
          const { propertyId, options } = job.data;
          logger.info(`Discovering amenities for property ${propertyId}`);

          const result =
            await AmenityDiscoveryService.discoverPropertyAmenities(
              propertyId,
              options
            );

          logger.info(
            `Completed amenity discovery for property ${propertyId}`,
            {
              discovered: result.discovered.length,
              saved: result.saved,
            }
          );

          return result;
        }
        if (job.name === "discover-batch-amenities") {
          const { propertyIds, options } = job.data;
          logger.info(
            `Discovering amenities for ${propertyIds.length} properties`
          );

          const result =
            await AmenityDiscoveryService.batchDiscoverPropertyAmenities(
              propertyIds,
              options
            );

          logger.info(
            `Completed batch amenity discovery for ${propertyIds.length} properties`,
            {
              processed: result.processed,
              discovered: result.totalDiscovered,
              saved: result.totalSaved,
            }
          );

          return result;
        }
        if (job.name === "discover-county-amenities") {
          const { county, options } = job.data;
          logger.info(`Discovering amenities for county ${county}`);

          const result = await AmenityDiscoveryService.discoverCountyAmenities(
            county,
            options
          );

          logger.info(`Completed county amenity discovery for ${county}`, {
            propertiesProcessed: result.propertiesProcessed,
            discovered: result.totalDiscovered,
            saved: result.totalSaved,
          });

          return result;
        }
      } catch (error) {
        logger.error(
          `Error processing amenity discovery job ${job.id}:`,
          error
        );
        throw error;
      }
    },
    {
      connection: redisOptions,
      concurrency: 3, // Limit concurrency to be respectful to external APIs
    }
  );

  // Handle worker events
  amenityDiscoveryWorker.on("completed", (job) => {
    logger.info(`Amenity discovery job ${job.id} completed successfully`, {
      name: job.name,
    });
  });

  amenityDiscoveryWorker.on("failed", (job, error) => {
    logger.error(`Amenity discovery job ${job?.id} failed:`, error);
  });

  logger.info("Amenity discovery worker initialized");

  return amenityDiscoveryWorker;
}

// Initialize worker immediately
initializeAmenityDiscoveryWorker();

// Graceful shutdown handler
export async function shutdownAmenityDiscoveryWorker() {
  if (amenityDiscoveryWorker) {
    logger.info("Shutting down amenity discovery worker...");
    await amenityDiscoveryWorker.close();
    amenityDiscoveryWorker = null;
    logger.info("Amenity discovery worker shut down successfully");
  }
}

export default amenityDiscoveryWorker;
