import { CallType } from "@kaa/models/types";
import { t } from "elysia";

// Enums
export const callTypeSchema = t.Union([
  t.Literal("property_tour"),
  t.Literal("tenant_interview"),
  t.Literal("maintenance_call"),
  t.Literal("support_call"),
  t.Literal("consultation"),
]);

export const callStatusSchema = t.Union([
  t.Literal("scheduled"),
  t.Literal("initiating"),
  t.Literal("ringing"),
  t.Literal("connected"),
  t.Literal("on_hold"),
  t.Literal("ended"),
  t.Literal("failed"),
  t.Literal("cancelled"),
  t.Literal("missed"),
]);

export const tourQuestionCategorySchema = t.Union([
  t.Literal("property"),
  t.Literal("location"),
  t.Literal("amenities"),
  t.Literal("pricing"),
  t.Literal("legal"),
]);

// Call settings schema
export const callSettingsSchema = t.Object({
  allowScreenShare: t.Optional(t.Boolean()),
  allowRecording: t.Optional(t.Boolean()),
  muteOnJoin: t.Optional(t.Boolean()),
  videoOnJoin: t.Optional(t.Boolean()),
  waitingRoom: t.Optional(t.Boolean()),
  passcode: t.Optional(t.String()),
  autoEndMinutes: t.Optional(t.Number()),
});

// Kenya-specific schema
export const kenyaSpecificSchema = t.Object({
  mpesaPayment: t.Optional(t.String()),
  county: t.String(),
  businessHours: t.Optional(t.Boolean()),
  language: t.Union([t.Literal("en"), t.Literal("sw")]),
  dataUsageWarning: t.Optional(t.Boolean()),
});

// Tour stop schema
export const tourStopSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  duration: t.Number(),
  cameraPosition: t.Optional(
    t.Object({
      x: t.Number(),
      y: t.Number(),
      z: t.Number(),
      rotation: t.Object({
        x: t.Number(),
        y: t.Number(),
        z: t.Number(),
      }),
    })
  ),
  highlights: t.Array(t.String()),
  interactionPoints: t.Array(t.Any()),
});

// Network quality schema
export const networkQualitySchema = t.Object({
  bandwidth: t.Object({
    upload: t.Number(),
    download: t.Number(),
  }),
  latency: t.Number(),
  jitter: t.Number(),
  packetLoss: t.Number(),
  connectionType: t.Union([
    t.Literal("wifi"),
    t.Literal("cellular"),
    t.Literal("ethernet"),
    t.Literal("unknown"),
  ]),
  signalStrength: t.Optional(t.Number()),
});

// Request schemas
export const createCallSchema = t.Object({
  type: t.Enum(CallType), // callTypeSchema,
  title: t.String(),
  description: t.Optional(t.String()),
  propertyId: t.Optional(t.String()),
  applicationId: t.Optional(t.String()),
  scheduledAt: t.Optional(t.String({ format: "date-time" })),
  maxParticipants: t.Optional(t.Number()),
  isRecorded: t.Optional(t.Boolean()),
  settings: t.Optional(callSettingsSchema),
  kenyaSpecific: kenyaSpecificSchema,
});

export const generateTokenSchema = t.Object({
  role: t.Optional(t.Union([t.Literal("publisher"), t.Literal("subscriber")])),
});

export const joinCallSchema = t.Object({
  displayName: t.String(),
  avatar: t.Optional(t.String()),
  mediaStreams: t.Optional(
    t.Object({
      audio: t.Optional(t.Boolean()),
      video: t.Optional(t.Boolean()),
    })
  ),
});

export const createPropertyTourSchema = t.Object({
  propertyId: t.String(),
  tourPlan: t.Array(tourStopSchema),
});

export const navigateTourSchema = t.Object({
  stopIndex: t.Number(),
});

export const addTourQuestionSchema = t.Object({
  question: t.String(),
  category: tourQuestionCategorySchema,
});

export const toggleMediaSchema = t.Object({
  enabled: t.Boolean(),
});

export const updateNetworkQualitySchema = networkQualitySchema;

// Params schemas
export const getCallParamsSchema = t.Object({
  callId: t.String(),
});

// Query schemas
export const listCallsQuerySchema = t.Object({
  status: t.Optional(callStatusSchema),
  type: t.Optional(callTypeSchema),
  startDate: t.Optional(t.String({ format: "date-time" })),
  endDate: t.Optional(t.String({ format: "date-time" })),
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
});

/**
 * Upload recording chunk endpoint
 * Allows clients to upload media chunks for server-side processing
 */
export const uploadChunkSchema = {
  body: t.Object({
    recordingId: t.String(),
    participantId: t.String(),
    chunk: t.String(), // Base64 encoded chunk data
    type: t.Union([t.Literal("audio"), t.Literal("video")]),
    timestamp: t.Number(),
    sequence: t.Number(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      message: t.String(),
      chunkId: t.Optional(t.String()),
    }),
    400: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
    401: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
    500: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
};

/**
 * Get recording upload status
 */
export const getUploadStatusSchema = {
  params: t.Object({
    recordingId: t.String(),
  }),
  response: {
    200: t.Object({
      success: t.Boolean(),
      data: t.Object({
        recordingId: t.String(),
        chunksReceived: t.Number(),
        participants: t.Array(t.String()),
        status: t.String(),
        lastChunkAt: t.Optional(t.Date()),
      }),
    }),
    404: t.Object({
      success: t.Boolean(),
      message: t.String(),
    }),
  },
};
