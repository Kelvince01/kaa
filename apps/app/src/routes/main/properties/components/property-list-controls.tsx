/**
 * Property list view controls and toolbar
 */
"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { ToggleGroup, ToggleGroupItem } from "@kaa/ui/components/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@kaa/ui/components/tooltip";
import { cn } from "@kaa/ui/lib/utils";
import {
  Bookmark,
  Download,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  MapPin,
  RefreshCw,
  SortAsc,
  SortDesc,
} from "lucide-react";
import type { PropertyListViewConfig, PropertySearchFilters } from "../types";

type PropertyListControlsProps = {
  // Data
  totalProperties: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  hasActiveFilters: boolean;

  // Filters
  filters: PropertySearchFilters;
  onFiltersChange: (filters: Partial<PropertySearchFilters>) => void;
  onClearFilters: () => void;

  // View config
  viewConfig: PropertyListViewConfig;
  onViewConfigChange: (config: Partial<PropertyListViewConfig>) => void;

  // Actions
  onRefresh?: () => void;
  onSaveSearch?: () => void;
  onExport?: () => void;
};

const SORT_OPTIONS = [
  { value: "createdAt", label: "Latest" },
  { value: "price", label: "Price" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "size", label: "Size" },
  { value: "distance", label: "Distance" },
];

const GRID_COLUMNS_OPTIONS = [
  { value: 1, label: "1 Column" },
  { value: 2, label: "2 Columns" },
  { value: 3, label: "3 Columns" },
  { value: 4, label: "4 Columns" },
];

export function PropertyListControls({
  totalProperties,
  currentPage,
  totalPages,
  isLoading,
  hasActiveFilters,
  filters,
  onFiltersChange,
  onClearFilters,
  viewConfig,
  onViewConfigChange,
  onRefresh,
  onSaveSearch,
  onExport,
}: PropertyListControlsProps) {
  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ sortBy: sortBy as PropertySearchFilters["sortBy"] });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
    });
  };

  const handleViewModeChange = (viewMode: string) => {
    if (viewMode) {
      onViewConfigChange({
        viewMode: viewMode as PropertyListViewConfig["viewMode"],
      });
    }
  };

  const handleGridColumnsChange = (columns: string) => {
    onViewConfigChange({
      gridColumns: Number.parseInt(
        columns,
        10
      ) as PropertyListViewConfig["gridColumns"],
    });
  };

  const handleMapToggle = () => {
    onViewConfigChange({
      showMap: !viewConfig.showMap,
    });
  };

  const handleFiltersToggle = () => {
    onViewConfigChange({
      showFilters: !viewConfig.showFilters,
    });
  };

  const getSortLabel = () => {
    const option = SORT_OPTIONS.find((opt) => opt.value === filters.sortBy);
    return option?.label || "Sort";
  };

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left section - Results info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {totalProperties.toLocaleString()} properties
            </span>
            {hasActiveFilters && (
              <Badge className="text-xs" variant="secondary">
                Filtered
              </Badge>
            )}
          </div>

          {totalPages > 1 && (
            <div className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Center section - View controls */}
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <ToggleGroup
            className="border"
            onValueChange={handleViewModeChange}
            type="single"
            value={viewConfig.viewMode}
          >
            <ToggleGroupItem size="sm" value="grid">
              <Grid3X3 className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="list">
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </ToggleGroupItem>
            <ToggleGroupItem size="sm" value="map">
              <MapPin className="h-4 w-4" />
              <span className="sr-only">Map view</span>
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Grid columns (only for grid view) */}
          {viewConfig.viewMode === "grid" && (
            <Select
              onValueChange={handleGridColumnsChange}
              value={viewConfig.gridColumns.toString()}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRID_COLUMNS_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Map toggle (for grid/list views) */}
          {viewConfig.viewMode !== "map" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleMapToggle}
                    size="sm"
                    variant={viewConfig.showMap ? "default" : "outline"}
                  >
                    {viewConfig.showMap ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {viewConfig.showMap ? "Hide map" : "Show map"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Right section - Sort and actions */}
        <div className="flex items-center gap-2">
          {/* Filters toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleFiltersToggle}
                  size="sm"
                  variant={viewConfig.showFilters ? "default" : "outline"}
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <Badge
                      className="ml-1 h-4 px-1 text-xs"
                      variant="secondary"
                    >
                      <span className="sr-only">Active filters</span>•
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {viewConfig.showFilters ? "Hide filters" : "Show filters"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Sort controls */}
          <div className="flex items-center gap-1">
            <Select
              onValueChange={handleSortChange}
              value={filters.sortBy || "createdAt"}
            >
              <SelectTrigger className="w-28">
                <SelectValue>{getSortLabel()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSortOrderToggle}
                    size="sm"
                    variant="outline"
                  >
                    {filters.sortOrder === "asc" ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {filters.sortOrder === "asc"
                    ? "Sort descending"
                    : "Sort ascending"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Refresh */}
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled={isLoading}
                      onClick={onRefresh}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw
                        className={cn("h-4 w-4", isLoading && "animate-spin")}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh results</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSaveSearch && (
                  <DropdownMenuItem onClick={onSaveSearch}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save Search
                  </DropdownMenuItem>
                )}
                {onExport && (
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Results
                  </DropdownMenuItem>
                )}
                {hasActiveFilters && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onClearFilters}>
                      Clear All Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
