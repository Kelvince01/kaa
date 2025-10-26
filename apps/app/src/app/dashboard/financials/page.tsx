import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the FinancialsContainer component with SSR enabled
const FinancialsContainer = dynamic(
  () => import("@/routes/dashboard/financials"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Financials | Dashboard",
  description:
    "Manage your property finances, expenses, assets, and generate financial reports",
};

export default function FinancialsPage() {
  return <FinancialsContainer />;
}
