import { logger } from "@kaa/utils";
import type * as tf from "@tensorflow/tfjs-node";
import { aiConfig } from "../ai.config";

export type ModelPoolConfig = {
  maxPoolSize: number;
  minPoolSize: number;
  maxIdleTime: number;
  warmupModels: string[];
};

export type PooledModel = {
  model: tf.LayersModel;
  lastUsed: Date;
  usageCount: number;
  isInUse: boolean;
};

export class ModelPool {
  private readonly pools: Map<string, PooledModel[]> = new Map();
  private readonly loadingPromises: Map<string, Promise<tf.LayersModel>> =
    new Map();
  private readonly config: ModelPoolConfig;
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(config?: Partial<ModelPoolConfig>) {
    this.config = {
      maxPoolSize: config?.maxPoolSize || 5,
      minPoolSize: config?.minPoolSize || 1,
      maxIdleTime: config?.maxIdleTime || 300_000, // 5 minutes
      warmupModels: config?.warmupModels || [],
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleModels();
    }, 60_000); // Check every minute
  }

  /**
   * Get a model from the pool or load it if not available
   */
  async getModel(
    modelId: string,
    version: string,
    loader: () => Promise<tf.LayersModel>
  ): Promise<tf.LayersModel> {
    const poolKey = `${modelId}:${version}`;
    const pool = this.pools.get(poolKey) || [];

    // Find available model in pool
    const availableModel = pool.find((pm) => !pm.isInUse);
    if (availableModel) {
      availableModel.isInUse = true;
      availableModel.lastUsed = new Date();
      availableModel.usageCount++;

      logger.debug("Model retrieved from pool", {
        modelId,
        version,
        poolSize: pool.length,
      });
      return availableModel.model;
    }

    // Check if we're already loading this model
    const loadingKey = poolKey;
    if (this.loadingPromises.has(loadingKey)) {
      logger.debug("Waiting for model loading in progress", {
        modelId,
        version,
      });
      // biome-ignore lint/style/noNonNullAssertion: ignore
      const model = await this.loadingPromises.get(loadingKey)!;
      return this.cloneModel(model);
    }

    // Load new model
    logger.debug("Loading new model for pool", { modelId, version });
    const loadingPromise = this.loadModel(loader);
    this.loadingPromises.set(loadingKey, loadingPromise);

    try {
      const model = await loadingPromise;
      this.addToPool(poolKey, model);
      return this.cloneModel(model);
    } finally {
      this.loadingPromises.delete(loadingKey);
    }
  }

  /**
   * Release a model back to the pool
   */
  releaseModel(modelId: string, version: string, model: tf.LayersModel): void {
    const poolKey = `${modelId}:${version}`;
    const pool = this.pools.get(poolKey);

    if (pool) {
      const pooledModel = pool.find((pm) => pm.model === model);
      if (pooledModel) {
        pooledModel.isInUse = false;
        pooledModel.lastUsed = new Date();
        logger.debug("Model released to pool", { modelId, version });
        return;
      }
    }

    // If not found in pool, dispose the model
    model.dispose();
    logger.debug("Model disposed (not in pool)", { modelId, version });
  }

  /**
   * Warm up models by pre-loading them into the pool
   */
  async warmupModels(
    modelLoaders: Map<string, () => Promise<tf.LayersModel>>
  ): Promise<void> {
    const warmupPromises = Array.from(modelLoaders.entries()).map(
      async ([modelKey, loader]) => {
        try {
          const model = await loader();
          this.addToPool(modelKey, model);
          logger.info("Model warmed up", { modelKey });
        } catch (error) {
          logger.error("Failed to warm up model", { modelKey, error });
        }
      }
    );

    await Promise.allSettled(warmupPromises);
    logger.info("Model warmup completed", {
      totalModels: modelLoaders.size,
      pooledModels: this.getTotalPooledModels(),
    });
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [poolKey, pool] of this.pools.entries()) {
      stats[poolKey] = {
        totalModels: pool.length,
        availableModels: pool.filter((pm) => !pm.isInUse).length,
        inUseModels: pool.filter((pm) => pm.isInUse).length,
        totalUsage: pool.reduce((sum, pm) => sum + pm.usageCount, 0),
        oldestModel: pool.reduce(
          (oldest, pm) => (pm.lastUsed < oldest ? pm.lastUsed : oldest),
          new Date()
        ),
      };
    }

    return {
      pools: stats,
      totalPools: this.pools.size,
      totalModels: this.getTotalPooledModels(),
      loadingModels: this.loadingPromises.size,
    };
  }

  /**
   * Clear all pools and dispose models
   */
  dispose(): void {
    clearInterval(this.cleanupInterval);

    for (const [poolKey, pool] of this.pools.entries()) {
      for (const pooledModel of pool) {
        pooledModel.model.dispose();
      }
      logger.debug("Pool disposed", { poolKey, modelCount: pool.length });
    }

    this.pools.clear();
    this.loadingPromises.clear();
    logger.info("All model pools disposed");
  }

  private async loadModel(
    loader: () => Promise<tf.LayersModel>
  ): Promise<tf.LayersModel> {
    const startTime = Date.now();
    try {
      const model = await loader();
      const loadTime = Date.now() - startTime;
      logger.debug("Model loaded successfully", { loadTime });
      return model;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      logger.error("Failed to load model", { error, loadTime });
      throw error;
    }
  }

  private addToPool(poolKey: string, model: tf.LayersModel): void {
    if (!this.pools.has(poolKey)) {
      this.pools.set(poolKey, []);
    }

    // biome-ignore lint/style/noNonNullAssertion: ignore
    const pool = this.pools.get(poolKey)!;

    // Check if pool is at capacity
    if (pool.length >= this.config.maxPoolSize) {
      // Remove oldest unused model
      const oldestUnused = pool
        .filter((pm) => !pm.isInUse)
        .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime())[0];

      if (oldestUnused) {
        const index = pool.indexOf(oldestUnused);
        pool.splice(index, 1);
        oldestUnused.model.dispose();
        logger.debug("Removed oldest model from pool", { poolKey });
      }
    }

    pool.push({
      model,
      lastUsed: new Date(),
      usageCount: 0,
      isInUse: false,
    });

    logger.debug("Model added to pool", { poolKey, poolSize: pool.length });
  }

  private cloneModel(model: tf.LayersModel): tf.LayersModel {
    // For now, return the same model instance
    // In production, you might want to implement proper model cloning
    // or use model sharing with proper synchronization
    return model;
  }

  private cleanupIdleModels(): void {
    const now = Date.now();
    let totalCleaned = 0;

    for (const [poolKey, pool] of this.pools.entries()) {
      const initialSize = pool.length;

      // Keep minimum pool size
      const modelsToKeep = Math.max(
        this.config.minPoolSize,
        pool.filter((pm) => pm.isInUse).length
      );

      // Remove idle models beyond max idle time
      const activeModels = pool.filter((pm) => {
        const isIdle =
          !pm.isInUse && now - pm.lastUsed.getTime() > this.config.maxIdleTime;

        if (isIdle && pool.length > modelsToKeep) {
          pm.model.dispose();
          return false;
        }
        return true;
      });

      this.pools.set(poolKey, activeModels);
      const cleaned = initialSize - activeModels.length;
      totalCleaned += cleaned;

      if (cleaned > 0) {
        logger.debug("Cleaned up idle models", {
          poolKey,
          cleaned,
          remaining: activeModels.length,
        });
      }
    }

    if (totalCleaned > 0) {
      logger.info("Model pool cleanup completed", {
        totalCleaned,
        totalPools: this.pools.size,
        totalModels: this.getTotalPooledModels(),
      });
    }
  }

  private getTotalPooledModels(): number {
    return Array.from(this.pools.values()).reduce(
      (total, pool) => total + pool.length,
      0
    );
  }
}

// Singleton instance
let modelPoolInstance: ModelPool | null = null;

export function getModelPool(): ModelPool {
  if (!modelPoolInstance) {
    modelPoolInstance = new ModelPool({
      maxPoolSize: aiConfig.performance.maxConcurrentTraining * 2,
      minPoolSize: 1,
      maxIdleTime: 300_000, // 5 minutes
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
