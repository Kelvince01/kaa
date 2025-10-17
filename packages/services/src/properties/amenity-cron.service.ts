import { logger } from "@kaa/utils";
import { CronJob } from "cron";
import { AmenityService } from "./amenity.service";
import { AutoPopulationService } from "./auto-population.service";

/**
 * Cron service for automated amenity discovery and maintenance
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AmenityCronService {
  private static jobs: Map<string, CronJob> = new Map();
  private static isInitialized = false;

  /**
   * Initialize all cron jobs
   */
  static initialize(): void {
    if (AmenityCronService.isInitialized) {
      logger.warn("Amenity cron service already initialized");
      return;
    }

    try {
      AmenityCronService.setupDiscoveryJobs();
      AmenityCronService.setupMaintenanceJobs();
      AmenityCronService.isInitialized = true;

      logger.info("Amenity cron service initialized successfully");
    } catch (error) {
      logger.error("Error initializing amenity cron service:", error);
    }
  }

  /**
   * Setup discovery-related cron jobs
   */
  private static setupDiscoveryJobs(): void {
    // Discover missing amenities for Nairobi properties every hour
    const nairobiDiscoveryJob = new CronJob(
      "0 */1 * * *", // Every hour
      async () => {
        try {
          logger.info("Starting scheduled amenity discovery for Nairobi");

          const result = await AutoPopulationService.autoDiscoverForArea(
            "Nairobi",
            {
              maxPropertiesPerRun: 10,
              radiusMeters: 2000,
              onlyMissingAmenities: true,
            }
          );

          logger.info(
            "Completed scheduled amenity discovery for Nairobi",
            result
          );
        } catch (error) {
          logger.error("Error in scheduled Nairobi amenity discovery:", error);
        }
      },
      null,
      false, // Don't start immediately
      "Africa/Nairobi"
    );

    // Discover missing amenities for other major counties every 4 hours
    const majorCountiesDiscoveryJob = new CronJob(
      "0 */4 * * *", // Every 4 hours
      async () => {
        try {
          const counties = ["Mombasa", "Kisumu", "Nakuru", "Eldoret"];

          for (const county of counties) {
            logger.info(`Starting scheduled amenity discovery for ${county}`);

            const result = await AutoPopulationService.autoDiscoverForArea(
              county,
              {
                maxPropertiesPerRun: 5,
                radiusMeters: 2000,
                onlyMissingAmenities: true,
              }
            );

            logger.info(
              `Completed scheduled amenity discovery for ${county}`,
              result
            );

            // Wait 10 minutes between counties to respect API limits
            if (county !== counties.at(-1)) {
              await new Promise((resolve) =>
                setTimeout(resolve, 10 * 60 * 1000)
              );
            }
          }
        } catch (error) {
          logger.error(
            "Error in scheduled major counties amenity discovery:",
            error
          );
        }
      },
      null,
      false,
      "Africa/Nairobi"
    );

    // Discover missing amenities for all properties once daily
    const globalDiscoveryJob = new CronJob(
      "0 2 * * *", // Daily at 2 AM
      async () => {
        try {
          logger.info("Starting daily global amenity discovery");

          const result = await AutoPopulationService.discoverMissingAmenities({
            batchSize: 5,
            maxProperties: 50,
          });

          logger.info("Completed daily global amenity discovery", result);
        } catch (error) {
          logger.error("Error in daily global amenity discovery:", error);
        }
      },
      null,
      false,
      "Africa/Nairobi"
    );

    AmenityCronService.jobs.set("nairobi-discovery", nairobiDiscoveryJob);
    AmenityCronService.jobs.set(
      "major-counties-discovery",
      majorCountiesDiscoveryJob
    );
    AmenityCronService.jobs.set("global-discovery", globalDiscoveryJob);
  }

  /**
   * Setup maintenance-related cron jobs
   */
  private static setupMaintenanceJobs(): void {
    // Refresh stale amenities weekly
    const refreshStaleJob = new CronJob(
      "0 3 * * 0", // Weekly on Sunday at 3 AM
      async () => {
        try {
          logger.info("Starting weekly stale amenities refresh");

          const result = await AutoPopulationService.refreshStaleAmenities(30, {
            batchSize: 3,
            maxProperties: 30,
          });

          logger.info("Completed weekly stale amenities refresh", result);
        } catch (error) {
          logger.error("Error in weekly stale amenities refresh:", error);
        }
      },
      null,
      false,
      "Africa/Nairobi"
    );

    // Clean up duplicate amenities weekly
    const duplicateCleanupJob = new CronJob(
      "0 4 * * 0", // Weekly on Sunday at 4 AM
      async () => {
        try {
          logger.info("Starting weekly duplicate amenities cleanup");

          const duplicates = await AmenityService.findDuplicateAmenities();

          if (duplicates.length > 0) {
            logger.info(`Found ${duplicates.length} duplicate groups`);

            // Log duplicates for manual review - we don't auto-delete
            for (const duplicate of duplicates) {
              logger.warn("Duplicate amenities found", {
                name: duplicate.name,
                type: duplicate.type,
                count: duplicate.duplicates.length,
                ids: duplicate.duplicates.map((d) => d._id),
              });
            }
          }

          logger.info("Completed weekly duplicate amenities check");
        } catch (error) {
          logger.error("Error in weekly duplicate cleanup:", error);
        }
      },
      null,
      false,
      "Africa/Nairobi"
    );

    // Validate amenity data quality daily
    const dataValidationJob = new CronJob(
      "0 1 * * *", // Daily at 1 AM
      async () => {
        try {
          logger.info("Starting daily amenity data validation");

          const validation = await AutoPopulationService.validateAmenityData();

          logger.info("Daily amenity data validation completed", validation);

          // Log warnings for data quality issues
          if (validation.suggestions.length > 0) {
            logger.warn(
              "Amenity data quality issues found:",
              validation.suggestions
            );
          }
        } catch (error) {
          logger.error("Error in daily amenity data validation:", error);
        }
      },
      null,
      false,
      "Africa/Nairobi"
    );

    AmenityCronService.jobs.set("refresh-stale", refreshStaleJob);
    AmenityCronService.jobs.set("duplicate-cleanup", duplicateCleanupJob);
    AmenityCronService.jobs.set("data-validation", dataValidationJob);
  }

  /**
   * Start all cron jobs
   */
  static startAll(): void {
    try {
      for (const [name, job] of AmenityCronService.jobs) {
        if (!job.isCallbackRunning) {
          job.start();
          logger.info(`Started cron job: ${name}`);
        }
      }

      logger.info("All amenity cron jobs started");
    } catch (error) {
      logger.error("Error starting amenity cron jobs:", error);
    }
  }

  /**
   * Stop all cron jobs
   */
  static stopAll(): void {
    try {
      for (const [name, job] of AmenityCronService.jobs) {
        if (job.isCallbackRunning) {
          job.stop();
          logger.info(`Stopped cron job: ${name}`);
        }
      }

      logger.info("All amenity cron jobs stopped");
    } catch (error) {
      logger.error("Error stopping amenity cron jobs:", error);
    }
  }

  /**
   * Start a specific cron job
   */
  static startJob(jobName: string): boolean {
    try {
      const job = AmenityCronService.jobs.get(jobName);
      if (job && !job.isCallbackRunning) {
        job.start();
        logger.info(`Started cron job: ${jobName}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error starting cron job ${jobName}:`, error);
      return false;
    }
  }

  /**
   * Stop a specific cron job
   */
  static stopJob(jobName: string): boolean {
    try {
      const job = AmenityCronService.jobs.get(jobName);
      if (job?.isCallbackRunning) {
        job.stop();
        logger.info(`Stopped cron job: ${jobName}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error stopping cron job ${jobName}:`, error);
      return false;
    }
  }

  /**
   * Get status of all cron jobs
   */
  static getJobsStatus(): Record<
    string,
    { running: boolean; nextDate?: Date }
  > {
    const status: Record<string, { running: boolean; nextDate?: Date }> = {};

    for (const [name, job] of AmenityCronService.jobs) {
      status[name] = {
        running: job.isCallbackRunning,
        nextDate: job.nextDate()?.toJSDate(),
      };
    }

    return status;
  }

  /**
   * Manually trigger a discovery job for a specific county
   */
  static async triggerCountyDiscovery(
    county: string,
    options: {
      maxProperties?: number;
      radiusMeters?: number;
    } = {}
  ): Promise<{
    propertiesProcessed: number;
    amenitiesDiscovered: number;
    amenitiesSaved: number;
    errors: string[];
  }> {
    try {
      logger.info(`Manually triggering amenity discovery for ${county}`);

      const result = await AutoPopulationService.autoDiscoverForArea(county, {
        maxPropertiesPerRun: options.maxProperties || 20,
        radiusMeters: options.radiusMeters || 2000,
        onlyMissingAmenities: true,
      });

      logger.info(`Manual discovery completed for ${county}`, result);

      return result;
    } catch (error) {
      logger.error(`Error in manual discovery for ${county}:`, error);
      throw error;
    }
  }

  /**
   * Get available job names
   */
  static getJobNames(): string[] {
    return Array.from(AmenityCronService.jobs.keys());
  }

  /**
   * Cleanup - stop all jobs and clear
   */
  static cleanup(): void {
    AmenityCronService.stopAll();
    AmenityCronService.jobs.clear();
    AmenityCronService.isInitialized = false;
    logger.info("Amenity cron service cleaned up");
  }
}
