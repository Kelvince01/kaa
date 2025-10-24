import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ApplicationsClient = dynamic(
  () => import("@/routes/dashboard/applications"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Applications | Kaa",
  description: "Track and manage tenant applications.",
};

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}
