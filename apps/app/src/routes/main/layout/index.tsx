import type { ReactNode } from "react";
import Alerter from "@/components/common/alerter";
import { Footer } from "./footer";
import { Header } from "./header";

type MainLayoutContainerProps = {
  children: ReactNode;
  disablePadding?: boolean;
};

export function MainLayoutContainer({
  children,
  disablePadding = false,
}: MainLayoutContainerProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-emerald-100">
      <Header />
      <Alerter mode="public" />
      <main className={`grow ${disablePadding ? "" : "pt-16"}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
