import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { httpClient } from "@/lib/axios";

// Types for enhanced AI features
type PropertyImageAnalysis = {
  description: string;
  features: string[];
  condition: "excellent" | "good" | "fair" | "poor";
  estimatedValue: number;
  recommendations: string[];
  detectedIssues: string[];
  aiConfidence: number;
};

type DocumentAnalysis = {
  documentType: string;
  extractedInfo: Record<string, any>;
  legalCompliance: {
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  };
  keyTerms: string[];
  summary: string;
};

type PropertyValuation = {
  valuationRange: { min: number; max: number; most_likely: number };
  confidence: number;
  methodology: string[];
  comparables: Array<{
    address: string;
    price: number;
    similarity: number;
    adjustments: Record<string, number>;
  }>;
  marketFactors: {
    location_premium: number;
    market_conditions: number;
    property_specific: number;
  };
  recommendations: string[];
};

type MarketInsights = {
  averagePrice: number;
  pricePerSqm: number;
  marketTrend: "up" | "down" | "stable";
  dataSource: string;
  lastUpdated: Date;
  comparables: Array<{
    address: string;
    price: number;
    size: number;
    bedrooms: number;
    listingDate: Date;
  }>;
};

type StreamingState = {
  isStreaming: boolean;
  streamedText: string;
  complete: boolean;
  error?: string;
};

type VoiceProcessingResult = {
  transcript: string;
  confidence: number;
  intent: string;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  aiResponse?: string;
};

export function useAIAssistant(propertyContext?: any) {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    complete: false,
  });

  const [conversationId] = useState(
    () => `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const eventSourceRef = useRef<EventSource | null>(null);

  // ===== Property Image Analysis =====
  const analyzePropertyImageMutation = useMutation({
    mutationFn: async ({ file, context }: { file: File; context?: any }) => {
      const formData = new FormData();
      formData.append("image", file);
      if (context) {
        formData.append("propertyContext", JSON.stringify(context));
      }

      const response = await httpClient.api.post<{
        status: string;
        data: PropertyImageAnalysis;
      }>("/ai/property/image/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to analyze property image");
    },
    onSuccess: () => {
      toast.success("Property image analyzed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze property image");
    },
  });

  // ===== Document Processing =====
  const processDocumentMutation = useMutation({
    mutationFn: async ({
      file,
      documentType,
    }: {
      file: File;
      documentType?:
        | "lease"
        | "contract"
        | "title_deed"
        | "certificate"
        | "other";
    }) => {
      const formData = new FormData();
      formData.append("document", file);
      if (documentType) {
        formData.append("documentType", documentType);
      }

      const response = await httpClient.api.post<{
        status: string;
        data: DocumentAnalysis;
      }>("/ai/document/process", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to process document");
    },
    onSuccess: () => {
      toast.success("Document processed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process document");
    },
  });

  // ===== Advanced Property Valuation =====
  const performValuationMutation = useMutation({
    mutationFn: async (propertyData: {
      location: { lat: number; lng: number; county: string; city: string };
      physical: {
        bedrooms: number;
        bathrooms: number;
        size: number;
        age?: number;
      };
      features: string[];
      condition: "excellent" | "good" | "fair" | "poor";
    }) => {
      const response = await httpClient.api.post<{
        status: string;
        data: PropertyValuation;
      }>("/ai/property/valuation/advanced", propertyData);

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to perform property valuation");
    },
    onSuccess: () => {
      toast.success("Property valuation completed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to perform property valuation");
    },
  });

  // ===== Market Insights =====
  const fetchMarketInsights = useCallback(async (location: string) => {
    try {
      const response = await httpClient.api.get<{
        status: string;
        data: MarketInsights;
      }>(`/ai/market/insights/${encodeURIComponent(location)}`);

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to fetch market insights");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch market insights");
      throw error;
    }
  }, []);

  // ===== Voice Processing =====
  const processVoiceMutation = useMutation({
    mutationFn: async ({
      audioBlob,
      language = "en-KE",
    }: {
      audioBlob: Blob;
      language?: string;
    }) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.wav");
      formData.append("language", language);

      const response = await httpClient.api.post<{
        status: string;
        data: VoiceProcessingResult;
      }>("/ai/voice/process", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to process voice query");
    },
    onSuccess: () => {
      toast.success("Voice query processed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process voice query");
    },
  });

  // ===== Streaming Chat =====
  const processStreamingQuery = useCallback(
    (query: string, domain = "property") => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      setStreamingState({
        isStreaming: true,
        streamedText: "",
        complete: false,
      });

      try {
        const params = new URLSearchParams({
          conversationId,
          query,
          domain,
          ...(propertyContext && { context: JSON.stringify(propertyContext) }),
        });

        const eventSource = new EventSource(
          `${httpClient.config.baseURL}/ai/stream/chat?${params}`,
          {
            withCredentials: true,
          }
        );

        eventSourceRef.current = eventSource;

        return new Promise<{ response: string; complete: boolean }>(
          (resolve, reject) => {
            let finalResponse = "";

            eventSource.onmessage = (event) => {
              if (event.data === "[DONE]") {
                setStreamingState({
                  isStreaming: false,
                  streamedText: finalResponse,
                  complete: true,
                });
                eventSource.close();
                resolve({ response: finalResponse, complete: true });
                return;
              }

              try {
                const chunk = JSON.parse(event.data);

                if (chunk.type === "error") {
                  throw new Error(chunk.content);
                }

                if (chunk.type === "text") {
                  finalResponse = chunk.content;
                  setStreamingState((prev) => ({
                    ...prev,
                    streamedText: chunk.content,
                  }));
                }

                if (chunk.type === "complete") {
                  finalResponse = chunk.content;
                  setStreamingState({
                    isStreaming: false,
                    streamedText: chunk.content,
                    complete: true,
                  });
                  eventSource.close();
                  resolve({ response: finalResponse, complete: true });
                }
              } catch (error) {
                console.error("Error parsing SSE data:", error);
              }
            };

            eventSource.onerror = (error) => {
              console.error("EventSource error:", error);
              setStreamingState((prev) => ({
                ...prev,
                isStreaming: false,
                error: "Streaming connection failed",
              }));
              eventSource.close();
              reject(new Error("Streaming connection failed"));
            };

            // Set timeout for streaming
            setTimeout(() => {
              if (eventSource.readyState !== EventSource.CLOSED) {
                eventSource.close();
                setStreamingState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  error: "Streaming timeout",
                }));
                reject(new Error("Streaming timeout"));
              }
            }, 60_000); // 60 seconds timeout
          }
        );
      } catch (error) {
        setStreamingState((prev) => ({
          ...prev,
          isStreaming: false,
          error: (error as Error).message,
        }));
        throw error;
      }
    },
    [conversationId, propertyContext]
  );

  // ===== Contract Analysis =====
  const analyzeContractMutation = useMutation({
    mutationFn: async ({
      contractText,
      contractType,
    }: {
      contractText: string;
      contractType?: "lease" | "sale" | "management";
    }) => {
      const response = await httpClient.api.post<{
        status: string;
        data: any;
      }>("/ai/contract/analyze", {
        contractText,
        contractType,
      });

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to analyze contract");
    },
    onSuccess: () => {
      toast.success("Contract analyzed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to analyze contract");
    },
  });

  // ===== Smart Recommendations =====
  const getSmartRecommendationsMutation = useMutation({
    mutationFn: async (userProfile: {
      budget: { min: number; max: number };
      preferences: {
        location: string[];
        propertyType: string[];
        bedrooms: number[];
        amenities: string[];
      };
      lifestyle: string[];
      workLocation?: { lat: number; lng: number };
      transportation: "car" | "public" | "both";
    }) => {
      const response = await httpClient.api.post<{
        status: string;
        data: any[];
      }>("/ai/property/recommendations/smart", userProfile);

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to generate recommendations");
    },
    onSuccess: () => {
      toast.success("Property recommendations generated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate recommendations");
    },
  });

  // ===== Legal Compliance Check =====
  const checkLegalComplianceMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await httpClient.api.post<{
        status: string;
        data: any;
      }>("/ai/legal/compliance/check", {
        propertyData,
        documents: propertyData.documents || [],
      });

      if (response.data.status === "success") {
        return response.data.data;
      }
      throw new Error("Failed to check legal compliance");
    },
    onSuccess: () => {
      toast.success("Legal compliance check completed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to check legal compliance");
    },
  });

  // ===== Cleanup =====
  useEffect(
    () => () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    },
    []
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setStreamingState({
      isStreaming: false,
      streamedText: "",
      complete: false,
    });
  }, []);

  return {
    // Image Analysis
    analyzePropertyImage: analyzePropertyImageMutation.mutateAsync,
    isAnalyzingImage: analyzePropertyImageMutation.isPending,
    imageAnalysis: analyzePropertyImageMutation.data,
    imageAnalysisError: analyzePropertyImageMutation.error,

    // Document Processing
    processDocument: processDocumentMutation.mutateAsync,
    isProcessingDocument: processDocumentMutation.isPending,
    documentAnalysis: processDocumentMutation.data,
    documentProcessingError: processDocumentMutation.error,

    // Property Valuation
    performValuation: performValuationMutation.mutateAsync,
    isPerformingValuation: performValuationMutation.isPending,
    valuation: performValuationMutation.data,
    valuationError: performValuationMutation.error,

    // Market Insights
    fetchMarketInsights,

    // Voice Processing
    processVoiceQuery: processVoiceMutation.mutateAsync,
    isProcessingVoice: processVoiceMutation.isPending,
    voiceResult: processVoiceMutation.data,
    voiceProcessingError: processVoiceMutation.error,

    // Streaming Chat
    processStreamingQuery,
    streamingState,
    conversationId,
    clearConversation,

    // Contract Analysis
    analyzeContract: analyzeContractMutation.mutateAsync,
    isAnalyzingContract: analyzeContractMutation.isPending,
    contractAnalysis: analyzeContractMutation.data,
    contractAnalysisError: analyzeContractMutation.error,

    // Smart Recommendations
    getSmartRecommendations: getSmartRecommendationsMutation.mutateAsync,
    isGettingRecommendations: getSmartRecommendationsMutation.isPending,
    recommendations: getSmartRecommendationsMutation.data,
    recommendationsError: getSmartRecommendationsMutation.error,

    // Legal Compliance
    checkLegalCompliance: checkLegalComplianceMutation.mutateAsync,
    isCheckingCompliance: checkLegalComplianceMutation.isPending,
    complianceCheck: checkLegalComplianceMutation.data,
    complianceError: checkLegalComplianceMutation.error,

    // General states
    isProcessingQuery: streamingState.isStreaming,

    // Reset functions
    resetImageAnalysis: () => analyzePropertyImageMutation.reset(),
    resetDocumentProcessing: () => processDocumentMutation.reset(),
    resetValuation: () => performValuationMutation.reset(),
    resetVoiceProcessing: () => processVoiceMutation.reset(),
    resetContractAnalysis: () => analyzeContractMutation.reset(),
    resetRecommendations: () => getSmartRecommendationsMutation.reset(),
    resetComplianceCheck: () => checkLegalComplianceMutation.reset(),
  };
}
