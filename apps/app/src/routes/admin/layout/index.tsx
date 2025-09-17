"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@kaa/ui/components/breadcrumb";
import { Separator } from "@kaa/ui/components/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@kaa/ui/components/sidebar";
import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavMain, NavUser, OrgSwitcher } from "@/components/layout/sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { User } from "@/modules/users/user.type";
import { adminSidebarItems } from "./sidebar";

type AdminLayoutProps = {
  children: ReactNode;
};

function AdminLayoutContainer({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Helper: flatten nav items for easy lookup
  const navItems = useMemo(() => {
    const flat: { [key: string]: { title: string; url: string } } = {};
    for (const item of adminSidebarItems.navMain) {
      flat[item.url] = { title: item.title, url: item.url };
      if (item.items) {
        for (const sub of item.items) {
          flat[sub.url] = { title: sub.title, url: sub.url };
        }
      }
    }
    return flat;
  }, []);

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { title: string; url: string }[] = [];
    let url = "";

    for (const segment of segments) {
      url = `${url}/${segment}`;
      if (url === "/admin") {
        crumbs.push({ title: "Admin", url });
      } else if (navItems[url]) {
        crumbs.push({ title: navItems[url]?.title ?? "", url });
      } else {
        // fallback: show segment as is (e.g., IDs)
        crumbs.push({ title: decodeURIComponent(segment), url });
      }
    }
    return crumbs;
  }, [pathname, navItems]);

  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect(() => {
  // 	// Only run this on the client side and after authentication status is determined
  // 	if (isClient && !isLoading && !isAuthenticated) {
  // 		router.push(`/accounts/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
  // 	}
  // }, [isClient, isAuthenticated, isLoading, router]);

  // Show nothing while checking authentication state
  if (!isClient || isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <OrgSwitcher organizations={adminSidebarItems.organizations} />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={adminSidebarItems.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user as User} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              className="mr-2 data-[orientation=vertical]:h-4"
              orientation="vertical"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, idx) => (
                  <React.Fragment key={item.url}>
                    <BreadcrumbItem>
                      {idx < breadcrumbItems.length - 1 ? (
                        <BreadcrumbLink href={item.url}>
                          {item.title}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{item.title}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {idx < breadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator />
                    )}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayoutContainer;
