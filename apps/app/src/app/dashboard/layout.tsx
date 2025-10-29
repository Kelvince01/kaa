import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import DashboardLayoutContainer from "@/routes/dashboard/layout";
// import { GlobalSheets } from "@/components/global-sheets";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard
      requiredRole={[
        "admin", // Admin can access all dashboards - for testing purposes
        "property_manager", // Property manager can access the property manager dashboard
        "manager", // Manager can access the manager dashboard
        "landlord", // Landlord can access the landlord dashboard
        "owner", // Owner can access the owner dashboard
        "maintenance", // Maintenance can access the maintenance dashboard
        "tenant", // Tenant can access the tenant dashboard
      ]}
    >
      <DashboardLayoutContainer>
        {/* <GlobalSheets /> */}
        {children}
      </DashboardLayoutContainer>
    </AuthGuard>
  );
}
