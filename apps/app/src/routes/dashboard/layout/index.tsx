"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@kaa/ui/components/sidebar";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { NavMain, NavUser, OrgSwitcher } from "@/components/layout/sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { User } from "@/modules/users/user.type";
import { DashboardHeader } from "./header";
import { dashboardSidebarItems } from "./sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
};

function DashboardLayoutContainer({ children }: DashboardLayoutProps) {
  const { user } = useAuthStore();

  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run this on the client side and after authentication status is determined
    if (isClient && !isLoading && !isAuthenticated) {
      router.push(
        `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      );
    }
  }, [isClient, isAuthenticated, isLoading, router]);

  // Show nothing while checking authentication state
  if (!isClient || isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <OrgSwitcher
            organizations={dashboardSidebarItems(user as User).organizations}
          />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={dashboardSidebarItems(user as User).navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user as User} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <DashboardHeader />

        {/* from-emerald-50 via-white to-emerald-50 */}
        <main className="flex-1 bg-gradient-to-br from-primary-50 via-white to-primary-50">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardLayoutContainer;
