import * as fs from "node:fs/promises";
import * as path from "node:path";
import { logger } from "@kaa/utils/logger";
import * as tf from "@tensorflow/tfjs-node";
import aiConfig from "../ai.config";
import { ModelPool, type ModelPoolConfig } from "./model-pool.service";

export type CacheMetadata = {
  [poolKey: string]: {
    lastUpdated: string;
    size: number;
    accessCount: number;
    modelPath: string;
    weightsPath: string;
  };
};

export interface PersistentModelPoolConfig extends ModelPoolConfig {
  cacheDir?: string;
  maxCacheSize?: number; // in bytes
  cacheTTL?: number; // in milliseconds
}

export class PersistentModelPool extends ModelPool {
  private readonly cacheDir: string;
  private readonly metadataFile: string;
  private readonly maxCacheSize: number;
  private readonly cacheTTL: number;
  private cacheMetadata: CacheMetadata = {};

  constructor(config?: Partial<PersistentModelPoolConfig>) {
    super(config);
    this.cacheDir = config?.cacheDir || "./model-cache";
    this.metadataFile = path.join(this.cacheDir, "cache-metadata.json");
    this.maxCacheSize = config?.maxCacheSize || 1024 * 1024 * 1024; // 1GB default
    this.cacheTTL = config?.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours default

    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });

      // Load cache metadata on startup
      if (await this.fileExists(this.metadataFile)) {
        const metadata = await fs.readFile(this.metadataFile, "utf8");
        this.cacheMetadata = JSON.parse(metadata);
        await this.restoreFromDisk(this.cacheMetadata);
        logger.info("Cache metadata loaded", {
          cachedModels: Object.keys(this.cacheMetadata).length,
        });
      } else {
        logger.info("No existing cache found, starting fresh");
      }
    } catch (error) {
      logger.error("Failed to initialize cache", { error });
    }
  }

  private async restoreFromDisk(cacheInfo: CacheMetadata): Promise<void> {
    const now = Date.now();
    const validModels: string[] = [];
    const expiredModels: string[] = [];

    // Check which cached models are still valid
    for (const [poolKey, metadata] of Object.entries(cacheInfo)) {
      const lastUpdated = new Date(metadata.lastUpdated).getTime();
      const isExpired = now - lastUpdated > this.cacheTTL;

      if (isExpired) {
        expiredModels.push(poolKey);
        continue;
      }

      // Check if files still exist
      const modelExists = await this.fileExists(metadata.modelPath);
      const weightsExists = await this.fileExists(metadata.weightsPath);

      if (modelExists && weightsExists) {
        validModels.push(poolKey);
      } else {
        expiredModels.push(poolKey);
        logger.warn("Model files missing from cache", { poolKey });
      }
    }

    // Clean up expired models
    if (expiredModels.length > 0) {
      await this.cleanupExpiredModels(expiredModels);
    }

    logger.info("Cache restoration completed", {
      validModels: validModels.length,
      expiredModels: expiredModels.length,
      totalCacheSize: await this.getTotalCacheSize(),
    });
  }

  async getModel(
    modelId: string,
    version: string,
    loader: () => Promise<tf.LayersModel>
  ): Promise<tf.LayersModel> {
    const poolKey = `${modelId}:${version}`;

    // Check memory pool first (your existing logic)
    return await super.getModel(modelId, version, async () => {
      // Try loading from disk cache before calling the original loader
      const cachedModel = await this.loadFromDisk(poolKey);
      if (cachedModel) {
        await this.updateAccessCount(poolKey);
        logger.debug("Model loaded from disk cache", { modelId, version });
        return cachedModel;
      }

      // Load fresh and save to disk
      logger.debug("Loading fresh model and caching to disk", {
        modelId,
        version,
      });
      const model = await loader();
      await this.saveToDisk(poolKey, model);
      return model;
    });
  }

  private async loadFromDisk(poolKey: string): Promise<tf.LayersModel | null> {
    try {
      const metadata = this.cacheMetadata[poolKey];
      if (!metadata) {
        return null;
      }

      // Check if cache entry is expired
      const now = Date.now();
      const lastUpdated = new Date(metadata.lastUpdated).getTime();
      if (now - lastUpdated > this.cacheTTL) {
        logger.debug("Cache entry expired", { poolKey });
        await this.removeCacheEntry(poolKey);
        return null;
      }

      const modelPath = metadata.modelPath;
      const weightsPath = metadata.weightsPath;

      const [modelExists, weightsExists] = await Promise.all([
        this.fileExists(modelPath),
        this.fileExists(weightsPath),
      ]);

      if (modelExists && weightsExists) {
        // Load the model using TensorFlow.js
        const model = await tf.loadLayersModel(`file://${modelPath}`);
        return model;
      }
      logger.warn("Model files missing, removing cache entry", { poolKey });
      await this.removeCacheEntry(poolKey);
    } catch (error) {
      logger.warn("Failed to load model from disk", { poolKey, error });
      await this.removeCacheEntry(poolKey);
    }
    return null;
  }

  private async saveToDisk(
    poolKey: string,
    model: tf.LayersModel
  ): Promise<void> {
    try {
      // Check cache size before saving
      const currentCacheSize = await this.getTotalCacheSize();
      if (currentCacheSize > this.maxCacheSize) {
        await this.evictLeastRecentlyUsed();
      }

      const modelFileName = `${this.sanitizeFileName(poolKey)}`;
      const modelPath = path.join(this.cacheDir, `${modelFileName}.json`);
      const weightsPath = path.join(
        this.cacheDir,
        `${modelFileName}.weights.bin`
      );

      // Save the model
      await model.save(`file://${path.join(this.cacheDir, modelFileName)}`);

      // Update metadata
      await this.updateCacheMetadata(poolKey, modelPath, weightsPath);

      logger.debug("Model saved to disk", { poolKey, modelPath });
    } catch (error) {
      logger.error("Failed to save model to disk", { poolKey, error });
    }
  }

  private async updateCacheMetadata(
    poolKey: string,
    modelPath: string,
    weightsPath: string
  ): Promise<void> {
    try {
      const size = await this.getModelSize(modelPath, weightsPath);

      this.cacheMetadata[poolKey] = {
        lastUpdated: new Date().toISOString(),
        size,
        accessCount: (this.cacheMetadata[poolKey]?.accessCount || 0) + 1,
        modelPath,
        weightsPath,
      };

      await fs.writeFile(
        this.metadataFile,
        JSON.stringify(this.cacheMetadata, null, 2)
      );
    } catch (error) {
      logger.error("Failed to update cache metadata", { error });
    }
  }

  private updateAccessCount(poolKey: string): void {
    if (this.cacheMetadata[poolKey]) {
      this.cacheMetadata[poolKey].accessCount++;
      this.cacheMetadata[poolKey].lastUpdated = new Date().toISOString();

      // Write metadata asynchronously (don't await to avoid blocking)
      fs.writeFile(
        this.metadataFile,
        JSON.stringify(this.cacheMetadata, null, 2)
      ).catch((error) =>
        logger.error("Failed to update access count", { error })
      );
    }
  }

  private async removeCacheEntry(poolKey: string): Promise<void> {
    try {
      const metadata = this.cacheMetadata[poolKey];
      if (metadata) {
        // Remove files
        await Promise.all([
          this.safeDeleteFile(metadata.modelPath),
          this.safeDeleteFile(metadata.weightsPath),
        ]);

        // Remove from metadata
        delete this.cacheMetadata[poolKey];
        await fs.writeFile(
          this.metadataFile,
          JSON.stringify(this.cacheMetadata, null, 2)
        );

        logger.debug("Cache entry removed", { poolKey });
      }
    } catch (error) {
      logger.error("Failed to remove cache entry", { poolKey, error });
    }
  }

  private async cleanupExpiredModels(expiredModels: string[]): Promise<void> {
    logger.info("Cleaning up expired models", { count: expiredModels.length });

    for (const poolKey of expiredModels) {
      await this.removeCacheEntry(poolKey);
    }
  }

  private async evictLeastRecentlyUsed(): Promise<void> {
    logger.info("Evicting least recently used models to free cache space");

    // Sort by last updated time and access count
    const sortedEntries = Object.entries(this.cacheMetadata).sort(
      ([, a], [, b]) => {
        const timeA = new Date(a.lastUpdated).getTime();
        const timeB = new Date(b.lastUpdated).getTime();

        // First sort by access count (ascending), then by time
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return timeA - timeB;
      }
    );

    // Remove oldest 25% of entries
    const toRemove = Math.ceil(sortedEntries.length * 0.25);
    const modelsToEvict = sortedEntries
      .slice(0, toRemove)
      .map(([poolKey]) => poolKey);

    for (const poolKey of modelsToEvict) {
      await this.removeCacheEntry(poolKey);
    }

    logger.info("Cache eviction completed", { evicted: modelsToEvict.length });
  }

  private getTotalCacheSize(): number {
    return Object.values(this.cacheMetadata).reduce(
      (total, metadata) => total + metadata.size,
      0
    );
  }

  private async getModelSize(
    modelPath: string,
    weightsPath: string
  ): Promise<number> {
    try {
      const [modelStat, weightsStat] = await Promise.all([
        fs.stat(modelPath),
        fs.stat(weightsPath),
      ]);

      return modelStat.size + weightsStat.size;
    } catch {
      return 0;
    }
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  private async safeDeleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // File might not exist, that's ok
      logger.debug("Could not delete file (might not exist)", { filepath });
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9-_]/g, "_");
  }

  // Public methods for cache management
  async clearDiskCache(): Promise<void> {
    try {
      await fs.rm(this.cacheDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.cacheMetadata = {};
      logger.info("Disk cache cleared");
    } catch (error) {
      logger.error("Failed to clear disk cache", { error });
    }
  }

  getCacheStats(): {
    totalSize: number;
    totalModels: number;
    averageSize: number;
    oldestEntry: string | null;
    mostAccessed: string | null;
  } {
    const entries = Object.entries(this.cacheMetadata);
    const totalSize = entries.reduce(
      (sum, [, metadata]) => sum + metadata.size,
      0
    );

    let oldestEntry: string | null = null;
    let oldestTime = Date.now();
    let mostAccessed: string | null = null;
    let maxAccess = 0;

    for (const [poolKey, metadata] of entries) {
      const time = new Date(metadata.lastUpdated).getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestEntry = poolKey;
      }

      if (metadata.accessCount > maxAccess) {
        maxAccess = metadata.accessCount;
        mostAccessed = poolKey;
      }
    }

    return {
      totalSize,
      totalModels: entries.length,
      averageSize: entries.length > 0 ? totalSize / entries.length : 0,
      oldestEntry,
      mostAccessed,
    };
  }

  async dispose(): Promise<void> {
    // Save final metadata state
    await fs.writeFile(
      this.metadataFile,
      JSON.stringify(this.cacheMetadata, null, 2)
    );

    // Call parent dispose
    await super.dispose();

    logger.info("Persistent model pool disposed");
  }
}

// Update your existing getModelPool function
let modelPoolInstance: PersistentModelPool | null = null;

export function getModelPool(): PersistentModelPool {
  if (!modelPoolInstance) {
    modelPoolInstance = new PersistentModelPool({
      maxPoolSize: aiConfig.performance.maxConcurrentTraining * 2,
      minPoolSize: 1,
      maxIdleTime: 300_000, // 5 minutes
      cacheDir: "./cache/models", // Directory for persistent storage
      maxCacheSize: 2 * 1024 * 1024 * 1024, // 2GB cache limit
      cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days cache TTL
    });
  }
  return modelPoolInstance;
}

export async function disposeModelPool(): Promise<void> {
  if (modelPoolInstance) {
    await modelPoolInstance.dispose();
    modelPoolInstance = null;
  }
}
