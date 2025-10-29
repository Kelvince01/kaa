/**
 * Advanced property search page with comprehensive filtering
 */
"use client";

import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  Grid3x3,
  List,
  MapIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { PropertySearchParams } from "@/modules/properties/search";
import {
  PropertySearchBar,
  SavedSearchesList,
  SearchFilters,
  useEnhancedSearch,
} from "@/modules/properties/search";
import { PropertyCard } from "../components/property-card";

type ViewMode = "grid" | "list" | "map";

export default function AdvancedPropertySearch() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(true);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  const {
    searchParams,
    results,
    pagination,
    isLoading,
    error,
    updateParams,
    clearParams,
    search,
    refetch,
    trackResultClick,
    hasResults,
    hasFilters,
    totalResults,
  } = useEnhancedSearch({
    initialParams: {},
    enableAnalytics: true,
    autoSearch: true,
  });

  const handleSearch = useCallback(
    (params: PropertySearchParams) => {
      updateParams(params);
      search(params);
    },
    [updateParams, search]
  );

  const handlePropertyClick = useCallback(
    (property: any, index: number) => {
      trackResultClick(property._id, index);
      // Navigate to property detail
      window.location.href = `/properties/detail/${property._id}`;
    },
    [trackResultClick]
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={`skeleton-${i + 1}`}>
          <CardContent className="p-0">
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 font-semibold text-gray-900 text-lg">
        Something went wrong
      </h3>
      <p className="mb-4 text-center text-muted-foreground">
        We couldn't load the search results. Please try again.
      </p>
      <Button onClick={() => refetch()} variant="outline">
        Try again
      </Button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 font-semibold text-gray-900 text-lg">
        No properties found
      </h3>
      <p className="mb-4 text-center text-muted-foreground">
        {hasFilters
          ? "Try adjusting your search criteria to see more results."
          : "There are no properties available at the moment."}
      </p>
      {hasFilters && (
        <Button onClick={clearParams} variant="outline">
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="mb-4 font-bold text-2xl">
            Find Your Perfect Property
          </h1>
          <PropertySearchBar
            onSearch={handleSearch}
            placeholder="Search by location, type, or keywords..."
            size="lg"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Filters & Saved Searches */}
          <aside
            className={cn(
              "transition-all duration-300",
              showFilters ? "w-80" : "w-0 overflow-hidden"
            )}
          >
            <div className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <SearchFilters
                    filters={searchParams}
                    hasActiveFilters={hasFilters}
                    onClearFilters={clearParams}
                    onFiltersChange={updateParams}
                    variant="full"
                  />
                </CardContent>
              </Card>

              {/* Saved Searches Toggle */}
              <Button
                className="w-full"
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                variant="outline"
              >
                {showSavedSearches ? "Hide" : "Show"} Saved Searches
              </Button>

              {showSavedSearches && (
                <SavedSearchesList
                  onExecuteSearch={(filters: PropertySearchParams) => {
                    updateParams(filters);
                    search(filters);
                  }}
                />
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                  variant="outline"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>

                {hasResults && (
                  <span className="text-muted-foreground text-sm">
                    {totalResults.toLocaleString()} properties found
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-1 rounded-lg border p-1">
                <Button
                  className={cn(viewMode === "grid" && "bg-accent")}
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  variant="ghost"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  className={cn(viewMode === "list" && "bg-accent")}
                  onClick={() => setViewMode("list")}
                  size="sm"
                  variant="ghost"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  className={cn(viewMode === "map" && "bg-accent")}
                  onClick={() => setViewMode("map")}
                  size="sm"
                  variant="ghost"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            {isLoading && !hasResults && renderLoadingState()}
            {error && renderErrorState()}
            {!(isLoading || error || hasResults) && renderEmptyState()}

            {hasResults && (
              <>
                {viewMode === "grid" && (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {results.map((property, index) => (
                      <PropertyCard
                        index={index}
                        key={property._id}
                        onClick={() => handlePropertyClick(property, index)}
                        property={property}
                        viewMode="grid"
                      />
                    ))}
                  </div>
                )}

                {viewMode === "list" && (
                  <div className="space-y-4">
                    {results.map((property, index) => (
                      <PropertyCard
                        index={index}
                        key={property._id}
                        onClick={() => handlePropertyClick(property, index)}
                        property={property}
                        viewMode="list"
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      disabled={!pagination.hasPrevPage || isLoading}
                      onClick={() =>
                        updateParams({ page: (searchParams.page || 1) - 1 })
                      }
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      disabled={!pagination.hasNextPage || isLoading}
                      onClick={() =>
                        updateParams({ page: (searchParams.page || 1) + 1 })
                      }
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
