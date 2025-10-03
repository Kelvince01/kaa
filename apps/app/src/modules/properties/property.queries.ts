import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as propertyService from "./property.service";
import {
  analyzePropertyImages,
  // New comparison services
  compareProperties,
  createProperty,
  deleteProperty,
  deleteSavedSearch,
  generatePropertyDescription,
  getAIPricingSuggestions,
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
  // New search services
  saveSearch,
  searchProperties,
  submitPropertyInquiry,
  // New notification services
  subscribeToPropertyAlerts,
  updateProperty,
  uploadPropertyImages,
  // New virtual tour services
  uploadVirtualTour,
  validateAddress,
} from "./property.service";
import type { Property, PropertySearchParams } from "./property.type";

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

// Create property mutation
export const useCreateProperty = () => {
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Update property mutation
export const useUpdateProperty = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) =>
      updateProperty(id, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Delete property mutation
export const useDeleteProperty = () => {
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Upload property images mutation
export const useUploadPropertyImages = () => {
  return useMutation({
    mutationFn: ({
      id,
      imageUrls,
      mainImageIndex,
    }: {
      id: string;
      imageUrls: string[];
      mainImageIndex?: number;
    }) => uploadPropertyImages(id, imageUrls, mainImageIndex || 0),
    onSuccess: (_, variables) => {
      // Invalidate and refetch property
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

// Update property status mutation
export const useUpdatePropertyStatus = () => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      propertyService.updatePropertyStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
    },
  });
};

// Toggle property featured mutation
export const useTogglePropertyFeatured = () => {
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      propertyService.togglePropertyFeatured(id, featured),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Toggle property verification mutation
export const useTogglePropertyVerification = () => {
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      propertyService.togglePropertyVerification(id, verified),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
    },
  });
};

// Toggle property favorite mutation
export const useTogglePropertyFavorite = () => {
  return useMutation({
    mutationFn: propertyService.togglePropertyFavorite,
    onSuccess: () => {
      // Invalidate and refetch favorites and properties
      queryClient.invalidateQueries({ queryKey: ["properties", "favorites"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

// Submit property inquiry mutation
export const useSubmitPropertyInquiry = () =>
  useMutation({
    mutationFn: submitPropertyInquiry,
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

// Generate property description
export const useGeneratePropertyDescription = () =>
  useMutation({
    mutationFn: generatePropertyDescription,
  });

// Analyze property images
export const useAnalyzePropertyImages = () =>
  useMutation({
    mutationFn: analyzePropertyImages,
  });

// Get AI pricing suggestions
export const useAIPricingSuggestions = () =>
  useMutation({
    mutationFn: getAIPricingSuggestions,
  });

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

// Validate address
export const useValidateAddress = () =>
  useMutation({
    mutationFn: validateAddress,
  });

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

// Save search
export const useSaveSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      filters,
      notifications,
    }: {
      name: string;
      filters: PropertySearchParams;
      notifications: boolean;
    }) => saveSearch(name, filters, notifications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });
};

// Delete saved search
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
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

// Upload virtual tour
export const useUploadVirtualTour = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      tourData,
    }: {
      propertyId: string;
      tourData: any;
    }) => uploadVirtualTour(propertyId, tourData),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ["virtual-tour", propertyId] });
    },
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

// Subscribe to property alerts
export const useSubscribeToPropertyAlerts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      alertTypes,
    }: {
      propertyId: string;
      alertTypes: string[];
    }) => subscribeToPropertyAlerts(propertyId, alertTypes),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: ["property-alerts", propertyId],
      });
    },
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
