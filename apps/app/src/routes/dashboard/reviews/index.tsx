"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  type ReviewFilters,
  ReviewFiltersComponent,
} from "@/modules/reviews/components/filters/review-filters";
import {
  applySorting,
  ReviewSort,
  type ReviewSortOption,
} from "@/modules/reviews/components/filters/review-sort";
import { ReviewDetailsModal } from "@/modules/reviews/components/modals/review-details-modal";
import { ReviewModal } from "@/modules/reviews/components/modals/review-modal";
import { ReviewResponseModal } from "@/modules/reviews/components/modals/review-response-modal";
import {
  getReviewColumns,
  ReviewsDataTable,
} from "@/modules/reviews/components/table";
import { useReviews } from "@/modules/reviews/review.queries";
import type { Review } from "@/modules/reviews/review.type";

type ReviewsDashboardProps = {
  propertyId?: string;
  landlordId?: string;
  showCreateButton?: boolean;
  title?: string;
  description?: string;
};

export function ReviewsDashboard({
  propertyId,
  landlordId,
  showCreateButton = true,
  title = "Reviews Management",
  description = "Manage all reviews and responses",
}: ReviewsDashboardProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  // Filters and sorting
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Build query params
  const queryParams: any = {
    page: 1,
    limit: 50,
  };

  if (propertyId) queryParams.property = propertyId;
  if (landlordId) queryParams.landlord = landlordId;
  if (filters.rating) queryParams.rating = filters.rating;
  if (filters.status) queryParams.status = filters.status;
  if (filters.verified) queryParams.verified = filters.verified;

  // Fetch reviews
  const { data: reviewsResponse, isLoading, refetch } = useReviews(queryParams);

  let reviews = reviewsResponse?.reviews || [];

  // Apply client-side filtering and sorting
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

  if (filters.dateRange && filters.dateRange !== "all") {
    const now = new Date();
    const cutoff = new Date();

    switch (filters.dateRange) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        break;
    }

    reviews = reviews.filter(
      (review) => new Date(review.createdAt || 0) >= cutoff
    );
  }

  // Apply sorting
  reviews = applySorting(reviews, sortBy, sortDirection);

  // Handle actions
  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setDetailsModalOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setSelectedReview(review);
    setReviewModalOpen(true);
  };

  const handleRespondToReview = (review: Review) => {
    setSelectedReview(review);
    setResponseModalOpen(true);
  };

  const handleSaveResponse = (reviewId: string, response: string) => {
    // TODO: Implement save response API call
    console.log("Saving response:", { reviewId, response });
    setResponseModalOpen(false);
    refetch();
  };

  const handleFlagReview = (review: Review) => {
    // TODO: Implement flag review functionality
    console.log("Flagging review:", review._id);
  };

  const handleApproveReview = (review: Review) => {
    // TODO: Implement approve review API call
    console.log("Approving review:", review._id);
    refetch();
  };

  const handleRejectReview = (review: Review) => {
    // TODO: Implement reject review API call
    console.log("Rejecting review:", review._id);
    refetch();
  };

  const handleSortChange = (
    newSortBy: ReviewSortOption,
    direction?: "asc" | "desc"
  ) => {
    setSortBy(newSortBy);
    if (direction) setSortDirection(direction);
  };

  // Table columns
  const columns = getReviewColumns({
    onView: handleViewReview,
    onEdit: handleEditReview,
    onRespond: handleRespondToReview,
    onFlag: handleFlagReview,
    onApprove: handleApproveReview,
    onReject: handleRejectReview,
    canEdit: true,
    canDelete: false,
    canModerate: true,
    canRespond: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {showCreateButton && (
          <Button onClick={() => setReviewModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Review
          </Button>
        )}
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Sorting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ReviewFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            showDateFilter={true}
            showImageFilter={true}
            showResponseFilter={true}
            showStatusFilter={true}
            showVerifiedFilter={true}
          />

          <ReviewSort
            onSortChange={handleSortChange}
            showDirection={true}
            sortBy={sortBy}
            sortDirection={sortDirection}
          />
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <ReviewsDataTable
              columns={columns}
              data={reviews}
              searchKey="title"
              searchPlaceholder="Search reviews..."
              showColumnToggle
              showPagination
              showSearch
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewModalOpen}
        landlordId={landlordId || "default-landlord-id"}
        mode={selectedReview ? "edit" : "create"}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReview(null);
        }}
        onSuccess={() => {
          refetch();
          setSelectedReview(null);
        }}
        propertyId={propertyId || "default-property-id"}
        review={selectedReview || undefined}
      />

      <ReviewDetailsModal
        canEdit={true}
        canFlag={true}
        canRespond={true}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReview(null);
        }}
        onEdit={handleEditReview}
        onFlag={handleFlagReview}
        onRespond={handleRespondToReview}
        onSaveResponse={handleSaveResponse}
        review={selectedReview}
      />

      <ReviewResponseModal
        isOpen={responseModalOpen}
        onClose={() => {
          setResponseModalOpen(false);
          setSelectedReview(null);
        }}
        onSaveResponse={handleSaveResponse}
        review={selectedReview}
      />
    </div>
  );
}
