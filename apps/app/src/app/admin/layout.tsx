import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthGuard } from "@/modules/auth/components/auth-guard";
import AdminLayoutContainer from "@/routes/admin/layout";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  description: "Admin dashboard for Kaa",
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthGuard requiredRole={["admin", "super_admin"]}>
      <AdminLayoutContainer>{children}</AdminLayoutContainer>
    </AuthGuard>
  );
}
