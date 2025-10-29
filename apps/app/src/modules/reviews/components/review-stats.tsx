/**
 * Review Stats Component
 * Displays review statistics and rating distribution
 */

"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  BarChart3,
  CheckCircle,
  Languages,
  MessageCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import type { IReviewStatsResponse } from "../review.type";

type ReviewStatsProps = {
  stats: IReviewStatsResponse | undefined;
  isLoading?: boolean;
};

export const ReviewStats = ({ stats, isLoading }: ReviewStatsProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`skeleton-${i.toString()}`}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getRatingPercentage = (rating: number): number => {
    const total = Object.values(stats.ratingDistribution).reduce(
      (a, b) => a + b,
      0
    );
    return total > 0
      ? (stats.ratingDistribution?.[rating] ?? 0 / total) * 100
      : 0;
  };

  const totalSentiment =
    stats.sentimentDistribution.positive +
    stats.sentimentDistribution.negative +
    stats.sentimentDistribution.neutral +
    stats.sentimentDistribution.mixed;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Total Reviews</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="mt-1 flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  className={`h-4 w-4 ${
                    i < Math.round(stats.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                  key={`star-${i.toString()}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">
              Verification Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {(stats.verificationRate * 100).toFixed(0)}%
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              Verified reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-sm">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {(stats.responseRate * 100).toFixed(0)}%
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              Reviews with responses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div className="flex items-center gap-3" key={rating}>
              <div className="flex w-16 items-center gap-1">
                <span className="font-medium text-sm">{rating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
              <Progress
                className="flex-1"
                value={getRatingPercentage(rating)}
              />
              <span className="w-12 text-right text-muted-foreground text-sm">
                {stats.ratingDistribution[rating] || 0}
              </span>
              <span className="w-12 text-right text-muted-foreground text-xs">
                {getRatingPercentage(rating).toFixed(0)}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Positive",
                value: stats.sentimentDistribution.positive,
                color: "bg-green-500",
              },
              {
                label: "Neutral",
                value: stats.sentimentDistribution.neutral,
                color: "bg-gray-500",
              },
              {
                label: "Negative",
                value: stats.sentimentDistribution.negative,
                color: "bg-red-500",
              },
              {
                label: "Mixed",
                value: stats.sentimentDistribution.mixed,
                color: "bg-blue-500",
              },
            ].map((sentiment) => (
              <div className="flex items-center gap-3" key={sentiment.label}>
                <div className={`h-3 w-3 rounded-full ${sentiment.color}`} />
                <span className="flex-1 font-medium text-sm">
                  {sentiment.label}
                </span>
                <span className="text-muted-foreground text-sm">
                  {sentiment.value}
                </span>
                <span className="w-12 text-right text-muted-foreground text-xs">
                  {totalSentiment > 0
                    ? ((sentiment.value / totalSentiment) * 100).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Language Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">English</Badge>
                <span className="text-muted-foreground text-sm">
                  {stats.languageDistribution.en} reviews
                </span>
              </div>
              <span className="font-medium text-sm">
                {(
                  (stats.languageDistribution.en /
                    (stats.languageDistribution.en +
                      stats.languageDistribution.sw)) *
                  100
                ).toFixed(0)}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Swahili</Badge>
                <span className="text-muted-foreground text-sm">
                  {stats.languageDistribution.sw} reviews
                </span>
              </div>
              <span className="font-medium text-sm">
                {(
                  (stats.languageDistribution.sw /
                    (stats.languageDistribution.en +
                      stats.languageDistribution.sw)) *
                  100
                ).toFixed(0)}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
