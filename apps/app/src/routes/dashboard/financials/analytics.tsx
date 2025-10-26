"use client";

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
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  PieChart,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  ExpenseAnalyticsDashboard,
  InteractiveAnalyticsDashboard,
} from "@/modules/financials/components";

const AnalyticsContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("expense-analytics");
  const [timeframe, setTimeframe] = useState("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            Only landlords and admins can access financial analytics.
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleExport = () => {
    console.log("Exporting analytics data...");
    // TODO: Implement export functionality
  };

  // Tab navigation items
  const tabs = [
    {
      id: "expense-analytics",
      name: "Expense Analytics",
      icon: BarChart3,
      component: () => <ExpenseAnalyticsDashboard className="space-y-6" />,
    },
    {
      id: "interactive-analytics",
      name: "Interactive Dashboard",
      icon: Activity,
      component: () => <InteractiveAnalyticsDashboard className="space-y-6" />,
    },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Financial Analytics
            </h1>
            <p className="text-muted-foreground">
              Deep insights into your financial performance and expense
              patterns.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Select onValueChange={setTimeframe} value={timeframe}>
              <SelectTrigger className="w-32">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button
              disabled={isRefreshing}
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={handleExport} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Expenses
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$25,200</div>
            <p className="text-muted-foreground text-xs">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Categories</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">8</div>
            <p className="text-muted-foreground text-xs">
              Maintenance is highest at 28.4%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Avg Monthly</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">$4,200</div>
            <p className="text-muted-foreground text-xs">
              <span className="text-red-600">-2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Budget Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">92%</div>
            <p className="text-muted-foreground text-xs">
              <Badge className="text-xs" variant="secondary">
                On Track
              </Badge>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2">
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

        {tabs.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent className="space-y-4" key={tab.id} value={tab.id}>
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default AnalyticsContainer;
