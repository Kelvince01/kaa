import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
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
  AlertTriangle,
  BarChart3,
  DollarSign,
  Download,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/shared/utils/format.util";
import {
  useBudgetAnalysis,
  useExpenseAnalytics,
  useExpenseComparison,
  useFinancialTrends,
} from "../../analytics.queries";
import {
  BudgetComparisonChart,
  CashFlowAreaChart,
  CategoryBarChart,
  ExpenseDistributionChart,
  ExpenseTrendChart,
  KPICard,
} from "./charts/chart-components";

type ExpenseAnalyticsDashboardProps = {
  className?: string;
};

// Mock data for demonstration
const mockExpenseTrendData = [
  {
    month: "Jan 2024",
    expenses: 4200,
    maintenance: 1200,
    utilities: 800,
    insurance: 600,
    other: 1600,
  },
  {
    month: "Feb 2024",
    expenses: 3800,
    maintenance: 1100,
    utilities: 750,
    insurance: 600,
    other: 1350,
  },
  {
    month: "Mar 2024",
    expenses: 4500,
    maintenance: 1400,
    utilities: 900,
    insurance: 600,
    other: 1600,
  },
  {
    month: "Apr 2024",
    expenses: 3900,
    maintenance: 1000,
    utilities: 800,
    insurance: 600,
    other: 1500,
  },
  {
    month: "May 2024",
    expenses: 4300,
    maintenance: 1250,
    utilities: 850,
    insurance: 600,
    other: 1600,
  },
  {
    month: "Jun 2024",
    expenses: 4100,
    maintenance: 1200,
    utilities: 800,
    insurance: 600,
    other: 1500,
  },
];

const mockCategoryData = [
  { category: "Maintenance", amount: 7150, percentage: 28.4, count: 15 },
  { category: "Utilities", amount: 4900, percentage: 19.5, count: 12 },
  { category: "Insurance", amount: 3600, percentage: 14.3, count: 6 },
  { category: "Marketing", amount: 2800, percentage: 11.1, count: 8 },
  { category: "Office Supplies", amount: 2200, percentage: 8.7, count: 18 },
  {
    category: "Professional Services",
    amount: 1900,
    percentage: 7.5,
    count: 4,
  },
  { category: "Travel", amount: 1500, percentage: 6.0, count: 7 },
  { category: "Other", amount: 1150, percentage: 4.5, count: 9 },
];

const mockBudgetData = [
  { category: "Maintenance", budgeted: 8000, actual: 7150, variance: -850 },
  { category: "Utilities", budgeted: 5000, actual: 4900, variance: -100 },
  { category: "Insurance", budgeted: 3600, actual: 3600, variance: 0 },
  { category: "Marketing", budgeted: 2500, actual: 2800, variance: 300 },
  { category: "Office Supplies", budgeted: 2000, actual: 2200, variance: 200 },
  {
    category: "Professional Services",
    budgeted: 2000,
    actual: 1900,
    variance: -100,
  },
];

const mockCashFlowData = [
  { month: "Jan", income: 8500, expenses: 4200, netCashFlow: 4300 },
  { month: "Feb", income: 8200, expenses: 3800, netCashFlow: 4400 },
  { month: "Mar", income: 8800, expenses: 4500, netCashFlow: 4300 },
  { month: "Apr", income: 8600, expenses: 3900, netCashFlow: 4700 },
  { month: "May", income: 9100, expenses: 4300, netCashFlow: 4800 },
  { month: "Jun", income: 8900, expenses: 4100, netCashFlow: 4800 },
];

export function ExpenseAnalyticsDashboard({
  className,
}: ExpenseAnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">(
    "month"
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const { data: expenseAnalytics, isLoading: analyticsLoading } =
    useExpenseAnalytics(timeframe);
  const { data: financialTrends, isLoading: trendsLoading } =
    useFinancialTrends(timeframe);
  const { data: budgetAnalysis, isLoading: budgetLoading } =
    useBudgetAnalysis(timeframe);
  const { data: expenseComparison, isLoading: comparisonLoading } =
    useExpenseComparison(timeframe);

  // Calculate KPIs
  const currentMonthExpenses = useMemo(
    () => mockExpenseTrendData.at(-1)?.expenses || 0,
    []
  );

  const previousMonthExpenses = useMemo(
    () => mockExpenseTrendData.at(-2)?.expenses || 0,
    []
  );

  const expenseChange = currentMonthExpenses - previousMonthExpenses;
  const expenseChangePercent = (expenseChange / previousMonthExpenses) * 100;

  const totalExpenses = useMemo(
    () => mockCategoryData.reduce((sum, cat) => sum + cat.amount, 0),
    []
  );

  const averageMonthlyExpense = useMemo(
    () =>
      mockExpenseTrendData.reduce((sum, month) => sum + month.expenses, 0) /
      mockExpenseTrendData.length,
    []
  );

  const largestCategory = useMemo(
    () =>
      mockCategoryData.reduce(
        (max, cat) => (cat.amount > (max?.amount || 0) ? cat : max),
        mockCategoryData[0]
      ),
    []
  );

  const budgetVariance = useMemo(() => {
    const totalBudgeted = mockBudgetData.reduce(
      (sum, item) => sum + item.budgeted,
      0
    );
    const totalActual = mockBudgetData.reduce(
      (sum, item) => sum + item.actual,
      0
    );
    return totalActual - totalBudgeted;
  }, []);

  const handleExportData = () => {
    console.log("Exporting analytics data...");
    // Implement export functionality
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl">Expense Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your expense patterns and trends
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            onValueChange={(value) =>
              setTimeframe(value as "month" | "quarter" | "year")
            }
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
          <Button onClick={handleExportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              change={expenseChange}
              changeType="currency"
              icon={DollarSign}
              loading={analyticsLoading}
              title="Total Expenses"
              value={totalExpenses}
            />
            <KPICard
              change={expenseChangePercent}
              changeType="percentage"
              icon={BarChart3}
              loading={analyticsLoading}
              title="Monthly Average"
              value={averageMonthlyExpense}
            />
            <KPICard
              changeType="currency"
              icon={PieChart}
              loading={analyticsLoading}
              title="Largest Category"
              value={largestCategory?.amount || 0}
            />
            <KPICard
              change={budgetVariance}
              changeType="currency"
              icon={budgetVariance > 0 ? TrendingUp : TrendingDown}
              loading={budgetLoading}
              title="Budget Variance"
              value={Math.abs(budgetVariance)}
            />
          </div>

          {/* Main Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseTrendChart
              data={mockExpenseTrendData}
              height={300}
              lines={[
                {
                  dataKey: "expenses",
                  stroke: "#8884d8",
                  name: "Total Expenses",
                },
              ]}
              loading={analyticsLoading}
              title="Expense Trends"
              xDataKey="month"
            />

            <ExpenseDistributionChart
              data={mockCategoryData}
              dataKey="amount"
              height={300}
              loading={analyticsLoading}
              nameKey="category"
              title="Expense Distribution"
            />
          </div>

          {/* Cash Flow Chart */}
          <CashFlowAreaChart
            areas={[
              {
                dataKey: "income",
                stroke: "#82ca9d",
                fill: "#82ca9d",
                name: "Income",
              },
              {
                dataKey: "expenses",
                stroke: "#8884d8",
                fill: "#8884d8",
                name: "Expenses",
              },
              {
                dataKey: "netCashFlow",
                stroke: "#ffc658",
                fill: "#ffc658",
                name: "Net Cash Flow",
              },
            ]}
            data={mockCashFlowData}
            height={300}
            loading={trendsLoading}
            title="Cash Flow Analysis"
            xDataKey="month"
          />

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">Under Budget</p>
                    <p className="text-muted-foreground text-xs">
                      Maintenance expenses are {formatCurrency(850)} under
                      budget this period
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">Trending Up</p>
                    <p className="text-muted-foreground text-xs">
                      Marketing expenses increased by 12% this month
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 rounded-lg border p-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-sm">
                      Optimization Opportunity
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Consider reviewing utility providers for potential savings
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="trends">
          {/* Detailed Trend Analysis */}
          <div className="grid gap-6">
            <ExpenseTrendChart
              data={mockExpenseTrendData}
              height={400}
              lines={[
                {
                  dataKey: "maintenance",
                  stroke: "#8884d8",
                  name: "Maintenance",
                },
                { dataKey: "utilities", stroke: "#82ca9d", name: "Utilities" },
                { dataKey: "insurance", stroke: "#ffc658", name: "Insurance" },
                { dataKey: "other", stroke: "#ff7300", name: "Other" },
              ]}
              loading={analyticsLoading}
              title="Monthly Expense Breakdown"
              xDataKey="month"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Growth Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        category: "Maintenance",
                        growth: -8.2,
                        trend: "decreasing",
                      },
                      {
                        category: "Utilities",
                        growth: 3.1,
                        trend: "increasing",
                      },
                      {
                        category: "Marketing",
                        growth: 12.0,
                        trend: "increasing",
                      },
                      { category: "Insurance", growth: 0.0, trend: "stable" },
                    ].map((item) => (
                      <div
                        className="flex items-center justify-between"
                        key={item.category}
                      >
                        <span className="font-medium text-sm">
                          {item.category}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-sm ${
                              item.growth > 0
                                ? "text-red-600"
                                : item.growth < 0
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {item.growth > 0 ? "+" : ""}
                            {item.growth.toFixed(1)}%
                          </span>
                          {item.growth > 0 ? (
                            <TrendingUp className="h-4 w-4 text-red-600" />
                          ) : item.growth < 0 ? (
                            <TrendingDown className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="mb-2 font-medium">Maintenance Expenses</p>
                      <p className="text-muted-foreground">
                        Peak in March and May due to seasonal property
                        maintenance
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="mb-2 font-medium">Utility Costs</p>
                      <p className="text-muted-foreground">
                        Higher in winter months (Jan-Mar) due to heating costs
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="mb-2 font-medium">Marketing Spend</p>
                      <p className="text-muted-foreground">
                        Consistent throughout the year with slight increases in
                        spring
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="categories">
          {/* Category Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <CategoryBarChart
              bars={[{ dataKey: "amount", fill: "#8884d8", name: "Amount" }]}
              data={mockCategoryData}
              height={400}
              loading={analyticsLoading}
              title="Expenses by Category"
              xDataKey="category"
            />

            <Card>
              <CardHeader>
                <CardTitle>Category Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCategoryData.map((category) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={category.category}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {category.category}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {category.count} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">
                          {formatCurrency(category.amount)}
                        </p>
                        <Badge className="text-xs" variant="secondary">
                          {category.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Maintenance Efficiency",
                    description:
                      "Consider bulk purchasing for maintenance supplies to reduce per-unit costs.",
                    impact: "Potential savings: $200-400/month",
                    priority: "medium",
                  },
                  {
                    title: "Utility Optimization",
                    description:
                      "Review energy providers and consider smart meter installations.",
                    impact: "Potential savings: $150-250/month",
                    priority: "high",
                  },
                  {
                    title: "Marketing ROI",
                    description:
                      "Analyze marketing spend effectiveness and optimize channels.",
                    impact: "Improve ROI by 15-20%",
                    priority: "low",
                  },
                ].map((rec, index) => (
                  <div
                    className="space-y-2 rounded-lg border p-4"
                    key={index.toString()}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <Badge
                        variant={
                          rec.priority === "high"
                            ? "destructive"
                            : rec.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {rec.description}
                    </p>
                    <p className="font-medium text-green-600 text-xs">
                      {rec.impact}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="budget">
          {/* Budget Analysis */}
          <div className="grid gap-6">
            <BudgetComparisonChart
              data={mockBudgetData}
              height={400}
              loading={budgetLoading}
              title="Budget vs Actual Expenses"
              xDataKey="category"
            />

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockBudgetData.map((item) => {
                      const variancePercent =
                        (item.variance / item.budgeted) * 100;
                      return (
                        <div className="space-y-2" key={item.category}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {item.category}
                            </span>
                            <span
                              className={`text-sm ${
                                item.variance < 0
                                  ? "text-green-600"
                                  : item.variance > 0
                                    ? "text-red-600"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {item.variance > 0 ? "+" : ""}
                              {formatCurrency(item.variance)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${
                                item.actual <= item.budgeted
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min((item.actual / item.budgeted) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground text-xs">
                            <span>{formatCurrency(item.actual)} actual</span>
                            <span>
                              {formatCurrency(item.budgeted)} budgeted
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        type: "success",
                        message: "Maintenance budget performing well",
                        detail: "15% under budget this period",
                      },
                      {
                        type: "warning",
                        message: "Marketing expenses approaching limit",
                        detail: "Currently at 85% of monthly budget",
                      },
                      {
                        type: "info",
                        message: "Consider adjusting utility budget",
                        detail: "Consistently under budget by 10-15%",
                      },
                    ].map((alert, index) => (
                      <div
                        className={`rounded-lg border p-3 ${
                          alert.type === "success"
                            ? "border-green-200 bg-green-50"
                            : alert.type === "warning"
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-blue-200 bg-blue-50"
                        }`}
                        key={index.toString()}
                      >
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {alert.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
