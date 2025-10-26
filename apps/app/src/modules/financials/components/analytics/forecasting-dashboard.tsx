import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Slider } from "@kaa/ui/components/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  AlertCircle,
  BarChart4,
  Brain,
  Calendar,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/shared/utils/format.util";
import { useFinancialForecast } from "../../analytics.queries";
import {
  CashFlowAreaChart,
  CategoryBarChart,
  ExpenseTrendChart,
  KPICard,
} from "./charts/chart-components";

type ForecastingDashboardProps = {
  className?: string;
};

// Mock forecast data
const mockForecastData = {
  expenses: [
    {
      period: "Jul 2024",
      actual: 4100,
      predicted: 4200,
      confidence: 85,
      factors: ["Seasonal adjustment", "Historical trend"],
    },
    {
      period: "Aug 2024",
      predicted: 4350,
      confidence: 82,
      factors: ["Summer maintenance", "Utility increase"],
    },
    {
      period: "Sep 2024",
      predicted: 4180,
      confidence: 78,
      factors: ["Back to school marketing"],
    },
    {
      period: "Oct 2024",
      predicted: 4520,
      confidence: 75,
      factors: ["Winter prep", "Insurance renewal"],
    },
    {
      period: "Nov 2024",
      predicted: 4680,
      confidence: 72,
      factors: ["Holiday marketing", "Heating costs"],
    },
    {
      period: "Dec 2024",
      predicted: 4420,
      confidence: 70,
      factors: ["Year-end adjustments"],
    },
  ],
  income: [
    { period: "Jul 2024", actual: 8900, predicted: 9100, confidence: 88 },
    { period: "Aug 2024", predicted: 9200, confidence: 85 },
    { period: "Sep 2024", predicted: 9150, confidence: 82 },
    { period: "Oct 2024", predicted: 9300, confidence: 79 },
    { period: "Nov 2024", predicted: 9400, confidence: 76 },
    { period: "Dec 2024", predicted: 9500, confidence: 73 },
  ],
  scenarios: {
    optimistic: {
      totalExpenses: 25_200,
      totalIncome: 55_800,
      netIncome: 30_600,
    },
    realistic: {
      totalExpenses: 26_350,
      totalIncome: 55_650,
      netIncome: 29_300,
    },
    pessimistic: {
      totalExpenses: 27_500,
      totalIncome: 54_900,
      netIncome: 27_400,
    },
  },
};

const mockCategoryForecasts = [
  {
    category: "Maintenance",
    current: 1200,
    forecast: 1350,
    variance: 12.5,
    confidence: 80,
  },
  {
    category: "Utilities",
    current: 800,
    forecast: 920,
    variance: 15.0,
    confidence: 85,
  },
  {
    category: "Insurance",
    current: 600,
    forecast: 625,
    variance: 4.2,
    confidence: 95,
  },
  {
    category: "Marketing",
    current: 700,
    forecast: 850,
    variance: 21.4,
    confidence: 70,
  },
  {
    category: "Office Supplies",
    current: 300,
    forecast: 320,
    variance: 6.7,
    confidence: 88,
  },
  {
    category: "Professional Services",
    current: 400,
    forecast: 450,
    variance: 12.5,
    confidence: 75,
  },
];

const mockBudgetProjections = [
  { month: "Jul", budget: 4000, forecast: 4200, variance: 200 },
  { month: "Aug", budget: 4000, forecast: 4350, variance: 350 },
  { month: "Sep", budget: 4000, forecast: 4180, variance: 180 },
  { month: "Oct", budget: 4200, forecast: 4520, variance: 320 },
  { month: "Nov", budget: 4200, forecast: 4680, variance: 480 },
  { month: "Dec", budget: 4000, forecast: 4420, variance: 420 },
];

export function ForecastingDashboard({ className }: ForecastingDashboardProps) {
  const [forecastPeriods, setForecastPeriods] = useState(6);
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [selectedScenario, setSelectedScenario] = useState<
    "optimistic" | "realistic" | "pessimistic"
  >("realistic");
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: expenseForecast, isLoading: expenseLoading } =
    useFinancialForecast(forecastPeriods, "expenses");
  const { data: incomeForecast, isLoading: incomeLoading } =
    useFinancialForecast(forecastPeriods, "income");
  const { data: cashFlowForecast, isLoading: cashFlowLoading } =
    useFinancialForecast(forecastPeriods, "cashflow");

  // Calculate totals for the selected scenario
  const selectedScenarioData = mockForecastData.scenarios[selectedScenario];

  // Prepare combined forecast data for charts
  const combinedForecastData = useMemo(
    () =>
      mockForecastData.expenses.map((expense, index) => ({
        period: expense.period,
        expenses: expense.predicted,
        income: mockForecastData.income[index]?.predicted || 0,
        netIncome:
          (mockForecastData.income[index]?.predicted || 0) - expense.predicted,
        confidence: Math.min(
          expense.confidence,
          mockForecastData.income[index]?.confidence || 100
        ),
      })),
    []
  );

  // Calculate forecast accuracy metrics
  const forecastAccuracy = useMemo(() => {
    const actualVsForecast = mockForecastData.expenses.filter(
      (item) => item.actual
    );
    if (actualVsForecast.length === 0) return { accuracy: 0, variance: 0 };

    const totalVariance = actualVsForecast.reduce(
      (sum, item) =>
        sum +
        Math.abs(
          (((item.actual as number) - item.predicted) /
            (item.actual as number)) *
            100
        ),
      0
    );

    return {
      accuracy: 100 - totalVariance / actualVsForecast.length,
      variance: totalVariance / actualVsForecast.length,
    };
  }, []);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Financial Forecasting</h2>
          <p className="text-muted-foreground">
            Predictive analytics and budget projections for informed decision
            making
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Label htmlFor="periods">Forecast Periods:</Label>
            <Select
              onValueChange={(value) =>
                setForecastPeriods(Number.parseInt(value, 10))
              }
              value={forecastPeriods.toString()}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="categories">Category Forecasts</TabsTrigger>
          <TabsTrigger value="accuracy">Model Accuracy</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          {/* Key Forecast Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              changeType="currency"
              icon={TrendingUp}
              loading={expenseLoading}
              title="Next Month Expense"
              value={mockForecastData.expenses[1]?.predicted || 0}
            />
            <KPICard
              changeType="percentage"
              icon={Brain}
              loading={expenseLoading}
              title="Forecast Confidence"
              value={mockForecastData.expenses[1]?.confidence || 0}
            />
            <KPICard
              changeType="currency"
              icon={Target}
              loading={expenseLoading}
              title="Budget Variance"
              value={mockBudgetProjections[1]?.variance || 0}
            />
            <KPICard
              changeType="percentage"
              icon={Activity}
              loading={false}
              title="Model Accuracy"
              value={forecastAccuracy.accuracy}
            />
          </div>

          {/* Main Forecast Charts */}
          <div className="grid gap-6">
            <ExpenseTrendChart
              data={mockForecastData.expenses.map((item) => ({
                period: item.period,
                actual: item.actual || null,
                predicted: item.predicted,
                confidence: item.confidence,
              }))}
              height={350}
              lines={[
                { dataKey: "actual", stroke: "#22c55e", name: "Actual" },
                { dataKey: "predicted", stroke: "#3b82f6", name: "Forecasted" },
              ]}
              loading={expenseLoading}
              title="Expense Forecast"
              xDataKey="period"
            />

            <CashFlowAreaChart
              areas={[
                {
                  dataKey: "income",
                  stroke: "#22c55e",
                  fill: "#22c55e33",
                  name: "Income",
                },
                {
                  dataKey: "expenses",
                  stroke: "#ef4444",
                  fill: "#ef444433",
                  name: "Expenses",
                },
                {
                  dataKey: "netIncome",
                  stroke: "#3b82f6",
                  fill: "#3b82f633",
                  name: "Net Income",
                },
              ]}
              data={combinedForecastData}
              height={350}
              loading={cashFlowLoading}
              title="Cash Flow Projection"
              xDataKey="period"
            />
          </div>

          {/* Forecast Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Expense Increase Expected",
                    description:
                      "Forecasts show a 6.1% increase in expenses over the next quarter",
                    impact: "high",
                    icon: TrendingUp,
                  },
                  {
                    title: "Seasonal Pattern Detected",
                    description:
                      "Winter months typically show 15% higher utility costs",
                    impact: "medium",
                    icon: Calendar,
                  },
                  {
                    title: "Marketing ROI Opportunity",
                    description:
                      "Increased marketing spend could yield 18% revenue growth",
                    impact: "medium",
                    icon: Target,
                  },
                ].map((insight, index) => (
                  <div
                    className="flex items-start space-x-3 rounded-lg border p-3"
                    key={index.toString()}
                  >
                    <insight.icon
                      className={`mt-0.5 h-5 w-5 ${
                        insight.impact === "high"
                          ? "text-red-500"
                          : insight.impact === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    />
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    factor: "Market Volatility",
                    probability: 65,
                    impact: "Medium",
                    description: "Economic conditions may affect rental income",
                  },
                  {
                    factor: "Maintenance Spikes",
                    probability: 45,
                    impact: "High",
                    description:
                      "Aging equipment may require unexpected repairs",
                  },
                  {
                    factor: "Regulatory Changes",
                    probability: 30,
                    impact: "Low",
                    description: "New regulations could impact operating costs",
                  },
                ].map((risk, index) => (
                  <div className="space-y-2" key={index.toString()}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{risk.factor}</span>
                      <Badge
                        variant={
                          risk.impact === "High"
                            ? "destructive"
                            : risk.impact === "Medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {risk.impact}
                      </Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-linear-to-r from-green-500 to-red-500"
                        style={{ width: `${risk.probability}%` }}
                      />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {risk.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="scenarios">
          {/* Scenario Selection */}
          <div className="flex items-center space-x-4">
            <Label>Scenario Analysis:</Label>
            <Select
              onValueChange={(value) => setSelectedScenario(value as any)}
              value={selectedScenario}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="optimistic">Optimistic</SelectItem>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="pessimistic">Pessimistic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scenario Comparison */}
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(mockForecastData.scenarios).map(
              ([scenario, data]) => (
                <Card
                  className={`cursor-pointer transition-all ${
                    selectedScenario === scenario ? "ring-2 ring-primary" : ""
                  }`}
                  key={scenario}
                  onClick={() => setSelectedScenario(scenario as any)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center capitalize">
                      {scenario === "optimistic" && (
                        <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                      )}
                      {scenario === "realistic" && (
                        <Activity className="mr-2 h-5 w-5 text-blue-600" />
                      )}
                      {scenario === "pessimistic" && (
                        <TrendingDown className="mr-2 h-5 w-5 text-red-600" />
                      )}
                      {scenario}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Income
                      </span>
                      <span className="font-medium text-green-600 text-sm">
                        {formatCurrency(data.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Total Expenses
                      </span>
                      <span className="font-medium text-red-600 text-sm">
                        {formatCurrency(data.totalExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-sm">Net Income</span>
                      <span className="font-bold text-sm">
                        {formatCurrency(data.netIncome)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Budget vs Forecast Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Forecast Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBudgetProjections.map((item) => (
                  <div className="space-y-2" key={item.month}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{item.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground text-sm">
                          Budget: {formatCurrency(item.budget)}
                        </span>
                        <span className="font-medium text-sm">
                          Forecast: {formatCurrency(item.forecast)}
                        </span>
                        <span
                          className={`font-bold text-sm ${
                            item.variance > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          {item.variance > 0 ? "+" : ""}
                          {formatCurrency(item.variance)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          item.forecast <= item.budget
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min((item.forecast / item.budget) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="categories">
          {/* Category Forecasts */}
          <div className="grid gap-6">
            <CategoryBarChart
              bars={[
                { dataKey: "current", fill: "#64748b", name: "Current" },
                { dataKey: "forecast", fill: "#3b82f6", name: "Forecast" },
              ]}
              data={mockCategoryForecasts.map((cat) => ({
                category: cat.category,
                current: cat.current,
                forecast: cat.forecast,
              }))}
              height={400}
              loading={false}
              title="Category Forecast vs Current"
              xDataKey="category"
            />

            <Card>
              <CardHeader>
                <CardTitle>Category Forecast Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategoryForecasts.map((cat) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-4"
                      key={cat.category}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{cat.category}</h4>
                        <p className="text-muted-foreground text-xs">
                          {cat.confidence}% confidence
                        </p>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="flex items-center space-x-4">
                          <span className="text-muted-foreground text-sm">
                            {formatCurrency(cat.current)}
                          </span>
                          <span className="font-medium text-sm">
                            → {formatCurrency(cat.forecast)}
                          </span>
                        </div>
                        <Badge
                          variant={
                            cat.variance > 10
                              ? "destructive"
                              : cat.variance > 5
                                ? "default"
                                : "secondary"
                          }
                        >
                          {cat.variance > 0 ? "+" : ""}
                          {cat.variance.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="accuracy">
          {/* Model Performance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5" />
                  Forecast Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="mb-2 font-bold text-3xl text-green-600">
                    {forecastAccuracy.accuracy.toFixed(1)}%
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Overall prediction accuracy
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      metric: "Expense Forecasting",
                      accuracy: 87.3,
                      trend: "improving",
                    },
                    {
                      metric: "Income Projection",
                      accuracy: 91.2,
                      trend: "stable",
                    },
                    {
                      metric: "Cash Flow Prediction",
                      accuracy: 84.6,
                      trend: "improving",
                    },
                    {
                      metric: "Category Breakdown",
                      accuracy: 79.8,
                      trend: "declining",
                    },
                  ].map((item) => (
                    <div
                      className="flex items-center justify-between"
                      key={item.metric}
                    >
                      <span className="text-sm">{item.metric}</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {item.accuracy}%
                        </span>
                        <Badge
                          variant={
                            item.trend === "improving"
                              ? "default"
                              : item.trend === "stable"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {item.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Training Data Quality</span>
                      <span>92%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: "92%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Confidence Threshold</span>
                      <span>{confidenceThreshold}%</span>
                    </div>
                    <Slider
                      className="w-full"
                      max={100}
                      min={50}
                      onValueChange={(value) =>
                        setConfidenceThreshold(value[0] ?? 0)
                      }
                      step={5}
                      value={[confidenceThreshold]}
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Prediction Range</span>
                      <span>{forecastPeriods} months</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Accuracy decreases with longer prediction periods
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Last Model Update</span>
                      <span>2 days ago</span>
                    </div>
                    <Button className="mt-2 w-full" size="sm" variant="outline">
                      Retrain Model
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prediction Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Key Prediction Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    factor: "Historical Patterns",
                    weight: 35,
                    importance: "High",
                  },
                  { factor: "Seasonal Trends", weight: 25, importance: "High" },
                  {
                    factor: "Market Conditions",
                    weight: 20,
                    importance: "Medium",
                  },
                  {
                    factor: "Property Changes",
                    weight: 10,
                    importance: "Medium",
                  },
                  { factor: "External Events", weight: 7, importance: "Low" },
                  { factor: "Random Variance", weight: 3, importance: "Low" },
                ].map((factor) => (
                  <div className="rounded-lg border p-3" key={factor.factor}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {factor.factor}
                      </span>
                      <Badge
                        variant={
                          factor.importance === "High"
                            ? "default"
                            : factor.importance === "Medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {factor.importance}
                      </Badge>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${factor.weight}%` }}
                      />
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {factor.weight}% influence
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
