"use client";

import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Grid3x3,
  Heart,
  List,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  useClearAllFavourites,
  useFavouriteStats,
  useFavouriteStore,
  useFavourites,
  useRemoveFavourite,
} from "@/modules/properties/favourites";
import { FavouriteGridView } from "./grid-view";
import { FavouriteListView } from "./list-view";
import { FavouriteStatsCard } from "./stats-card";

/**
 * Favourites page component - displays user's saved properties
 */
const Favourites = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Get store state and actions
  const {
    filters,
    viewPreferences,
    selectedFavourites,
    setSearchTerm: updateSearchTerm,
    setViewMode,
    setSortBy,
    setSortOrder,
    clearFilters,
    clearSelectedFavourites,
    getQueryParams,
  } = useFavouriteStore();

  // Get favourites data
  const queryParams = getQueryParams();
  const { data: favoritesData, isLoading: favoritesLoading } =
    useFavourites(queryParams);
  const { data: statsData, isLoading: statsLoading } = useFavouriteStats();

  // Mutations
  const removeFavourite = useRemoveFavourite();
  const clearAllFavourites = useClearAllFavourites();

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateSearchTerm(value);
  };

  // Handle clear all
  const handleClearAll = async () => {
    // User confirmation needed for destructive action
    // biome-ignore lint/suspicious/noAlert: ignore
    if (window.confirm("Are you sure you want to remove all favourites?")) {
      try {
        await clearAllFavourites.mutateAsync();
        toast.success("All favourites cleared");
      } catch (error) {
        toast.error("Failed to clear favourites");
      }
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedFavourites.length === 0) {
      toast.error("No favourites selected");
      return;
    }

    // User confirmation needed for destructive action
    if (
      // biome-ignore lint/suspicious/noAlert: ignore
      window.confirm(`Remove ${selectedFavourites.length} selected favourites?`)
    ) {
      try {
        for (const propertyId of selectedFavourites) {
          await removeFavourite.mutateAsync({ propertyId });
        }
        clearSelectedFavourites();
        toast.success("Selected favourites removed");
      } catch (error) {
        toast.error("Failed to remove some favourites");
      }
    }
  };

  const favorites = favoritesData?.data?.favorites || [];
  const stats = statsData?.stats;
  const pagination = favoritesData?.data?.pagination || {
    page: 1,
    limit: 10,
    total: favorites.length,
    pages: Math.ceil(favorites.length / 10),
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 font-bold text-3xl text-gray-900">
                <Heart className="h-8 w-8 text-red-500" />
                Favourite Properties
              </h1>
              <p className="mt-2 text-gray-600">
                Manage and organize your saved properties
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {new Array(4).fill(null).map((_, i) => (
              <Skeleton
                className="h-24"
                key={`stat-skeleton-${i.toString()}`}
              />
            ))}
          </div>
        ) : stats ? (
          <FavouriteStatsCard stats={stats} />
        ) : null}

        {/* Search and Filters Bar */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search favourites..."
                type="text"
                value={searchTerm}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-md border">
                <Button
                  className="rounded-r-none rounded-l-md"
                  onClick={() => setViewMode("grid")}
                  size="sm"
                  type="button"
                  variant={
                    viewPreferences.viewMode === "grid" ? "default" : "ghost"
                  }
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  className="rounded-r-md rounded-l-none"
                  onClick={() => setViewMode("list")}
                  size="sm"
                  type="button"
                  variant={
                    viewPreferences.viewMode === "list" ? "default" : "ghost"
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort By */}
              <Select
                onValueChange={(value) => setSortBy(value as any)}
                value={filters.sortBy}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Recently Added</SelectItem>
                  <SelectItem value="propertyTitle">Property Name</SelectItem>
                  <SelectItem value="propertyPrice">Price</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                onClick={() =>
                  setSortOrder(filters.sortOrder === "asc" ? "desc" : "asc")
                }
                size="sm"
                type="button"
                variant="outline"
              >
                {filters.sortOrder === "asc" ? "↑" : "↓"}
              </Button>

              {/* Clear Filters */}
              <Button
                onClick={clearFilters}
                size="sm"
                type="button"
                variant="outline"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedFavourites.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-md bg-primary-50 p-3">
              <span className="font-medium text-primary-900 text-sm">
                {selectedFavourites.length} selected
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Selected
                </Button>
                <Button
                  onClick={clearSelectedFavourites}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Favourites List/Grid */}
        {favoritesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {new Array(6).fill(null).map((_, i) => (
              <Skeleton
                className="h-64"
                key={`favourite-skeleton-${i.toString()}`}
              />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <Heart className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 font-semibold text-gray-900 text-lg">
              No favourites yet
            </h3>
            <p className="mt-2 text-gray-600">
              Start exploring properties and save your favorites to see them
              here
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push("/properties")}
              type="button"
            >
              Browse Properties
            </Button>
          </div>
        ) : (
          <>
            {viewPreferences.viewMode === "grid" ? (
              <FavouriteGridView favorites={favorites} />
            ) : (
              <FavouriteListView favourites={favorites} />
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  disabled={pagination.page === 1}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-gray-600 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  disabled={pagination.page === pagination.pages}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        {favorites.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              onClick={handleClearAll}
              size="sm"
              type="button"
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourites;
