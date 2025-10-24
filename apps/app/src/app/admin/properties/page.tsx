import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AdminPropertiesContainer = dynamic(
  () => import("@/routes/admin/properties"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Property Management | Admin",
  description: "Manage all rental properties in the Kaa platform.",
};

export default function AdminPropertiesPage() {
  return <AdminPropertiesContainer />;
}
