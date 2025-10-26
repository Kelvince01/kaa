import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Import/Export Container component with SSR enabled
const ImportExportContainer = dynamic(
  () => import("@/routes/dashboard/financials/import-export"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Data Import & Export | Financials | Dashboard",
  description:
    "Import financial data from various formats and export comprehensive financial reports",
};

export default function ImportExportPage() {
  return <ImportExportContainer />;
}
