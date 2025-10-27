import type { IAIModel } from "@kaa/models/types";

export type CreateModelRequest = {
  memberId?: string;
  name: string;
  type:
    | "classification"
    | "regression"
    | "clustering"
    | "recommendation"
    | "nlp"
    | "custom";
  description?: string;
  configuration: ModelConfiguration;
  trainingDataSource: string;
  createdBy: string;
  transformers?: TransformerPipeline[];
  incrementalLearning?: boolean;
};

export type ModelConfiguration = {
  algorithm: string;
  parameters: Record<string, any>;
  features: string[];
  target?: string;
  textFeatures?: string[];
  useEmbeddings?: boolean;
};

export type TransformerPipeline = {
  feature: string;
  transformers: string[];
};

export type ModelResponse = {
  id: string;
  model: IAIModel;
  status: "created" | "training" | "ready" | "error";
  message?: string;
};

export type PredictionRequest = {
  modelId: string;
  input: Record<string, any>;
  memberId: string;
  userId?: string;
  version?: string;
  stage?: "development" | "production" | "staging";
  abTestId?: string;
  batchSize?: number;
};

export type PredictionResponse = {
  id: string;
  data: any;
  confidence?: number;
  modelVersion: string;
  processingTime: number;
  metadata?: Record<string, any>;
};

export type BatchPredictionRequest = {
  modelId: string;
  inputs: Record<string, any>[];
  memberId: string;
  userId?: string;
  version?: string;
  stage?: "production" | "staging";
};

export type BatchPredictionResponse = {
  predictions: PredictionResponse[];
  totalProcessingTime: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{ index: number; error: string }>;
};

export type AIServiceInterface = {
  // Model Management
  createModel(data: CreateModelRequest): Promise<ModelResponse>;
  getModel(modelId: string, memberId?: string): Promise<IAIModel>;
  listModels(
    memberId: string,
    options?: ListOptions
  ): Promise<PaginatedResponse<IAIModel>>;
  updateModel(modelId: string, updates: Partial<IAIModel>): Promise<IAIModel>;
  deleteModel(modelId: string, memberId: string, userId: string): Promise<void>;

  // Predictions
  predict(request: PredictionRequest): Promise<PredictionResponse>;
  batchPredict(
    request: BatchPredictionRequest
  ): Promise<BatchPredictionResponse>;
  streamPredict(request: PredictionRequest): AsyncGenerator<PredictionResponse>;

  // Model Lifecycle
  promoteModel(modelId: string, version: string, stage: string): Promise<void>;
  rollbackModel(modelId: string, targetVersion: string): Promise<void>;
  archiveModel(modelId: string): Promise<void>;

  // Feedback & Learning
  submitFeedback(predictionId: string, feedback: FeedbackData): Promise<void>;
  triggerIncrementalLearning(modelId: string): Promise<void>;

  // Monitoring & Analytics
  getModelMetrics(modelId: string): Promise<ModelMetrics>;
  getModelHealth(modelId: string): Promise<HealthStatus>;
  detectModelDrift(modelId: string): Promise<DriftReport>;
};

export type ListOptions = {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
};

export type FeedbackData = {
  actualValue: any;
  isCorrect: boolean;
  feedback?: string;
  providedBy: string;
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
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
  drift: DriftMetrics;
  customMetrics?: Record<string, number>;
};

export type LatencyMetrics = {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  max: number;
};

export type ThroughputMetrics = {
  requestsPerSecond: number;
  predictionsPerSecond: number;
  concurrentRequests: number;
};

export type DriftMetrics = {
  score: number;
  threshold: number;
  isDrifting: boolean;
  lastChecked: Date;
};

export type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  lastUpdated: Date;
};

export type AIHealthStatus = {
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

export type HealthCheck = {
  name: string;
  status: "pass" | "fail" | "warn";
  message?: string;
  duration: number;
};

export type DriftReport = {
  modelId: string;
  driftScore: number;
  threshold: number;
  isDrifting: boolean;
  affectedFeatures: string[];
  recommendations: string[];
  detectedAt: Date;
};
