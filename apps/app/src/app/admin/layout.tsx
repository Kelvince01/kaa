import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import AdminLayoutContainer from "@/routes/admin/layout";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard requiredRole="admin">
      <AdminLayoutContainer>{children}</AdminLayoutContainer>
    </AuthGuard>
  );
}
