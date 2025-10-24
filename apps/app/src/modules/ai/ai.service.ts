import { httpClient } from "@/lib/axios";
import type { Property } from "../properties";
import type {
  AIAnalysis,
  AIGenerationOptions,
  ImageAnalysisResult,
  PricingSuggestion,
  SEOOptimization,
} from "./ai.type";

/**
 * Generate property description using AI
 */
export const generatePropertyDescription = async (
  propertyData: Partial<Property>,
  options: AIGenerationOptions = {}
): Promise<string> => {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: { description: string };
    }>("/ai/property/generate/description", { propertyData, options });

    if (response.data.status === "success") {
      return response.data.data.description;
    }

    throw new Error("Failed to generate description");
  } catch (error) {
    console.error("AI Service - Generate Description Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate description"
    );
  }
};

/**
 * Analyze content using AI
 */
export async function analyzeContent(content: string): Promise<AIAnalysis> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: AIAnalysis;
    }>("ai/property/analyze-content", { content });

    if (response.data.status === "success") {
      return response.data.data;
    }

    throw new Error("Failed to analyze content");
  } catch (error) {
    console.error("AI Service - Analyze Content Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to analyze content"
    );
  }
}

// Analyze property images with AI
export const analyzePropertyImages = async (
  images: File[]
): Promise<ImageAnalysisResult> => {
  const formData = new FormData();
  for (const img of images) {
    formData.append("images", img);
  }
  const response = await httpClient.api.post(
    "/ai/property/analyze/images",
    formData
  );
  return response.data.analysis;
};

// Get AI-powered pricing suggestions
export const suggestPricing = async (
  propertyData: Partial<Property>
): Promise<PricingSuggestion> => {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: PricingSuggestion;
    }>("/ai/suggest-pricing", propertyData);

    if (response.data.status === "success") {
      return response.data.data;
    }

    throw new Error("Failed to get pricing suggestions");
  } catch (error) {
    console.error("AI Service - Suggest Pricing Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get pricing suggestions"
    );
  }
};

/**
 * Optimize content for SEO using AI
 */
export async function optimizeForSEO(
  content: string,
  propertyType: string
): Promise<SEOOptimization> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: SEOOptimization;
    }>("/ai/property/optimize-seo", { content, propertyType });

    if (response.data.status === "success") {
      return response.data.data;
    }

    throw new Error("Failed to optimize for SEO");
  } catch (error) {
    console.error("AI Service - Optimize SEO Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to optimize for SEO"
    );
  }
}

/**
 * Get market analysis for a location
 */
export async function getMarketAnalysis(location: string): Promise<any> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      analysis: any;
    }>("/ai/property/market-analysis", { location });

    if (response.data.status === "success") {
      return response.data.analysis;
    }

    throw new Error("Failed to get market analysis");
  } catch (error) {
    console.error("AI Service - Market Analysis Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to get market analysis"
    );
  }
}

/**
 * Get property recommendations
 */
export async function getPropertyRecommendations(preferences: {
  budget: number;
  location: string;
  bedrooms: number;
  amenities: string[];
}): Promise<any> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      recommendations: any;
    }>("/ai/property/recommendations", preferences);

    if (response.data.status === "success") {
      return response.data.recommendations;
    }

    throw new Error("Failed to get property recommendations");
  } catch (error) {
    console.error("AI Service - Property Recommendations Error:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to get property recommendations"
    );
  }
}

/**
 * Process general AI query
 */
export async function processQuery(
  query: string,
  domain = "property",
  threadId?: string
): Promise<{
  response: string;
  threadId: string;
}> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: { response: string; threadId: string };
    }>("/ai/query", {
      query,
      domain,
      threadId: threadId || "",
    });

    if (response.data.status === "success") {
      return response.data.data;
    }

    throw new Error("Failed to process query");
  } catch (error) {
    console.error("AI Service - Process Query Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to process query"
    );
  }
}

/**
 * Stream AI responses for real-time interaction
 */
export async function processQueryStream(
  query: string,
  domain = "property",
  threadId?: string,
  onChunk?: (chunk: string) => void
): Promise<{ response: string; threadId: string }> {
  try {
    // For now, we'll use regular HTTP since streaming requires special backend setup
    // In a real implementation, this would use Server-Sent Events or WebSocket
    const response = await processQuery(query, domain, threadId);

    // Simulate streaming for better UX
    if (onChunk) {
      const words = response.response.split(" ");
      for (let i = 0; i < words.length; i++) {
        setTimeout(() => {
          onChunk(words.slice(0, i + 1).join(" "));
        }, i * 50); // 50ms delay between words
      }
    }

    return response;
  } catch (error) {
    console.error("AI Service - Process Query Stream Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to process query"
    );
  }
}

/**
 * Get smart suggestions based on current form context
 */
export async function getSmartSuggestions(
  context: Partial<Property>,
  fieldName: string
): Promise<string[]> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: { suggestions: string[] };
    }>("/ai/query", {
      query: `Suggest values for ${fieldName} field based on this property context`,
      domain: "property",
      context,
    });

    if (response.data.status === "success") {
      return response.data.data.suggestions || [];
    }

    return [];
  } catch (error) {
    console.error("AI Service - Smart Suggestions Error:", error);
    return [];
  }
}

/**
 * Validate property data using AI
 */
export async function validatePropertyData(
  propertyData: Partial<Property>
): Promise<{
  isValid: boolean;
  issues: Array<{
    field: string;
    message: string;
    severity: "error" | "warning" | "info";
  }>;
  suggestions: Array<{ field: string; suggestion: string }>;
}> {
  try {
    const response = await httpClient.api.post<{
      status: string;
      data: {
        isValid: boolean;
        issues: Array<{
          field: string;
          message: string;
          severity: "error" | "info" | "warning";
        }>;
        suggestions: Array<{ field: string; suggestion: string }>;
      };
    }>("/ai/query", {
      query:
        "Validate this property data and provide suggestions for improvement",
      domain: "property-validation",
      context: propertyData,
    });

    if (response.data.status === "success") {
      return response.data.data;
    }

    return { isValid: true, issues: [], suggestions: [] };
  } catch (error) {
    console.error("AI Service - Validate Property Data Error:", error);
    return { isValid: true, issues: [], suggestions: [] };
  }
}
