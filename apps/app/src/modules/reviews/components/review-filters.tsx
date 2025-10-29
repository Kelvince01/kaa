/**
 * Review Filters Component
 * Filter controls for review list
 */

"use client";

import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@kaa/ui/components/sheet";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";
import {
  KENYA_COUNTIES,
  LANGUAGE_OPTIONS,
  RATING_OPTIONS,
  REVIEW_TYPE_OPTIONS,
} from "../review.schema";
import type { ReviewFilterOptions } from "../review.type";
import { ReviewStatusEnum } from "../review.type";

type ReviewFiltersProps = {
  filters: ReviewFilterOptions;
  onFiltersChange: (filters: ReviewFilterOptions) => void;
  onReset: () => void;
};

export const ReviewFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: ReviewFiltersProps) => {
  const [localFilters, setLocalFilters] =
    useState<ReviewFilterOptions>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
    onReset();
  };

  const updateFilter = (key: keyof ReviewFilterOptions, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) =>
      key !== "page" &&
      key !== "limit" &&
      key !== "sortBy" &&
      key !== "sortOrder"
  ).length;

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative max-w-md flex-1">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(e) => updateFilter("search", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleApply();
            }
          }}
          placeholder="Search reviews..."
          value={localFilters.search || ""}
        />
        {localFilters.search && (
          <Button
            className="-translate-y-1/2 absolute top-1/2 right-1 h-7 w-7"
            onClick={() => {
              updateFilter("search", "");
              handleApply();
            }}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="gap-2" variant="outline">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filter Reviews</SheetTitle>
            <SheetDescription>
              Refine your search with advanced filters
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Review Type */}
            <div className="space-y-2">
              <Label>Review Type</Label>
              <Select
                onValueChange={(value) => updateFilter("type", value)}
                value={localFilters.type as string}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {REVIEW_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) => updateFilter("status", value)}
                value={localFilters.status as string}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(ReviewStatusEnum).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Range */}
            <div className="space-y-2">
              <Label>Minimum Rating</Label>
              <Select
                onValueChange={(value) =>
                  updateFilter("minRating", Number.parseInt(value, 10))
                }
                value={localFilters.minRating?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any rating</SelectItem>
                  {RATING_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                onValueChange={(value) => updateFilter("language", value)}
                value={localFilters.language}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* County */}
            <div className="space-y-2">
              <Label>County</Label>
              <Select
                onValueChange={(value) => updateFilter("county", value)}
                value={localFilters.county}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {KENYA_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                onValueChange={(value) => updateFilter("sortBy", value)}
                value={localFilters.sortBy}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Most Recent</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="helpfulCount">Most Helpful</SelectItem>
                  <SelectItem value="reviewDate">Review Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Select
                onValueChange={(value) =>
                  updateFilter("sortOrder", value as "asc" | "desc")
                }
                value={localFilters.sortOrder}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-4">
              <Button
                className="flex-1"
                onClick={handleReset}
                variant="outline"
              >
                Reset
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort Quick Select */}
      <Select
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split("-");
          onFiltersChange({
            ...filters,
            sortBy: sortBy as any,
            sortOrder: sortOrder as "asc" | "desc",
          });
        }}
        value={`${filters.sortBy}-${filters.sortOrder}`}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt-desc">Most Recent</SelectItem>
          <SelectItem value="createdAt-asc">Oldest First</SelectItem>
          <SelectItem value="rating-desc">Highest Rating</SelectItem>
          <SelectItem value="rating-asc">Lowest Rating</SelectItem>
          <SelectItem value="helpfulCount-desc">Most Helpful</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
