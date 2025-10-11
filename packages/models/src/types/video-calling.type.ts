// Enums for Video Calling System
export enum CallType {
  PROPERTY_TOUR = "property_tour",
  TENANT_INTERVIEW = "tenant_interview",
  MAINTENANCE_CALL = "maintenance_call",
  SUPPORT_CALL = "support_call",
  CONSULTATION = "consultation",
}

export enum CallStatus {
  SCHEDULED = "scheduled",
  INITIATING = "initiating",
  RINGING = "ringing",
  CONNECTED = "connected",
  ON_HOLD = "on_hold",
  ENDED = "ended",
  FAILED = "failed",
  CANCELLED = "cancelled",
  MISSED = "missed",
}

export enum VideoParticipantRole {
  HOST = "host",
  GUEST = "guest",
  MODERATOR = "moderator",
  OBSERVER = "observer",
}

export enum CallQuality {
  POOR = "poor",
  FAIR = "fair",
  GOOD = "good",
  EXCELLENT = "excellent",
}

export enum MediaType {
  AUDIO = "audio",
  VIDEO = "video",
  SCREEN = "screen",
  DOCUMENT = "document",
}

export enum RecordingStatus {
  NOT_STARTED = "not_started",
  RECORDING = "recording",
  PAUSED = "paused",
  STOPPED = "stopped",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum ConnectionState {
  NEW = "new",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  FAILED = "failed",
  CLOSED = "closed",
}

// Interfaces for Video Calling
export type WebRTCConfig = {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
  bundlePolicy: "balanced" | "max-compat" | "max-bundle";
  rtcpMuxPolicy: "negotiate" | "require";
  sdpSemantics: "plan-b" | "unified-plan";
  encodingOptions: {
    video: VideoEncodingOptions;
    audio: AudioEncodingOptions;
  };
};

export type VideoEncodingOptions = {
  codec: "VP8" | "VP9" | "H264" | "AV1";
  bitrate: {
    min: number;
    max: number;
    start: number;
  };
  framerate: number;
  resolution: {
    width: number;
    height: number;
  };
  adaptiveBitrate: boolean;
};

export type AudioEncodingOptions = {
  codec: "OPUS" | "G722" | "PCMU" | "PCMA";
  bitrate: number;
  sampleRate: number;
  channels: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
};

export type ICallParticipant = {
  id: string;
  userId: string;
  role: VideoParticipantRole;
  displayName: string;
  avatar?: string;
  connectionState: ConnectionState;
  mediaStreams: {
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
  permissions: {
    canShare: boolean;
    canRecord: boolean;
    canMute: boolean;
    canKick: boolean;
  };
  networkInfo: {
    ip: string;
    location?: string;
    bandwidth: {
      upload: number;
      download: number;
    };
  };
  joinedAt: Date;
  lastActiveAt: Date;
};

export type IVideoCall = {
  _id?: string;
  id: string;
  type: CallType;
  status: CallStatus;
  title: string;
  description?: string;
  propertyId?: string;
  applicationId?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  participants: ICallParticipant[];
  host: string;
  maxParticipants: number;
  isRecorded: boolean;
  recordingUrl?: string;
  recordingStatus: RecordingStatus;
  settings: {
    allowScreenShare: boolean;
    allowRecording: boolean;
    muteOnJoin: boolean;
    videoOnJoin: boolean;
    waitingRoom: boolean;
    passcode?: string;
    autoEndMinutes?: number;
  };
  quality: {
    overall: CallQuality;
    audio: CallQuality;
    video: CallQuality;
    networkStability: number;
  };
  analytics: ICallAnalytics;
  kenyaSpecific: {
    mpesaPayment?: string;
    county: string;
    businessHours: boolean;
    language: "en" | "sw";
    dataUsageWarning: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ICallAnalytics = {
  participantCount: number;
  totalDuration: number;
  averageQuality: CallQuality;
  dropoutRate: number;
  reconnections: number;
  bandwidthUsage: {
    total: number;
    average: number;
    peak: number;
  };
  qualityMetrics: {
    jitter: number;
    latency: number;
    packetLoss: number;
  };
  deviceInfo: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  engagement: {
    averageParticipationTime: number;
    screenShareDuration: number;
    chatMessages: number;
  };
};

export type IPropertyTour = {
  callId: string;
  propertyId: string;
  tourGuide: string;
  prospects: string[];
  tourPlan: TourStop[];
  currentStop: number;
  highlights: string[];
  questions: TourQuestion[];
  feedback: TourFeedback[];
  virtualAssets: {
    images: string[];
    videos: string[];
    documents: string[];
    floorPlans: string[];
  };
  interactiveFeatures: {
    measurements: boolean;
    roomLabels: boolean;
    virtualStaging: boolean;
    lightingDemo: boolean;
  };
};

export type TourStop = {
  id: string;
  name: string;
  description: string;
  duration: number;
  cameraPosition?: {
    x: number;
    y: number;
    z: number;
    rotation: {
      x: number;
      y: number;
      z: number;
    };
  };
  highlights: string[];
  interactionPoints: InteractionPoint[];
};

export type InteractionPoint = {
  id: string;
  type: "info" | "measurement" | "feature" | "question";
  position: { x: number; y: number };
  content: string;
  icon?: string;
  clickable: boolean;
};

export type TourQuestion = {
  id: string;
  participantId: string;
  question: string;
  answer?: string;
  timestamp: Date;
  category: "property" | "location" | "amenities" | "pricing" | "legal";
};

export type TourFeedback = {
  participantId: string;
  rating: number;
  comments?: string;
  liked: string[];
  concerns: string[];
  followUpRequested: boolean;
  timestamp: Date;
};

export type ICallRecording = {
  id: string;
  callId: string;
  filename: string;
  duration: number;
  fileSize: number;
  format: "webm" | "mp4" | "mkv";
  quality: "720p" | "1080p" | "4K";
  audioOnly: boolean;
  downloadUrl: string;
  streamUrl: string;
  thumbnails: string[];
  chapters: RecordingChapter[];
  transcription?: ICallTranscription;
  status: RecordingStatus;
  storageInfo: {
    provider: "aws" | "local" | "gcp";
    bucket?: string;
    path: string;
    expiresAt?: Date;
  };
  analytics: {
    views: number;
    downloads: number;
    sharedWith: string[];
  };
  createdAt: Date;
};

export type RecordingChapter = {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail?: string;
  description?: string;
  highlights: string[];
};

export type ICallTranscription = {
  id: string;
  callId: string;
  language: "en" | "sw";
  accuracy: number;
  segments: TranscriptionSegment[];
  summary?: string;
  keywords: string[];
  actionItems: string[];
  participants: {
    [participantId: string]: {
      speakingTime: number;
      wordCount: number;
      sentiment: "positive" | "neutral" | "negative";
    };
  };
};

export type TranscriptionSegment = {
  id: string;
  participantId: string;
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  language: "en" | "sw";
  sentiment?: "positive" | "neutral" | "negative";
};

export type SignalingMessage = {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join"
    | "leave"
    | "mute"
    | "unmute"
    | "screen-share";
  callId: string;
  fromParticipant: string;
  toParticipant?: string;
  data: any;
  timestamp: Date;
};

export type NetworkQualityReport = {
  participantId: string;
  timestamp: Date;
  bandwidth: {
    upload: number;
    download: number;
  };
  latency: number;
  jitter: number;
  packetLoss: number;
  connectionType: "wifi" | "cellular" | "ethernet" | "unknown";
  signalStrength?: number;
};

// Kenya-specific configuration
export type VideoConfig = {
  lowBandwidthMode: boolean;
  dataWarningThreshold: number; // MB
  businessHourPricing: boolean;
  supportedNetworks: ("safaricom" | "airtel" | "telkom")[];
  mpesaIntegration: boolean;
  swahiliSupport: boolean;
  countyRestrictions?: string[];
  qualityAdaptation: {
    enabled: boolean;
    thresholds: {
      poor: number;
      fair: number;
      good: number;
    };
    actions: {
      reduceBitrate: boolean;
      disableVideo: boolean;
      enableAudioOnly: boolean;
    };
  };
};
