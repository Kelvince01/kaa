"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
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
import { Skeleton } from "@kaa/ui/components/skeleton";
import { Switch } from "@kaa/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  Brain,
  Calculator,
  CheckCircle,
  DollarSign,
  Download,
  Layers,
  LineChart,
  PauseCircle,
  PieChart,
  PlayCircle,
  RefreshCw,
  Settings,
  Share2,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import { ForecastingDashboard } from "@/modules/financials/components";

const ForecastingContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [forecastModel, setForecastModel] = useState("linear");
  const [forecastPeriod, setForecastPeriod] = useState("12");
  const [includeSeasonality, setIncludeSeasonality] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [isRunningForecast, setIsRunningForecast] = useState(false);

  // Check if user is landlord or admin
  if (
    !authLoading &&
    isAuthenticated &&
    user?.role !== "landlord" &&
    user?.role !== "admin"
  ) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Access Denied</h1>
          <p className="text-muted-foreground">
            Only landlords and admins can access forecasting dashboards.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (authLoading || !(isAuthenticated || authLoading)) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleRunForecast = () => {
    setIsRunningForecast(true);
    // Simulate forecast computation
    setTimeout(() => {
      setIsRunningForecast(false);
    }, 3000);
  };

  const handleExport = () => {
    console.log("Exporting forecasting data...");
  };

  const handleShare = () => {
    console.log("Sharing forecasting report...");
  };

  // Mock forecasting data
  const forecastMetrics = {
    predictedRevenue: 52_500,
    revenueConfidence: 87,
    predictedExpenses: 21_200,
    expenseConfidence: 92,
    projectedGrowth: 15.8,
    riskFactor: "Low",
  };

  const scenarios = [
    {
      id: "optimistic",
      name: "Optimistic",
      description: "Best-case scenario with market growth",
      probability: 25,
      revenue: 58_000,
      expenses: 19_500,
      netIncome: 38_500,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "realistic",
      name: "Realistic",
      description: "Most likely scenario based on trends",
      probability: 60,
      revenue: 52_500,
      expenses: 21_200,
      netIncome: 31_300,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "conservative",
      name: "Conservative",
      description: "Cautious scenario with market downturn",
      probability: 15,
      revenue: 47_000,
      expenses: 23_500,
      netIncome: 23_500,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const budgetForecasts = [
    {
      category: "Rental Income",
      currentMonth: 38_500,
      nextMonth: 39_200,
      nextQuarter: 118_500,
      variance: 1.8,
      trend: "up",
    },
    {
      category: "Maintenance",
      currentMonth: 8500,
      nextMonth: 7200,
      nextQuarter: 24_600,
      variance: -15.3,
      trend: "down",
    },
    {
      category: "Utilities",
      currentMonth: 4200,
      nextMonth: 4350,
      nextQuarter: 13_200,
      variance: 3.6,
      trend: "up",
    },
    {
      category: "Insurance",
      currentMonth: 2800,
      nextMonth: 2800,
      nextQuarter: 8400,
      variance: 0,
      trend: "stable",
    },
    {
      category: "Property Tax",
      currentMonth: 3200,
      nextMonth: 3200,
      nextQuarter: 9600,
      variance: 0,
      trend: "stable",
    },
  ];

  // Tab navigation items
  const tabs = [
    {
      id: "dashboard",
      name: "Forecasting Dashboard",
      icon: LineChart,
    },
    {
      id: "scenarios",
      name: "Scenario Analysis",
      icon: Layers,
    },
    {
      id: "budget",
      name: "Budget Forecasts",
      icon: Calculator,
    },
    {
      id: "settings",
      name: "Model Settings",
      icon: Settings,
    },
  ];

  const forecastModels = [
    { value: "linear", label: "Linear Regression" },
    { value: "arima", label: "ARIMA (Advanced)" },
    { value: "exponential", label: "Exponential Smoothing" },
    { value: "ml", label: "Machine Learning (Beta)" },
  ];

  const forecastPeriods = [
    { value: "3", label: "3 Months" },
    { value: "6", label: "6 Months" },
    { value: "12", label: "12 Months" },
    { value: "24", label: "24 Months" },
  ];

  const confidenceLevels = [
    { value: "80", label: "80%" },
    { value: "90", label: "90%" },
    { value: "95", label: "95%" },
    { value: "99", label: "99%" },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center font-bold text-3xl tracking-tight">
              <Brain className="mr-3 h-8 w-8 text-indigo-600" />
              Financial Forecasting
            </h1>
            <p className="text-muted-foreground">
              Predictive analytics and scenario planning for informed financial
              decision-making.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isRunningForecast}
              onClick={handleRunForecast}
            >
              {isRunningForecast ? (
                <PauseCircle className="mr-2 h-4 w-4 animate-pulse" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              {isRunningForecast ? "Running..." : "Run Forecast"}
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleShare} size="sm" variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Forecast Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Predicted Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${forecastMetrics.predictedRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <Badge className="text-xs" variant="secondary">
                {forecastMetrics.revenueConfidence}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Predicted Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${forecastMetrics.predictedExpenses.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <Badge className="text-xs" variant="secondary">
                {forecastMetrics.expenseConfidence}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Projected Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {forecastMetrics.projectedGrowth}%
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-muted-foreground text-xs">
                next 12 months
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Risk Assessment
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {forecastMetrics.riskFactor}
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-muted-foreground text-xs">
                stable outlook
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forecasting Status */}
      {isRunningForecast && (
        <Alert>
          <Activity className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Analyzing financial data and generating forecasts... This may take a
            few moments.
          </AlertDescription>
        </Alert>
      )}

      {/* Forecasting Tabs */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                className="flex items-center space-x-2"
                key={tab.id}
                value={tab.id}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent className="space-y-4" value="dashboard">
          <Alert>
            <LineChart className="h-4 w-4" />
            <AlertDescription>
              Interactive forecasting dashboard with predictive charts and trend
              analysis.
            </AlertDescription>
          </Alert>
          <div className="min-h-[600px]">
            <ForecastingDashboard />
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="scenarios">
          <Alert>
            <Layers className="h-4 w-4" />
            <AlertDescription>
              Compare different scenarios to understand potential outcomes and
              plan accordingly.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card
                className="transition-shadow hover:shadow-lg"
                key={scenario.id}
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{scenario.name}</h3>
                      <Badge
                        className={`text-xs ${scenario.bgColor} ${scenario.color}`}
                        variant="secondary"
                      >
                        {scenario.probability}% probability
                      </Badge>
                    </div>
                    <PieChart className={`h-8 w-8 ${scenario.color}`} />
                  </div>
                  <p className="mb-4 text-muted-foreground text-sm">
                    {scenario.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue:</span>
                      <span className="font-medium">
                        ${scenario.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Expenses:</span>
                      <span className="font-medium">
                        ${scenario.expenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-sm">Net Income:</span>
                      <span className="font-bold">
                        ${scenario.netIncome.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="budget">
          <Alert>
            <Calculator className="h-4 w-4" />
            <AlertDescription>
              Category-wise budget forecasts with variance analysis and trend
              indicators.
            </AlertDescription>
          </Alert>
          <div className="space-y-4">
            {budgetForecasts.map((budget, index) => (
              <Card key={index.toString()}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-6">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(budget.trend)}
                      <div>
                        <h4 className="font-medium">{budget.category}</h4>
                        <p className="text-muted-foreground text-xs">
                          {budget.variance > 0 ? "+" : ""}
                          {budget.variance}% vs last period
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">
                        Current Month
                      </p>
                      <p className="font-semibold">
                        ${budget.currentMonth.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">
                        Next Month
                      </p>
                      <p className="font-semibold">
                        ${budget.nextMonth.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">
                        Next Quarter
                      </p>
                      <p className="font-semibold">
                        ${budget.nextQuarter.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <Badge
                        className="text-xs"
                        variant={
                          budget.variance > 0 ? "destructive" : "default"
                        }
                      >
                        {budget.variance > 0 ? "+" : ""}
                        {budget.variance}%
                      </Badge>
                    </div>
                    <div className="text-center">
                      <span
                        className={`font-medium text-sm ${getTrendColor(budget.trend)}`}
                      >
                        {budget.trend.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="settings">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Configure forecasting models and parameters to customize
              prediction accuracy.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forecast-model">Forecasting Model</Label>
                  <Select
                    onValueChange={setForecastModel}
                    value={forecastModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {forecastModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forecast-period">Forecast Period</Label>
                  <Select
                    onValueChange={setForecastPeriod}
                    value={forecastPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      {forecastPeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-level">Confidence Level</Label>
                  <Select
                    onValueChange={setConfidenceLevel}
                    value={confidenceLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select confidence" />
                    </SelectTrigger>
                    <SelectContent>
                      {confidenceLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="seasonality">Include Seasonality</Label>
                    <p className="text-muted-foreground text-sm">
                      Account for seasonal patterns in data
                    </p>
                  </div>
                  <Switch
                    checked={includeSeasonality}
                    id="seasonality"
                    onCheckedChange={setIncludeSeasonality}
                  />
                </div>
                <div className="border-t pt-4">
                  <Button
                    className="w-full"
                    disabled={isRunningForecast}
                    onClick={handleRunForecast}
                  >
                    {isRunningForecast ? (
                      <>
                        <PauseCircle className="mr-2 h-4 w-4 animate-pulse" />
                        Running Forecast...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Apply Settings & Run Forecast
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForecastingContainer;
