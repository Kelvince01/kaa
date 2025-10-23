"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { AlertTriangle, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BulkReviewActions } from "@/modules/reviews/components/management/bulk-review-actions";
import { ReviewModeration } from "@/modules/reviews/components/management/review-moderation";
import { ReviewDetailsModal } from "@/modules/reviews/components/modals/review-details-modal";
import { useReviews } from "@/modules/reviews/review.queries";
import type { Review } from "@/modules/reviews/review.type";

export default function ReviewModerationPage() {
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch pending and flagged reviews
  const {
    data: reviewsResponse,
    isLoading,
    refetch,
  } = useReviews({
    status: "pending",
    page: 1,
    limit: 100,
  });

  const reviews = reviewsResponse?.reviews || [];

  // Calculate stats
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const rejectedReviews = reviews.filter((r) => r.status === "rejected");
  const approvedReviews = reviews.filter((r) => r.status === "approved");

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setDetailsModalOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push("/dashboard/reviews")}
          size="sm"
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reviews
        </Button>
        <div>
          <h1 className="font-bold text-3xl">Review Moderation</h1>
          <p className="text-muted-foreground">
            Review and moderate pending reviews
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{pendingReviews.length}</div>
            <p className="text-muted-foreground text-xs">
              Require your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{approvedReviews.length}</div>
            <p className="text-muted-foreground text-xs">+15% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Rejected Reviews
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{rejectedReviews.length}</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Quick Actions</span>
            {pendingReviews.length > 0 && (
              <Badge variant="secondary">{pendingReviews.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              disabled={pendingReviews.length === 0}
              onClick={() => {
                // TODO: Implement bulk approve all
                console.log("Bulk approve all");
              }}
              variant="outline"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve All Pending
            </Button>

            <Button
              disabled={pendingReviews.length === 0}
              onClick={() => {
                // TODO: Implement export functionality
                console.log("Export pending reviews");
              }}
              variant="outline"
            >
              Export Pending Reviews
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Review Management</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkReviewActions onReviewsUpdate={refetch} reviews={reviews} />
          </CardContent>
        </Card>
      )}

      {/* Moderation Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews Requiring Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <ReviewModeration
              loading={isLoading}
              onReviewUpdate={refetch}
              reviews={reviews}
            />
          )}
        </CardContent>
      </Card>

      {/* Review Details Modal */}
      <ReviewDetailsModal
        canEdit={false}
        canFlag={true}
        canRespond={true}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedReview(null);
        }}
        onEdit={(review) => {
          // TODO: Implement edit functionality
          console.log("Edit review:", review._id);
        }}
        onFlag={(review) => {
          // TODO: Implement flag functionality
          console.log("Flag review:", review._id);
        }}
        onSaveResponse={(reviewId, response) => {
          // TODO: Implement save response
          console.log("Save response:", { reviewId, response });
          refetch();
        }}
        review={selectedReview}
      />
    </div>
  );
}
