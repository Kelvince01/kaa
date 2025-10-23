import { httpClient } from "@/lib/axios";
import type { PropertyFormData } from "../../schema";

// Types for AI service
export type AIGenerationOptions = {
  tone?: "professional" | "friendly" | "luxury" | "casual";
  length?: "short" | "medium" | "long";
  includeKeywords?: string[];
  targetAudience?: "families" | "professionals" | "students" | "general";
};

export type AIAnalysis = {
  score: number;
  suggestions: string[];
  keywords: string[];
  sentiment: "positive" | "neutral" | "negative";
  readabilityScore: number;
  seoScore: number;
};

export type PricingSuggestion = {
  recommendedPrice: number;
  range: { min: number; max: number };
  confidence: number;
  reasoning: string[];
  marketComparisons: Array<{
    address: string;
    price: number;
    similarity: number;
  }>;
};

export type SEOOptimization = {
  optimizedContent: string;
  improvements: string[];
  keywordDensity: Record<string, number>;
};

// API request/response types
type GenerateDescriptionRequest = {
  propertyData: Partial<PropertyFormData>;
  options?: AIGenerationOptions;
};

type AnalyzeContentRequest = {
  content: string;
};

type SuggestPricingRequest = {
  propertyData: Partial<PropertyFormData>;
};

type OptimizeSEORequest = {
  content: string;
  propertyType: string;
};

// AI Service Class
export class AIService {
  private static instance: AIService;
  private readonly baseURL = "/ai";

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Generate property description using AI
   */
  async generateDescription(
    propertyData: Partial<PropertyFormData>,
    options: AIGenerationOptions = {}
  ): Promise<string> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        data: { description: string };
      }>(`${this.baseURL}/property/generate-description`, {
        propertyData,
        options,
      });

      if (response.data.status === "success") {
        return response.data.data.description;
      }

      throw new Error("Failed to generate description");
    } catch (error) {
      console.error("AI Service - Generate Description Error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to generate description"
      );
    }
  }

  /**
   * Analyze content using AI
   */
  async analyzeContent(content: string): Promise<AIAnalysis> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        data: AIAnalysis;
      }>(`${this.baseURL}/property/analyze-content`, { content });

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

  /**
   * Get pricing suggestions using AI
   */
  async suggestPricing(
    propertyData: Partial<PropertyFormData>
  ): Promise<PricingSuggestion> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        data: PricingSuggestion;
      }>(`${this.baseURL}/property/suggest-pricing`, { propertyData });

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
  }

  /**
   * Optimize content for SEO using AI
   */
  async optimizeForSEO(
    content: string,
    propertyType: string
  ): Promise<SEOOptimization> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        data: SEOOptimization;
      }>(`${this.baseURL}/property/optimize-seo`, { content, propertyType });

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
  async getMarketAnalysis(location: string): Promise<any> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        analysis: any;
      }>(`${this.baseURL}/property/market-analysis`, { location });

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
  async getPropertyRecommendations(preferences: {
    budget: number;
    location: string;
    bedrooms: number;
    amenities: string[];
  }): Promise<any> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        recommendations: any;
      }>(`${this.baseURL}/property/recommendations`, preferences);

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
  async processQuery(
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
      }>(`${this.baseURL}/query`, {
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
  async processQueryStream(
    query: string,
    domain = "property",
    threadId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<{ response: string; threadId: string }> {
    try {
      // For now, we'll use regular HTTP since streaming requires special backend setup
      // In a real implementation, this would use Server-Sent Events or WebSocket
      const response = await this.processQuery(query, domain, threadId);

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
  async getSmartSuggestions(
    context: Partial<PropertyFormData>,
    fieldName: string
  ): Promise<string[]> {
    try {
      const response = await httpClient.api.post<{
        status: string;
        data: { suggestions: string[] };
      }>(`${this.baseURL}/query`, {
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
  async validatePropertyData(propertyData: Partial<PropertyFormData>): Promise<{
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
      }>(`${this.baseURL}/query`, {
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
}

// Conversation memory management
class AIConversationMemory {
  private readonly conversations = new Map<
    string,
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >();

  addMessage(threadId: string, role: "user" | "assistant", content: string) {
    if (!this.conversations.has(threadId)) {
      this.conversations.set(threadId, []);
    }

    const conversation = this.conversations.get(threadId) || [];
    conversation.push({ role, content, timestamp: new Date() });

    // Keep only last 50 messages to prevent memory bloat
    if (conversation.length > 50) {
      conversation.splice(0, conversation.length - 50);
    }
  }

  getConversation(threadId: string) {
    return this.conversations.get(threadId) || [];
  }

  clearConversation(threadId: string) {
    this.conversations.delete(threadId);
  }

  getContextualPrompt(threadId: string, newQuery: string): string {
    const history = this.getConversation(threadId)
      .slice(-10) // Last 10 messages for context
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    return history
      ? `Context:\n${history}\n\nNew query: ${newQuery}`
      : newQuery;
  }
}

// Export singleton instances
export const aiService = AIService.getInstance();
export const conversationMemory = new AIConversationMemory();
