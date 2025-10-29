import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as analyticsService from "./analytics.service";
import type {
  AnalyticsEvent,
  AnalyticsFilter,
  PropertyView,
} from "./analytics.type";

// Query keys
export const analyticsKeys = {
  all: ["analytics"] as const,
  stats: () => [...analyticsKeys.all, "stats"] as const,
  property: (id: string) => [...analyticsKeys.all, "property", id] as const,
  propertyPerformance: (id: string, period?: string) =>
    [...analyticsKeys.property(id), "performance", period] as const,
  propertyAnalytics: (id: string, filter?: AnalyticsFilter) =>
    [...analyticsKeys.property(id), "analytics", filter] as const,
  portfolio: (landlordId?: string, period?: string) =>
    [...analyticsKeys.all, "portfolio", { landlordId, period }] as const,
  financial: (landlordId?: string, period?: string) =>
    [...analyticsKeys.all, "financial", { landlordId, period }] as const,
  forms: (formType: string, sessionId?: string) =>
    [...analyticsKeys.all, "forms", formType, sessionId] as const,
  userBehavior: (filter?: AnalyticsFilter) =>
    [...analyticsKeys.all, "user-behavior", filter] as const,
  marketData: (location: string, propertyType?: string) =>
    [...analyticsKeys.all, "market-data", { location, propertyType }] as const,
  propertyComparison: (id: string, limit?: number) =>
    [...analyticsKeys.property(id), "comparison", limit] as const,
  marketInsights: (propertyId?: string, location?: string) =>
    [
      ...analyticsKeys.all,
      "market-insights",
      { propertyId, location },
    ] as const,
  demandForecast: (location: string, propertyType?: string, period?: string) =>
    [
      ...analyticsKeys.all,
      "demand-forecast",
      { location, propertyType, period },
    ] as const,
  locationScore: (location: string) =>
    [...analyticsKeys.all, "location-score", location] as const,
  investmentOpportunities: (
    location?: string,
    budget?: number,
    type?: string
  ) =>
    [...analyticsKeys.all, "investment", { location, budget, type }] as const,
  conversionFunnel: (funnel: string, filter?: AnalyticsFilter) =>
    [...analyticsKeys.all, "funnel", funnel, filter] as const,
  cohortAnalysis: (period: string, cohortSize?: number) =>
    [...analyticsKeys.all, "cohort", { period, cohortSize }] as const,
  segmentAnalysis: (segment: string, filter?: AnalyticsFilter) =>
    [...analyticsKeys.all, "segments", segment, filter] as const,
};

// Analytics Statistics
export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: analyticsKeys.stats(),
    queryFn: () => analyticsService.getAnalyticsStats(),
    refetchInterval: 30_000, // Refresh every 30 seconds
  });
};

// Event Tracking
export const useTrackEvent = () =>
  useMutation({
    mutationFn: (event: Omit<AnalyticsEvent, "timestamp">) =>
      analyticsService.trackEvent(event),
    onError: (error: any) => {
      console.error("Failed to track event:", error);
    },
  });

export const useTrackPropertyView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (view: Omit<PropertyView, "timestamp">) =>
      analyticsService.trackPropertyView(view),
    onSuccess: (_, variables) => {
      // Invalidate property analytics queries
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.property(variables.propertyId),
      });
    },
    onError: (error: any) => {
      console.error("Failed to track property view:", error);
    },
  });
};

// Property Analytics
export const usePropertyPerformance = (
  propertyId: string,
  period?: "7d" | "30d" | "90d" | "1y"
) =>
  useQuery({
    queryKey: analyticsKeys.propertyPerformance(propertyId, period),
    queryFn: () => analyticsService.getPropertyPerformance(propertyId, period),
    enabled: !!propertyId,
  });

export const usePropertyAnalytics = (
  propertyId: string,
  filter?: AnalyticsFilter
) =>
  useQuery({
    queryKey: analyticsKeys.propertyAnalytics(propertyId, filter),
    queryFn: () => analyticsService.getPropertyAnalytics(propertyId, filter),
    enabled: !!propertyId,
  });

// Portfolio Analytics
export const usePortfolioAnalytics = (
  landlordId?: string,
  period?: "30d" | "90d" | "1y"
) =>
  useQuery({
    queryKey: analyticsKeys.portfolio(landlordId, period),
    queryFn: () => analyticsService.getPortfolioAnalytics(landlordId, period),
  });

export const useFinancialAnalytics = (
  landlordId?: string,
  period?: "30d" | "90d" | "1y"
) =>
  useQuery({
    queryKey: analyticsKeys.financial(landlordId, period),
    queryFn: () => analyticsService.getFinancialAnalytics(landlordId, period),
  });

// Form Analytics
export const useFormAnalytics = (formType: string, sessionId?: string) =>
  useQuery({
    queryKey: analyticsKeys.forms(formType, sessionId),
    queryFn: () => analyticsService.getFormAnalytics(formType, sessionId),
    enabled: !!formType,
  });

export const useUserBehavior = (filter?: AnalyticsFilter) =>
  useQuery({
    queryKey: analyticsKeys.userBehavior(filter),
    queryFn: () => analyticsService.getUserBehavior(filter),
  });

// Market Intelligence
export const useMarketData = (location: string, propertyType?: string) =>
  useQuery({
    queryKey: analyticsKeys.marketData(location, propertyType),
    queryFn: () => analyticsService.getMarketData(location, propertyType),
    enabled: !!location,
  });

export const usePropertyComparison = (propertyId: string, limit?: number) =>
  useQuery({
    queryKey: analyticsKeys.propertyComparison(propertyId, limit),
    queryFn: () => analyticsService.getPropertyComparison(propertyId, limit),
    enabled: !!propertyId,
  });

export const useMarketInsights = (propertyId?: string, location?: string) =>
  useQuery({
    queryKey: analyticsKeys.marketInsights(propertyId, location),
    queryFn: () => analyticsService.getMarketInsights(propertyId, location),
    enabled: !!propertyId || !!location,
  });

export const useDemandForecast = (
  location: string,
  propertyType?: string,
  period?: "1month" | "3months" | "6months" | "1year"
) =>
  useQuery({
    queryKey: analyticsKeys.demandForecast(location, propertyType, period),
    queryFn: () =>
      analyticsService.getDemandForecast(location, propertyType, period),
    enabled: !!location,
  });

export const useLocationScore = (location: string) =>
  useQuery({
    queryKey: analyticsKeys.locationScore(location),
    queryFn: () => analyticsService.getLocationScore(location),
    enabled: !!location,
  });

export const useInvestmentOpportunities = (
  location?: string,
  budget?: number,
  type?: "buy" | "develop" | "renovate"
) =>
  useQuery({
    queryKey: analyticsKeys.investmentOpportunities(location, budget, type),
    queryFn: () =>
      analyticsService.getInvestmentOpportunities(location, budget, type),
  });

// Advanced Analytics
export const useConversionFunnel = (funnel: string, filter?: AnalyticsFilter) =>
  useQuery({
    queryKey: analyticsKeys.conversionFunnel(funnel, filter),
    queryFn: () => analyticsService.getConversionFunnel(funnel, filter),
    enabled: !!funnel,
  });

export const useCohortAnalysis = (
  period: "weekly" | "monthly",
  cohortSize?: number
) =>
  useQuery({
    queryKey: analyticsKeys.cohortAnalysis(period, cohortSize),
    queryFn: () => analyticsService.getCohortAnalysis(period, cohortSize),
  });

export const useSegmentAnalysis = (
  segment: "user_type" | "device" | "location" | "source",
  filter?: AnalyticsFilter
) =>
  useQuery({
    queryKey: analyticsKeys.segmentAnalysis(segment, filter),
    queryFn: () => analyticsService.getSegmentAnalysis(segment, filter),
  });

// Export Data
export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({
      type,
      format,
      filter,
    }: {
      type: "property" | "portfolio" | "market" | "user";
      format: "csv" | "json" | "pdf";
      filter?: AnalyticsFilter;
    }) => analyticsService.exportAnalytics(type, format, filter),
    onSuccess: (data) => {
      // Download the file
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export started. Download will begin shortly.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Export failed");
    },
  });
};
