/**
 * Message System Validation Schemas
 *
 * Elysia validation schemas for messaging system
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
import { t } from "elysia";

/**
 * Helper function to create Elysia enum from enum values
 */
const createEnumFromValues = (values: string[]) =>
  Object.fromEntries(values.map((v) => [v, v]));

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
): boolean =>
  startHour >= 0 &&
  startHour < 24 &&
  endHour >= 0 &&
  endHour < 24 &&
  startHour !== endHour;

// ==================== BASE SCHEMAS ====================

/**
 * MongoDB ObjectId schema
 */
const objectIdSchema = t.String({
  pattern: "^[0-9a-fA-F]{24}$",
  error: "Invalid ObjectId format",
});

/**
 * URL schema
 */
const urlSchema = t.String({
  format: "url",
  error: "Invalid URL format",
});

/**
 * File size schema
 */
const fileSizeSchema = t.Number({
  minimum: 1,
  maximum: MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
  error: "File size exceeds maximum allowed",
});

// ==================== ATTACHMENT VALIDATION ====================

/**
 * Message attachment validation schema
 */
export const messageAttachmentSchema = t.Object({
  _id: t.Optional(t.String()),
  type: t.Enum(createEnumFromValues(Object.values(AttachmentType))),
  filename: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Filename is required",
  }),
  originalName: t.String({
    minLength: 1,
    maxLength: 255,
    error: "Original name is required",
  }),
  url: urlSchema,
  thumbnailUrl: t.Optional(urlSchema),
  size: fileSizeSchema,
  mimeType: t.String({
    minLength: 1,
    maxLength: 100,
    error: "MIME type is required",
  }),
  uploadedBy: objectIdSchema,
  uploadedAt: t.Date(),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

/**
 * Message delivery validation schema
 */
export const messageDeliverySchema = t.Object({
  participantId: objectIdSchema,
  status: t.Enum(MessageStatus),
  timestamp: t.Date(),
  readAt: t.Optional(t.Date()),
});

// ==================== MESSAGE VALIDATION ====================

/**
 * Core message validation schema
 */
export const messageSchema = t.Object({
  _id: t.Optional(objectIdSchema),
  conversationId: objectIdSchema,
  senderId: objectIdSchema,
  type: t.Enum(MessageType),
  content: t.String({
    minLength: 1,
    maxLength: MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    error: "Message content is required",
  }),
  attachments: t.Array(messageAttachmentSchema, {
    maxItems: MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,
  }),
  replyToMessageId: t.Optional(objectIdSchema),
  status: t.Enum(MessageStatus),
  priority: t.Enum(MessagePriority),
  deliveries: t.Array(messageDeliverySchema),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  translatedContent: t.Optional(t.Record(t.String(), t.String())),
  sentAt: t.Date(),
  editedAt: t.Optional(t.Date()),
  deletedAt: t.Optional(t.Date()),
  isEdited: t.Boolean(),
  isDeleted: t.Boolean(),
  isPinned: t.Boolean(),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

// ==================== CONVERSATION VALIDATION ====================

/**
 * Conversation participant validation schema
 */
export const conversationParticipantSchema = t.Object({
  userId: objectIdSchema,
  role: t.Enum(ParticipantRole),
  joinedAt: t.Date(),
  leftAt: t.Optional(t.Date()),
  isActive: t.Boolean(),
  permissions: t.Object({
    canRead: t.Boolean(),
    canWrite: t.Boolean(),
    canAddParticipants: t.Boolean(),
    canRemoveParticipants: t.Boolean(),
    canDeleteMessages: t.Boolean(),
    canPinMessages: t.Boolean(),
  }),
  lastReadMessageId: t.Optional(objectIdSchema),
  lastReadAt: t.Optional(t.Date()),
  isMuted: t.Boolean(),
  mutedUntil: t.Optional(t.Date()),
});

/**
 * Conversation settings validation schema
 */
export const conversationSettingsSchema = t.Object({
  allowFileSharing: t.Boolean(),
  allowImageSharing: t.Boolean(),
  maxFileSize: t.Number({
    minimum: 1024,
    maximum: MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
    error: "File size limit too large",
  }),
  allowedFileTypes: t.Array(t.Enum(AttachmentType)),
  autoTranslate: t.Boolean(),
  defaultLanguage: t.Union([t.Literal("en"), t.Literal("sw")]),
  businessHoursOnly: t.Boolean(),
  retentionDays: t.Optional(
    t.Number({
      minimum: 1,
      maximum: MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS,
      error: "Retention period too long",
    })
  ),
});

/**
 * Core conversation validation schema
 */
export const conversationSchema = t.Object({
  _id: t.Optional(objectIdSchema),
  type: t.Enum(ConversationType),
  title: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  status: t.Enum(ConversationStatus),
  participants: t.Array(conversationParticipantSchema, {
    minItems: 1,
    maxItems: MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS,
  }),
  createdBy: objectIdSchema,
  propertyId: t.Optional(objectIdSchema),
  applicationId: t.Optional(objectIdSchema),
  messageCount: t.Number({ minimum: 0 }),
  lastMessageId: t.Optional(objectIdSchema),
  lastMessageAt: t.Optional(t.Date()),
  lastActivity: t.Date(),
  settings: conversationSettingsSchema,
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  isArchived: t.Boolean(),
  isPinned: t.Boolean(),
  createdAt: t.Optional(t.Date()),
  updatedAt: t.Optional(t.Date()),
});

// ==================== REQUEST VALIDATION SCHEMAS ====================

/**
 * Create conversation request validation
 */
export const createConversationRequestSchema = t.Object({
  type: t.Enum(ConversationType),
  title: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  participantIds: t.Array(objectIdSchema, {
    minItems: 1,
    maxItems: MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS - 1,
  }),
  propertyId: t.Optional(objectIdSchema),
  applicationId: t.Optional(objectIdSchema),
  settings: t.Optional(t.Partial(conversationSettingsSchema)),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

/**
 * Send message request validation
 */
export const sendMessageRequestSchema = t.Object({
  conversationId: objectIdSchema,
  content: t.String({
    minLength: 1,
    maxLength: MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    error: "Message content is required",
  }),
  type: t.Optional(t.Enum(MessageType)),
  attachments: t.Optional(
    t.Array(
      t.Object({
        file: t.Any(), // File object - will be validated by multer middleware
        type: t.Enum(AttachmentType),
      }),
      {
        maxItems: MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,
      }
    )
  ),
  replyToMessageId: t.Optional(objectIdSchema),
  priority: t.Optional(t.Enum(MessagePriority)),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  autoTranslate: t.Optional(t.Boolean()),
});

/**
 * Update conversation request validation
 */
export const updateConversationRequestSchema = t.Object({
  title: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 1000 })),
  status: t.Optional(t.Enum(ConversationStatus)),
  settings: t.Optional(t.Partial(conversationSettingsSchema)),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

/**
 * Add participant request validation
 */
export const addParticipantRequestSchema = t.Object({
  userId: objectIdSchema,
  role: t.Enum(ParticipantRole),
  permissions: t.Optional(
    t.Object({
      canRead: t.Optional(t.Boolean()),
      canWrite: t.Optional(t.Boolean()),
      canAddParticipants: t.Optional(t.Boolean()),
      canRemoveParticipants: t.Optional(t.Boolean()),
      canDeleteMessages: t.Optional(t.Boolean()),
      canPinMessages: t.Optional(t.Boolean()),
    })
  ),
});

/**
 * Bulk message request validation
 */
export const bulkMessageRequestSchema = t.Object({
  conversationIds: t.Array(objectIdSchema, {
    minItems: 1,
    maxItems: MESSAGING_CONSTANTS.LIMITS.BULK_MESSAGE_LIMIT,
  }),
  content: t.String({
    minLength: 1,
    maxLength: MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
    error: "Message content is required",
  }),
  type: t.Enum(MessageType),
  priority: t.Enum(MessagePriority),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  scheduledFor: t.Optional(t.Date()),
  respectBusinessHours: t.Boolean(),
});

// ==================== QUERY VALIDATION SCHEMAS ====================

/**
 * Message list query validation
 */
export const messageListQuerySchema = t.Object({
  conversationId: t.Optional(objectIdSchema),
  senderId: t.Optional(objectIdSchema),
  type: t.Optional(t.Enum(MessageType)),
  status: t.Optional(t.Enum(MessageStatus)),
  priority: t.Optional(t.Enum(MessagePriority)),
  hasAttachments: t.Optional(t.Boolean()),
  dateFrom: t.Optional(t.Date()),
  dateTo: t.Optional(t.Date()),
  search: t.Optional(t.String({ maxLength: 200 })),
  isDeleted: t.Optional(t.Boolean()),
  page: t.Number({ minimum: 1, default: 1 }),
  limit: t.Number({ minimum: 1, maximum: 100, default: 20 }),
  sortBy: t.Union([
    t.Literal("sentAt"),
    t.Literal("priority"),
    t.Literal("status"),
  ]),
  sortOrder: t.Union([t.Literal("asc"), t.Literal("desc")]),
});

/**
 * Conversation list query validation
 */
export const conversationListQuerySchema = t.Object({
  type: t.Optional(t.Enum(ConversationType)),
  status: t.Optional(t.Enum(ConversationStatus)),
  participantId: t.Optional(objectIdSchema),
  propertyId: t.Optional(objectIdSchema),
  applicationId: t.Optional(objectIdSchema),
  hasUnread: t.Optional(t.Boolean()),
  isArchived: t.Optional(t.Boolean()),
  createdAfter: t.Optional(t.Date()),
  lastActivityAfter: t.Optional(t.Date()),
  search: t.Optional(t.String({ maxLength: 200 })),
  page: t.Number({ minimum: 1, default: 1 }),
  limit: t.Number({ minimum: 1, maximum: 100, default: 20 }),
  sortBy: t.Union([
    t.Literal("lastActivity"),
    t.Literal("createdAt"),
    t.Literal("messageCount"),
  ]),
  sortOrder: t.Union([t.Literal("asc"), t.Literal("desc")]),
});

/**
 * Message analytics query validation
 */
export const messageAnalyticsQuerySchema = t.Object({
  conversationId: t.Optional(objectIdSchema),
  startDate: t.Date(),
  endDate: t.Date(),
  groupBy: t.Union([t.Literal("day"), t.Literal("week"), t.Literal("month")]),
  includeKenyaMetrics: t.Boolean(),
});

/**
 * Send test notification validation
 */
export const sendTestNotificationSchema = t.Object({
  conversationId: objectIdSchema,
  messageContent: t.String({ minLength: 1 }),
  channels: t.Array(
    t.Union([t.Literal("email"), t.Literal("sms"), t.Literal("push")]),
    {
      minItems: 1,
    }
  ),
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
  errors: any[];
  constructor(errors: any[], _statusCode = 400) {
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
