import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import AccountLayoutContainer from "@/routes/account/layout";
// import { GlobalSheets } from "@/components/global-sheets";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="tenant">
      <AccountLayoutContainer>
        {/* <GlobalSheets /> */}
        {children}
      </AccountLayoutContainer>
    </AuthGuard>
  );
}
