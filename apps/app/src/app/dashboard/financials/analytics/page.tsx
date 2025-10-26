import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Analytics Container component with SSR enabled
const AnalyticsContainer = dynamic(
  () => import("@/routes/dashboard/financials/analytics"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Analytics | Financials | Dashboard",
  description:
    "Interactive financial analytics dashboard with expense tracking and comprehensive data visualization",
};

export default function AnalyticsPage() {
  return <AnalyticsContainer />;
}
