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
  BarChart3,
  DollarSign,
  Download,
  Eye,
  Filter,
  Layers,
  RefreshCw,
  Share2,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  EnhancedInteractiveDashboard,
  ForecastingDashboard,
  InteractiveAnalyticsDashboard,
} from "@/modules/financials/components";

const EnhancedDashboardContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("interactive");
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30_000); // 30 seconds
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");

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
            Only landlords and admins can access enhanced analytics dashboards.
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

  // Auto-refresh functionality
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  // biome-ignore lint/correctness/useHookAtTopLevel: ignore
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleExport = () => {
    console.log("Exporting enhanced dashboard data...");
    // Implement export functionality
  };

  const handleShare = () => {
    console.log("Sharing enhanced dashboard...");
    // Implement share functionality
  };

  // Mock enhanced analytics data
  const enhancedMetrics = {
    totalRevenue: 42_750,
    revenueChange: 8.5,
    totalExpenses: 18_350,
    expenseChange: -4.2,
    netIncome: 24_400,
    incomeChange: 12.8,
    efficiencyRatio: 91.2,
    efficiencyChange: 3.1,
  };

  const performanceInsights = [
    {
      id: "1",
      title: "Revenue Optimization",
      description: "Property rent increases show positive impact",
      impact: "high",
      type: "revenue",
      value: "+$3,200",
    },
    {
      id: "2",
      title: "Cost Reduction",
      description: "Energy-efficient upgrades reducing utility costs",
      impact: "medium",
      type: "savings",
      value: "-$850",
    },
    {
      id: "3",
      title: "Market Opportunity",
      description: "Local rental market showing 15% growth potential",
      impact: "high",
      type: "opportunity",
      value: "+$4,100",
    },
    {
      id: "4",
      title: "Risk Alert",
      description: "Property maintenance costs trending higher",
      impact: "low",
      type: "risk",
      value: "+$420",
    },
  ];

  // Tab navigation items
  const tabs = [
    {
      id: "interactive",
      name: "Interactive Analytics",
      icon: BarChart3,
    },
    {
      id: "enhanced",
      name: "Enhanced Dashboard",
      icon: Layers,
    },
    {
      id: "forecasting",
      name: "Forecasting",
      icon: TrendingUp,
    },
    {
      id: "insights",
      name: "Performance Insights",
      icon: Activity,
    },
  ];

  const timeRanges = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "savings":
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case "opportunity":
        return <Target className="h-4 w-4 text-purple-600" />;
      case "risk":
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center font-bold text-3xl tracking-tight">
              <Zap className="mr-3 h-8 w-8 text-purple-600" />
              Enhanced Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Advanced financial analytics with real-time insights, forecasting,
              and performance optimization.
            </p>
          </div>
          <div className="flex items-center space-x-3">
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

      {/* Enhanced Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${enhancedMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 text-xs">
                +{enhancedMetrics.revenueChange}%
              </span>
              <span className="text-muted-foreground text-xs">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${enhancedMetrics.totalExpenses.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingDown className="h-3 w-3 text-green-600" />
              <span className="text-green-600 text-xs">
                {enhancedMetrics.expenseChange}%
              </span>
              <span className="text-muted-foreground text-xs">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Net Income</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              ${enhancedMetrics.netIncome.toLocaleString()}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 text-xs">
                +{enhancedMetrics.incomeChange}%
              </span>
              <span className="text-muted-foreground text-xs">
                from last month
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Efficiency Ratio
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {enhancedMetrics.efficiencyRatio}%
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600 text-xs">
                +{enhancedMetrics.efficiencyChange}%
              </span>
              <span className="text-muted-foreground text-xs">
                efficiency gain
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={autoRefresh}
                  id="auto-refresh"
                  onCheckedChange={setAutoRefresh}
                />
                <Label className="text-sm" htmlFor="auto-refresh">
                  Auto-refresh
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isRealTimeMode}
                  id="real-time"
                  onCheckedChange={setIsRealTimeMode}
                />
                <Label className="text-sm" htmlFor="real-time">
                  Real-time mode
                </Label>
                {isRealTimeMode && (
                  <Badge className="text-xs" variant="secondary">
                    <Activity className="mr-1 h-3 w-3" />
                    LIVE
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Label className="text-sm" htmlFor="time-range">
                  Time Range:
                </Label>
                <select
                  className="rounded border px-2 py-1 text-sm"
                  id="time-range"
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  value={selectedTimeRange}
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button size="sm" variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Analytics Tabs */}
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

        <TabsContent className="space-y-4" value="interactive">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Interactive charts and visualizations with drill-down capabilities
              and real-time data updates.
            </AlertDescription>
          </Alert>
          <div className="min-h-[600px]">
            <InteractiveAnalyticsDashboard />
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="enhanced">
          <Alert>
            <Layers className="h-4 w-4" />
            <AlertDescription>
              Advanced dashboard with multiple data layers, custom
              visualizations, and enhanced interactivity.
            </AlertDescription>
          </Alert>
          <div className="min-h-[600px]">
            <EnhancedInteractiveDashboard />
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="forecasting">
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Predictive analytics and financial forecasting based on historical
              data and market trends.
            </AlertDescription>
          </Alert>
          <div className="min-h-[600px]">
            <ForecastingDashboard />
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="insights">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              AI-powered performance insights and recommendations to optimize
              your financial operations.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {performanceInsights.map((insight) => (
              <Card
                className="transition-shadow hover:shadow-md"
                key={insight.id}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">{getTypeIcon(insight.type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <h4 className="font-medium text-sm">
                            {insight.title}
                          </h4>
                          <Badge
                            className={`text-xs ${getImpactColor(insight.impact)}`}
                          >
                            {insight.impact}
                          </Badge>
                        </div>
                        <p className="mb-2 text-muted-foreground text-sm">
                          {insight.description}
                        </p>
                        <div className="font-semibold text-lg">
                          {insight.value}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDashboardContainer;
