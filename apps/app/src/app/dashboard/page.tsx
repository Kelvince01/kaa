"use client";

import dynamic from "next/dynamic";
import { RoleBasedContent } from "@/components/role-based-content";

const LandlordDashboard = dynamic(() => import("@/routes/dashboard"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
    </div>
  ),
});

const TenantDashboard = dynamic(() => import("@/routes/dashboard/tenant"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2 border-b-2" />
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <RoleBasedContent
      admin={<LandlordDashboard />}
      fallback={<LandlordDashboard />}
      landlord={<LandlordDashboard />}
      manager={<LandlordDashboard />}
      tenant={<TenantDashboard />}
    />
  );
}
