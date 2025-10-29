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

export type PropertyView = {
  propertyId: string;
  userId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  referrer?: string;
  viewDuration?: number;
  source: "direct" | "search" | "social" | "email" | "ads" | "other";
  deviceType: "mobile" | "tablet" | "desktop";
  location?: {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  engagement?: {
    scrollDepth?: number;
    timeOnPage?: number;
    interactions?: string[];
    contactRequested?: boolean;
    favorited?: boolean;
    shared?: boolean;
  };
  timestamp: Date;
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

export type PortfolioAnalytics = {
  totalProperties: number;
  totalValue: number;
  averageRent: number;
  occupancyRate: number;
  monthlyIncome: number;
  performanceRating: number;
  distribution: {
    type: Array<{ type: string; count: number; percentage: number }>;
    location: Array<{ location: string; count: number; percentage: number }>;
    priceRange: Array<{ range: string; count: number; percentage: number }>;
  };
  trends: {
    valueGrowth: number;
    rentGrowth: number;
    occupancyTrend: "up" | "down" | "stable";
  };
  topPerformers: Array<{
    propertyId: string;
    title: string;
    score: number;
    roi: number;
  }>;
  underPerformers: Array<{
    propertyId: string;
    title: string;
    issues: string[];
    recommendations: string[];
  }>;
};

// Market Intelligence Types
export type MarketData = {
  averagePrice: number;
  demandLevel: "high" | "medium" | "low";
  supplyLevel: "high" | "medium" | "low";
  competitorCount: number;
  priceRange: { min: number; max: number };
  trendDirection: "up" | "down" | "stable";
  confidence: number;
};

export type PropertyComparison = {
  similarProperties: Array<{
    id: string;
    title: string;
    price: number;
    similarity: number;
    advantages: string[];
    disadvantages: string[];
  }>;
  marketPosition: "above" | "at" | "below";
  competitiveAdvantages: string[];
  suggestedImprovements: string[];
};

export type MarketInsight = {
  type: "pricing" | "demand" | "timing" | "features";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionRequired: boolean;
  recommendations: string[];
  confidence: number;
  data?: Record<string, any>;
};

export type DemandForecast = {
  period: "1month" | "3months" | "6months" | "1year";
  prediction: "increasing" | "stable" | "decreasing";
  confidence: number;
  factors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
  }>;
  recommendations: string[];
};

export type LocationScore = {
  overall: number;
  accessibility: number;
  amenities: number;
  safety: number;
  infrastructure: number;
  growth: number;
  breakdown: {
    transport: { score: number; details: string[] };
    shopping: { score: number; details: string[] };
    education: { score: number; details: string[] };
    healthcare: { score: number; details: string[] };
    recreation: { score: number; details: string[] };
  };
};

export type InvestmentOpportunity = {
  type: "buy" | "develop" | "renovate";
  property?: {
    id: string;
    title: string;
    price: number;
    location: string;
  };
  roi: number;
  riskLevel: "low" | "medium" | "high";
  timeframe: string;
  investment: number;
  expectedReturn: number;
  reasons: string[];
  risks: string[];
  nextSteps: string[];
};

export type AnalyticsFilter = {
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  userId?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  source?: "direct" | "search" | "social" | "email" | "ads" | "other";
  location?: string;
  granularity?: "hour" | "day" | "week" | "month";
};

export type ChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
    fill?: boolean;
  }>;
};

export type AnalyticsStats = {
  counts: {
    properties: number;
    bookings: number;
    users: number;
    pendingReviews: number;
  };
  revenue: { total: number };
  recentBookings: Array<{
    _id: string;
    property: { title: string };
    tenant: { firstName: string; lastName: string };
    createdAt: Date;
  }>;
  propertyTypeStats: Array<{ _id: string; count: number }>;
  userRoleStats: Array<{ _id: string; count: number }>;
  bookingStatusStats: Array<{ _id: string; count: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  topProperties: Array<{
    _id: string;
    title: string;
    bookings: number;
    revenue: number;
  }>;
};
