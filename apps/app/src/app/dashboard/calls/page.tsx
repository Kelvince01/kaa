import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CallsDashboard = dynamic(() => import("@/routes/dashboard/calls"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Video Calls | Dashboard",
  description: "Manage your video calls, property tours, and meetings",
};

export default function CallsPage() {
  return <CallsDashboard />;
}
