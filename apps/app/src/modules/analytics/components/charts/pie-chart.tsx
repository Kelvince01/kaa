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
import { Pie, PieChart } from "recharts";
import type { ChartData } from "../../analytics.type";

type PieChartComponentProps = {
  title: string;
  data: ChartData;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  config?: ChartConfig;
};

export function PieChartComponent({
  title,
  data,
  showLegend = true,
  showLabels = true,
  innerRadius = 0,
  outerRadius = 80,
  className = "",
  config,
}: PieChartComponentProps) {
  // Transform ChartData to recharts format for pie chart
  // For pie charts, we typically use the first dataset
  const dataset = data.datasets[0];
  const chartData = data.labels?.map((label, index) => ({
    name: label,
    value: dataset?.data[index],
    fill: `var(--color-${label})`,
  }));

  // Generate chart config if not provided
  const chartConfig: ChartConfig =
    config ||
    data.labels?.reduce((acc, label, index) => {
      const colors = [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ];
      acc[label] = {
        label,
        color: colors[index % colors.length],
      };
      return acc;
    }, {} as ChartConfig) ||
    {};

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        dominantBaseline="central"
        fill="white"
        fontSize={12}
        fontWeight="bold"
        textAnchor={x > cx ? "start" : "end"}
        x={x}
        y={y}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const total = chartData?.reduce((sum, entry) => sum + (entry.value || 0), 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge className="text-xs" variant="outline">
            Total: {total?.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[300px] w-full" config={chartConfig}>
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={chartData}
              dataKey="value"
              innerRadius={innerRadius}
              label={showLabels ? renderCustomLabel : false}
              labelLine={false}
              nameKey="name"
              outerRadius={outerRadius}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            {showLegend && (
              <ChartLegend
                content={<ChartLegendContent payload={undefined} />}
              />
            )}
          </PieChart>
        </ChartContainer>

        {/* Data Summary */}
        <div className="mt-4 space-y-2">
          {chartData?.map((entry, index) => {
            const chartKeys = Object.keys(chartConfig);
            const color =
              chartConfig[chartKeys[index % chartKeys.length] as any]?.color ||
              "hsl(var(--chart-1))";
            return (
              <div
                className="flex items-center justify-between text-sm"
                key={entry.name}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span>{entry.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {entry.value?.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    ({(((entry.value || 0) / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
