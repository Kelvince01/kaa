/**
 * AI Feature Module - Unified exports
 *
 * This module provides a comprehensive AI/ML platform with:
 * - Model training and deployment
 * - Real-time predictions
 * - A/B testing
 * - Incremental learning
 * - Feature engineering
 * - Model versioning and registry
 * - Performance metrics and monitoring
 */

import { getAIService } from "./ai.service";
import { ensureInitialized } from "./services/di-container";

export { aiConfig } from "./ai.config";
// Core exports
export { aiController } from "./ai.controller";
export { aiTrainingQueue } from "./ai.queue";
export {
  AIService,
  aiService,
  type CreateAIModelData,
  getAIService,
  // type PredictionRequest,
} from "./ai.service";
export {
  DataPrepService,
  type PreparedDataset,
  type PreprocessingMetadata,
} from "./services/data-prep.service";
// Services
export { diContainer, ensureInitialized } from "./services/di-container";
export { EmbeddingCacheService } from "./services/embedding-cache.service";
export {
  type FeatureTransformer,
  FeatureTransformersService,
  type TransformerPipeline,
} from "./services/feature-transformers.service";
export {
  IncrementalLearningService,
  // type IncrementalConfig,
  // type UpdateResult
} from "./services/incremental-learning.service";
export {
  type ClassificationMetrics,
  MetricsService,
  type RegressionMetrics,
} from "./services/metrics.service";
export {
  type ABTestConfig,
  type ABTestResult,
  ModelRegistryService,
  type ModelStage,
  type ModelVersion,
} from "./services/model-registry.service";
export { TensorflowService } from "./services/tensorflow.service";

// export { ModelStorageAdapter } from "./services/model-storage.adapter";

// Enhanced Interfaces
export type {
  AIServiceInterface,
  BatchPredictionRequest,
  BatchPredictionResponse,
  CreateModelRequest,
  DriftReport,
  FeedbackData,
  HealthStatus,
  ListOptions,
  ModelMetrics,
  ModelResponse,
  PaginatedResponse,
  PredictionRequest,
  PredictionResponse,
} from "./interfaces/ai-service.interface";
// Permissions
export { AI_PERMISSIONS } from "./permissions";
// Training data providers
export {
  type Row,
  resolveTrainingDataProvider,
  type Split,
  // InternalDataProvider,
  type TrainingDataProvider,
} from "./providers/training-data.provider";
export {
  getAutoMLService,
  getHyperparameterOptimizer,
} from "./services/automl.service";
export { DataPipeline } from "./services/data-pipeline.service";
export { getModelDeploymentService } from "./services/deployment.service";
export { getModelMonitoringService } from "./services/model-monitoring.service";
// Enhanced Services
export {
  disposeModelPool,
  getModelPool,
} from "./services/persistent-model-pool.service";
export { getMLSecurityService } from "./services/security.service";

// Utility functions for external use
export const AIUtils = {
  /**
   * Initialize the AI service with all dependencies
   */
  async initialize(): Promise<void> {
    await ensureInitialized();
  },

  /**
   * Get embedding cache statistics
   */
  async getCacheStats() {
    const service = await getAIService();
    return service.getEmbeddingCacheStats();
  },

  /**
   * Warm up embedding cache with frequently used texts
   */
  async warmUpCache(texts: string[]) {
    const service = await getAIService();
    return service.warmUpEmbeddingCache(texts);
  },

  /**
   * List all available feature transformers
   */
  async listTransformers() {
    const service = await getAIService();
    return service.listTransformers();
  },

  /**
   * Get the best performing model version
   */
  async getBestModelVersion(modelId: string, metric = "accuracy") {
    const service = await getAIService();
    return service.getBestVersion(modelId, metric);
  },

  /**
   * Archive old model versions
   */
  async archiveOldVersions(modelId: string, keepCount = 5) {
    const service = await getAIService();
    return service.archiveOldVersions(modelId, keepCount);
  },
};

// Re-export configuration constants for convenience
export const AI_CONFIG = {
  DEFAULT_BATCH_SIZE: 32,
  DEFAULT_EPOCHS: 10,
  DEFAULT_LEARNING_RATE: 0.001,
  DEFAULT_VALIDATION_SPLIT: 0.2,
  MAX_EMBEDDING_CACHE_SIZE: 10_000,
  DEFAULT_INCREMENTAL_UPDATE_FREQUENCY: 50,
  MODEL_STAGES: ["development", "staging", "production", "archived"] as const,
  SUPPORTED_MODEL_TYPES: [
    "classification",
    "regression",
    "clustering",
    "recommendation",
    "nlp",
    "custom",
  ] as const,
  SUPPORTED_ALGORITHMS: ["dense_nn", "lstm", "generic"] as const,
} as const;

// Export version for tracking
export const AI_MODULE_VERSION = "2.0.0";
