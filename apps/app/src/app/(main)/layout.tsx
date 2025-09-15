"use client";

import type { ReactNode } from "react";
import { MainLayoutContainer } from "@/routes/main/layout";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayoutContainer disablePadding={true}>{children}</MainLayoutContainer>
  );
}
