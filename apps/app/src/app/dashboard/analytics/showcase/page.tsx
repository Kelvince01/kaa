import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import type { Metadata } from "next";
import {
  // RevenueAreaChart,
  // PropertyTypesChart,
  // MonthlyViewsChart,
  // QuarterlyPerformanceChart,
  // MixedPerformanceChart,
  AreaChartComponent,
  BarChartComponent,
  CHART_COLORS,
  ChartExamplesGrid,
  generateChartConfig,
  generatePieChartConfig,
  LineChartComponent,
  MixedChartComponent,
  PieChartComponent,
  REVENUE_CHART_CONFIG,
  SAMPLE_REVENUE_DATA,
} from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Chart Showcase | Analytics Dashboard",
  description:
    "Showcase of modern chart components built with shadcn and recharts.",
};

// Additional demo data for showcase
const demoLineData = {
  labels: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  datasets: [
    {
      label: "visitors",
      data: [120, 190, 300, 500, 200, 300, 450],
    },
    {
      label: "pageViews",
      data: [240, 380, 600, 1000, 400, 600, 900],
    },
  ],
};

const demoBarData = {
  labels: ["Q1", "Q2", "Q3", "Q4"],
  datasets: [
    {
      label: "sales",
      data: [150_000, 200_000, 180_000, 250_000],
    },
    {
      label: "target",
      data: [160_000, 190_000, 200_000, 240_000],
    },
  ],
};

const pieData = {
  labels: ["Desktop", "Mobile", "Tablet"],
  datasets: [
    {
      label: "usage",
      data: [65, 30, 5],
    },
  ],
};

const mixedData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "revenue",
      data: [45_000, 52_000, 48_000, 61_000, 55_000, 67_000],
    },
    {
      label: "orders",
      data: [120, 145, 130, 170, 150, 185],
    },
    {
      label: "conversion",
      data: [2.5, 3.1, 2.8, 3.6, 3.2, 3.8],
    },
  ],
};

export default function ChartShowcasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Chart Showcase</h1>
        <p className="text-muted-foreground">
          Modern chart components built with shadcn/ui and recharts, featuring
          automatic theming and accessibility.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎨 Theme Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Automatic light/dark theme adaptation with CSS variables
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">♿ Accessible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Built-in ARIA labels, keyboard navigation, and screen reader
              support
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔧 Configurable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Type-safe configuration with automatic color management
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Examples */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Featured Examples</h2>
          <Badge variant="outline">Ready to use</Badge>
        </div>
        <ChartExamplesGrid />
      </div>

      {/* Component Catalog */}
      <div className="space-y-6">
        <h2 className="font-semibold text-2xl">Component Catalog</h2>

        <Tabs className="w-full" defaultValue="line">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="area">Area Chart</TabsTrigger>
            <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            <TabsTrigger value="mixed">Mixed Chart</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="line">
            <Card>
              <CardHeader>
                <CardTitle>Line Chart Component</CardTitle>
                <CardDescription>
                  Perfect for time series data and trend visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineChartComponent
                  config={generateChartConfig([
                    { label: "visitors" },
                    { label: "pageViews" },
                  ])}
                  data={demoLineData}
                  showGrid={true}
                  showLegend={true}
                  title="Weekly Website Traffic"
                  trend={{ value: "+23.1%", isPositive: true }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="bar">
            <Card>
              <CardHeader>
                <CardTitle>Bar Chart Component</CardTitle>
                <CardDescription>
                  Great for comparing categories and showing distributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarChartComponent
                  config={generateChartConfig([
                    { label: "sales" },
                    { label: "target" },
                  ])}
                  data={demoBarData}
                  showGrid={true}
                  showLegend={true}
                  title="Quarterly Sales Performance"
                  trend={{ value: "+12.5%", isPositive: true }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="area">
            <Card>
              <CardHeader>
                <CardTitle>Area Chart Component</CardTitle>
                <CardDescription>
                  Ideal for showing cumulative values and filled trend areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AreaChartComponent
                  config={REVENUE_CHART_CONFIG}
                  data={SAMPLE_REVENUE_DATA}
                  showGrid={true}
                  showLegend={true}
                  stacked={false}
                  title="Revenue vs Expenses"
                  trend={{ value: "+15.3%", isPositive: true }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="pie">
            <Card>
              <CardHeader>
                <CardTitle>Pie Chart Component</CardTitle>
                <CardDescription>
                  Perfect for showing proportions and percentage distributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieChartComponent
                  config={generatePieChartConfig([
                    "Desktop",
                    "Mobile",
                    "Tablet",
                  ])}
                  data={pieData}
                  innerRadius={60}
                  outerRadius={120}
                  showLabels={true}
                  showLegend={true}
                  title="Device Usage Distribution"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="mixed">
            <Card>
              <CardHeader>
                <CardTitle>Mixed Chart Component</CardTitle>
                <CardDescription>
                  Combine multiple chart types for comprehensive data
                  visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MixedChartComponent
                  chartTypes={["area", "bar", "line"]}
                  config={generateChartConfig([
                    { label: "revenue" },
                    { label: "orders" },
                    { label: "conversion" },
                  ])}
                  data={mixedData}
                  showGrid={true}
                  showLegend={true}
                  title="Business Metrics Overview"
                  trend={{ value: "+18.7%", isPositive: true }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Color System */}
      <div className="space-y-6">
        <h2 className="font-semibold text-2xl">Color System</h2>
        <Card>
          <CardHeader>
            <CardTitle>Chart Colors</CardTitle>
            <CardDescription>
              Semantic color variables that automatically adapt to your theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {CHART_COLORS.map((color, index) => (
                <div className="space-y-2 text-center" key={index.toString()}>
                  <div
                    className="h-16 w-full rounded-lg border"
                    style={{ backgroundColor: color }}
                  />
                  <p className="font-mono text-muted-foreground text-xs">
                    --chart-{index + 1}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guide */}
      <div className="space-y-6">
        <h2 className="font-semibold text-2xl">Quick Start</h2>
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">1. Import Components</h4>
              <code className="text-sm">
                {`import { AreaChartComponent, generateChartConfig } from "@/modules/analytics";`}
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">2. Configure Chart</h4>
              <code className="text-sm">
                {`const config = generateChartConfig([{ label: "revenue" }, { label: "expenses" }]);`}
              </code>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">3. Use Component</h4>
              <code className="text-sm">
                {`<AreaChartComponent title="My Chart" data={myData} config={config} />`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
