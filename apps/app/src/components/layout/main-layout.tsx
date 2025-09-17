"use client";

import type React from "react";
import type { ReactNode } from "react";
// import Alerter from "../common/alerter";
import Footer from "../layout/footer";
import MainNavigation from "../layout/main-navigation";

type MainLayoutProps = {
  children: ReactNode;
  disablePadding?: boolean;
};

/**
 * Client-side main layout component used across all pages with App Router
 * Includes navigation and footer
 */
const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  disablePadding = false,
}) => {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNavigation />
      {/* <Alerter mode="app" /> */}

      <main className={`flex-grow ${disablePadding ? "" : "pt-16"}`}>
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default MainLayout;
