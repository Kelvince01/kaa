import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@kaa/ui/components/chart";
import type React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type RevenueChartProps = {
  data?: {
    period: number;
    revenue: number;
    count: number;
  }[];
  period: "custom" | "daily" | "monthly" | "yearly";
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data, period }) => {
  if (!data || data.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">No data available</div>
    );
  }

  const getLabels = () => {
    if (period === "daily") {
      return data.map((item) => `Day ${item.period}`);
    }
    if (period === "monthly") {
      return data.map((item) => {
        const date = new Date(2000, item.period - 1, 1);
        return date.toLocaleString("default", { month: "short" });
      });
    }
    return data.map((item) => item.period.toString());
  };

  // Prepare recharts data: add a label field for XAxis
  const chartData = data.map((item, idx) => ({
    ...item,
    label: getLabels()[idx],
  }));

  return (
    <ChartContainer
      className="aspect-auto h-full w-full"
      config={{
        revenue: { label: "Revenue (KES)", color: "var(--chart-1)" },
      }}
    >
      <ResponsiveContainer height={300} width="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis
            tickFormatter={(value) => {
              if (value >= 1_000_000) {
                return `${(value / 1_000_000).toFixed(1)}M`;
              }
              if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`;
              }
              return value;
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="revenue" fill="var(--chart-3)" name="Revenue (KES)" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default RevenueChart;
