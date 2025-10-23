"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
// import { ReviewSummary } from "../display/review-summary";
import type { Review } from "../../review.type";

type ReviewAnalyticsProps = {
  reviews: Review[];
  timeRange?: "week" | "month" | "quarter" | "year" | "all";
  onTimeRangeChange?: (range: string) => void;
  className?: string;
};

export function ReviewAnalytics({
  reviews,
  timeRange = "month",
  onTimeRangeChange,
  className,
}: ReviewAnalyticsProps) {
  // Calculate date range
  const getDateCutoff = (range: string) => {
    const now = new Date();
    switch (range) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "quarter":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "year":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  };

  const dateCutoff = getDateCutoff(timeRange);
  const filteredReviews = reviews.filter(
    (review) => new Date(review.createdAt || 0) >= dateCutoff
  );

  // Calculate metrics
  const totalReviews = reviews.length;
  const periodReviews = filteredReviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

  const statusCounts = {
    approved: reviews.filter((r) => r.status === "approved").length,
    pending: reviews.filter((r) => r.status === "pending").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const verifiedCount = reviews.filter((r) => r.isVerifiedStay).length;
  const withResponseCount = reviews.filter((r) => r.response).length;
  const withImagesCount = reviews.filter(
    (r) => r.images && r.images.length > 0
  ).length;

  // Rating trends (comparing current period to previous period)
  const previousPeriodStart = new Date(
    dateCutoff.getTime() - (Date.now() - dateCutoff.getTime())
  );
  const previousPeriodReviews = reviews.filter((review) => {
    const reviewDate = new Date(review.createdAt || 0);
    return reviewDate >= previousPeriodStart && reviewDate < dateCutoff;
  });

  const currentPeriodAverage =
    periodReviews > 0
      ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) /
        periodReviews
      : 0;

  const previousPeriodAverage =
    previousPeriodReviews.length > 0
      ? previousPeriodReviews.reduce((sum, review) => sum + review.rating, 0) /
        previousPeriodReviews.length
      : 0;

  const ratingTrend = currentPeriodAverage - previousPeriodAverage;
  const reviewCountTrend = periodReviews - previousPeriodReviews.length;

  // Response rate
  const responseRate =
    totalReviews > 0 ? (withResponseCount / totalReviews) * 100 : 0;

  // Rating distribution for current period
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: filteredReviews.filter((r) => r.rating === rating).length,
    percentage:
      periodReviews > 0
        ? (filteredReviews.filter((r) => r.rating === rating).length /
            periodReviews) *
          100
        : 0,
  }));

  const formatTrend = (value: number, isPercentage = false) => {
    const sign = value > 0 ? "+" : "";
    const suffix = isPercentage ? "%" : "";
    return `${sign}${value.toFixed(1)}${suffix}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-2xl">Review Analytics</h2>
        <Select onValueChange={onTimeRangeChange} value={timeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Past Week</SelectItem>
            <SelectItem value="month">Past Month</SelectItem>
            <SelectItem value="quarter">Past Quarter</SelectItem>
            <SelectItem value="year">Past Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">{periodReviews}</p>
                <p className="text-muted-foreground text-sm">Reviews</p>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {reviewCountTrend !== 0 && (
              <div className="mt-2">
                <TrendIndicator value={reviewCountTrend} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {currentPeriodAverage.toFixed(1)}
                </p>
                <p className="text-muted-foreground text-sm">Avg Rating</p>
              </div>
              <div className="rounded-full bg-yellow-100 p-2">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            {ratingTrend !== 0 && (
              <div className="mt-2">
                <TrendIndicator value={ratingTrend} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-2xl">
                  {responseRate.toFixed(0)}%
                </p>
                <p className="text-muted-foreground text-sm">Response Rate</p>
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
                <p className="font-semibold text-2xl">{verifiedCount}</p>
                <p className="text-muted-foreground text-sm">Verified Stays</p>
              </div>
              <div className="rounded-full bg-purple-100 p-2">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-xl">{statusCounts.approved}</p>
                <p className="text-muted-foreground text-sm">Approved</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Progress
              className="mt-2 h-2"
              value={(statusCounts.approved / totalReviews) * 100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-xl">{statusCounts.pending}</p>
                <p className="text-muted-foreground text-sm">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <Progress
              className="mt-2 h-2"
              value={(statusCounts.pending / totalReviews) * 100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-xl">{statusCounts.rejected}</p>
                <p className="text-muted-foreground text-sm">Rejected</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <Progress
              className="mt-2 h-2"
              value={(statusCounts.rejected / totalReviews) * 100}
            />
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div className="flex items-center gap-4" key={rating}>
                <div className="flex w-16 items-center gap-1">
                  <span className="text-sm">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <Progress className="h-3 flex-1" value={percentage} />
                <div className="flex w-24 items-center justify-between text-sm">
                  <span>{count}</span>
                  <span className="text-muted-foreground">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Review Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">With Photos</span>
              <Badge variant="secondary">{withImagesCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Verified Stays</span>
              <Badge variant="secondary">{verifiedCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg. Comment Length</span>
              <Badge variant="secondary">
                {totalReviews > 0
                  ? Math.round(
                      reviews.reduce((sum, r) => sum + r.comment.length, 0) /
                        totalReviews
                    )
                  : 0}{" "}
                chars
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Response Rate</span>
              <Badge variant="secondary">{responseRate.toFixed(0)}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Avg. Response Time</span>
              <Badge variant="secondary">2.3 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reviews This {timeRange}</span>
              <Badge variant="secondary">{periodReviews}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const TrendIndicator = ({
  value,
  inverse = false,
}: {
  value: number;
  inverse?: boolean;
}) => {
  const isPositive = inverse ? value < 0 : value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium text-sm">{Math.abs(value).toFixed(1)}</span>
    </div>
  );
};
