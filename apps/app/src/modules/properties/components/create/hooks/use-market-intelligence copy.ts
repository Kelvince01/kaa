import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { PropertyFormData } from "../schema";

type MarketData = {
  averagePrice: number;
  priceRange: { min: number; max: number };
  demandLevel: "low" | "medium" | "high";
  seasonalAdjustment: number;
  competitorCount: number;
  averageDaysOnMarket: number;
  priceHistory: Array<{ month: string; price: number }>;
};

type PropertyComparison = {
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
};

type MarketInsight = {
  type: "pricing" | "demand" | "timing" | "features";
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
};

type DemandForecast = {
  nextMonth: number;
  nextQuarter: number;
  seasonal: {
    peak: string;
    low: string;
  };
  factors: string[];
};

// Mock market intelligence service
const mockMarketService = {
  async getMarketData(
    location: string,
    _propertyType: string
  ): Promise<MarketData> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock data based on Kenyan market
    const basePrice = location.toLowerCase().includes("nairobi")
      ? 75_000
      : 45_000;
    const variance = basePrice * 0.3;

    return {
      averagePrice: basePrice,
      priceRange: {
        min: basePrice - variance,
        max: basePrice + variance,
      },
      demandLevel:
        Math.random() > 0.6 ? "high" : Math.random() > 0.3 ? "medium" : "low",
      seasonalAdjustment: Math.random() * 0.2 - 0.1, // -10% to +10%
      competitorCount: Math.floor(Math.random() * 50) + 10,
      averageDaysOnMarket: Math.floor(Math.random() * 45) + 15,
      priceHistory: [
        { month: "Jan", price: basePrice * 0.9 },
        { month: "Feb", price: basePrice * 0.92 },
        { month: "Mar", price: basePrice * 0.95 },
        { month: "Apr", price: basePrice * 0.98 },
        { month: "May", price: basePrice },
        { month: "Jun", price: basePrice * 1.02 },
      ],
    };
  },

  async getComparableProperties(
    location: string,
    bedrooms: number,
    bathrooms: number
  ): Promise<PropertyComparison[]> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const basePrice = location.toLowerCase().includes("nairobi")
      ? 75_000
      : 45_000;

    return Array.from({ length: 8 }, (_, i) => ({
      id: `comp-${i + 1}`,
      address: `${["Kilimani", "Westlands", "Karen", "Lavington", "Kileleshwa"][i % 5]} Road, ${location}`,
      price: basePrice + (Math.random() * 20_000 - 10_000),
      bedrooms:
        bedrooms +
        (Math.random() > 0.5
          ? Math.floor(Math.random() * 2)
          : -Math.floor(Math.random() * 2)),
      bathrooms: bathrooms + (Math.random() > 0.5 ? 1 : 0),
      size: 80 + Math.floor(Math.random() * 120),
      similarity: 0.7 + Math.random() * 0.3,
      distance: Math.random() * 5,
      daysOnMarket: Math.floor(Math.random() * 60) + 5,
      photos: [`https://via.placeholder.com/300x200?text=Property+${i + 1}`],
    })).sort((a, b) => b.similarity - a.similarity);
  },

  async getMarketInsights(
    propertyData: Partial<PropertyFormData>
  ): Promise<MarketInsight[]> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const insights: MarketInsight[] = [];

    // Pricing insights
    if (propertyData.pricing?.rentAmount) {
      const isExpensive = propertyData.pricing.rentAmount > 80_000;
      insights.push({
        type: "pricing",
        title: isExpensive ? "Premium Pricing Strategy" : "Competitive Pricing",
        description: isExpensive
          ? "Your price is above market average. Consider highlighting luxury features."
          : "Your price is competitive. This should attract more inquiries.",
        impact: isExpensive ? "neutral" : "positive",
        confidence: 0.85,
      });
    }

    // Demand insights
    insights.push({
      type: "demand",
      title: "Strong Market Demand",
      description: `${propertyData.details?.bedrooms || 1}-bedroom properties are in high demand in this area.`,
      impact: "positive",
      confidence: 0.78,
    });

    // Timing insights
    const currentMonth = new Date().getMonth();
    const isPeakSeason = currentMonth >= 0 && currentMonth <= 2; // Jan-Mar
    insights.push({
      type: "timing",
      title: isPeakSeason ? "Peak Rental Season" : "Moderate Rental Activity",
      description: isPeakSeason
        ? "January to March is peak rental season. Great time to list!"
        : "Consider waiting for peak season or adjust pricing strategy.",
      impact: isPeakSeason ? "positive" : "neutral",
      confidence: 0.72,
    });

    // Feature insights
    if (
      propertyData.details?.bathrooms &&
      propertyData.details.bathrooms >= 2
    ) {
      insights.push({
        type: "features",
        title: "Multiple Bathrooms Advantage",
        description: "Properties with 2+ bathrooms rent 15% faster on average.",
        impact: "positive",
        confidence: 0.81,
      });
    }

    return insights;
  },

  async getDemandForecast(_location: string): Promise<DemandForecast> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    return {
      nextMonth: 0.75 + Math.random() * 0.25, // 75-100%
      nextQuarter: 0.6 + Math.random() * 0.4, // 60-100%
      seasonal: {
        peak: "January - March",
        low: "July - September",
      },
      factors: [
        "University semester start",
        "Corporate relocations",
        "End of year bonuses",
        "School calendar changes",
      ],
    };
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
    }) => mockMarketService.getMarketData(location, propertyType),
  });

  const comparablesQuery = useMutation({
    mutationFn: ({
      location,
      bedrooms,
      bathrooms,
    }: {
      location: string;
      bedrooms: number;
      bathrooms: number;
    }) =>
      mockMarketService.getComparableProperties(location, bedrooms, bathrooms),
  });

  const insightsQuery = useMutation({
    mutationFn: (propertyData: Partial<PropertyFormData>) =>
      mockMarketService.getMarketInsights(propertyData),
  });

  const forecastQuery = useMutation({
    mutationFn: (location: string) =>
      mockMarketService.getDemandForecast(location),
  });

  const getMarketData = useCallback(
    (location: string, propertyType: string) =>
      marketDataQuery.mutateAsync({ location, propertyType }),
    [marketDataQuery]
  );

  const getComparables = useCallback(
    (location: string, bedrooms: number, bathrooms: number) =>
      comparablesQuery.mutateAsync({ location, bedrooms, bathrooms }),
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

  return {
    getMarketData,
    getComparables,
    getInsights,
    getForecast,
    selectedComparison,
    setSelectedComparison,

    // Loading states
    isLoadingMarketData: marketDataQuery.isPending,
    isLoadingComparables: comparablesQuery.isPending,
    isLoadingInsights: insightsQuery.isPending,
    isLoadingForecast: forecastQuery.isPending,

    // Data
    marketData: marketDataQuery.data,
    comparables: comparablesQuery.data,
    insights: insightsQuery.data,
    forecast: forecastQuery.data,

    // Errors
    marketDataError: marketDataQuery.error,
    comparablesError: comparablesQuery.error,
    insightsError: insightsQuery.error,
    forecastError: forecastQuery.error,
  };
}
