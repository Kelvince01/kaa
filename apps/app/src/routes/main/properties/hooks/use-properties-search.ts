/**
 * Properties search and view state management
 */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useNearbyProperties,
  useProperties,
  useSearchProperties,
} from "@/modules/properties/property.queries";
import type { PropertyType } from "@/modules/properties/property.type";
import type {
  PropertyListViewConfig,
  PropertySearchFilters,
  PropertyViewState,
} from "../types";

const DEFAULT_FILTERS: PropertySearchFilters = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const DEFAULT_VIEW_CONFIG: PropertyListViewConfig = {
  viewMode: "grid",
  showMap: true,
  mapHeight: 400,
  gridColumns: 3,
  showFilters: true,
};

const DEFAULT_VIEW_STATE: PropertyViewState = {
  mapCenter: [36.8219, -1.2921], // Nairobi coordinates
  mapZoom: 10,
};

export function usePropertiesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse URL search params to filters
  const filtersFromUrl = useMemo(() => {
    const params: PropertySearchFilters = { ...DEFAULT_FILTERS };

    const query = searchParams.get("q");
    const location = searchParams.get("location");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const type = searchParams.get("type");
    const minBedrooms = searchParams.get("minBedrooms");
    const maxBedrooms = searchParams.get("maxBedrooms");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");

    if (query) params.query = query;
    if (location) params.location = location;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (type) params.type = type;
    if (minBedrooms) params.minBedrooms = Number(minBedrooms);
    if (maxBedrooms) params.maxBedrooms = Number(maxBedrooms);
    if (sortBy) params.sortBy = sortBy as PropertySearchFilters["sortBy"];
    if (sortOrder)
      params.sortOrder = sortOrder as PropertySearchFilters["sortOrder"];
    if (page) params.page = Number(page);
    if (limit) params.limit = Number(limit);

    return params;
  }, [searchParams]);

  const [filters, setFilters] = useState<PropertySearchFilters>(filtersFromUrl);
  const [viewConfig, setViewConfig] =
    useState<PropertyListViewConfig>(DEFAULT_VIEW_CONFIG);
  const [viewState, setViewState] =
    useState<PropertyViewState>(DEFAULT_VIEW_STATE);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(filtersFromUrl);
  }, [filtersFromUrl]);

  // Query properties based on search type
  const shouldUseNearbySearch =
    filters.coordinates &&
    filters.coordinates[0] !== 0 &&
    filters.coordinates[1] !== 0;
  const shouldUseTextSearch = filters.query && filters.query.trim().length > 0;

  const {
    data: generalPropertiesData,
    isLoading: isLoadingGeneral,
    error: generalError,
    refetch: refetchGeneral,
  } = useProperties(
    {
      ...filters,
      type: filters.type as PropertyType,
      coordinates: filters.coordinates
        ? {
            latitude: filters.coordinates[1],
            longitude: filters.coordinates[0],
          }
        : undefined,
      furnished: filters.furnished ? "fully_furnished" : "unfurnished",
    },
    {
      enabled: !(shouldUseNearbySearch || shouldUseTextSearch),
    }
  );

  const {
    data: nearbyPropertiesData,
    isLoading: isLoadingNearby,
    error: nearbyError,
    refetch: refetchNearby,
  } = useNearbyProperties(
    filters.coordinates?.[1] || 0, // latitude
    filters.coordinates?.[0] || 0, // longitude
    filters.radius || 5,
    {
      ...filters,
      type: filters.type as PropertyType,
      coordinates: filters.coordinates
        ? {
            latitude: filters.coordinates[1],
            longitude: filters.coordinates[0],
          }
        : undefined,
      furnished: filters.furnished ? "fully_furnished" : "unfurnished",
    },
    {
      enabled: shouldUseNearbySearch,
    }
  );

  const {
    data: searchPropertiesData,
    isLoading: isLoadingSearch,
    error: searchError,
    refetch: refetchSearch,
  } = useSearchProperties(
    filters.query || "",
    {
      ...filters,
      type: filters.type as PropertyType,
      coordinates: filters.coordinates
        ? {
            latitude: filters.coordinates[1],
            longitude: filters.coordinates[0],
          }
        : undefined,
      furnished: filters.furnished ? "fully_furnished" : "unfurnished",
    },
    {
      enabled: !!shouldUseTextSearch,
    }
  );

  // Determine which data to use
  const propertiesData = shouldUseNearbySearch
    ? nearbyPropertiesData
    : shouldUseTextSearch
      ? searchPropertiesData
      : generalPropertiesData;

  const isLoading = isLoadingGeneral || isLoadingNearby || isLoadingSearch;
  const error = generalError || nearbyError || searchError;

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: PropertySearchFilters) => {
      const params = new URLSearchParams();

      if (newFilters.query) params.set("q", newFilters.query);
      if (newFilters.location) params.set("location", newFilters.location);
      if (newFilters.minPrice)
        params.set("minPrice", newFilters.minPrice.toString());
      if (newFilters.maxPrice)
        params.set("maxPrice", newFilters.maxPrice.toString());
      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.minBedrooms)
        params.set("minBedrooms", newFilters.minBedrooms.toString());
      if (newFilters.maxBedrooms)
        params.set("maxBedrooms", newFilters.maxBedrooms.toString());
      if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);
      if (newFilters.sortOrder) params.set("sortOrder", newFilters.sortOrder);
      if (newFilters.page && newFilters.page !== 1)
        params.set("page", newFilters.page.toString());
      if (newFilters.limit && newFilters.limit !== 20)
        params.set("limit", newFilters.limit.toString());

      const queryString = params.toString();
      const url = queryString ? `/properties?${queryString}` : "/properties";

      router.push(url, { scroll: false });
    },
    [router]
  );

  // Filter update functions
  const updateFilters = useCallback(
    (newFilters: Partial<PropertySearchFilters>) => {
      const updated = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 on filter change
      setFilters(updated);
      updateUrl(updated);
    },
    [filters, updateUrl]
  );

  const clearFilters = useCallback(() => {
    const cleared = { ...DEFAULT_FILTERS };
    setFilters(cleared);
    updateUrl(cleared);
  }, [updateUrl]);

  const updateViewConfig = useCallback(
    (config: Partial<PropertyListViewConfig>) => {
      setViewConfig((prev) => ({ ...prev, ...config }));
    },
    []
  );

  const updateViewState = useCallback((state: Partial<PropertyViewState>) => {
    setViewState((prev) => ({ ...prev, ...state }));
  }, []);

  // Pagination functions
  const goToPage = useCallback(
    (page: number) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  const nextPage = useCallback(() => {
    if (propertiesData?.pagination.hasNextPage) {
      goToPage((filters.page || 1) + 1);
    }
  }, [propertiesData?.pagination.hasNextPage, filters.page, goToPage]);

  const previousPage = useCallback(() => {
    if (propertiesData?.pagination.hasPrevPage) {
      goToPage((filters.page || 1) - 1);
    }
  }, [propertiesData?.pagination.hasPrevPage, filters.page, goToPage]);

  // Refetch function
  const refetch = useCallback(() => {
    if (shouldUseNearbySearch) {
      refetchNearby();
    } else if (shouldUseTextSearch) {
      refetchSearch();
    } else {
      refetchGeneral();
    }
  }, [
    shouldUseNearbySearch,
    shouldUseTextSearch,
    refetchNearby,
    refetchSearch,
    refetchGeneral,
  ]);

  // Calculate some derived state
  const properties = propertiesData?.properties || [];
  const pagination = propertiesData?.pagination;
  const meta = propertiesData?.meta;

  const hasActiveFilters = useMemo(
    () =>
      !!(
        filters.query ||
        filters.location ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.type ||
        filters.minBedrooms ||
        filters.maxBedrooms ||
        filters.features?.length ||
        filters.amenities?.length ||
        filters.furnished !== undefined ||
        filters.petsAllowed !== undefined
      ),
    [filters]
  );

  return {
    // Data
    properties,
    pagination,
    meta,
    isLoading,
    error,

    // State
    filters,
    viewConfig,
    viewState,
    hasActiveFilters,

    // Actions
    updateFilters,
    clearFilters,
    updateViewConfig,
    updateViewState,
    refetch,

    // Pagination
    goToPage,
    nextPage,
    previousPage,

    // Search type flags
    isNearbySearch: shouldUseNearbySearch,
    isTextSearch: shouldUseTextSearch,
  };
}
