"use client";

import { Button } from "@kaa/ui/components/button";
import { MessageSquare } from "lucide-react";
import type { Review } from "../../review.type";
import { ReviewCard } from "./review-card";

type ReviewListProps = {
  reviews: Review[];
  loading?: boolean;
  onHelpful?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showActions?: boolean;
  showResponse?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
};

export function ReviewList({
  reviews,
  loading = false,
  onHelpful,
  onFlag,
  onRespond,
  onLoadMore,
  hasMore = false,
  showActions = true,
  showResponse = true,
  compact = false,
  emptyMessage = "No reviews yet",
  emptyAction,
}: ReviewListProps) {
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            className="animate-pulse rounded-lg border p-6"
            key={i.toString()}
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-gray-200" />
                <div className="h-3 w-1/3 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium text-lg">{emptyMessage}</h3>
        <p className="mb-4 text-muted-foreground">
          Be the first to share your experience.
        </p>
        {emptyAction && (
          <Button onClick={emptyAction.onClick}>{emptyAction.label}</Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          compact={compact}
          key={review._id}
          onFlag={onFlag}
          onHelpful={onHelpful}
          onRespond={onRespond}
          review={review}
          showActions={showActions}
          showResponse={showResponse}
        />
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button disabled={loading} onClick={onLoadMore} variant="outline">
            {loading ? "Loading..." : "Load More Reviews"}
          </Button>
        </div>
      )}
    </div>
  );
}
