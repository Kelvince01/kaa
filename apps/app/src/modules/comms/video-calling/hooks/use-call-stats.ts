"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { videoCallingService } from "../video-calling.service";
import type { CallStatsUpdate } from "../video-calling.type";

type UseCallStatsProps = {
  callId: string;
  participantId: string;
  peerConnection: RTCPeerConnection | null;
  enabled?: boolean;
};

export const useCallStats = ({
  callId,
  participantId,
  peerConnection,
  enabled = true,
}: UseCallStatsProps) => {
  const [stats, setStats] = useState<CallStatsUpdate>({
    participantId,
    bandwidth: { upload: 0, download: 0 },
    latency: 0,
    jitter: 0,
    packetLoss: 0,
    connectionType: "unknown",
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const collectStats = useCallback(async () => {
    if (!(peerConnection && enabled)) return;

    try {
      const statsReport = await peerConnection.getStats();
      let uploadBandwidth = 0;
      let downloadBandwidth = 0;
      let latency = 0;
      let jitter = 0;
      let packetLoss = 0;

      for (const [, stat] of statsReport) {
        if (stat.type === "outbound-rtp") {
          uploadBandwidth = stat.bytesSent || 0;
        } else if (stat.type === "inbound-rtp") {
          downloadBandwidth = stat.bytesReceived || 0;
          jitter = stat.jitter || 0;
          packetLoss = stat.packetsLost || 0;
        } else if (
          stat.type === "candidate-pair" &&
          stat.state === "succeeded"
        ) {
          latency = stat.currentRoundTripTime || 0;
        }
      }

      // Detect connection type
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      const connectionType = connection?.effectiveType || "unknown";

      const newStats: CallStatsUpdate = {
        participantId,
        bandwidth: {
          upload: uploadBandwidth,
          download: downloadBandwidth,
        },
        latency,
        jitter,
        packetLoss,
        connectionType: mapConnectionType(connectionType),
      };

      setStats(newStats);

      // Send stats to server
      await videoCallingService.updateNetworkQuality(callId, newStats);
    } catch (error) {
      console.error("Error collecting stats:", error);
    }
  }, [peerConnection, enabled, callId, participantId]);

  useEffect(() => {
    if (enabled && peerConnection) {
      // Collect stats every 5 seconds
      intervalRef.current = setInterval(collectStats, 5000);

      // Initial collection
      collectStats();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, peerConnection, collectStats]);

  return stats;
};

const mapConnectionType = (
  type: string
): "wifi" | "cellular" | "ethernet" | "unknown" => {
  switch (type) {
    case "wifi":
      return "wifi";
    case "4g":
    case "3g":
    case "2g":
    case "slow-2g":
      return "cellular";
    case "ethernet":
      return "ethernet";
    default:
      return "unknown";
  }
};
