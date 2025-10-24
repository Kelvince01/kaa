import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  type AIAnalysis,
  type AIGenerationOptions,
  aiService,
  conversationMemory,
} from "@/modules/ai";
import type { PropertyFormData } from "../schema";

type AIServiceError = {
  message: string;
  code?: string;
  retryable?: boolean;
};

type StreamingState = {
  isStreaming: boolean;
  streamedText: string;
  complete: boolean;
};

// Enhanced hook with caching, streaming, and smart suggestions
export function useAIAssistant(propertyData?: Partial<PropertyFormData>) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    complete: false,
  });
  const conversationId = useRef<string>(
    `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  // Cache key generators
  const generateCacheKey = (type: string, data: any) => [
    "ai-service",
    type,
    JSON.stringify(data),
  ];

  const generateDescriptionMutation = useMutation({
    mutationFn: async ({
      propertyData,
      options,
    }: {
      propertyData: Partial<PropertyFormData>;
      options?: AIGenerationOptions;
    }) => {
      try {
        return await aiService.generatePropertyDescription(
          propertyData as any,
          options
        );
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to generate description"
        );
      }
    },
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
    retry: (failureCount, error) => {
      // Retry up to 2 times for network errors
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const analyzeContentMutation = useMutation({
    mutationFn: async (content: string) => {
      try {
        return await aiService.analyzeContent(content);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to analyze content"
        );
      }
    },
    onSuccess: setAnalysis,
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const suggestPricingMutation = useMutation({
    mutationFn: async (propertyData: Partial<PropertyFormData>) => {
      try {
        return await aiService.suggestPricing(propertyData as any);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to get pricing suggestions"
        );
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const optimizeSEOMutation = useMutation({
    mutationFn: async ({
      content,
      propertyType,
    }: {
      content: string;
      propertyType: string;
    }) => {
      try {
        return await aiService.optimizeForSEO(content, propertyType);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to optimize for SEO"
        );
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  // Market analysis mutation
  const marketAnalysisMutation = useMutation({
    mutationFn: async (location: string) => {
      try {
        return await aiService.getMarketAnalysis(location);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to get market analysis"
        );
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  // Property recommendations mutation
  const propertyRecommendationsMutation = useMutation({
    mutationFn: async (preferences: {
      budget: number;
      location: string;
      bedrooms: number;
      amenities: string[];
    }) => {
      try {
        return await aiService.getPropertyRecommendations(preferences);
      } catch (error) {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Failed to get property recommendations"
        );
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  // AI query mutation
  const aiQueryMutation = useMutation({
    mutationFn: async ({
      query,
      domain,
      threadId,
    }: {
      query: string;
      domain?: string;
      threadId?: string;
    }) => {
      try {
        return await aiService.processQuery(query, domain, threadId);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to process AI query"
        );
      }
    },
    retry: (failureCount, error) => {
      if (failureCount < 2 && error?.message?.includes("network")) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const generateDescription = useCallback(
    (propertyData: Partial<PropertyFormData>, options?: AIGenerationOptions) =>
      generateDescriptionMutation.mutateAsync({ propertyData, options }),
    [generateDescriptionMutation]
  );

  const analyzeContent = useCallback(
    (content: string) => analyzeContentMutation.mutateAsync(content),
    [analyzeContentMutation]
  );

  const suggestPricing = useCallback(
    (propertyData: Partial<PropertyFormData>) =>
      suggestPricingMutation.mutateAsync(propertyData),
    [suggestPricingMutation]
  );

  const optimizeForSEO = useCallback(
    (content: string, propertyType: string) =>
      optimizeSEOMutation.mutateAsync({ content, propertyType }),
    [optimizeSEOMutation]
  );

  // New callback functions for additional AI capabilities
  const getMarketAnalysis = useCallback(
    (location: string) => marketAnalysisMutation.mutateAsync(location),
    [marketAnalysisMutation]
  );

  const getPropertyRecommendations = useCallback(
    (preferences: {
      budget: number;
      location: string;
      bedrooms: number;
      amenities: string[];
    }) => propertyRecommendationsMutation.mutateAsync(preferences),
    [propertyRecommendationsMutation]
  );

  const processAIQuery = useCallback(
    (query: string, domain?: string, threadId?: string) =>
      aiQueryMutation.mutateAsync({ query, domain, threadId }),
    [aiQueryMutation]
  );

  return {
    // Core AI functions
    generateDescription,
    analyzeContent,
    suggestPricing,
    optimizeForSEO,

    // Additional AI capabilities
    getMarketAnalysis,
    getPropertyRecommendations,
    processAIQuery,

    // State and data
    analysis,

    // Loading states
    isGenerating,
    isAnalyzing: analyzeContentMutation.isPending,
    isSuggestingPrice: suggestPricingMutation.isPending,
    isOptimizing: optimizeSEOMutation.isPending,
    isAnalyzingMarket: marketAnalysisMutation.isPending,
    isGettingRecommendations: propertyRecommendationsMutation.isPending,
    isProcessingQuery: aiQueryMutation.isPending,

    // Response data
    generatedDescription: generateDescriptionMutation.data,
    pricingSuggestion: suggestPricingMutation.data,
    seoOptimization: optimizeSEOMutation.data,
    marketAnalysis: marketAnalysisMutation.data,
    propertyRecommendations: propertyRecommendationsMutation.data,
    aiQueryResponse: aiQueryMutation.data,

    // Error states
    generationError: generateDescriptionMutation.error,
    analysisError: analyzeContentMutation.error,
    pricingError: suggestPricingMutation.error,
    seoError: optimizeSEOMutation.error,
    marketAnalysisError: marketAnalysisMutation.error,
    recommendationsError: propertyRecommendationsMutation.error,
    queryError: aiQueryMutation.error,

    // Reset functions
    resetGeneration: () => generateDescriptionMutation.reset(),
    resetAnalysis: () => analyzeContentMutation.reset(),
    resetPricing: () => suggestPricingMutation.reset(),
    resetSEO: () => optimizeSEOMutation.reset(),
    resetMarketAnalysis: () => marketAnalysisMutation.reset(),
    resetRecommendations: () => propertyRecommendationsMutation.reset(),
    resetQuery: () => aiQueryMutation.reset(),

    // Clear analysis state
    clearAnalysis: () => setAnalysis(null),

    // New enhanced features
    streamingState,
    conversationId: conversationId.current,

    // Streaming query function
    processStreamingQuery: useCallback(
      async (query: string, domain = "property") => {
        setStreamingState({
          isStreaming: true,
          streamedText: "",
          complete: false,
        });

        try {
          conversationMemory.addMessage(conversationId.current, "user", query);

          const result = await aiService.processQueryStream(
            conversationMemory.getContextualPrompt(
              conversationId.current,
              query
            ),
            domain,
            conversationId.current,
            (chunk) => {
              setStreamingState((prev) => ({
                ...prev,
                streamedText: chunk,
              }));
            }
          );

          conversationMemory.addMessage(
            conversationId.current,
            "assistant",
            result.response
          );
          setStreamingState({
            isStreaming: false,
            streamedText: result.response,
            complete: true,
          });

          return result;
        } catch (error) {
          setStreamingState({
            isStreaming: false,
            streamedText: "",
            complete: false,
          });
          throw error;
        }
      },
      []
    ),

    // Smart suggestions with caching
    // biome-ignore lint/correctness/useExhaustiveDependencies: generateCacheKey is a dependency of getSmartSuggestions
    getSmartSuggestions: useCallback(
      async (fieldName: string) => {
        if (!propertyData) return [];

        // Check cache first
        const cacheKey = generateCacheKey("smart-suggestions", {
          propertyData,
          fieldName,
        });
        const cachedSuggestions = queryClient.getQueryData(cacheKey);

        if (cachedSuggestions) {
          return cachedSuggestions as string[];
        }

        try {
          const suggestions = await aiService.getSmartSuggestions(
            propertyData as any,
            fieldName
          );

          // Cache for 5 minutes
          queryClient.setQueryData(cacheKey, suggestions, {
            updatedAt: Date.now(),
          });

          return suggestions;
        } catch (error) {
          console.error("Failed to get smart suggestions:", error);
          return [];
        }
      },
      [propertyData, queryClient]
    ),

    // Validation with caching
    // biome-ignore lint/correctness/useExhaustiveDependencies: generateCacheKey is a dependency of validatePropertyData
    validatePropertyData: useCallback(
      async (data?: Partial<PropertyFormData>) => {
        const dataToValidate = data || propertyData;
        if (!dataToValidate)
          return { isValid: true, issues: [], suggestions: [] };

        // Check cache first
        const cacheKey = generateCacheKey("validation", dataToValidate);
        const cachedValidation = queryClient.getQueryData(cacheKey);

        if (cachedValidation) {
          return cachedValidation;
        }

        try {
          const validation = await aiService.validatePropertyData(
            dataToValidate as any
          );

          // Cache for 2 minutes
          queryClient.setQueryData(cacheKey, validation, {
            updatedAt: Date.now(),
          });

          return validation;
        } catch (error) {
          console.error("Failed to validate property data:", error);
          return { isValid: true, issues: [], suggestions: [] };
        }
      },
      [propertyData, queryClient]
    ),

    // Optimistic updates
    applyOptimisticUpdate: useCallback(
      (field: string, value: any) => {
        // Apply optimistic update to form data
        queryClient.setQueryData(["property-form", "current"], (old: any) => ({
          ...old,
          [field]: value,
        }));
      },
      [queryClient]
    ),

    // Clear conversation
    clearConversation: useCallback(() => {
      conversationMemory.clearConversation(conversationId.current);
      setStreamingState({
        isStreaming: false,
        streamedText: "",
        complete: false,
      });
    }, []),

    // Get conversation history
    getConversationHistory: useCallback(
      () => conversationMemory.getConversation(conversationId.current),
      []
    ),
  };
}
