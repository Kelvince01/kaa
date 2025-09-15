export { default as CollaborationClient } from "./collaboration.client";

// Collaboration utilities for frontend
export const isWebRTCSupported = (): boolean => {
  return typeof RTCPeerConnection !== "undefined";
};

export const isWebSocketSupported = (): boolean => {
  return typeof WebSocket !== "undefined";
};

export const getMediaDevices = async (): Promise<{
  video: boolean;
  audio: boolean;
  screen: boolean;
}> => {
  if (!navigator.mediaDevices) {
    return { video: false, audio: false, screen: false };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      video: devices.some((d) => d.kind === "videoinput"),
      audio: devices.some((d) => d.kind === "audioinput"),
      screen: "getDisplayMedia" in navigator.mediaDevices,
    };
  } catch {
    return { video: false, audio: false, screen: false };
  }
};

export const requestMediaPermissions = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Stop the stream immediately - we just needed permission
    for (const track of stream.getTracks()) {
      track.stop();
    }
    return true;
  } catch {
    return false;
  }
};
