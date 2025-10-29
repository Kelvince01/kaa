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
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartData } from "../../analytics.type";

type MixedChartComponentProps = {
  title: string;
  data: ChartData;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  chartTypes?: ("line" | "bar" | "area")[]; // Map each dataset to a chart type
  className?: string;
  config?: ChartConfig;
};

export function MixedChartComponent({
  title,
  data,
  showLegend = true,
  showGrid = true,
  trend,
  chartTypes = [],
  className = "",
  config,
}: MixedChartComponentProps) {
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

  const renderComponent = (dataset: any, index: number) => {
    const chartType = chartTypes[index] || "line";
    const color = `var(--color-${dataset.label})`;

    switch (chartType) {
      case "bar":
        return (
          <Bar
            dataKey={dataset.label}
            fill={color}
            key={`bar-${dataset.label}`}
            radius={[2, 2, 0, 0]}
          />
        );
      case "area":
        return (
          <Area
            dataKey={dataset.label}
            fill={color}
            fillOpacity={0.6}
            key={`area-${dataset.label}`}
            stroke={color}
            strokeWidth={dataset.borderWidth || 2}
            type="monotone"
          />
        );
      // case "line":
      default:
        return (
          <Line
            activeDot={{ r: 6 }}
            dataKey={dataset.label}
            dot={{ r: 4 }}
            key={`line-${dataset.label}`}
            stroke={color}
            strokeWidth={dataset.borderWidth || 2}
            type="monotone"
          />
        );
    }
  };

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
          <ComposedChart data={chartData}>
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
            {data.datasets.map((dataset, index) =>
              renderComponent(dataset, index)
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
