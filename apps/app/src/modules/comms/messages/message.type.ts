/**
 * Message System Types for Frontend
 *
 * Client-side messaging types without mongoose dependencies
 */

// ==================== ENUMS ====================

/**
 * Types of messages in the system
 */
export enum MessageType {
  TEXT = "text",
  ATTACHMENT = "attachment",
  SYSTEM = "system",
  PROPERTY_INQUIRY = "property_inquiry",
  APPLICATION_DISCUSSION = "application_discussion",
  PAYMENT_NOTIFICATION = "payment_notification",
  MAINTENANCE_REQUEST = "maintenance_request",
  RENEWAL_DISCUSSION = "renewal_discussion",
  COMPLAINT = "complaint",
  ANNOUNCEMENT = "announcement",
}

/**
 * Message status states
 */
export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
  DELETED = "deleted",
}

/**
 * Conversation types
 */
export enum ConversationType {
  DIRECT = "direct", // 1-on-1 conversation
  GROUP = "group", // Multiple participants
  SUPPORT = "support", // Customer support conversation
  PROPERTY_THREAD = "property_thread", // Property-specific discussion
  APPLICATION_THREAD = "application_thread", // Application-specific discussion
  SYSTEM = "system", // System notifications
}

/**
 * Conversation status
 */
export enum ConversationStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  MUTED = "muted",
  BLOCKED = "blocked",
  CLOSED = "closed",
}

/**
 * Participant roles in conversations
 */
export enum ParticipantRole {
  TENANT = "tenant",
  LANDLORD = "landlord",
  AGENT = "agent",
  ADMIN = "admin",
  SYSTEM = "system",
  SUPPORT = "support",
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * Attachment types
 */
export enum AttachmentType {
  IMAGE = "image",
  DOCUMENT = "document",
  VIDEO = "video",
  AUDIO = "audio",
  PROPERTY_PHOTO = "property_photo",
  CONTRACT = "contract",
  RECEIPT = "receipt",
  ID_DOCUMENT = "id_document",
  OTHER = "other",
}

// ==================== INTERFACES ====================

/**
 * Message attachment interface
 */
export type IMessageAttachment = {
  _id?: string;
  type: AttachmentType;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    [key: string]: any;
  };
};

/**
 * Message delivery receipt interface
 */
export type IMessageDelivery = {
  participantId: string;
  status: MessageStatus;
  timestamp: string;
  readAt?: string;
};

/**
 * Message interface
 */
export type IMessage = {
  _id?: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachments?: IMessageAttachment[];
  originalAttachments?: IMessageAttachment[];
  replyToMessageId?: string;
  status: MessageStatus;
  priority: MessagePriority;

  // Delivery tracking
  deliveries: IMessageDelivery[];

  // Metadata
  metadata?: {
    propertyId?: string;
    applicationId?: string;
    bookingId?: string;
    paymentId?: string;
    systemAction?: string;
    [key: string]: any;
  };

  // Timestamps
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
  readAt?: string;

  // Flags
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;

  deleted?: boolean;
};

/**
 * Conversation participant interface
 */
export type IConversationParticipant = {
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canAddParticipants: boolean;
    canRemoveParticipants: boolean;
    canDeleteMessages: boolean;
    canPinMessages: boolean;
  };
  lastReadMessageId?: string;
  lastReadAt?: string;
  isMuted: boolean;
  mutedUntil?: string;
};

/**
 * Conversation settings interface
 */
export type IConversationSettings = {
  allowFileSharing: boolean;
  allowImageSharing: boolean;
  maxFileSize: number;
  allowedFileTypes: AttachmentType[];
  autoTranslate: boolean;
  defaultLanguage: "en" | "sw";
  businessHoursOnly: boolean;
  retentionDays?: number;
};

/**
 * Conversation interface
 */
export type IConversation = {
  _id?: string;
  type: ConversationType;
  title?: string;
  description?: string;
  status: ConversationStatus;

  // Participants
  participants: IConversationParticipant[];
  createdBy: string;

  // Related entities
  propertyId?: string;
  applicationId?: string;

  // Message tracking
  messageCount: number;
  lastMessageId?: string;
  lastMessageAt?: string;
  lastActivity: string;

  // Settings
  settings: IConversationSettings;

  // Kenya-specific metadata
  metadata?: {
    county?: string;
    city?: string;
    propertyType?: string;
    businessContext?: string;
    [key: string]: any;
  };

  // Flags
  isArchived: boolean;
  isPinned: boolean;

  messages?: string[];
  unreadCount: Record<string, number>;
  isActive?: boolean;
};

// ==================== REQUEST/RESPONSE TYPES ====================

/**
 * Create conversation request
 */
export type CreateConversationRequest = {
  type: ConversationType;
  title?: string;
  description?: string;
  participantIds: string[];
  propertyId?: string;
  applicationId?: string;
  settings?: Partial<IConversationSettings>;
  metadata?: Record<string, any>;
};

/**
 * Send message request
 */
export type SendMessageRequest = {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachments?: {
    file: File;
    type: AttachmentType;
  }[];
  replyToMessageId?: string;
  priority?: MessagePriority;
  metadata?: Record<string, any>;
  autoTranslate?: boolean;
};

/**
 * Update conversation request
 */
export type UpdateConversationRequest = {
  title?: string;
  description?: string;
  status?: ConversationStatus;
  settings?: Partial<IConversationSettings>;
  metadata?: Record<string, any>;
};

/**
 * Add participant request
 */
export type AddParticipantRequest = {
  userId: string;
  role: ParticipantRole;
  permissions?: Partial<IConversationParticipant["permissions"]>;
};

/**
 * Message query filters
 */
export type MessageFilters = {
  conversationId?: string;
  senderId?: string;
  type?: MessageType;
  status?: MessageStatus;
  priority?: MessagePriority;
  hasAttachments?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  isDeleted?: boolean;
};

/**
 * Conversation query filters
 */
export type ConversationFilters = {
  type?: ConversationType;
  status?: ConversationStatus;
  participantId?: string;
  propertyId?: string;
  applicationId?: string;
  hasUnread?: boolean;
  isArchived?: boolean;
  createdAfter?: Date;
  lastActivityAfter?: Date;
  search?: string;
};

/**
 * Message response type
 */
export type MessageResponse = {
  message: IMessage;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: ParticipantRole;
  };
  conversation: {
    _id: string;
    title?: string;
    type: ConversationType;
  };
  isDelivered: boolean;
  isRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

/**
 * Conversation response type
 */
export type ConversationResponse = {
  conversation: IConversation;
  participants: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    role: ParticipantRole;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: MessageResponse;
  unreadCount: number;
  canWrite: boolean;
  canAddParticipants: boolean;
};

/**
 * Conversation list response
 */
export type ConversationListResponse = {
  conversations: ConversationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: ConversationFilters;
};

/**
 * Message list response
 */
export type MessageListResponse = {
  messages: MessageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  conversation: {
    _id: string;
    title?: string;
    type: ConversationType;
    participants: number;
  };
  filters: MessageFilters;
};

// ==================== REAL-TIME TYPES ====================

/**
 * Socket event types for real-time messaging
 */
export enum SocketEvent {
  // Connection events
  CONNECT = "connect",
  DISCONNECT = "disconnect",

  // Conversation events
  JOIN_CONVERSATION = "join_conversation",
  LEAVE_CONVERSATION = "leave_conversation",
  CONVERSATION_CREATED = "conversation_created",
  CONVERSATION_UPDATED = "conversation_updated",
  CONVERSATION_DELETED = "conversation_deleted",

  // Message events
  MESSAGE_SENT = "message_sent",
  MESSAGE_DELIVERED = "message_delivered",
  MESSAGE_READ = "message_read",
  MESSAGE_EDITED = "message_edited",
  MESSAGE_DELETED = "message_deleted",

  // Typing events
  TYPING_START = "typing_start",
  TYPING_STOP = "typing_stop",

  // Presence events
  USER_ONLINE = "user_online",
  USER_OFFLINE = "user_offline",

  // Error events
  ERROR = "error",
}

/**
 * Socket message payload
 */
export type SocketMessagePayload = {
  conversationId: string;
  message: IMessage;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  timestamp: string;
};

/**
 * Typing indicator payload
 */
export type TypingIndicatorPayload = {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
};

/**
 * User presence payload
 */
export type UserPresencePayload = {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
  conversationIds?: string[];
};

// ==================== CONSTANTS ====================

/**
 * Kenya-specific messaging constants
 */
export const MESSAGING_CONSTANTS = {
  // Business hours (EAT - East Africa Time)
  BUSINESS_HOURS: {
    START: 8, // 8 AM
    END: 18, // 6 PM
    TIMEZONE: "Africa/Nairobi",
  },

  // File size limits (in bytes)
  FILE_LIMITS: {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    VIDEO_MAX_SIZE: 50 * 1024 * 1024, // 50MB
    AUDIO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  },

  // Conversation limits
  LIMITS: {
    MAX_PARTICIPANTS: 50,
    MAX_MESSAGE_LENGTH: 4000,
    MAX_ATTACHMENTS_PER_MESSAGE: 5,
    MESSAGE_RETENTION_DAYS: 365,
    BULK_MESSAGE_LIMIT: 100,
  },
} as const;

/**
 * Message error codes
 */
export const MESSAGE_ERROR_CODES = {
  // User errors
  USER_NOT_FOUND: "USER_NOT_FOUND",
  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_ID: "INVALID_ID",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // Conversation errors
  CONVERSATION_NOT_FOUND: "CONVERSATION_NOT_FOUND",
  CONVERSATION_ACCESS_DENIED: "CONVERSATION_ACCESS_DENIED",
  CONVERSATION_CLOSED: "CONVERSATION_CLOSED",
  PARTICIPANT_NOT_FOUND: "PARTICIPANT_NOT_FOUND",
  PARTICIPANT_ALREADY_EXISTS: "PARTICIPANT_ALREADY_EXISTS",
  MAX_PARTICIPANTS_EXCEEDED: "MAX_PARTICIPANTS_EXCEEDED",

  // Message errors
  MESSAGE_NOT_FOUND: "MESSAGE_NOT_FOUND",
  MESSAGE_TOO_LONG: "MESSAGE_TOO_LONG",
  MESSAGE_SEND_FAILED: "MESSAGE_SEND_FAILED",
  MESSAGE_EDIT_NOT_ALLOWED: "MESSAGE_EDIT_NOT_ALLOWED",
  MESSAGE_DELETE_NOT_ALLOWED: "MESSAGE_DELETE_NOT_ALLOWED",

  // Attachment errors
  ATTACHMENT_TOO_LARGE: "ATTACHMENT_TOO_LARGE",
  ATTACHMENT_TYPE_NOT_ALLOWED: "ATTACHMENT_TYPE_NOT_ALLOWED",
  ATTACHMENT_UPLOAD_FAILED: "ATTACHMENT_UPLOAD_FAILED",
  MAX_ATTACHMENTS_EXCEEDED: "MAX_ATTACHMENTS_EXCEEDED",

  // Permission errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  USER_BLOCKED: "USER_BLOCKED",
  CONVERSATION_MUTED: "CONVERSATION_MUTED",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  SPAM_DETECTED: "SPAM_DETECTED",
} as const;

/**
 * Custom error class for messaging system
 */
export class MessageError extends Error {
  constructor(
    _code: keyof typeof MESSAGE_ERROR_CODES,
    message: string,
    _statusCode = 400,
    _details?: any
  ) {
    super(message);
    this.name = "MessageError";
  }
}
