import { logger } from "@kaa/utils";
import { aiConfig } from "../ai.config";
import { DataPrepService } from "./data-prep.service";
import { EmbeddingCacheService } from "./embedding-cache.service";
import { FeatureTransformersService } from "./feature-transformers.service";
import { IncrementalLearningService } from "./incremental-learning.service";
import { MetricsService } from "./metrics.service";
import { ModelRegistryService } from "./model-registry.service";
import {
  getModelStorageAdapter,
  type ModelStorageAdapter,
} from "./model-storage.adapter";
import { TensorflowService } from "./tensorflow.service";

/**
 * Dependency Injection Container for AI Services
 *
 * This container manages the lifecycle and dependencies of all AI services,
 * ensuring proper initialization order and singleton instances.
 */
export class DIContainer {
  private static instance: DIContainer;
  private readonly services: Map<string, any> = new Map();
  private readonly initializing: Map<string, Promise<any>> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * Get the singleton instance of the DI container
   */
  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * Initialize all services in the correct order
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info("Initializing AI services dependency injection container");

    try {
      // Initialize base services first (no dependencies)
      await this.initializeBaseServices();

      // Initialize services with dependencies
      await this.initializeDependentServices();

      // Initialize TensorFlow service last (depends on many services)
      await this.initializeTensorFlowService();

      this.initialized = true;
      logger.info(
        "AI services dependency injection container initialized successfully"
      );
    } catch (error) {
      logger.error("Failed to initialize AI services", error);
      throw error;
    }
  }

  /**
   * Initialize base services that have no dependencies
   */
  private async initializeBaseServices(): Promise<void> {
    // Model Storage Adapter
    const storageAdapter = getModelStorageAdapter();
    this.services.set("storageAdapter", storageAdapter);

    // Embedding Cache Service
    const embeddingCache = new EmbeddingCacheService();
    if (aiConfig.embedding.cacheEnabled && aiConfig.embedding.persistToDisk) {
      await embeddingCache.loadFromDisk();
    }
    this.services.set("embeddingCache", embeddingCache);

    // Metrics Service
    const metricsService = new MetricsService();
    this.services.set("metricsService", metricsService);

    // Model Registry Service
    const modelRegistryService = new ModelRegistryService();
    this.services.set("modelRegistryService", modelRegistryService);

    // Feature Transformers Service
    const featureTransformersService = new FeatureTransformersService();
    this.services.set("featureTransformersService", featureTransformersService);
  }

  /**
   * Initialize services that depend on base services
   */
  private initializeDependentServices(): void {
    // Data Prep Service (depends on embedding cache)
    const dataPrepService = new DataPrepService(
      this.services.get("embeddingCache")
    );
    this.services.set("dataPrepService", dataPrepService);

    // Incremental Learning Service (depends on metrics)
    const incrementalLearningService = new IncrementalLearningService(
      // this.services.get("metricsService")
    );
    this.services.set("incrementalLearningService", incrementalLearningService);
  }

  /**
   * Initialize TensorFlow service with all its dependencies
   */
  private async initializeTensorFlowService(): Promise<void> {
    const tensorflowService = new TensorflowService(
      this.services.get("storageAdapter"),
      this.services.get("dataPrepService"),
      this.services.get("embeddingCache"),
      this.services.get("metricsService"),
      this.services.get("modelRegistryService"),
      this.services.get("incrementalLearningService"),
      this.services.get("featureTransformersService")
    );

    // Initialize TensorFlow and encoder
    await tensorflowService.initialize();

    // Wire TensorFlow service back to DataPrepService for embeddings
    const dataPrepService = this.services.get("dataPrepService");
    dataPrepService.setTensorflowService(tensorflowService);

    this.services.set("tensorflowService", tensorflowService);
  }

  /**
   * Get a service by name
   */
  get<T>(serviceName: string): T {
    if (!this.initialized) {
      throw new Error("DI container not initialized. Call initialize() first.");
    }

    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found in DI container`);
    }

    return service as T;
  }

  /**
   * Get all services (for testing or debugging)
   */
  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  /**
   * Reset the container (mainly for testing)
   */
  async reset(): Promise<void> {
    // Clean up services that need cleanup
    const embeddingCache = this.services.get("embeddingCache");
    if (embeddingCache && aiConfig.embedding.persistToDisk) {
      await embeddingCache.saveToDisk();
    }

    this.services.clear();
    this.initializing.clear();
    this.initialized = false;
  }

  /**
   * Convenience getters for commonly used services
   */
  get tensorflowService(): TensorflowService {
    return this.get<TensorflowService>("tensorflowService");
  }

  get dataPrepService(): DataPrepService {
    return this.get<DataPrepService>("dataPrepService");
  }

  get storageAdapter(): ModelStorageAdapter {
    return this.get<ModelStorageAdapter>("storageAdapter");
  }

  get embeddingCache(): EmbeddingCacheService {
    return this.get<EmbeddingCacheService>("embeddingCache");
  }

  get metricsService(): MetricsService {
    return this.get<MetricsService>("metricsService");
  }

  get modelRegistryService(): ModelRegistryService {
    return this.get<ModelRegistryService>("modelRegistryService");
  }

  get incrementalLearningService(): IncrementalLearningService {
    return this.get<IncrementalLearningService>("incrementalLearningService");
  }

  get featureTransformersService(): FeatureTransformersService {
    return this.get<FeatureTransformersService>("featureTransformersService");
  }
}

// Export singleton instance
export const diContainer = DIContainer.getInstance();

/**
 * Initialize the DI container on module load
 * This ensures services are ready when needed
 */
let initPromise: Promise<void> | null = null;

export async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = diContainer.initialize();
  }
  return await initPromise;
}
