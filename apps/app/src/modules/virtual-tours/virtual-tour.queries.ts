/**
 * Virtual Tours Queries using TanStack Query
 */

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import {
  calculatePropertyTaxes,
  getAccessibilityReport,
  getAdvancedServicesHealth,
  getCollaborationSession,
  getCountyMarketData,
  getFinancingOptions,
  getPopularTours,
  getRealTimeMetrics,
  getServiceCapabilities,
  getTourAnalytics,
  getTourEmbedCode,
  getTourRecommendations,
  getUSSDHealth,
  getUSSDStats,
  getUserTours,
  getVirtualTour,
  getVirtualTours,
  getVirtualToursHealth,
  searchTours,
} from "./virtual-tour.service";
import type {
  MLAnalytics,
  TourAnalytics,
  TourListResponse,
  VirtualTour,
  VirtualTourCapabilities,
} from "./virtual-tour.type";

// Core tour queries
export const useVirtualTours = (
  propertyId: string,
  filters?: { status?: string; type?: string },
  options?: UseQueryOptions<TourListResponse>
) => {
  return useQuery({
    queryKey: ["virtual-tours", propertyId, filters],
    queryFn: () => getVirtualTours(propertyId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useVirtualTour = (
  tourId: string,
  options?: UseQueryOptions<VirtualTour>
) => {
  return useQuery({
    queryKey: ["virtual-tour", tourId],
    queryFn: () => getVirtualTour(tourId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!tourId,
    ...options,
  });
};

// Analytics queries
export const useTourAnalytics = (
  tourId: string,
  includeMl = false,
  options?: UseQueryOptions<TourAnalytics | MLAnalytics>
) => {
  return useQuery({
    queryKey: ["tour-analytics", tourId, includeMl],
    queryFn: () => getTourAnalytics(tourId, includeMl),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!tourId,
    ...options,
  });
};

export const useRealTimeMetrics = (
  tourId: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["real-time-metrics", tourId],
    queryFn: () => getRealTimeMetrics(tourId),
    refetchInterval: 30_000, // 30 seconds
    enabled: !!tourId,
    ...options,
  });
};

// Service capabilities and health
export const useServiceCapabilities = (
  options?: UseQueryOptions<VirtualTourCapabilities>
) => {
  return useQuery({
    queryKey: ["service-capabilities"],
    queryFn: () => getServiceCapabilities(),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const useAdvancedServicesHealth = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: ["advanced-services-health"],
    queryFn: () => getAdvancedServicesHealth(),
    refetchInterval: 60_000, // 1 minute
    ...options,
  });
};

export const useVirtualToursHealth = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: ["virtual-tours-health"],
    queryFn: () => getVirtualToursHealth(),
    refetchInterval: 30_000, // 30 seconds
    ...options,
  });
};

// Search and discovery
export const useSearchTours = (
  query: string,
  filters?: {
    propertyType?: string;
    county?: string;
    status?: string;
    type?: string;
  },
  options?: UseQueryOptions<VirtualTour[]>
) => {
  return useQuery({
    queryKey: ["search-tours", query, filters],
    queryFn: () => searchTours(query, filters),
    enabled: !!query && query.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const usePopularTours = (
  limit = 10,
  options?: UseQueryOptions<VirtualTour[]>
) => {
  return useQuery({
    queryKey: ["popular-tours", limit],
    queryFn: () => getPopularTours(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useUserTours = (
  userId: string,
  options?: UseQueryOptions<VirtualTour[]>
) => {
  return useQuery({
    queryKey: ["user-tours", userId],
    queryFn: () => getUserTours(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Collaboration queries
export const useCollaborationSession = (
  sessionId: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["collaboration-session", sessionId],
    queryFn: () => getCollaborationSession(sessionId),
    enabled: !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Kenya-specific queries
export const usePropertyTaxes = (
  propertyValue: number,
  isResident: boolean,
  purpose: "investment" | "personal",
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["property-taxes", propertyValue, isResident, purpose],
    queryFn: () => calculatePropertyTaxes(propertyValue, isResident, purpose),
    enabled: propertyValue > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

export const useFinancingOptions = (
  propertyValue: number,
  userProfile?: any,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["financing-options", propertyValue, userProfile],
    queryFn: () => getFinancingOptions(propertyValue, userProfile),
    enabled: propertyValue > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

export const useCountyMarketData = (
  county: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["county-market-data", county],
    queryFn: () => getCountyMarketData(county),
    enabled: !!county,
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// Advanced feature queries
export const useAccessibilityReport = (
  tourId: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: ["accessibility-report", tourId],
    queryFn: () => getAccessibilityReport(tourId),
    enabled: !!tourId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
};

export const useTourRecommendations = (
  tourId: string,
  preferences?: any,
  options?: UseQueryOptions<VirtualTour[]>
) => {
  return useQuery({
    queryKey: ["tour-recommendations", tourId, preferences],
    queryFn: () => getTourRecommendations(tourId, preferences),
    enabled: !!tourId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    ...options,
  });
};

export const useTourEmbedCode = (
  tourId: string,
  embedOptions?: any,
  options?: UseQueryOptions<string>
) => {
  return useQuery({
    queryKey: ["tour-embed-code", tourId, embedOptions],
    queryFn: () => getTourEmbedCode(tourId, embedOptions),
    enabled: !!tourId,
    staleTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
};

// Communication service queries
export const useUSSDStats = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: ["ussd-stats"],
    queryFn: () => getUSSDStats(),
    refetchInterval: 60_000, // 1 minute
    ...options,
  });
};

export const useUSSDHealth = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: ["ussd-health"],
    queryFn: () => getUSSDHealth(),
    refetchInterval: 30_000, // 30 seconds
    ...options,
  });
};
