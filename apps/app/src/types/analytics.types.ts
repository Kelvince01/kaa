/**
 * Shared types for Analytics and Market Intelligence
 * These types ensure consistency between frontend hooks and backend APIs
 */

// Core Analytics Types
export type AnalyticsEvent = {
  event: string;
  step?: string;
  field?: string;
  value?: any;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
};

export type FormAnalytics = {
  sessionId: string;
  startTime: Date;
  currentStep: string;
  timePerStep: Record<string, number>;
  fieldInteractions: Record<string, number>;
  errors: Array<{ field: string; error: string; timestamp: Date }>;
  completionRate: number;
  dropOffPoints: string[];
};

export type UserBehavior = {
  averageTimePerStep: number;
  mostProblematicFields: Array<{ field: string; errorRate: number }>;
  commonDropOffPoints: string[];
  conversionFunnels: Record<string, number>;
  deviceType: "mobile" | "tablet" | "desktop";
  browserInfo: string;
};

export type PropertyPerformanceMetrics = {
  propertyId: string;
  views: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  inquiries: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    responseRate: number;
  };
  engagement: {
    favorites: number;
    shares: number;
    contactAttempts: number;
    viewingRequests: number;
  };
  demographics: {
    viewerAge: Array<{ range: string; percentage: number }>;
    viewerType: Array<{ type: string; percentage: number }>;
    peakTimes: Array<{ time: string; views: number }>;
  };
  performance: {
    rank: number;
    totalProperties: number;
    category: string;
    score: number;
  };
};

export type FinancialAnalytics = {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    monthlyData: Array<{ month: string; amount: number; count: number }>;
  };
  properties: {
    total: number;
    occupied: number;
    vacant: number;
    occupancyRate: number;
    averageRent: number;
    totalPotentialIncome: number;
  };
  trends: {
    revenueGrowth: number;
    occupancyTrend: "up" | "down" | "stable";
    demandTrend: "high" | "medium" | "low";
  };
};

// Market Intelligence Types
export type MarketData = {
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: "low" | "medium" | "high";
  seasonalAdjustment: number;
  competitorCount: number;
  averageDaysOnMarket: number;
  priceHistory: Array<{ month: string; price: number }>;
  occupancyRate: number;
  rentYield: number;
};

export type PropertyComparison = {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  similarity: number;
  distance: number;
  daysOnMarket: number;
  photos: string[];
  status: "available" | "rented" | "pending";
  pricePerSqm?: number;
};

export type MarketInsight = {
  type: "pricing" | "demand" | "timing" | "features" | "location";
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
  actionable: boolean;
  priority: "high" | "medium" | "low";
};

export type DemandForecast = {
  nextMonth: number;
  nextQuarter: number;
  nextYear: number;
  seasonal: {
    peak: string;
    low: string;
    factors: string[];
  };
  factors: Array<{
    factor: string;
    impact: number;
    weight: number;
    description: string;
  }>;
  confidence: number;
};

export type RentalTrends = {
  priceMovement: {
    direction: "up" | "down" | "stable";
    percentage: number;
    timeframe: string;
  };
  demandTrends: {
    current: "high" | "medium" | "low";
    forecast: "increasing" | "decreasing" | "stable";
    seasonality: Array<{
      month: number;
      demandIndex: number;
      description: string;
    }>;
  };
  supplyTrends: {
    newListings: number;
    withdrawnListings: number;
    netChange: number;
    marketBalance: "oversupply" | "balanced" | "undersupply";
  };
};

export type LocationAnalysis = {
  score: number;
  factors: {
    accessibility: number;
    amenities: number;
    safety: number;
    infrastructure: number;
    growth: number;
  };
  nearby: {
    schools: Array<{ name: string; distance: number; rating: number }>;
    hospitals: Array<{ name: string; distance: number; type: string }>;
    shopping: Array<{ name: string; distance: number; type: string }>;
    transport: Array<{ name: string; distance: number; type: string }>;
  };
  futureProjects: Array<{
    name: string;
    type: string;
    expectedCompletion: string;
    impact: "positive" | "negative" | "neutral";
  }>;
};

export type InvestmentOpportunity = {
  type: "buy" | "develop" | "renovate";
  description: string;
  investment: number;
  expectedReturn: number;
  paybackPeriod: number;
  riskLevel: "low" | "medium" | "high";
  confidence: number;
  location: string;
  reasoning: string[];
};

// Portfolio Analytics Types
export type PortfolioAnalytics = {
  overview: {
    totalProperties: number;
    totalValue: number;
    monthlyIncome: number;
    occupancyRate: number;
    averageRoi: number;
  };
  distribution: {
    byType: Array<{ type: string; count: number; value: number }>;
    byLocation: Array<{ county: string; count: number; avgRent: number }>;
    byStatus: Array<{ status: string; count: number; percentage: number }>;
  };
  performance: {
    topPerformers: Array<{
      propertyId: string;
      title: string;
      monthlyIncome: number;
      occupancyRate: number;
      roi: number;
    }>;
    underPerformers: Array<{
      propertyId: string;
      title: string;
      issues: string[];
      suggestions: string[];
    }>;
  };
};

export type DashboardAnalytics = {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
    target: number;
  };
  properties: {
    total: number;
    occupied: number;
    occupancyRate: number;
  };
  bookings: {
    thisMonth: number;
    pending: number;
    conversionRate: number;
  };
  trends: {
    revenueChart: Array<{ month: string; amount: number }>;
    occupancyChart: Array<{ month: string; rate: number }>;
    bookingsChart: Array<{ month: string; count: number }>;
  };
};

export type ComparativeAnalytics = {
  property: {
    rentAmount: number;
    views: number;
    inquiries: number;
    daysOnMarket: number;
  };
  market: {
    averageRent: number;
    averageViews: number;
    averageInquiries: number;
    averageDaysOnMarket: number;
  };
  comparison: {
    rentPerformance: number; // percentage above/below market
    viewsPerformance: number;
    inquiriesPerformance: number;
    marketingEfficiency: number;
  };
  recommendations: string[];
};
