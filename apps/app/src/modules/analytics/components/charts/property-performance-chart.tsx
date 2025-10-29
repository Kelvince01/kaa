"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  usePropertyAnalytics,
  usePropertyPerformance,
} from "../../analytics.queries";
import { BarChartComponent, LineChartComponent } from "./index";

type PropertyPerformanceChartProps = {
  propertyId: string;
  period?: "7d" | "30d" | "90d" | "1y";
};

export function PropertyPerformanceChart({
  propertyId,
  period = "30d",
}: PropertyPerformanceChartProps) {
  const {
    data: performance,
    isLoading,
    error,
  } = usePropertyPerformance(propertyId, period);
  const { data: analytics } = usePropertyAnalytics(propertyId, {
    startDate: new Date(
      Date.now() -
        (period === "7d"
          ? 7
          : period === "30d"
            ? 30
            : period === "90d"
              ? 90
              : 365) *
          24 *
          60 *
          60 *
          1000
    ).toISOString(),
    endDate: new Date().toISOString(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i.toString()}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !performance) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Failed to load property performance data
        </p>
      </div>
    );
  }

  const formatTrend = (trend: number) => {
    const isPositive = trend >= 0;
    return {
      value: `${isPositive ? "+" : ""}${trend.toFixed(1)}%`,
      isPositive,
    };
  };

  const performanceCards = [
    {
      title: "Total Views",
      value: performance.views.total.toLocaleString(),
      thisMonth: performance.views.thisMonth,
      trend: formatTrend(performance.views.trend),
      icon: Eye,
      color: "blue",
    },
    {
      title: "Inquiries",
      value: performance.inquiries.total.toLocaleString(),
      thisMonth: performance.inquiries.thisMonth,
      trend: formatTrend(performance.inquiries.responseRate),
      icon: MessageSquare,
      color: "green",
    },
    {
      title: "Favorites",
      value: performance.engagement.favorites.toLocaleString(),
      thisMonth: performance.engagement.contactAttempts,
      trend: formatTrend(10.5), // Mock trend
      icon: Heart,
      color: "red",
    },
    {
      title: "Viewing Requests",
      value: performance.engagement.viewingRequests.toLocaleString(),
      thisMonth: performance.engagement.shares,
      trend: formatTrend(15.2), // Mock trend
      icon: Calendar,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceCards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trend.isPositive ? TrendingUp : TrendingDown;

          return (
            <Card key={index.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{card.value}</div>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge
                    className="flex items-center space-x-1 text-xs"
                    variant={card.trend.isPositive ? "default" : "destructive"}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{card.trend.value}</span>
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    vs last period
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Property Performance Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Viewer Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-medium text-sm">Age Distribution</h4>
                <div className="space-y-2">
                  {performance.demographics.viewerAge.map((age, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={index.toString()}
                    >
                      <span className="text-sm">{age.range}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground text-sm">
                          {age.percentage.toFixed(1)}%
                        </span>
                        <div className="h-2 w-16 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${age.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-sm">Viewer Type</h4>
                <div className="space-y-2">
                  {performance.demographics.viewerType.map((type, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={index.toString()}
                    >
                      <span className="text-sm capitalize">{type.type}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground text-sm">
                          {type.percentage.toFixed(1)}%
                        </span>
                        <div className="h-2 w-16 rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Peak Viewing Times</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance.demographics.peakTimes.map((time, index) => (
                <div
                  className="flex items-center justify-between"
                  key={index.toString()}
                >
                  <span className="font-medium text-sm">{time.time}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground text-sm">
                      {time.views} views
                    </span>
                    <div className="h-2 w-20 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${(time.views / Math.max(...performance.demographics.peakTimes.map((t) => t.views))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Property Rank</p>
              <p className="font-bold text-2xl">
                #{performance.performance.rank} of{" "}
                {performance.performance.totalProperties}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                in {performance.performance.category}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Performance Score</p>
              <div className="font-bold text-3xl text-primary">
                {performance.performance.score.toFixed(1)}
              </div>
              <p className="text-muted-foreground text-sm">out of 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Charts */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Views Trend Chart */}
          <LineChartComponent
            data={{
              labels: analytics.chartData.views.labels,
              datasets: [
                {
                  label: "Views",
                  data: analytics.chartData.views.data,
                  borderColor: "#8884d8",
                  backgroundColor: "#8884d8",
                  borderWidth: 2,
                  fill: false,
                },
              ],
            }}
            height={300}
            showGrid={true}
            showLegend={false}
            title="Property Views Trend"
            trend={formatTrend(performance.views.trend)}
          />

          {/* Engagement Chart */}
          <BarChartComponent
            data={{
              labels: analytics.chartData.engagement.labels,
              datasets: [
                {
                  label: "Engagement",
                  data: analytics.chartData.engagement.data,
                  backgroundColor: ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"],
                },
              ],
            }}
            height={300}
            showGrid={true}
            showLegend={false}
            title="Engagement Metrics"
          />
        </div>
      )}
    </div>
  );
}
