import type { Metadata } from "next";
import dynamic from "next/dynamic";

const TemplatesPage = dynamic(
  () => import("@/routes/dashboard/documents/templates"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Document Templates | Dashboard",
  description: "Browse and select document templates",
};

export default function DocumentTemplatesPage() {
  return <TemplatesPage />;
}
