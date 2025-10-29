"use client";

import { Skeleton } from "@kaa/ui/components/skeleton";
import { usePortfolioAnalytics } from "../../analytics.queries";
import type { ChartData } from "../../analytics.type";
import { BarChartComponent } from "../charts";

type PerformanceComparisonChartProps = {
  landlordId?: string;
  period?: "30d" | "90d" | "1y";
  metric?: "roi" | "score" | "value";
};

export function PerformanceComparisonChart({
  landlordId,
  period = "30d",
  metric = "score",
}: PerformanceComparisonChartProps) {
  const {
    data: portfolio,
    isLoading,
    error,
  } = usePortfolioAnalytics(landlordId, period);

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (error || !portfolio) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load performance data</p>
      </div>
    );
  }

  // Combine top and under performers for comparison
  const allProperties = [
    ...(portfolio.topPerformers || []).map((p) => ({
      ...p,
      category: "Top Performer",
    })),
    ...(portfolio.underPerformers || []).map((p) => ({
      ...p,
      category: "Under Performer",
      score: 0, // Under performers don't have scores in the type
      roi: 0, // Under performers don't have ROI in the type
    })),
  ];

  const getMetricValue = (property: any) => {
    switch (metric) {
      case "roi":
        return property.roi || 0;
      case "value":
        return Math.random() * 500_000 + 200_000; // Mock property value
      // case 'score':
      default:
        return property.score || 0;
    }
  };

  const getMetricLabel = () => {
    switch (metric) {
      case "roi":
        return "ROI (%)";
      case "value":
        return "Property Value (£)";
      // case 'score':
      default:
        return "Performance Score";
    }
  };

  const chartData: ChartData = {
    labels: allProperties.map(
      (p) => p.title.substring(0, 20) + (p.title.length > 20 ? "..." : "")
    ),
    datasets: [
      {
        label: getMetricLabel(),
        data: allProperties.map(getMetricValue),
        backgroundColor: allProperties.map((p) =>
          p.category === "Top Performer" ? "#82ca9d" : "#ff7300"
        ),
      },
    ],
  };

  return (
    <BarChartComponent
      data={chartData}
      height={400}
      orientation="vertical"
      showGrid={true}
      showLegend={false}
      title={`Property Performance Comparison (${getMetricLabel()})`}
    />
  );
}
