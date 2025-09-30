import mongoose, { type Model, model, Schema, Types } from "mongoose";
import {
  AttachmentType,
  ConversationStatus,
  ConversationType,
  type IConversation,
  type IConversationParticipant,
  type IConversationSettings,
  type IMessage,
  type IMessageAnalytics,
  type IMessageAttachment,
  type IMessageDelivery,
  type IMessageThread,
  MESSAGING_CONSTANTS,
  MessagePriority,
  MessageStatus,
  MessageType,
  ParticipantRole,
} from "./types/message.type";

// ==================== ATTACHMENT SCHEMA ====================

/**
 * Message attachment schema
 */
const MessageAttachmentSchema = new Schema<IMessageAttachment>(
  {
    _id: {
      type: String,
      default: () => new Types.ObjectId().toString(),
    },
    type: {
      type: String,
      enum: Object.values(AttachmentType),
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      maxlength: 255,
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255,
    },
    url: {
      type: String,
      required: true,
      validate: {
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        validator: (v: string) => /^https?:\/\/.+/.test(v),
        message: "URL must be a valid HTTP/HTTPS URL",
      },
    },
    thumbnailUrl: {
      type: String,
      validate: {
        // biome-ignore lint/performance/useTopLevelRegex: ignore
        validator: (v: string) => !v || /^https?:\/\/.+/.test(v),
        message: "Thumbnail URL must be a valid HTTP/HTTPS URL",
      },
    },
    size: {
      type: Number,
      required: true,
      min: 0,
      max: MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 100,
    },
    uploadedBy: {
      type: Schema.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    uploadedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: false, // Using custom _id
    timestamps: false, // Using custom uploadedAt
  }
);

// ==================== MESSAGE DELIVERY SCHEMA ====================

/**
 * Message delivery receipt schema
 */
const MessageDeliverySchema = new Schema<IMessageDelivery>(
  {
    participantId: {
      type: Schema.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      required: true,
      default: MessageStatus.SENT,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    readAt: {
      type: Date,
      index: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Message schema definition
 */
const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: String,
      required: true,
      ref: "Conversation",
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      required: true,
      default: MessageType.TEXT,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: MESSAGING_CONSTANTS.LIMITS.MAX_MESSAGE_LENGTH,
      validate: {
        validator: (v: string) => v.trim().length > 0,
        message: "Message content cannot be empty",
      },
    },
    attachments: {
      type: [MessageAttachmentSchema],
      default: [],
      validate: {
        validator: (v: IMessageAttachment[]) =>
          v.length <= MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE,
        message: `Maximum ${MESSAGING_CONSTANTS.LIMITS.MAX_ATTACHMENTS_PER_MESSAGE} attachments allowed per message`,
      },
    },
    originalAttachments: [
      {
        url: String,
        key: String, // S3 key
        filename: String,
        contentType: String,
      },
    ],
    replyToMessageId: {
      type: String,
      ref: "Message",
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      required: true,
      default: MessageStatus.SENT,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(MessagePriority),
      required: true,
      default: MessagePriority.NORMAL,
      index: true,
    },

    // Delivery tracking
    deliveries: {
      type: [MessageDeliverySchema],
      default: [],
    },

    // Metadata
    metadata: {
      /*
      property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
      */
      type: Schema.Types.Mixed,
      default: {},
    },

    // Kenya-specific features
    // translatedContent: {
    //   type: Map,
    //   of: String,
    //   default: new Map(),
    // },

    // Timestamps
    sentAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    editedAt: {
      type: Date,
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },

    // Flags
    isEdited: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isPinned: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    readAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create index for faster queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, sentAt: -1 }); // List messages by conversation
messageSchema.index({ senderId: 1, sentAt: -1 }); // List messages by sender
messageSchema.index({ conversationId: 1, status: 1 }); // Message status queries
messageSchema.index({ type: 1, sentAt: -1 }); // Messages by type
messageSchema.index({ priority: 1, sentAt: -1 }); // Priority-based queries
messageSchema.index({ "deliveries.participantId": 1, "deliveries.status": 1 }); // Delivery status
messageSchema.index({ "metadata.propertyId": 1 }); // Property-related messages
messageSchema.index({ "metadata.applicationId": 1 }); // Application-related messages

// Text index for search functionality
messageSchema.index(
  {
    content: "text",
    "translatedContent.sw": "text",
    "translatedContent.en": "text",
  },
  {
    name: "message_text_search",
    default_language: "english",
    language_override: "language",
  }
);

// TTL index for message retention (optional)
messageSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds:
      MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS * 24 * 60 * 60,
    partialFilterExpression: { isDeleted: true },
  }
);

/**
 * Method to mark message as read
 * @returns Promise with updated message
 */
messageSchema.methods.markAsRead = function (
  participantId: string
): Promise<IMessage> {
  const delivery = this.deliveries.find(
    (d: IMessageDelivery) =>
      d.participantId === new mongoose.Types.ObjectId(participantId)
  );

  if (delivery && delivery.status !== MessageStatus.READ) {
    delivery.status = MessageStatus.READ;
    delivery.readAt = new Date();
    return this.save();
  }

  return Promise.resolve(this as any);
};

/**
 * Mark message as delivered to a participant
 */
messageSchema.methods.markAsDelivered = function (participantId: string) {
  const delivery = this.deliveries.find(
    (d: IMessageDelivery) =>
      d.participantId === new mongoose.Types.ObjectId(participantId)
  );

  if (delivery && delivery.status === MessageStatus.SENT) {
    delivery.status = MessageStatus.DELIVERED;
    return this.save();
  }

  return Promise.resolve(this);
};

/**
 * Add translation for the message
 */
messageSchema.methods.addTranslation = function (
  language: string,
  translatedText: string
) {
  if (!this.translatedContent) {
    this.translatedContent = new Map();
  }
  this.translatedContent.set(language, translatedText);
  return this.save();
};

/**
 * Soft delete message
 */
messageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

/**
 * Method to check if message has attachments
 * @returns Boolean indicating if message has attachments
 */
messageSchema.methods.hasAttachments = function (): boolean {
  return Boolean(
    (this.attachments && this.attachments.length > 0) ||
      (this.originalAttachments && this.originalAttachments.length > 0)
  );
};

// Create and export the Message model
export const Message: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);

// ==================== CONVERSATION PARTICIPANT SCHEMA ====================

/**
 * Conversation participant schema
 */
const ConversationParticipantSchema = new Schema<IConversationParticipant>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    leftAt: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    permissions: {
      canRead: {
        type: Boolean,
        required: true,
        default: true,
      },
      canWrite: {
        type: Boolean,
        required: true,
        default: true,
      },
      canAddParticipants: {
        type: Boolean,
        required: true,
        default: false,
      },
      canRemoveParticipants: {
        type: Boolean,
        required: true,
        default: false,
      },
      canDeleteMessages: {
        type: Boolean,
        required: true,
        default: false,
      },
      canPinMessages: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    lastReadMessageId: {
      type: String,
      ref: "Message",
    },
    lastReadAt: {
      type: Date,
      index: true,
    },
    isMuted: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    mutedUntil: {
      type: Date,
      index: true,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

// ==================== CONVERSATION SETTINGS SCHEMA ====================

/**
 * Conversation settings schema
 */
const ConversationSettingsSchema = new Schema<IConversationSettings>(
  {
    allowFileSharing: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowImageSharing: {
      type: Boolean,
      required: true,
      default: true,
    },
    maxFileSize: {
      type: Number,
      required: true,
      default: MESSAGING_CONSTANTS.FILE_LIMITS.DOCUMENT_MAX_SIZE,
      min: 1024, // 1KB minimum
      max: MESSAGING_CONSTANTS.FILE_LIMITS.VIDEO_MAX_SIZE,
    },
    allowedFileTypes: {
      type: [String],
      enum: Object.values(AttachmentType),
      default: Object.values(AttachmentType),
    },
    autoTranslate: {
      type: Boolean,
      required: true,
      default: false,
    },
    defaultLanguage: {
      type: String,
      enum: ["en", "sw"],
      required: true,
      default: "en",
    },
    businessHoursOnly: {
      type: Boolean,
      required: true,
      default: false,
    },
    retentionDays: {
      type: Number,
      min: 1,
      max: MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS,
      default: MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS,
    },
  },
  {
    _id: false,
    timestamps: false,
  }
);

/**
 * Conversation schema definition
 */
const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ConversationStatus),
      required: true,
      default: ConversationStatus.ACTIVE,
      index: true,
    },

    // Participants
    participants: {
      type: [ConversationParticipantSchema],
      required: true,
      validate: {
        validator: (v: IConversationParticipant[]) =>
          v.length > 0 &&
          v.length <= MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS,
        message: `Conversation must have 1-${MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS} participants`,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },

    // Related entities
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      index: true,
    },

    // Message tracking
    messageCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      index: true,
    },
    lastActivity: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Settings
    settings: {
      type: ConversationSettingsSchema,
      required: true,
      default: () => ({}),
    },

    // Kenya-specific metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // Flags
    isArchived: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    isPinned: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure participants are unique and create index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });
// ==================== CONVERSATION SCHEMA INDEXES ====================

// Compound indexes for efficient queries
conversationSchema.index({ "participants.userId": 1, lastActivity: -1 }); // User's conversations
conversationSchema.index({ type: 1, status: 1, lastActivity: -1 }); // Conversation list queries
conversationSchema.index({ propertyId: 1, type: 1 }); // Property-related conversations
conversationSchema.index({ applicationId: 1, type: 1 }); // Application-related conversations
conversationSchema.index({ createdBy: 1, createdAt: -1 }); // Created conversations
conversationSchema.index({ status: 1, lastActivity: -1 }); // Active conversations

// Text index for conversation search
conversationSchema.index(
  { title: "text", description: "text" },
  {
    name: "conversation_text_search",
    default_language: "english",
  }
);

// ==================== CONVERSATION SCHEMA METHODS ====================

/**
 * Add participant to conversation
 */
conversationSchema.methods.addParticipant = function (
  userId: string,
  role: ParticipantRole,
  permissions?: Partial<IConversationParticipant["permissions"]>
) {
  const existingParticipant = this.participants.find(
    (p: IConversationParticipant) => p.userId === userId && p.isActive
  );

  if (existingParticipant) {
    throw new Error("User is already a participant in this conversation");
  }

  if (this.participants.length >= MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS) {
    throw new Error("Maximum participants limit reached");
  }

  const defaultPermissions = {
    canRead: true,
    canWrite: true,
    canAddParticipants:
      role === ParticipantRole.ADMIN || role === ParticipantRole.LANDLORD,
    canRemoveParticipants: role === ParticipantRole.ADMIN,
    canDeleteMessages: role === ParticipantRole.ADMIN,
    canPinMessages:
      role === ParticipantRole.ADMIN || role === ParticipantRole.LANDLORD,
  };

  this.participants.push({
    userId,
    role,
    joinedAt: new Date(),
    isActive: true,
    permissions: { ...defaultPermissions, ...permissions },
    isMuted: false,
  });

  this.lastActivity = new Date();
  return this.save();
};

/**
 * Remove participant from conversation
 */
conversationSchema.methods.removeParticipant = function (userId: string) {
  const participant = this.participants.find(
    (p: IConversationParticipant) => p.userId === userId && p.isActive
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    this.lastActivity = new Date();
    return this.save();
  }

  return Promise.resolve(this);
};

/**
 * Update message count
 */
conversationSchema.methods.incrementMessageCount = function (
  messageId: string
) {
  this.messageCount += 1;
  this.lastMessageId = messageId;
  this.lastMessageAt = new Date();
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Get active participants
 */
conversationSchema.methods.getActiveParticipants =
  function (): IConversationParticipant[] {
    return this.participants.filter(
      (p: IConversationParticipant) => p.isActive
    );
  };

/**
 * Check if user has permission
 */
conversationSchema.methods.hasPermission = function (
  userId: string,
  permission: keyof IConversationParticipant["permissions"]
): boolean {
  const participant = this.participants.find(
    (p: IConversationParticipant) => p.userId === userId && p.isActive
  );

  return participant ? participant.permissions[permission] : false;
};

/**
 * Archive conversation
 */
conversationSchema.methods.archive = function () {
  this.isArchived = true;
  this.status = ConversationStatus.ARCHIVED;
  this.lastActivity = new Date();
  return this.save();
};

/**
 * Method to update unread count for a user
 * @param userId - ID of the user to update count for
 * @param count - New unread count
 * @returns Promise with updated conversation
 */
conversationSchema.methods.updateUnreadCount = function (
  userId: string,
  count: number
): Promise<IConversation> {
  if (!this.unreadCount) {
    this.unreadCount = new Map<string, number>();
  }
  this.unreadCount.set(userId.toString(), count);
  return this.save();
};

/**
 * Method to reset unread count for a user
 * @param userId - ID of the user to reset count for
 * @returns Promise with updated conversation
 */
conversationSchema.methods.resetUnreadCount = function (
  userId: string
): Promise<IConversation> {
  if (!this.unreadCount) {
    this.unreadCount = new Map<string, number>();
  }
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

/**
 * Method to check if a user is a participant in the conversation
 * @param userId - ID of the user to check
 * @returns Boolean indicating if user is a participant
 */
conversationSchema.methods.isParticipant = function (userId: string): boolean {
  return this.participants.some(
    (participant: mongoose.Types.ObjectId) =>
      participant.toString() === userId.toString()
  );
};

// Create and export the Conversation model
export const Conversation: Model<IConversation> = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

/**
 * Mark message as delivered to a participant
 */
messageSchema.methods.markAsDelivered = function (participantId: string) {
  const delivery = this.deliveries.find(
    (d: IMessageDelivery) =>
      d.participantId === new mongoose.Types.ObjectId(participantId)
  );

  if (delivery && delivery.status === MessageStatus.SENT) {
    delivery.status = MessageStatus.DELIVERED;
    return this.save();
  }

  return Promise.resolve(this);
};

/**
 * Add translation for the message
 */
messageSchema.methods.addTranslation = function (
  language: string,
  translatedText: string
) {
  if (!this.translatedContent) {
    this.translatedContent = new Map();
  }
  this.translatedContent.set(language, translatedText);
  return this.save();
};

/**
 * Soft delete message
 */
messageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// ==================== MESSAGE THREAD SCHEMA ====================

/**
 * Message thread schema for organizing related messages
 */
const MessageThreadSchema = new Schema<IMessageThread & Document>(
  {
    conversationId: {
      type: String,
      required: true,
      ref: "Conversation",
      index: true,
    },
    parentMessageId: {
      type: String,
      required: true,
      ref: "Message",
      index: true,
    },
    title: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    messageIds: {
      type: [String],
      required: true,
      default: [],
      ref: "Message",
    },
    participantIds: {
      type: [String],
      required: true,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
    isResolved: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    resolvedBy: {
      type: String,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Thread indexes
MessageThreadSchema.index({ conversationId: 1, createdAt: -1 });
MessageThreadSchema.index({ participantIds: 1, isResolved: 1 });

// ==================== MESSAGE ANALYTICS SCHEMA ====================

/**
 * Message analytics schema
 */
const MessageAnalyticsSchema = new Schema<IMessageAnalytics & Document>(
  {
    conversationId: {
      type: String,
      required: true,
      ref: "Conversation",
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
      totalMessages: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      messagesByType: {
        type: Map,
        of: Number,
        required: true,
        default: () => new Map(),
      },
      messagesByUser: {
        type: Map,
        of: Number,
        required: true,
        default: () => new Map(),
      },
      averageResponseTime: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      activeParticipants: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      attachmentCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      attachmentsByType: {
        type: Map,
        of: Number,
        required: true,
        default: () => new Map(),
      },
    },
    kenyaMetrics: {
      swahiliMessages: {
        type: Number,
        default: 0,
        min: 0,
      },
      mpesaRelatedMessages: {
        type: Number,
        default: 0,
        min: 0,
      },
      businessHoursMessages: {
        type: Number,
        default: 0,
        min: 0,
      },
      peakHours: {
        type: Map,
        of: Number,
        default: () => new Map(),
      },
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes
MessageAnalyticsSchema.index({ conversationId: 1, date: -1 });
MessageAnalyticsSchema.index({ date: -1 });

export const MessageThread = model<IMessageThread & Document>(
  "MessageThread",
  MessageThreadSchema
);
export const MessageAnalytics = model<IMessageAnalytics & Document>(
  "MessageAnalytics",
  MessageAnalyticsSchema
);
