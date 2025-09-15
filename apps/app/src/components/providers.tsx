"use client";

import { type ConfigMode, config } from "@kaa/config";
import { Toaster } from "@kaa/ui/components/sonner";
// import { useAuthStore } from "@/modules/auth/auth.store";
// import GuidedTour from "./tours/guided-tour";
import { TooltipProvider } from "@kaa/ui/components/tooltip";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
// import AuthLoader from "@/modules/auth/components/auth-loader";
import { DesktopProvider } from "@/contexts/desktop";
import { useBreakpoints } from "@/hooks/use-breakpoints";
// import { useOnlineManager } from "@/hooks/use-online-manager";
import { QueryClientProvider } from "@/query/provider";
import { addBadgeToFavicon } from "@/shared/utils/add-badge-to-favicon";

export function Providers({ children }: { children: React.ReactNode }) {
  // const { isOnline } = useOnlineManager();
  const isMobile: boolean = useBreakpoints("max", "sm");
  // const { user, isLoading } = useAuthStore();
  // Add badge to favicon based on config mode
  addBadgeToFavicon(config.mode as ConfigMode);

  const toastPosition = isMobile ? "top-center" : "bottom-right";

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableColorScheme
      enableSystem
    >
      <DesktopProvider />
      <QueryClientProvider>
        {/* <AuthLoader> */}
        {/* {!isLoading && user && (
					<GuidedTour userRole={user.role as "landlord" | "tenant" | "admin" | "agent"} />
				)} */}

        <Analytics />

        <TooltipProvider delayDuration={120}>{children}</TooltipProvider>

        <Toaster
          position={toastPosition}
          richColors
          toastOptions={{ className: "max-sm:mb-16" }}
        />
        <ReactQueryDevtools initialIsOpen={false} />
        {/* </AuthLoader> */}
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
