import type { Metadata } from "next";
import dynamic from "next/dynamic";

const LegalDocumentsDashboard = dynamic(
  () => import("@/routes/dashboard/documents"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Legal Documents | Dashboard",
  description: "Generate, sign, and manage legal documents",
};

export default function DocumentsPage() {
  return <LegalDocumentsDashboard />;
}
