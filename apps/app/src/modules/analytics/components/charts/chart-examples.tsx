"use client";

import type { ChartConfig } from "@kaa/ui/components/chart";
import type { ChartData } from "../../analytics.type";
import {
  AreaChartComponent,
  BarChartComponent,
  LineChartComponent,
  MixedChartComponent,
  PieChartComponent,
} from "./index";

// Example data and configurations showcasing shadcn chart integration

export const SAMPLE_REVENUE_DATA: ChartData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "revenue",
      data: [65_000, 72_000, 68_000, 85_000, 91_000, 78_000],
      borderColor: "hsl(var(--chart-1))",
      backgroundColor: "hsl(var(--chart-1))",
    },
    {
      label: "expenses",
      data: [45_000, 52_000, 48_000, 65_000, 71_000, 58_000],
      borderColor: "hsl(var(--chart-2))",
      backgroundColor: "hsl(var(--chart-2))",
    },
  ],
};

export const REVENUE_CHART_CONFIG: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
};

export const SAMPLE_PROPERTY_TYPES_DATA: ChartData = {
  labels: ["Apartments", "Houses", "Studios", "Penthouses", "Townhouses"],
  datasets: [
    {
      label: "count",
      data: [45, 32, 28, 15, 12],
      backgroundColor: [
        "hsl(var(--chart-1))",
        "hsl(var(--chart-2))",
        "hsl(var(--chart-3))",
        "hsl(var(--chart-4))",
        "hsl(var(--chart-5))",
      ],
    },
  ],
};

export const PROPERTY_TYPES_CONFIG: ChartConfig = {
  Apartments: { label: "Apartments", color: "hsl(var(--chart-1))" },
  Houses: { label: "Houses", color: "hsl(var(--chart-2))" },
  Studios: { label: "Studios", color: "hsl(var(--chart-3))" },
  Penthouses: { label: "Penthouses", color: "hsl(var(--chart-4))" },
  Townhouses: { label: "Townhouses", color: "hsl(var(--chart-5))" },
};

export const SAMPLE_MONTHLY_VIEWS_DATA: ChartData = {
  labels: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  datasets: [
    {
      label: "views",
      data: [
        1200, 1350, 1180, 1450, 1650, 1520, 1720, 1890, 1750, 1820, 1950, 2100,
      ],
      borderColor: "hsl(var(--chart-1))",
      backgroundColor: "hsl(var(--chart-1))",
    },
  ],
};

export const VIEWS_CHART_CONFIG: ChartConfig = {
  views: {
    label: "Property Views",
    color: "hsl(var(--chart-1))",
  },
};

export const SAMPLE_MIXED_PERFORMANCE_DATA: ChartData = {
  labels: ["Q1", "Q2", "Q3", "Q4"],
  datasets: [
    {
      label: "bookings",
      data: [120, 145, 165, 180],
      borderColor: "hsl(var(--chart-1))",
      backgroundColor: "hsl(var(--chart-1))",
    },
    {
      label: "revenue",
      data: [85_000, 98_000, 112_000, 125_000],
      borderColor: "hsl(var(--chart-2))",
      backgroundColor: "hsl(var(--chart-2))",
    },
    {
      label: "occupancy",
      data: [78, 82, 85, 88],
      borderColor: "hsl(var(--chart-3))",
      backgroundColor: "hsl(var(--chart-3))",
    },
  ],
};

export const PERFORMANCE_CONFIG: ChartConfig = {
  bookings: { label: "Bookings", color: "hsl(var(--chart-1))" },
  revenue: { label: "Revenue (£)", color: "hsl(var(--chart-2))" },
  occupancy: { label: "Occupancy (%)", color: "hsl(var(--chart-3))" },
};

// Example components demonstrating usage
export function RevenueAreaChart() {
  return (
    <AreaChartComponent
      className="w-full"
      config={REVENUE_CHART_CONFIG}
      data={SAMPLE_REVENUE_DATA}
      title="Revenue vs Expenses"
      trend={{ value: "+12.5%", isPositive: true }}
    />
  );
}

export function PropertyTypesChart() {
  return (
    <PieChartComponent
      className="w-full"
      config={PROPERTY_TYPES_CONFIG}
      data={SAMPLE_PROPERTY_TYPES_DATA}
      innerRadius={60}
      outerRadius={120}
      title="Property Types Distribution"
    />
  );
}

export function MonthlyViewsChart() {
  return (
    <LineChartComponent
      className="w-full"
      config={VIEWS_CHART_CONFIG}
      data={SAMPLE_MONTHLY_VIEWS_DATA}
      title="Monthly Property Views"
      trend={{ value: "+18.2%", isPositive: true }}
    />
  );
}

export function QuarterlyPerformanceChart() {
  return (
    <BarChartComponent
      className="w-full"
      config={PERFORMANCE_CONFIG}
      data={SAMPLE_MIXED_PERFORMANCE_DATA}
      title="Quarterly Performance"
    />
  );
}

export function MixedPerformanceChart() {
  return (
    <MixedChartComponent
      chartTypes={["bar", "line", "area"]}
      className="w-full"
      config={PERFORMANCE_CONFIG}
      data={SAMPLE_MIXED_PERFORMANCE_DATA}
      title="Performance Overview"
      trend={{ value: "+15.8%", isPositive: true }}
    />
  );
}

// Grid layout example for dashboard
export function ChartExamplesGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      <div className="col-span-1 md:col-span-2">
        <RevenueAreaChart />
      </div>
      <div className="col-span-1">
        <PropertyTypesChart />
      </div>
      <div className="col-span-1 md:col-span-2">
        <MonthlyViewsChart />
      </div>
      <div className="col-span-1">
        <QuarterlyPerformanceChart />
      </div>
      <div className="col-span-1 md:col-span-2 lg:col-span-3">
        <MixedPerformanceChart />
      </div>
    </div>
  );
}
