import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Financial Insights Container component with SSR enabled
const InsightsContainer = dynamic(
  () => import("@/routes/dashboard/financials/insights"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Financial Insights | Financials | Dashboard",
  description:
    "AI-powered financial insights and recommendations for property portfolio optimization",
};

export default function InsightsPage() {
  return <InsightsContainer />;
}
