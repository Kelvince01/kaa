import { type GeoPoint, logger } from "@kaa/utils";

/**
 * Search analytics service for tracking search patterns and performance
 */

export type SearchEvent = {
  query?: string;
  filters?: Record<string, any>;
  location?: GeoPoint;
  resultCount: number;
  responseTime: number;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  searchType: "properties" | "contractors";
  source: "web" | "mobile" | "api";
};

export type SearchAnalytics = {
  totalSearches: number;
  averageResponseTime: number;
  popularQueries: Array<{ query: string; count: number }>;
  popularFilters: Array<{ filter: string; value: string; count: number }>;
  searchesByLocation: Array<{ location: string; count: number }>;
  searchesByType: Record<string, number>;
  noResultsQueries: Array<{ query: string; count: number }>;
  performanceMetrics: {
    p50: number;
    p95: number;
    p99: number;
  };
};

class SearchAnalyticsService {
  private searchEvents: SearchEvent[] = [];
  private readonly maxEvents = 10_000; // Keep last 10k events in memory

  /**
   * Track a search event
   */
  trackSearch(event: Omit<SearchEvent, "timestamp">): void {
    const searchEvent: SearchEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.searchEvents.push(searchEvent);

    // Keep only recent events
    if (this.searchEvents.length > this.maxEvents) {
      this.searchEvents = this.searchEvents.slice(-this.maxEvents);
    }

    // Log slow searches
    if (event.responseTime > 1000) {
      logger.warn("Slow search detected", {
        query: event.query,
        responseTime: event.responseTime,
        resultCount: event.resultCount,
        searchType: event.searchType,
      });
    }

    // Log no-result searches
    if (event.resultCount === 0 && event.query) {
      logger.info("No results search", {
        query: event.query,
        filters: event.filters,
        searchType: event.searchType,
      });
    }
  }

  /**
   * Get search analytics for a time period
   */
  getAnalytics(hours = 24): SearchAnalytics {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentEvents = this.searchEvents.filter(
      (event) => event.timestamp >= cutoff
    );

    if (recentEvents.length === 0) {
      return this.getEmptyAnalytics();
    }

    return {
      totalSearches: recentEvents.length,
      averageResponseTime: this.calculateAverageResponseTime(recentEvents),
      popularQueries: this.getPopularQueries(recentEvents),
      popularFilters: this.getPopularFilters(recentEvents),
      searchesByLocation: this.getSearchesByLocation(recentEvents),
      searchesByType: this.getSearchesByType(recentEvents),
      noResultsQueries: this.getNoResultsQueries(recentEvents),
      performanceMetrics: this.getPerformanceMetrics(recentEvents),
    };
  }

  /**
   * Get popular search queries
   */
  private getPopularQueries(
    events: SearchEvent[]
  ): Array<{ query: string; count: number }> {
    const queryCount = new Map<string, number>();

    for (const event of events) {
      if (event.query?.trim()) {
        const query = event.query.toLowerCase().trim();
        queryCount.set(query, (queryCount.get(query) || 0) + 1);
      }
    }

    return Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get popular filters
   */
  private getPopularFilters(
    events: SearchEvent[]
  ): Array<{ filter: string; value: string; count: number }> {
    const filterCount = new Map<string, number>();

    for (const event of events) {
      if (event.filters) {
        for (const [key, value] of Object.entries(event.filters)) {
          if (value !== undefined && value !== null) {
            const filterKey = `${key}:${JSON.stringify(value)}`;
            filterCount.set(filterKey, (filterCount.get(filterKey) || 0) + 1);
          }
        }
      }
    }

    return Array.from(filterCount.entries())
      .map(([filterKey, count]) => {
        const [filter, value] = filterKey.split(":");
        return { filter: filter || "", value: value || "", count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get searches by location
   */
  private getSearchesByLocation(
    events: SearchEvent[]
  ): Array<{ location: string; count: number }> {
    const locationCount = new Map<string, number>();

    for (const event of events) {
      if (event.location) {
        // Round coordinates to create location buckets
        const lat = Math.round(event.location.lat * 100) / 100;
        const lon = Math.round(event.location.lon * 100) / 100;
        const locationKey = `${lat},${lon}`;
        locationCount.set(
          locationKey,
          (locationCount.get(locationKey) || 0) + 1
        );
      }
    }

    return Array.from(locationCount.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  /**
   * Get searches by type
   */
  private getSearchesByType(events: SearchEvent[]): Record<string, number> {
    const typeCount: Record<string, number> = {};

    for (const event of events) {
      typeCount[event.searchType] = (typeCount[event.searchType] || 0) + 1;
    }

    return typeCount;
  }

  /**
   * Get queries that returned no results
   */
  private getNoResultsQueries(
    events: SearchEvent[]
  ): Array<{ query: string; count: number }> {
    const noResultsEvents = events.filter(
      (event) => event.resultCount === 0 && event.query
    );
    return this.getPopularQueries(noResultsEvents);
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(events: SearchEvent[]): number {
    if (events.length === 0) return 0;

    const totalTime = events.reduce(
      (sum, event) => sum + event.responseTime,
      0
    );
    return Math.round(totalTime / events.length);
  }

  /**
   * Get performance metrics (percentiles)
   */
  private getPerformanceMetrics(events: SearchEvent[]): {
    p50: number;
    p95: number;
    p99: number;
  } {
    if (events.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const responseTimes = events
      .map((event) => event.responseTime)
      .sort((a, b) => a - b);

    return {
      p50: this.getPercentile(responseTimes, 50),
      p95: this.getPercentile(responseTimes, 95),
      p99: this.getPercentile(responseTimes, 99),
    };
  }

  /**
   * Calculate percentile
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get empty analytics object
   */
  private getEmptyAnalytics(): SearchAnalytics {
    return {
      totalSearches: 0,
      averageResponseTime: 0,
      popularQueries: [],
      popularFilters: [],
      searchesByLocation: [],
      searchesByType: {},
      noResultsQueries: [],
      performanceMetrics: { p50: 0, p95: 0, p99: 0 },
    };
  }

  /**
   * Get search suggestions based on popular queries
   */
  getSearchSuggestions(prefix: string, limit = 10): string[] {
    const lowerPrefix = prefix.toLowerCase();
    const recentEvents = this.searchEvents.filter(
      (event) =>
        event.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    const popularQueries = this.getPopularQueries(recentEvents);

    return popularQueries
      .filter(({ query }) => query.toLowerCase().startsWith(lowerPrefix))
      .slice(0, limit)
      .map(({ query }) => query);
  }

  /**
   * Clear old events (for memory management)
   */
  clearOldEvents(olderThanHours = 168): void {
    // Default: 7 days
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.searchEvents = this.searchEvents.filter(
      (event) => event.timestamp >= cutoff
    );

    logger.info(`Cleared ${this.searchEvents.length} old search events`);
  }

  /**
   * Export analytics data
   */
  exportAnalytics(hours = 24): SearchEvent[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.searchEvents.filter((event) => event.timestamp >= cutoff);
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();
