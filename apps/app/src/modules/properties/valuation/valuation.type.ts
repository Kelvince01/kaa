/**
 * Property Valuation Types
 *
 * This module provides type definitions for property valuation and assessment
 * including automated valuations, market analysis, and valuation reports.
 */

/**
 * Valuation type enumeration
 */
export enum ValuationType {
  AUTOMATED = "automated",
  PROFESSIONAL = "professional",
  MARKET_ANALYSIS = "market_analysis",
  INSURANCE = "insurance",
  TAX_ASSESSMENT = "tax_assessment",
  RENTAL_ESTIMATE = "rental_estimate",
}

/**
 * Valuation status enumeration
 */
export enum ValuationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  EXPIRED = "expired",
}

/**
 * Valuation confidence level enumeration
 */
export enum ValuationConfidence {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

/**
 * Market trend enumeration
 */
export enum MarketTrend {
  DECLINING = "declining",
  STABLE = "stable",
  RISING = "rising",
  VOLATILE = "volatile",
}

/**
 * Comparable property interface
 */
export type ComparableProperty = {
  address: string;
  distance: number; // in miles/km
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize?: number;
  yearBuilt?: number;
  salePrice: number;
  saleDate: string;
  daysOnMarket?: number;
  pricePerSquareFoot: number;
  adjustments: Array<{
    factor: string;
    adjustment: number;
    reason: string;
  }>;
  adjustedPrice: number;
  weight: number; // 0-1, importance in valuation
};

/**
 * Market analysis interface
 */
export type MarketAnalysis = {
  averagePrice: number;
  medianPrice: number;
  pricePerSquareFoot: number;
  daysOnMarket: number;
  inventoryLevel: number;
  absorptionRate: number;
  trend: MarketTrend;
  trendPercentage: number;
  seasonalFactors: Array<{
    month: number;
    factor: number;
  }>;
  marketConditions: "buyers" | "sellers" | "balanced";
  insights: string[];
};

/**
 * Valuation factors interface
 */
export type ValuationFactors = {
  location: {
    score: number;
    factors: string[];
  };
  condition: {
    score: number;
    factors: string[];
  };
  amenities: {
    score: number;
    factors: string[];
  };
  marketConditions: {
    score: number;
    factors: string[];
  };
  uniqueFeatures: {
    score: number;
    factors: string[];
  };
};

/**
 * Valuation range interface
 */
export type ValuationRange = {
  low: number;
  high: number;
  mostLikely: number;
  confidence: ValuationConfidence;
};

/**
 * Property valuation interface
 */
export type PropertyValuation = {
  _id: string;
  property: string;
  type: ValuationType;
  status: ValuationStatus;
  requestedBy: string;
  valuationDate: string;
  effectiveDate: string;
  expiryDate?: string;

  // Valuation results
  estimatedValue: number;
  valuationRange: ValuationRange;
  confidence: ValuationConfidence;
  accuracy?: number; // percentage

  // Supporting data
  comparableProperties: ComparableProperty[];
  marketAnalysis: MarketAnalysis;
  valuationFactors: ValuationFactors;

  // Rental estimates (if applicable)
  rentalEstimate?: {
    monthlyRent: number;
    rentRange: {
      low: number;
      high: number;
    };
    grossYield: number;
    netYield?: number;
  };

  // Additional details
  methodology: string[];
  assumptions: string[];
  limitations: string[];
  dataSource: string[];

  // Report generation
  reportGenerated: boolean;
  reportUrl?: string;
  reportGeneratedAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // Additional fields for frontend
  propertyAddress?: string;
  requestedByName?: string;
  daysOld?: number;
  isExpired?: boolean;
  changeFromPrevious?: {
    amount: number;
    percentage: number;
    direction: "up" | "down" | "same";
  };
};

/**
 * Valuation request input
 */
export type CreateValuationInput = {
  propertyId: string;
  type: ValuationType;
  requestedBy: string;
  effectiveDate?: string;
  includeProfessionalAppraisal?: boolean;
  includeRentalEstimate?: boolean;
  purpose?: string;
  notes?: string;
};

/**
 * Valuation update input
 */
export type UpdateValuationInput = {
  status?: ValuationStatus;
  estimatedValue?: number;
  valuationRange?: ValuationRange;
  confidence?: ValuationConfidence;
  rentalEstimate?: PropertyValuation["rentalEstimate"];
  notes?: string;
};

/**
 * Valuation query parameters
 */
export type ValuationQueryParams = {
  property?: string;
  requestedBy?: string;
  type?: ValuationType;
  status?: ValuationStatus;
  confidence?: ValuationConfidence;
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
  includeExpired?: boolean;
  sortBy?: "valuationDate" | "estimatedValue" | "confidence" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Valuation comparison interface
 */
export type ValuationComparison = {
  current: PropertyValuation;
  previous?: PropertyValuation;
  change: {
    amount: number;
    percentage: number;
    direction: "up" | "down" | "same";
  };
  marketTrend: MarketTrend;
  factors: string[];
};

/**
 * Bulk valuation request interface
 */
export type BulkValuationRequest = {
  propertyIds: string[];
  type: ValuationType;
  requestedBy: string;
  effectiveDate?: string;
  includeRentalEstimate?: boolean;
};

/**
 * Valuation alert interface
 */
export type ValuationAlert = {
  _id: string;
  property: string;
  user: string;
  alertType: "value_change" | "market_trend" | "expiry_reminder";
  threshold?: number; // percentage change
  isActive: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Valuation statistics interface
 */
export type ValuationStats = {
  totalValuations: number;
  completedValuations: number;
  pendingValuations: number;
  averageValue: number;
  totalValue: number;
  averageAccuracy: number;
  byType: Record<ValuationType, number>;
  byConfidence: Record<ValuationConfidence, number>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    averageValue: number;
  }>;
  topPerformingProperties: Array<{
    propertyId: string;
    address: string;
    currentValue: number;
    appreciation: number;
  }>;
};

/**
 * Valuation report interface
 */
export type ValuationReport = {
  _id: string;
  valuation: string;
  reportType: "summary" | "detailed" | "comparative";
  generatedAt: string;
  format: "pdf" | "html";
  content: {
    executiveSummary: string;
    propertyDetails: any;
    valuationSummary: any;
    marketAnalysis: any;
    comparables: ComparableProperty[];
    methodology: string[];
    assumptions: string[];
    limitations: string[];
    appendices?: any[];
  };
  url?: string;
  downloadCount: number;
};

/**
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Valuation API responses
 */
export interface ValuationResponse extends ApiResponse<PropertyValuation> {
  valuation?: PropertyValuation;
}

/**
 * Valuation list response interface
 */
export type ValuationListResponse = {
  status: "success" | "error";
  message?: string;
  valuations?: PropertyValuation[];
  data?: {
    valuations: PropertyValuation[];
    pagination: Pagination;
  };
};

export interface ValuationStatsResponse extends ApiResponse<ValuationStats> {
  stats?: ValuationStats;
}

export interface ValuationComparisonResponse
  extends ApiResponse<ValuationComparison> {
  comparison?: ValuationComparison;
}

export interface ValuationReportResponse extends ApiResponse<ValuationReport> {
  report?: ValuationReport;
}

export interface BulkValuationResponse
  extends ApiResponse<PropertyValuation[]> {
  requested: number;
  successful: number;
  failed: number;
  valuations?: PropertyValuation[];
}
