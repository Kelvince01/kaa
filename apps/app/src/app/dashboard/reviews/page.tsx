"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { BarChart3, MessageSquare, Plus, Users } from "lucide-react";
import { useState } from "react";
import { ReviewAnalytics } from "@/modules/reviews/components/management/review-analytics";
import { ReviewModeration } from "@/modules/reviews/components/management/review-moderation";
import { ReviewDetailsModal } from "@/modules/reviews/components/modals/review-details-modal";
import { ReviewModal } from "@/modules/reviews/components/modals/review-modal";
import { ReviewResponseModal } from "@/modules/reviews/components/modals/review-response-modal";
import {
  getReviewColumns,
  ReviewsDataTable,
} from "@/modules/reviews/components/table";
import { useReviews } from "@/modules/reviews/review.queries";
import type { Review } from "@/modules/reviews/review.type";

export default function ReviewsDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("month");

  // Fetch reviews data
  const {
    data: reviewsResponse,
    isLoading,
    refetch,
  } = useReviews({
    page: 1,
    limit: 100, // For demo purposes, fetch more data
  });

  const reviews = reviewsResponse?.reviews || [];

  // Handle review actions
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

  // Table columns configuration
  const columns = getReviewColumns({
    onView: handleViewReview,
    onEdit: handleEditReview,
    onRespond: handleRespondToReview,
    onFlag: handleFlagReview,
    onApprove: handleApproveReview,
    onReject: handleRejectReview,
    canEdit: true,
    canDelete: true,
    canModerate: true,
    canRespond: true,
  });

  // Calculate stats
  const totalReviews = reviews.length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Reviews Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor all property reviews
          </p>
        </div>
        <Button onClick={() => setReviewModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Review
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{totalReviews}</div>
            <p className="text-muted-foreground text-xs">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Average Rating
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{averageRating.toFixed(1)}</div>
            <p className="text-muted-foreground text-xs">
              +0.2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Reviews
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{pendingReviews}</div>
            <p className="text-muted-foreground text-xs">Require moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {totalReviews > 0
                ? Math.round(
                    (reviews.filter((r) => r.response).length / totalReviews) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-muted-foreground text-xs">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="moderation">
            Moderation
            {pendingReviews > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-white text-xs">
                {pendingReviews}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="overview">
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
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
                  showFilters
                  showPagination
                  showSearch
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewModeration
                loading={isLoading}
                onReviewUpdate={refetch}
                reviews={reviews}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="analytics">
          <ReviewAnalytics
            onTimeRangeChange={setTimeRange}
            reviews={reviews}
            timeRange={timeRange as any}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ReviewModal
        isOpen={reviewModalOpen}
        landlordId={selectedReview ? undefined : "sample-landlord-id"}
        mode={selectedReview ? "edit" : "create"}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedReview(null);
        }}
        onSuccess={() => {
          refetch();
          setSelectedReview(null);
        }}
        propertyId={selectedReview ? undefined : "sample-property-id"}
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
