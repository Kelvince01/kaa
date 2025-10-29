import type { IContractor, IProperty } from "@kaa/models/types";
// import { searchIntegrationService } from "./search-integration.service";
import { logger } from "@kaa/utils";
import { typesenseService } from "./typesense.service";

/**
 * Search indexing service for handling automatic indexing of data changes
 */
class SearchIndexingService {
  private indexingQueue: Array<{
    type: "property" | "contractor";
    action: "create" | "update" | "delete";
    data: any;
    timestamp: Date;
  }> = [];

  private isProcessing = false;
  private readonly batchSize = 10;
  private readonly processingInterval = 5000; // 5 seconds

  constructor() {
    // Start background processing
    this.startBackgroundProcessing();
  }

  /**
   * Queue property for indexing
   */
  async queuePropertyIndexing(
    property: IProperty,
    action: "create" | "update" | "delete"
  ): Promise<void> {
    this.indexingQueue.push({
      type: "property",
      action,
      data: property,
      timestamp: new Date(),
    });

    logger.debug(`Queued property ${property._id} for ${action} indexing`);

    // Process immediately for critical operations
    if (action === "delete") {
      await this.processQueue();
    }
  }

  /**
   * Queue contractor for indexing
   */
  async queueContractorIndexing(
    contractor: IContractor,
    action: "create" | "update" | "delete"
  ): Promise<void> {
    this.indexingQueue.push({
      type: "contractor",
      action,
      data: contractor,
      timestamp: new Date(),
    });

    logger.debug(`Queued contractor ${contractor._id} for ${action} indexing`);

    // Process immediately for critical operations
    if (action === "delete") {
      await this.processQueue();
    }
  }

  /**
   * Process indexing queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.indexingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process items in batches
      const batch = this.indexingQueue.splice(0, this.batchSize);

      logger.debug(`Processing ${batch.length} indexing operations`);

      // Group operations by type and action for efficiency
      const operations = this.groupOperations(batch);

      // Process each group
      for (const [key, items] of Object.entries(operations)) {
        const [type, action] = key.split(":");
        await this.processBatch(
          type as "property" | "contractor",
          action as any,
          items
        );
      }

      logger.debug(`Completed processing ${batch.length} indexing operations`);
    } catch (error) {
      logger.error("Error processing indexing queue:", error);

      // Re-queue failed items (with a limit to prevent infinite loops)
      // In a production system, you might want to use a dead letter queue
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group operations by type and action for batch processing
   */
  private groupOperations(batch: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    for (const item of batch) {
      const key = `${item.type}:${item.action}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }

    return groups;
  }

  /**
   * Process a batch of similar operations
   */
  private async processBatch(
    type: "property" | "contractor",
    action: "create" | "update" | "delete",
    items: any[]
  ): Promise<void> {
    try {
      if (action === "delete") {
        // Handle deletions individually
        for (const item of items) {
          const index = type === "property" ? "properties" : "contractors";
          await typesenseService.deleteDocument(
            index,
            (item.data._id as any).toString()
          );
        }
      } else {
        // Handle creates/updates in bulk
        const documents = items.map((item) => ({
          id: (item.data._id as any).toString(),
          body: this.transformForIndex(item.data, type),
        }));

        const index = type === "property" ? "properties" : "contractors";
        await typesenseService.bulkIndex(index, documents);
      }

      logger.debug(
        `Successfully processed ${items.length} ${type} ${action} operations`
      );
    } catch (error) {
      logger.error(`Failed to process ${type} ${action} batch:`, error);
      throw error;
    }
  }

  /**
   * Transform data for indexing
   */
  private transformForIndex(
    data: IProperty | IContractor,
    type: "property" | "contractor"
  ): any {
    if (type === "property") {
      const property = data as IProperty;
      return {
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
      };
    }
    const contractor = data as IContractor;
    return {
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
    };
  }

  /**
   * Start background processing
   */
  private startBackgroundProcessing(): void {
    setInterval(() => {
      this.processQueue().catch((error) => {
        logger.error("Background indexing processing failed:", error);
      });
    }, this.processingInterval);

    logger.info("Search indexing background processing started");
  }

  /**
   * Force process all queued items
   */
  async forceProcessQueue(): Promise<void> {
    while (this.indexingQueue.length > 0) {
      await this.processQueue();
      // Small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    oldestItem?: Date;
  } {
    const oldestItem =
      this.indexingQueue.length > 0
        ? this.indexingQueue[0]?.timestamp
        : undefined;

    return {
      queueLength: this.indexingQueue.length,
      isProcessing: this.isProcessing,
      oldestItem,
    };
  }

  /**
   * Clear the queue (use with caution)
   */
  clearQueue(): void {
    const clearedCount = this.indexingQueue.length;
    this.indexingQueue = [];
    logger.warn(`Cleared ${clearedCount} items from indexing queue`);
  }

  /**
   * Bulk reindex all data
   */
  async reindexAll(): Promise<void> {
    try {
      logger.info("Starting full reindex...");

      // Clear existing queue
      this.clearQueue();

      // Trigger full reindex
      await typesenseService.reindexAll();

      logger.info("Full reindex completed");
    } catch (error) {
      logger.error("Full reindex failed:", error);
      throw error;
    }
  }
}

export const searchIndexingService = new SearchIndexingService();

/**
 * Mongoose middleware helpers for automatic indexing
 */
export const createIndexingMiddleware = () => {
  return {
    // Property middleware
    property: {
      post: {
        save: async (doc: IProperty) => {
          const isNew = doc.isNew;
          await searchIndexingService.queuePropertyIndexing(
            doc,
            isNew ? "create" : "update"
          );
        },
        remove: async (doc: IProperty) => {
          await searchIndexingService.queuePropertyIndexing(doc, "delete");
        },
        findOneAndDelete: async (doc: IProperty) => {
          if (doc) {
            await searchIndexingService.queuePropertyIndexing(doc, "delete");
          }
        },
      },
    },

    // Contractor middleware
    contractor: {
      post: {
        save: async (doc: IContractor) => {
          const isNew = doc.isNew;
          await searchIndexingService.queueContractorIndexing(
            doc,
            isNew ? "create" : "update"
          );
        },
        remove: async (doc: IContractor) => {
          await searchIndexingService.queueContractorIndexing(doc, "delete");
        },
        findOneAndDelete: async (doc: IContractor) => {
          if (doc) {
            await searchIndexingService.queueContractorIndexing(doc, "delete");
          }
        },
      },
    },
  };
};
