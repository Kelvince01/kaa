import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as propertyService from "./property.service";
import {
  // New comparison services
  compareProperties,
  // New AI services
  getAIRecommendations,
  getComparisonTemplate,
  getFavoriteProperties,
  getFeaturedProperties,
  // New market analysis services
  getInvestmentAnalysis,
  getLocationMarketInsights,
  getMarketInsights,
  // New location services
  getNearbyAmenities,
  getNearbyProperties,
  getProperties,
  getPropertiesByLandlord,
  getPropertiesByOrganization,
  getPropertiesByUser,
  getProperty,
  getPropertyAlerts,
  // New analytics services
  getPropertyAnalytics,
  getPropertyPerformanceComparison,
  getRentalYieldAnalysis,
  getSavedSearches,
  getSearchSuggestions,
  getUserProperties,
  getVirtualTour_v1,
  searchProperties,
} from "./property.service";
import type { PropertySearchParams } from "./property.type";

// Get all properties with filters
export const useProperties = (
  filters: PropertySearchParams = {},
  extra: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: ["properties", filters],
    queryFn: () => getProperties(filters),
    enabled: extra.enabled ?? true,
  });

// Get property by ID
export const useProperty = (id: string) =>
  useQuery({
    queryKey: ["properties", id],
    queryFn: () => getProperty(id),
    enabled: !!id,
  });

// Get featured properties
export const useFeaturedProperties = () =>
  useQuery({
    queryKey: ["properties", "featured"],
    queryFn: getFeaturedProperties,
  });

// Get properties by landlord
export const usePropertiesByLandlord = (
  landlordId: string,
  filters: PropertySearchParams = {}
) =>
  useQuery({
    queryKey: ["properties", "landlord", landlordId, filters],
    queryFn: () => getPropertiesByLandlord(landlordId, filters),
    enabled: !!landlordId,
  });

// Get properties by user
export const usePropertiesByUser = (
  userId: string,
  filters: PropertySearchParams = {}
) =>
  useQuery({
    queryKey: ["properties", "user", userId, filters],
    queryFn: () => getPropertiesByUser(userId, filters),
    enabled: !!userId,
  });

// Get properties by organization
export const usePropertiesByOrganization = (organizationId: string) =>
  useQuery({
    queryKey: ["properties", "organization", organizationId],
    queryFn: () => getPropertiesByOrganization(organizationId),
    enabled: !!organizationId,
  });

// Get user's properties
export const useUserProperties = (
  userId: string,
  filters: PropertySearchParams = {}
) =>
  useQuery({
    queryKey: ["properties", "user", userId, filters],
    queryFn: () => getUserProperties(userId, filters),
    enabled: !!userId,
  });

// Get favorite properties
export const useFavoriteProperties = (filters: PropertySearchParams = {}) =>
  useQuery({
    queryKey: ["properties", "favorites", filters],
    queryFn: () => getFavoriteProperties(filters),
  });

// Get property filters/options
export const usePropertyFilters = () =>
  useQuery({
    queryKey: ["properties", "filters"],
    queryFn: propertyService.getPropertyFilters,
  });

// Search properties
export const useSearchProperties = (
  query: string,
  filters: PropertySearchParams = {},
  extra: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: ["properties", "search", query, filters],
    queryFn: () => searchProperties(query, filters),
    enabled: !!query && extra.enabled,
  });

export const usePropertySearch = (
  query: string,
  filters: PropertySearchParams = {}
) =>
  useInfiniteQuery({
    queryKey: ["properties", "search", query],
    queryFn: () => propertyService.searchProperties(query, filters),
    getNextPageParam: (lastPage) => {
      if (
        lastPage.pagination &&
        lastPage.pagination.page < lastPage.pagination.pages
      ) {
        return lastPage.pagination.page + 1;
      }
      return;
    },
    initialPageParam: 1,
  });

// Get nearby properties
export const useNearbyProperties = (
  lat: number,
  lng: number,
  radius = 5,
  filters: PropertySearchParams = {},
  extra: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: ["properties", "nearby", lat, lng, radius, filters],
    queryFn: () => getNearbyProperties(lat, lng, radius, filters),
    enabled: !!lat && !!lng && extra.enabled,
  });

// =============================================================================
// AI-POWERED QUERIES
// =============================================================================

// Get AI recommendations
export const useAIRecommendations = (userId: string, limit = 10) => {
  return useQuery({
    queryKey: ["ai-recommendations", userId, limit],
    queryFn: () => getAIRecommendations(userId, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// =============================================================================
// ENHANCED LOCATION QUERIES
// =============================================================================

// Get nearby amenities
export const useNearbyAmenities = (
  lat: number,
  lng: number,
  radius = 2000,
  enabled = true
) => {
  return useQuery({
    queryKey: ["nearby-amenities", lat, lng, radius],
    queryFn: () => getNearbyAmenities(lat, lng, radius),
    enabled: enabled && !!lat && !!lng,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get location market insights
export const useLocationMarketInsights = (
  lat: number,
  lng: number,
  radius = 5000,
  enabled = true
) => {
  return useQuery({
    queryKey: ["location-market-insights", lat, lng, radius],
    queryFn: () => getLocationMarketInsights(lat, lng, radius),
    enabled: enabled && !!lat && !!lng,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// =============================================================================
// PROPERTY ANALYTICS QUERIES
// =============================================================================

// Get property analytics
export const usePropertyAnalytics = (propertyId: string, enabled = true) => {
  return useQuery({
    queryKey: ["property-analytics", propertyId],
    queryFn: () => getPropertyAnalytics(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get market insights
export const useMarketInsights = (location: string, enabled = true) => {
  return useQuery({
    queryKey: ["market-insights", location],
    queryFn: () => getMarketInsights(location),
    enabled: enabled && !!location,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get property performance comparison
export const usePropertyPerformanceComparison = (propertyIds: string[]) => {
  return useQuery({
    queryKey: ["property-performance-comparison", propertyIds],
    queryFn: () => getPropertyPerformanceComparison(propertyIds),
    enabled: propertyIds.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// =============================================================================
// ADVANCED SEARCH QUERIES
// =============================================================================

// Get saved searches
export const useSavedSearches = () => {
  return useQuery({
    queryKey: ["saved-searches"],
    queryFn: getSavedSearches,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get search suggestions
export const useSearchSuggestions = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => getSearchSuggestions(query),
    enabled: enabled && query.length > 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// =============================================================================
// PROPERTY COMPARISON QUERIES
// =============================================================================

// Compare properties
export const useCompareProperties = (propertyIds: string[]) => {
  return useQuery({
    queryKey: ["property-comparison", propertyIds],
    queryFn: () => compareProperties(propertyIds),
    enabled: propertyIds.length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get comparison template
export const useComparisonTemplate = () => {
  return useQuery({
    queryKey: ["comparison-template"],
    queryFn: getComparisonTemplate,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// =============================================================================
// VIRTUAL TOUR QUERIES
// =============================================================================

// Get virtual tour
export const useVirtualTour_v1 = (propertyId: string, enabled = true) => {
  return useQuery({
    queryKey: ["virtual-tour", propertyId],
    queryFn: () => getVirtualTour_v1(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// =============================================================================
// NOTIFICATION QUERIES
// =============================================================================

// Get property alerts
export const usePropertyAlerts = (propertyId: string, enabled = true) => {
  return useQuery({
    queryKey: ["property-alerts", propertyId],
    queryFn: () => getPropertyAlerts(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// =============================================================================
// MARKET ANALYSIS QUERIES
// =============================================================================

// Get investment analysis
export const useInvestmentAnalysis = (propertyId: string, enabled = true) => {
  return useQuery({
    queryKey: ["investment-analysis", propertyId],
    queryFn: () => getInvestmentAnalysis(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get rental yield analysis
export const useRentalYieldAnalysis = (propertyId: string, enabled = true) => {
  return useQuery({
    queryKey: ["rental-yield-analysis", propertyId],
    queryFn: () => getRentalYieldAnalysis(propertyId),
    enabled: enabled && !!propertyId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
