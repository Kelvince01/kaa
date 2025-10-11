"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useVideoCallingStore } from "../video-calling.store";
import { DeviceSettings } from "./device-settings";

type CallPreviewProps = {
  onJoin: () => void;
  onCancel: () => void;
  isJoining?: boolean;
};

export const CallPreview = ({
  onJoin,
  onCancel,
  isJoining = false,
}: CallPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const { localMediaState, updateLocalMediaState } = useVideoCallingStore();

  useEffect(() => {
    const getPreviewStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: localMediaState.audioEnabled,
          video: localMediaState.videoEnabled
            ? {
                deviceId: localMediaState.videoDeviceId
                  ? { exact: localMediaState.videoDeviceId }
                  : undefined,
              }
            : false,
        });

        setLocalStream(stream);

        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting preview stream:", error);
      }
    };

    getPreviewStream();

    return () => {
      if (localStream) {
        for (const track of localStream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [
    localMediaState.videoDeviceId,
    localStream?.getTracks,
    localMediaState.videoEnabled,
    localStream,
    localMediaState.audioEnabled,
  ]);

  const toggleAudio = () => {
    updateLocalMediaState({ audioEnabled: !localMediaState.audioEnabled });
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !localMediaState.audioEnabled;
      }
    }
  };

  const toggleVideo = () => {
    updateLocalMediaState({ videoEnabled: !localMediaState.videoEnabled });
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !localMediaState.videoEnabled;
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Setup Your Call</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Preview */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
            {localMediaState.videoEnabled ? (
              <video
                autoPlay
                className="h-full w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <VideoOff className="h-16 w-16 text-gray-400" />
              </div>
            )}

            {/* Preview Controls */}
            <div className="-translate-x-1/2 absolute bottom-4 left-1/2 flex gap-2">
              <Button
                className="h-12 w-12 rounded-full"
                onClick={toggleAudio}
                size="lg"
                type="button"
                variant={
                  localMediaState.audioEnabled ? "default" : "destructive"
                }
              >
                {localMediaState.audioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>

              <Button
                className="h-12 w-12 rounded-full"
                onClick={toggleVideo}
                size="lg"
                type="button"
                variant={
                  localMediaState.videoEnabled ? "default" : "destructive"
                }
              >
                {localMediaState.videoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Device Settings */}
          <DeviceSettings />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              disabled={isJoining}
              onClick={onCancel}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isJoining} onClick={onJoin} type="button">
              {isJoining ? "Joining..." : "Join Call"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
