/**
 * Search module exports
 *
 * This module provides comprehensive search functionality including:
 * - Elasticsearch integration for full-text and geo-search
 * - Advanced search with filters and aggregations
 * - Search analytics and performance monitoring
 * - Automatic indexing of data changes
 * - Search middleware for rate limiting and validation
 */

import { elasticsearchService } from "./elasticsearch.service";
import { searchIntegrationService } from "./search-integration.service";

// Types
export type { SearchQuery, SearchResult } from "./elasticsearch.service";
// Core services
export { elasticsearchService } from "./elasticsearch.service";
export type {
  // SearchFilters,
  // SearchOptions,
  // ParsedSearchQuery,
  SearchEntityType,
  SearchSource,
  SortOrder,
} from "./search.config";
export * from "./search.config";
// Utilities
export * from "./search.util";
export type { SearchAnalytics, SearchEvent } from "./search-analytics.service";
export { searchAnalyticsService } from "./search-analytics.service";
export {
  createIndexingMiddleware,
  searchIndexingService,
} from "./search-indexing.service";
export { searchIntegrationService } from "./search-integration.service";

/**
 * Initialize search services
 * Call this function during application startup
 */
export async function initializeSearchServices(): Promise<void> {
  try {
    await searchIntegrationService.initialize();
    console.log("Search services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize search services:", error);
    throw error;
  }
}

/**
 * Search service health check
 */
export function getSearchHealthStatus() {
  return searchIntegrationService.getHealthStatus();
}

/**
 * Quick search function for programmatic use
 */
export async function quickSearch(
  query: string,
  type: "properties" | "contractors" = "properties",
  options: {
    limit?: number;
    location?: { lat: number; lon: number; distance?: string };
    filters?: any;
  } = {}
) {
  const searchQuery: any = {
    query,
    pagination: { page: 1, limit: options.limit || 10 },
  };

  if (options.location) {
    searchQuery.location = options.location;
  }

  if (options.filters) {
    searchQuery.filters = options.filters;
  }

  if (type === "contractors") {
    return await elasticsearchService.searchContractors(searchQuery);
  }
  return await elasticsearchService.searchProperties(searchQuery);
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(
  query: string,
  type: "properties" | "contractors" = "properties"
): Promise<string[]> {
  return await elasticsearchService.getSuggestions(query, type);
}

/**
 * Find nearby items
 */
export async function findNearby(
  lat: number,
  lon: number,
  type: "properties" | "contractors" = "properties",
  distance = "5km",
  limit = 20
) {
  const searchQuery = {
    location: { lat, lon, distance },
    pagination: { page: 1, limit },
  };

  if (type === "contractors") {
    return await elasticsearchService.searchContractors(searchQuery);
  }
  return await elasticsearchService.searchProperties(searchQuery);
}
