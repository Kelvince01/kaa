"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react";
import { useState } from "react";
import { BulkReviewActions } from "@/modules/reviews/components/management/bulk-review-actions";
import { ReviewAnalytics } from "@/modules/reviews/components/management/review-analytics";
import { ReviewModeration } from "@/modules/reviews/components/management/review-moderation";
import { ReviewDetailsModal } from "@/modules/reviews/components/modals/review-details-modal";
import {
  getReviewColumns,
  ReviewsDataTable,
} from "@/modules/reviews/components/table";
import { useReviews } from "@/modules/reviews/review.queries";
import type { Review } from "@/modules/reviews/review.type";

export function ReviewModerationInterface() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("month");

  // Fetch reviews data
  const {
    data: reviewsResponse,
    isLoading,
    refetch,
  } = useReviews({
    page: 1,
    limit: 100,
    ...(statusFilter !== "all" && { status: statusFilter }),
  });

  const reviews = reviewsResponse?.reviews || [];

  // Filter reviews by status for different tabs
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const rejectedReviews = reviews.filter((r) => r.status === "rejected");

  // Handle review actions
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

  const handleSaveResponse = (reviewId: string, response: string) => {
    // TODO: Implement save response API call
    console.log("Saving response:", { reviewId, response });
    refetch();
  };

  const handleExportReviews = () => {
    // TODO: Implement export functionality
    console.log("Exporting reviews");
  };

  // Table columns for different views
  const moderationColumns = getReviewColumns({
    onView: handleViewReview,
    onApprove: handleApproveReview,
    onReject: handleRejectReview,
    canModerate: true,
    canRespond: true,
  });

  const approvedColumns = getReviewColumns({
    onView: handleViewReview,
    canRespond: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Review Moderation</h1>
          <p className="text-muted-foreground">
            Review and moderate user feedback
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportReviews} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Select onValueChange={setTimeRange} value={timeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {pendingReviews.length}
                </p>
                <p className="text-muted-foreground text-sm">Pending</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {approvedReviews.length}
                </p>
                <p className="text-muted-foreground text-sm">Approved</p>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {rejectedReviews.length}
                </p>
                <p className="text-muted-foreground text-sm">Rejected</p>
              </div>
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((sum, r) => sum + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-muted-foreground text-sm">Avg Rating</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Moderation Interface */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger className="relative" value="pending">
            Pending
            {pendingReviews.length > 0 && (
              <Badge
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                variant="destructive"
              >
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="pending">
          {pendingReviews.length > 0 ? (
            <>
              {/* Bulk Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <BulkReviewActions
                    onReviewsUpdate={refetch}
                    reviews={pendingReviews}
                  />
                </CardContent>
              </Card>

              {/* Moderation Interface */}
              <Card>
                <CardHeader>
                  <CardTitle>Reviews Awaiting Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewModeration
                    loading={isLoading}
                    onReviewUpdate={refetch}
                    reviews={pendingReviews}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 font-medium text-lg">All caught up!</h3>
                <p className="text-muted-foreground">
                  No reviews are pending moderation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Reviews ({approvedReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ReviewsDataTable
                  columns={approvedColumns}
                  data={approvedReviews}
                  searchKey="title"
                  searchPlaceholder="Search approved reviews..."
                  showPagination
                  showSearch
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="rejected">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Reviews ({rejectedReviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <ReviewsDataTable
                  columns={moderationColumns}
                  data={rejectedReviews}
                  searchKey="title"
                  searchPlaceholder="Search rejected reviews..."
                  showPagination
                  showSearch
                />
              )}
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
        onSaveResponse={handleSaveResponse}
        review={selectedReview}
      />
    </div>
  );
}
