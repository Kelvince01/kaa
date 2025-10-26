import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle,
  DollarSign,
  Gauge,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/shared/utils/format.util";
import {
  useExpenseAnalytics,
  useFinancialInsights,
  useFinancialTrends,
} from "../../analytics.queries";
import { FinancialHealthCard, KPICard } from "./charts/chart-components";

type FinancialInsightsDashboardProps = {
  className?: string;
};

// Mock insights data
const mockInsightsData = {
  healthScore: 78,
  healthFactors: [
    { name: "Cash Flow", score: 85, impact: "positive" as const },
    { name: "Expense Management", score: 72, impact: "neutral" as const },
    { name: "Revenue Growth", score: 89, impact: "positive" as const },
    { name: "Budget Variance", score: 65, impact: "negative" as const },
    { name: "Profitability", score: 81, impact: "positive" as const },
  ],
  kpis: {
    profitMargin: 32.5,
    expenseRatio: 67.5,
    averageMonthlyExpense: 4200,
    largestExpenseCategory: "Maintenance",
    cashFlowTrend: "increasing" as const,
    riskScore: 22,
    efficiencyScore: 78,
    growthRate: 12.3,
  },
  alerts: [
    {
      id: "1",
      type: "critical" as const,
      title: "Budget Overspend Alert",
      message: "Marketing expenses exceeded budget by 18% this month",
      value: 2800,
      threshold: 2500,
      category: "Marketing",
      action: "Review marketing spend and adjust campaigns",
    },
    {
      id: "2",
      type: "warning" as const,
      title: "Maintenance Cost Spike",
      message: "Maintenance costs increased 25% compared to last month",
      value: 1500,
      threshold: 1200,
      category: "Maintenance",
      action: "Investigate maintenance requests and optimize scheduling",
    },
    {
      id: "3",
      type: "info" as const,
      title: "Utility Savings Opportunity",
      message:
        "Utility costs consistently under budget - consider reallocation",
      value: 800,
      threshold: 1000,
      category: "Utilities",
      action: "Reallocate unused budget to high-impact areas",
    },
  ],
  recommendations: [
    {
      id: "1",
      title: "Optimize Marketing Spend",
      description:
        "Focus marketing budget on highest-performing channels to improve ROI",
      impact: "high" as const,
      category: "Marketing",
      potentialSavings: 400,
      timeframe: "1-2 months",
      effort: "medium",
    },
    {
      id: "2",
      title: "Preventive Maintenance Program",
      description:
        "Implement scheduled maintenance to reduce emergency repair costs",
      impact: "high" as const,
      category: "Maintenance",
      potentialSavings: 600,
      timeframe: "3-6 months",
      effort: "high",
    },
    {
      id: "3",
      title: "Energy Efficiency Audit",
      description:
        "Conduct energy audit to identify additional cost-saving opportunities",
      impact: "medium" as const,
      category: "Utilities",
      potentialSavings: 200,
      timeframe: "2-4 months",
      effort: "low",
    },
    {
      id: "4",
      title: "Vendor Contract Review",
      description: "Review and renegotiate vendor contracts for better terms",
      impact: "medium" as const,
      category: "Professional Services",
      potentialSavings: 300,
      timeframe: "1-3 months",
      effort: "medium",
    },
  ],
  benchmarks: [
    {
      metric: "Expense Ratio",
      value: 67.5,
      benchmark: 65.0,
      industry: "Property Management",
      performance: "below" as const,
    },
    {
      metric: "Profit Margin",
      value: 32.5,
      benchmark: 30.0,
      industry: "Property Management",
      performance: "above" as const,
    },
    {
      metric: "Maintenance Cost %",
      value: 28.4,
      benchmark: 25.0,
      industry: "Property Management",
      performance: "below" as const,
    },
    {
      metric: "Operating Efficiency",
      value: 78,
      benchmark: 75,
      industry: "Property Management",
      performance: "above" as const,
    },
  ],
  trends: [
    {
      metric: "Revenue Growth",
      value: 12.3,
      trend: "increasing",
      period: "YTD",
      confidence: 88,
    },
    {
      metric: "Cost Management",
      value: -5.2,
      trend: "improving",
      period: "Last 3M",
      confidence: 82,
    },
    {
      metric: "Cash Flow",
      value: 8.7,
      trend: "stable",
      period: "Last 6M",
      confidence: 91,
    },
  ],
};

const mockOptimizationOpportunities = [
  {
    category: "Maintenance",
    current: 7150,
    optimized: 6200,
    savings: 950,
    confidence: 85,
    actions: [
      "Bulk purchasing",
      "Vendor negotiations",
      "Preventive scheduling",
    ],
  },
  {
    category: "Utilities",
    current: 4900,
    optimized: 4400,
    savings: 500,
    confidence: 78,
    actions: ["Energy audit", "Smart systems", "Provider comparison"],
  },
  {
    category: "Marketing",
    current: 2800,
    optimized: 2400,
    savings: 400,
    confidence: 72,
    actions: ["Channel optimization", "ROI analysis", "Automation tools"],
  },
];

export function FinancialInsightsDashboard({
  className,
}: FinancialInsightsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">(
    "month"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: insights, isLoading: insightsLoading } =
    useFinancialInsights(timeframe);
  const { data: expenseAnalytics, isLoading: analyticsLoading } =
    useExpenseAnalytics(timeframe);
  const { data: trends, isLoading: trendsLoading } =
    useFinancialTrends(timeframe);

  // Calculate total potential savings
  const totalPotentialSavings = useMemo(
    () =>
      mockInsightsData.recommendations.reduce(
        (sum, rec) => sum + rec.potentialSavings,
        0
      ),
    []
  );

  const getAlertIcon = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getPerformanceColor = (performance: "above" | "below" | "at") => {
    switch (performance) {
      case "above":
        return "text-green-600";
      case "below":
        return "text-red-600";
      case "at":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  const getPerformanceIcon = (performance: "above" | "below" | "at") => {
    switch (performance) {
      case "above":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "below":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      case "at":
        return <span className="h-4 w-4" />;
      default:
        return <span className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Financial Insights</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis, alerts, and recommendations for financial
            optimization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            onValueChange={(value) => setTimeframe(value as any)}
            value={timeframe}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          {/* Financial Health Score */}
          <div className="grid gap-6 md:grid-cols-3">
            <FinancialHealthCard
              factors={mockInsightsData.healthFactors}
              loading={insightsLoading}
              score={mockInsightsData.healthScore}
            />

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Key Performance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      label: "Profit Margin",
                      value: mockInsightsData.kpis.profitMargin,
                      unit: "%",
                      trend: "up",
                      change: "+2.1%",
                    },
                    {
                      label: "Expense Ratio",
                      value: mockInsightsData.kpis.expenseRatio,
                      unit: "%",
                      trend: "down",
                      change: "-1.5%",
                    },
                    {
                      label: "Risk Score",
                      value: mockInsightsData.kpis.riskScore,
                      unit: "/100",
                      trend: "down",
                      change: "-3.2",
                    },
                    {
                      label: "Efficiency Score",
                      value: mockInsightsData.kpis.efficiencyScore,
                      unit: "/100",
                      trend: "up",
                      change: "+5.3",
                    },
                  ].map((kpi, index) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={index.toString()}
                    >
                      <div>
                        <p className="font-medium text-sm">{kpi.label}</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">
                            {kpi.value}
                            {kpi.unit}
                          </span>
                          <div
                            className={`flex items-center text-xs ${
                              kpi.trend === "up"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {kpi.trend === "up" ? (
                              <TrendingUp className="mr-1 h-3 w-3" />
                            ) : (
                              <TrendingDown className="mr-1 h-3 w-3" />
                            )}
                            {kpi.change}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              change={-150}
              changeType="currency"
              icon={DollarSign}
              loading={insightsLoading}
              title="Average Monthly Expense"
              value={mockInsightsData.kpis.averageMonthlyExpense}
            />
            <KPICard
              change={1.2}
              changeType="percentage"
              icon={TrendingUp}
              loading={insightsLoading}
              title="Growth Rate"
              value={mockInsightsData.kpis.growthRate}
            />
            <KPICard
              change={5.3}
              changeType="number"
              icon={Zap}
              loading={insightsLoading}
              title="Efficiency Score"
              value={mockInsightsData.kpis.efficiencyScore}
            />
            <KPICard
              changeType="currency"
              icon={Target}
              loading={false}
              title="Potential Savings"
              value={totalPotentialSavings}
            />
          </div>

          {/* Quick Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    insight: "Marketing ROI has improved 23% this quarter",
                    confidence: 92,
                    type: "positive",
                  },
                  {
                    insight: "Maintenance costs showing seasonal pattern",
                    confidence: 87,
                    type: "neutral",
                  },
                  {
                    insight: "Utility expenses trending below industry average",
                    confidence: 94,
                    type: "positive",
                  },
                ].map((item, index) => (
                  <div
                    className="flex items-start space-x-3 rounded-lg bg-muted/50 p-3"
                    key={index.toString()}
                  >
                    <div
                      className={`mt-2 h-2 w-2 rounded-full ${
                        item.type === "positive"
                          ? "bg-green-500"
                          : item.type === "negative"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{item.insight}</p>
                      <div className="mt-1 flex items-center">
                        <span className="mr-2 text-muted-foreground text-xs">
                          Confidence:
                        </span>
                        <Progress
                          className="h-1 w-16"
                          value={item.confidence}
                        />
                        <span className="ml-1 text-muted-foreground text-xs">
                          {item.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="mr-2 h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockInsightsData.trends.map((trend, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={index.toString()}
                  >
                    <div>
                      <p className="font-medium text-sm">{trend.metric}</p>
                      <p className="text-muted-foreground text-xs">
                        {trend.period}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold text-sm ${
                            trend.value > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {trend.value > 0 ? "+" : ""}
                          {trend.value}%
                        </span>
                        <Badge
                          variant={
                            trend.trend === "improving"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {trend.trend}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {trend.confidence}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="alerts">
          {/* Alert Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Critical Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-red-600">
                  {
                    mockInsightsData.alerts.filter((a) => a.type === "critical")
                      .length
                  }
                </div>
                <p className="text-muted-foreground text-sm">
                  Immediate attention required
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-yellow-600">
                  {
                    mockInsightsData.alerts.filter((a) => a.type === "warning")
                      .length
                  }
                </div>
                <p className="text-muted-foreground text-sm">Monitor closely</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-blue-600">
                  {
                    mockInsightsData.alerts.filter((a) => a.type === "info")
                      .length
                  }
                </div>
                <p className="text-muted-foreground text-sm">
                  Optimization opportunities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockInsightsData.alerts.map((alert) => (
                <Alert
                  className={`border-l-4 ${
                    alert.type === "critical"
                      ? "border-l-red-500"
                      : alert.type === "warning"
                        ? "border-l-yellow-500"
                        : "border-l-blue-500"
                  }`}
                  key={alert.id}
                >
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <Badge variant={alert.category.toLowerCase() as any}>
                          {alert.category}
                        </Badge>
                      </div>
                      <AlertDescription className="mb-2">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                          <span className="font-medium">Current:</span>{" "}
                          {formatCurrency(alert.value)} |
                          <span className="ml-2 font-medium">Threshold:</span>{" "}
                          {formatCurrency(alert.threshold)}
                        </div>
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      </div>
                      <p className="mt-2 text-muted-foreground text-xs">
                        <strong>Recommended Action:</strong> {alert.action}
                      </p>
                    </div>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="recommendations">
          {/* Recommendations Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {mockInsightsData.recommendations.length}
                </div>
                <p className="text-muted-foreground text-sm">
                  Optimization opportunities
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Potential Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-green-600">
                  {formatCurrency(totalPotentialSavings)}
                </div>
                <p className="text-muted-foreground text-sm">
                  Monthly savings potential
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">High Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {
                    mockInsightsData.recommendations.filter(
                      (r) => r.impact === "high"
                    ).length
                  }
                </div>
                <p className="text-muted-foreground text-sm">
                  High-impact actions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {
                    mockInsightsData.recommendations.filter(
                      (r) => r.effort === "low"
                    ).length
                  }
                </div>
                <p className="text-muted-foreground text-sm">
                  Low effort implementations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations List */}
          <div className="grid gap-4">
            {mockInsightsData.recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{rec.title}</h3>
                        <Badge
                          variant={
                            rec.impact === "high"
                              ? "destructive"
                              : rec.impact === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {rec.impact} impact
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <p className="mb-3 text-muted-foreground text-sm">
                        {rec.description}
                      </p>
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="font-medium text-green-600">
                            {formatCurrency(rec.potentialSavings)}/month
                          </span>
                          <span className="ml-1 text-muted-foreground">
                            savings
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">{rec.timeframe}</span>
                          <span className="ml-1 text-muted-foreground">
                            timeframe
                          </span>
                        </div>
                        <div>
                          <span className="font-medium capitalize">
                            {rec.effort}
                          </span>
                          <span className="ml-1 text-muted-foreground">
                            effort
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline">Implement</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="benchmarks">
          {/* Benchmark Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockInsightsData.benchmarks.map((benchmark, index) => (
                  <div className="space-y-3" key={index.toString()}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-sm">
                          {benchmark.metric}
                        </span>
                        {getPerformanceIcon(benchmark.performance)}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div
                            className={`font-bold text-sm ${getPerformanceColor(benchmark.performance)}`}
                          >
                            {benchmark.value}%
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Your Value
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{benchmark.benchmark}%</div>
                          <div className="text-muted-foreground text-xs">
                            Industry Average
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress
                        className="flex-1"
                        value={Math.min(
                          (benchmark.value / benchmark.benchmark) * 100,
                          150
                        )}
                      />
                      <span
                        className={`text-xs ${getPerformanceColor(benchmark.performance)}`}
                      >
                        {benchmark.performance === "above"
                          ? "Above"
                          : benchmark.performance === "below"
                            ? "Below"
                            : "At"}{" "}
                        benchmark
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockInsightsData.benchmarks
                  .filter((b) => b.performance === "above")
                  .map((item, index) => (
                    <div
                      className="flex items-center space-x-3 rounded-lg bg-green-50 p-3"
                      key={index.toString()}
                    >
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">{item.metric}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.value}% vs {item.benchmark}% industry average
                        </p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockInsightsData.benchmarks
                  .filter((b) => b.performance === "below")
                  .map((item, index) => (
                    <div
                      className="flex items-center space-x-3 rounded-lg bg-red-50 p-3"
                      key={index.toString()}
                    >
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-sm">{item.metric}</p>
                        <p className="text-muted-foreground text-xs">
                          {item.value}% vs {item.benchmark}% industry average
                        </p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="optimization">
          {/* Optimization Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Cost Optimization Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {mockOptimizationOpportunities.map((opp, index) => (
                  <div className="rounded-lg border p-4" key={index.toString()}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{opp.category}</h3>
                      <Badge
                        variant={opp.confidence > 80 ? "default" : "secondary"}
                      >
                        {opp.confidence}% confidence
                      </Badge>
                    </div>

                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="font-bold text-lg text-red-600">
                          {formatCurrency(opp.current)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Current Cost
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="font-bold text-green-600 text-lg">
                          {formatCurrency(opp.optimized)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Optimized Cost
                        </p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3 text-center">
                        <div className="font-bold text-green-600 text-lg">
                          {formatCurrency(opp.savings)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Monthly Savings
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 font-medium text-sm">
                        Recommended Actions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {opp.actions.map((action, actionIndex) => (
                          <Badge key={actionIndex.toString()} variant="outline">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Optimization Impact */}
                <div className="rounded-lg border border-green-200 bg-linear-to-r from-green-50 to-blue-50 p-6">
                  <div className="text-center">
                    <h3 className="mb-2 font-bold text-xl">
                      Total Optimization Impact
                    </h3>
                    <div className="mb-2 font-bold text-3xl text-green-600">
                      {formatCurrency(
                        mockOptimizationOpportunities.reduce(
                          (sum, opp) => sum + opp.savings,
                          0
                        )
                      )}
                    </div>
                    <p className="mb-4 text-muted-foreground text-sm">
                      Potential monthly savings across all categories
                    </p>
                    <div className="grid gap-4 text-sm md:grid-cols-2">
                      <div>
                        <span className="font-medium">Annual Impact:</span>
                        <span className="ml-2 font-bold text-green-600">
                          {formatCurrency(
                            mockOptimizationOpportunities.reduce(
                              (sum, opp) => sum + opp.savings,
                              0
                            ) * 12
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Cost Reduction:</span>
                        <span className="ml-2 font-bold">
                          {(
                            (mockOptimizationOpportunities.reduce(
                              (sum, opp) => sum + opp.savings,
                              0
                            ) /
                              mockOptimizationOpportunities.reduce(
                                (sum, opp) => sum + opp.current,
                                0
                              )) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
