// Types for property AI operations
export type PropertyData = {
  basic?: {
    title?: string;
    description?: string;
  };
  details?: {
    bedrooms?: number;
    bathrooms?: number;
    size?: number;
    floor?: number;
  };
  location?: {
    county?: string;
    city?: string;
    neighborhood?: string;
  };
  pricing?: {
    rent?: number;
    deposit?: number;
  };
  amenities?: string[];
  type?: string;
};

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

// External API interfaces
export type MarketDataProvider = {
  name: string;
  apiKey?: string;
  baseUrl: string;
  rateLimit: number;
};

export type PropertyValuationModel = {
  name: string;
  accuracy: number;
  features: string[];
  lastTrained: Date;
};

export type VoiceRecognitionConfig = {
  provider: "google" | "azure" | "aws";
  apiKey: string;
  language: string;
  timeout: number;
};

// Enhanced types for advanced AI features
export type PropertyImageAnalysis = {
  description: string;
  features: string[];
  condition: "excellent" | "good" | "fair" | "poor";
  estimatedValue: number;
  recommendations: string[];
  detectedIssues: string[];
  aiConfidence: number;
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

export type MarketInsight = {
  location: string;
  averagePrice: number;
  priceRange: { min: number; max: number };
  trends: {
    direction: "up" | "down" | "stable";
    percentage: number;
    period: string;
  };
  demandSupplyRatio: number;
  investment_score: number;
  popularFeatures: string[];
};

export type PropertyValuation = {
  estimatedValue: number;
  confidenceScore: number;
  valuationRange: { min: number; max: number };
  methodology: string;
  comparables: Array<{
    address: string;
    price: number;
    similarity: number;
    adjustments: Record<string, number>;
  }>;
  marketFactors: Record<string, number>;
};

export type LegalComplianceCheck = {
  isCompliant: boolean;
  complianceScore: number;
  requiredDocuments: Array<{
    document: string;
    status: "present" | "missing" | "invalid";
    importance: "critical" | "important" | "optional";
  }>;
  violations: Array<{
    type: string;
    severity: "high" | "medium" | "low";
    description: string;
    remedy: string;
  }>;
  recommendations: string[];
};
