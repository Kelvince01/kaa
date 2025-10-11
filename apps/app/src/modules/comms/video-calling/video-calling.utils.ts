import {
  CallQuality,
  type CallStatus,
  type ConnectionState,
} from "./video-calling.type";

/**
 * Format call duration in human-readable format
 */
export const formatCallDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

/**
 * Get call status color
 */
export const getCallStatusColor = (status: CallStatus): string => {
  switch (status) {
    case "connected":
      return "text-green-500";
    case "initiating":
    case "ringing":
      return "text-yellow-500";
    case "ended":
      return "text-gray-500";
    case "failed":
    case "cancelled":
    case "missed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Get connection state color
 */
export const getConnectionStateColor = (state: ConnectionState): string => {
  switch (state) {
    case "connected":
      return "text-green-500";
    case "connecting":
      return "text-yellow-500";
    case "disconnected":
    case "failed":
    case "closed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Get call quality color
 */
export const getCallQualityColor = (quality: CallQuality): string => {
  switch (quality) {
    case "excellent":
      return "text-green-500";
    case "good":
      return "text-blue-500";
    case "fair":
      return "text-yellow-500";
    case "poor":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Get call quality label
 */
export const getCallQualityLabel = (quality: CallQuality): string => {
  switch (quality) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    case "poor":
      return "Poor";
    default:
      return "Unknown";
  }
};

/**
 * Format bandwidth in human-readable format
 */
export const formatBandwidth = (bytesPerSecond: number): string => {
  const kbps = bytesPerSecond / 1024;
  const mbps = kbps / 1024;

  if (mbps >= 1) {
    return `${mbps.toFixed(2)} Mbps`;
  }
  return `${kbps.toFixed(2)} Kbps`;
};

/**
 * Check if browser supports WebRTC
 */
export const isWebRTCSupported = async (): Promise<boolean> =>
  !!(
    (await navigator.mediaDevices?.getUserMedia()) && window.RTCPeerConnection
  );

/**
 * Check if device has camera
 */
export const hasCamera = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === "videoinput");
  } catch {
    return false;
  }
};

/**
 * Check if device has microphone
 */
export const hasMicrophone = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === "audioinput");
  } catch {
    return false;
  }
};

/**
 * Request media permissions
 */
export const requestMediaPermissions = async (
  audio = true,
  video = true
): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio,
      video,
    });

    // Stop all tracks after getting permission
    for (const track of stream.getTracks()) {
      track.stop();
    }

    return true;
  } catch (error) {
    console.error("Error requesting media permissions:", error);
    return false;
  }
};

/**
 * Calculate network quality score (0-100)
 */
export const calculateNetworkQuality = (
  latency: number,
  jitter: number,
  packetLoss: number
): number => {
  // Latency score (0-40 points)
  let latencyScore = 40;
  if (latency > 300) latencyScore = 0;
  else if (latency > 200) latencyScore = 10;
  else if (latency > 100) latencyScore = 20;
  else if (latency > 50) latencyScore = 30;

  // Jitter score (0-30 points)
  let jitterScore = 30;
  if (jitter > 50) jitterScore = 0;
  else if (jitter > 30) jitterScore = 10;
  else if (jitter > 15) jitterScore = 20;

  // Packet loss score (0-30 points)
  let packetLossScore = 30;
  if (packetLoss > 5) packetLossScore = 0;
  else if (packetLoss > 3) packetLossScore = 10;
  else if (packetLoss > 1) packetLossScore = 20;

  return latencyScore + jitterScore + packetLossScore;
};

/**
 * Get quality from network score
 */
export const getQualityFromScore = (score: number): CallQuality => {
  if (score >= 80) return CallQuality.EXCELLENT;
  if (score >= 60) return CallQuality.GOOD;
  if (score >= 40) return CallQuality.FAIR;
  return CallQuality.POOR;
};

/**
 * Validate call passcode
 */
export const validatePasscode = (passcode: string): boolean => {
  // Passcode should be 4-8 digits
  // biome-ignore lint/performance/useTopLevelRegex: ignore
  return /^\d{4,8}$/.test(passcode);
};

/**
 * Generate random passcode
 */
export const generatePasscode = (): string =>
  Math.floor(1000 + Math.random() * 9000).toString();
