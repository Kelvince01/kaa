/**
 * Virtual Tours Analytics Page
 */

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Brain,
  Globe,
  Monitor,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shell } from "@/components/shell";
// import { TourAnalyticsDashboad } from "@/modules/properties/virtual-tours";

export const metadata: Metadata = {
  title: "Virtual Tours Analytics | Dashboard",
  description:
    "Comprehensive analytics and ML insights for your virtual tours.",
};

export default function VirtualToursAnalyticsPage() {
  return (
    <Shell className="gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/properties/virtual-tours">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tours
          </Button>
        </Link>

        <div>
          <h1 className="font-bold text-2xl">Virtual Tours Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and AI-powered insights for your virtual
            tours
          </p>
        </div>
      </div>

      {/* Analytics Features */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto mb-2 h-8 w-8 text-blue-600" />
            <h3 className="font-medium text-blue-700">Standard Analytics</h3>
            <p className="mt-1 text-blue-600 text-xs">
              Views, engagement, device breakdown
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4 text-center">
            <Brain className="mx-auto mb-2 h-8 w-8 text-purple-600" />
            <h3 className="font-medium text-purple-700">ML Insights</h3>
            <p className="mt-1 text-purple-600 text-xs">
              AI predictions and behavior patterns
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <h3 className="font-medium text-green-700">Real-time Metrics</h3>
            <p className="mt-1 text-green-600 text-xs">
              Live viewers and engagement
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <Globe className="mx-auto mb-2 h-8 w-8 text-orange-600" />
            <h3 className="font-medium text-orange-700">Global Insights</h3>
            <p className="mt-1 text-orange-600 text-xs">
              Geographic and market analysis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Performance Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-blue-600">127.3K</p>
            <p className="text-muted-foreground text-sm">Total Views</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-green-600">98.7K</p>
            <p className="text-muted-foreground text-sm">Unique Visitors</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />
              +8.3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-purple-600">4.2min</p>
            <p className="text-muted-foreground text-sm">Avg Duration</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />
              +0.8min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-orange-600">73.2%</p>
            <p className="text-muted-foreground text-sm">Completion</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />
              +5.1%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-red-600">8.9%</p>
            <p className="text-muted-foreground text-sm">Conversion</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-green-600 text-xs">
              <TrendingUp className="h-3 w-3" />
              +2.1%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <p className="font-bold text-2xl text-indigo-600">156</p>
            <p className="text-muted-foreground text-sm">Live Now</p>
            <Badge className="mt-1 text-xs" variant="outline">
              <Activity className="mr-1 h-2 w-2" />
              Live
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Mobile Views</p>
                <p className="font-bold text-xl">68.4%</p>
                <p className="text-green-600 text-xs">+5.2% vs last month</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Desktop Views</p>
                <p className="font-bold text-xl">27.1%</p>
                <p className="text-muted-foreground text-xs">
                  -2.1% vs last month
                </p>
              </div>
              <Monitor className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">XR Sessions</p>
                <p className="font-bold text-xl">4.5%</p>
                <p className="text-green-600 text-xs">+0.8% vs last month</p>
              </div>
              <div className="text-2xl text-purple-500">🥽</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Analytics
            </CardTitle>
            <Badge className="flex items-center gap-1" variant="outline">
              <Zap className="h-3 w-3" />
              AI-Enhanced
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs className="space-y-4" defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tours">Tours</TabsTrigger>
              <TabsTrigger value="ml-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="real-time">Real-time</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="py-12 text-center">
                <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  Analytics Overview
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Select a specific tour to view detailed analytics
                </p>
                <Link href="/dashboard/properties/virtual-tours">
                  <Button variant="outline">Select Tour to Analyze</Button>
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="tours">
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Individual tour analytics will be displayed here when you
                  select a specific tour
                </p>
              </div>
            </TabsContent>

            <TabsContent value="ml-insights">
              <div className="py-12 text-center">
                <Brain className="mx-auto mb-4 h-16 w-16 text-purple-500" />
                <h3 className="mb-2 font-semibold text-lg">
                  AI-Powered Insights
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Machine learning analytics provide deeper insights into user
                  behavior and tour performance
                </p>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Card className="border-blue-200">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                      <h4 className="font-medium">Engagement Predictions</h4>
                      <p className="text-muted-foreground text-xs">
                        Forecast viewer engagement and optimal timing
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200">
                    <CardContent className="p-4 text-center">
                      <Users className="mx-auto mb-2 h-6 w-6 text-green-600" />
                      <h4 className="font-medium">User Behavior Patterns</h4>
                      <p className="text-muted-foreground text-xs">
                        Understand how users navigate through tours
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Zap className="mx-auto mb-2 h-6 w-6 text-purple-600" />
                      <h4 className="font-medium">Performance Optimization</h4>
                      <p className="text-muted-foreground text-xs">
                        AI-driven recommendations for better performance
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="real-time">
              <div className="py-12 text-center">
                <Activity className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h3 className="mb-2 font-semibold text-lg">
                  Real-time Monitoring
                </h3>
                <p className="text-muted-foreground">
                  Live metrics and viewer activity will be displayed here
                </p>
              </div>
            </TabsContent>

            <TabsContent value="predictions">
              <div className="py-12 text-center">
                <Brain className="mx-auto mb-4 h-16 w-16 text-indigo-500" />
                <h3 className="mb-2 font-semibold text-lg">AI Predictions</h3>
                <p className="text-muted-foreground">
                  Machine learning predictions for tour performance and
                  optimization
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Shell>
  );
}
