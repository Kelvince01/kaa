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
import { CreditCard } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { type ReactNode, useEffect, useMemo, useState } from "react";
import { NavMain, NavUser } from "@/components/layout/sidebar";
import { useAuthStore } from "@/modules/auth/auth.store";
import type { User } from "@/modules/users/user.type";
import { accountSidebarItems } from "./sidebar";

type AccountLayoutProps = {
  children: ReactNode;
};

function AccountLayoutContainer({ children }: AccountLayoutProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const isLandlord = user?.role === "landlord";

  // Dynamically create sidebar items based on user role
  const sidebarItems = useMemo(() => {
    const baseItems = [...accountSidebarItems.navMain];

    if (isLandlord) {
      return [
        ...baseItems.slice(0, 2),
        {
          url: "/account/subscription",
          title: "Subscription",
          icon: CreditCard,
        },
        ...baseItems.slice(2),
      ];
    }

    return baseItems;
  }, [isLandlord]);

  // Helper: flatten nav items for easy lookup
  const navItems = useMemo(() => {
    const flat: { [key: string]: { title: string; url: string } } = {};
    for (const item of sidebarItems) {
      flat[item.url] = { title: item.title, url: item.url };
    }
    return flat;
  }, [sidebarItems]);

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { title: string; url: string }[] = [];
    let url = "";
    for (const [i, segment] of segments.entries()) {
      url = `${url}/${segment}`;
      if (url === "/account") {
        crumbs.push({ title: "Account", url });
      } else if (navItems[url]) {
        crumbs.push({ title: navItems[url]?.title ?? "", url });
      } else {
        // fallback: show segment as is (e.g., IDs)
        crumbs.push({ title: decodeURIComponent(segment), url });
      }
    }
    return crumbs;
  }, [pathname, navItems]);

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect(() => {
  // 	// Only run this on the client side and after authentication status is determined
  // 	if (isClient && !isLoading && !isAuthenticated) {
  // 		router.push(`/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
  // 	}
  // }, [isClient, isAuthenticated, isLoading, router]);

  // Show nothing while checking authentication state
  // if (!isClient || isLoading || !isAuthenticated) {
  // 	return (
  // 		<div className="flex min-h-screen items-center justify-center bg-gray-50">
  // 			<div className="h-12 w-12 animate-spin rounded-full border-primary-600 border-t-2 border-b-2" />
  // 		</div>
  // 	);
  // }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={sidebarItems} />
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

export default AccountLayoutContainer;
