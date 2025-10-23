"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Label } from "@kaa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Filter, X } from "lucide-react";

export type ReviewFilters = {
  rating?: string;
  status?: string;
  verified?: boolean;
  hasResponse?: boolean;
  hasImages?: boolean;
  dateRange?: "all" | "week" | "month" | "quarter" | "year";
};

type ReviewFiltersProps = {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  showStatusFilter?: boolean;
  showVerifiedFilter?: boolean;
  showResponseFilter?: boolean;
  showImageFilter?: boolean;
  showDateFilter?: boolean;
};

export function ReviewFiltersComponent({
  filters,
  onFiltersChange,
  showStatusFilter = false,
  showVerifiedFilter = true,
  showResponseFilter = true,
  showImageFilter = true,
  showDateFilter = true,
}: ReviewFiltersProps) {
  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "all" && value !== ""
  );

  const activeFilterCount = Object.values(filters).filter(
    (value) =>
      value !== undefined && value !== "all" && value !== "" && value !== false
  ).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof ReviewFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" || value === "" ? undefined : value,
    });
  };

  const getFilterBadges = () => {
    const badges: Array<{ label: string; onRemove: () => void }> = [];

    if (filters.rating && filters.rating !== "all") {
      badges.push({
        label: `${filters.rating} stars`,
        onRemove: () => updateFilter("rating", undefined),
      });
    }

    if (filters.status && filters.status !== "all") {
      badges.push({
        label: `Status: ${filters.status}`,
        onRemove: () => updateFilter("status", undefined),
      });
    }

    if (filters.verified) {
      badges.push({
        label: "Verified stays",
        onRemove: () => updateFilter("verified", false),
      });
    }

    if (filters.hasResponse) {
      badges.push({
        label: "Has response",
        onRemove: () => updateFilter("hasResponse", false),
      });
    }

    if (filters.hasImages) {
      badges.push({
        label: "With photos",
        onRemove: () => updateFilter("hasImages", false),
      });
    }

    if (filters.dateRange && filters.dateRange !== "all") {
      const dateLabels = {
        week: "Past week",
        month: "Past month",
        quarter: "Past 3 months",
        year: "Past year",
      };
      badges.push({
        label: dateLabels[filters.dateRange as keyof typeof dateLabels],
        onRemove: () => updateFilter("dateRange", "all"),
      });
    }

    return badges;
  };

  return (
    <div className="space-y-3">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Rating Filter */}
        <Select
          onValueChange={(value) => updateFilter("rating", value)}
          value={filters.rating || "all"}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter (for admin) */}
        {showStatusFilter && (
          <Select
            onValueChange={(value) => updateFilter("status", value)}
            value={filters.status || "all"}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Date Range Filter */}
        {showDateFilter && (
          <Select
            onValueChange={(value) => updateFilter("dateRange", value)}
            value={filters.dateRange || "all"}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="week">Past week</SelectItem>
              <SelectItem value="month">Past month</SelectItem>
              <SelectItem value="quarter">Past 3 months</SelectItem>
              <SelectItem value="year">Past year</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline">
              <Filter className="mr-1 h-4 w-4" />
              More Filters
              {activeFilterCount > 0 && (
                <Badge
                  className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  variant="secondary"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Advanced Filters</h4>

              {showVerifiedFilter && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.verified}
                    id="verified"
                    onCheckedChange={(checked) =>
                      updateFilter("verified", checked)
                    }
                  />
                  <Label className="text-sm" htmlFor="verified">
                    Verified stays only
                  </Label>
                </div>
              )}

              {showResponseFilter && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.hasResponse}
                    id="hasResponse"
                    onCheckedChange={(checked) =>
                      updateFilter("hasResponse", checked)
                    }
                  />
                  <Label className="text-sm" htmlFor="hasResponse">
                    Has landlord response
                  </Label>
                </div>
              )}

              {showImageFilter && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={filters.hasImages}
                    id="hasImages"
                    onCheckedChange={(checked) =>
                      updateFilter("hasImages", checked)
                    }
                  />
                  <Label className="text-sm" htmlFor="hasImages">
                    With photos
                  </Label>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button onClick={clearFilters} size="sm" variant="ghost">
            <X className="mr-1 h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {getFilterBadges().map((badge) => (
            <Badge className="gap-1" key={badge.label} variant="secondary">
              {badge.label}
              <Button
                className="h-auto p-0 hover:bg-transparent"
                onClick={badge.onRemove}
                size="sm"
                variant="ghost"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
