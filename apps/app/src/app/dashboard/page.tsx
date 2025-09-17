import type { Metadata } from "next";
import dynamic from "next/dynamic";

const LandlordDashboard = dynamic(() => import("@/routes/dashboard"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
};

export default function DashboardPage() {
  return <LandlordDashboard />;
}
