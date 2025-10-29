import type { Metadata } from "next";
import { AnalyticsOverview } from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Analytics Overview | Dashboard",
  description: "Analytics and insights for your properties and portfolio.",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Analytics Overview
        </h1>
        <p className="text-muted-foreground">
          Key metrics and insights for your properties and portfolio.
        </p>
      </div>

      <AnalyticsOverview />
    </div>
  );
}
