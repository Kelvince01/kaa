"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
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
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Phone,
  Share,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import type { Property } from "@/modules/properties/property.type";

type PropertyAnalyticsProps = {
  property: Property;
};

type AnalyticsData = {
  views: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  inquiries: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    responseRate: number;
  };
  engagement: {
    favorites: number;
    shares: number;
    contactAttempts: number;
    viewingRequests: number;
  };
  demographics: {
    viewerAge: { range: string; percentage: number }[];
    viewerType: { type: string; percentage: number }[];
    peakTimes: { time: string; views: number }[];
  };
  performance: {
    rank: number;
    totalProperties: number;
    category: string;
    score: number;
  };
};

export function PropertyAnalytics({ property }: PropertyAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock analytics data (would come from API)
  const analyticsData: AnalyticsData = {
    views: {
      total: 1247,
      thisWeek: 89,
      thisMonth: 312,
      trend: 15.2,
    },
    inquiries: {
      total: 23,
      thisWeek: 4,
      thisMonth: 12,
      responseRate: 87,
    },
    engagement: {
      favorites: 34,
      shares: 12,
      contactAttempts: 18,
      viewingRequests: 8,
    },
    demographics: {
      viewerAge: [
        { range: "25-34", percentage: 45 },
        { range: "35-44", percentage: 28 },
        { range: "18-24", percentage: 15 },
        { range: "45+", percentage: 12 },
      ],
      viewerType: [
        { type: "First-time renters", percentage: 38 },
        { type: "Upgrading", percentage: 32 },
        { type: "Relocating", percentage: 20 },
        { type: "Downsizing", percentage: 10 },
      ],
      peakTimes: [
        { time: "6-9 PM", views: 234 },
        { time: "12-2 PM", views: 187 },
        { time: "7-9 AM", views: 156 },
        { time: "2-4 PM", views: 143 },
      ],
    },
    performance: {
      rank: 12,
      totalProperties: 450,
      category: "2-bedroom apartments in Kilimani",
      score: 8.4,
    },
  };

  console.log(property);

  const getEngagementRate = () =>
    ((analyticsData.inquiries.total / analyticsData.views.total) * 100).toFixed(
      1
    );

  const getPerformancePercentile = () =>
    Math.round(
      ((analyticsData.performance.totalProperties -
        analyticsData.performance.rank) /
        analyticsData.performance.totalProperties) *
        100
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Property Analytics
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6 space-y-6" value="overview">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Total Views</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.views.total.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 text-xs">
                    +{analyticsData.views.trend}% this month
                  </span>
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Inquiries</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.inquiries.total}
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {getEngagementRate()}% engagement rate
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Favorites</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.engagement.favorites}
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {(
                    (analyticsData.engagement.favorites /
                      analyticsData.views.total) *
                    100
                  ).toFixed(1)}
                  % of viewers
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Performance</span>
                </div>
                <div className="font-bold text-2xl">
                  #{analyticsData.performance.rank}
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  Top {getPerformancePercentile()}%
                </div>
              </Card>
            </div>

            {/* Weekly/Monthly Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Views this week</span>
                    <span className="font-semibold">
                      {analyticsData.views.thisWeek}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Views this month</span>
                    <span className="font-semibold">
                      {analyticsData.views.thisMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inquiries this week</span>
                    <span className="font-semibold">
                      {analyticsData.inquiries.thisWeek}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inquiries this month</span>
                    <span className="font-semibold">
                      {analyticsData.inquiries.thisMonth}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 font-bold text-3xl text-green-600">
                    {analyticsData.inquiries.responseRate}%
                  </div>
                  <Progress
                    className="mb-2"
                    value={analyticsData.inquiries.responseRate}
                  />
                  <p className="text-muted-foreground text-xs">
                    Response rate to inquiries. Industry average is 75%.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Ranking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      Rank #{analyticsData.performance.rank} of{" "}
                      {analyticsData.performance.totalProperties}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {analyticsData.performance.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-2xl text-blue-600">
                      {analyticsData.performance.score}/10
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Overall Score
                    </div>
                  </div>
                </div>
                <Progress className="mb-2" value={getPerformancePercentile()} />
                <p className="text-muted-foreground text-xs">
                  Your property ranks in the top {getPerformancePercentile()}%
                  of similar properties in the area.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="engagement">
            {/* Engagement Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Share className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Shares</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.engagement.shares}
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Contact Attempts</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.engagement.contactAttempts}
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Viewing Requests</span>
                </div>
                <div className="font-bold text-2xl">
                  {analyticsData.engagement.viewingRequests}
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm">Avg. Time on Page</span>
                </div>
                <div className="font-bold text-2xl">3:24</div>
              </Card>
            </div>

            {/* Peak Viewing Times */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Peak Viewing Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.demographics.peakTimes.map((time) => (
                    <div
                      className="flex items-center justify-between"
                      key={time.time}
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          className="w-16 justify-center"
                          variant="outline"
                        >
                          {time.time}
                        </Badge>
                        <Progress
                          className="w-32"
                          value={
                            ((time.views || 0) /
                              (analyticsData.demographics.peakTimes[0]?.views ||
                                0)) *
                            100
                          }
                        />
                      </div>
                      <span className="font-medium text-sm">
                        {time.views} views
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6 space-y-6" value="demographics">
            {/* Viewer Age Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Viewer Age Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.viewerAge.map((age) => (
                    <div
                      className="flex items-center justify-between"
                      key={age.range}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-16 font-medium text-sm">
                          {age.range}
                        </span>
                        <Progress className="w-48" value={age.percentage} />
                      </div>
                      <span className="text-sm">{age.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Viewer Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Viewer Intent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.demographics.viewerType.map((type) => (
                    <div
                      className="flex items-center justify-between"
                      key={type.type}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-32 font-medium text-sm">
                          {type.type}
                        </span>
                        <Progress className="w-32" value={type.percentage} />
                      </div>
                      <span className="text-sm">{type.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Activity className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-700 text-sm">
                      Key Insights
                    </p>
                    <ul className="mt-1 space-y-1 text-blue-600 text-xs">
                      <li>
                        • Most viewers are young professionals (25-34) looking
                        to upgrade
                      </li>
                      <li>
                        • Peak interest occurs during evening hours (6-9 PM)
                      </li>
                      <li>
                        • High engagement rate suggests competitive pricing
                      </li>
                      <li>
                        • Response rate above industry average indicates good
                        landlord reputation
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
