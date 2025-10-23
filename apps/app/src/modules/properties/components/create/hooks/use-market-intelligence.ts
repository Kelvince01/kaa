import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { httpClient } from "@/lib/axios";
import type {
  DemandForecast,
  MarketData,
  MarketInsight,
  PropertyComparison,
} from "@/types/analytics.types";
import type { PropertyFormData } from "../schema";

// Market Intelligence API service
const marketIntelligenceService = {
  async getMarketData(
    location: string,
    propertyType: string
  ): Promise<MarketData> {
    const response = await httpClient.api.get("/analytics/market/data", {
      params: { location, propertyType },
    });
    return response.data.data;
  },

  async getComparableProperties(
    location: string,
    bedrooms: number,
    bathrooms: number,
    size?: number
  ): Promise<PropertyComparison[]> {
    const response = await httpClient.api.get(
      "/analytics/market/comparable-properties",
      {
        params: { location, bedrooms, bathrooms, ...(size && { size }) },
      }
    );
    return response.data.data;
  },

  async getMarketInsights(
    propertyData: Partial<PropertyFormData>
  ): Promise<MarketInsight[]> {
    const response = await httpClient.api.post(
      "/analytics/market/insights",
      propertyData
    );
    return response.data.data;
  },

  async getDemandForecast(location: string): Promise<DemandForecast> {
    const response = await httpClient.api.get(
      "/analytics/market/demand-forecast",
      {
        params: { location },
      }
    );
    return response.data.data;
  },

  async getRentalTrends(
    location: string,
    propertyType: string,
    timeframe: "3m" | "6m" | "1y" = "6m"
  ) {
    const response = await httpClient.api.get(
      "/analytics/market/rental-trends",
      {
        params: { location, propertyType, timeframe },
      }
    );
    return response.data.data;
  },

  async getLocationAnalysis(location: {
    county: string;
    city?: string;
    neighborhood?: string;
  }) {
    const response = await httpClient.api.post(
      "/analytics/market/location-analysis",
      location
    );
    return response.data.data;
  },

  async getInvestmentOpportunities(
    location: string,
    budget: number,
    riskTolerance: "low" | "medium" | "high" = "medium"
  ) {
    const response = await httpClient.api.get(
      "/analytics/market/investment-opportunities",
      {
        params: { location, budget, riskTolerance },
      }
    );
    return response.data.data;
  },
};

export function useMarketIntelligence() {
  const [selectedComparison, setSelectedComparison] =
    useState<PropertyComparison | null>(null);

  const marketDataQuery = useMutation({
    mutationFn: ({
      location,
      propertyType,
    }: {
      location: string;
      propertyType: string;
    }) => marketIntelligenceService.getMarketData(location, propertyType),
  });

  const comparablesQuery = useMutation({
    mutationFn: ({
      location,
      bedrooms,
      bathrooms,
      size,
    }: {
      location: string;
      bedrooms: number;
      bathrooms: number;
      size?: number;
    }) =>
      marketIntelligenceService.getComparableProperties(
        location,
        bedrooms,
        bathrooms,
        size
      ),
  });

  const insightsQuery = useMutation({
    mutationFn: (propertyData: Partial<PropertyFormData>) =>
      marketIntelligenceService.getMarketInsights(propertyData),
  });

  const forecastQuery = useMutation({
    mutationFn: (location: string) =>
      marketIntelligenceService.getDemandForecast(location),
  });

  const rentalTrendsQuery = useMutation({
    mutationFn: ({
      location,
      propertyType,
      timeframe,
    }: {
      location: string;
      propertyType: string;
      timeframe?: "3m" | "6m" | "1y";
    }) =>
      marketIntelligenceService.getRentalTrends(
        location,
        propertyType,
        timeframe
      ),
  });

  const locationAnalysisQuery = useMutation({
    mutationFn: (location: {
      county: string;
      city?: string;
      neighborhood?: string;
    }) => marketIntelligenceService.getLocationAnalysis(location),
  });

  const investmentOpportunitiesQuery = useMutation({
    mutationFn: ({
      location,
      budget,
      riskTolerance,
    }: {
      location: string;
      budget: number;
      riskTolerance?: "low" | "medium" | "high";
    }) =>
      marketIntelligenceService.getInvestmentOpportunities(
        location,
        budget,
        riskTolerance
      ),
  });

  const getMarketData = useCallback(
    (location: string, propertyType: string) =>
      marketDataQuery.mutateAsync({ location, propertyType }),
    [marketDataQuery]
  );

  const getComparables = useCallback(
    (location: string, bedrooms: number, bathrooms: number, size?: number) =>
      comparablesQuery.mutateAsync({ location, bedrooms, bathrooms, size }),
    [comparablesQuery]
  );

  const getInsights = useCallback(
    (propertyData: Partial<PropertyFormData>) =>
      insightsQuery.mutateAsync(propertyData),
    [insightsQuery]
  );

  const getForecast = useCallback(
    (location: string) => forecastQuery.mutateAsync(location),
    [forecastQuery]
  );

  const getRentalTrends = useCallback(
    (location: string, propertyType: string, timeframe?: "3m" | "6m" | "1y") =>
      rentalTrendsQuery.mutateAsync({ location, propertyType, timeframe }),
    [rentalTrendsQuery]
  );

  const getLocationAnalysis = useCallback(
    (location: { county: string; city?: string; neighborhood?: string }) =>
      locationAnalysisQuery.mutateAsync(location),
    [locationAnalysisQuery]
  );

  const getInvestmentOpportunities = useCallback(
    (
      location: string,
      budget: number,
      riskTolerance?: "low" | "medium" | "high"
    ) =>
      investmentOpportunitiesQuery.mutateAsync({
        location,
        budget,
        riskTolerance,
      }),
    [investmentOpportunitiesQuery]
  );

  return {
    // Core functions
    getMarketData,
    getComparables,
    getInsights,
    getForecast,
    getRentalTrends,
    getLocationAnalysis,
    getInvestmentOpportunities,

    // UI state
    selectedComparison,
    setSelectedComparison,

    // Loading states
    isLoadingMarketData: marketDataQuery.isPending,
    isLoadingComparables: comparablesQuery.isPending,
    isLoadingInsights: insightsQuery.isPending,
    isLoadingForecast: forecastQuery.isPending,
    isLoadingRentalTrends: rentalTrendsQuery.isPending,
    isLoadingLocationAnalysis: locationAnalysisQuery.isPending,
    isLoadingInvestmentOpportunities: investmentOpportunitiesQuery.isPending,

    // Data
    marketData: marketDataQuery.data,
    comparables: comparablesQuery.data,
    insights: insightsQuery.data,
    forecast: forecastQuery.data,
    rentalTrends: rentalTrendsQuery.data,
    locationAnalysis: locationAnalysisQuery.data,
    investmentOpportunities: investmentOpportunitiesQuery.data,

    // Errors
    marketDataError: marketDataQuery.error,
    comparablesError: comparablesQuery.error,
    insightsError: insightsQuery.error,
    forecastError: forecastQuery.error,
    rentalTrendsError: rentalTrendsQuery.error,
    locationAnalysisError: locationAnalysisQuery.error,
    investmentOpportunitiesError: investmentOpportunitiesQuery.error,
  };
}
