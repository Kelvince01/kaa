import type { Property } from "../properties";

// Types for enhanced AI features
export type PropertyImageAnalysis = {
  description: string;
  features: string[];
  condition: "excellent" | "good" | "fair" | "poor";
  estimatedValue: number;
  recommendations: string[];
  detectedIssues: string[];
  aiConfidence: number;
};

export type ImageAnalysisResult = {
  images: Array<{
    url: string;
    tags: string[];
    quality: "excellent" | "good" | "fair" | "poor";
    roomType?:
      | "bedroom"
      | "bathroom"
      | "kitchen"
      | "living"
      | "exterior"
      | "other";
    issues?: string[];
    suggestions?: string[];
  }>;
  overallQuality: number;
  recommendations: string[];
};

export type DocumentAnalysis = {
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

export type PropertyValuation = {
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

export type MarketInsights = {
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

export type StreamingState = {
  isStreaming: boolean;
  streamedText: string;
  complete: boolean;
  error?: string;
};

export type VoiceProcessingResult = {
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

// =================== //

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
  propertyData: Partial<Property>;
  options?: AIGenerationOptions;
};

type AnalyzeContentRequest = {
  content: string;
};

type SuggestPricingRequest = {
  propertyData: Partial<Property>;
};

type OptimizeSEORequest = {
  content: string;
  propertyType: string;
};
