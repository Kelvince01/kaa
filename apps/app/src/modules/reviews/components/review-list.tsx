/**
 * Review List Component
 * Displays a list of reviews with pagination
 */

"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { ReviewFilterOptions, ReviewWithUser } from "../review.type";
import { ReviewCard } from "./review-card";

type ReviewListProps = {
  reviews: ReviewWithUser[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters?: ReviewFilterOptions;
  currentUserId?: string;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onEdit?: (review: ReviewWithUser) => void;
  onDelete?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
  onNotHelpful?: (reviewId: string) => void;
  showActions?: boolean;
};

export const ReviewList = ({
  reviews,
  isLoading,
  pagination,
  currentUserId,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
  onFlag,
  onRespond,
  onHelpful,
  onNotHelpful,
  showActions = true,
}: ReviewListProps) => {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="space-y-3 rounded-lg border p-6"
            key={`skeleton-${i.toString()}`}
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-lg">No reviews yet</h3>
        <p className="text-muted-foreground text-sm">
          Be the first to write a review!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            currentUserId={currentUserId}
            key={review._id}
            onDelete={onDelete}
            onEdit={onEdit}
            onFlag={onFlag}
            onHelpful={onHelpful}
            onNotHelpful={onNotHelpful}
            onRespond={onRespond}
            review={review}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} reviews
            </p>
            <Select
              onValueChange={(value) =>
                onLimitChange?.(Number.parseInt(value, 10))
              }
              value={pagination.limit.toString()}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={pagination.page === 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                const pageNumber = i + 1;
                return (
                  <Button
                    key={pageNumber}
                    onClick={() => onPageChange?.(pageNumber)}
                    size="sm"
                    variant={
                      pageNumber === pagination.page ? "default" : "outline"
                    }
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              {pagination.pages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <Button
                    onClick={() => onPageChange?.(pagination.pages)}
                    size="sm"
                    variant="outline"
                  >
                    {pagination.pages}
                  </Button>
                </>
              )}
            </div>
            <Button
              disabled={pagination.page === pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
