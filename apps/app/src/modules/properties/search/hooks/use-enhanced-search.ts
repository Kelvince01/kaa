"use client";

/**
 * Enhanced search hook with analytics and state management
 * Combines search functionality with analytics tracking
 */

import { useCallback, useEffect, useState } from "react";
import { usePropertySearch } from "../search.queries";
import type { PropertySearchParams } from "../search.types";
import { useSearchAnalytics } from "./use-search-analytics";

type UseEnhancedSearchOptions = {
  initialParams?: PropertySearchParams;
  enableAnalytics?: boolean;
  autoSearch?: boolean;
};

export function useEnhancedSearch(options: UseEnhancedSearchOptions = {}) {
  const {
    initialParams = {},
    enableAnalytics = true,
    autoSearch = true,
  } = options;

  const [searchParams, setSearchParams] =
    useState<PropertySearchParams>(initialParams);
  const [isSearching, setIsSearching] = useState(false);

  const analytics = useSearchAnalytics({ enabled: enableAnalytics });

  // Perform search query
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = usePropertySearch(searchParams, {
    enabled: autoSearch,
  });

  // Track search start
  useEffect(() => {
    if (isLoading && !isSearching) {
      setIsSearching(true);
      analytics.startSearch();
    }
  }, [isLoading, isSearching, analytics]);

  // Track search completion
  useEffect(() => {
    if (!isLoading && isSearching && searchResults) {
      setIsSearching(false);
      analytics.trackSearchComplete({
        query: searchParams.query,
        filters: searchParams,
        resultCount: searchResults.pagination?.total || 0,
      });
    }
  }, [isLoading, isSearching, searchResults, searchParams, analytics]);

  // Track no results
  useEffect(() => {
    if (!isLoading && searchResults && searchResults.pagination?.total === 0) {
      analytics.trackNoResults({
        query: searchParams.query,
        filters: searchParams,
      });
    }
  }, [isLoading, searchResults, searchParams, analytics]);

  /**
   * Update search parameters
   */
  const updateParams = useCallback(
    (newParams: Partial<PropertySearchParams>) => {
      setSearchParams((prev) => ({
        ...prev,
        ...newParams,
        // Reset pagination when filters change
        page: newParams.page !== undefined ? newParams.page : 1,
      }));
    },
    []
  );

  /**
   * Clear all filters
   */
  const clearParams = useCallback(() => {
    setSearchParams({});
  }, []);

  /**
   * Perform search manually
   */
  const search = useCallback(
    (params?: PropertySearchParams) => {
      if (params) {
        setSearchParams(params);
      }
      refetch();
    },
    [refetch]
  );

  /**
   * Track result click
   */
  const trackResultClick = useCallback(
    (resultId: string, position: number) => {
      analytics.trackResultClick({
        query: searchParams.query,
        filters: searchParams,
        resultCount: searchResults?.pagination?.total || 0,
        resultId,
        position,
      });
    },
    [analytics, searchParams, searchResults]
  );

  return {
    // Search state
    searchParams,
    results: searchResults?.properties || [],
    pagination: searchResults?.pagination,
    metadata: searchResults?.metadata,
    isLoading,
    error,

    // Search actions
    updateParams,
    clearParams,
    search,
    refetch,

    // Analytics
    trackResultClick,

    // Computed state
    hasResults: (searchResults?.properties?.length || 0) > 0,
    hasFilters: Object.keys(searchParams).length > 0,
    totalResults: searchResults?.pagination?.total || 0,
  };
}
