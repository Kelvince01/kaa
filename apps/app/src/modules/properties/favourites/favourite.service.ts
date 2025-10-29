import { httpClient } from "@/lib/axios";
import type {
  AddFavouriteInput,
  BulkFavouriteOperation,
  CreateWatchListInput,
  FavouriteComparisonResponse,
  FavouriteExportOptions,
  FavouriteListResponse,
  FavouriteNotificationSettings,
  FavouriteQueryParams,
  FavouriteResponse,
  FavouriteShareOptions,
  FavouriteStatsResponse,
  FavouriteStatusResponse,
  PropertyAlert,
  PropertyRecommendation,
  RecentlyViewed,
  RemoveFavouriteInput,
  SavedSearch,
  WatchListItem,
} from "./favourite.type";

/**
 * Property Favourites service for managing user favourite properties
 */

// Add property to favorites
export const addFavourite = async (
  data: AddFavouriteInput
): Promise<FavouriteResponse> => {
  const response = await httpClient.api.post("/properties/favorites/", data);
  return response.data;
};

// Remove property from favorites
export const removeFavourite = async (
  data: RemoveFavouriteInput
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete("/properties/favorites/", {
    data,
  });
  return response.data;
};

// Toggle favourite status
export const toggleFavourite = async (
  propertyId: string
): Promise<FavouriteResponse> => {
  const response = await httpClient.api.post("/properties/favorites/toggle", {
    propertyId,
  });
  return response.data;
};

// Get user's favourite properties
export const getFavourites = async (
  params: FavouriteQueryParams = {}
): Promise<FavouriteListResponse> => {
  const response = await httpClient.api.get("/properties/favorites/", {
    params,
  });
  return response.data;
};

// Get favourite by ID
export const getFavourite = async (id: string): Promise<FavouriteResponse> => {
  const response = await httpClient.api.get(`/properties/favorites/${id}`);
  return response.data;
};

// Check if property is favourited
export const checkFavouriteStatus = async (
  propertyId: string
): Promise<FavouriteStatusResponse> => {
  const response = await httpClient.api.get(
    `/properties/favorites/status/${propertyId}`
  );
  return response.data;
};

// Get favourite statistics
export const getFavouriteStats = async (): Promise<FavouriteStatsResponse> => {
  const response = await httpClient.api.get("/properties/favorites/stats");
  return response.data;
};

// Bulk operations on favorites
export const bulkFavouriteOperation = async (
  operation: BulkFavouriteOperation
): Promise<{ affected: number; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/favorites/bulk",
    operation
  );
  return response.data;
};

// Export favorites
export const exportFavourites = async (
  options: FavouriteExportOptions
): Promise<Blob> => {
  const response = await httpClient.api.post(
    "/properties/favorites/export",
    options,
    {
      responseType: "blob",
    }
  );
  return response.data;
};

// Share favorites
export const shareFavourites = async (
  options: FavouriteShareOptions
): Promise<{ status: string; message: string; shareId?: string }> => {
  const response = await httpClient.api.post(
    "/properties/favorites/share",
    options
  );
  return response.data;
};

// Compare favourite properties
export const compareFavourites = async (
  propertyIds: string[]
): Promise<FavouriteComparisonResponse> => {
  const response = await httpClient.api.post("/properties/favorites/compare", {
    propertyIds,
  });
  return response.data;
};

// Clear all favorites
export const clearAllFavourites = async (): Promise<{
  status: string;
  message: string;
  removed: number;
}> => {
  const response = await httpClient.api.delete("/properties/favorites/clear");
  return response.data;
};

// Get property recommendations based on favorites
export const getPropertyRecommendations = async (
  limit = 10
): Promise<{ recommendations: PropertyRecommendation[]; status: string }> => {
  const response = await httpClient.api.get("/properties/recommendations", {
    params: { limit },
  });
  return response.data;
};

// Recently Viewed Properties

// Add property to recently viewed
export const addToRecentlyViewed = async (
  propertyId: string,
  viewDuration?: number
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post("/properties/recently-viewed", {
    propertyId,
    viewDuration,
  });
  return response.data;
};

// Get recently viewed properties
export const getRecentlyViewed = async (
  limit = 20
): Promise<{ items: RecentlyViewed[]; status: string }> => {
  const response = await httpClient.api.get("/properties/recently-viewed", {
    params: { limit },
  });
  return response.data;
};

// Clear recently viewed
export const clearRecentlyViewed = async (): Promise<{
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.delete("/properties/recently-viewed");
  return response.data;
};

// Remove specific item from recently viewed
export const removeFromRecentlyViewed = async (
  propertyId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/recently-viewed/${propertyId}`
  );
  return response.data;
};

// Watch Lists

// Get user's watch lists
export const getWatchLists = async (): Promise<{
  watchLists: WatchListItem[];
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/watch-lists");
  return response.data;
};

// Create watch list
export const createWatchList = async (
  data: CreateWatchListInput
): Promise<{ watchList: WatchListItem; status: string; message: string }> => {
  const response = await httpClient.api.post("/properties/watch-lists", data);
  return response.data;
};

// Update watch list
export const updateWatchList = async (
  id: string,
  data: Partial<CreateWatchListInput>
): Promise<{ watchList: WatchListItem; status: string; message: string }> => {
  const response = await httpClient.api.patch(
    `/properties/watch-lists/${id}`,
    data
  );
  return response.data;
};

// Delete watch list
export const deleteWatchList = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/watch-lists/${id}`);
  return response.data;
};

// Toggle watch list active status
export const toggleWatchListStatus = async (
  id: string
): Promise<{ watchList: WatchListItem; status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/watch-lists/${id}/toggle`
  );
  return response.data;
};

// Get watch list matches
export const getWatchListMatches = async (
  id: string
): Promise<{ matches: any[]; count: number; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/watch-lists/${id}/matches`
  );
  return response.data;
};

// Saved Searches

// Get saved searches
export const getSavedSearches = async (): Promise<{
  searches: SavedSearch[];
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/saved-searches");
  return response.data;
};

// Create saved search
export const createSavedSearch = async (data: {
  name: string;
  searchParams: FavouriteQueryParams;
  alertsEnabled?: boolean;
}): Promise<{ search: SavedSearch; status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/saved-searches",
    data
  );
  return response.data;
};

// Update saved search
export const updateSavedSearch = async (
  id: string,
  data: Partial<SavedSearch>
): Promise<{ search: SavedSearch; status: string; message: string }> => {
  const response = await httpClient.api.patch(
    `/properties/saved-searches/${id}`,
    data
  );
  return response.data;
};

// Delete saved search
export const deleteSavedSearch = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/saved-searches/${id}`
  );
  return response.data;
};

// Run saved search
export const runSavedSearch = async (
  id: string
): Promise<{ results: any[]; count: number; status: string }> => {
  const response = await httpClient.api.post(
    `/properties/saved-searches/${id}/run`
  );
  return response.data;
};

// Property Alerts

// Get property alerts
export const getPropertyAlerts = async (
  unreadOnly = false
): Promise<{ alerts: PropertyAlert[]; status: string }> => {
  const response = await httpClient.api.get("/properties/alerts", {
    params: { unreadOnly },
  });
  return response.data;
};

// Mark alert as read
export const markAlertAsRead = async (
  alertId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/alerts/${alertId}/read`
  );
  return response.data;
};

// Mark all alerts as read
export const markAllAlertsAsRead = async (): Promise<{
  status: string;
  message: string;
  markedCount: number;
}> => {
  const response = await httpClient.api.post("/properties/alerts/read-all");
  return response.data;
};

// Delete alert
export const deleteAlert = async (
  alertId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(`/properties/alerts/${alertId}`);
  return response.data;
};

// Notification Settings

// Get notification settings
export const getNotificationSettings = async (): Promise<{
  settings: FavouriteNotificationSettings;
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/favorites/notification-settings"
  );
  return response.data;
};

// Update notification settings
export const updateNotificationSettings = async (
  settings: FavouriteNotificationSettings
): Promise<{
  settings: FavouriteNotificationSettings;
  status: string;
  message: string;
}> => {
  const response = await httpClient.api.put(
    "/properties/favorites/notification-settings",
    settings
  );
  return response.data;
};

// Similar Properties

// Get similar properties to favorites
export const getSimilarToFavourites = async (
  favouriteId: string,
  limit = 5
): Promise<{ properties: any[]; status: string }> => {
  const response = await httpClient.api.get(
    `/properties/favorites/${favouriteId}/similar`,
    {
      params: { limit },
    }
  );
  return response.data;
};

// Get properties similar to user's taste
export const getPropertiesByTaste = async (
  limit = 10
): Promise<{ properties: any[]; status: string }> => {
  const response = await httpClient.api.get("/properties/by-taste", {
    params: { limit },
  });
  return response.data;
};

// Property Lists

// Create custom property list
export const createPropertyList = async (data: {
  name: string;
  description?: string;
  propertyIds: string[];
  isPrivate?: boolean;
}): Promise<{ list: any; status: string; message: string }> => {
  const response = await httpClient.api.post("/properties/lists", data);
  return response.data;
};

// Get user's property lists
export const getPropertyLists = async (): Promise<{
  lists: any[];
  status: string;
}> => {
  const response = await httpClient.api.get("/properties/lists");
  return response.data;
};

// Add property to list
export const addPropertyToList = async (
  listId: string,
  propertyId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    `/properties/lists/${listId}/properties`,
    {
      propertyId,
    }
  );
  return response.data;
};

// Remove property from list
export const removePropertyFromList = async (
  listId: string,
  propertyId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/lists/${listId}/properties/${propertyId}`
  );
  return response.data;
};

// Share property list
export const sharePropertyList = async (
  listId: string,
  shareWith: string[],
  message?: string
): Promise<{ status: string; message: string; shareId?: string }> => {
  const response = await httpClient.api.post(
    `/properties/lists/${listId}/share`,
    {
      shareWith,
      message,
    }
  );
  return response.data;
};

// Analytics and Insights

// Get favourite trends
export const getFavouriteTrends = async (
  period: "week" | "month" | "quarter" | "year" = "month"
): Promise<{ trends: any; status: string }> => {
  const response = await httpClient.api.get("/properties/favorites/trends", {
    params: { period },
  });
  return response.data;
};

// Get market insights based on favorites
export const getMarketInsights = async (): Promise<{
  insights: any;
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/favorites/market-insights"
  );
  return response.data;
};

// Get price alerts for favorites
export const getPriceAlerts = async (): Promise<{
  alerts: any[];
  status: string;
}> => {
  const response = await httpClient.api.get(
    "/properties/favorites/price-alerts"
  );
  return response.data;
};

// Set price alert for property
export const setPriceAlert = async (
  propertyId: string,
  targetPrice: number,
  alertType: "below" | "above" | "change"
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.post(
    "/properties/favorites/price-alerts",
    {
      propertyId,
      targetPrice,
      alertType,
    }
  );
  return response.data;
};

// Remove price alert
export const removePriceAlert = async (
  alertId: string
): Promise<{ status: string; message: string }> => {
  const response = await httpClient.api.delete(
    `/properties/favorites/price-alerts/${alertId}`
  );
  return response.data;
};
