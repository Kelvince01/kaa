import type { Metadata } from "next";
import dynamic from "next/dynamic";

const DocumentDetailsPage = dynamic(
  () => import("@/routes/dashboard/documents/document-details"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Document Details | Dashboard",
  description: "View document details and manage signatures",
};

export default function DocumentPage() {
  return <DocumentDetailsPage />;
}
