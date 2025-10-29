import type { Metadata } from "next";
import { MarketInsightsPanel } from "@/modules/analytics";

export const metadata: Metadata = {
  title: "Market Intelligence | Dashboard",
  description: "Market insights and competitive analysis.",
};

export default function MarketIntelligencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">
          Market Intelligence
        </h1>
        <p className="text-muted-foreground">
          Market insights, trends, and competitive analysis to help optimize
          your portfolio.
        </p>
      </div>

      <MarketInsightsPanel location="Nairobi" />
    </div>
  );
}
