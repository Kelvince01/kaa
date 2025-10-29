/**
 * Main properties container with map view, search, and listings
 */
"use client";

import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import MapControls from "@/components/common/map/map-controls";
import MapStyles from "@/components/common/map/map-styles";
// Map components
import MapProvider from "@/lib/mapbox/provider";
import { usePropertyStore } from "@/modules/properties";
import type { Property } from "@/modules/properties/property.type";
import { PropertyCard } from "./components/property-card";
import { PropertyListControls } from "./components/property-list-controls";
import { PropertyMarker } from "./components/property-marker";
// Property components
import { PropertySearch } from "./components/property-search";
// Hooks and types
import { usePropertiesSearch } from "./hooks/use-properties-search";
import type { PropertySearchFilters } from "./types";

type PropertiesPageProps = {
  initialFilters?: PropertySearchFilters;
};

export default function PropertiesContainer({
  // biome-ignore lint/correctness/noUnusedFunctionParameters: ignore
  initialFilters,
}: PropertiesPageProps = {}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const { selectedProperty, setSelectedProperty } = usePropertyStore();

  const [hoveredProperty, setHoveredProperty] = useState<Property | null>(null);

  // Use the properties search hook
  const {
    properties,
    pagination,
    meta,
    isLoading,
    error,
    filters,
    viewConfig,
    viewState,
    hasActiveFilters,
    updateFilters,
    clearFilters,
    updateViewConfig,
    updateViewState,
    refetch,
    goToPage,
    nextPage,
    previousPage,
  } = usePropertiesSearch();

  // Handle property selection
  const handlePropertySelect = useCallback(
    (property: Property) => {
      setSelectedProperty(property);
      // Update map center to property location
      updateViewState({
        selectedPropertyId: property._id,
        mapCenter: property.geolocation.coordinates as [number, number],
        mapZoom: 15,
      });
    },
    [updateViewState, setSelectedProperty]
  );

  // Handle property hover
  const handlePropertyHover = useCallback(
    (property: Property | null) => {
      setHoveredProperty(property);
      updateViewState({
        hoveredPropertyId: property?._id,
      });
    },
    [updateViewState]
  );

  // Handle map bounds change
  const handleMapBoundsChange = useCallback(
    (bounds: any) => {
      // You can implement bounds-based filtering here
      updateViewState({ mapBounds: bounds });
    },
    [updateViewState]
  );

  // Render loading state
  const renderLoadingState = () => (
    <div className="space-y-4">
      {/* Loading skeleton for search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton for properties */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`skeleton-card-${i + 1}`}>
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
        We couldn't load the properties. Please try again.
      </p>
      <Button onClick={refetch} variant="outline">
        Try again
      </Button>
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 font-semibold text-gray-900 text-lg">
        No properties found
      </h3>
      <p className="mb-4 text-center text-muted-foreground">
        {hasActiveFilters
          ? "Try adjusting your filters to see more results."
          : "There are no properties available at the moment."}
      </p>
      {hasActiveFilters && (
        <Button onClick={clearFilters} variant="outline">
          Clear filters
        </Button>
      )}
    </div>
  );

  // Render properties list
  const renderPropertiesList = () => {
    if (isLoading && properties.length === 0) {
      return renderLoadingState();
    }

    if (error) {
      return renderErrorState();
    }

    if (properties.length === 0) {
      return renderEmptyState();
    }

    const gridClasses = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return (
      <div className="space-y-4">
        {viewConfig.viewMode === "grid" && (
          <div
            className={cn("grid gap-6", gridClasses[viewConfig.gridColumns])}
          >
            {properties.map((property, index) => (
              <PropertyCard
                index={index}
                isSelected={selectedProperty?._id === property._id}
                key={property._id}
                onClick={handlePropertySelect}
                onHover={handlePropertyHover}
                property={property}
                viewMode="grid"
              />
            ))}
          </div>
        )}

        {viewConfig.viewMode === "list" && (
          <div className="space-y-4">
            {properties.map((property, index) => (
              <PropertyCard
                index={index}
                isSelected={selectedProperty?._id === property._id}
                key={property._id}
                onClick={handlePropertySelect}
                onHover={handlePropertyHover}
                property={property}
                viewMode="list"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render map view
  const renderMapView = () => (
    <div className="relative h-full">
      <div
        className="absolute inset-0 h-full w-full"
        id="map-container"
        ref={mapContainerRef}
      />

      <MapProvider
        initialViewState={{
          longitude: viewState.mapCenter[0],
          latitude: viewState.mapCenter[1],
          zoom: viewState.mapZoom,
        }}
        mapContainerRef={mapContainerRef}
      >
        {/* Map controls */}
        <MapControls />
        <MapStyles />

        {/* Property markers */}
        {properties.map((property) => (
          <PropertyMarker
            isHovered={hoveredProperty?._id === property._id}
            isSelected={selectedProperty?._id === property._id}
            key={property._id}
            onClick={handlePropertySelect}
            onHover={handlePropertyHover}
            property={property}
          />
        ))}
      </MapProvider>

      {/* Map overlay with selected property */}
      {selectedProperty && viewConfig.viewMode === "map" && (
        <div className="absolute right-4 bottom-4 left-4 z-10">
          <PropertyCard
            className="mx-auto max-w-md"
            index={0}
            property={selectedProperty}
            viewMode="list"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search filters */}
      {viewConfig.showFilters && (
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-6">
            <PropertySearch
              filters={filters}
              hasActiveFilters={hasActiveFilters}
              isLoading={isLoading}
              onClearFilters={clearFilters}
              onFiltersChange={updateFilters}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="container mx-auto">
        {/* Controls toolbar */}
        <PropertyListControls
          currentPage={pagination?.page || 1}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          onClearFilters={clearFilters}
          onFiltersChange={updateFilters}
          onRefresh={refetch}
          onViewConfigChange={updateViewConfig}
          totalPages={pagination?.pages || 1}
          totalProperties={pagination?.total || 0}
          viewConfig={viewConfig}
        />

        {/* Content area */}
        <div className="flex gap-6 p-4">
          {/* Properties list */}
          {viewConfig.viewMode !== "map" && (
            <div className={cn("flex-1", viewConfig.showMap && "lg:w-3/5")}>
              {renderPropertiesList()}

              {/* Pagination would go here */}
              {pagination && pagination.pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    disabled={!pagination.hasPrevPage || isLoading}
                    onClick={previousPage}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={nextPage}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Map */}
          {(viewConfig.viewMode === "map" ||
            // TODO: fix type
            (viewConfig.showMap && viewConfig.viewMode !== ("map" as any))) && (
            <div
              className={cn(
                "overflow-hidden rounded-lg bg-white shadow-sm",
                viewConfig.viewMode === "map"
                  ? "h-[calc(100vh-200px)] flex-1"
                  : "hidden h-[600px] w-2/5 lg:block"
              )}
            >
              {renderMapView()}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && properties.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Updating results...</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
