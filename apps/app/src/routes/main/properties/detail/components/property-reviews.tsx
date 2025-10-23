"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Separator } from "@kaa/ui/components/separator";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";
import {
  ReviewList,
  ReviewModal,
  ReviewSummary,
} from "@/modules/reviews/components";
import {
  applySorting,
  type ReviewFilters,
  ReviewFiltersComponent,
  ReviewSort,
  type ReviewSortOption,
} from "@/modules/reviews/components/filters";
import { useReviews } from "@/modules/reviews/review.queries";

type PropertyReviewsProps = {
  property: Property;
};

export function PropertyReviews({ property }: PropertyReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Fetch reviews for this property
  const {
    data: reviewsResponse,
    isLoading,
    refetch,
  } = useReviews({
    property: property._id,
    page: 1,
    limit: 100,
  });

  let reviews = reviewsResponse?.reviews || [];
  const totalReviews = reviewsResponse?.pagination?.total || 0;

  // Apply client-side filtering
  if (filters.rating && filters.rating !== "all") {
    reviews = reviews.filter(
      (review) => review.rating.toString() === filters.rating
    );
  }

  if (filters.verified) {
    reviews = reviews.filter((review) => review.isVerifiedStay);
  }

  if (filters.hasResponse !== undefined) {
    reviews = reviews.filter((review) =>
      filters.hasResponse ? !!review.response : !review.response
    );
  }

  if (filters.hasImages !== undefined) {
    reviews = reviews.filter((review) =>
      filters.hasImages
        ? !!(review.images && review.images.length > 0)
        : !(review.images && review.images.length > 0)
    );
  }

  // Apply sorting
  reviews = applySorting(reviews, sortBy, sortDirection);

  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const handleSortChange = (
    newSortBy: ReviewSortOption,
    direction?: "asc" | "desc"
  ) => {
    setSortBy(newSortBy);
    if (direction) setSortDirection(direction);
  };

  const handleHelpful = (reviewId: string) => {
    // TODO: Implement helpful functionality
    console.log("Helpful:", reviewId);
  };

  const handleFlag = (reviewId: string) => {
    // TODO: Implement flag functionality
    console.log("Flag:", reviewId);
  };

  const handleCreateReviewSuccess = () => {
    setShowReviewForm(false);
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reviews & Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log(property.landlord);

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <ReviewSummary
        averageRating={averageRating}
        reviews={reviews}
        totalReviews={totalReviews}
      />

      <Separator />

      {/* Filters and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ReviewFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            showDateFilter={true}
            showImageFilter={true}
            showResponseFilter={true}
            showStatusFilter={false}
            showVerifiedFilter={true}
          />

          <ReviewSort
            compact
            onSortChange={handleSortChange}
            sortBy={sortBy}
            sortDirection={sortDirection}
          />
        </div>

        <Button onClick={() => setShowReviewForm(true)} size="sm">
          Write Review
        </Button>
      </div>

      {/* Reviews List */}
      <ReviewList
        emptyAction={{
          label: "Write First Review",
          onClick: () => setShowReviewForm(true),
        }}
        emptyMessage="No reviews yet"
        loading={isLoading}
        onFlag={handleFlag}
        onHelpful={handleHelpful}
        reviews={reviews}
        showActions={true}
        showResponse={true}
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewForm}
        landlordId={
          typeof property.landlord === "string"
            ? property.landlord
            : (property.landlord as any)._id
        }
        mode="create"
        onClose={() => setShowReviewForm(false)}
        onSuccess={handleCreateReviewSuccess}
        propertyId={property._id}
      />
    </div>
  );
}
