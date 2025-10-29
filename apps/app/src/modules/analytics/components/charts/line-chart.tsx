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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import type { ChartData } from "../../analytics.type";

export type LineChartComponentProps = {
  title: string;
  data: ChartData;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  config?: ChartConfig;
};

export function LineChartComponent({
  title,
  data,
  showLegend = true,
  showGrid = true,
  trend,
  className = "",
  config,
}: LineChartComponentProps) {
  // Transform ChartData to recharts format
  const chartData = data.labels?.map((label, index) => ({
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
          <LineChart data={chartData}>
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
              <Line
                activeDot={{ r: 6 }}
                dataKey={dataset.label}
                dot={{ r: 4 }}
                key={dataset.label}
                stroke={`var(--color-${dataset.label})`}
                strokeWidth={dataset.borderWidth || 2}
                type="monotone"
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
