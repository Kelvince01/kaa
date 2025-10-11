"use client";

import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { useMediaDevices } from "../hooks/use-media-devices";
import { useVideoCallingStore } from "../video-calling.store";

export const DeviceSettings = () => {
  const { devices, isLoading, error } = useMediaDevices();
  const { localMediaState, updateLocalMediaState } = useVideoCallingStore();

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-sm">Loading devices...</div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load devices: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Audio Input */}
      <div className="space-y-2">
        <Label htmlFor="audio-input">Microphone</Label>
        <Select
          onValueChange={(value) =>
            updateLocalMediaState({ audioDeviceId: value })
          }
          value={localMediaState.audioDeviceId}
        >
          <SelectTrigger id="audio-input">
            <SelectValue placeholder="Select microphone" />
          </SelectTrigger>
          <SelectContent>
            {devices.audioInputs.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Audio Output */}
      <div className="space-y-2">
        <Label htmlFor="audio-output">Speaker</Label>
        <Select
          onValueChange={(value) =>
            updateLocalMediaState({ audioOutputDeviceId: value })
          }
          value={localMediaState.audioOutputDeviceId}
        >
          <SelectTrigger id="audio-output">
            <SelectValue placeholder="Select speaker" />
          </SelectTrigger>
          <SelectContent>
            {devices.audioOutputs.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Input */}
      <div className="space-y-2">
        <Label htmlFor="video-input">Camera</Label>
        <Select
          onValueChange={(value) =>
            updateLocalMediaState({ videoDeviceId: value })
          }
          value={localMediaState.videoDeviceId}
        >
          <SelectTrigger id="video-input">
            <SelectValue placeholder="Select camera" />
          </SelectTrigger>
          <SelectContent>
            {devices.videoInputs.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
