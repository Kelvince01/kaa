import type { Metadata } from "next";
import AdminDashboard from "@/routes/admin";

export const metadata: Metadata = {
  title: "Dashboard | Admin",
  description:
    "Admin dashboard for Kaa - manage properties, users, and platform settings.",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
