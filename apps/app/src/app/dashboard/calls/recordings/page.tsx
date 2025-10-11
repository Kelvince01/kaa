import type { Metadata } from "next";
import dynamic from "next/dynamic";

const Recordings = dynamic(
  () => import("@/routes/dashboard/calls/recordings"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Call Recordings | Dashboard",
  description: "View and manage your call recordings",
};

export default function RecordingsPage() {
  return <Recordings />;
}
