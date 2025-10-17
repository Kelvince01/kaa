import { logger } from "./logger.util";

// Simple in-memory cache (in production, use Redis)
class MemoryCache {
  private readonly cache = new Map<string, { value: any; expiry: number }>();

  set(key: string, value: any, ttlSeconds = 3600): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheService = new MemoryCache();

// Start cleanup interval
setInterval(() => {
  cacheService.cleanup();
}, 60_000); // Clean up every minute

export const cacheMiddleware =
  (keyGenerator: (context: any) => string, ttlSeconds = 300) =>
  async (context: any, next: any) => {
    const cacheKey = keyGenerator(context);
    const cached = cacheService.get(cacheKey);

    if (cached) {
      logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached;
    }

    const result = await next();
    cacheService.set(cacheKey, result, ttlSeconds);
    logger.debug(`Cache set for key: ${cacheKey}`);

    return result;
  };

// Database query caching
export const dbCacheService = {
  /**
   * Cache database query result
   */
  cacheQuery: async <T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> => {
    const cached = cacheService.get(key);

    if (cached) {
      return cached;
    }

    const result = await queryFn();
    cacheService.set(key, result, ttlSeconds);
    return result;
  },

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern: (pattern: string): void => {
    const keys = cacheService.keys();
    const regex = new RegExp(pattern);

    for (const key of keys) {
      if (regex.test(key)) {
        cacheService.delete(key);
      }
    }
  },

  /**
   * Get cache statistics
   */
  getStats: () => ({
    size: cacheService.size(),
    keys: cacheService.keys().length,
  }),
};
