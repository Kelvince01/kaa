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
  params: {
    callId: string;
  };
};

export default function CallRoomPage({ params }: CallRoomPageProps) {
  return <CallRoom callId={params.callId} />;
}
