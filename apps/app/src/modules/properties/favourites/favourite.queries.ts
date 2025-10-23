import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as favouriteService from "./favourite.service";
import type {
  CreateWatchListInput,
  FavouriteQueryParams,
  SavedSearch,
} from "./favourite.type";

/**
 * Property Favourite query keys for consistent cache management
 */
export const favouriteKeys = {
  all: ["favourites"] as const,
  lists: () => [...favouriteKeys.all, "list"] as const,
  list: (params: FavouriteQueryParams) =>
    [...favouriteKeys.lists(), params] as const,
  details: () => [...favouriteKeys.all, "detail"] as const,
  detail: (id: string) => [...favouriteKeys.details(), id] as const,
  stats: () => [...favouriteKeys.all, "stats"] as const,
  status: (propertyId: string) =>
    [...favouriteKeys.all, "status", propertyId] as const,
  recommendations: () => [...favouriteKeys.all, "recommendations"] as const,
  recentlyViewed: () => [...favouriteKeys.all, "recently-viewed"] as const,
  watchLists: () => [...favouriteKeys.all, "watch-lists"] as const,
  watchList: (id: string) => [...favouriteKeys.watchLists(), id] as const,
  watchListMatches: (id: string) =>
    [...favouriteKeys.watchList(id), "matches"] as const,
  savedSearches: () => [...favouriteKeys.all, "saved-searches"] as const,
  savedSearch: (id: string) => [...favouriteKeys.savedSearches(), id] as const,
  alerts: () => [...favouriteKeys.all, "alerts"] as const,
  notificationSettings: () =>
    [...favouriteKeys.all, "notification-settings"] as const,
  similarProperties: (favouriteId: string) =>
    [...favouriteKeys.all, "similar", favouriteId] as const,
  propertiesByTaste: () => [...favouriteKeys.all, "by-taste"] as const,
  propertyLists: () => [...favouriteKeys.all, "property-lists"] as const,
  trends: (period: string) => [...favouriteKeys.all, "trends", period] as const,
  marketInsights: () => [...favouriteKeys.all, "market-insights"] as const,
  priceAlerts: () => [...favouriteKeys.all, "price-alerts"] as const,
};

/**
 * Query Hooks - for fetching data
 */

// Get user's favourite properties
export const useFavourites = (params: FavouriteQueryParams = {}) => {
  return useQuery({
    queryKey: favouriteKeys.list(params),
    queryFn: () => favouriteService.getFavourites(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get favourite by ID
export const useFavourite = (id: string) =>
  useQuery({
    queryKey: favouriteKeys.detail(id),
    queryFn: () => favouriteService.getFavourite(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

// Check if property is favourited
export const useFavouriteStatus = (propertyId: string) => {
  return useQuery({
    queryKey: favouriteKeys.status(propertyId),
    queryFn: () => favouriteService.checkFavouriteStatus(propertyId),
    enabled: !!propertyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get favourite statistics
export const useFavouriteStats = () =>
  useQuery({
    queryKey: favouriteKeys.stats(),
    queryFn: favouriteService.getFavouriteStats,
    staleTime: 5 * 60 * 1000,
  });

// Get property recommendations
export const usePropertyRecommendations = (limit = 10) => {
  return useQuery({
    queryKey: favouriteKeys.recommendations(),
    queryFn: () => favouriteService.getPropertyRecommendations(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get recently viewed properties
export const useRecentlyViewed = (limit = 20) =>
  useQuery({
    queryKey: favouriteKeys.recentlyViewed(),
    queryFn: () => favouriteService.getRecentlyViewed(limit),
    staleTime: 5 * 60 * 1000,
  });

// Get watch lists
export const useWatchLists = () =>
  useQuery({
    queryKey: favouriteKeys.watchLists(),
    queryFn: favouriteService.getWatchLists,
    staleTime: 5 * 60 * 1000,
  });

// Get watch list matches
export const useWatchListMatches = (id: string) =>
  useQuery({
    queryKey: favouriteKeys.watchListMatches(id),
    queryFn: () => favouriteService.getWatchListMatches(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

// Get saved searches
export const useSavedSearches = () =>
  useQuery({
    queryKey: favouriteKeys.savedSearches(),
    queryFn: favouriteService.getSavedSearches,
    staleTime: 5 * 60 * 1000,
  });

// Get property alerts
export const usePropertyAlerts = (unreadOnly = false) => {
  return useQuery({
    queryKey: favouriteKeys.alerts(),
    queryFn: () => favouriteService.getPropertyAlerts(unreadOnly),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Get notification settings
export const useNotificationSettings = () =>
  useQuery({
    queryKey: favouriteKeys.notificationSettings(),
    queryFn: favouriteService.getNotificationSettings,
    staleTime: 10 * 60 * 1000,
  });

// Get similar properties to favourite
export const useSimilarToFavourites = (favouriteId: string, limit = 5) =>
  useQuery({
    queryKey: favouriteKeys.similarProperties(favouriteId),
    queryFn: () => favouriteService.getSimilarToFavourites(favouriteId, limit),
    enabled: !!favouriteId,
    staleTime: 10 * 60 * 1000,
  });

// Get properties by taste
export const usePropertiesByTaste = (limit = 10) =>
  useQuery({
    queryKey: favouriteKeys.propertiesByTaste(),
    queryFn: () => favouriteService.getPropertiesByTaste(limit),
    staleTime: 10 * 60 * 1000,
  });

// Get property lists
export const usePropertyLists = () =>
  useQuery({
    queryKey: favouriteKeys.propertyLists(),
    queryFn: favouriteService.getPropertyLists,
    staleTime: 5 * 60 * 1000,
  });

// Get favourite trends
export const useFavouriteTrends = (
  period: "week" | "month" | "quarter" | "year" = "month"
) => {
  return useQuery({
    queryKey: favouriteKeys.trends(period),
    queryFn: () => favouriteService.getFavouriteTrends(period),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get market insights
export const useMarketInsights = () => {
  return useQuery({
    queryKey: favouriteKeys.marketInsights(),
    queryFn: favouriteService.getMarketInsights,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Get price alerts
export const usePriceAlerts = () =>
  useQuery({
    queryKey: favouriteKeys.priceAlerts(),
    queryFn: favouriteService.getPriceAlerts,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Mutation Hooks - for modifying data
 */

// Add favourite
export const useAddFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.addFavourite,
    onSuccess: (data, variables) => {
      // Invalidate favourites list
      queryClient.invalidateQueries({ queryKey: favouriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favouriteKeys.stats() });

      // Update property favourite status
      queryClient.setQueryData(favouriteKeys.status(variables.propertyId), {
        isFavourite: true,
        favouriteId: data.favourite?._id || data.data?._id,
        addedAt: new Date().toISOString(),
        status: "success",
      });

      // Invalidate recommendations as they might change
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recommendations(),
      });
    },
  });
};

// Remove favourite
export const useRemoveFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.removeFavourite,
    onSuccess: (_, variables) => {
      // Invalidate favourites list
      queryClient.invalidateQueries({ queryKey: favouriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favouriteKeys.stats() });

      // Update property favourite status
      queryClient.setQueryData(favouriteKeys.status(variables.propertyId), {
        isFavourite: false,
        status: "success",
      });

      // Invalidate recommendations
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recommendations(),
      });
    },
  });
};

// Toggle favourite
export const useToggleFavourite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.toggleFavourite,
    onSuccess: (_, variables) => {
      // Invalidate favourites list
      queryClient.invalidateQueries({ queryKey: favouriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favouriteKeys.stats() });

      // Update property favourite status
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.status(variables),
      });

      // Invalidate recommendations
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recommendations(),
      });
    },
  });
};

// Bulk favourite operations
export const useBulkFavouriteOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.bulkFavouriteOperation,
    onSuccess: () => {
      // Invalidate all favourite-related queries
      queryClient.invalidateQueries({ queryKey: favouriteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: favouriteKeys.stats() });
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recommendations(),
      });

      // Invalidate all status queries
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.all,
        predicate: (query) => query.queryKey.includes("status"),
      });
    },
  });
};

// Clear all favourites
export const useClearAllFavourites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.clearAllFavourites,
    onSuccess: () => {
      // Clear all favourite-related data
      queryClient.removeQueries({ queryKey: favouriteKeys.lists() });
      queryClient.removeQueries({ queryKey: favouriteKeys.stats() });
      queryClient.removeQueries({ queryKey: favouriteKeys.recommendations() });

      // Clear all status queries
      queryClient.removeQueries({
        queryKey: favouriteKeys.all,
        predicate: (query) => query.queryKey.includes("status"),
      });
    },
  });
};

// Export favourites
export const useExportFavourites = () =>
  useMutation({
    mutationFn: favouriteService.exportFavourites,
  });

// Share favourites
export const useShareFavourites = () =>
  useMutation({
    mutationFn: favouriteService.shareFavourites,
  });

// Compare favourites
export const useCompareFavourites = () =>
  useMutation({
    mutationFn: favouriteService.compareFavourites,
  });

// Recently Viewed mutations

// Add to recently viewed
export const useAddToRecentlyViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      viewDuration,
    }: {
      propertyId: string;
      viewDuration?: number;
    }) => favouriteService.addToRecentlyViewed(propertyId, viewDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recentlyViewed(),
      });
    },
  });
};

// Clear recently viewed
export const useClearRecentlyViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.clearRecentlyViewed,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: favouriteKeys.recentlyViewed() });
    },
  });
};

// Remove from recently viewed
export const useRemoveFromRecentlyViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.removeFromRecentlyViewed,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.recentlyViewed(),
      });
    },
  });
};

// Watch List mutations

// Create watch list
export const useCreateWatchList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.createWatchList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.watchLists() });
    },
  });
};

// Update watch list
export const useUpdateWatchList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateWatchListInput>;
    }) => favouriteService.updateWatchList(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.watchLists() });
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.watchList(variables.id),
      });
    },
  });
};

// Delete watch list
export const useDeleteWatchList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.deleteWatchList,
    onSuccess: (_, watchListId) => {
      queryClient.removeQueries({
        queryKey: favouriteKeys.watchList(watchListId),
      });
      queryClient.invalidateQueries({ queryKey: favouriteKeys.watchLists() });
    },
  });
};

// Toggle watch list status
export const useToggleWatchListStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.toggleWatchListStatus,
    onSuccess: (_, watchListId) => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.watchLists() });
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.watchList(watchListId),
      });
    },
  });
};

// Saved Search mutations

// Create saved search
export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.createSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.savedSearches(),
      });
    },
  });
};

// Update saved search
export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavedSearch> }) =>
      favouriteService.updateSavedSearch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.savedSearches(),
      });
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.savedSearch(variables.id),
      });
    },
  });
};

// Delete saved search
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.deleteSavedSearch,
    onSuccess: (_, searchId) => {
      queryClient.removeQueries({
        queryKey: favouriteKeys.savedSearch(searchId),
      });
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.savedSearches(),
      });
    },
  });
};

// Run saved search
export const useRunSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.runSavedSearch,
    onSuccess: (_, searchId) => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.savedSearch(searchId),
      });
    },
  });
};

// Alert mutations

// Mark alert as read
export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.markAlertAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.alerts() });
    },
  });
};

// Mark all alerts as read
export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.markAllAlertsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.alerts() });
    },
  });
};

// Delete alert
export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.alerts() });
    },
  });
};

// Update notification settings
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.updateNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(favouriteKeys.notificationSettings(), data);
    },
  });
};

// Property List mutations

// Create property list
export const useCreatePropertyList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.createPropertyList,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.propertyLists(),
      });
    },
  });
};

// Add property to list
export const useAddPropertyToList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      propertyId,
    }: {
      listId: string;
      propertyId: string;
    }) => favouriteService.addPropertyToList(listId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.propertyLists(),
      });
    },
  });
};

// Remove property from list
export const useRemovePropertyFromList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      propertyId,
    }: {
      listId: string;
      propertyId: string;
    }) => favouriteService.removePropertyFromList(listId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: favouriteKeys.propertyLists(),
      });
    },
  });
};

// Share property list
export const useSharePropertyList = () =>
  useMutation({
    mutationFn: ({
      listId,
      shareWith,
      message,
    }: {
      listId: string;
      shareWith: string[];
      message?: string;
    }) => favouriteService.sharePropertyList(listId, shareWith, message),
  });

// Price Alert mutations

// Set price alert
export const useSetPriceAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      propertyId,
      targetPrice,
      alertType,
    }: {
      propertyId: string;
      targetPrice: number;
      alertType: "below" | "above" | "change";
    }) => favouriteService.setPriceAlert(propertyId, targetPrice, alertType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.priceAlerts() });
    },
  });
};

// Remove price alert
export const useRemovePriceAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: favouriteService.removePriceAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouriteKeys.priceAlerts() });
    },
  });
};

/**
 * Utility functions for cache management
 */

// Prefetch favourite
export const usePrefetchFavourite = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: favouriteKeys.detail(id),
      queryFn: () => favouriteService.getFavourite(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Invalidate all favourite queries
export const useInvalidateFavourites = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: favouriteKeys.all });
  };
};

// Optimistic favourite toggle
export const useOptimisticFavouriteToggle = () => {
  const queryClient = useQueryClient();

  return (propertyId: string) => {
    const previousStatus = queryClient.getQueryData(
      favouriteKeys.status(propertyId)
    );

    // Optimistically update
    queryClient.setQueryData(favouriteKeys.status(propertyId), (old: any) => ({
      ...old,
      isFavourite: !old?.isFavourite,
    }));

    return () => {
      // Rollback function
      queryClient.setQueryData(
        favouriteKeys.status(propertyId),
        previousStatus
      );
    };
  };
};
