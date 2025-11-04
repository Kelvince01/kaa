import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ApplicationsClient = dynamic(
  () => import("@/routes/account/applications"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "My Applications | Account",
  description: "Track and manage your rental property applications.",
};

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}
