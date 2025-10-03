import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AdminPropertiesContainer = dynamic(
  () => import("@/routes/admin/subscriptions"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Subscription Management | Admin",
  description: "Manage all subscriptions in the Kaa platform.",
};

export default function AdminPropertiesPage() {
  return <AdminPropertiesContainer />;
}
