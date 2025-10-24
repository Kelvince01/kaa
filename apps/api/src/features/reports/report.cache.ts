import { createClient, type RedisClientType } from "redis";

/**
 * Reports Cache Service
 * Provides Redis-based caching for frequently accessed reports
 */
class ReportsCacheService {
  private client: RedisClientType | null = null;
  private readonly TTL = 3600; // 1 hour default
  private readonly prefix = "reports:";

  constructor() {
    this.initializeRedis();
  }

  /**
   * Initialize Redis client
   */
  private async initializeRedis(): Promise<void> {
    try {
      this.client = createClient({
        url: `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,
        password: process.env.REDIS_PASSWORD,
      });

      this.client.on("error", (err) => {
        console.error("Redis client error:", err);
      });

      this.client.on("connect", () => {
        console.log("[Report Cache] Connected to Redis");
      });

      await this.client.connect();
    } catch (error) {
      console.error("[Report Cache] Failed to connect to Redis:", error);
      // Don't throw - allow app to work without cache
    }
  }

  /**
   * Check if cache is available
   */
  private isAvailable(): boolean {
    return this.client?.isOpen ?? false;
  }

  /**
   * Generate cache key
   */
  private key(suffix: string): string {
    return `${this.prefix}${suffix}`;
  }

  /**
   * Cache report execution result
   */
  async cacheExecution(
    executionId: string,
    data: any,
    ttl: number = this.TTL
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.key(`execution:${executionId}`);
      await this.client?.setEx(key, ttl, JSON.stringify(data));
      console.log(`[Report Cache] Cached execution: ${executionId}`);
      return true;
    } catch (error) {
      console.error("[Report Cache] Error caching execution:", error);
      return false;
    }
  }

  /**
   * Get cached execution
   */
  async getExecution(executionId: string): Promise<any | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = this.key(`execution:${executionId}`);
      const cached = await this.client?.get(key);

      if (cached) {
        console.log(`[Report Cache] Hit for execution: ${executionId}`);
        return JSON.parse(cached);
      }

      console.log(`[Report Cache] Miss for execution: ${executionId}`);
      return null;
    } catch (error) {
      console.error("[Report Cache] Error getting execution:", error);
      return null;
    }
  }

  /**
   * Cache report definition
   */
  async cacheReport(
    reportId: string,
    data: any,
    ttl: number = this.TTL
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.key(`report:${reportId}`);
      await this.client?.setEx(key, ttl, JSON.stringify(data));
      console.log(`[Report Cache] Cached report: ${reportId}`);
      return true;
    } catch (error) {
      console.error("[Report Cache] Error caching report:", error);
      return false;
    }
  }

  /**
   * Get cached report
   */
  async getReport(reportId: string): Promise<any | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = this.key(`report:${reportId}`);
      const cached = await this.client?.get(key);

      if (cached) {
        console.log(`[Report Cache] Hit for report: ${reportId}`);
        return JSON.parse(cached);
      }

      console.log(`[Report Cache] Miss for report: ${reportId}`);
      return null;
    } catch (error) {
      console.error("[Report Cache] Error getting report:", error);
      return null;
    }
  }

  /**
   * Cache user reports list
   */
  async cacheUserReports(
    userId: string,
    queryHash: string,
    data: any,
    ttl = 300 // 5 minutes for lists
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.key(`user:${userId}:reports:${queryHash}`);
      await this.client?.setEx(key, ttl, JSON.stringify(data));
      console.log(`[Report Cache] Cached user reports: ${userId}`);
      return true;
    } catch (error) {
      console.error("[Report Cache] Error caching user reports:", error);
      return false;
    }
  }

  /**
   * Get cached user reports
   */
  async getUserReports(userId: string, queryHash: string): Promise<any | null> {
    if (!this.isAvailable()) return null;

    try {
      const key = this.key(`user:${userId}:reports:${queryHash}`);
      const cached = await this.client?.get(key);

      if (cached) {
        console.log(`[Report Cache] Hit for user reports: ${userId}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error("[Report Cache] Error getting user reports:", error);
      return null;
    }
  }

  /**
   * Cache analytics data
   */
  async cacheAnalytics(
    key: string,
    data: any,
    ttl = 1800 // 30 minutes
  ): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const cacheKey = this.key(`analytics:${key}`);
      await this.client?.setEx(cacheKey, ttl, JSON.stringify(data));
      console.log(`[Report Cache] Cached analytics: ${key}`);
      return true;
    } catch (error) {
      console.error("[Report Cache] Error caching analytics:", error);
      return false;
    }
  }

  /**
   * Get cached analytics
   */
  async getAnalytics(key: string): Promise<any | null> {
    if (!this.isAvailable()) return null;

    try {
      const cacheKey = this.key(`analytics:${key}`);
      const cached = await this.client?.get(cacheKey);

      if (cached) {
        console.log(`[Report Cache] Hit for analytics: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error("[Report Cache] Error getting analytics:", error);
      return null;
    }
  }

  /**
   * Invalidate report cache when updated
   */
  async invalidateReport(reportId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const key = this.key(`report:${reportId}`);
      await this.client?.del(key);
      console.log(`[Report Cache] Invalidated report: ${reportId}`);
      return true;
    } catch (error) {
      console.error("[Report Cache] Error invalidating report:", error);
      return false;
    }
  }

  /**
   * Invalidate all user reports cache
   */
  async invalidateUserReports(userId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const pattern = this.key(`user:${userId}:reports:*`);
      const keys = (await this.client?.keys(pattern)) ?? [];

      if (keys.length > 0) {
        await this.client?.del(keys);
        console.log(
          `[Report Cache] Invalidated ${keys.length} user reports for: ${userId}`
        );
      }

      return true;
    } catch (error) {
      console.error("[Report Cache] Error invalidating user reports:", error);
      return false;
    }
  }

  /**
   * Invalidate all analytics cache
   */
  async invalidateAnalytics(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const pattern = this.key("analytics:*");
      const keys = (await this.client?.keys(pattern)) ?? [];

      if (keys.length > 0) {
        await this.client?.del(keys);
        console.log(`[Report Cache] Invalidated ${keys.length} analytics`);
      }

      return true;
    } catch (error) {
      console.error("[Report Cache] Error invalidating analytics:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.isAvailable()) {
      return { available: false };
    }

    try {
      const info = await this.client?.info("stats");
      const keyspace = await this.client?.info("keyspace");

      // Count report-specific keys
      const reportKeys = await this.client?.keys(this.key("*"));

      return {
        available: true,
        reportKeys: reportKeys?.length,
        info,
        keyspace,
      };
    } catch (error) {
      console.error("[Report Cache] Error getting stats:", error);
      return { available: false, error: (error as Error).message };
    }
  }

  /**
   * Clear all report cache
   */
  async clearAll(): Promise<boolean> {
    if (!this.isAvailable()) return false;

    try {
      const pattern = this.key("*");
      const keys = (await this.client?.keys(pattern)) ?? [];

      if (keys.length > 0) {
        await this.client?.del(keys);
        console.log(`[Report Cache] Cleared ${keys.length} cache entries`);
      }

      return true;
    } catch (error) {
      console.error("[Report Cache] Error clearing cache:", error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
      console.log("[Report Cache] Disconnected from Redis");
    }
  }

  /**
   * Generate hash for query parameters (for cache key)
   */
  generateQueryHash(params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, any>
      );

    return Buffer.from(JSON.stringify(sorted))
      .toString("base64")
      .substring(0, 32);
  }
}

// Export singleton instance
export const reportCache = new ReportsCacheService();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await reportCache.disconnect();
});

process.on("SIGINT", async () => {
  await reportCache.disconnect();
});
