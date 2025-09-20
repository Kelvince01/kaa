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
