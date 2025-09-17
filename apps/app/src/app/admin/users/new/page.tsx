import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import client components
const AdminNewUserContainer = dynamic(
  () => import("@/routes/admin/users/new-user"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Add New User | Admin",
  description:
    "Create new users in the system with different roles and permissions.",
};

export default function AdminNewUserPage() {
  return <AdminNewUserContainer />;
}
