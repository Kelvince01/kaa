"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { Separator } from "@kaa/ui/components/separator";
import { cn } from "@kaa/ui/lib/utils";
import {
  ChevronDown,
  DollarSign,
  FileText,
  Filter,
  Home,
  Star,
  Users,
  X,
} from "lucide-react";

import { DocumentCategory, DocumentStatus } from "../document.type";

type DocumentCategoryFilterProps = {
  selectedCategories: DocumentCategory[];
  selectedStatuses?: DocumentStatus[];
  onCategoriesChange: (categories: DocumentCategory[]) => void;
  onStatusesChange?: (statuses: DocumentStatus[]) => void;
  onClear?: () => void;
  className?: string;
  variant?: "dropdown" | "chips" | "sidebar";
  showStatusFilter?: boolean;
  showClearButton?: boolean;
  disabled?: boolean;
  counts?: Record<DocumentCategory, number>;
  statusCounts?: Record<DocumentStatus, number>;
};

const categoryConfig = {
  [DocumentCategory.GENERAL]: {
    label: "General",
    icon: FileText,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Standard documents",
  },
  [DocumentCategory.IDENTITY]: {
    label: "Identity",
    icon: Users,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "ID cards, passports, licenses",
  },
  [DocumentCategory.ADDRESS]: {
    label: "Address",
    icon: Home,
    color: "bg-green-100 text-green-800 border-green-300",
    description: "Utility bills, bank statements",
  },
  [DocumentCategory.INCOME]: {
    label: "Income",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    description: "Pay stubs, tax returns",
  },
  [DocumentCategory.REFERENCES]: {
    label: "References",
    icon: Star,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Character references",
  },
  [DocumentCategory.OTHER]: {
    label: "Other",
    icon: FileText,
    color: "bg-gray-100 text-gray-800 border-gray-300",
    description: "Miscellaneous documents",
  },
};

const statusConfig = {
  [DocumentStatus.PENDING]: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  [DocumentStatus.PROCESSING]: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  [DocumentStatus.VERIFIED]: {
    label: "Verified",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  [DocumentStatus.REJECTED]: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-300",
  },
  [DocumentStatus.EXPIRED]: {
    label: "Expired",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  [DocumentStatus.ERROR]: {
    label: "Error",
    color: "bg-red-100 text-red-800 border-red-300",
  },
};

export function DocumentCategoryFilter({
  selectedCategories,
  selectedStatuses = [],
  onCategoriesChange,
  onStatusesChange,
  onClear,
  className,
  variant = "dropdown",
  showStatusFilter = false,
  showClearButton = true,
  disabled = false,
  counts,
  statusCounts,
}: DocumentCategoryFilterProps) {
  const hasActiveFilters =
    selectedCategories.length > 0 || selectedStatuses.length > 0;

  const handleCategoryToggle = (category: DocumentCategory) => {
    if (disabled) return;

    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    onCategoriesChange(newCategories);
  };

  const handleStatusToggle = (status: DocumentStatus) => {
    if (disabled || !onStatusesChange) return;

    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    onStatusesChange(newStatuses);
  };

  const handleClearAll = () => {
    if (disabled) return;

    onCategoriesChange([]);
    if (onStatusesChange) {
      onStatusesChange([]);
    }
    onClear?.();
  };

  const renderCategoryChip = (category: DocumentCategory) => {
    const config = categoryConfig[category];
    const Icon = config.icon;
    const isSelected = selectedCategories.includes(category);
    const count = counts?.[category];

    return (
      <Button
        className={cn(
          "h-8 font-medium text-xs transition-all",
          !isSelected && config.color,
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        key={category}
        onClick={() => handleCategoryToggle(category)}
        size="sm"
        variant={isSelected ? "default" : "outline"}
      >
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
        {count !== undefined && (
          <Badge className="ml-1 h-4 min-w-[16px] text-xs" variant="secondary">
            {count}
          </Badge>
        )}
        {isSelected && <X className="ml-1 h-3 w-3" />}
      </Button>
    );
  };

  const renderStatusChip = (status: DocumentStatus) => {
    const config = statusConfig[status];
    const isSelected = selectedStatuses.includes(status);
    const count = statusCounts?.[status];

    return (
      <Button
        className={cn(
          "h-8 font-medium text-xs transition-all",
          !isSelected && config.color,
          disabled && "cursor-not-allowed opacity-50"
        )}
        disabled={disabled}
        key={status}
        onClick={() => handleStatusToggle(status)}
        size="sm"
        variant={isSelected ? "default" : "outline"}
      >
        {config.label}
        {count !== undefined && (
          <Badge className="ml-1 h-4 min-w-[16px] text-xs" variant="secondary">
            {count}
          </Badge>
        )}
        {isSelected && <X className="ml-1 h-3 w-3" />}
      </Button>
    );
  };

  if (variant === "chips") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Category chips */}
        {Object.values(DocumentCategory).map(renderCategoryChip)}

        {/* Status chips */}
        {showStatusFilter && (
          <>
            <Separator className="h-6" orientation="vertical" />
            {Object.values(DocumentStatus).map(renderStatusChip)}
          </>
        )}

        {/* Clear button */}
        {showClearButton && hasActiveFilters && (
          <>
            <Separator className="h-6" orientation="vertical" />
            <Button
              className="h-8 text-muted-foreground text-xs hover:text-foreground"
              disabled={disabled}
              onClick={handleClearAll}
              size="sm"
              variant="ghost"
            >
              Clear filters
            </Button>
          </>
        )}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Categories */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Categories</h4>
            {selectedCategories.length > 0 && (
              <Button
                className="h-6 px-2 text-muted-foreground text-xs"
                disabled={disabled}
                onClick={() => onCategoriesChange([])}
                size="sm"
                variant="ghost"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-1">
            {Object.entries(categoryConfig).map(([category, config]) => {
              const Icon = config.icon;
              const isSelected = selectedCategories.includes(
                category as DocumentCategory
              );
              const count = counts?.[category as DocumentCategory];

              return (
                <Button
                  className={cn(
                    "h-8 w-full justify-start px-2",
                    isSelected && "bg-primary/10 font-medium text-primary",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                  disabled={disabled}
                  key={category}
                  onClick={() =>
                    handleCategoryToggle(category as DocumentCategory)
                  }
                  size="sm"
                  variant="ghost"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left text-sm">
                    {config.label}
                  </span>
                  {count !== undefined && (
                    <Badge className="ml-auto text-xs" variant="outline">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Status filter */}
        {showStatusFilter && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Status</h4>
              {selectedStatuses.length > 0 && (
                <Button
                  className="h-6 px-2 text-muted-foreground text-xs"
                  disabled={disabled}
                  onClick={() => onStatusesChange?.([])}
                  size="sm"
                  variant="ghost"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-1">
              {Object.entries(statusConfig).map(([status, config]) => {
                const isSelected = selectedStatuses.includes(
                  status as DocumentStatus
                );
                const count = statusCounts?.[status as DocumentStatus];

                return (
                  <Button
                    className={cn(
                      "h-8 w-full justify-start px-2",
                      isSelected && "bg-primary/10 font-medium text-primary",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                    disabled={disabled}
                    key={status}
                    onClick={() => handleStatusToggle(status as DocumentStatus)}
                    size="sm"
                    variant="ghost"
                  >
                    <div
                      className={cn(
                        "mr-2 h-3 w-3 rounded-full",
                        config.color?.split(" ")[0]?.replace("bg-", "bg-"),
                        !isSelected && "opacity-60"
                      )}
                    />
                    <span className="flex-1 text-left text-sm">
                      {config.label}
                    </span>
                    {count !== undefined && (
                      <Badge className="ml-auto text-xs" variant="outline">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clear all */}
        {showClearButton && hasActiveFilters && (
          <>
            <Separator />
            <Button
              className="w-full text-xs"
              disabled={disabled}
              onClick={handleClearAll}
              size="sm"
              variant="outline"
            >
              Clear all filters
            </Button>
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "h-8",
              hasActiveFilters && "border-primary bg-primary/5",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            size="sm"
            variant="outline"
          >
            <Filter className="mr-1 h-3 w-3" />
            Filter
            {hasActiveFilters && (
              <Badge
                className="ml-1 h-4 min-w-[16px] text-xs"
                variant="secondary"
              >
                {selectedCategories.length + selectedStatuses.length}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="space-y-4">
            {/* Categories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Categories</h4>
                {selectedCategories.length > 0 && (
                  <Button
                    className="h-6 px-2 text-muted-foreground text-xs"
                    onClick={() => onCategoriesChange([])}
                    size="sm"
                    variant="ghost"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {Object.entries(categoryConfig).map(([category, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedCategories.includes(
                    category as DocumentCategory
                  );
                  const count = counts?.[category as DocumentCategory];

                  return (
                    <label
                      className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                      key={category}
                    >
                      <input
                        checked={isSelected}
                        className="rounded border-border"
                        disabled={disabled}
                        onChange={() =>
                          handleCategoryToggle(category as DocumentCategory)
                        }
                        type="checkbox"
                      />
                      <div className="flex flex-1 items-center space-x-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {config.label}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {config.description}
                          </div>
                        </div>
                        {count !== undefined && (
                          <Badge className="text-xs" variant="outline">
                            {count}
                          </Badge>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Status filter */}
            {showStatusFilter && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Status</h4>
                    {selectedStatuses.length > 0 && (
                      <Button
                        className="h-6 px-2 text-muted-foreground text-xs"
                        onClick={() => onStatusesChange?.([])}
                        size="sm"
                        variant="ghost"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const isSelected = selectedStatuses.includes(
                        status as DocumentStatus
                      );
                      const count = statusCounts?.[status as DocumentStatus];

                      return (
                        <label
                          className="flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                          key={status}
                        >
                          <input
                            checked={isSelected}
                            className="rounded border-border"
                            disabled={disabled}
                            onChange={() =>
                              handleStatusToggle(status as DocumentStatus)
                            }
                            type="checkbox"
                          />
                          <div className="flex flex-1 items-center space-x-2">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full",
                                config.color.split(" ")[0]
                              )}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {config.label}
                              </div>
                            </div>
                            {count !== undefined && (
                              <Badge className="text-xs" variant="outline">
                                {count}
                              </Badge>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Clear all */}
            {hasActiveFilters && (
              <>
                <Separator />
                <Button
                  className="w-full text-xs"
                  onClick={handleClearAll}
                  size="sm"
                  variant="outline"
                >
                  Clear all filters
                </Button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1">
          {selectedCategories.map((category) => {
            const config = categoryConfig[category];
            const Icon = config.icon;

            return (
              <Badge
                className={cn("text-xs", config.color)}
                key={category}
                variant="secondary"
              >
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
                <Button
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                  disabled={disabled}
                  onClick={() => handleCategoryToggle(category)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            );
          })}

          {selectedStatuses.map((status) => {
            const config = statusConfig[status];

            return (
              <Badge
                className={cn("text-xs", config.color)}
                key={status}
                variant="secondary"
              >
                {config.label}
                <Button
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                  disabled={disabled}
                  onClick={() => handleStatusToggle(status)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Clear all button */}
      {showClearButton && hasActiveFilters && (
        <Button
          className="h-8 text-muted-foreground text-xs"
          disabled={disabled}
          onClick={handleClearAll}
          size="sm"
          variant="ghost"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
