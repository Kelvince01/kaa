"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Flag,
  Home,
  MessageSquare,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReviewResponse } from "@/modules/reviews/components/display/review-response";
import { ReviewModal } from "@/modules/reviews/components/modals/review-modal";
import { ReviewResponseModal } from "@/modules/reviews/components/modals/review-response-modal";
import { useReview } from "@/modules/reviews/review.queries";

type ReviewDetailsPageProps = {
  reviewId: string;
  canEdit?: boolean;
  canRespond?: boolean;
  canFlag?: boolean;
  onBack?: () => void;
};

export function ReviewDetailsPage({
  reviewId,
  canEdit = false,
  canRespond = false,
  canFlag = false,
  onBack,
}: ReviewDetailsPageProps) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  // Fetch review data
  const { data: reviewResponse, isLoading, refetch } = useReview(reviewId);
  const review = reviewResponse?.review;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-semibold text-xl">Review not found</h2>
        <p className="mt-2 text-muted-foreground">
          The review you're looking for doesn't exist or has been removed.
        </p>
        <Button className="mt-4" onClick={onBack || (() => router.back())}>
          Go Back
        </Button>
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number, label?: string) => (
    <div className="flex items-center gap-2">
      {label && <span className="text-muted-foreground text-sm">{label}:</span>}
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
            key={i.toString()}
          />
        ))}
      </div>
      <span className="text-sm">{rating}/5</span>
    </div>
  );

  const getUserName = () => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.name || review.reviewer.email || "Anonymous";
    }
    return "Anonymous";
  };

  const getUserAvatar = () => {
    if (typeof review.reviewer === "object" && review.reviewer) {
      return review.reviewer.avatar;
    }
    return;
  };

  const getPropertyName = () => {
    if (typeof review.property === "object" && review.property) {
      return review.property.title || "Property";
    }
    return "Property";
  };

  const getStatusBadge = () => {
    const statusConfig = {
      pending: { variant: "outline" as const, label: "Pending Review" },
      approved: { variant: "default" as const, label: "Approved" },
      rejected: { variant: "destructive" as const, label: "Rejected" },
      flagged: { variant: "warning" as const, label: "Flagged" },
    };

    const config = statusConfig[review.status] || statusConfig.pending;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSaveResponse = (reviewId: string, response: string) => {
    // TODO: Implement save response API call
    console.log("Saving response:", { reviewId, response });
    setResponseModalOpen(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack || (() => router.back())}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-2xl">Review Details</h1>
            <p className="text-muted-foreground">Review by {getUserName()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canEdit && (
            <Button
              onClick={() => setEditModalOpen(true)}
              size="sm"
              variant="outline"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canRespond && (
            <Button
              onClick={() => setResponseModalOpen(true)}
              size="sm"
              variant="outline"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {review.response ? "Edit Response" : "Add Response"}
            </Button>
          )}
          {canFlag && (
            <Button size="sm" variant="outline">
              <Flag className="mr-2 h-4 w-4" />
              Flag
            </Button>
          )}
        </div>
      </div>

      {/* Review Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Main Review */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage alt={getUserName()} src={getUserAvatar()} />
                    <AvatarFallback>
                      {getInitials(getUserName())}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{getUserName()}</h3>
                      {review.isVerifiedStay && (
                        <Badge variant="secondary">Verified Stay</Badge>
                      )}
                      {getStatusBadge()}
                    </div>

                    <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(
                          new Date(review.createdAt || new Date()),
                          "MMM d, yyyy"
                        )}
                      </div>
                      <span>
                        {formatDistanceToNow(
                          new Date(review.createdAt || new Date()),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Overall Rating */}
              <div>
                <h4 className="mb-3 font-medium">Overall Rating</h4>
                {renderStars(review.rating)}
              </div>

              {/* Review Content */}
              <div>
                <h4 className="mb-2 font-medium">Review</h4>
                <h5 className="font-medium text-lg">{review.title}</h5>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              </div>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div>
                  <h4 className="mb-3 font-medium">Photos</h4>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {review.images.map((image, index) => (
                      <div className="group relative" key={index.toString()}>
                        {/** biome-ignore lint/nursery/useImageSize: by author */}
                        {/** biome-ignore lint/performance/noImgElement: by author */}
                        <img
                          alt={image.caption || `Review image ${index + 1}`}
                          className="aspect-square w-full rounded-lg object-cover"
                          src={image.url}
                        />
                        {image.caption && (
                          <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/50 p-2 text-white text-xs opacity-0 transition-opacity group-hover:opacity-100">
                            {image.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response */}
              <ReviewResponse
                canManageResponse={canRespond}
                onSaveResponse={handleSaveResponse}
                review={review}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{getPropertyName()}</p>
            </CardContent>
          </Card>

          {/* Detailed Ratings */}
          {(review.propertyRating ||
            review.landlordRating ||
            review.cleanliness ||
            review.location ||
            review.valueForMoney) && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.propertyRating &&
                  renderStars(review.propertyRating, "Property")}
                {review.landlordRating &&
                  renderStars(review.landlordRating, "Landlord")}
                {review.cleanliness &&
                  renderStars(review.cleanliness, "Cleanliness")}
                {review.location && renderStars(review.location, "Location")}
                {review.valueForMoney &&
                  renderStars(review.valueForMoney, "Value")}
              </CardContent>
            </Card>
          )}

          {/* Review Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Review Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Status</span>
                {getStatusBadge()}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Verified Stay
                </span>
                <Badge variant={review.isVerifiedStay ? "default" : "outline"}>
                  {review.isVerifiedStay ? "Yes" : "No"}
                </Badge>
              </div>

              {review.stayDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Stay Date
                  </span>
                  <span className="text-sm">
                    {format(new Date(review.stayDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Has Response
                </span>
                <Badge variant={review.response ? "default" : "outline"}>
                  {review.response ? "Yes" : "No"}
                </Badge>
              </div>

              {review.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <h5 className="font-medium text-red-900 text-sm">
                    Rejection Reason
                  </h5>
                  <p className="mt-1 text-red-700 text-sm">
                    {review.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ReviewModal
        isOpen={editModalOpen}
        mode="edit"
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
        review={review}
      />

      <ReviewResponseModal
        isOpen={responseModalOpen}
        onClose={() => setResponseModalOpen(false)}
        onSaveResponse={handleSaveResponse}
        review={review}
      />
    </div>
  );
}
