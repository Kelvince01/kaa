"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { Star } from "lucide-react";
import type { Review } from "../../review.type";

type ReviewSummaryProps = {
  reviews: Review[];
  averageRating?: number;
  totalReviews?: number;
  className?: string;
  compact?: boolean;
};

export function ReviewSummary({
  reviews,
  averageRating,
  totalReviews,
  className,
  compact = false,
}: ReviewSummaryProps) {
  const calculatedAverage =
    averageRating ||
    (reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0);
  const calculatedTotal = totalReviews || reviews.length;

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === rating).length / reviews.length) *
          100
        : 0,
  }));

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    };

    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        className={`${sizeClasses[size]} ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
        key={i.toString()}
      />
    ));
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-1">
          {renderStars(Math.round(calculatedAverage))}
        </div>
        <span className="font-medium">{calculatedAverage.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">
          ({calculatedTotal} review{calculatedTotal !== 1 ? "s" : ""})
        </span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-start gap-6">
          <div className="text-center">
            <div className="font-bold text-4xl">
              {calculatedAverage.toFixed(1)}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1">
              {renderStars(Math.round(calculatedAverage), "lg")}
            </div>
            <div className="mt-1 text-muted-foreground text-sm">
              {calculatedTotal} review{calculatedTotal !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ rating, count, percentage }) => (
              <div className="flex items-center gap-3" key={rating}>
                <div className="flex w-12 items-center gap-1">
                  <span className="text-sm">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress className="h-2 flex-1" value={percentage} />
                <span className="w-8 text-muted-foreground text-sm">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Statistics */}
        {reviews.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
            <div className="text-center">
              <div className="font-semibold text-lg">
                {reviews.filter((r) => r.isVerifiedStay).length}
              </div>
              <div className="text-muted-foreground text-sm">
                Verified Stays
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {reviews.filter((r) => r.response).length}
              </div>
              <div className="text-muted-foreground text-sm">Responses</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {reviews.filter((r) => r.rating >= 4).length}
              </div>
              <div className="text-muted-foreground text-sm">4+ Stars</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">
                {reviews.filter((r) => r.images && r.images.length > 0).length}
              </div>
              <div className="text-muted-foreground text-sm">With Photos</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
