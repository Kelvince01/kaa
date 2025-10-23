"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent, CardHeader } from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import { Label } from "@kaa/ui/components/label";
import { Textarea } from "@kaa/ui/components/textarea";
import { formatDistanceToNow } from "date-fns";
import { Check, Clock, Eye, Flag, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { useUpdateReview } from "../../review.queries";
import type { Review } from "../../review.type";
import { ReviewCard } from "../display/review-card";

type ReviewModerationProps = {
  reviews: Review[];
  onReviewUpdate?: () => void;
  loading?: boolean;
};

export function ReviewModeration({
  reviews,
  onReviewUpdate,
  loading = false,
}: ReviewModerationProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const updateReviewMutation = useUpdateReview();

  const pendingReviews = reviews.filter(
    (review) => review.status === "pending"
  );
  const flaggedReviews = reviews.filter(
    (review) => review.status === "flagged"
  );

  const handleApprove = async (review: Review) => {
    setActionLoading(review._id);
    try {
      await updateReviewMutation.mutateAsync({
        id: review._id,
        data: { status: "approved" },
      });
      onReviewUpdate?.();
    } catch (error) {
      console.error("Error approving review:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (review: Review, reason: string) => {
    setActionLoading(review._id);
    try {
      await updateReviewMutation.mutateAsync({
        id: review._id,
        data: {
          status: "rejected",
          rejectionReason: reason,
        },
      });
      onReviewUpdate?.();
      setSelectedReview(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting review:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = (review: Review) => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.name || review.reviewer.email || "Anonymous";
    }
    return "Anonymous";
  };

  const getUserAvatar = (review: Review) => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.avatar;
    }
    return "";
  };

  const getPropertyName = (review: Review) => {
    if (typeof review.property === "object" && review.property) {
      return review.property.title || "Property";
    }
    return "Property";
  };

  if (loading) {
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
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl">
                  {pendingReviews.length}
                </p>
                <p className="text-muted-foreground text-sm">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <Flag className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl">
                  {flaggedReviews.length}
                </p>
                <p className="text-muted-foreground text-sm">Flagged Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl">
                  {reviews.filter((r) => r.status === "approved").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Approved Reviews
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Pending Reviews</h3>
          {pendingReviews.map((review) => (
            <ModerationCard
              actionLoading={actionLoading}
              getInitials={getInitials}
              getPropertyName={getPropertyName}
              getUserAvatar={getUserAvatar}
              getUserName={getUserName}
              handleApprove={handleApprove}
              handleReject={handleReject}
              key={review._id}
              rejectionReason={rejectionReason}
              review={review}
              setRejectionReason={setRejectionReason}
              setSelectedReview={setSelectedReview}
            />
          ))}
        </div>
      )}

      {/* Flagged Reviews */}
      {flaggedReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Flagged Reviews</h3>
          {flaggedReviews.map((review) => (
            <ModerationCard
              actionLoading={actionLoading}
              getInitials={getInitials}
              getPropertyName={getPropertyName}
              getUserAvatar={getUserAvatar}
              getUserName={getUserName}
              handleApprove={handleApprove}
              handleReject={handleReject}
              key={review._id}
              rejectionReason={rejectionReason}
              review={review}
              setRejectionReason={setRejectionReason}
              setSelectedReview={setSelectedReview}
            />
          ))}
        </div>
      )}

      {/* No Reviews */}
      {pendingReviews.length === 0 && flaggedReviews.length === 0 && (
        <div className="py-8 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-medium text-lg">
            No reviews need moderation
          </h3>
          <p className="text-muted-foreground">
            All reviews have been reviewed and approved.
          </p>
        </div>
      )}
    </div>
  );
}

type ModerationCardProps = {
  review: Review;
  getUserAvatar: (review: Review) => string;
  getUserName: (review: Review) => string;
  getInitials: (name: string) => string;
  getPropertyName: (review: Review) => string;
  actionLoading: string | null;
  handleApprove: (review: Review) => void;
  handleReject: (review: Review, reason: string) => void;
  setSelectedReview: (review: Review | null) => void;
  setRejectionReason: (reason: string) => void;
  rejectionReason: string;
};

const ModerationCard = ({
  review,
  getUserAvatar,
  getUserName,
  getInitials,
  getPropertyName,
  actionLoading,
  handleApprove,
  handleReject,
  setSelectedReview,
  setRejectionReason,
  rejectionReason,
}: ModerationCardProps) => (
  <Card className="border border-yellow-200 bg-yellow-50">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              alt={getUserName(review)}
              src={getUserAvatar(review)}
            />
            <AvatarFallback>{getInitials(getUserName(review))}</AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{getUserName(review)}</h4>
              {review.isVerifiedStay && (
                <Badge className="text-xs" variant="secondary">
                  Verified Stay
                </Badge>
              )}
              <Badge className="text-xs" variant="outline">
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              {getPropertyName(review)} •{" "}
              {formatDistanceToNow(new Date(review.createdAt || new Date()), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-8 w-8 p-0" size="sm" variant="outline">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Review Details</DialogTitle>
              </DialogHeader>
              <ReviewCard
                review={review}
                showActions={false}
                showResponse={false}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-0">
      <div className="space-y-3">
        <div>
          <h5 className="font-medium">{review.title}</h5>
          <p className="mt-1 text-muted-foreground text-sm">{review.comment}</p>
        </div>

        {review.images && review.images.length > 0 && (
          <div className="flex gap-2">
            {review.images.slice(0, 3).map((image, index) => (
              // biome-ignore lint/performance/noImgElement: ignore
              // biome-ignore lint/nursery/useImageSize: by author
              <img
                alt={image.caption || `Review image ${index + 1}`}
                className="h-16 w-16 rounded object-cover"
                key={index.toString()}
                src={image.url}
              />
            ))}
            {review.images.length > 3 && (
              <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-gray-600 text-sm">
                +{review.images.length - 3}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="gap-1"
            disabled={actionLoading === review._id}
            onClick={() => handleApprove(review)}
            size="sm"
          >
            <Check className="h-4 w-4" />
            {actionLoading === review._id ? "Approving..." : "Approve"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="gap-1"
                disabled={actionLoading === review._id}
                onClick={() => setSelectedReview(review)}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reason">Rejection Reason</Label>
                  <Textarea
                    id="reason"
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this review..."
                    rows={3}
                    value={rejectionReason}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={
                      !rejectionReason.trim() || actionLoading === review._id
                    }
                    onClick={() => handleReject(review, rejectionReason)}
                    variant="destructive"
                  >
                    {actionLoading === review._id
                      ? "Rejecting..."
                      : "Reject Review"}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedReview(null);
                      setRejectionReason("");
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CardContent>
  </Card>
);
