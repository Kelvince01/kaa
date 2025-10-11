"use client";

import { useCallback, useEffect, useState } from "react";

export type MediaDeviceList = {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
};

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceList>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // Get all devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = deviceList.filter(
        (device) => device.kind === "audioinput"
      );
      const audioOutputs = deviceList.filter(
        (device) => device.kind === "audiooutput"
      );
      const videoInputs = deviceList.filter(
        (device) => device.kind === "videoinput"
      );

      setDevices({
        audioInputs,
        audioOutputs,
        videoInputs,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load devices")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [loadDevices]);

  const testAudioInput = useCallback(async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      });

      // Stop the stream after testing
      for (const track of stream.getTracks()) {
        track.stop();
      }

      return true;
    } catch (err) {
      console.error("Error testing audio input:", err);
      return false;
    }
  }, []);

  const testVideoInput = useCallback(async (deviceId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });

      // Stop the stream after testing
      for (const track of stream.getTracks()) {
        track.stop();
      }

      return true;
    } catch (err) {
      console.error("Error testing video input:", err);
      return false;
    }
  }, []);

  return {
    devices,
    isLoading,
    error,
    reload: loadDevices,
    testAudioInput,
    testVideoInput,
  };
};
