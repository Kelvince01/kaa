"use client";

import { Skeleton } from "@kaa/ui/components/skeleton";
import { useConversionFunnel } from "../../analytics.queries";
import type { ChartData } from "../../analytics.type";
import { AreaChartComponent } from "../charts";

type EngagementFunnelChartProps = {
  funnel: string;
  period?: "7d" | "30d" | "90d";
};

export function EngagementFunnelChart({
  funnel,
  period = "30d",
}: EngagementFunnelChartProps) {
  const {
    data: funnelData,
    isLoading,
    error,
  } = useConversionFunnel(funnel, {
    startDate: new Date(
      Date.now() -
        (period === "7d" ? 7 : period === "30d" ? 30 : 90) * 24 * 60 * 60 * 1000
    ).toISOString(),
    endDate: new Date().toISOString(),
  });

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (error || !funnelData) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <p className="text-muted-foreground">Failed to load funnel data</p>
      </div>
    );
  }

  const chartData: ChartData = {
    labels: funnelData.steps.map((step) => step.name),
    datasets: [
      {
        label: "Users",
        data: funnelData.steps.map((step) => step.users),
        borderColor: "#8884d8",
        backgroundColor: "rgba(136, 132, 216, 0.6)",
        borderWidth: 2,
        fill: true,
      },
      {
        label: "Conversion Rate (%)",
        data: funnelData.steps.map((step) => step.conversionRate),
        borderColor: "#82ca9d",
        backgroundColor: "rgba(130, 202, 157, 0.3)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-4">
      <AreaChartComponent
        data={chartData}
        height={350}
        showGrid={true}
        showLegend={true}
        stacked={false}
        title={`${funnel} Conversion Funnel`}
        trend={{
          value: `${funnelData.overallConversionRate.toFixed(1)}% overall`,
          isPositive: funnelData.overallConversionRate > 10, // Arbitrary threshold
        }}
      />

      {/* Funnel Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {funnelData.steps.map((step) => (
          <div className="rounded-lg bg-muted/50 p-3" key={step.name}>
            <h4 className="mb-1 font-medium text-sm">{step.name}</h4>
            <p className="font-bold text-2xl">{step.users.toLocaleString()}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-green-600 text-xs">
                {step.conversionRate.toFixed(1)}% convert
              </span>
              <span className="text-red-600 text-xs">
                {step.dropOffRate.toFixed(1)}% drop off
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
