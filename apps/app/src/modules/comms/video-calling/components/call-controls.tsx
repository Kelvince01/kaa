"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  Video,
  VideoOff,
} from "lucide-react";

type CallControlsProps = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
};

export const CallControls = ({
  audioEnabled,
  videoEnabled,
  screenShareEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
}: CallControlsProps) => (
  <div className="flex items-center justify-center gap-4">
    {/* Audio Toggle */}
    <Button
      className="h-14 w-14 rounded-full"
      onClick={onToggleAudio}
      size="lg"
      type="button"
      variant={audioEnabled ? "default" : "destructive"}
    >
      {audioEnabled ? (
        <Mic className="h-6 w-6" />
      ) : (
        <MicOff className="h-6 w-6" />
      )}
    </Button>

    {/* Video Toggle */}
    <Button
      className="h-14 w-14 rounded-full"
      onClick={onToggleVideo}
      size="lg"
      type="button"
      variant={videoEnabled ? "default" : "destructive"}
    >
      {videoEnabled ? (
        <Video className="h-6 w-6" />
      ) : (
        <VideoOff className="h-6 w-6" />
      )}
    </Button>

    {/* Screen Share Toggle */}
    <Button
      className="h-14 w-14 rounded-full"
      onClick={onToggleScreenShare}
      size="lg"
      type="button"
      variant={screenShareEnabled ? "secondary" : "outline"}
    >
      {screenShareEnabled ? (
        <MonitorOff className="h-6 w-6" />
      ) : (
        <Monitor className="h-6 w-6" />
      )}
    </Button>

    {/* Leave Call */}
    <Button
      className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
      onClick={onLeave}
      size="lg"
      type="button"
      variant="destructive"
    >
      <Phone className="h-6 w-6 rotate-135" />
    </Button>
  </div>
);
