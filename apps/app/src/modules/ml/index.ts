/**
 * AI Module - Unified exports
 *
 * This module provides a comprehensive AI/ML platform for the client-side application with:
 * - Model management and configuration
 * - Real-time predictions
 * - Batch processing capabilities
 * - Performance monitoring
 * - React components and hooks
 */

import type { IAIModel, ModelMetrics } from "./ai.type";

// React Query hooks
export {
  // Query keys
  AI_QUERY_KEYS,
  // A/B Testing
  useABTestResults,
  // AutoML Progress
  useAutoMLProgress,
  useBatchPredict,
  // Model mutations
  useCreateModel,
  useDeleteModel,
  useDeployModel,
  // Health monitoring
  useHealthStatus,
  useModel,
  useModelDrift,
  useModelMetrics,
  // Model queries
  useModels,
  useModelVersions,
  // Prediction mutations
  usePredict,
  // Prediction queries
  usePredictions,
  useProvideFeedback,
  // Recommendation queries
  useRecommendations,
  // Model version mutations
  useRollbackModel,
  // A/B Testing mutations
  useStartABTest,
  // AutoML mutations
  useStartAutoML,
  useStopABTest,
  useTrainModel,
  useUpdateModel,
  // Recommendation mutations
  useUpdateRecommendation,
} from "./ai.queries";
// Service layer
export { aiService } from "./ai.service";
// Core types
export type {
  BatchPredictionRequest,
  BatchPredictionResponse,
  CreateModelRequest,
  DriftReport,
  FeedbackData,
  HealthStatus,
  IAIModel,
  IPrediction,
  IRecommendation,
  ListOptions,
  ModelMetrics,
  ModelResponse,
  PaginatedResponse,
  PredictionRequest,
  PredictionResponse,
} from "./ai.type";
// Configuration constants
export {
  AI_CONFIG,
  MODEL_STAGE_LABELS,
  MODEL_STATUS_LABELS,
  MODEL_TYPE_LABELS,
} from "./ai.type";

// React components
export {
  ModelForm,
  ModelList,
  PredictionForm,
} from "./components";

// Utility functions
export const AIUtils = {
  /**
   * Format accuracy percentage with appropriate color coding
   */
  formatAccuracy: (accuracy?: number) => {
    if (!accuracy) return { text: "N/A", color: "text-gray-500" };

    const percentage = (accuracy * 100).toFixed(1);
    let color = "text-gray-500";

    if (accuracy >= 0.9) color = "text-green-600";
    else if (accuracy >= 0.7) color = "text-yellow-600";
    else color = "text-red-600";

    return { text: `${percentage}%`, color };
  },

  /**
   * Get status badge variant for model status
   */
  getStatusBadgeVariant: (status: IAIModel["status"]) => {
    switch (status) {
      case "ready":
        return "default";
      case "training":
        return "secondary";
      case "error":
        return "destructive";
      case "deprecated":
        return "outline";
      default:
        return "secondary";
    }
  },

  /**
   * Validate input data against model features
   */
  validatePredictionInput: (
    input: Record<string, any>,
    features: string[]
  ): { isValid: boolean; missingFeatures: string[] } => {
    const missingFeatures = features.filter((feature) => !(feature in input));
    return {
      isValid: missingFeatures.length === 0,
      missingFeatures,
    };
  },

  /**
   * Format processing time with appropriate units
   */
  formatProcessingTime: (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60_000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60_000).toFixed(1)}m`;
  },

  /**
   * Calculate confidence level color
   */
  getConfidenceColor: (confidence?: number) => {
    if (!confidence) return "text-gray-500";
    if (confidence > 0.8) return "text-green-600";
    if (confidence > 0.6) return "text-yellow-600";
    return "text-red-600";
  },

  /**
   * Generate model performance summary
   */
  getPerformanceSummary: (performance: ModelMetrics) => {
    const metrics: string[] = [];

    if (performance.accuracy !== undefined) {
      metrics.push(`Accuracy: ${(performance.accuracy * 100).toFixed(1)}%`);
    }
    if (performance.precision !== undefined) {
      metrics.push(`Precision: ${(performance.precision * 100).toFixed(1)}%`);
    }
    if (performance.recall !== undefined) {
      metrics.push(`Recall: ${(performance.recall * 100).toFixed(1)}%`);
    }
    if (performance.f1Score !== undefined) {
      metrics.push(`F1: ${(performance.f1Score * 100).toFixed(1)}%`);
    }
    if (performance.mse !== undefined) {
      metrics.push(`MSE: ${performance.mse.toFixed(3)}`);
    }
    if (performance.rmse !== undefined) {
      metrics.push(`RMSE: ${performance.rmse.toFixed(3)}`);
    }
    if (performance.mae !== undefined) {
      metrics.push(`MAE: ${performance.mae.toFixed(3)}`);
    }
    if (performance.r2Score !== undefined) {
      metrics.push(`R²: ${performance.r2Score.toFixed(3)}`);
    }

    return metrics.join(" • ");
  },

  /**
   * Check if model is ready for predictions
   */
  isModelReady: (model: IAIModel) =>
    model.status === "ready" && model.trainingData.recordCount > 0,

  /**
   * Get recommended next actions for a model
   */
  getModelRecommendations: (model: IAIModel): string[] => {
    const recommendations: string[] = [];

    if (model.status === "error") {
      recommendations.push("Review training logs and retry training");
    }

    if (model.status === "ready" && model.usage.totalPredictions === 0) {
      recommendations.push("Test the model with sample predictions");
    }

    if (model.performance.accuracy && model.performance.accuracy < 0.7) {
      recommendations.push(
        "Consider adding more training data or tuning hyperparameters"
      );
    }

    if (model.lifecycle.stage === "development") {
      recommendations.push("Deploy to staging for testing");
    }

    if (
      model.lifecycle.stage === "staging" &&
      model.performance.accuracy &&
      model.performance.accuracy > 0.8
    ) {
      recommendations.push("Consider promoting to production");
    }

    if (
      model.usage.totalPredictions > 1000 &&
      !model.configuration.incrementalLearning
    ) {
      recommendations.push(
        "Enable incremental learning for continuous improvement"
      );
    }

    return recommendations;
  },
};

// Export version for tracking
export const AI_MODULE_VERSION = "1.0.0";
