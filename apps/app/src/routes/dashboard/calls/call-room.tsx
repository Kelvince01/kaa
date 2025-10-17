"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/modules/auth/auth.store";
import {
  CallPreview,
  useCallManager,
  VideoCallRoom,
} from "@/modules/comms/video-calling";

type CallRoomProps = {
  callId: string;
};

export default function CallRoom({ callId }: CallRoomProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showPreview, setShowPreview] = useState(true);
  const { joinCall, isJoining } = useCallManager();

  const name = `${user?.firstName} ${user?.lastName}`;

  const handleJoin = async () => {
    try {
      await joinCall({
        callId,
        displayName: name || "Guest",
        avatar: user?.avatar,
        mediaStreams: {
          audio: true,
          video: true,
        },
      });
      setShowPreview(false);
    } catch (error) {
      console.error("Failed to join call:", error);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/calls");
  };

  const handleLeave = () => {
    router.push("/dashboard/calls");
  };

  if (showPreview) {
    return (
      <CallPreview
        isJoining={isJoining}
        onCancel={handleCancel}
        onJoin={handleJoin}
      />
    );
  }

  return <VideoCallRoom callId={callId} onLeaveAction={handleLeave} />;
}
