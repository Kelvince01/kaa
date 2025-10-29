"use client";

import { Button } from "@kaa/ui/components/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useSystemStats } from "@/modules/admin/admin.queries";
import { PlatformOverview } from "@/modules/admin/components/stats/platform-overview";
import { RecentActivity } from "@/modules/admin/components/stats/recent-activity";
import { SystemStatsCards } from "@/modules/admin/components/stats/system-stats-cards";
import BookingChart from "./components/booking-chart";
import PropertyStats from "./components/property-stats";
import { QuickActions } from "./components/quick-actions";
import RevenueChart from "./components/revenue-chart";
import UserStats from "./components/user-stats";

export default function AdminDashboardContainer() {
  const [period, setPeriod] = useState<
    "custom" | "daily" | "monthly" | "yearly"
  >("monthly");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const {
    data: dashboardStats,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
    error: dashboardError,
  } = useSystemStats({
    year: period === "custom" ? year.toString() : undefined,
    month: period === "custom" ? month.toString() : undefined,
    period: period === "custom" ? "custom" : period,
  });

  const revenueStats = [
    {
      period: 1,
      revenue: 100,
      count: 100,
    },
  ];
  const bookingStats = [
    {
      month: "January",
      bookings: 100,
      completed: 100,
      cancelled: 0,
    },
  ];
  const propertyStats = {
    totalProperties: dashboardStats?.stats?.properties?.total || 0,
    activeListings: dashboardStats?.stats?.properties?.active || 0,
    viewsThisMonth: 0, // dashboardStats?.stats?.properties?.views || 0,
    averageRating: 0, // dashboardStats?.stats?.properties?.rating || 0,
    propertyTypeDistribution: [
      {
        name: "House",
        value: 100,
      },
      {
        name: "Apartment",
        value: 100,
      },
    ], // dashboardStats?.stats?.properties?.typeDistribution || [],
  };
  const userStats = {
    totalUsers: dashboardStats?.stats?.users?.total || 0,
    newUsersThisMonth: 100, // dashboardStats?.stats?.users?.newUsersThisMonth,
    activeUsers: 100, // dashboardStats?.stats?.users?.activeUsers,
    landlordCount: dashboardStats?.stats?.users?.landlords || 0,
    tenantCount: dashboardStats?.stats?.users?.tenants || 0,
    userGrowthData: [
      {
        // dashboardStats?.stats?.users?.growth
        month: "January",
        tenants: 100,
        landlords: 100,
        total: 200,
      },
      {
        month: "February",
        tenants: 100,
        landlords: 100,
        total: 200,
      },
      {
        month: "March",
        tenants: 100,
        landlords: 100,
        total: 200,
      },
    ],
  };

  const handleRefresh = () => {
    refetchDashboard();
  };

  const handlePeriodChange = (
    newPeriod: "custom" | "daily" | "monthly" | "yearly"
  ) => {
    setPeriod(newPeriod);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(Number.parseInt(e.target.value, 10));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number.parseInt(e.target.value, 10));
  };

  const isLoading = isDashboardLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-green-500 border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system performance and recent activity.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "daily"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("daily")}
            >
              Daily
            </Button>

            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "monthly"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("monthly")}
            >
              Monthly
            </Button>

            <Button
              className={`rounded-md px-3 py-1 font-medium text-sm ${
                period === "yearly"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => handlePeriodChange("yearly")}
            >
              Yearly
            </Button>
          </div>

          {period === "monthly" && (
            <select
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
              onChange={handleYearChange}
              value={year}
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          {period === "daily" && (
            <>
              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                onChange={handleYearChange}
                value={year}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                onChange={handleMonthChange}
                value={month}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </>
          )}

          <Button
            className="flex items-center rounded-md bg-gray-200 px-3 py-1 font-medium text-gray-700 text-sm hover:bg-gray-300"
            disabled={isLoading}
            onClick={handleRefresh}
          >
            <RefreshCw className={`mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SystemStatsCards
          error={dashboardError}
          isLoading={isDashboardLoading}
          stats={dashboardStats}
        />
        <PlatformOverview
          stats={{
            tenantPercent: 50,
            landlordPercent: 50,
            avgBookingRate: 50,
            avgResponseTime: 50,
            verifiedPropertyPercent: 50,
          }}
        />
      </div>

      <div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">
              Revenue
            </h2>
            <RevenueChart data={revenueStats} period={period} />
          </div>

          <div className="rounded-lg bg-white p-4 shadow-md">
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">
              Bookings
            </h2>
            <BookingChart data={bookingStats} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-md">
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">
              Property Analytics
            </h2>
            <PropertyStats {...propertyStats} />
          </div>

          <div className="rounded-lg bg-white p-4 shadow-md">
            <h2 className="mb-4 font-semibold text-gray-800 text-lg">
              User Analytics
            </h2>
            <UserStats {...userStats} />
          </div>
        </div>
      </div>

      <RecentActivity isLoading={isDashboardLoading} stats={dashboardStats} />
      <QuickActions />
    </div>
  );
}
