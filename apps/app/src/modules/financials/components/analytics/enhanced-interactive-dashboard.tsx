import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@kaa/ui/components/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { format, subMonths } from "date-fns";
import {
  Activity,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter as FilterIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  RefreshCw,
  Share,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { ImportExportDialog } from "../import-export/import-export-dialog";
import {
  AnalyticsFilters,
  type AnalyticsFilters as AnalyticsFiltersType,
} from "./filters/analytics-filters";
import { ChartRefresher } from "./filters/chart-refresher";

type EnhancedInteractiveAnalyticsDashboardProps = {
  className?: string;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "##82CA9D",
];

// Mock data - replace with real data from hooks
const generateMockData = (_filters: AnalyticsFiltersType) => {
  const months: {
    month: string;
    date: Date;
    expenses: number;
    income: number;
    maintenance: number;
    utilities: number;
    insurance: number;
    marketing: number;
  }[] = [];
  const currentDate = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(currentDate, i);
    months.push({
      month: format(date, "MMM yyyy"),
      date,
      expenses: Math.floor(Math.random() * 5000) + 2000,
      income: Math.floor(Math.random() * 8000) + 4000,
      maintenance: Math.floor(Math.random() * 1500) + 500,
      utilities: Math.floor(Math.random() * 800) + 200,
      insurance: Math.floor(Math.random() * 600) + 300,
      marketing: Math.floor(Math.random() * 1200) + 400,
    });
  }

  return months;
};

const generateCategoryData = () => [
  { name: "Maintenance", value: 4500, color: "#0088FE" },
  { name: "Utilities", value: 3200, color: "#00C49F" },
  { name: "Insurance", value: 2800, color: "#FFBB28" },
  { name: "Marketing", value: 2100, color: "#FF8042" },
  { name: "Office Supplies", value: 1200, color: "#8884D8" },
  { name: "Professional Services", value: 1800, color: "#82CA9D" },
];

export function EnhancedInteractiveAnalyticsDashboard({
  className,
}: EnhancedInteractiveAnalyticsDashboardProps) {
  const [filters, setFilters] = useState<AnalyticsFiltersType>({
    timeframe: "month",
    groupBy: "category",
    comparison: "none",
    includeRecurring: true,
    taxDeductibleOnly: false,
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(300);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const [showFilters, setShowFilters] = useState(true);

  // Generate filtered data based on current filters
  const chartData = useMemo(() => generateMockData(filters), [filters]);

  const categoryData = useMemo(() => {
    let data = generateCategoryData();

    // Apply category filters
    if (filters.categories && filters.categories.length > 0) {
      data = data.filter((item) => filters.categories?.includes(item.name));
    }

    // Apply amount filters
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      data = data.filter((item) => {
        const inRange =
          (!filters.minAmount || item.value >= filters.minAmount) &&
          (!filters.maxAmount || item.value <= filters.maxAmount);
        return inRange;
      });
    }

    return data;
  }, [filters]);

  // KPI calculations
  const kpis = useMemo(() => {
    const currentMonth: any = chartData.at(-1) || {};
    const previousMonth: any = chartData.at(-2) || {};

    const totalExpenses = currentMonth.expenses || 0;
    const expenseChange = previousMonth.expenses
      ? ((totalExpenses - previousMonth.expenses) / previousMonth.expenses) *
        100
      : 0;

    const totalIncome = currentMonth.income || 0;
    const incomeChange = previousMonth.income
      ? ((totalIncome - previousMonth.income) / previousMonth.income) * 100
      : 0;

    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalExpenses,
      expenseChange,
      totalIncome,
      incomeChange,
      netProfit,
      profitMargin,
    };
  }, [chartData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: AnalyticsFiltersType) => {
      setFilters(newFilters);
      setLastUpdated(new Date());
    },
    []
  );

  const toggleSeries = (seriesName: string) => {
    const newHidden = new Set(hiddenSeries);
    if (newHidden.has(seriesName)) {
      newHidden.delete(seriesName);
    } else {
      newHidden.add(seriesName);
    }
    setHiddenSeries(newHidden);
  };

  const handleExportSuccess = (result: any) => {
    toast.success(`Export successful! File: ${result.filename}`);
  };

  const handleExportError = (error: string) => {
    toast.error(`Export failed: ${error}`);
  };

  const handleImportSuccess = (result: any) => {
    toast.success(
      `Import successful! ${result.successCount} records imported.`
    );
    // Refresh data
    handleRefresh();
  };

  const handleImportError = (error: string) => {
    toast.error(`Import failed: ${error}`);
  };

  const renderChart = () => {
    switch (chartType) {
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {!hiddenSeries.has("expenses") && (
              <Line
                dataKey="expenses"
                name="Expenses"
                stroke="#8884d8"
                strokeWidth={2}
                type="monotone"
              />
            )}
            {!hiddenSeries.has("income") && (
              <Line
                dataKey="income"
                name="Income"
                stroke="#82ca9d"
                strokeWidth={2}
                type="monotone"
              />
            )}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {!hiddenSeries.has("expenses") && (
              <Area
                dataKey="expenses"
                fill="#8884d8"
                fillOpacity={0.6}
                name="Expenses"
                stackId="1"
                stroke="#8884d8"
                type="monotone"
              />
            )}
            {!hiddenSeries.has("income") && (
              <Area
                dataKey="income"
                fill="#82ca9d"
                fillOpacity={0.6}
                name="Income"
                stackId="1"
                stroke="#82ca9d"
                type="monotone"
              />
            )}
          </AreaChart>
        );
      default: // bar
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {!hiddenSeries.has("expenses") && (
              <Bar dataKey="expenses" fill="#8884d8" name="Expenses" />
            )}
            {!hiddenSeries.has("income") && (
              <Bar dataKey="income" fill="#82ca9d" name="Income" />
            )}
          </BarChart>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Enhanced Analytics Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time financial insights with advanced import/export
            capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
            variant="ghost"
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            {showFilters ? "Hide" : "Show"} Filters
          </Button>

          <ImportExportDialog
            dataType="expenses"
            mode="import"
            onError={handleImportError}
            onSuccess={handleImportSuccess}
            trigger={
              <Button size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            }
          />

          <ImportExportDialog
            dataType="expenses"
            mode="export"
            onError={handleExportError}
            onSuccess={handleExportSuccess}
            trigger={
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            }
          />

          <Button size="sm" variant="outline">
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${kpis.totalExpenses.toLocaleString()}
            </div>
            <p className="flex items-center text-muted-foreground text-xs">
              {kpis.expenseChange >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              )}
              {Math.abs(kpis.expenseChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${kpis.totalIncome.toLocaleString()}
            </div>
            <p className="flex items-center text-muted-foreground text-xs">
              {kpis.incomeChange >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              {Math.abs(kpis.incomeChange).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Net Profit</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${kpis.netProfit.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">
              {kpis.profitMargin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Data Freshness
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {format(lastUpdated, "HH:mm")}
            </div>
            <p className="text-muted-foreground text-xs">
              Last updated {format(lastUpdated, "MMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup className="min-h-[600px]" direction="horizontal">
        {/* Filters Panel */}
        {showFilters && (
          <>
            <ResizablePanel defaultSize={25} maxSize={35} minSize={20}>
              <div className="space-y-4 pr-4">
                <AnalyticsFilters
                  currentFilters={filters}
                  onFiltersChange={handleFiltersChange}
                  showAdvancedFilters={false}
                />

                <ChartRefresher
                  autoRefresh={autoRefresh}
                  isRefreshing={isRefreshing}
                  lastUpdated={lastUpdated}
                  onAutoRefreshChange={setAutoRefresh}
                  onIntervalChange={setRefreshInterval}
                  onRefresh={handleRefresh}
                  refreshInterval={refreshInterval}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Charts Panel */}
        <ResizablePanel defaultSize={showFilters ? 75 : 100}>
          <div className={showFilters ? "pl-4" : ""}>
            <Tabs className="space-y-4" defaultValue="overview">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="comparison">Comparison</TabsTrigger>
                </TabsList>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Badge className="text-xs" variant="outline">
                    {chartData.length} records
                  </Badge>
                  <Button onClick={handleRefresh} size="sm" variant="ghost">
                    <RefreshCw
                      className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <TabsContent className="space-y-4" value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        Financial Overview
                        {filters.comparison !== "none" && (
                          <Badge className="ml-2" variant="secondary">
                            vs {filters.comparison}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        {/* Chart Type Selector */}
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => setChartType("bar")}
                            size="sm"
                            variant={
                              chartType === "bar" ? "default" : "outline"
                            }
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setChartType("line")}
                            size="sm"
                            variant={
                              chartType === "line" ? "default" : "outline"
                            }
                          >
                            <LineChartIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => setChartType("area")}
                            size="sm"
                            variant={
                              chartType === "area" ? "default" : "outline"
                            }
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Series Toggle */}
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => toggleSeries("expenses")}
                            size="sm"
                            variant="ghost"
                          >
                            {hiddenSeries.has("expenses") ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="ml-1 text-xs">Expenses</span>
                          </Button>
                          <Button
                            onClick={() => toggleSeries("income")}
                            size="sm"
                            variant="ghost"
                          >
                            {hiddenSeries.has("income") ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-green-600" />
                            )}
                            <span className="ml-1 text-xs">Income</span>
                          </Button>
                        </div>

                        {/* Export specific chart data */}
                        <ImportExportDialog
                          dataType="analytics"
                          mode="export"
                          onError={handleExportError}
                          onSuccess={handleExportSuccess}
                          trigger={
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer height="100%" width="100%">
                        {renderChart()}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent className="space-y-4" value="categories">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <PieChartIcon className="mr-2 h-5 w-5" />
                        Expense Categories
                        {filters.categories &&
                          filters.categories.length > 0 && (
                            <Badge className="ml-2" variant="secondary">
                              {filters.categories.length} selected
                            </Badge>
                          )}
                      </CardTitle>
                      <ImportExportDialog
                        dataType="expenses"
                        mode="export"
                        onError={handleExportError}
                        onSuccess={handleExportSuccess}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer height="100%" width="100%">
                        <PieChart>
                          <Pie
                            cx="50%"
                            cy="50%"
                            data={categoryData}
                            dataKey="value"
                            fill="#8884d8"
                            label={({ name, percent }) =>
                              `${name} ${((percent as number) || 0 * 100).toFixed(1)}%`
                            }
                            outerRadius={120}
                          >
                            {categoryData.map((_: any, index: number) => (
                              <Cell
                                fill={COLORS[index % COLORS.length]}
                                key={`cell-${index.toString()}`}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `$${value.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent className="space-y-4" value="trends">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Category Trends</CardTitle>
                      <div className="flex items-center space-x-2">
                        <ImportExportDialog
                          dataType="expenses"
                          mode="import"
                          onError={handleImportError}
                          onSuccess={handleImportSuccess}
                          trigger={
                            <Button size="sm" variant="ghost">
                              <Upload className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <ImportExportDialog
                          dataType="reports"
                          mode="export"
                          onError={handleExportError}
                          onSuccess={handleExportSuccess}
                          trigger={
                            <Button size="sm" variant="ghost">
                              <FileText className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer height="100%" width="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            dataKey="maintenance"
                            fill="#8884d8"
                            name="Maintenance"
                            stackId="1"
                            stroke="#8884d8"
                            type="monotone"
                          />
                          <Area
                            dataKey="utilities"
                            fill="#82ca9d"
                            name="Utilities"
                            stackId="1"
                            stroke="#82ca9d"
                            type="monotone"
                          />
                          <Area
                            dataKey="insurance"
                            fill="#ffc658"
                            name="Insurance"
                            stackId="1"
                            stroke="#ffc658"
                            type="monotone"
                          />
                          <Area
                            dataKey="marketing"
                            fill="#ff7c7c"
                            name="Marketing"
                            stackId="1"
                            stroke="#ff7c7c"
                            type="monotone"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent className="space-y-4" value="comparison">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Period Comparison</CardTitle>
                      <ImportExportDialog
                        dataType="analytics"
                        mode="export"
                        onError={handleExportError}
                        onSuccess={handleExportSuccess}
                        trigger={
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer height="100%" width="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="expenses"
                            fill="#8884d8"
                            name="Current Period Expenses"
                          />
                          <Bar
                            dataKey="income"
                            fill="#82ca9d"
                            name="Current Period Income"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
