import { httpClient } from "@/lib/axios";
import type {
  AnalyticsEvent,
  AnalyticsFilter,
  AnalyticsStats,
  DemandForecast,
  FinancialAnalytics,
  FormAnalytics,
  InvestmentOpportunity,
  LocationScore,
  MarketData,
  MarketInsight,
  PortfolioAnalytics,
  PropertyComparison,
  PropertyPerformanceMetrics,
  PropertyView,
  UserBehavior,
} from "./analytics.type";

// Analytics Statistics
export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const { data } = await httpClient.api.get<AnalyticsStats>("/analytics/stats");
  return data;
}

// Event Tracking
export async function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp">
): Promise<void> {
  await httpClient.api.post("/analytics/events", {
    ...event,
    timestamp: new Date(),
  });
}

export async function trackPropertyView(
  view: Omit<PropertyView, "timestamp">
): Promise<void> {
  await httpClient.api.post("/analytics/property-views", {
    ...view,
    timestamp: new Date(),
  });
}

// Property Analytics
export async function getPropertyPerformance(
  propertyId: string,
  period?: "7d" | "30d" | "90d" | "1y"
): Promise<PropertyPerformanceMetrics> {
  const { data } = await httpClient.api.get<PropertyPerformanceMetrics>(
    `/analytics/property/${propertyId}/performance`,
    { params: { period: period || "30d" } }
  );
  return data;
}

export async function getPropertyAnalytics(
  propertyId: string,
  filter?: AnalyticsFilter
): Promise<{
  views: number;
  inquiries: number;
  engagement: Record<string, number>;
  demographics: Record<string, any>;
  chartData: {
    views: { labels: string[]; data: number[] };
    engagement: { labels: string[]; data: number[] };
  };
}> {
  const { data } = await httpClient.api.get(
    `/analytics/property/${propertyId}`,
    {
      params: filter,
    }
  );
  return data;
}

// Portfolio Analytics
export async function getPortfolioAnalytics(
  landlordId?: string,
  period?: "30d" | "90d" | "1y"
): Promise<PortfolioAnalytics> {
  const { data } = await httpClient.api.get<{ data: PortfolioAnalytics }>(
    "/analytics/portfolio",
    {
      params: { landlordId, period: period || "30d" },
    }
  );
  return data.data;
}

export async function getFinancialAnalytics(
  landlordId?: string,
  period?: "30d" | "90d" | "1y"
): Promise<FinancialAnalytics> {
  const { data } = await httpClient.api.get<FinancialAnalytics>(
    "/analytics/financial",
    {
      params: { landlordId, period: period || "30d" },
    }
  );
  return data;
}

// Form Analytics
export async function getFormAnalytics(
  formType: string,
  sessionId?: string
): Promise<FormAnalytics> {
  const { data } = await httpClient.api.get<FormAnalytics>(
    `/analytics/forms/${formType}`,
    {
      params: { sessionId },
    }
  );
  return data;
}

export async function getUserBehavior(
  filter?: AnalyticsFilter
): Promise<UserBehavior> {
  const { data } = await httpClient.api.get<UserBehavior>(
    "/analytics/user-behavior",
    {
      params: filter,
    }
  );
  return data;
}

// Market Intelligence
export async function getMarketData(
  location: string,
  propertyType?: string
): Promise<MarketData> {
  const { data } = await httpClient.api.get<MarketData>(
    "/analytics/market-data",
    {
      params: { location, propertyType },
    }
  );
  return data;
}

export async function getPropertyComparison(
  propertyId: string,
  limit?: number
): Promise<PropertyComparison> {
  const { data } = await httpClient.api.get<PropertyComparison>(
    `/analytics/property/${propertyId}/comparison`,
    { params: { limit: limit || 5 } }
  );
  return data;
}

export async function getMarketInsights(
  propertyId?: string,
  location?: string
): Promise<MarketInsight[]> {
  const { data } = await httpClient.api.get<MarketInsight[]>(
    "/analytics/market/insights",
    {
      params: { propertyId, location },
    }
  );
  return data;
}

export async function getDemandForecast(
  location: string,
  propertyType?: string,
  period?: "1month" | "3months" | "6months" | "1year"
): Promise<DemandForecast> {
  const { data } = await httpClient.api.get<DemandForecast>(
    "/analytics/demand-forecast",
    {
      params: { location, propertyType, period: period || "3months" },
    }
  );
  return data;
}

export async function getLocationScore(
  location: string
): Promise<LocationScore> {
  const { data } = await httpClient.api.get<LocationScore>(
    "/analytics/location-score",
    {
      params: { location },
    }
  );
  return data;
}

export async function getInvestmentOpportunities(
  location?: string,
  budget?: number,
  type?: "buy" | "develop" | "renovate"
): Promise<InvestmentOpportunity[]> {
  const { data } = await httpClient.api.get<InvestmentOpportunity[]>(
    "/analytics/investment-opportunities",
    {
      params: { location, budget, type },
    }
  );
  return data;
}

// Advanced Analytics
export async function getConversionFunnel(
  funnel: string,
  filter?: AnalyticsFilter
): Promise<{
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
}> {
  const { data } = await httpClient.api.get(`/analytics/funnel/${funnel}`, {
    params: filter,
  });
  return data;
}

export async function getCohortAnalysis(
  period: "weekly" | "monthly",
  cohortSize = 12
): Promise<{
  cohorts: Array<{
    cohort: string;
    users: number;
    retention: number[];
  }>;
  averageRetention: number[];
}> {
  const { data } = await httpClient.api.get("/analytics/cohort", {
    params: { period, cohortSize },
  });
  return data;
}

export async function getSegmentAnalysis(
  segment: "user_type" | "device" | "location" | "source",
  filter?: AnalyticsFilter
): Promise<
  Array<{
    segment: string;
    users: number;
    sessions: number;
    conversionRate: number;
    averageSessionDuration: number;
  }>
> {
  const { data } = await httpClient.api.get(`/analytics/segments/${segment}`, {
    params: filter,
  });
  return data;
}

// Export Data
export async function exportAnalytics(
  type: "property" | "portfolio" | "market" | "user",
  format: "csv" | "json" | "pdf",
  filter?: AnalyticsFilter
): Promise<{
  downloadUrl: string;
  filename: string;
}> {
  const { data } = await httpClient.api.post<{
    downloadUrl: string;
    filename: string;
  }>("/analytics/export", {
    type,
    format,
    filter,
  });
  return data;
}
