"use client";

// import {
//   Mic,
//   MicOff,
//   Monitor,
//   MonitorOff,
//   Phone,
//   Video,
//   VideoOff,
// } from "lucide-react";
import { useEffect, useState } from "react";
// import { Button } from "@kaa/ui/components/button";
import { useCallManager } from "../hooks/use-call-manager";
import { useWebRTCConnection } from "../hooks/use-webrtc-connection";
import { useGenerateToken } from "../video-calling.queries";
import { useVideoCallingStore } from "../video-calling.store";
import type { ICallParticipant } from "../video-calling.type";
import { CallControls } from "./call-controls";
import { ParticipantGrid } from "./participant-grid";

type VideoCallRoomProps = {
  callId: string;
  onLeaveAction?: () => void;
};

export const VideoCallRoom = ({
  callId,
  onLeaveAction: onLeave,
}: VideoCallRoomProps) => {
  const {
    currentCall,
    localParticipant,
    localMediaState,
    updateLocalMediaState,
  } = useVideoCallingStore();
  const { leaveCall } = useCallManager();

  const [participants, setParticipants] = useState<ICallParticipant[]>([]);

  // Get WebRTC token
  const { data: token, isLoading: isLoadingToken } = useGenerateToken(
    callId,
    true
  );

  // WebRTC connection
  const {
    isConnected,
    localStream,
    remoteStreams,
    getLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    disconnect,
  } = useWebRTCConnection({
    callId,
    // biome-ignore lint/style/noNonNullAssertion: ignore
    // biome-ignore lint/nursery/noNonNullAssertedOptionalChain: ignore
    token: token?.data!,
    onParticipantJoinedAction: (participant) => {
      setParticipants((prev) => [...prev, participant]);
    },
    onParticipantLeftAction: (participantId) => {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    },
  });

  // Get local stream on mount
  useEffect(() => {
    if (token && !localStream) {
      getLocalStream();
    }
  }, [token, localStream, getLocalStream]);

  // Handle audio toggle
  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    updateLocalMediaState({ audioEnabled: enabled });
  };

  // Handle video toggle
  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    updateLocalMediaState({ videoEnabled: enabled });
  };

  // Handle screen share toggle
  const handleToggleScreenShare = async () => {
    if (localMediaState.screenShareEnabled) {
      await stopScreenShare();
      updateLocalMediaState({ screenShareEnabled: false });
    } else {
      await startScreenShare();
      updateLocalMediaState({ screenShareEnabled: true });
    }
  };

  // Handle leave call
  const handleLeave = async () => {
    disconnect();
    await leaveCall();
    onLeave?.();
  };

  if (isLoadingToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Connecting to call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-gray-800 border-b bg-gray-950 px-6 py-4">
        <div>
          <h1 className="font-semibold text-lg text-white">
            {currentCall?.title || "Video Call"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">
            {participants.length + 1} participant
            {participants.length !== 0 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-hidden p-4">
        <ParticipantGrid
          localParticipant={localParticipant}
          localStream={localStream}
          participants={participants}
          remoteStreams={remoteStreams}
        />
      </div>

      {/* Controls */}
      <div className="border-gray-800 border-t bg-gray-950 px-6 py-4">
        <CallControls
          audioEnabled={localMediaState.audioEnabled}
          onLeave={handleLeave}
          onToggleAudio={handleToggleAudio}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleVideo={handleToggleVideo}
          screenShareEnabled={localMediaState.screenShareEnabled}
          videoEnabled={localMediaState.videoEnabled}
        />
      </div>
    </div>
  );
};
