"use client";

import { Skeleton } from "@kaa/ui/components/skeleton";
import { useFinancialAnalytics } from "../../analytics.queries";
import type { ChartData } from "../../analytics.type";
import { generateTrendData, LineChartComponent } from "../charts";

type RevenueChartProps = {
  landlordId?: string;
  period?: "30d" | "90d" | "1y";
};

export function RevenueChart({
  landlordId,
  period = "30d",
}: RevenueChartProps) {
  const {
    data: financial,
    isLoading,
    error,
  } = useFinancialAnalytics(landlordId, period);

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (error || !financial) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load revenue data</p>
      </div>
    );
  }

  const chartData: ChartData = {
    labels: financial.revenue?.monthlyData?.map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: financial.revenue?.monthlyData?.map((item) => item.amount),
        borderColor: "#8884d8",
        backgroundColor: "#8884d8",
        borderWidth: 3,
        fill: false,
      },
      {
        label: "Bookings",
        data: financial.revenue?.monthlyData?.map((item) => item.count),
        borderColor: "#82ca9d",
        backgroundColor: "#82ca9d",
        borderWidth: 2,
        fill: false,
      },
    ],
  };

  const trend = generateTrendData(
    financial.revenue?.monthlyData?.map((item) => item.amount)
  );

  return (
    <LineChartComponent
      data={chartData}
      height={350}
      showGrid={true}
      showLegend={true}
      title="Revenue Trend"
      trend={trend}
    />
  );
}
