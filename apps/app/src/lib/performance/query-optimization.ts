import { QueryClient } from "@tanstack/react-query";

/**
 * Optimized React Query configuration for properties module
 */
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time optimization for different data types
        staleTime: 5 * 60 * 1000, // 5 minutes default

        // Cache time optimization
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30_000),

        // Refetch on window focus for critical data only
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Background refetch interval (disabled by default)
        refetchInterval: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,

        // Retry delay for mutations
        retryDelay: 1000,
      },
    },
  });
};

/**
 * Stale time configurations for different data types
 */
export const STALE_TIME_CONFIG = {
  // Static/rarely changing data - 30 minutes
  STATIC: 30 * 60 * 1000,

  // Property data - 15 minutes
  PROPERTY: 15 * 60 * 1000,

  // Contractor data - 10 minutes
  CONTRACTOR: 10 * 60 * 1000,

  // Insurance data - 5 minutes
  INSURANCE: 5 * 60 * 1000,

  // Schedule data - 2 minutes
  SCHEDULE: 2 * 60 * 1000,

  // Valuation data - 10 minutes
  VALUATION: 10 * 60 * 1000,

  // Real-time data - 30 seconds
  REALTIME: 30 * 1000,

  // User-specific data - 1 minute
  USER: 1 * 60 * 1000,
} as const;

/**
 * Cache time configurations for different data types
 */
export const CACHE_TIME_CONFIG = {
  // Keep static data in cache for 1 hour
  STATIC: 60 * 60 * 1000,

  // Keep property data for 30 minutes
  PROPERTY: 30 * 60 * 1000,

  // Keep contractor data for 20 minutes
  CONTRACTOR: 20 * 60 * 1000,

  // Keep insurance data for 15 minutes
  INSURANCE: 15 * 60 * 1000,

  // Keep schedule data for 10 minutes
  SCHEDULE: 10 * 60 * 1000,

  // Keep valuation data for 20 minutes
  VALUATION: 20 * 60 * 1000,

  // Keep real-time data for 2 minutes
  REALTIME: 2 * 60 * 1000,

  // Keep user data for 5 minutes
  USER: 5 * 60 * 1000,
} as const;

/**
 * Query key prefixes for organized cache management
 */
export const QUERY_KEY_PREFIXES = {
  PROPERTIES: "properties",
  CONTRACTORS: "contractors",
  INSURANCE: "insurance",
  SCHEDULES: "schedules",
  VALUATIONS: "valuations",
  USER: "user",
  NOTIFICATIONS: "notifications",
} as const;

/**
 * Performance monitoring utilities
 */

export class QueryPerformanceMonitor {
  private readonly metrics: Map<
    string,
    {
      count: number;
      totalTime: number;
      errors: number;
      lastExecuted: Date;
    }
  > = new Map();

  recordQuery(queryKey: string, executionTime: number, isError = false) {
    const existing = this.metrics.get(queryKey) ?? {
      count: 0,
      totalTime: 0,
      errors: 0,
      lastExecuted: new Date(),
    };

    this.metrics.set(queryKey, {
      count: existing.count + 1,
      totalTime: existing.totalTime + executionTime,
      errors: existing.errors + (isError ? 1 : 0),
      lastExecuted: new Date(),
    });
  }

  getMetrics() {
    const result: Record<string, any> = {};

    this.metrics.forEach((value, key) => {
      result[key] = {
        ...value,
        averageTime: value.totalTime / value.count,
        errorRate: (value.errors / value.count) * 100,
      };
    });

    return result;
  }

  getSlowestQueries(limit = 10) {
    const metrics = this.getMetrics();

    return Object.entries(metrics)
      .sort(([, a], [, b]) => b.averageTime - a.averageTime)
      .slice(0, limit)
      .map(([key, value]) => ({ queryKey: key, ...value }));
  }

  getHighErrorRateQueries(limit = 10, minErrorRate = 5) {
    const metrics = this.getMetrics();

    return Object.entries(metrics)
      .filter(([, value]) => value.errorRate >= minErrorRate)
      .sort(([, a], [, b]) => b.errorRate - a.errorRate)
      .slice(0, limit)
      .map(([key, value]) => ({ queryKey: key, ...value }));
  }

  reset() {
    this.metrics.clear();
  }
}

/**
 * Memory usage optimization utilities
 */

export class QueryMemoryOptimizer {
  /**
   * Remove stale queries from cache based on usage patterns
   */
  static optimizeCache(queryClient: QueryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const now = Date.now();

    for (const query of queries) {
      const lastFetched = query.state.dataUpdatedAt;
      const isStale = now - lastFetched > CACHE_TIME_CONFIG.STATIC;

      // Remove queries that haven't been accessed in a while
      if (isStale && !query.getObserversCount()) {
        cache.remove(query);
      }
    }
  }

  /**
   * Get cache size information
   */
  static getCacheInfo(queryClient: QueryClient) {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
      loadingQueries: queries.filter((q) => q.state.status === "pending")
        .length,
    };
  }

  /**
   * Prefetch critical data for better UX
   */
  prefetchCriticalData(_queryClient: QueryClient, _userId: string) {
    // Prefetch user's properties
    // await queryClient.prefetchQuery({
    //   queryKey: [QUERY_KEY_PREFIXES.PROPERTIES, "user", userId],
    //   queryFn: () =>
    //     import("@/modules/properties").then((m) =>
    //       m.getPropertiesByUser(userId)
    //     ),
    //   staleTime: STALE_TIME_CONFIG.PROPERTY,
    // });

    // Prefetch user's schedules for today
    const today = new Date().toISOString().split("T")[0];
    // queryClient.prefetchQuery({
    //   queryKey: [QUERY_KEY_PREFIXES.SCHEDULES, "user", userId, today],
    //   queryFn: () =>
    //     import("@/modules/properties/scheduling").then((m) =>
    //       m.getSchedulesByUser(userId)
    //     ),
    //   staleTime: STALE_TIME_CONFIG.SCHEDULE,
    // });
  }
}

/**
 * Background sync utilities for offline support
 */

export class BackgroundSyncManager {
  private syncQueue: Array<{
    id: string;
    operation: "create" | "update" | "delete";
    resource: string;
    data: any;
    timestamp: Date;
  }> = [];

  addToQueue(
    operation: "create" | "update" | "delete",
    resource: string,
    data: any
  ) {
    this.syncQueue.push({
      id: `${resource}-${Date.now()}-${Math.random()}`,
      operation,
      resource,
      data,
      timestamp: new Date(),
    });
  }

  async processQueue(queryClient: QueryClient) {
    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        // Process the queued operation
        await this.processQueueItem(item, queryClient);
      } catch (error) {
        console.error("Failed to process queue item:", item, error);
        // Re-add to queue for retry
        this.syncQueue.push(item);
      }
    }
  }

  private async processQueueItem(
    item: (typeof this.syncQueue)[0],
    queryClient: QueryClient
  ) {
    // Implementation would depend on the specific resource and operation
    // This is a placeholder for the actual sync logic
    console.log("Processing queue item:", item);

    // Invalidate related queries after successful sync
    await queryClient.invalidateQueries({
      queryKey: [item.resource],
    });
  }

  getQueueStatus() {
    return {
      pending: this.syncQueue.length,
      oldestItem: this.syncQueue[0]?.timestamp,
    };
  }
}

const queryPerformanceMonitor = new QueryPerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export const useQueryPerformance = () => {
  return {
    getMetrics: () => queryPerformanceMonitor.getMetrics(),
    getSlowestQueries: (limit?: number) =>
      queryPerformanceMonitor.getSlowestQueries(limit),
    getHighErrorRateQueries: (limit?: number, minErrorRate?: number) =>
      queryPerformanceMonitor.getHighErrorRateQueries(limit, minErrorRate),
    reset: () => queryPerformanceMonitor.reset(),
  };
};
