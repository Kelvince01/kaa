"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Building,
  DollarSign,
  Eye,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAnalyticsStats } from "../../analytics.queries";
import {
  generatePieChartConfig,
  MonthlyViewsChart,
  PieChartComponent,
  PropertyTypesChart,
} from "../charts";
import { PerformanceComparisonChart } from "./performance-comparison-chart";
import { PropertyDistributionChart } from "./property-distribution-chart";
import { RevenueChart } from "./revenue-chart";

export function AnalyticsOverview() {
  const { data: stats, isLoading, error } = useAnalyticsStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i.toString()}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Failed to load analytics overview
        </p>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const cards = [
    {
      title: "Properties",
      value: stats.counts?.properties.toLocaleString(),
      description: "Total properties",
      icon: Building,
      trend: "+8.2%",
      trendUp: true,
    },
    {
      title: "Total Users",
      value: stats.counts?.users.toLocaleString(),
      description: "Registered users",
      icon: Users,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.revenue?.total),
      description: "All-time revenue",
      icon: DollarSign,
      trend: "+15.3%",
      trendUp: true,
    },
    {
      title: "Bookings",
      value: stats.counts?.bookings.toLocaleString(),
      description: "Total bookings",
      icon: Eye,
      trend: "+23.1%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? TrendingUp : TrendingDown;

          return (
            <Card key={index.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{card.value}</div>
                <div className="mt-2 flex items-center space-x-2">
                  <Badge
                    className="flex items-center space-x-1 text-xs"
                    variant={card.trendUp ? "default" : "destructive"}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{card.trend}</span>
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Property Type Distribution - Enhanced with Chart */}
        <div className="space-y-6">
          {stats.propertyTypeStats && stats.propertyTypeStats.length > 0 ? (
            <PieChartComponent
              config={generatePieChartConfig(
                stats.propertyTypeStats.map((stat) => stat._id || "Unknown")
              )}
              data={{
                labels: stats.propertyTypeStats.map(
                  (stat) => stat._id || "Unknown"
                ),
                datasets: [
                  {
                    label: "count",
                    data: stats.propertyTypeStats.map((stat) => stat.count),
                  },
                ],
              }}
              height={300}
              innerRadius={50}
              outerRadius={100}
              showLabels={false}
              showLegend={true}
              title="Property Types Distribution"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Types</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-muted-foreground">
                  No property data available
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Role Distribution - Enhanced with Chart */}
        <div className="space-y-6">
          {stats.userRoleStats && stats.userRoleStats.length > 0 ? (
            <PieChartComponent
              config={generatePieChartConfig(
                stats.userRoleStats.map((stat) => stat._id || "Unknown")
              )}
              data={{
                labels: stats.userRoleStats.map(
                  (stat) => stat._id || "Unknown"
                ),
                datasets: [
                  {
                    label: "count",
                    data: stats.userRoleStats.map((stat) => stat.count),
                  },
                ],
              }}
              height={300}
              innerRadius={50}
              outerRadius={100}
              showLabels={false}
              showLegend={true}
              title="User Roles Distribution"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="py-8 text-center text-muted-foreground">
                  No user data available
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced Charts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Performance Analytics</h2>
          <Badge className="text-xs" variant="outline">
            Real-time Data
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart period="90d" />
          <PropertyDistributionChart type="type" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <PerformanceComparisonChart metric="score" />
        </div>
      </div>

      {/* Modern Chart Showcase */}
      <div className="space-y-6 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">Trending Insights</h2>
          <div className="rounded-lg bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
            shadcn charts
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MonthlyViewsChart />
          <PropertyTypesChart />
        </div>
      </div>
    </div>
  );
}
