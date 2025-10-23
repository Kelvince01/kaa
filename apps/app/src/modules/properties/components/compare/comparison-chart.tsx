import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import type { Property } from "../../property.type";
import type { ComparisonField } from "./index";

type ComparisonChartProps = {
  properties: Property[];
  fields: ComparisonField[];
  getPropertyValue: (property: Property, fieldKey: string) => any;
};

const chartColors = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  accent: "var(--chart-3)",
  warning: "var(--chart-4)",
  info: "var(--chart-5)",
  success: "var(--chart-6)",
  danger: "var(--chart-7)",
  muted: "var(--chart-8)",
};

const COLORS = Object.values(chartColors);

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  properties,
  fields,
  getPropertyValue,
}) => {
  // Chart configuration for shadcn/ui charts
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};

    // Add configuration for each property
    properties.forEach((property, index) => {
      const key = property.title
        .substring(0, 15)
        .replace(/\s+/g, "_")
        .toLowerCase();
      config[key] = {
        label: property.title,
        color: COLORS[index % COLORS.length],
      };
    });

    // Add configuration for numeric fields
    fields
      .filter((f) => f.type === "number" || f.type === "price")
      .forEach((field, index) => {
        config[field.key] = {
          label: field.label,
          color: COLORS[index % COLORS.length],
        };
      });

    return config;
  }, [properties, fields]);

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    const numericFields = fields.filter(
      (field) => field.type === "number" || field.type === "price"
    );

    // Bar chart data
    const barData = properties.map((property, index) => {
      const dataPoint: any = {
        name:
          property.title.length > 20
            ? `${property.title.substring(0, 20)}...`
            : property.title,
        fullName: property.title,
        color: COLORS[index % COLORS.length],
      };

      for (const field of numericFields) {
        const value = getPropertyValue(property, field.key);
        dataPoint[field.label] = typeof value === "number" ? value : 0;
      }

      return dataPoint;
    });

    // Radar chart data
    const radarData = numericFields.map((field) => {
      const dataPoint: any = {
        field: field.label,
        fullField: field.label,
      };

      for (const property of properties) {
        const value = getPropertyValue(property, field.key);
        const numValue = typeof value === "number" ? value : 0;

        // Normalize values for radar chart (0-100 scale)
        const maxValue = Math.max(
          ...properties.map((p) => {
            const v = getPropertyValue(p, field.key);
            return typeof v === "number" ? v : 0;
          })
        );

        const normalizedValue = maxValue > 0 ? (numValue / maxValue) * 100 : 0;
        dataPoint[property.title.substring(0, 15)] = normalizedValue;
      }

      return dataPoint;
    });

    // Pie chart data for price distribution
    const pieData = properties.map((property, index) => ({
      name:
        property.title.length > 15
          ? `${property.title.substring(0, 15)}...`
          : property.title,
      value: property.pricing.rent,
      color: COLORS[index % COLORS.length],
    }));

    return { barData, radarData, pieData, numericFields };
  }, [properties, fields, getPropertyValue]);

  if (properties.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No properties selected for comparison
      </div>
    );
  }

  if (chartData.numericFields.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 font-medium text-lg">
            No Numeric Data Available
          </h3>
          <p className="mt-2 text-muted-foreground text-sm">
            Charts require numeric fields like price, size, bedrooms, etc. Try
            selecting different comparison categories.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bar Chart - Numeric Comparison */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Numeric Comparison
            </CardTitle>
            <CardDescription>
              Side-by-side comparison of numeric values for each property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              className="aspect-auto h-96 w-full"
              config={chartConfig}
            >
              <BarChart
                data={chartData.barData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  angle={-45}
                  dataKey="name"
                  fontSize={12}
                  height={80}
                  textAnchor="end"
                />
                <YAxis fontSize={12} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        typeof value === "number"
                          ? value.toLocaleString()
                          : value,
                        name,
                      ]}
                      labelFormatter={(value, payload: any) =>
                        payload?.[0]?.payload?.fullName || value
                      }
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent payload={[]} />} />
                {chartData.numericFields.map((field, index) => (
                  <Bar
                    dataKey={field.label}
                    fill={`var(--chart-${index + 1})`}
                    key={field.key}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart - Performance Overview */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Relative performance across all numeric metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-80" config={chartConfig}>
                <RadarChart data={chartData.radarData}>
                  <PolarGrid />
                  <PolarAngleAxis
                    className="text-xs"
                    dataKey="field"
                    tick={{ fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                  />
                  {properties.map((property) => {
                    const key = property.title
                      .substring(0, 15)
                      .replace(/\s+/g, "_")
                      .toLowerCase();
                    return (
                      <Radar
                        dataKey={property.title.substring(0, 15)}
                        fill={`var(--color-${key})`}
                        fillOpacity={0.1}
                        key={property._id}
                        name={property.title.substring(0, 15)}
                        stroke={`var(--color-${key})`}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          `${Math.round(value as number)}%`,
                          name,
                        ]}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent payload={[]} />} />
                </RadarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Price Distribution */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Price Distribution
              </CardTitle>
              <CardDescription>
                Relative price comparison between properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer className="h-80" config={chartConfig}>
                <PieChart>
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={chartData.pieData}
                    dataKey="value"
                    fill="#8884d8"
                    label={({ name, percent }) =>
                      `${name} (${((percent as number) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                    outerRadius={80}
                  >
                    {chartData.pieData.map((entry, index) => {
                      const property = properties.find((p) =>
                        entry.name.startsWith(p.title.substring(0, 15))
                      );
                      const key =
                        property?.title
                          .substring(0, 15)
                          .replace(/\s+/g, "_")
                          .toLowerCase() || `item-${index}`;
                      return (
                        <Cell
                          fill={`var(--color-${key})`}
                          key={`cell-${entry.name}`}
                        />
                      );
                    })}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value: any) => [
                          `KES ${value.toLocaleString()}`,
                          "Price",
                        ]}
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Key Metrics Summary */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Metrics Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {chartData.numericFields.map((field) => {
                const values = properties
                  .map((property) => {
                    const value = getPropertyValue(property, field.key);
                    return typeof value === "number" ? value : 0;
                  })
                  .filter((v) => v > 0);

                if (values.length === 0) return null;

                const max = Math.max(...values);
                const min = Math.min(...values);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;

                const maxProperty = properties.find((property) => {
                  const value = getPropertyValue(property, field.key);
                  return value === max;
                });

                return (
                  <div className="rounded-lg border p-4" key={field.key}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="text-xs" variant="outline">
                        {field.label}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Highest: </span>
                        <span className="font-medium">
                          {field.type === "price"
                            ? `KES ${max.toLocaleString()}`
                            : max.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average: </span>
                        <span className="font-medium">
                          {field.type === "price"
                            ? `KES ${Math.round(avg).toLocaleString()}`
                            : Math.round(avg).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Leader: </span>
                        <span className="font-medium text-xs">
                          {maxProperty?.title.substring(0, 20)}
                          {(maxProperty?.title?.length as number) > 20
                            ? "..."
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
