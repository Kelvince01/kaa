import type { Metadata } from "next";
import {
  AreaChartComponent,
  BarChartComponent,
  CHART_COLORS,
  // New shadcn chart examples
  ChartExamplesGrid,
  EngagementFunnelChart,
  // RevenueAreaChart,
  // PropertyTypesChart,
  // MonthlyViewsChart,
  // QuarterlyPerformanceChart,
  // MixedPerformanceChart,
  generateChartConfig,
  LineChartComponent,
  PerformanceComparisonChart,
  PieChartComponent,
  PropertyDistributionChart,
  RevenueChart,
} from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Analytics Charts | Dashboard",
  description: "Comprehensive analytics charts and visualizations.",
};

// Mock data with shadcn theming
const mockLineData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "pageViews",
      data: [1200, 1900, 3000, 5000, 4200, 3800],
      borderWidth: 2,
    },
    {
      label: "uniqueVisitors",
      data: [800, 1200, 2100, 3200, 2800, 2400],
      borderWidth: 2,
    },
  ],
};

const lineChartConfig = generateChartConfig([
  { label: "pageViews" },
  { label: "uniqueVisitors" },
]);

const mockBarData = {
  labels: ["House", "Apartment", "Studio", "Room"],
  datasets: [
    {
      label: "properties",
      data: [25, 45, 15, 8],
    },
  ],
};

const barChartConfig = generateChartConfig([{ label: "properties" }]);

const mockPieData = {
  labels: ["London", "Manchester", "Birmingham", "Leeds", "Others"],
  datasets: [
    {
      label: "count",
      data: [35, 20, 15, 12, 18],
    },
  ],
};

const pieChartConfig = {
  London: { label: "London", color: CHART_COLORS[0] },
  Manchester: { label: "Manchester", color: CHART_COLORS[1] },
  Birmingham: { label: "Birmingham", color: CHART_COLORS[2] },
  Leeds: { label: "Leeds", color: CHART_COLORS[3] },
  Others: { label: "Others", color: CHART_COLORS[4] },
};

const mockAreaData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
  datasets: [
    {
      label: "revenue",
      data: [12_000, 15_000, 18_000, 22_000],
      borderWidth: 2,
    },
    {
      label: "expenses",
      data: [8000, 9500, 11_000, 13_000],
      borderWidth: 2,
    },
  ],
};

const areaChartConfig = generateChartConfig([
  { label: "revenue" },
  { label: "expenses" },
]);

export default function AnalyticsChartsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Analytics Charts</h1>
        <p className="text-muted-foreground">
          Comprehensive data visualizations and charts for your analytics
          dashboard.
        </p>
      </div>

      {/* New Shadcn Chart Examples Showcase */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Modern Chart Components</h2>
          <div className="rounded-lg bg-muted px-3 py-1 text-muted-foreground text-sm">
            shadcn + recharts
          </div>
        </div>

        {/* Featured Chart Examples Grid */}
        <ChartExamplesGrid />
      </div>

      {/* Real-time Data Charts */}
      <div className="space-y-6">
        <h2 className="font-semibold text-2xl">Live Data Charts</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart period="90d" />
          <PropertyDistributionChart type="type" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <PerformanceComparisonChart metric="score" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <EngagementFunnelChart funnel="property_inquiry" period="30d" />
        </div>
      </div>

      {/* Component Demonstrations */}
      <div className="space-y-6 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Component Demonstrations</h2>
          <div className="rounded-lg bg-muted px-3 py-1 text-muted-foreground text-sm">
            Updated with shadcn theming
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LineChartComponent
            config={lineChartConfig}
            data={mockLineData}
            height={350}
            showGrid={true}
            showLegend={true}
            title="Traffic Trends"
            trend={{ value: "+12.5%", isPositive: true }}
          />

          <BarChartComponent
            config={barChartConfig}
            data={mockBarData}
            height={350}
            showGrid={true}
            showLegend={false}
            title="Property Types Distribution"
            trend={{ value: "+8.2%", isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PieChartComponent
            config={pieChartConfig}
            data={mockPieData}
            height={400}
            innerRadius={60}
            outerRadius={120}
            showLabels={true}
            showLegend={true}
            title="Properties by Location"
          />

          <AreaChartComponent
            config={areaChartConfig}
            data={mockAreaData}
            height={400}
            showGrid={true}
            showLegend={true}
            stacked={false}
            title="Financial Overview"
            trend={{ value: "+15.3%", isPositive: true }}
          />
        </div>
      </div>
    </div>
  );
}
