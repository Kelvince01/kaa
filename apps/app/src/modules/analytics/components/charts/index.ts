// Chart Components Exports

export { AreaChartComponent } from "./area-chart";
export { BarChartComponent } from "./bar-chart";
// Chart Examples and Configurations
export {
  ChartExamplesGrid,
  MixedPerformanceChart,
  MonthlyViewsChart,
  PERFORMANCE_CONFIG,
  PROPERTY_TYPES_CONFIG,
  PropertyTypesChart,
  QuarterlyPerformanceChart,
  REVENUE_CHART_CONFIG,
  RevenueAreaChart,
  SAMPLE_MIXED_PERFORMANCE_DATA,
  SAMPLE_MONTHLY_VIEWS_DATA,
  SAMPLE_PROPERTY_TYPES_DATA,
  SAMPLE_REVENUE_DATA,
  VIEWS_CHART_CONFIG,
} from "./chart-examples";
export { LineChartComponent } from "./line-chart";
export { MixedChartComponent } from "./mixed-chart";
export { PieChartComponent } from "./pie-chart";

// Shadcn Chart System Colors (CSS Variables)
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Legacy Chart Colors (for backward compatibility)
export const LEGACY_CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
  "#00ffff",
  "#ff0000",
  "#8dd1e1",
  "#d084d0",
];

export const formatChartValue = (
  value: number,
  type: "currency" | "percentage" | "number" = "number"
) => {
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case "percentage":
      return `${value.toFixed(1)}%`;
    // case 'number':
    default:
      return value.toLocaleString();
  }
};

export const generateTrendData = (values: number[]) => {
  if (values?.length < 2) return { value: "0%", isPositive: true };

  const latest = values?.[values.length - 1];
  const previous = values?.[values.length - 2];
  const change = ((latest || 0 - (previous || 0)) / (previous || 0)) * 100;

  return {
    value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    isPositive: change >= 0,
  };
};

// Generate ChartConfig for analytics data
export const generateChartConfig = (
  datasets: Array<{ label: string }>,
  customColors?: string[]
): import("@kaa/ui/components/chart").ChartConfig => {
  const colors = customColors || CHART_COLORS;

  return datasets.reduce(
    (acc, dataset, index) => {
      acc[dataset.label] = {
        label: dataset.label,
        color: colors[index % colors.length],
      };
      return acc;
    },
    {} as import("@kaa/ui/components/chart").ChartConfig
  );
};

// Generate ChartConfig for pie chart labels
export const generatePieChartConfig = (
  labels: string[],
  customColors?: string[]
): import("@kaa/ui/components/chart").ChartConfig => {
  const colors = customColors || CHART_COLORS;

  return labels.reduce(
    (acc, label, index) => {
      acc[label] = {
        label,
        color: colors[index % colors.length],
      };
      return acc;
    },
    {} as import("@kaa/ui/components/chart").ChartConfig
  );
};
