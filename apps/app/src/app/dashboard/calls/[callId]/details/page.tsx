import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CallDetails = dynamic(
  () => import("@/routes/dashboard/calls/call-details"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Call Details | Dashboard",
  description: "View call details and recordings",
};

type CallDetailsPageProps = {
  params: {
    callId: string;
  };
};

export default function CallDetailsPage({ params }: CallDetailsPageProps) {
  return <CallDetails callId={params.callId} />;
}
