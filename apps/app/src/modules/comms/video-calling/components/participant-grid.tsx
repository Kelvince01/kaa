"use client";

import { Mic, MicOff, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ICallParticipant } from "../video-calling.type";

type ParticipantGridProps = {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  localParticipant: ICallParticipant | null;
  participants: ICallParticipant[];
};

export const ParticipantGrid = ({
  localStream,
  remoteStreams,
  localParticipant,
  participants,
}: ParticipantGridProps) => {
  const totalParticipants = participants.length + 1; // Include local participant

  // Calculate grid layout
  const getGridCols = () => {
    if (totalParticipants === 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className={`grid h-full gap-4 ${getGridCols()}`}>
      {/* Local participant */}
      <ParticipantVideo
        isLocal
        participant={localParticipant}
        stream={localStream}
      />

      {/* Remote participants */}
      {Array.from(remoteStreams.entries()).map(([streamId, stream]) => {
        const participant = participants.find((p) => p.id === streamId);
        return (
          <ParticipantVideo
            key={streamId}
            participant={participant}
            stream={stream}
          />
        );
      })}
    </div>
  );
};

type ParticipantVideoProps = {
  stream: MediaStream | null;
  participant: ICallParticipant | null | undefined;
  isLocal?: boolean;
};

const ParticipantVideo = ({
  stream,
  participant,
  isLocal = false,
}: ParticipantVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some((track) => track.enabled);
  const hasAudio = participant?.mediaStreams.audio ?? true;

  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-800">
      {hasVideo ? (
        <video
          autoPlay
          className="h-full w-full object-cover"
          muted={isLocal}
          playsInline
          ref={videoRef}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-700">
            {participant?.avatar ? (
              // biome-ignore lint/nursery/useImageSize: ignore
              // biome-ignore lint/performance/noImgElement: ignore
              <img
                alt={participant.displayName}
                className="h-full w-full rounded-full object-cover"
                src={participant.avatar}
              />
            ) : (
              <User className="h-12 w-12 text-gray-400" />
            )}
          </div>
        </div>
      )}

      {/* Participant info overlay */}
      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-white">
            {participant?.displayName || "Unknown"}
            {isLocal && " (You)"}
          </span>
          <div className="flex items-center gap-2">
            {hasAudio ? (
              <Mic className="h-4 w-4 text-white" />
            ) : (
              <MicOff className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
      </div>

      {/* Connection state indicator */}
      {participant?.connectionState === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-sm text-white">Connecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};
