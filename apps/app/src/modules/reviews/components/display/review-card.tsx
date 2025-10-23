"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@kaa/ui/components/avatar";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { formatDistanceToNow } from "date-fns";
import { Flag, MessageSquare, Star, ThumbsUp } from "lucide-react";
import type { Review } from "../../review.type";

type ReviewCardProps = {
  review: Review;
  onHelpful?: (reviewId: string) => void;
  onFlag?: (reviewId: string) => void;
  onRespond?: (reviewId: string) => void;
  showActions?: boolean;
  showResponse?: boolean;
  compact?: boolean;
};

export function ReviewCard({
  review,
  onHelpful,
  onFlag,
  onRespond,
  showActions = true,
  showResponse = true,
  compact = false,
}: ReviewCardProps) {
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Star
        className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        key={i.toString()}
      />
    ));

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

  return (
    <Card className={`border border-gray-200 ${compact ? "p-4" : ""}`}>
      <CardContent className={compact ? "p-0" : "p-6"}>
        <div className="flex items-start gap-4">
          <Avatar className={`${compact ? "h-8 w-8" : "h-10 w-10"}`}>
            <AvatarImage alt={getUserName()} src={getUserAvatar()} />
            <AvatarFallback>{getInitials(getUserName())}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium ${compact ? "text-sm" : ""}`}>
                    {getUserName()}
                  </h4>
                  {review.isVerifiedStay && (
                    <Badge className="text-xs" variant="secondary">
                      Verified Stay
                    </Badge>
                  )}
                  {review.status === "pending" && (
                    <Badge className="text-xs" variant="outline">
                      Pending
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(
                      new Date(review.createdAt || new Date()),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </div>
              </div>

              {showActions && onFlag && (
                <Button
                  className="h-8 w-8 p-0"
                  onClick={() => onFlag(review._id)}
                  size="sm"
                  variant="ghost"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!compact && (
              <>
                <h5 className="mt-3 font-medium">{review.title}</h5>
                <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                  {review.comment}
                </p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {review.images.slice(0, 3).map((image, index) => (
                      // biome-ignore lint/nursery/useImageSize: by author
                      // biome-ignore lint/performance/noImgElement: by author
                      <img
                        alt={image.caption || `Review image ${index + 1}`}
                        className="h-16 w-16 rounded-lg object-cover"
                        key={index.toString()}
                        src={image.url}
                      />
                    ))}
                    {review.images.length > 3 && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-sm">
                        +{review.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Ratings */}
                {(review.cleanliness ||
                  review.location ||
                  review.valueForMoney ||
                  review.propertyRating ||
                  review.landlordRating) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {review.propertyRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Property:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.propertyRating)}
                        </div>
                      </div>
                    )}
                    {review.landlordRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Landlord:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.landlordRating)}
                        </div>
                      </div>
                    )}
                    {review.cleanliness && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Cleanliness:
                        </span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.cleanliness)}
                        </div>
                      </div>
                    )}
                    {review.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.location)}
                        </div>
                      </div>
                    )}
                    {review.valueForMoney && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Value:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(review.valueForMoney)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Actions */}
                {showActions && (
                  <div className="mt-4 flex items-center gap-4">
                    {onHelpful && (
                      <Button
                        className="text-xs"
                        onClick={() => onHelpful(review._id)}
                        size="sm"
                        variant="ghost"
                      >
                        <ThumbsUp className="mr-1 h-3 w-3" />
                        Helpful
                      </Button>
                    )}
                    {onRespond && (
                      <Button
                        className="text-xs"
                        onClick={() => onRespond(review._id)}
                        size="sm"
                        variant="ghost"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Respond
                      </Button>
                    )}
                  </div>
                )}

                {/* Landlord/Admin Response */}
                {showResponse && review.response && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="text-xs" variant="outline">
                        Response from landlord
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(
                          new Date(review.response.createdAt),
                          {
                            addSuffix: true,
                          }
                        )}
                      </span>
                    </div>
                    <p className="text-sm">{review.response.comment}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
