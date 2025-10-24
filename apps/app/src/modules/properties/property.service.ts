import { httpClient } from "@/lib/axios";
import type {
  AddressValidationResult,
  AIRecommendation,
  FavoritesResponse,
  MarketInsights,
  NearbyAmenity,
  Property,
  PropertyAnalytics,
  PropertyComparison,
  PropertyInquiryRequest,
  PropertyListResponse,
  PropertySearchParams,
  SavedSearch,
} from "./property.type";

// Get all properties with filters
export const getProperties = async (
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get("/properties", {
    params: filters,
  });
  return response.data;
};

// Get property by ID
export const getProperty = async (id: string): Promise<Property> => {
  const response = await httpClient.api.get(`/properties/${id}`);
  return response.data.property;
};

// Get featured properties
export const getFeaturedProperties = async (): Promise<Property[]> => {
  const response = await httpClient.api.get("/properties/featured");
  return response.data.properties;
};

// Get properties by landlord
export const getPropertiesByLandlord = async (
  landlordId: string,
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get(
    `/properties/landlord/${landlordId}`,
    {
      params: filters,
    }
  );
  return response.data;
};

// Get properties by user
export const getPropertiesByUser = async (
  userId: string,
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get(`/properties/user/${userId}`, {
    params: filters,
  });
  return response.data;
};

// Get properties by organization
export const getPropertiesByOrganization = async (
  organizationId: string
): Promise<Property[]> => {
  const response = await httpClient.api.get(
    `/properties/by-organization/${organizationId}`
  );
  return response.data.properties;
};

// Create property
export const createProperty = async (
  propertyData: Partial<Property>
): Promise<Property> => {
  const response = await httpClient.api.post("/properties", propertyData);
  return response.data.property;
};

// Update property
export const updateProperty = async (
  id: string,
  propertyData: Partial<Property>
): Promise<Property> => {
  const response = await httpClient.api.patch(
    `/properties/${id}`,
    propertyData
  );
  return response.data.property;
};

// Delete property
export const deleteProperty = async (id: string): Promise<boolean> => {
  const response = await httpClient.api.delete(`/properties/${id}`);
  return response.data.property;
};

// Upload property images
export const uploadPropertyImages = async (
  id: string,
  imageUrls: string[],
  mainImageIndex = 0
): Promise<any> => {
  const response = await httpClient.api.post(`/properties/${id}/images`, {
    imageUrls,
    mainImageIndex,
  });
  return response.data.property;
};

// Update property status
export const updatePropertyStatus = async (
  id: string,
  status: string
): Promise<Property> => {
  const response = await httpClient.api.patch(`/properties/${id}/status`, {
    status,
  });
  return response.data.property;
};

// Toggle property featured status
export const togglePropertyFeatured = async (
  id: string,
  featured: boolean
): Promise<Property> => {
  const response = await httpClient.api.patch(`/properties/${id}/featured`, {
    featured,
  });
  return response.data.property;
};

// Toggle property verification
export const togglePropertyVerification = async (
  id: string,
  verified: boolean
): Promise<Property> => {
  const response = await httpClient.api.patch(`/properties/${id}/verify`, {
    verified,
  });
  return response.data.property;
};

// Get user's properties
export const getUserProperties = async (
  userId: string,
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get(`/users/${userId}/properties`, {
    params: filters,
  });
  return response.data;
};

// Get favorite properties
export const getFavoriteProperties = async (
  filters: PropertySearchParams = {}
): Promise<FavoritesResponse> => {
  const response = await httpClient.api.get("/properties/favorites", {
    params: filters,
  });
  return response.data;
};

// Toggle property favorite
export const togglePropertyFavorite = async (
  propertyId: string
): Promise<{ message: string; isFavorited: boolean }> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/favorite`,
    {}
  );
  return response.data.data;
};

// Submit property inquiry
export const submitPropertyInquiry = async (
  inquiryData: PropertyInquiryRequest
): Promise<void> => {
  const response = await httpClient.api.post(
    `/properties/${inquiryData.propertyId}/inquiries`,
    inquiryData
  );
  return response.data;
};

// Get property filters/options
export const getPropertyFilters = async (): Promise<any> => {
  const response = await httpClient.api.get("/properties/filters");
  return response.data;
};

// Search properties
export const searchProperties = async (
  query: string,
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get("/properties/search", {
    params: { query, ...filters },
  });
  return response.data;
};

// Get nearby properties
export const getNearbyProperties = async (
  lat: number,
  lng: number,
  radius = 5,
  filters: PropertySearchParams = {}
): Promise<PropertyListResponse> => {
  const response = await httpClient.api.get("/properties/nearby", {
    params: { lat, lng, radius, ...filters },
  });
  return response.data;
};

// =============================================================================
// AI-POWERED SERVICES
// =============================================================================

// Get AI-powered property recommendations
export const getAIRecommendations = async (
  userId: string,
  limit = 10
): Promise<AIRecommendation[]> => {
  const response = await httpClient.api.get(
    `/ai/recommendations/properties/${userId}`,
    {
      params: { limit },
    }
  );
  return response.data.recommendations;
};

// =============================================================================
// ENHANCED LOCATION SERVICES
// =============================================================================

// Get nearby amenities
export const getNearbyAmenities = async (
  lat: number,
  lng: number,
  radius = 2000
): Promise<NearbyAmenity[]> => {
  const response = await httpClient.api.get("/properties/nearby-amenities", {
    params: { lat, lng, radius },
  });
  return response.data.amenities;
};

// Validate address with geocoding
export const validateAddress = async (
  address: any
): Promise<AddressValidationResult> => {
  const response = await httpClient.api.post(
    "/properties/validate-address",
    address
  );
  return response.data;
};

// Get location-based market insights
export const getLocationMarketInsights = async (
  lat: number,
  lng: number,
  radius = 5000
): Promise<MarketInsights> => {
  const response = await httpClient.api.get("/properties/location-insights", {
    params: { lat, lng, radius },
  });
  return response.data.insights;
};

// =============================================================================
// PROPERTY ANALYTICS
// =============================================================================

// Get property analytics
export const getPropertyAnalytics = async (
  propertyId: string
): Promise<PropertyAnalytics> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/analytics`
  );
  return response.data.analytics;
};

// Get market insights for a location
export const getMarketInsights = async (
  location: string
): Promise<MarketInsights> => {
  const response = await httpClient.api.get("/properties/market-insights", {
    params: { location },
  });
  return response.data.insights;
};

// Get property performance comparison
export const getPropertyPerformanceComparison = async (
  propertyIds: string[]
): Promise<PropertyComparison> => {
  const response = await httpClient.api.post(
    "/properties/compare-performance",
    {
      propertyIds,
    }
  );
  return response.data.comparison;
};

// =============================================================================
// ADVANCED SEARCH & FILTERING
// =============================================================================

// Save search criteria
export const saveSearch = async (
  name: string,
  filters: PropertySearchParams,
  notifications = false
): Promise<SavedSearch> => {
  const response = await httpClient.api.post("/properties/saved-searches", {
    name,
    filters,
    notifications,
  });
  return response.data.savedSearch;
};

// Get user's saved searches
export const getSavedSearches = async (): Promise<SavedSearch[]> => {
  const response = await httpClient.api.get("/properties/saved-searches");
  return response.data.savedSearches;
};

// Delete saved search
export const deleteSavedSearch = async (searchId: string): Promise<boolean> => {
  const response = await httpClient.api.delete(
    `/properties/saved-searches/${searchId}`
  );
  return response.data.success;
};

// Get search suggestions
export const getSearchSuggestions = async (
  query: string
): Promise<string[]> => {
  const response = await httpClient.api.get("/properties/search-suggestions", {
    params: { query },
  });
  return response.data.suggestions;
};

// =============================================================================
// PROPERTY COMPARISON
// =============================================================================

// Compare properties side by side
export const compareProperties = async (
  propertyIds: string[]
): Promise<PropertyComparison> => {
  const response = await httpClient.api.post("/properties/compare", {
    propertyIds,
  });
  return response.data.comparison;
};

// Get property comparison template
export const getComparisonTemplate = async (): Promise<{
  fields: Array<{ key: string; label: string; type: string }>;
}> => {
  const response = await httpClient.api.get("/properties/compare-template");
  return response.data;
};

// =============================================================================
// VIRTUAL TOUR & MEDIA
// =============================================================================

// Upload virtual tour
export const uploadVirtualTour = async (
  propertyId: string,
  tourData: any
): Promise<{ tourUrl: string }> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/virtual-tour`,
    tourData
  );
  return response.data;
};

// Get virtual tour
export const getVirtualTour_v1 = async (propertyId: string): Promise<any> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/virtual-tour`
  );
  return response.data.tour;
};

// =============================================================================
// SMART NOTIFICATIONS
// =============================================================================

// Subscribe to property alerts
export const subscribeToPropertyAlerts = async (
  propertyId: string,
  alertTypes: string[]
): Promise<boolean> => {
  const response = await httpClient.api.post(
    `/properties/${propertyId}/alerts`,
    {
      alertTypes,
    }
  );
  return response.data.success;
};

// Get property alerts
export const getPropertyAlerts = async (propertyId: string): Promise<any[]> => {
  const response = await httpClient.api.get(`/properties/${propertyId}/alerts`);
  return response.data.alerts;
};

// =============================================================================
// MARKET ANALYSIS
// =============================================================================

// Get investment analysis
export const getInvestmentAnalysis = async (
  propertyId: string
): Promise<{
  roi: number;
  paybackPeriod: number;
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/investment-analysis`
  );
  return response.data.analysis;
};

// Get rental yield analysis
export const getRentalYieldAnalysis = async (
  propertyId: string
): Promise<{
  grossYield: number;
  netYield: number;
  expenses: any[];
  projections: any[];
}> => {
  const response = await httpClient.api.get(
    `/properties/${propertyId}/rental-yield`
  );
  return response.data.analysis;
};
