"use client";

import { Skeleton } from "@kaa/ui/components/skeleton";
import { usePortfolioAnalytics } from "../../analytics.queries";
import type { ChartData } from "../../analytics.type";
import { PieChartComponent } from "../charts";

type PropertyDistributionChartProps = {
  landlordId?: string;
  period?: "30d" | "90d" | "1y";
  type?: "type" | "location" | "priceRange";
};

export function PropertyDistributionChart({
  landlordId,
  period = "30d",
  type = "type",
}: PropertyDistributionChartProps) {
  const {
    data: portfolio,
    isLoading,
    error,
  } = usePortfolioAnalytics(landlordId, period);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (error || !portfolio) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load portfolio data</p>
      </div>
    );
  }

  const getDistributionData = () => {
    switch (type) {
      case "location":
        return portfolio.distribution.location;
      case "priceRange":
        return portfolio.distribution.priceRange;
      // case "type":
      default:
        return portfolio.distribution?.type;
    }
  };

  const distributionData = getDistributionData();

  const chartData: ChartData = {
    labels: distributionData?.map((item: any) =>
      type === "type"
        ? item.type
        : type === "location"
          ? item.location
          : item.range
    ),
    datasets: [
      {
        label: "Properties",
        data: distributionData?.map((item) => item.count),
        backgroundColor: [
          "#8884d8",
          "#82ca9d",
          "#ffc658",
          "#ff7300",
          "#00ff00",
          "#ff00ff",
          "#00ffff",
          "#ff0000",
        ],
      },
    ],
  };

  const getTitleSuffix = () => {
    switch (type) {
      case "location":
        return "by Location";
      case "priceRange":
        return "by Price Range"; // case "type":
      default:
        return "by Type";
    }
  };

  return (
    <PieChartComponent
      data={chartData}
      height={350}
      innerRadius={60}
      outerRadius={120}
      showLabels={true}
      showLegend={true}
      title={`Property Distribution ${getTitleSuffix()}`}
    />
  );
}
