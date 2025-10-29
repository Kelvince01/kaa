/**
 * Property search service
 * Provides API functions for searching properties
 */

import { httpClient } from "@/lib/axios";
import type {
  AdvancedSearchParams,
  CreateSavedSearchPayload,
  NearbySearchParams,
  PropertySearchParams,
  PropertySearchResponse,
  SavedSearch,
  SearchAlert,
  SearchResponse,
  SearchSuggestion,
  UpdateSavedSearchPayload,
} from "./search.types";

/**
 * Basic property search
 * GET /properties/search
 */
export const searchProperties = async (
  params: PropertySearchParams
): Promise<PropertySearchResponse> => {
  const response = await httpClient.api.get("/properties/search/", {
    params,
  });
  return response.data;
};

/**
 * Advanced property search with Typesense
 * GET /advanced-search/properties
 */
export const advancedSearchProperties = async (
  params: AdvancedSearchParams
): Promise<SearchResponse<any>> => {
  const response = await httpClient.api.get("/advanced-search/properties", {
    params,
  });
  return response.data;
};

/**
 * Search nearby properties
 * GET /properties/search/nearby
 */
export const searchNearbyProperties = async (
  params: NearbySearchParams
): Promise<SearchResponse<any>> => {
  const response = await httpClient.api.get("/properties/search/nearby", {
    params,
  });
  return response.data;
};

/**
 * Get search suggestions/autocomplete
 * GET /properties/search/suggestions
 */
export const getSearchSuggestions = async (
  query: string
): Promise<{ success: boolean; data: SearchSuggestion[] }> => {
  const response = await httpClient.api.get("/properties/search/suggestions", {
    params: { q: query },
  });
  return response.data;
};

/**
 * Get popular searches
 * GET /properties/search/popular
 */
export const getPopularSearches = async (): Promise<{
  success: boolean;
  data: Array<{ query: string; count: number }>;
}> => {
  const response = await httpClient.api.get("/properties/search/popular");
  return response.data;
};

// ============= SAVED SEARCHES =============

/**
 * Get user's saved searches
 * GET /properties/search/saved
 */
export const getSavedSearches = async (): Promise<{
  success: boolean;
  data: SavedSearch[];
}> => {
  const response = await httpClient.api.get("/properties/search/saved");
  return response.data;
};

/**
 * Create a saved search
 * POST /properties/search/saved
 */
export const createSavedSearch = async (
  payload: CreateSavedSearchPayload
): Promise<{ success: boolean; data: SavedSearch; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/search/saved",
    payload
  );
  return response.data;
};

/**
 * Update a saved search
 * PATCH /properties/search/saved/:id
 */
export const updateSavedSearch = async (
  id: string,
  payload: UpdateSavedSearchPayload
): Promise<{ success: boolean; data: SavedSearch; message: string }> => {
  const response = await httpClient.api.patch(
    `/properties/search/saved/${id}`,
    payload
  );
  return response.data;
};

/**
 * Delete a saved search
 * DELETE /properties/search/saved/:id
 */
export const deleteSavedSearch = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/search/saved/${id}`
  );
  return response.data;
};

/**
 * Execute a saved search
 * GET /properties/search/saved/:id/execute
 */
export const executeSavedSearch = async (
  id: string
): Promise<SearchResponse<any>> => {
  const response = await httpClient.api.get(
    `/properties/search/saved/${id}/execute`
  );
  return response.data;
};

/**
 * Get new properties matching saved search
 * GET /properties/search/saved/:id/new
 */
export const getNewPropertiesForSavedSearch = async (
  id: string
): Promise<{ success: boolean; data: any[]; count: number }> => {
  const response = await httpClient.api.get(
    `/properties/search/saved/${id}/new`
  );
  return response.data;
};

// ============= SEARCH ALERTS =============

/**
 * Get search alerts
 * GET /properties/search/alerts
 */
export const getSearchAlerts = async (): Promise<{
  success: boolean;
  data: SearchAlert[];
}> => {
  const response = await httpClient.api.get("/properties/search/alerts");
  return response.data;
};

/**
 * Mark alert as viewed
 * PATCH /properties/search/alerts/:id/view
 */
export const markAlertAsViewed = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const response = await httpClient.api.patch(
    `/properties/search/alerts/${id}/view`
  );
  return response.data;
};

// ============= SEARCH ANALYTICS =============

/**
 * Track search event
 * POST /properties/search/analytics/track
 */
export const trackSearchEvent = async (payload: {
  query: string;
  filters?: PropertySearchParams;
  resultCount: number;
  responseTime: number;
  selectedResultId?: string;
  selectedResultPosition?: number;
}): Promise<{ success: boolean }> => {
  try {
    await httpClient.api.post("/properties/search/analytics/track", payload);
    return { success: true };
  } catch (error) {
    // Don't throw errors for analytics tracking
    return { success: false };
  }
};

/**
 * Get user search history
 * GET /properties/search/history
 */
export const getSearchHistory = async (
  limit = 10
): Promise<{
  success: boolean;
  data: Array<{
    query: string;
    filters?: PropertySearchParams;
    timestamp: string;
  }>;
}> => {
  const response = await httpClient.api.get("/properties/search/history", {
    params: { limit },
  });
  return response.data;
};

/**
 * Clear search history
 * DELETE /properties/search/history
 */
export const clearSearchHistory = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await httpClient.api.delete("/properties/search/history");
  return response.data;
};

// ============= SEARCH FILTERS =============

/**
 * Get available search filter options
 * GET /properties/search/filters
 */
export const getSearchFilterOptions = async (): Promise<{
  success: boolean;
  data: {
    propertyTypes: Array<{ value: string; label: string; count: number }>;
    priceRanges: Array<{ min?: number; max?: number; label: string }>;
    locations: Array<{ value: string; label: string; count: number }>;
    features: Array<{ value: string; label: string; count: number }>;
  };
}> => {
  const response = await httpClient.api.get("/properties/search/filters");
  return response.data;
};

/**
 * Validate search parameters
 * POST /properties/search/validate
 */
export const validateSearchParams = async (
  params: PropertySearchParams
): Promise<{
  success: boolean;
  valid: boolean;
  errors?: Array<{ field: string; message: string }>;
}> => {
  const response = await httpClient.api.post(
    "/properties/search/validate",
    params
  );
  return response.data;
};
