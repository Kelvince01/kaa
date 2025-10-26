import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Forecasting Container component with SSR enabled
const ForecastingContainer = dynamic(
  () => import("@/routes/dashboard/financials/forecasting"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Financial Forecasting | Financials | Dashboard",
  description:
    "Predictive financial analytics with scenario planning and budget forecasting for informed decision-making",
};

export default function ForecastingPage() {
  return <ForecastingContainer />;
}
