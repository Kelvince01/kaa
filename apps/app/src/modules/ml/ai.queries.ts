import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiService } from "./ai.service";
import type {
  BatchPredictionRequest,
  CreateModelRequest,
  FeedbackData,
  IRecommendation,
  ListOptions,
  PredictionRequest,
} from "./ai.type";

// Query Keys
export const AI_QUERY_KEYS = {
  all: ["ai"] as const,
  models: () => [...AI_QUERY_KEYS.all, "models"] as const,
  model: (id: string) => [...AI_QUERY_KEYS.models(), id] as const,
  modelVersions: (id: string) =>
    [...AI_QUERY_KEYS.model(id), "versions"] as const,
  modelMetrics: (id: string) =>
    [...AI_QUERY_KEYS.model(id), "metrics"] as const,
  modelDrift: (id: string) => [...AI_QUERY_KEYS.model(id), "drift"] as const,
  predictions: () => [...AI_QUERY_KEYS.all, "predictions"] as const,
  recommendations: () => [...AI_QUERY_KEYS.all, "recommendations"] as const,
  health: () => [...AI_QUERY_KEYS.all, "health"] as const,
  abTest: (modelId: string) =>
    [...AI_QUERY_KEYS.model(modelId), "ab-test"] as const,
  automl: (modelId: string) =>
    [...AI_QUERY_KEYS.model(modelId), "automl"] as const,
} as const;

// Model Queries
export const useModels = (options?: ListOptions) => {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.models(), options],
    queryFn: () => aiService.listModels(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useModel = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.model(modelId),
    queryFn: () => aiService.getModel(modelId),
    enabled: enabled && !!modelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useModelVersions = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.modelVersions(modelId),
    queryFn: () => aiService.getModelVersions(modelId),
    enabled: enabled && !!modelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useModelMetrics = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.modelMetrics(modelId),
    queryFn: () => aiService.getModelMetrics(modelId),
    enabled: enabled && !!modelId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useModelDrift = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.modelDrift(modelId),
    queryFn: () => aiService.getDriftReport(modelId),
    enabled: enabled && !!modelId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Prediction Queries
export const usePredictions = (options?: ListOptions) => {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.predictions(), options],
    queryFn: () => aiService.getPredictions(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Recommendation Queries
export const useRecommendations = (options?: {
  type?: IRecommendation["type"];
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...AI_QUERY_KEYS.recommendations(), options],
    queryFn: () => aiService.getRecommendations(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Health Monitoring
export const useHealthStatus = () => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.health(),
    queryFn: () => aiService.getHealthStatus(),
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 15 * 1000, // 15 seconds
  });
};

// A/B Testing
export const useABTestResults = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.abTest(modelId),
    queryFn: () => aiService.getABTestResults(modelId),
    enabled: enabled && !!modelId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// AutoML Progress
export const useAutoMLProgress = (modelId: string, enabled = true) => {
  return useQuery({
    queryKey: AI_QUERY_KEYS.automl(modelId),
    queryFn: () => aiService.getAutoMLProgress(modelId),
    enabled: enabled && !!modelId,
    refetchInterval: (data) => {
      // Refetch more frequently if AutoML is running
      return data?.state?.data?.status === "running" ? 5000 : false;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Model Mutations
export const useCreateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModelRequest) => aiService.createModel(data),
    onSuccess: (newModel) => {
      // Invalidate models list
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      // Add the new model to cache
      queryClient.setQueryData(AI_QUERY_KEYS.model(newModel._id), newModel);

      toast.success("Model created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create model");
    },
  });
};

export const useUpdateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modelId,
      data,
    }: {
      modelId: string;
      data: Partial<CreateModelRequest>;
    }) => aiService.updateModel(modelId, data),
    onSuccess: (updatedModel, { modelId }) => {
      // Update the specific model in cache
      queryClient.setQueryData(AI_QUERY_KEYS.model(modelId), updatedModel);

      // Invalidate models list to ensure consistency
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      toast.success("Model updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update model");
    },
  });
};

export const useDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => aiService.deleteModel(modelId),
    onSuccess: (_, modelId) => {
      // Remove from all related queries
      queryClient.removeQueries({ queryKey: AI_QUERY_KEYS.model(modelId) });

      // Invalidate models list
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      toast.success("Model deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete model");
    },
  });
};

export const useTrainModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, force }: { modelId: string; force?: boolean }) =>
      aiService.trainModel(modelId, { force }),
    onSuccess: (_, { modelId }) => {
      // Invalidate model data to reflect training status
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.model(modelId) });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      toast.success("Model training started");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to start model training"
      );
    },
  });
};

export const useDeployModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, version }: { modelId: string; version?: string }) =>
      aiService.deployModel(modelId, version),
    onSuccess: (_, { modelId }) => {
      // Invalidate model data to reflect deployment status
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.model(modelId) });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      toast.success("Model deployed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to deploy model");
    },
  });
};

// Prediction Mutations
export const usePredict = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: PredictionRequest }) =>
      aiService.predict(id, data),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Prediction failed");
    },
  });

export const useBatchPredict = () =>
  useMutation({
    mutationFn: (data: BatchPredictionRequest) => aiService.predictBatch(data),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Batch prediction failed");
    },
  });

export const useProvideFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FeedbackData) => aiService.provideFeedback(data),
    onSuccess: () => {
      // Invalidate predictions to show updated feedback
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.predictions() });

      toast.success("Feedback provided successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to provide feedback"
      );
    },
  });
};

// Recommendation Mutations
export const useUpdateRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recommendationId,
      status,
    }: {
      recommendationId: string;
      status: IRecommendation["status"];
    }) => aiService.updateRecommendation(recommendationId, status),
    onSuccess: () => {
      // Invalidate recommendations to show updated status
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.recommendations(),
      });

      toast.success("Recommendation updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update recommendation"
      );
    },
  });
};

// Model Version Mutations
export const useRollbackModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ modelId, version }: { modelId: string; version: string }) =>
      aiService.rollbackModel(modelId, version),
    onSuccess: (_, { modelId }) => {
      // Invalidate model data to reflect rollback
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.model(modelId) });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.models() });

      toast.success("Model rolled back successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to rollback model");
    },
  });
};

// A/B Testing Mutations
export const useStartABTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modelId,
      versionA,
      versionB,
      trafficSplit,
    }: {
      modelId: string;
      versionA: string;
      versionB: string;
      trafficSplit: number;
    }) => aiService.startABTest(modelId, { versionA, versionB, trafficSplit }),
    onSuccess: (_, { modelId }) => {
      // Invalidate A/B test data
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.abTest(modelId),
      });

      toast.success("A/B test started successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to start A/B test");
    },
  });
};

export const useStopABTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modelId: string) => aiService.stopABTest(modelId),
    onSuccess: (_, modelId) => {
      // Invalidate A/B test data
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.abTest(modelId),
      });

      toast.success("A/B test stopped successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to stop A/B test");
    },
  });
};

// AutoML Mutations
export const useStartAutoML = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      modelId,
      maxTrials,
      maxTime,
    }: {
      modelId: string;
      maxTrials?: number;
      maxTime?: number;
    }) => aiService.startAutoML(modelId, { maxTrials, maxTime }),
    onSuccess: (_, { modelId }) => {
      // Invalidate AutoML progress
      queryClient.invalidateQueries({
        queryKey: AI_QUERY_KEYS.automl(modelId),
      });

      toast.success("AutoML optimization started");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to start AutoML");
    },
  });
};
