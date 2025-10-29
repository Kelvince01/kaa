"use client";

/**
 * Search analytics hook
 * Tracks search events and provides analytics data
 */

import { useCallback, useRef } from "react";
import { useTrackSearch } from "../search.queries";
import type { PropertySearchParams } from "../search.types";

type UseSearchAnalyticsOptions = {
  enabled?: boolean;
  userId?: string;
  sessionId?: string;
};

export function useSearchAnalytics(options: UseSearchAnalyticsOptions = {}) {
  const { enabled = true, userId, sessionId } = options;
  const { trackSearch } = useTrackSearch();
  const searchStartTimeRef = useRef<number>(0);

  /**
   * Start tracking a search
   * Call this when a search begins
   */
  const startSearch = useCallback(() => {
    if (enabled) {
      searchStartTimeRef.current = Date.now();
    }
  }, [enabled]);

  /**
   * Track search completion
   * Call this when search results are loaded
   */
  const trackSearchComplete = useCallback(
    async (params: {
      query?: string;
      filters?: PropertySearchParams;
      resultCount: number;
      selectedResultId?: string;
      selectedResultPosition?: number;
    }) => {
      if (!enabled) return;

      const responseTime = searchStartTimeRef.current
        ? Date.now() - searchStartTimeRef.current
        : 0;

      await trackSearch({
        query: params.query || "",
        filters: params.filters,
        resultCount: params.resultCount,
        responseTime,
        selectedResultId: params.selectedResultId,
        selectedResultPosition: params.selectedResultPosition,
      });

      // Reset start time
      searchStartTimeRef.current = 0;
    },
    [enabled, trackSearch]
  );

  /**
   * Track when a user clicks on a search result
   */
  const trackResultClick = useCallback(
    async (params: {
      query?: string;
      filters?: PropertySearchParams;
      resultCount: number;
      resultId: string;
      position: number;
    }) => {
      if (!enabled) return;

      await trackSearch({
        query: params.query || "",
        filters: params.filters,
        resultCount: params.resultCount,
        responseTime: 0,
        selectedResultId: params.resultId,
        selectedResultPosition: params.position,
      });
    },
    [enabled, trackSearch]
  );

  /**
   * Track no results
   */
  const trackNoResults = useCallback(
    async (params: { query?: string; filters?: PropertySearchParams }) => {
      if (!enabled) return;

      const responseTime = searchStartTimeRef.current
        ? Date.now() - searchStartTimeRef.current
        : 0;

      await trackSearch({
        query: params.query || "",
        filters: params.filters,
        resultCount: 0,
        responseTime,
      });

      searchStartTimeRef.current = 0;
    },
    [enabled, trackSearch]
  );

  return {
    startSearch,
    trackSearchComplete,
    trackResultClick,
    trackNoResults,
  };
}

/**
 * Hook to track search performance metrics
 */
export function useSearchPerformance() {
  const metricsRef = useRef<{
    totalSearches: number;
    averageResponseTime: number;
    failedSearches: number;
    noResultsSearches: number;
  }>({
    totalSearches: 0,
    averageResponseTime: 0,
    failedSearches: 0,
    noResultsSearches: 0,
  });

  const recordSearch = useCallback(
    (params: {
      responseTime: number;
      resultCount: number;
      failed?: boolean;
    }) => {
      const metrics = metricsRef.current;
      metrics.totalSearches += 1;

      if (params.failed) {
        metrics.failedSearches += 1;
      } else if (params.resultCount === 0) {
        metrics.noResultsSearches += 1;
      }

      // Calculate rolling average response time
      metrics.averageResponseTime =
        (metrics.averageResponseTime * (metrics.totalSearches - 1) +
          params.responseTime) /
        metrics.totalSearches;
    },
    []
  );

  const getMetrics = useCallback(() => ({ ...metricsRef.current }), []);

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      totalSearches: 0,
      averageResponseTime: 0,
      failedSearches: 0,
      noResultsSearches: 0,
    };
  }, []);

  return {
    recordSearch,
    getMetrics,
    resetMetrics,
  };
}
