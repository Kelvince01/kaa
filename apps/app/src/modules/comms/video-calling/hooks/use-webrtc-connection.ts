"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useVideoCallingStore } from "../video-calling.store";
import {
  ConnectionState,
  type ICallParticipant,
  type SignalingMessage,
  type WebRTCTokenResponse,
} from "../video-calling.type";

type UseWebRTCConnectionProps = {
  callId: string;
  token: WebRTCTokenResponse;
  onParticipantJoined?: (participant: ICallParticipant) => void;
  onParticipantLeft?: (participantId: string) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

export const useWebRTCConnection = ({
  callId,
  token,
  onParticipantJoined,
  onParticipantLeft,
  onConnectionStateChange,
}: UseWebRTCConnectionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map()
  );

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const { setConnectionState, localMediaState } = useVideoCallingStore();

  // Initialize WebSocket connection
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const initializeWebSocket = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      // Send join message
      const joinMessage: SignalingMessage = {
        type: "join",
        callId,
        fromParticipant: token.userId,
        data: {},
        timestamp: new Date(),
      };
      ws.send(JSON.stringify(joinMessage));
    };

    ws.onmessage = async (event) => {
      try {
        const message: SignalingMessage = JSON.parse(event.data);
        await handleSignalingMessage(message);
      } catch (error) {
        console.error("Error handling signaling message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      toast.error("Connection error");
    };

    ws.onclose = () => {
      console.log("⚠️ WebSocket disconnected");
      setIsConnected(false);
      setConnectionState(ConnectionState.DISCONNECTED);
    };

    wsRef.current = ws;
  }, [callId, token.userId, setConnectionState]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: token.iceServers,
    };

    const pc = new RTCPeerConnection(config);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        const message: SignalingMessage = {
          type: "ice-candidate",
          callId,
          fromParticipant: token.userId,
          data: event.candidate,
          timestamp: new Date(),
        };
        wsRef.current.send(JSON.stringify(message));
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as ConnectionState;
      console.log("Connection state:", state);
      setConnectionState(state);
      onConnectionStateChange?.(state);

      if (state === "connected") {
        setIsConnected(true);
        toast.success("Connected to call");
      } else if (state === "failed" || state === "disconnected") {
        setIsConnected(false);
        toast.error("Connection lost");
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.set(stream.id, stream);
          return newMap;
        });
      }
    };

    peerConnectionRef.current = pc;
  }, [callId, token, setConnectionState, onConnectionStateChange]);

  // Handle signaling messages
  const handleSignalingMessage = async (message: SignalingMessage) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    switch (message.type) {
      case "offer": {
        await pc.setRemoteDescription(new RTCSessionDescription(message.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const answerMessage: SignalingMessage = {
            type: "answer",
            callId,
            fromParticipant: token.userId,
            toParticipant: message.fromParticipant,
            data: answer,
            timestamp: new Date(),
          };
          wsRef.current.send(JSON.stringify(answerMessage));
        }
        break;
      }

      case "answer":
        await pc.setRemoteDescription(new RTCSessionDescription(message.data));
        break;

      case "ice-candidate":
        await pc.addIceCandidate(new RTCIceCandidate(message.data));
        break;

      case "join":
        onParticipantJoined?.(message.data);
        break;

      case "leave":
        onParticipantLeft?.(message.fromParticipant);
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.delete(message.fromParticipant);
          return newMap;
        });
        break;

      default:
        break;
    }
  };

  // Get local media stream
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: localMediaState.audioEnabled,
        video: localMediaState.videoEnabled
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          : false,
      });

      localStreamRef.current = stream;

      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        for (const track of stream.getTracks()) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      }

      return stream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      toast.error("Failed to access camera/microphone");
      throw error;
    }
  }, [localMediaState]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }, []);

  // Start screen share
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0] as MediaStreamTrack;

      if (peerConnectionRef.current && localStreamRef.current) {
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (sender) {
          await sender.replaceTrack(screenTrack as MediaStreamTrack);
        }

        // Handle screen share stop
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }

      return screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      toast.error("Failed to start screen sharing");
      throw error;
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track?.kind === "video");

      if (sender && videoTrack) {
        await sender.replaceTrack(videoTrack);
      }
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    // Stop local tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        track.stop();
      }
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Close WebSocket
    if (wsRef.current) {
      const leaveMessage: SignalingMessage = {
        type: "leave",
        callId,
        fromParticipant: token.userId,
        data: {},
        timestamp: new Date(),
      };
      wsRef.current.send(JSON.stringify(leaveMessage));
      wsRef.current.close();
    }

    setIsConnected(false);
    setRemoteStreams(new Map());
  }, [callId, token.userId]);

  // Initialize on mount
  useEffect(() => {
    initializeWebSocket();
    initializePeerConnection();

    return () => {
      disconnect();
    };
  }, [initializeWebSocket, initializePeerConnection, disconnect]);

  return {
    isConnected,
    localStream: localStreamRef.current,
    remoteStreams,
    getLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    disconnect,
  };
};
