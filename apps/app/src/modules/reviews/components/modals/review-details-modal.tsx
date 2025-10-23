"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, Home, Image as ImageIcon, Star } from "lucide-react";
import type { Review } from "../../review.type";
import { ReviewResponse } from "../display/review-response";

type ReviewDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onEdit?: (review: Review) => void;
  onRespond?: (review: Review) => void;
  onFlag?: (review: Review) => void;
  canEdit?: boolean;
  canRespond?: boolean;
  canFlag?: boolean;
  onSaveResponse?: (reviewId: string, response: string) => void;
  onEditResponse?: (reviewId: string, response: string) => void;
  onDeleteResponse?: (reviewId: string) => void;
};

export function ReviewDetailsModal({
  isOpen,
  onClose,
  review,
  onEdit,
  onRespond,
  onFlag,
  canEdit = false,
  canRespond = false,
  canFlag = false,
  onSaveResponse,
  onEditResponse,
  onDeleteResponse,
}: ReviewDetailsModalProps) {
  if (!review) {
    return null;
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
    return "";
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
    };

    const config =
      statusConfig[review.status as keyof typeof statusConfig] ||
      statusConfig.pending;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage alt={getUserName()} src={getUserAvatar()} />
                <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
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

            {/* Actions */}
            <div className="flex gap-2">
              {canEdit && onEdit && (
                <Button
                  onClick={() => onEdit(review)}
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
              )}
              {canRespond && onRespond && (
                <Button
                  onClick={() => onRespond(review)}
                  size="sm"
                  variant="outline"
                >
                  Respond
                </Button>
              )}
              {canFlag && onFlag && (
                <Button
                  onClick={() => onFlag(review)}
                  size="sm"
                  variant="outline"
                >
                  Flag
                </Button>
              )}
            </div>
          </div>

          {/* Property Info */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Home className="h-4 w-4" />
              <span>Review for: {getPropertyName()}</span>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="space-y-3">
            <h4 className="font-medium">Overall Rating</h4>
            <div className="flex items-center gap-3">
              {renderStars(review.rating)}
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-3">
            <h4 className="font-medium">Review</h4>
            <div>
              <h5 className="font-medium text-lg">{review.title}</h5>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                {review.comment}
              </p>
            </div>
          </div>

          {/* Detailed Ratings */}
          {(review.propertyRating ||
            review.landlordRating ||
            review.cleanliness ||
            review.location ||
            review.valueForMoney) && (
            <div className="space-y-3">
              <h4 className="font-medium">Detailed Ratings</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {review.propertyRating &&
                  renderStars(review.propertyRating, "Property Quality")}
                {review.landlordRating &&
                  renderStars(review.landlordRating, "Landlord")}
                {review.cleanliness &&
                  renderStars(review.cleanliness, "Cleanliness")}
                {review.location && renderStars(review.location, "Location")}
                {review.valueForMoney &&
                  renderStars(review.valueForMoney, "Value for Money")}
              </div>
            </div>
          )}

          {/* Images */}
          {review.images && review.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <ImageIcon className="h-4 w-4" />
                Photos ({review.images.length})
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {review.images.map((image, index) => (
                  <div className="group relative" key={image.url}>
                    {/** biome-ignore lint/performance/noImgElement: by author */}
                    {/** biome-ignore lint/nursery/useImageSize: by author */}
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

          {/* Stay Information */}
          {review.stayDate && (
            <div className="space-y-3">
              <h4 className="font-medium">Stay Information</h4>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Stayed: {format(new Date(review.stayDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {review.status === "rejected" && review.rejectionReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="font-medium text-red-900">Rejection Reason</h4>
              <p className="mt-1 text-red-700 text-sm">
                {review.rejectionReason}
              </p>
            </div>
          )}

          {/* Response */}
          <ReviewResponse
            canManageResponse={canRespond}
            onDeleteResponse={onDeleteResponse}
            onEditResponse={onEditResponse}
            onSaveResponse={onSaveResponse}
            review={review}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
