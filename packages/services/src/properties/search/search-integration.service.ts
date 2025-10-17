import type { IContractor, IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { elasticsearchService } from "./elasticsearch.service";
import { searchAnalyticsService } from "./search-analytics.service";

/**
 * Search integration service that coordinates between different search components
 */
class SearchIntegrationService {
  /**
   * Initialize search service and sync data
   */
  async initialize(): Promise<void> {
    try {
      logger.info("Initializing search integration service...");

      // Check Elasticsearch health
      if (!elasticsearchService.isHealthy()) {
        logger.warn(
          "Elasticsearch is not healthy, search features may be limited"
        );
        return;
      }

      // Perform initial data sync if needed
      await this.syncDataIfNeeded();

      logger.info("Search integration service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize search integration service:", error);
    }
  }

  /**
   * Sync data from database to Elasticsearch if indices are empty
   */
  private async syncDataIfNeeded(): Promise<void> {
    try {
      // Check if we need to sync data (this is a simplified check)
      const propertiesCount = await this.getIndexDocumentCount("properties");
      const contractorsCount = await this.getIndexDocumentCount("contractors");

      if (propertiesCount === 0 || contractorsCount === 0) {
        logger.info("Indices appear to be empty, triggering data sync...");
        await elasticsearchService.reindexAll();
      }
    } catch (error) {
      logger.error("Failed to sync data:", error);
    }
  }

  /**
   * Get document count for an index
   */
  private async getIndexDocumentCount(index: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In a real scenario, you'd query Elasticsearch for the count
      return await Promise.resolve(0);
    } catch (error) {
      logger.error(`Failed to get document count for index ${index}:`, error);
      return await Promise.resolve(0);
    }
  }

  /**
   * Handle property creation/update
   */
  async onPropertyChange(
    property: IProperty,
    action: "create" | "update" | "delete"
  ): Promise<void> {
    try {
      switch (action) {
        case "create":
        case "update":
          await elasticsearchService.indexProperty(property);
          logger.debug(`Property ${property._id} indexed for ${action}`);
          break;
        case "delete":
          await elasticsearchService.deleteDocument(
            "properties",
            (property._id as any).toString()
          );
          logger.debug(`Property ${property._id} removed from index`);
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error(`Failed to handle property ${action}:`, error);
    }
  }

  /**
   * Handle contractor creation/update
   */
  async onContractorChange(
    contractor: IContractor,
    action: "create" | "update" | "delete"
  ): Promise<void> {
    try {
      switch (action) {
        case "create":
        case "update":
          await elasticsearchService.indexContractor(contractor);
          logger.debug(`Contractor ${contractor._id} indexed for ${action}`);
          break;
        case "delete":
          await elasticsearchService.deleteDocument(
            "contractors",
            (contractor._id as any).toString()
          );
          logger.debug(`Contractor ${contractor._id} removed from index`);
          break;
        default:
          break;
      }
    } catch (error) {
      logger.error(`Failed to handle contractor ${action}:`, error);
    }
  }

  /**
   * Get search health status
   */
  getHealthStatus(): {
    elasticsearch: boolean;
    analytics: boolean;
    overall: boolean;
  } {
    const elasticsearch = elasticsearchService.isHealthy();
    const analytics = true; // Analytics service is always available (in-memory)

    return {
      elasticsearch,
      analytics,
      overall: elasticsearch && analytics,
    };
  }

  /**
   * Get search statistics
   */
  async getSearchStatistics(): Promise<{
    elasticsearch: {
      connected: boolean;
      indices: string[];
    };
    analytics: {
      totalSearches: number;
      averageResponseTime: number;
      popularQueries: Array<{ query: string; count: number }>;
    };
  }> {
    try {
      const analytics = await searchAnalyticsService.getAnalytics(24);

      return {
        elasticsearch: {
          connected: elasticsearchService.isHealthy(),
          indices: ["properties", "contractors"],
        },
        analytics: {
          totalSearches: analytics.totalSearches,
          averageResponseTime: analytics.averageResponseTime,
          popularQueries: analytics.popularQueries.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error("Failed to get search statistics:", error);
      throw error;
    }
  }

  /**
   * Perform maintenance tasks
   */
  async performMaintenance(): Promise<void> {
    try {
      logger.info("Starting search maintenance tasks...");

      // Clear old analytics events
      await searchAnalyticsService.clearOldEvents(168); // 7 days

      // Check Elasticsearch health
      if (!elasticsearchService.isHealthy()) {
        logger.warn("Elasticsearch health check failed during maintenance");
      }

      logger.info("Search maintenance tasks completed");
    } catch (error) {
      logger.error("Search maintenance failed:", error);
    }
  }
}

export const searchIntegrationService = new SearchIntegrationService();
