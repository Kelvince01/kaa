import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Enhanced Dashboard Container component with SSR enabled
const EnhancedDashboardContainer = dynamic(
  () => import("@/routes/dashboard/financials/enhanced-dashboard"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Enhanced Analytics | Financials | Dashboard",
  description:
    "Advanced financial analytics dashboard with real-time insights, forecasting, and performance optimization",
};

export default function EnhancedDashboardPage() {
  return <EnhancedDashboardContainer />;
}
