import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the Receipts Container component with SSR enabled
const ReceiptsContainer = dynamic(
  () => import("@/routes/dashboard/financials/receipts"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Receipt Management | Financials | Dashboard",
  description:
    "Upload, organize, and manage receipts for property expenses with bulk processing capabilities",
};

export default function ReceiptsPage() {
  return <ReceiptsContainer />;
}
