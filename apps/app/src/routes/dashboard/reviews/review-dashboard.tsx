/**
 * Review Dashboard Container
 * Main container for displaying reviews with filters and stats
 */

"use client";

import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateReviewForm } from "@/modules/reviews/components/create-review-form";
import { FlagReviewDialog } from "@/modules/reviews/components/flag-review-dialog";
import { ResponseForm } from "@/modules/reviews/components/response-form";
import { ReviewFilters } from "@/modules/reviews/components/review-filters";
import { ReviewList } from "@/modules/reviews/components/review-list";
import { ReviewStats } from "@/modules/reviews/components/review-stats";
import { useReviewStats, useReviews } from "@/modules/reviews/review.queries";
import { useReviewStore } from "@/modules/reviews/review.store";
import type { ReviewFilterOptions } from "@/modules/reviews/review.type";

type ReviewDashboardContainerProps = {
  targetId: string;
  type?: string;
  currentUserId?: string;
  showCreateButton?: boolean;
  showStats?: boolean;
};

export const ReviewDashboardContainer = ({
  targetId,
  type = "property",
  currentUserId,
  showCreateButton = true,
  showStats = true,
}: ReviewDashboardContainerProps) => {
  const {
    filters,
    setFilters,
    resetFilters,
    isCreatingReview,
    setIsCreatingReview,
    flaggingReviewId,
    setFlaggingReviewId,
    respondingToReviewId,
    setRespondingToReviewId,
  } = useReviewStore();

  const [currentTab, setCurrentTab] = useState<"reviews" | "stats">("reviews");

  // Initialize filters with targetId
  const reviewFilters: ReviewFilterOptions = {
    ...filters,
    targetId,
    type: type as any,
  };

  const { data: reviewsData, isLoading: reviewsLoading } =
    useReviews(reviewFilters);

  const { data: statsData, isLoading: statsLoading } = useReviewStats(
    targetId,
    type
  );

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 });
  };

  const handleFiltersChange = (newFilters: ReviewFilterOptions) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Reviews</h2>
          <p className="text-muted-foreground text-sm">
            {statsData?.totalReviews || 0} total reviews
          </p>
        </div>
        {showCreateButton && !isCreatingReview && (
          <Button className="gap-2" onClick={() => setIsCreatingReview(true)}>
            <Plus className="h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Create Review Form */}
      {isCreatingReview && (
        <Card>
          <CardContent className="pt-6">
            <CreateReviewForm
              onCancel={() => setIsCreatingReview(false)}
              onSuccess={() => setIsCreatingReview(false)}
              targetId={targetId}
              type={type}
            />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs onValueChange={(v) => setCurrentTab(v as any)} value={currentTab}>
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          {showStats && <TabsTrigger value="stats">Statistics</TabsTrigger>}
        </TabsList>

        <TabsContent className="mt-6 space-y-6" value="reviews">
          {/* Filters */}
          <ReviewFilters
            filters={reviewFilters}
            onFiltersChange={handleFiltersChange}
            onReset={resetFilters}
          />

          {/* Reviews List */}
          <ReviewList
            currentUserId={currentUserId}
            isLoading={reviewsLoading}
            onFlag={(reviewId) => setFlaggingReviewId(reviewId)}
            onLimitChange={handleLimitChange}
            onPageChange={handlePageChange}
            onRespond={(reviewId) => setRespondingToReviewId(reviewId)}
            pagination={reviewsData?.pagination}
            reviews={(reviewsData?.reviews as any) || []}
          />
        </TabsContent>

        {showStats && (
          <TabsContent className="mt-6" value="stats">
            <ReviewStats isLoading={statsLoading} stats={statsData} />
          </TabsContent>
        )}
      </Tabs>

      {/* Flag Review Dialog */}
      <FlagReviewDialog
        onOpenChange={(open) => {
          if (!open) setFlaggingReviewId(null);
        }}
        open={!!flaggingReviewId}
        reviewId={flaggingReviewId}
      />

      {/* Response Form Dialog */}
      {respondingToReviewId && (
        <Card>
          <CardContent className="pt-6">
            <ResponseForm
              onCancel={() => setRespondingToReviewId(null)}
              onSuccess={() => setRespondingToReviewId(null)}
              reviewId={respondingToReviewId}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
