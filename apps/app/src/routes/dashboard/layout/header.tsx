import { Icon } from "@iconify/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@kaa/ui/components/breadcrumb";
import { Button } from "@kaa/ui/components/button";
import { Separator } from "@kaa/ui/components/separator";
import { SidebarTrigger } from "@kaa/ui/components/sidebar";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { dialog } from "@/components/common/dialoger/state";
import { ModeToggle } from "@/components/mode-toggle";
import { AIChatAssistant } from "@/modules/ai/components/ai-assistant";
import NotificationPopover from "@/modules/comms/notifications/components/notification-popup";
import { useUserContext } from "@/modules/me";
import { getDashboardSidebarItems } from "./sidebar";

export function DashboardHeader() {
  const pathname = usePathname();
  const { role } = useUserContext();

  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAIAssistantDialog = () => {
    dialog(<AIChatAssistant />, {
      className: "max-w-xl",
      // title: "AI Assistant",
      // description: "AI Assistant",
    });
  };

  // Helper: flatten nav items for easy lookup
  const navItems = useMemo(() => {
    const flat: { [key: string]: { title: string; url: string } } = {};
    const sidebarItems = getDashboardSidebarItems(role?.name);

    for (const item of sidebarItems.navMain) {
      flat[item.url] = { title: item.title, url: item.url };
      // Check if item has sub-items
      const itemWithSubs = item as typeof item & {
        items?: Array<{ title: string; url: string }>;
      };
      if (itemWithSubs.items) {
        for (const sub of itemWithSubs.items) {
          flat[sub.url] = { title: sub.title, url: sub.url };
        }
      }
    }
    return flat;
  }, [role?.name]);

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: { title: string; url: string }[] = [];
    let url = "";
    for (const segment of segments) {
      url = `${url}/${segment}`;
      if (url === "/dashboard") {
        crumbs.push({ title: "Dashboard", url });
      } else if (navItems[url]) {
        crumbs.push({ title: navItems[url]?.title ?? "", url });
      } else {
        // fallback: show segment as is (e.g., IDs)
        crumbs.push({ title: decodeURIComponent(segment), url });
      }
    }
    return crumbs;
  }, [pathname, navItems]);

  return (
    <header
      className={`sticky top-0 z-50 inline-grid max-h-20 min-h-16 shrink-0 items-center gap-2 border-emerald-200 border-b bg-white/80 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-4">
        <div
          className="flex flex-row items-center justify-between gap-2 px-4"
          id="left"
        >
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
                  {idx < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div
          className="mr-4 flex flex-row items-center justify-between gap-x-4"
          id="right"
        >
          <Button
            className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            onClick={openAIAssistantDialog}
            size="sm"
          >
            <Icon className="mr-2 h-4 w-4" icon="material-symbols:smart-toy" />
            Ask AI
          </Button>
          <NotificationPopover />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
