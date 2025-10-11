// Import types for local use
import type {
  CallType,
  ICallParticipant,
  ICallRecording,
  IVideoCall,
  TourStop,
} from "@kaa/models/types";

// Re-export types from shared models
export type {
  AudioEncodingOptions,
  ICallAnalytics,
  ICallParticipant,
  ICallRecording,
  ICallTranscription,
  InteractionPoint,
  IPropertyTour,
  IVideoCall,
  NetworkQualityReport,
  RecordingChapter,
  SignalingMessage,
  TourFeedback,
  TourQuestion,
  TourStop,
  TranscriptionSegment,
  VideoConfig,
  VideoEncodingOptions,
  WebRTCConfig,
} from "@kaa/models/types";

export {
  CallQuality,
  CallStatus,
  CallType,
  ConnectionState,
  MediaType,
  RecordingStatus,
  VideoParticipantRole,
} from "@kaa/models/types";

// Client-specific types
export type CreateCallRequest = {
  type: CallType;
  title: string;
  description?: string;
  propertyId?: string;
  applicationId?: string;
  scheduledAt?: string;
  maxParticipants?: number;
  isRecorded?: boolean;
  settings?: {
    allowScreenShare?: boolean;
    allowRecording?: boolean;
    muteOnJoin?: boolean;
    videoOnJoin?: boolean;
    waitingRoom?: boolean;
    passcode?: string;
    autoEndMinutes?: number;
  };
  kenyaSpecific?: {
    county?: string;
    language?: "en" | "sw";
  };
};

export type JoinCallRequest = {
  callId: string;
  displayName?: string;
  avatar?: string;
  mediaStreams?: {
    audio?: boolean;
    video?: boolean;
  };
};

export type JoinCallResponse = {
  callId: string;
  participant: ICallParticipant;
  roomId: string;
  iceServers: RTCIceServer[];
  expiresAt: string;
};

export type WebRTCTokenResponse = {
  roomId: string;
  userId: string;
  iceServers: RTCIceServer[];
  expiresAt: Date;
};

export type CallListResponse = {
  calls: IVideoCall[];
  total: number;
  page: number;
  limit: number;
};

export type UserCallListResponse = {
  calls: IVideoCall[];
  pagination: { total: number; page: number; limit: number; pages: number };
};

export type RecordingListResponse = {
  recordings: ICallRecording[];
  total: number;
  page: number;
  limit: number;
};

export type PropertyTourRequest = {
  callId: string;
  propertyId: string;
  tourPlan: TourStop[];
};

export type TourQuestionRequest = {
  callId: string;
  question: string;
  category: "property" | "location" | "amenities" | "pricing" | "legal";
};

export type MediaDeviceInfo = {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
};

export type CallStatsUpdate = {
  participantId: string;
  bandwidth: { upload: number; download: number };
  latency: number;
  jitter: number;
  packetLoss: number;
  connectionType: "wifi" | "cellular" | "ethernet" | "unknown";
};
