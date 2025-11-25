"use client";

import { useUserContext } from "@/modules/me";
import { DashboardAiInsightsAndRecommendations } from "./layout/tenant/ai-insights-and-recommendations";
import { MonthlyRevenueChart } from "./layout/tenant/monthly-revenue-chart";
import { DashboardOverview } from "./layout/tenant/overview";
import { PropertyInfo } from "./layout/tenant/property-info";
import { QuickActions } from "./layout/tenant/quick-actions";
import { RecentActivities } from "./layout/tenant/recent-activities";
import { DashboardStats } from "./layout/tenant/stats";

/**
 * Tenant-specific dashboard
 * Shows tenant's rented property, payment status, maintenance requests, etc.
 */
export default function TenantDashboard() {
  const { profile } = useUserContext();

  // Get tenant-specific data from profile
  const tenantData = profile?.data;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <DashboardOverview />

      {/* Quick Stats */}
      <DashboardStats />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardAiInsightsAndRecommendations />

        <MonthlyRevenueChart />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <QuickActions />
        {/* Property Information */}
        {tenantData?.property && (
          <PropertyInfo
            leaseEnd={
              tenantData?.endDate
                ? new Date(tenantData?.endDate).toLocaleDateString()
                : "N/A"
            }
            leaseStart={
              tenantData?.startDate
                ? new Date(tenantData?.startDate).toLocaleDateString()
                : "N/A"
            }
            manager={`${tenantData?.property?.landlord?.personalInfo?.firstName} ${tenantData?.property?.landlord?.personalInfo?.lastName}`}
            property={tenantData?.property?.title}
            unit={tenantData?.unit?.unitNumber || "N/A"}
          />
        )}
        {/* Recent Activities */}
        <RecentActivities />
      </div>
    </div>
  );
}
