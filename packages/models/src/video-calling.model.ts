import mongoose, { type Model, Schema } from "mongoose";
import {
  CallStatus,
  CallType,
  type ICallAnalytics,
  type ICallParticipant,
  type ICallRecording,
  type ICallTranscription,
  type IPropertyTour,
  type IVideoCall,
  RecordingStatus,
} from "./types/video-calling.type";

// Sub-schemas
const mediaStreamsSchema = new Schema(
  {
    audio: { type: Boolean, default: false },
    video: { type: Boolean, default: false },
    screen: { type: Boolean, default: false },
  },
  { _id: false }
);

const participantPermissionsSchema = new Schema(
  {
    canShare: { type: Boolean, default: true },
    canRecord: { type: Boolean, default: false },
    canMute: { type: Boolean, default: false },
    canKick: { type: Boolean, default: false },
  },
  { _id: false }
);

const networkInfoSchema = new Schema(
  {
    ip: { type: String, required: true },
    location: { type: String },
    bandwidth: {
      upload: { type: Number, required: true },
      download: { type: Number, required: true },
    },
  },
  { _id: false }
);

const callParticipantSchema = new Schema<ICallParticipant>(
  {
    id: { type: String, required: true },
    userId: { type: String, required: true },
    role: {
      type: String,
      enum: ["host", "guest", "moderator", "observer"],
      required: true,
    },
    displayName: { type: String, required: true },
    avatar: { type: String },
    connectionState: {
      type: String,
      enum: [
        "new",
        "connecting",
        "connected",
        "disconnected",
        "failed",
        "closed",
      ],
      required: true,
    },
    mediaStreams: { type: mediaStreamsSchema, required: true },
    permissions: { type: participantPermissionsSchema, required: true },
    networkInfo: { type: networkInfoSchema, required: true },
    joinedAt: { type: Date, required: true },
    lastActiveAt: { type: Date, required: true },
  },
  { _id: false }
);

const callSettingsSchema = new Schema(
  {
    allowScreenShare: { type: Boolean, default: true },
    allowRecording: { type: Boolean, default: false },
    muteOnJoin: { type: Boolean, default: false },
    videoOnJoin: { type: Boolean, default: true },
    waitingRoom: { type: Boolean, default: false },
    passcode: { type: String },
    autoEndMinutes: { type: Number },
  },
  { _id: false }
);

const callQualitySchema = new Schema(
  {
    overall: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      required: true,
    },
    audio: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      required: true,
    },
    video: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      required: true,
    },
    networkStability: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const bandwidthUsageSchema = new Schema(
  {
    total: { type: Number, required: true },
    average: { type: Number, required: true },
    peak: { type: Number, required: true },
  },
  { _id: false }
);

const qualityMetricsSchema = new Schema(
  {
    jitter: { type: Number, required: true },
    latency: { type: Number, required: true },
    packetLoss: { type: Number, required: true },
  },
  { _id: false }
);

const deviceInfoSchema = new Schema(
  {
    mobile: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 },
  },
  { _id: false }
);

const engagementSchema = new Schema(
  {
    averageParticipationTime: { type: Number, required: true },
    screenShareDuration: { type: Number, required: true },
    chatMessages: { type: Number, required: true },
  },
  { _id: false }
);

const callAnalyticsSchema = new Schema<ICallAnalytics>(
  {
    participantCount: { type: Number, required: true },
    totalDuration: { type: Number, required: true },
    averageQuality: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      required: true,
    },
    dropoutRate: { type: Number, required: true },
    reconnections: { type: Number, required: true },
    bandwidthUsage: { type: bandwidthUsageSchema, required: true },
    qualityMetrics: { type: qualityMetricsSchema, required: true },
    deviceInfo: { type: deviceInfoSchema, required: true },
    engagement: { type: engagementSchema, required: true },
  },
  { _id: false }
);

const kenyaSpecificSchema = new Schema(
  {
    mpesaPayment: { type: String },
    county: { type: String, required: true },
    businessHours: { type: Boolean, required: true },
    language: {
      type: String,
      enum: ["en", "sw"],
      required: true,
    },
    dataUsageWarning: { type: Boolean, required: true },
  },
  { _id: false }
);

// Main Video Call Schema
const videoCallSchema = new Schema<IVideoCall>(
  {
    type: {
      type: String,
      enum: Object.values(CallType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CallStatus),
      required: true,
      default: CallStatus.SCHEDULED,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    propertyId: { type: String },
    applicationId: { type: String },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number },
    participants: [callParticipantSchema],
    host: { type: String, required: true },
    maxParticipants: { type: Number, required: true, default: 10 },
    isRecorded: { type: Boolean, default: false },
    recordingUrl: { type: String },
    recordingStatus: {
      type: String,
      enum: Object.values(RecordingStatus),
      required: true,
      default: RecordingStatus.NOT_STARTED,
    },
    settings: { type: callSettingsSchema, required: true },
    quality: { type: callQualitySchema, required: true },
    analytics: { type: callAnalyticsSchema, required: true },
    kenyaSpecific: { type: kenyaSpecificSchema, required: true },
  },
  {
    timestamps: true,
    collection: "video_calls",
  }
);

// Indexes
videoCallSchema.index({ type: 1 });
videoCallSchema.index({ status: 1 });
videoCallSchema.index({ host: 1 });
videoCallSchema.index({ propertyId: 1 });
videoCallSchema.index({ applicationId: 1 });
videoCallSchema.index({ scheduledAt: 1 });
videoCallSchema.index({ createdAt: -1 });
videoCallSchema.index({ "kenyaSpecific.county": 1 });

// Compound indexes
videoCallSchema.index({ status: 1, scheduledAt: 1 });
videoCallSchema.index({ type: 1, status: 1 });
videoCallSchema.index({ host: 1, createdAt: -1 });

// Property Tour Schema
const interactionPointSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "measurement", "feature", "question"],
      required: true,
    },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    content: { type: String, required: true },
    icon: { type: String },
    clickable: { type: Boolean, required: true },
  },
  { _id: false }
);

const tourStopSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    cameraPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, required: true },
      rotation: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        z: { type: Number, required: true },
      },
    },
    highlights: [{ type: String }],
    interactionPoints: [interactionPointSchema],
  },
  { _id: false }
);

const tourQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    participantId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String },
    timestamp: { type: Date, required: true },
    category: {
      type: String,
      enum: ["property", "location", "amenities", "pricing", "legal"],
      required: true,
    },
  },
  { _id: false }
);

const tourFeedbackSchema = new Schema(
  {
    participantId: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String },
    liked: [{ type: String }],
    concerns: [{ type: String }],
    followUpRequested: { type: Boolean, required: true },
    timestamp: { type: Date, required: true },
  },
  { _id: false }
);

const virtualAssetsSchema = new Schema(
  {
    images: [{ type: String }],
    videos: [{ type: String }],
    documents: [{ type: String }],
    floorPlans: [{ type: String }],
  },
  { _id: false }
);

const interactiveFeaturesSchema = new Schema(
  {
    measurements: { type: Boolean, required: true },
    roomLabels: { type: Boolean, required: true },
    virtualStaging: { type: Boolean, required: true },
    lightingDemo: { type: Boolean, required: true },
  },
  { _id: false }
);

const propertyTourSchema = new Schema<IPropertyTour>(
  {
    callId: { type: String, required: true },
    propertyId: { type: String, required: true },
    tourGuide: { type: String, required: true },
    prospects: [{ type: String }],
    tourPlan: [tourStopSchema],
    currentStop: { type: Number, required: true, default: 0 },
    highlights: [{ type: String }],
    questions: [tourQuestionSchema],
    feedback: [tourFeedbackSchema],
    virtualAssets: { type: virtualAssetsSchema, required: true },
    interactiveFeatures: { type: interactiveFeaturesSchema, required: true },
  },
  {
    timestamps: true,
    collection: "property_tours",
  }
);

// Indexes for property tours
propertyTourSchema.index({ callId: 1 });
propertyTourSchema.index({ propertyId: 1 });
propertyTourSchema.index({ tourGuide: 1 });
propertyTourSchema.index({ createdAt: -1 });

// Call Recording Schema
const recordingChapterSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    thumbnail: { type: String },
    description: { type: String },
    highlights: [{ type: String }],
  },
  { _id: false }
);

const storageInfoSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["aws", "local", "gcp"],
      required: true,
    },
    bucket: { type: String },
    path: { type: String, required: true },
    expiresAt: { type: Date },
  },
  { _id: false }
);

const recordingAnalyticsSchema = new Schema(
  {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    sharedWith: [{ type: String }],
  },
  { _id: false }
);

const callRecordingSchema = new Schema<ICallRecording>(
  {
    callId: { type: String, required: true },
    filename: { type: String, required: true },
    duration: { type: Number, required: true },
    fileSize: { type: Number, required: true },
    format: {
      type: String,
      enum: ["webm", "mp4", "mkv"],
      required: true,
    },
    quality: {
      type: String,
      enum: ["720p", "1080p", "4K"],
      required: true,
    },
    audioOnly: { type: Boolean, required: true },
    downloadUrl: { type: String, required: true },
    streamUrl: { type: String, required: true },
    thumbnails: [{ type: String }],
    chapters: [recordingChapterSchema],
    transcription: { type: Schema.Types.ObjectId, ref: "CallTranscription" },
    status: {
      type: String,
      enum: [
        "not_started",
        "recording",
        "paused",
        "stopped",
        "processing",
        "completed",
        "failed",
      ],
      required: true,
    },
    storageInfo: { type: storageInfoSchema, required: true },
    analytics: { type: recordingAnalyticsSchema, required: true },
  },
  {
    timestamps: true,
    collection: "call_recordings",
  }
);

// Indexes for recordings
callRecordingSchema.index({ callId: 1 });
callRecordingSchema.index({ status: 1 });
callRecordingSchema.index({ createdAt: -1 });

// Call Transcription Schema
const transcriptionSegmentSchema = new Schema(
  {
    id: { type: String, required: true },
    participantId: { type: String, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    language: {
      type: String,
      enum: ["en", "sw"],
      required: true,
    },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
    },
  },
  { _id: false }
);

const participantStatsSchema = new Schema(
  {
    speakingTime: { type: Number, required: true },
    wordCount: { type: Number, required: true },
    sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      required: true,
    },
  },
  { _id: false }
);

const callTranscriptionSchema = new Schema<ICallTranscription>(
  {
    callId: { type: String, required: true },
    language: {
      type: String,
      enum: ["en", "sw"],
      required: true,
    },
    accuracy: { type: Number, required: true, min: 0, max: 1 },
    segments: [transcriptionSegmentSchema],
    summary: { type: String },
    keywords: [{ type: String }],
    actionItems: [{ type: String }],
    participants: {
      type: Map,
      of: participantStatsSchema,
    },
  },
  {
    timestamps: true,
    collection: "call_transcriptions",
  }
);

// Indexes for transcriptions
callTranscriptionSchema.index({ callId: 1 });
callTranscriptionSchema.index({ language: 1 });
callTranscriptionSchema.index({ createdAt: -1 });

// Create and export models
export const VideoCall: Model<IVideoCall> = mongoose.model<IVideoCall>(
  "VideoCall",
  videoCallSchema
);

export const PropertyTour: Model<IPropertyTour> = mongoose.model<IPropertyTour>(
  "PropertyTour",
  propertyTourSchema
);

export const CallRecording: Model<ICallRecording> =
  mongoose.model<ICallRecording>("CallRecording", callRecordingSchema);

export const CallTranscription: Model<ICallTranscription> =
  mongoose.model<ICallTranscription>(
    "CallTranscription",
    callTranscriptionSchema
  );

// Export schemas for potential extension
export {
  videoCallSchema,
  propertyTourSchema,
  callRecordingSchema,
  callTranscriptionSchema,
};

export default {
  VideoCall,
  PropertyTour,
  CallRecording,
  CallTranscription,
};
