/**
 * Property search React Query hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import * as searchService from "./search.service";
import type {
  AdvancedSearchParams,
  CreateSavedSearchPayload,
  NearbySearchParams,
  PropertySearchParams,
  UpdateSavedSearchPayload,
} from "./search.types";

// Query keys for caching
export const searchKeys = {
  all: ["properties", "search"] as const,
  lists: () => [...searchKeys.all, "list"] as const,
  list: (params: PropertySearchParams) =>
    [...searchKeys.lists(), params] as const,
  advanced: (params: AdvancedSearchParams) =>
    [...searchKeys.all, "advanced", params] as const,
  nearby: (params: NearbySearchParams) =>
    [...searchKeys.all, "nearby", params] as const,
  suggestions: (query: string) =>
    [...searchKeys.all, "suggestions", query] as const,
  popular: () => [...searchKeys.all, "popular"] as const,
  saved: () => [...searchKeys.all, "saved"] as const,
  savedDetail: (id: string) => [...searchKeys.saved(), id] as const,
  alerts: () => [...searchKeys.all, "alerts"] as const,
  history: () => [...searchKeys.all, "history"] as const,
  filters: () => [...searchKeys.all, "filters"] as const,
};

// ============= BASIC SEARCH =============

/**
 * Hook for basic property search
 */
export const usePropertySearch = (
  params: PropertySearchParams,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: searchKeys.list(params),
    queryFn: () => searchService.searchProperties(params),
    enabled,
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Hook for advanced property search with Typesense
 */
export const useAdvancedPropertySearch = (
  params: AdvancedSearchParams,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: searchKeys.advanced(params),
    queryFn: () => searchService.advancedSearchProperties(params),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
  });

/**
 * Hook for nearby property search
 */
export const useNearbyPropertySearch = (
  params: NearbySearchParams,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: searchKeys.nearby(params),
    queryFn: () => searchService.searchNearbyProperties(params),
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60, // 1 minute
  });

// ============= SEARCH SUGGESTIONS =============

/**
 * Hook for search suggestions/autocomplete
 */
export const useSearchSuggestions = (
  query: string,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => searchService.getSearchSuggestions(query),
    enabled: (options.enabled ?? true) && query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Hook for popular searches
 */
export const usePopularSearches = () =>
  useQuery({
    queryKey: searchKeys.popular(),
    queryFn: searchService.getPopularSearches,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

// ============= SAVED SEARCHES =============

/**
 * Hook for getting saved searches
 */
export const useSavedSearches = () =>
  useQuery({
    queryKey: searchKeys.saved(),
    queryFn: searchService.getSavedSearches,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Hook for creating a saved search
 */
export const useCreateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSavedSearchPayload) =>
      searchService.createSavedSearch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.saved() });
    },
  });
};

/**
 * Hook for updating a saved search
 */
export const useUpdateSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSavedSearchPayload;
    }) => searchService.updateSavedSearch(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: searchKeys.saved() });
      queryClient.invalidateQueries({
        queryKey: searchKeys.savedDetail(variables.id),
      });
    },
  });
};

/**
 * Hook for deleting a saved search
 */
export const useDeleteSavedSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => searchService.deleteSavedSearch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.saved() });
    },
  });
};

/**
 * Hook for executing a saved search
 */
export const useExecuteSavedSearch = (
  id: string,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: searchKeys.savedDetail(id),
    queryFn: () => searchService.executeSavedSearch(id),
    enabled: options.enabled ?? true,
  });

/**
 * Hook for getting new properties from saved search
 */
export const useNewPropertiesForSavedSearch = (
  id: string,
  options: { enabled?: boolean } = {}
) =>
  useQuery({
    queryKey: [...searchKeys.savedDetail(id), "new"],
    queryFn: () => searchService.getNewPropertiesForSavedSearch(id),
    enabled: options.enabled ?? true,
  });

// ============= SEARCH ALERTS =============

/**
 * Hook for getting search alerts
 */
export const useSearchAlerts = () =>
  useQuery({
    queryKey: searchKeys.alerts(),
    queryFn: searchService.getSearchAlerts,
    staleTime: 1000 * 60, // 1 minute
  });

/**
 * Hook for marking alert as viewed
 */
export const useMarkAlertAsViewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => searchService.markAlertAsViewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.alerts() });
    },
  });
};

// ============= SEARCH ANALYTICS =============

/**
 * Hook for tracking search events
 */
export const useTrackSearch = () => {
  const trackSearch = useCallback(
    async (payload: {
      query: string;
      filters?: PropertySearchParams;
      resultCount: number;
      responseTime: number;
      selectedResultId?: string;
      selectedResultPosition?: number;
    }) => {
      await searchService.trackSearchEvent(payload);
    },
    []
  );

  return { trackSearch };
};

/**
 * Hook for getting search history
 */
export const useSearchHistory = (limit = 10) =>
  useQuery({
    queryKey: [...searchKeys.history(), limit],
    queryFn: () => searchService.getSearchHistory(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Hook for clearing search history
 */
export const useClearSearchHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: searchService.clearSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: searchKeys.history() });
    },
  });
};

// ============= SEARCH FILTERS =============

/**
 * Hook for getting search filter options
 */
export const useSearchFilterOptions = () =>
  useQuery({
    queryKey: searchKeys.filters(),
    queryFn: searchService.getSearchFilterOptions,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

/**
 * Hook for validating search parameters
 */
export const useValidateSearchParams = () =>
  useMutation({
    mutationFn: (params: PropertySearchParams) =>
      searchService.validateSearchParams(params),
  });
