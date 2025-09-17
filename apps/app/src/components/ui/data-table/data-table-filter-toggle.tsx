import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import { Filter, X } from "lucide-react";
import type * as React from "react";

interface DataTableFilterToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the filter is currently active
   */
  isFiltered?: boolean;
  /**
   * Function to clear all filters
   */
  onClearFilters?: () => void;
  /**
   * Optional label for the filter button
   */
  label?: string;
  /**
   * Optional count of active filters
   */
  filterCount?: number;
}

export function DataTableFilterToggle({
  isFiltered = false,
  onClearFilters,
  label = "Filter",
  filterCount,
  className,
  children,
  ...props
}: DataTableFilterToggleProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isFiltered && onClearFilters) {
      e.preventDefault();
      onClearFilters();
    }
  };

  return (
    <Button
      className={cn(
        "h-8 border-dashed",
        isFiltered && "border-primary bg-accent/20",
        className
      )}
      onClick={handleClick}
      size="sm"
      variant="outline"
      {...props}
    >
      {isFiltered ? (
        <X className="mr-2 h-4 w-4" />
      ) : (
        <Filter className="mr-2 h-4 w-4" />
      )}
      {label}
      {filterCount !== undefined && filterCount > 0 && (
        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground text-xs">
          {filterCount}
        </span>
      )}
    </Button>
  );
}
