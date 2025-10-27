/**
 * AI Module Types
 * Adapted from API MVP AI feature types for client-side use
 */

export type IAIModel = {
  _id: string;
  memberId?: string;
  trainingDataSource: string;
  name: string;
  slug: string;
  type:
    | "classification"
    | "regression"
    | "clustering"
    | "recommendation"
    | "nlp"
    | "custom";
  description?: string;
  version: string;
  status: "training" | "ready" | "error" | "deprecated";
  configuration: {
    algorithm: string;
    parameters: Record<string, any>;
    features: string[];
    target?: string;
    textFeatures?: string[];
    useEmbeddings?: boolean;
    incrementalLearning?: boolean;
  };
  lifecycle: {
    stage?: "development" | "staging" | "production";
    currentVersion?: string;
    lastUpdated?: string;
  };
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    rmse?: number;
    mae?: number;
    r2Score?: number;
    customMetrics?: Record<string, number>;
  };
  trainingData: {
    source: string;
    recordCount: number;
    lastTrained: string;
    epochs?: number;
    seed?: number;
    datasetHash?: string;
  };
  versions: {
    version: string;
    stage?: "staging" | "production";
    performance?: Record<string, any>;
    savedAt?: string;
    storagePath?: string;
  }[];
  usage: {
    totalPredictions: number;
    lastUsed?: string;
  };
  feedback: {
    actualValue: any;
    isCorrect: boolean;
    providedBy: string;
    providedAt: string;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type IPrediction = {
  _id: string;
  modelId: string;
  memberId: string;
  userId?: string;
  input: Record<string, any>;
  output: {
    prediction: any;
    confidence?: number;
    probabilities?: Record<string, number>;
  };
  modelVersion?: string;
  feedback?: {
    actualValue: any;
    isCorrect: boolean;
    providedBy: string;
    providedAt: string;
  };
  processingTime: number; // in milliseconds
  createdAt: string;
};

export type IRecommendation = {
  _id: string;
  memberId: string;
  userId: string;
  type: "feature" | "content" | "action" | "product" | "custom";
  title: string;
  description: string;
  data: Record<string, any>;
  score: number; // 0-1
  reason: string;
  status: "pending" | "shown" | "accepted" | "dismissed";
  expiresAt?: string;
  shownAt?: string;
  respondedAt?: string;
  createdAt: string;
};

// Request/Response types for API communication
export type CreateModelRequest = {
  trainingDataSource: string;
  name: string;
  type: IAIModel["type"];
  description?: string;
  configuration: IAIModel["configuration"];
};

export type ModelResponse = IAIModel;

export type PredictionRequest = {
  input: Record<string, any>;
  version?: string;
};

export type PredictionResponse = {
  data: {
    prediction: number;
    confidence?: number;
  };
  confidence?: number;
  probabilities?: Record<string, number>;
  processingTime: number;
  modelVersion?: string;
};

export type BatchPredictionRequest = {
  modelId: string;
  inputs: Record<string, any>[];
  version?: string;
};

export type BatchPredictionResponse = {
  predictions: PredictionResponse[];
  totalProcessingTime: number;
};

export type ModelMetrics = {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number;
  rmse?: number;
  mae?: number;
  r2Score?: number;
  customMetrics?: Record<string, number>;
};

export type FeedbackData = {
  predictionId: string;
  actualValue: any;
  isCorrect: boolean;
};

export type ListOptions = {
  page?: number;
  limit?: number;
  status?: IAIModel["status"];
  type?: IAIModel["type"];
  search?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    database: boolean;
    redis: boolean;
    tensorflow: boolean;
    queues: boolean;
  };
  models: {
    total: number;
    ready: number;
    training: number;
    error: number;
  };
  performance: {
    avgResponseTime: number;
    totalPredictions: number;
    errorRate: number;
  };
};

export type DriftReport = {
  modelId: string;
  datasetHash: string;
  driftScore: number;
  threshold: number;
  isDrifted: boolean;
  features: {
    name: string;
    driftScore: number;
    isDrifted: boolean;
  }[];
  recommendation: string;
  generatedAt: string;
};

// AI Configuration constants for the frontend
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

// Model status display helpers
export const MODEL_STATUS_LABELS = {
  training: "Training",
  ready: "Ready",
  error: "Error",
  deprecated: "Deprecated",
} as const;

export const MODEL_TYPE_LABELS = {
  classification: "Classification",
  regression: "Regression",
  clustering: "Clustering",
  recommendation: "Recommendation",
  nlp: "Natural Language Processing",
  custom: "Custom",
} as const;

export const MODEL_STAGE_LABELS = {
  development: "Development",
  staging: "Staging",
  production: "Production",
  archived: "Archived",
} as const;
