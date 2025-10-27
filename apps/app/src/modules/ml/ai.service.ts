import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
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

export const aiService = {
  // Model Management
  /**
   * List all AI models with pagination and filtering
   */
  listModels: async (
    options?: ListOptions
  ): Promise<PaginatedResponse<IAIModel>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);
    if (options?.type) params.append("type", options.type);
    if (options?.search) params.append("search", options.search);

    const response: AxiosResponse<{
      status: string;
      data: PaginatedResponse<IAIModel>;
    }> = await httpClient.mlApi.get(`/ai/models?${params.toString()}`);

    return response.data.data;
  },

  /**
   * Get a specific AI model by ID
   */
  getModel: async (modelId: string): Promise<ModelResponse> => {
    const response: AxiosResponse<{
      status: string;
      data: ModelResponse;
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}`);

    return response.data.data;
  },

  /**
   * Create a new AI model
   */
  createModel: async (data: CreateModelRequest): Promise<ModelResponse> => {
    const response: AxiosResponse<{
      status: string;
      data: ModelResponse;
    }> = await httpClient.mlApi.post("/ai/models", data);

    return response.data.data;
  },

  /**
   * Update an existing AI model
   */
  updateModel: async (
    modelId: string,
    data: Partial<CreateModelRequest>
  ): Promise<ModelResponse> => {
    const response: AxiosResponse<{
      status: string;
      data: ModelResponse;
    }> = await httpClient.mlApi.put(`/ai/models/${modelId}`, data);

    return response.data.data;
  },

  /**
   * Delete an AI model
   */
  deleteModel: async (modelId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.delete(
      `/ai/models/${modelId}`
    );
    return response.data;
  },

  /**
   * Train an AI model
   */
  trainModel: async (
    modelId: string,
    data?: { force?: boolean }
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/train`,
      data
    );
    return response.data;
  },

  /**
   * Deploy a model to production
   */
  deployModel: async (
    modelId: string,
    version?: string
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/deploy`,
      { version }
    );
    return response.data;
  },

  // Predictions
  /**
   * Make a single prediction
   */
  predict: async (
    id: string,
    data: PredictionRequest
  ): Promise<PredictionResponse> => {
    const response: AxiosResponse<{
      status: string;
      data: PredictionResponse;
    }> = await httpClient.mlApi.post(`/ai/models/${id}/predict`, data);

    return response.data.data;
  },

  /**
   * Make batch predictions
   */
  predictBatch: async (
    data: BatchPredictionRequest
  ): Promise<BatchPredictionResponse> => {
    const response: AxiosResponse<{
      status: string;
      data: BatchPredictionResponse;
    }> = await httpClient.mlApi.post("/ai/predict/batch", data);

    return response.data.data;
  },

  /**
   * Get prediction history
   */
  getPredictions: async (
    options?: ListOptions
  ): Promise<PaginatedResponse<IPrediction>> => {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());

    const response: AxiosResponse<{
      status: string;
      data: PaginatedResponse<IPrediction>;
    }> = await httpClient.mlApi.get(`/ai/predictions?${params.toString()}`);

    return response.data.data;
  },

  /**
   * Provide feedback on a prediction
   */
  provideFeedback: async (data: FeedbackData): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      "/ai/feedback",
      data
    );
    return response.data;
  },

  // Recommendations
  /**
   * Get recommendations for the current user
   */
  getRecommendations: async (options?: {
    type?: IRecommendation["type"];
    limit?: number;
  }): Promise<IRecommendation[]> => {
    const params = new URLSearchParams();
    if (options?.type) params.append("type", options.type);
    if (options?.limit) params.append("limit", options.limit.toString());

    const response: AxiosResponse<{
      status: string;
      data: IRecommendation[];
    }> = await httpClient.mlApi.get(`/ai/recommendations?${params.toString()}`);

    return response.data.data;
  },

  /**
   * Update recommendation status (accepted, dismissed, etc.)
   */
  updateRecommendation: async (
    recommendationId: string,
    status: IRecommendation["status"]
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.patch(
      `/ai/recommendations/${recommendationId}`,
      { status }
    );
    return response.data;
  },

  // Analytics and Monitoring
  /**
   * Get model performance metrics
   */
  getModelMetrics: async (modelId: string): Promise<ModelMetrics> => {
    const response: AxiosResponse<{
      status: string;
      data: ModelMetrics;
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}/metrics`);

    return response.data.data;
  },

  /**
   * Get AI system health status
   */
  getHealthStatus: async (): Promise<HealthStatus> => {
    const response: AxiosResponse<{
      status: string;
      data: HealthStatus;
    }> = await httpClient.mlApi.get("/ai/health");

    return response.data.data;
  },

  /**
   * Get data drift report for a model
   */
  getDriftReport: async (modelId: string): Promise<DriftReport> => {
    const response: AxiosResponse<{
      status: string;
      data: DriftReport;
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}/drift`);

    return response.data.data;
  },

  // Model Versions
  /**
   * List model versions
   */
  getModelVersions: async (modelId: string): Promise<IAIModel["versions"]> => {
    const response: AxiosResponse<{
      status: string;
      data: IAIModel["versions"];
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}/versions`);

    return response.data.data;
  },

  /**
   * Rollback to a previous model version
   */
  rollbackModel: async (
    modelId: string,
    version: string
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/rollback`,
      { version }
    );
    return response.data;
  },

  // A/B Testing
  /**
   * Start A/B test between model versions
   */
  startABTest: async (
    modelId: string,
    data: { versionA: string; versionB: string; trafficSplit: number }
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/ab-test/start`,
      data
    );
    return response.data;
  },

  /**
   * Stop A/B test
   */
  stopABTest: async (modelId: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/ab-test/stop`
    );
    return response.data;
  },

  /**
   * Get A/B test results
   */
  getABTestResults: async (
    modelId: string
  ): Promise<{
    versionA: { version: string; metrics: ModelMetrics; traffic: number };
    versionB: { version: string; metrics: ModelMetrics; traffic: number };
    winner?: string;
    confidence: number;
  }> => {
    const response: AxiosResponse<{
      status: string;
      data: {
        versionA: { version: string; metrics: ModelMetrics; traffic: number };
        versionB: { version: string; metrics: ModelMetrics; traffic: number };
        winner?: string;
        confidence: number;
      };
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}/ab-test/results`);

    return response.data.data;
  },

  // AutoML and Optimization
  /**
   * Start AutoML process for automatic model optimization
   */
  startAutoML: async (
    modelId: string,
    data?: { maxTrials?: number; maxTime?: number }
  ): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await httpClient.mlApi.post(
      `/ai/models/${modelId}/automl`,
      data
    );
    return response.data;
  },

  /**
   * Get AutoML optimization progress
   */
  getAutoMLProgress: async (
    modelId: string
  ): Promise<{
    status: "running" | "completed" | "failed";
    progress: number;
    bestMetrics?: ModelMetrics;
    trialCount: number;
    estimatedTimeRemaining?: number;
  }> => {
    const response: AxiosResponse<{
      status: string;
      data: {
        status: "running" | "completed" | "failed";
        progress: number;
        bestMetrics?: ModelMetrics;
        trialCount: number;
        estimatedTimeRemaining?: number;
      };
    }> = await httpClient.mlApi.get(`/ai/models/${modelId}/automl/progress`);

    return response.data.data;
  },
};
