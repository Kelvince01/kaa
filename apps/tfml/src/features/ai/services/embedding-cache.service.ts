import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { logger } from "@kaa/utils/logger";
import { LRUCache } from "lru-cache";

export type EmbeddingCacheOptions = {
  maxSize?: number; // Maximum number of embeddings to cache
  ttl?: number; // Time to live in milliseconds
  persistPath?: string; // Path to persist cache to disk
};

export class EmbeddingCacheService {
  private readonly cache: LRUCache<string, number[]>;
  private readonly persistPath?: string;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(options: EmbeddingCacheOptions = {}) {
    const {
      maxSize = 10_000,
      ttl = 1000 * 60 * 60 * 24,
      persistPath,
    } = options;

    this.cache = new LRUCache<string, number[]>({
      max: maxSize,
      ttl,
      dispose: () => {
        this.stats.evictions++;
      },
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    });

    this.persistPath = persistPath;

    // Load persisted cache if available
    if (persistPath) {
      this.loadFromDisk();
    }
  }

  /**
   * Generate a cache key for text content
   */
  private generateKey(text: string, model = "use"): string {
    const hash = crypto.createHash("sha256");
    hash.update(`${model}:${text}`);
    return hash.digest("hex");
  }

  /**
   * Get embedding from cache
   */
  get(text: string, model = "use"): number[] | undefined {
    const key = this.generateKey(text, model);
    const embedding = this.cache.get(key);

    if (embedding) {
      this.stats.hits++;
      logger.debug("Embedding cache hit", {
        text: text.substring(0, 50),
        model,
      });
    } else {
      this.stats.misses++;
    }

    return embedding;
  }

  /**
   * Store embedding in cache
   */
  set(text: string, embedding: number[], model = "use"): void {
    const key = this.generateKey(text, model);
    this.cache.set(key, embedding);

    // Persist to disk if configured
    if (this.persistPath) {
      this.persistToDisk();
    }
  }

  /**
   * Get multiple embeddings at once
   */
  getMany(texts: string[], model = "use"): Map<string, number[] | undefined> {
    const results = new Map<string, number[] | undefined>();

    for (const text of texts) {
      results.set(text, this.get(text, model));
    }

    return results;
  }

  /**
   * Set multiple embeddings at once
   */
  setMany(embeddings: Map<string, number[]>, model = "use"): void {
    for (const [text, embedding] of embeddings) {
      this.set(text, embedding, model);
    }
  }

  /**
   * Check if embedding exists in cache
   */
  has(text: string, model = "use"): boolean {
    const key = this.generateKey(text, model);
    return this.cache.has(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };

    if (this.persistPath && fs.existsSync(this.persistPath)) {
      fs.unlinkSync(this.persistPath);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  /**
   * Persist cache to disk
   */
  private persistToDisk(): void {
    if (!this.persistPath) return;

    try {
      const data = {
        version: "1.0",
        timestamp: Date.now(),
        entries: Array.from(this.cache.entries()).map(([key, value]) => ({
          key,
          value,
          // Include remaining TTL if available
          ttl: this.cache.getRemainingTTL(key),
        })),
        stats: this.stats,
      };

      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.persistPath, JSON.stringify(data), "utf-8");
      logger.debug("Embedding cache persisted", {
        path: this.persistPath,
        entries: data.entries.length,
      });
    } catch (error) {
      logger.error("Failed to persist embedding cache", error);
    }
  }

  /**
   * Load cache from disk
   */
  loadFromDisk(): void {
    if (!(this.persistPath && fs.existsSync(this.persistPath))) return;

    try {
      const content = fs.readFileSync(this.persistPath, "utf-8");
      const data = JSON.parse(content);

      // Check if cache is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > maxAge) {
        logger.info("Embedding cache is too old, discarding");
        return;
      }

      // Restore entries
      for (const entry of data.entries) {
        if (entry.ttl && entry.ttl > 0) {
          this.cache.set(entry.key, entry.value, { ttl: entry.ttl });
        }
      }

      // Restore stats
      if (data.stats) {
        this.stats = data.stats;
      }

      logger.info("Embedding cache loaded", {
        path: this.persistPath,
        entries: data.entries.length,
      });
    } catch (error) {
      logger.error("Failed to load embedding cache", error);
    }
  }

  /**
   * Warm up cache with common texts
   */
  async warmUp(
    texts: string[],
    generateEmbedding: (text: string) => Promise<number[]>
  ): Promise<void> {
    const uncached = texts.filter((text) => !this.has(text));

    if (uncached.length === 0) {
      logger.info("Cache already warm, all texts cached");
      return;
    }

    logger.info(`Warming up cache with ${uncached.length} texts`);

    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < uncached.length; i += batchSize) {
      const batch = uncached.slice(i, i + batchSize);
      const embeddings = await Promise.all(batch.map(generateEmbedding));

      batch.forEach((text, idx) => {
        this.set(text, embeddings[idx]);
      });
    }

    logger.info("Cache warm-up complete", this.getStats());
  }
}

// Singleton instance
let embeddingCache: EmbeddingCacheService | null = null;

export function getEmbeddingCache(
  options?: EmbeddingCacheOptions
): EmbeddingCacheService {
  if (!embeddingCache) {
    embeddingCache = new EmbeddingCacheService({
      maxSize: Number(process.env.EMBEDDING_CACHE_SIZE || 10_000),
      ttl: Number(process.env.EMBEDDING_CACHE_TTL || 24 * 60 * 60 * 1000),
      persistPath:
        process.env.EMBEDDING_CACHE_PATH ||
        path.join(process.cwd(), ".cache", "embeddings.json"),
      ...options,
    });
  }
  return embeddingCache;
}
