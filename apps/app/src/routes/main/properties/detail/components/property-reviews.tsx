/**
 * Property Reviews Component
 * Displays reviews for a property on the public property details page
 */
"use client";

import { ReviewStatus, ReviewType } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Star,
  ThumbsUp,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/modules/auth/use-auth";
import { CreateReviewForm } from "@/modules/reviews/components/create-review-form";
import { useReviewStats, useReviews } from "@/modules/reviews/review.queries";
import type { ReviewWithUser } from "@/modules/reviews/review.type";

type PropertyReviewsProps = {
  propertyId: string;
};

export function PropertyReviews({ propertyId }: PropertyReviewsProps) {
  const { status, isInitialized } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateReviewOpen, setIsCreateReviewOpen] = useState(false);
  const limit = 5;

  // Fetch approved reviews only
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({
    targetId: propertyId,
    type: ReviewType.PROPERTY,
    status: ReviewStatus.APPROVED,
    page: currentPage,
    limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data: statsData, isLoading: statsLoading } = useReviewStats(
    propertyId,
    "property"
  );

  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;
  const stats = statsData;

  // Loading state
  if (reviewsLoading && currentPage === 1) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="space-y-2" key={`stat-skeleton-${i.toString()}`}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Reviews skeleton */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="space-y-3" key={`review-skeleton-${i.toString()}`}>
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // No reviews state
  if (!(reviews.length || statsLoading)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">No reviews yet</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Be the first to review this property
            </p>
            {status === "authenticated" && isInitialized && (
              <Button onClick={() => setIsCreateReviewOpen(true)}>
                Write a Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({stats?.totalReviews || 0})
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        {stats && !statsLoading && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Average Rating */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-sm">Average Rating</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-3xl">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ 5.0</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      className={`h-4 w-4 ${
                        i < Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      key={`avg-star-${i.toString()}`}
                    />
                  ))}
                </div>
              </div>

              {/* Verification Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Verified Reviews</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-3xl">
                    {(stats.verificationRate * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  From verified tenants
                </p>
              </div>

              {/* Response Rate */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Response Rate</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-3xl">
                    {(stats.responseRate * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Landlord responses
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Rating Distribution</h4>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating] || 0;
                const percentage =
                  stats.totalReviews > 0
                    ? (count / stats.totalReviews) * 100
                    : 0;

                return (
                  <div className="flex items-center gap-3" key={rating}>
                    <div className="flex w-16 items-center gap-1">
                      <span className="font-medium text-sm">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress className="flex-1" value={percentage} />
                    <span className="w-12 text-right text-muted-foreground text-sm">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator />
          </>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review: ReviewWithUser | any) => (
            <div className="space-y-3" key={review._id}>
              {/* Reviewer Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    {review.reviewer?.avatar ? (
                      <Image
                        alt={
                          review.reviewer.firstName +
                          " " +
                          review.reviewer.lastName
                        }
                        className="rounded-full"
                        height={40}
                        src={review.reviewer.avatar}
                        width={40}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {review.reviewer?.firstName?.charAt(0).toUpperCase() +
                          review.reviewer?.lastName?.charAt(0).toUpperCase() ||
                          "A"}
                      </div>
                    )}
                    {review.isVerifiedReviewer && (
                      <div className="-bottom-1 -right-1 absolute rounded-full bg-white p-0.5">
                        <UserCheck className="h-3 w-3 text-green-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {review.isAnonymous
                        ? "Anonymous Reviewer"
                        : review.reviewer?.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      className={`h-4 w-4 ${
                        i < review.overallRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                      key={`star-${review._id}-${i.toString()}`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Title */}
              {review.title && (
                <h4 className="font-semibold text-base">{review.title}</h4>
              )}

              {/* Review Content */}
              <p className="text-gray-700">{review.content}</p>

              {/* Review Photos */}
              {review.photos && review.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {review.photos.slice(0, 3).map((photo: string) => (
                    <div
                      className="relative h-24 overflow-hidden rounded-md"
                      key={photo}
                    >
                      <Image
                        alt="Review photo"
                        className="object-cover"
                        fill
                        src={photo}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Review Tags */}
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Helpful Count */}
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <button
                  className="flex items-center gap-1 transition-colors hover:text-foreground"
                  type="button"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Helpful ({review.helpfulCount || 0})</span>
                </button>
              </div>

              {/* Landlord Response */}
              {review.response && (
                <div className="mt-3 ml-8 rounded-lg border-primary border-l-2 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="font-medium text-sm">
                      Response from Landlord
                    </p>
                    <Badge variant="outline">Landlord</Badge>
                  </div>
                  <p className="text-gray-700 text-sm">
                    {review.response.content}
                  </p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(review.response.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}

              <Separator />
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * limit + 1} to{" "}
              {Math.min(pagination.page * limit, pagination.total)} of{" "}
              {pagination.total} reviews
            </p>

            <div className="flex items-center gap-2">
              <Button
                disabled={pagination.page === 1}
                onClick={() => setCurrentPage(pagination.page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>

              <Button
                disabled={pagination.page === pagination.pages}
                onClick={() => setCurrentPage(pagination.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Write Review CTA */}
        {status === "authenticated" && isInitialized && (
          <>
            <Separator />
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <p className="font-medium">Have you lived here?</p>
                <p className="text-muted-foreground text-sm">
                  Share your experience with others
                </p>
              </div>
              <Button onClick={() => setIsCreateReviewOpen(true)}>
                Write a Review
              </Button>
            </div>
          </>
        )}
      </CardContent>

      {/* Create Review Dialog */}
      <Dialog onOpenChange={setIsCreateReviewOpen} open={isCreateReviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <CreateReviewForm
            onCancel={() => setIsCreateReviewOpen(false)}
            onSuccess={() => {
              setIsCreateReviewOpen(false);
              // Refresh to first page to see the new review after moderation
              setCurrentPage(1);
            }}
            targetId={propertyId}
            type="property"
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
