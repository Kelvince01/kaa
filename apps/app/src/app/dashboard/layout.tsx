import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import DashboardLayoutContainer from "@/routes/dashboard/layout";
// import { GlobalSheets } from "@/components/global-sheets";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard
      requiredRole={[
        "property_manager",
        "manager",
        "landlord",
        "owner",
        "maintenance",
      ]}
    >
      <DashboardLayoutContainer>
        {/* <GlobalSheets /> */}
        {children}
      </DashboardLayoutContainer>
    </AuthGuard>
  );
}
