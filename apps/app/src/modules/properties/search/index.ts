/**
 * Property search module
 * Comprehensive search functionality for properties
 */

// Export components
export { default as PropertySearchBar } from "./components/property-search-bar";
export { default as SavedSearchesList } from "./components/saved-searches-list";
export { default as SearchFilters } from "./components/search-filters";
export { default as SearchSuggestions } from "./components/search-suggestions";
export { useEnhancedSearch } from "./hooks/use-enhanced-search";
// Export analytics hooks
export {
  useSearchAnalytics,
  useSearchPerformance,
} from "./hooks/use-search-analytics";
// Export hooks
export {
  searchKeys,
  useAdvancedPropertySearch,
  useClearSearchHistory,
  useCreateSavedSearch,
  useDeleteSavedSearch,
  useExecuteSavedSearch,
  useMarkAlertAsViewed,
  useNearbyPropertySearch,
  useNewPropertiesForSavedSearch,
  usePopularSearches,
  usePropertySearch,
  useSavedSearches,
  useSearchAlerts,
  useSearchFilterOptions,
  useSearchHistory,
  useSearchSuggestions,
  useTrackSearch,
  useUpdateSavedSearch,
  useValidateSearchParams,
} from "./search.queries";
// Export service functions
export {
  advancedSearchProperties,
  clearSearchHistory,
  createSavedSearch,
  deleteSavedSearch,
  executeSavedSearch,
  getNewPropertiesForSavedSearch,
  getPopularSearches,
  getSavedSearches,
  getSearchAlerts,
  getSearchFilterOptions,
  getSearchHistory,
  getSearchSuggestions,
  markAlertAsViewed,
  searchNearbyProperties,
  searchProperties,
  trackSearchEvent,
  updateSavedSearch,
  validateSearchParams,
} from "./search.service";
// Export types
export type {
  AdvancedSearchParams,
  CreateSavedSearchPayload,
  NearbySearchParams,
  PropertySearchParams,
  PropertyType,
  SavedSearch,
  SearchAlert,
  SearchAnalyticsEvent,
  SearchFilterOptions,
  SearchMetadata,
  SearchResponse,
  SearchState,
  SearchSuggestion,
  SortBy,
  SortOrder,
  UpdateSavedSearchPayload,
} from "./search.types";
