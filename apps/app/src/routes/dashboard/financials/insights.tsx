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
import { Progress } from "@kaa/ui/components/progress";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Lightbulb,
  Settings,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  EnhancedInteractiveDashboard,
  FinancialInsightsDashboard,
} from "@/modules/financials/components";

const InsightsContainer = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("insights");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            Only landlords and admins can access financial insights.
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  // Mock data for quick insights
  const quickInsights = [
    {
      type: "success",
      title: "Strong Financial Health",
      description:
        "Your overall financial health score is 78/100, indicating good performance.",
      score: 78,
      icon: CheckCircle,
    },
    {
      type: "warning",
      title: "Budget Overspend Alert",
      description: "Marketing expenses exceeded budget by 18% this month.",
      score: 82,
      icon: AlertTriangle,
    },
    {
      type: "info",
      title: "Growth Opportunity",
      description: "Revenue growth is 12.3% YTD - consider scaling operations.",
      score: 91,
      icon: TrendingUp,
    },
  ];

  const recommendations = [
    {
      priority: "high",
      title: "Optimize Marketing Spend",
      description:
        "Focus marketing budget on highest-performing channels to improve ROI.",
      potential: "$400/month",
      effort: "Medium",
    },
    {
      priority: "high",
      title: "Preventive Maintenance Program",
      description:
        "Implement scheduled maintenance to reduce emergency repair costs.",
      potential: "$600/month",
      effort: "High",
    },
    {
      priority: "medium",
      title: "Energy Efficiency Audit",
      description:
        "Conduct energy audit to identify additional cost-saving opportunities.",
      potential: "$200/month",
      effort: "Low",
    },
  ];

  // Tab navigation items
  const tabs = [
    {
      id: "insights",
      name: "AI Insights",
      icon: Brain,
      component: () => <FinancialInsightsDashboard className="space-y-6" />,
    },
    {
      id: "enhanced",
      name: "Enhanced Dashboard",
      icon: Activity,
      component: () => <EnhancedInteractiveDashboard className="space-y-6" />,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getInsightColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      case "info":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center font-bold text-3xl tracking-tight">
              <Brain className="mr-3 h-8 w-8 text-blue-600" />
              Financial Insights
            </h1>
            <p className="text-muted-foreground">
              AI-powered insights and recommendations to optimize your financial
              performance.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isAnalyzing}
              onClick={handleRunAnalysis}
            >
              {isAnalyzing ? (
                <>
                  <Zap className="mr-2 h-4 w-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* AI Analysis Progress */}
      {isAnalyzing && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Running comprehensive financial analysis...</p>
              <Progress className="w-full" value={66} />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Insights Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickInsights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Card
              className={`border-l-4 ${getInsightColor(insight.type)}`}
              key={index.toString()}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center font-medium text-sm">
                    <Icon className="mr-2 h-4 w-4" />
                    {insight.title}
                  </CardTitle>
                  <Badge className="text-xs" variant="secondary">
                    {insight.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{insight.description}</p>
                {insight.score && (
                  <div className="mt-3">
                    <Progress className="h-2 w-full" value={insight.score} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5 text-yellow-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                className="flex items-start justify-between rounded-lg border bg-card p-4"
                key={index.toString()}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge
                      className={`text-xs ${getPriorityColor(rec.priority)}`}
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {rec.description}
                  </p>
                  <div className="flex items-center space-x-4 text-muted-foreground text-xs">
                    <span className="flex items-center">
                      <Target className="mr-1 h-3 w-3" />
                      Potential: {rec.potential}
                    </span>
                    <span className="flex items-center">
                      <Settings className="mr-1 h-3 w-3" />
                      Effort: {rec.effort}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights Tabs */}
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

export default InsightsContainer;
