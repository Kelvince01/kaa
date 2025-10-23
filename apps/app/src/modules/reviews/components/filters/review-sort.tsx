import { Button } from "@kaa/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { SortAsc, SortDesc } from "lucide-react";

export type ReviewSortOption =
  | "newest"
  | "oldest"
  | "highest"
  | "lowest"
  | "helpful"
  | "verified";

export type ReviewSortDirection = "asc" | "desc";

type ReviewSortProps = {
  sortBy: ReviewSortOption;
  sortDirection?: ReviewSortDirection;
  onSortChange: (
    sortBy: ReviewSortOption,
    direction?: ReviewSortDirection
  ) => void;
  showDirection?: boolean;
  compact?: boolean;
};

export function ReviewSort({
  sortBy,
  sortDirection = "desc",
  onSortChange,
  showDirection = false,
  compact = false,
}: ReviewSortProps) {
  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "highest", label: "Highest rated" },
    { value: "lowest", label: "Lowest rated" },
    { value: "helpful", label: "Most helpful" },
    { value: "verified", label: "Verified first" },
  ] as const;

  const handleSortChange = (value: string) => {
    onSortChange(value as ReviewSortOption, sortDirection);
  };

  const toggleDirection = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc";
    onSortChange(sortBy, newDirection);
  };

  const getSortLabel = () => {
    const option = sortOptions.find((opt) => opt.value === sortBy);
    return option?.label || "Sort by";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select onValueChange={handleSortChange} value={sortBy}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showDirection && (
          <Button
            className="px-2"
            onClick={toggleDirection}
            size="sm"
            title={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
            variant="outline"
          >
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-sm">Sort by:</span>

      <Select onValueChange={handleSortChange} value={sortBy}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDirection && (
        <Button
          className="gap-2"
          onClick={toggleDirection}
          size="sm"
          variant="outline"
        >
          {sortDirection === "asc" ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
          {sortDirection === "asc" ? "Ascending" : "Descending"}
        </Button>
      )}
    </div>
  );
}

// Helper function to get sort description
export function getSortDescription(
  sortBy: ReviewSortOption,
  direction: ReviewSortDirection
): string {
  const descriptions = {
    newest: direction === "desc" ? "Newest first" : "Oldest first",
    oldest: direction === "desc" ? "Oldest first" : "Newest first",
    highest:
      direction === "desc" ? "Highest rated first" : "Lowest rated first",
    lowest: direction === "desc" ? "Lowest rated first" : "Highest rated first",
    helpful:
      direction === "desc" ? "Most helpful first" : "Least helpful first",
    verified:
      direction === "desc" ? "Verified reviews first" : "Non-verified first",
  };

  return descriptions[sortBy];
}

// Helper function to apply sorting to reviews array
export function applySorting<
  T extends {
    rating: number;
    createdAt?: string | Date;
    isVerifiedStay?: boolean;
    helpful?: number;
  },
>(
  reviews: T[],
  sortBy: ReviewSortOption,
  direction: ReviewSortDirection = "desc"
): T[] {
  const sortedReviews = [...reviews];
  const multiplier = direction === "desc" ? -1 : 1;

  return sortedReviews.sort((a, b) => {
    switch (sortBy) {
      case "newest":
      case "oldest": {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return (dateB - dateA) * multiplier;
      }

      case "highest":
      case "lowest":
        return (b.rating - a.rating) * multiplier;

      case "helpful": {
        const helpfulA = a.helpful || 0;
        const helpfulB = b.helpful || 0;
        return (helpfulB - helpfulA) * multiplier;
      }

      case "verified": {
        const verifiedA = a.isVerifiedStay ? 1 : 0;
        const verifiedB = b.isVerifiedStay ? 1 : 0;
        return (verifiedB - verifiedA) * multiplier;
      }

      default:
        return 0;
    }
  });
}
