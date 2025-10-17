import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CallRoom = dynamic(() => import("@/routes/dashboard/calls/call-room"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Video Call | Dashboard",
  description: "Join video call",
};

type CallRoomPageProps = {
  params: Promise<{
    callId: string;
  }>;
};

export default async function CallRoomPage({ params }: CallRoomPageProps) {
  const callId = (await params).callId;

  return <CallRoom callId={callId} />;
}
