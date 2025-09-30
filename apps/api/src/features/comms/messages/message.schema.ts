/**
 * Message System Validation Schemas
 *
 * Zod validation schemas for messaging system
 * Includes Kenya-specific validations and business rules
 */

import {
  AttachmentType,
  ConversationStatus,
  ConversationType,
  MESSAGING_CONSTANTS,
  MessagePriority,
  MessageStatus,
  MessageType,
  ParticipantRole,
} from "@kaa/models/types";
import { z } from "zod";

// ==================== CUSTOM VALIDATION FUNCTIONS ====================

/**
 * Validate Kenyan business hours
 */
export const validateKenyanBusinessHours = (date: Date): boolean => {
  const nairobiTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Africa/Nairobi" })
  );
  const hour = nairobiTime.getHours();
  const isWeekend = nairobiTime.getDay() === 0 || nairobiTime.getDay() === 6; // Sunday = 0, Saturday = 6

  return (
    !isWeekend &&
    hour >= MESSAGING_CONSTANTS.BUSINESS_HOURS.START &&
    hour < MESSAGING_CONSTANTS.BUSINESS_HOURS.END
  );
};

/**
 * Validate phone number format (Kenya)
 */
export const validateKenyanPhoneNumber = (phone: string): boolean => {
  // Kenya phone number patterns:
  // +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
  // biome-ignore lint/performance/useTopLevelRegex: false positive
  const kenyaPhoneRegex = /^(\+?254|0)?([17]\d{8}|[4]\d{8})$/;
  return kenyaPhoneRegex.test(phone.replace(/\s+/g, ""));
};

/**
 * Validate file size based on type
 */
export const validateFileSize = (
  size: number,
  type: AttachmentType
): boolean => {
  const limits = MESSAGING_CONSTANTS.FILE_LIMITS;

  switch (type) {
    case AttachmentType.IMAGE:
    case AttachmentType.PROPERTY_PHOTO:
      return size <= limits.IMAGE_MAX_SIZE;
    case AttachmentType.VIDEO:
      return size <= limits.VIDEO_MAX_SIZE;
    case AttachmentType.AUDIO:
      return size <= limits.AUDIO_MAX_SIZE;
    case AttachmentType.DOCUMENT:
    case AttachmentType.CONTRACT:
    case AttachmentType.RECEIPT:
    case AttachmentType.ID_DOCUMENT:
      return size <= limits.DOCUMENT_MAX_SIZE;
    default:
      return size <= limits.DOCUMENT_MAX_SIZE;
  }
};

/**
 * Validate message content for spam/inappropriate content
 */
export const validateMessageContent = (
  content: string
): { isValid: boolean; reason?: string } => {
  // Check for minimum content
  if (content.trim().length === 0) {
    return { isValid: false, reason: "Message content cannot be empty" };
  }

  // Check for maximum length
  if (content.length > MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH) {
    return { isValid: false, reason: "Message content exceeds maximum length" };
  }

  // Basic spam detection patterns
  const spamPatterns = [
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    /(.)\1{10,}/, // Repeated characters
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    /[A-Z]{20,}/, // Excessive caps
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    /(URGENT|WINNER|CONGRATULATIONS|CLICK HERE|FREE|PRIZE).{0,50}(URGENT|WINNER|CONGRATULATIONS|CLICK HERE|FREE|PRIZE)/i,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, reason: "Message content appears to be spam" };
    }
  }

  return { isValid: true };
};

/**
 * Validate scheduled date
 */
export const validateScheduledDate = (date: Date): boolean => {
  const now = new Date();
  const maxFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year in future

  return date > now && date <= maxFutureDate;
};

/**
 * Validate quiet hours (user-specific)
 */
export const validateQuietHours = (
  startHour: number,
  endHour: number
): boolean => {
  return (
    startHour >= 0 &&
    startHour < 24 &&
    endHour >= 0 &&
    endHour < 24 &&
    startHour !== endHour
  );
};

// ==================== BASE SCHEMAS ====================

/**
 * MongoDB ObjectId schema
 */
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

/**
 * URL schema
 */
const urlSchema = z.string().url("Invalid URL format");

/**
 * File size schema
 */
const fileSizeSchema = z
  .number()
  .min(1, "File size must be positive")
  .max(
    MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
    "File size exceeds maximum allowed"
  );

// ==================== ATTACHMENT VALIDATION ====================

/**
 * Message attachment validation schema
 */
export const messageAttachmentSchema = z
  .object({
    _id: z.string().optional(),
    type: z.enum(Object.values(AttachmentType), {
      error: () => ({ message: "Invalid attachment type" }),
    }),
    filename: z
      .string()
      .min(1, "Filename is required")
      .max(255, "Filename too long"),
    originalName: z
      .string()
      .min(1, "Original name is required")
      .max(255, "Original name too long"),
    url: urlSchema,
    thumbnailUrl: urlSchema.optional(),
    size: fileSizeSchema,
    mimeType: z
      .string()
      .min(1, "MIME type is required")
      .max(100, "MIME type too long"),
    uploadedBy: objectIdSchema,
    uploadedAt: z.date().default(() => new Date()),
    metadata: z.record(z.string(), z.any()).optional().default({}),
  })
  .refine((data) => validateFileSize(data.size, data.type), {
    message: "File size exceeds limit for this attachment type",
    path: ["size"],
  });

/**
 * Message delivery validation schema
 */
export const messageDeliverySchema = z.object({
  participantId: objectIdSchema,
  status: z
    .enum(Object.values(MessageStatus), {
      error: () => ({ message: "Invalid message status" }),
    })
    .default(MessageStatus.SENT),
  timestamp: z.date().default(() => new Date()),
  readAt: z.date().optional(),
});

// ==================== MESSAGE VALIDATION ====================

/**
 * Core message validation schema
 */
export const messageSchema = z.object({
  _id: objectIdSchema.optional(),
  conversationId: objectIdSchema,
  senderId: objectIdSchema,
  type: z
    .enum(Object.values(MessageType), {
      error: () => ({ message: "Invalid message type" }),
    })
    .default(MessageType.TEXT),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
      "Message content too long"
    )
    .refine(
      (content) => validateMessageContent(content).isValid
      //   (content: string) => ({
      //     message:
      //       validateMessageContent(content).reason || "Invalid message content",
      //   })
    ),
  attachments: z
    .array(messageAttachmentSchema)
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,
      "Too many attachments"
    )
    .default([]),
  replyToMessageId: objectIdSchema.optional(),
  status: z
    .nativeEnum(MessageStatus, {
      error: () => ({ message: "Invalid message status" }),
    })
    .default(MessageStatus.SENT),
  priority: z
    .nativeEnum(MessagePriority, {
      error: () => ({ message: "Invalid message priority" }),
    })
    .default(MessagePriority.NORMAL),
  deliveries: z.array(messageDeliverySchema).default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  translatedContent: z.record(z.string(), z.string()).optional(),
  sentAt: z.date().default(() => new Date()),
  editedAt: z.date().optional(),
  deletedAt: z.date().optional(),
  isEdited: z.boolean().default(false),
  isDeleted: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ==================== CONVERSATION VALIDATION ====================

/**
 * Conversation participant validation schema
 */
export const conversationParticipantSchema = z.object({
  userId: objectIdSchema,
  role: z.nativeEnum(ParticipantRole, {
    error: () => ({ message: "Invalid participant role" }),
  }),
  joinedAt: z.date().default(() => new Date()),
  leftAt: z.date().optional(),
  isActive: z.boolean().default(true),
  permissions: z.object({
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(true),
    canAddParticipants: z.boolean().default(false),
    canRemoveParticipants: z.boolean().default(false),
    canDeleteMessages: z.boolean().default(false),
    canPinMessages: z.boolean().default(false),
  }),
  lastReadMessageId: objectIdSchema.optional(),
  lastReadAt: z.date().optional(),
  isMuted: z.boolean().default(false),
  mutedUntil: z.date().optional(),
});

/**
 * Conversation settings validation schema
 */
export const conversationSettingsSchema = z.object({
  allowFileSharing: z.boolean().default(true),
  allowImageSharing: z.boolean().default(true),
  maxFileSize: z
    .number()
    .min(1024, "File size limit too small")
    .max(
      MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
      "File size limit too large"
    )
    .default(MESSAGING_CONSTANTS.FILE_LIMITS.DOCUMENT_MAX_SIZE),
  allowedFileTypes: z
    .array(z.nativeEnum(AttachmentType))
    .default(Object.values(AttachmentType)),
  autoTranslate: z.boolean().default(false),
  defaultLanguage: z
    .enum(["en", "sw"], {
      error: () => ({ message: 'Language must be either "en" or "sw"' }),
    })
    .default("en"),
  businessHoursOnly: z.boolean().default(false),
  retentionDays: z
    .number()
    .min(1, "Retention period too short")
    .max(
      MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS,
      "Retention period too long"
    )
    .optional(),
});

/**
 * Core conversation validation schema
 */
export const conversationSchema = z.object({
  _id: objectIdSchema.optional(),
  type: z.nativeEnum(ConversationType, {
    error: () => ({ message: "Invalid conversation type" }),
  }),
  title: z.string().max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: z
    .nativeEnum(ConversationStatus, {
      error: () => ({ message: "Invalid conversation status" }),
    })
    .default(ConversationStatus.ACTIVE),
  participants: z
    .array(conversationParticipantSchema)
    .min(1, "Conversation must have at least one participant")
    .max(MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS, "Too many participants"),
  createdBy: objectIdSchema,
  propertyId: objectIdSchema.optional(),
  applicationId: objectIdSchema.optional(),
  messageCount: z
    .number()
    .min(0, "Message count cannot be negative")
    .default(0),
  lastMessageId: objectIdSchema.optional(),
  lastMessageAt: z.date().optional(),
  lastActivity: z.date().default(() => new Date()),
  settings: conversationSettingsSchema,
  metadata: z.record(z.string(), z.any()).optional().default({}),
  isArchived: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// ==================== REQUEST VALIDATION SCHEMAS ====================

/**
 * Create conversation request validation
 */
export const createConversationRequestSchema = z.object({
  type: z.nativeEnum(ConversationType, {
    error: () => ({ message: "Invalid conversation type" }),
  }),
  title: z.string().max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  participantIds: z
    .array(objectIdSchema)
    .min(1, "Must include at least one participant")
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS - 1,
      "Too many participants"
    ),
  propertyId: objectIdSchema.optional(),
  applicationId: objectIdSchema.optional(),
  settings: conversationSettingsSchema.partial().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Send message request validation
 */
export const sendMessageRequestSchema = z.object({
  conversationId: objectIdSchema,
  content: z
    .string()
    .min(1, "Message content is required")
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
      "Message content too long"
    )
    .refine(
      (content) => validateMessageContent(content).isValid
      //   (content: string) => ({
      //     message:
      //       validateMessageContent(content).reason || "Invalid message content",
      //   })
    ),
  type: z
    .enum(Object.values(MessageType), {
      error: () => ({ message: "Invalid message type" }),
    })
    .optional()
    .default(MessageType.TEXT),
  attachments: z
    .array(
      z.object({
        file: z.any(), // File object - will be validated by multer middleware
        type: z.nativeEnum(AttachmentType),
      })
    )
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,
      "Too many attachments"
    )
    .optional(),
  replyToMessageId: objectIdSchema.optional(),
  priority: z
    .enum(Object.values(MessagePriority))
    .optional()
    .default(MessagePriority.NORMAL),
  metadata: z.record(z.string(), z.any()).optional(),
  autoTranslate: z.boolean().optional().default(false),
});

/**
 * Update conversation request validation
 */
export const updateConversationRequestSchema = z.object({
  title: z.string().max(200, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  status: z.enum(Object.values(ConversationStatus)).optional(),
  settings: conversationSettingsSchema.partial().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Add participant request validation
 */
export const addParticipantRequestSchema = z.object({
  userId: objectIdSchema,
  role: z.nativeEnum(ParticipantRole, {
    error: () => ({ message: "Invalid participant role" }),
  }),
  permissions: z
    .object({
      canRead: z.boolean().optional(),
      canWrite: z.boolean().optional(),
      canAddParticipants: z.boolean().optional(),
      canRemoveParticipants: z.boolean().optional(),
      canDeleteMessages: z.boolean().optional(),
      canPinMessages: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Bulk message request validation
 */
export const bulkMessageRequestSchema = z.object({
  conversationIds: z
    .array(objectIdSchema)
    .min(1, "Must include at least one conversation")
    .max(
      MESSAGING_CONSTANTS.LIMITS.BULK_MESSAGE_LIMIT,
      "Too many conversations"
    ),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(
      MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
      "Message content too long"
    ),
  type: z.enum(Object.values(MessageType)).default(MessageType.TEXT),
  priority: z
    .enum(Object.values(MessagePriority))
    .default(MessagePriority.NORMAL),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  scheduledFor: z
    .date()
    .refine(validateScheduledDate, "Invalid scheduled date")
    .optional(),
  respectBusinessHours: z.boolean().default(true),
});

// ==================== QUERY VALIDATION SCHEMAS ====================

/**
 * Message list query validation
 */
export const messageListQuerySchema = z.object({
  conversationId: objectIdSchema.optional(),
  senderId: objectIdSchema.optional(),
  type: z.enum(Object.values(MessageType)).optional(),
  status: z.enum(Object.values(MessageStatus)).optional(),
  priority: z.enum(Object.values(MessagePriority)).optional(),
  hasAttachments: z.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(200, "Search query too long").optional(),
  isDeleted: z.boolean().optional(),
  page: z.coerce.number().min(1, "Page must be positive").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be positive")
    .max(100, "Limit too large")
    .default(20),
  sortBy: z.enum(["sentAt", "priority", "status"]).default("sentAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Conversation list query validation
 */
export const conversationListQuerySchema = z.object({
  type: z.nativeEnum(ConversationType).optional(),
  status: z.nativeEnum(ConversationStatus).optional(),
  participantId: objectIdSchema.optional(),
  propertyId: objectIdSchema.optional(),
  applicationId: objectIdSchema.optional(),
  hasUnread: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  createdAfter: z.coerce.date().optional(),
  lastActivityAfter: z.coerce.date().optional(),
  search: z.string().max(200, "Search query too long").optional(),
  page: z.coerce.number().min(1, "Page must be positive").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be positive")
    .max(100, "Limit too large")
    .default(20),
  sortBy: z
    .enum(["lastActivity", "createdAt", "messageCount"])
    .default("lastActivity"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Message analytics query validation
 */
export const messageAnalyticsQuerySchema = z
  .object({
    conversationId: objectIdSchema.optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    groupBy: z.enum(["day", "week", "month"]).default("day"),
    includeKenyaMetrics: z.boolean().default(true),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

/**
 * Send test notification validation
 */
export const sendTestNotificationSchema = z.object({
  conversationId: objectIdSchema,
  messageContent: z.string().min(1, "Test message content is required"),
  channels: z
    .array(z.enum(["email", "sms", "push"]))
    .min(1, "Must include at least one channel"),
});

// ==================== VALIDATION UTILITY FUNCTIONS ====================

/**
 * Validate notification data
 */
export const validateNotificationData = (
  data: any
): { isValid: boolean; errors?: string[] } => {
  const errors: string[] = [];

  if (!data.recipientId) {
    errors.push("Recipient ID is required");
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push("Notification content is required");
  }

  if (
    data.scheduledFor &&
    !validateScheduledDate(new Date(data.scheduledFor))
  ) {
    errors.push("Invalid scheduled date");
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
};

// ==================== CUSTOM ERROR CLASS ====================

/**
 * Custom validation error class
 */
export class MessageValidationError extends Error {
  errors: z.ZodError<any>[];
  constructor(errors: z.ZodError<any>[], _statusCode = 400) {
    super("Validation failed");
    this.name = "MessageValidationError";
    this.errors = errors;
  }

  /**
   * Get formatted error messages
   */
  getFormattedErrors(): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const error of this.errors) {
      const path = (error as any).path.join(".");
      if (!formatted[path]) {
        formatted[path] = [];
      }
      formatted[path].push(error.message);
    }

    return formatted;
  }
}

// ==================== VALIDATION SCHEMAS COLLECTION ====================

/**
 * All message validation schemas
 */
export const messageValidationSchemas = {
  // Core schemas
  message: messageSchema,
  conversation: conversationSchema,
  messageAttachment: messageAttachmentSchema,
  messageDelivery: messageDeliverySchema,
  conversationParticipant: conversationParticipantSchema,
  conversationSettings: conversationSettingsSchema,

  // Request schemas
  createConversationRequest: createConversationRequestSchema,
  sendMessageRequest: sendMessageRequestSchema,
  updateConversationRequest: updateConversationRequestSchema,
  addParticipantRequest: addParticipantRequestSchema,
  bulkMessageRequest: bulkMessageRequestSchema,

  // Query schemas
  messageListQuery: messageListQuerySchema,
  conversationListQuery: conversationListQuerySchema,
  messageAnalyticsQuery: messageAnalyticsQuerySchema,
  sendTestNotification: sendTestNotificationSchema,
} as const;

// Default export
export default {
  ...messageValidationSchemas,
  MessageValidationError,
  validateKenyanBusinessHours,
  validateKenyanPhoneNumber,
  validateFileSize,
  validateMessageContent,
  validateScheduledDate,
  validateQuietHours,
  validateNotificationData,
};
