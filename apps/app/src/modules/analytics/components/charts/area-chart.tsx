"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ChartData } from "../../analytics.type";

type AreaChartComponentProps = {
  title: string;
  data: ChartData;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  config?: ChartConfig;
};

export function AreaChartComponent({
  title,
  data,
  showLegend = true,
  showGrid = true,
  stacked = false,
  trend,
  className = "",
  config,
}: AreaChartComponentProps) {
  // Transform ChartData to recharts format
  const chartData = data.labels.map((label, index) => ({
    name: label,
    ...data.datasets.reduce(
      (acc, dataset) => {
        acc[dataset.label] = dataset?.data[index] || 0;
        return acc;
      },
      {} as Record<string, number>
    ),
  }));

  // Generate chart config if not provided
  const chartConfig: ChartConfig =
    config ||
    data.datasets.reduce((acc, dataset, index) => {
      const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];
      acc[dataset.label] = {
        label: dataset.label,
        color: colors[index % colors.length],
      };
      return acc;
    }, {} as ChartConfig);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {trend && (
            <Badge
              className="flex items-center space-x-1"
              variant={trend.isPositive ? "default" : "destructive"}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.value}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              axisLine={false}
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {showLegend && (
              <ChartLegend
                content={<ChartLegendContent payload={undefined} />}
              />
            )}
            {data.datasets.map((dataset) => (
              <Area
                dataKey={dataset.label}
                fill={`var(--color-${dataset.label})`}
                fillOpacity={0.6}
                key={dataset.label}
                stackId={stacked ? "1" : undefined}
                stroke={`var(--color-${dataset.label})`}
                strokeWidth={dataset.borderWidth || 2}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
