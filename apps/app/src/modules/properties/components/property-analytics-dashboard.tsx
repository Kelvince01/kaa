"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { Separator } from "@kaa/ui/components/separator";
import {
  BarChart3,
  Building2,
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMarketInsights, usePropertyAnalytics } from "../property.queries";

type PropertyAnalyticsDashboardProps = {
  propertyId: string;
  location: string;
  className?: string;
};

export function PropertyAnalyticsDashboard({
  propertyId,
  location,
  className,
}: PropertyAnalyticsDashboardProps) {
  const analytics = usePropertyAnalytics(propertyId);
  const marketInsights = useMarketInsights(location);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCompetitionLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (analytics.isLoading || marketInsights.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading analytics...</span>
        </CardContent>
      </Card>
    );
  }

  if (analytics.isError || marketInsights.isError) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Failed to load analytics data. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const analyticsData = analytics.data;
  const marketData = marketInsights.data;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 font-bold text-2xl">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          Property Analytics Dashboard
        </h2>
        <p className="text-muted-foreground">
          Comprehensive insights into your property's performance and market
          position
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Performance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Property Performance
              </CardTitle>
              <CardDescription>
                Key metrics and engagement statistics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData && (
                <>
                  {/* Views */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">Views</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {analyticsData.views.total.toLocaleString()}
                        </span>
                        {getTrendIcon(analyticsData.views.trend)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-muted-foreground text-xs">
                      <span>Last 7 days: {analyticsData.views.last7Days}</span>
                      <span>
                        Last 30 days: {analyticsData.views.last30Days}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Favorites */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">Favorites</span>
                      </div>
                      <span className="font-bold text-sm">
                        {analyticsData.favorites.total}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-muted-foreground text-xs">
                      <span>
                        Last 7 days: {analyticsData.favorites.last7Days}
                      </span>
                      <span>
                        Last 30 days: {analyticsData.favorites.last30Days}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Inquiries */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm">Inquiries</span>
                      </div>
                      <span className="font-bold text-sm">
                        {analyticsData.inquiries.total}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Conversion Rate
                        </span>
                        <span className="font-medium">
                          {analyticsData.inquiries.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        className="h-1"
                        value={analyticsData.inquiries.conversionRate}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Market Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                Market Position
              </CardTitle>
              <CardDescription>
                How your property compares to the market
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Price Rank
                      </p>
                      <p className="font-bold text-lg">
                        #{analyticsData.marketPosition.priceRank}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Price Percentile
                      </p>
                      <p className="font-bold text-lg">
                        {analyticsData.marketPosition.pricePercentile.toFixed(
                          0
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Days on Market</span>
                      <span className="font-bold text-sm">
                        {analyticsData.marketPosition.daysOnMarket}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Competition Level</span>
                      <Badge
                        className={getCompetitionLevelColor(
                          analyticsData.marketPosition.competitionLevel
                        )}
                      >
                        {analyticsData.marketPosition.competitionLevel}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Market Insights & ROI */}
        <div className="space-y-6">
          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-500" />
                Market Insights
              </CardTitle>
              <CardDescription>
                Local market trends and predictions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketData && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Average Rent
                      </p>
                      <p className="font-bold text-lg">
                        KES{" "}
                        {marketData.marketMetrics.averageRent.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Median Rent
                      </p>
                      <p className="font-bold text-lg">
                        KES{" "}
                        {marketData.marketMetrics.medianRent.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rent Trend</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(marketData.trends.rentTrend)}
                        <span className="text-sm capitalize">
                          {marketData.trends.rentTrend}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Demand</span>
                      <Badge className="capitalize" variant="outline">
                        {marketData.trends.demandTrend}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Supply</span>
                      <Badge className="capitalize" variant="outline">
                        {marketData.trends.supplyTrend}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Price Predictions</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Next Month</span>
                        <span className="font-medium">
                          KES{" "}
                          {marketData.predictions.nextMonthRent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next 6 Months</span>
                        <span className="font-medium">
                          KES{" "}
                          {marketData.predictions.next6MonthsRent.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Year</span>
                        <span className="font-medium">
                          KES{" "}
                          {marketData.predictions.nextYearRent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ROI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                ROI Analysis
              </CardTitle>
              <CardDescription>Investment performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData && (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Estimated Annual Return
                      </p>
                      <p className="font-bold text-green-600 text-lg">
                        {analyticsData.roi.estimatedAnnualReturn.toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Capital Appreciation
                      </p>
                      <p className="font-bold text-blue-600 text-lg">
                        {analyticsData.roi.capitalAppreciation.toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs">
                        Rental Yield
                      </p>
                      <p className="font-bold text-lg text-purple-600">
                        {analyticsData.roi.rentalYield.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Performance Summary</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Total Return</span>
                        <span className="font-medium">
                          {(
                            analyticsData.roi.estimatedAnnualReturn +
                            analyticsData.roi.capitalAppreciation
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level</span>
                        <Badge className="text-xs" variant="outline">
                          {analyticsData.roi.rentalYield > 8
                            ? "Low"
                            : analyticsData.roi.rentalYield > 5
                              ? "Medium"
                              : "High"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparable Properties */}
      {marketData && marketData.comparables.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comparable Properties</CardTitle>
            <CardDescription>
              Similar properties in the area for market comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {marketData.comparables.slice(0, 6).map((comp, index) => (
                <div
                  className="space-y-2 rounded-lg border p-3"
                  key={index.toString()}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      KES {comp.rentAmount.toLocaleString()}
                    </span>
                    <Badge className="text-xs" variant="outline">
                      {comp.bedrooms} bed
                    </Badge>
                  </div>
                  <div className="space-y-1 text-muted-foreground text-xs">
                    <div className="flex justify-between">
                      <span>Size</span>
                      <span>{comp.size} sqm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance</span>
                      <span>{comp.distance.toFixed(1)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Similarity</span>
                      <span>{(comp.similarity * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
