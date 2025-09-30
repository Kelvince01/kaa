/**
 * Message Service
 *
 * Comprehensive messaging service for Kenya rental platform
 * Handles conversations, messages, real-time communication, and analytics
 */

import { Conversation, Message, MessageAnalytics } from "@kaa/models";
import {
  type AddParticipantRequest,
  AttachmentType,
  type BulkMessageRequest,
  type ConversationAnalytics,
  type ConversationFilters,
  type ConversationListResponse,
  type ConversationResponse,
  ConversationStatus,
  ConversationType,
  type CreateConversationRequest,
  MESSAGING_CONSTANTS,
  MessageError,
  type MessageFilters,
  type MessageListResponse,
  MessagePriority,
  type MessageResponse,
  MessageStatus,
  MessageType,
  ParticipantRole,
  type SendMessageRequest,
  SocketEvent,
  type SocketMessagePayload,
  type TypingIndicatorPayload,
  type UpdateConversationRequest,
  type UserPresencePayload,
} from "@kaa/models/types";
import { Types } from "mongoose";

/**
 * Message Service Class
 */
export class MessageService {
  private readonly socketService: any; // Will be injected

  constructor(socketService?: any) {
    this.socketService = socketService;
  }

  // ==================== CONVERSATION METHODS ====================

  /**
   * Create a new conversation
   */
  async createConversation(
    request: CreateConversationRequest,
    createdBy: string
  ): Promise<ConversationResponse> {
    try {
      // Validate participants don't exceed limit
      const totalParticipants = request.participantIds.length + 1; // +1 for creator
      if (totalParticipants > MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS) {
        throw new MessageError(
          "MAX_PARTICIPANTS_EXCEEDED",
          `Maximum ${MESSAGING_CONSTANTS.LIMITS.MAX_PARTICIPANTS} participants allowed`,
          400
        );
      }

      // Check if a similar conversation already exists for property/application context
      let existingConversation: any = null;
      if (request.propertyId || request.applicationId) {
        existingConversation = await this.findExistingConversation(
          request.participantIds.concat(createdBy),
          request.propertyId,
          request.applicationId
        );
      }

      if (existingConversation) {
        return await this.getConversationResponse(
          existingConversation._id,
          createdBy
        );
      }

      // Create participants list
      const participants = [
        {
          userId: createdBy,
          role: this.determineCreatorRole(request.type),
          joinedAt: new Date(),
          isActive: true,
          permissions: this.getDefaultPermissions(ParticipantRole.ADMIN),
          isMuted: false,
        },
        ...request.participantIds.map((userId) => ({
          userId,
          role: this.determineParticipantRole(request.type),
          joinedAt: new Date(),
          isActive: true,
          permissions: this.getDefaultPermissions(
            this.determineParticipantRole(request.type)
          ),
          isMuted: false,
        })),
      ];

      // Create conversation
      const conversation = new Conversation({
        type: request.type,
        title: request.title,
        description: request.description,
        status: ConversationStatus.ACTIVE,
        participants,
        createdBy,
        propertyId: request.propertyId,
        applicationId: request.applicationId,
        messageCount: 0,
        lastActivity: new Date(),
        settings: {
          ...this.getDefaultConversationSettings(),
          ...request.settings,
        },
        metadata: {
          ...request.metadata,
          ...(await this.getKenyaContextMetadata(
            request.propertyId,
            request.applicationId
          )),
        },
        isArchived: false,
        isPinned: false,
      });

      const savedConversation = await conversation.save();

      // Emit socket event for conversation creation
      if (this.socketService) {
        this.socketService.emitToUsers(
          request.participantIds,
          SocketEvent.CONVERSATION_CREATED,
          { conversationId: savedConversation._id }
        );
      }

      return await this.getConversationResponse(
        (savedConversation._id as Types.ObjectId).toString(),
        createdBy
      );
    } catch (error) {
      throw this.handleError(error, "Failed to create conversation");
    }
  }

  /**
   * Get conversation by ID with user context
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationResponse> {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new MessageError(
          "CONVERSATION_NOT_FOUND",
          "Conversation not found",
          404
        );
      }

      // Check if user is a participant
      const participant = conversation.participants.find(
        (p) => p.userId === userId && p.isActive
      );

      if (!participant?.permissions.canRead) {
        throw new MessageError(
          "CONVERSATION_ACCESS_DENIED",
          "Access denied",
          403
        );
      }

      return await this.getConversationResponse(conversationId, userId);
    } catch (error) {
      throw this.handleError(error, "Failed to get conversation");
    }
  }

  /**
   * List conversations for user
   */
  async listConversations(
    userId: string,
    filters: ConversationFilters & { page?: number; limit?: number }
  ): Promise<ConversationListResponse> {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {
        "participants.userId": userId,
        "participants.isActive": true,
      };

      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.propertyId) query.propertyId = filters.propertyId;
      if (filters.applicationId) query.applicationId = filters.applicationId;
      if (typeof filters.isArchived === "boolean")
        query.isArchived = filters.isArchived;
      if (filters.createdAfter)
        query.createdAt = { $gte: filters.createdAfter };
      if (filters.lastActivityAfter)
        query.lastActivity = { $gte: filters.lastActivityAfter };

      // Handle search
      if (filters.search) {
        query.$or = [
          { title: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
        ];
      }

      // Execute query with pagination
      const [conversations, total] = await Promise.all([
        Conversation.find(query)
          .sort({ lastActivity: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Conversation.countDocuments(query),
      ]);

      // Transform conversations
      const conversationResponses = await Promise.all(
        conversations.map((conv) =>
          this.getConversationResponse(
            (conv._id as Types.ObjectId).toString(),
            userId
          )
        )
      );

      // Handle unread filter (post-processing since it requires message queries)
      let filteredConversations = conversationResponses;
      if (typeof filters.hasUnread === "boolean") {
        filteredConversations = conversationResponses.filter((conv) =>
          filters.hasUnread ? conv.unreadCount > 0 : conv.unreadCount === 0
        );
      }

      return {
        conversations: filteredConversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        filters,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to list conversations");
    }
  }

  /**
   * Update conversation
   */
  async updateConversation(
    conversationId: string,
    request: UpdateConversationRequest,
    userId: string
  ): Promise<ConversationResponse> {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new MessageError(
          "CONVERSATION_NOT_FOUND",
          "Conversation not found",
          404
        );
      }

      // Check permissions
      if (!conversation.hasPermission(userId, "canWrite")) {
        throw new MessageError(
          "INSUFFICIENT_PERMISSIONS",
          "Insufficient permissions",
          403
        );
      }

      // Update fields
      if (request.title !== undefined) conversation.title = request.title;
      if (request.description !== undefined)
        conversation.description = request.description;
      if (request.status !== undefined) conversation.status = request.status;
      if (request.settings) {
        conversation.settings = {
          ...conversation.settings,
          ...request.settings,
        };
      }
      if (request.metadata) {
        conversation.metadata = {
          ...conversation.metadata,
          ...request.metadata,
        };
      }

      conversation.lastActivity = new Date();
      await conversation.save();

      // Emit socket event
      if (this.socketService) {
        const activeParticipants = conversation.getActiveParticipants();
        this.socketService.emitToUsers(
          activeParticipants.map((p) => p.userId),
          SocketEvent.CONVERSATION_UPDATED,
          { conversationId: conversation._id, updatedBy: userId }
        );
      }

      return await this.getConversationResponse(conversationId, userId);
    } catch (error) {
      throw this.handleError(error, "Failed to update conversation");
    }
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    request: AddParticipantRequest,
    requesterId: string
  ): Promise<ConversationResponse> {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new MessageError(
          "CONVERSATION_NOT_FOUND",
          "Conversation not found",
          404
        );
      }

      // Check permissions
      if (!conversation.hasPermission(requesterId, "canAddParticipants")) {
        throw new MessageError(
          "INSUFFICIENT_PERMISSIONS",
          "Cannot add participants",
          403
        );
      }

      // Add participant
      await conversation.addParticipant(
        request.userId,
        request.role,
        request.permissions
      );

      // Send system message about participant addition
      await this.sendSystemMessage(
        conversationId,
        "User has been added to the conversation",
        { addedUserId: request.userId, addedBy: requesterId }
      );

      // Emit socket events
      if (this.socketService) {
        const activeParticipants = conversation.getActiveParticipants();
        this.socketService.emitToUsers(
          activeParticipants.map((p) => p.userId),
          SocketEvent.CONVERSATION_UPDATED,
          { conversationId: conversation._id, participantAdded: request.userId }
        );

        // Notify the new participant
        this.socketService.emitToUsers(
          [request.userId],
          SocketEvent.CONVERSATION_CREATED,
          { conversationId: conversation._id }
        );
      }

      return await this.getConversationResponse(conversationId, requesterId);
    } catch (error) {
      throw this.handleError(error, "Failed to add participant");
    }
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(
    conversationId: string,
    participantId: string,
    requesterId: string
  ): Promise<ConversationResponse> {
    try {
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        throw new MessageError(
          "CONVERSATION_NOT_FOUND",
          "Conversation not found",
          404
        );
      }

      // Check permissions (can remove self or have remove permission)
      const canRemove =
        requesterId === participantId ||
        conversation.hasPermission(requesterId, "canRemoveParticipants");

      if (!canRemove) {
        throw new MessageError(
          "INSUFFICIENT_PERMISSIONS",
          "Cannot remove participant",
          403
        );
      }

      await conversation.removeParticipant(participantId);

      // Send system message
      await this.sendSystemMessage(
        conversationId,
        participantId === requesterId
          ? "User left the conversation"
          : "User was removed from the conversation",
        { removedUserId: participantId, removedBy: requesterId }
      );

      // Emit socket events
      if (this.socketService) {
        const activeParticipants = conversation.getActiveParticipants();
        this.socketService.emitToUsers(
          activeParticipants.map((p) => p.userId),
          SocketEvent.CONVERSATION_UPDATED,
          {
            conversationId: conversation._id,
            participantRemoved: participantId,
          }
        );

        // Notify removed participant
        this.socketService.emitToUsers(
          [participantId],
          SocketEvent.CONVERSATION_DELETED,
          { conversationId: conversation._id }
        );
      }

      return await this.getConversationResponse(conversationId, requesterId);
    } catch (error) {
      throw this.handleError(error, "Failed to remove participant");
    }
  }

  // ==================== MESSAGE METHODS ====================

  /**
   * Send a message
   */
  async sendMessage(
    request: SendMessageRequest,
    senderId: string
  ): Promise<MessageResponse> {
    try {
      const conversation = await Conversation.findById(request.conversationId);

      if (!conversation) {
        throw new MessageError(
          "CONVERSATION_NOT_FOUND",
          "Conversation not found",
          404
        );
      }

      // Check permissions
      const participant = conversation.participants.find(
        (p) => p.userId === senderId && p.isActive
      );

      if (!participant?.permissions.canWrite) {
        throw new MessageError(
          "INSUFFICIENT_PERMISSIONS",
          "Cannot send messages",
          403
        );
      }

      if (
        participant.isMuted &&
        (participant.mutedUntil || new Date()) > new Date()
      ) {
        throw new MessageError(
          "CONVERSATION_MUTED",
          "You are muted in this conversation",
          403
        );
      }

      // Check business hours if required
      if (
        conversation.settings.businessHoursOnly &&
        !this.isKenyanBusinessHours()
      ) {
        throw new MessageError(
          "RATE_LIMIT_EXCEEDED",
          "Messages can only be sent during business hours",
          429
        );
      }

      // Create message deliveries for all active participants except sender
      const activeParticipants = conversation.getActiveParticipants();
      const deliveries = activeParticipants
        .filter((p) => p.userId !== senderId)
        .map((p) => ({
          participantId: p.userId,
          status: MessageStatus.SENT,
          timestamp: new Date(),
        }));

      // Create message
      const message = new Message({
        conversationId: request.conversationId,
        senderId,
        type: request.type || MessageType.TEXT,
        content: request.content,
        attachments: request.attachments
          ? await this.processAttachments(request.attachments)
          : [],
        replyToMessageId: request.replyToMessageId,
        status: MessageStatus.SENT,
        priority: request.priority || MessagePriority.NORMAL,
        deliveries,
        metadata: request.metadata || {},
        sentAt: new Date(),
        isEdited: false,
        isDeleted: false,
        isPinned: false,
      });

      // Auto-translate if enabled
      if (request.autoTranslate || conversation.settings.autoTranslate) {
        await this.addTranslation(
          message,
          conversation.settings.defaultLanguage
        );
      }

      const savedMessage = await message.save();

      // Update conversation
      await conversation.incrementMessageCount(
        (savedMessage._id as Types.ObjectId).toString()
      );

      // Emit socket event for real-time delivery
      if (this.socketService) {
        const messagePayload: SocketMessagePayload = {
          conversationId: request.conversationId,
          message: savedMessage,
          sender: await this.getUserInfo(senderId),
          timestamp: new Date(),
        };

        this.socketService.emitToConversation(
          request.conversationId,
          SocketEvent.MESSAGE_SENT,
          messagePayload
        );
      }

      // Process message in background (notifications, analytics, etc.)
      this.processMessageInBackground(savedMessage, conversation).catch(
        console.error
      );

      return await this.getMessageResponse(
        (savedMessage._id as Types.ObjectId).toString(),
        senderId
      );
    } catch (error) {
      throw this.handleError(error, "Failed to send message");
    }
  }

  /**
   * Get messages for conversation
   */
  async getMessages(
    conversationId: string,
    filters: MessageFilters & { page?: number; limit?: number },
    userId: string
  ): Promise<MessageListResponse> {
    try {
      // Check conversation access
      const conversation = await Conversation.findById(conversationId);
      if (!conversation?.hasPermission(userId, "canRead")) {
        throw new MessageError(
          "CONVERSATION_ACCESS_DENIED",
          "Access denied",
          403
        );
      }

      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 50, 100);
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {
        conversationId,
        isDeleted: filters.isDeleted,
      };

      if (filters.senderId) query.senderId = filters.senderId;
      if (filters.type) query.type = filters.type;
      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      if (typeof filters.hasAttachments === "boolean") {
        query["attachments.0"] = { $exists: filters.hasAttachments };
      }
      if (filters.dateFrom || filters.dateTo) {
        query.sentAt = {};
        if (filters.dateFrom) query.sentAt.$gte = filters.dateFrom;
        if (filters.dateTo) query.sentAt.$lte = filters.dateTo;
      }

      // Handle search
      if (filters.search) {
        query.$text = { $search: filters.search };
      }

      // Execute query
      const [messages, total] = await Promise.all([
        Message.find(query).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
        Message.countDocuments(query),
      ]);

      // Transform messages
      const messageResponses = await Promise.all(
        messages.map((msg) =>
          this.getMessageResponse(
            (msg._id as Types.ObjectId).toString(),
            userId
          )
        )
      );

      return {
        messages: messageResponses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        conversation: {
          _id: (conversation._id as Types.ObjectId).toString(),
          title: conversation.title,
          type: conversation.type,
          participants: conversation.getActiveParticipants().length,
        },
        filters,
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get messages");
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new MessageError("MESSAGE_NOT_FOUND", "Message not found", 404);
      }

      await message.markAsRead(userId);

      // Emit socket event
      if (this.socketService) {
        this.socketService.emitToConversation(
          message.conversationId,
          SocketEvent.MESSAGE_READ,
          { messageId, userId, readAt: new Date() }
        );
      }
    } catch (error) {
      throw this.handleError(error, "Failed to mark message as read");
    }
  }

  /**
   * Edit message
   */
  async editMessage(
    messageId: string,
    content: string,
    userId: string
  ): Promise<MessageResponse> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new MessageError("MESSAGE_NOT_FOUND", "Message not found", 404);
      }

      if (message.senderId !== new Types.ObjectId(userId)) {
        throw new MessageError(
          "MESSAGE_EDIT_NOT_ALLOWED",
          "Can only edit own messages",
          403
        );
      }

      // Check if message is too old to edit (24 hours)
      const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - message.sentAt.getTime() > editTimeLimit) {
        throw new MessageError(
          "MESSAGE_EDIT_NOT_ALLOWED",
          "Message too old to edit",
          403
        );
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();

      await message.save();

      // Emit socket event
      if (this.socketService) {
        this.socketService.emitToConversation(
          message.conversationId,
          SocketEvent.MESSAGE_EDITED,
          { messageId, newContent: content, editedAt: message.editedAt }
        );
      }

      return await this.getMessageResponse(messageId, userId);
    } catch (error) {
      throw this.handleError(error, "Failed to edit message");
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw new MessageError("MESSAGE_NOT_FOUND", "Message not found", 404);
      }

      // Check permissions
      const conversation = await Conversation.findById(message.conversationId);
      const canDelete =
        message.senderId === new Types.ObjectId(userId) ||
        conversation?.hasPermission(userId, "canDeleteMessages");

      if (!canDelete) {
        throw new MessageError(
          "MESSAGE_DELETE_NOT_ALLOWED",
          "Cannot delete message",
          403
        );
      }

      await message.softDelete();

      // Emit socket event
      if (this.socketService) {
        this.socketService.emitToConversation(
          message.conversationId,
          SocketEvent.MESSAGE_DELETED,
          { messageId, deletedBy: userId, deletedAt: new Date() }
        );
      }
    } catch (error) {
      throw this.handleError(error, "Failed to delete message");
    }
  }

  // ==================== REAL-TIME METHODS ====================

  /**
   * Handle typing indicator
   */
  async handleTyping(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    if (!this.socketService) return;

    const payload: TypingIndicatorPayload = {
      conversationId,
      userId,
      userName,
      isTyping,
    };

    await this.socketService.emitToConversation(
      conversationId,
      isTyping ? SocketEvent.TYPING_START : SocketEvent.TYPING_STOP,
      payload
    );
  }

  /**
   * Handle user presence
   */
  async handleUserPresence(
    userId: string,
    isOnline: boolean,
    conversationIds?: string[]
  ): Promise<void> {
    if (!this.socketService) return;

    const payload: UserPresencePayload = {
      userId,
      isOnline,
      lastSeen: isOnline ? undefined : new Date(),
      conversationIds,
    };

    // Emit to all user's conversations

    if (conversationIds) {
      for (const conversationId of conversationIds) {
        await this.socketService.emitToConversation(
          conversationId,
          isOnline ? SocketEvent.USER_ONLINE : SocketEvent.USER_OFFLINE,
          payload
        );
      }
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Send bulk messages
   */
  async sendBulkMessages(
    request: BulkMessageRequest,
    senderId: string
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ conversationId: string; error: string }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ conversationId: string; error: string }>,
    };

    for (const conversationId of request.conversationIds) {
      try {
        await this.sendMessage(
          {
            conversationId,
            content: request.content,
            type: request.type,
            priority: request.priority,
            metadata: request.metadata,
          },
          senderId
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          conversationId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(
    conversationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConversationAnalytics> {
    try {
      const dateFilter =
        startDate && endDate
          ? { createdAt: { $gte: startDate, $lte: endDate } }
          : {};

      const conversationFilter = conversationId ? { _id: conversationId } : {};

      const [
        totalConversations,
        activeConversations,
        conversationStats,
        messageStats,
      ] = await Promise.all([
        Conversation.countDocuments({ ...conversationFilter, ...dateFilter }),
        Conversation.countDocuments({
          ...conversationFilter,
          ...dateFilter,
          status: ConversationStatus.ACTIVE,
        }),
        Conversation.aggregate([
          { $match: { ...conversationFilter, ...dateFilter } },
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
              avgParticipants: { $avg: { $size: "$participants" } },
              avgMessages: { $avg: "$messageCount" },
            },
          },
        ]),
        Message.aggregate([
          { $match: { ...dateFilter } },
          {
            $group: {
              _id: "$senderId",
              messageCount: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              avgMessagesPerUser: { $avg: "$messageCount" },
            },
          },
        ]),
      ]);

      // Process results
      const conversationsByType: Record<string, number> = {};
      let totalParticipants = 0;
      let totalMessages = 0;

      for (const stat of conversationStats) {
        conversationsByType[stat._id] = stat.count;
        totalParticipants += stat.avgParticipants * stat.count;
        totalMessages += stat.avgMessages * stat.count;
      }

      const averageParticipants =
        totalConversations > 0 ? totalParticipants / totalConversations : 0;
      const averageMessageCount =
        totalConversations > 0 ? totalMessages / totalConversations : 0;

      return {
        totalConversations,
        activeConversations,
        conversationsByType,
        averageParticipants,
        averageMessageCount,
        responseTimeMetrics: await this.calculateResponseTimeMetrics(
          conversationId,
          startDate,
          endDate
        ),
        engagementMetrics: {
          dailyActiveUsers: messageStats[0]?.totalUsers || 0,
          messagesPerUser: messageStats[0]?.avgMessagesPerUser || 0,
          conversationsPerUser: 0, // Would need user data to calculate
        },
      };
    } catch (error) {
      throw this.handleError(error, "Failed to get conversation analytics");
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Find existing conversation for context
   */
  private async findExistingConversation(
    participantIds: string[],
    propertyId?: string,
    applicationId?: string
  ): Promise<any> {
    const query: any = {
      $and: [
        { "participants.userId": { $all: participantIds } },
        { "participants.isActive": true },
      ],
    };

    if (propertyId) query.propertyId = propertyId;
    if (applicationId) query.applicationId = applicationId;

    return await Conversation.findOne(query);
  }

  /**
   * Determine creator role based on conversation type
   */
  private determineCreatorRole(type: ConversationType): ParticipantRole {
    switch (type) {
      case ConversationType.SUPPORT:
        return ParticipantRole.SUPPORT;
      case ConversationType.PROPERTY_THREAD:
        return ParticipantRole.LANDLORD;
      case ConversationType.SYSTEM:
        return ParticipantRole.SYSTEM;
      default:
        return ParticipantRole.ADMIN;
    }
  }

  /**
   * Determine participant role based on conversation type
   */
  private determineParticipantRole(type: ConversationType): ParticipantRole {
    switch (type) {
      case ConversationType.SUPPORT:
        return ParticipantRole.TENANT;
      case ConversationType.PROPERTY_THREAD:
      case ConversationType.APPLICATION_THREAD:
        return ParticipantRole.TENANT;
      default:
        return ParticipantRole.TENANT;
    }
  }

  /**
   * Get default permissions for role
   */
  private getDefaultPermissions(role: ParticipantRole) {
    return {
      canRead: true,
      canWrite: true,
      canAddParticipants:
        role === ParticipantRole.ADMIN || role === ParticipantRole.LANDLORD,
      canRemoveParticipants: role === ParticipantRole.ADMIN,
      canDeleteMessages: role === ParticipantRole.ADMIN,
      canPinMessages:
        role === ParticipantRole.ADMIN || role === ParticipantRole.LANDLORD,
    };
  }

  /**
   * Get default conversation settings
   */
  private getDefaultConversationSettings() {
    return {
      allowFileSharing: true,
      allowImageSharing: true,
      maxFileSize: MESSAGING_CONSTANTS.FILE_LIMITS.DOCUMENT_MAX_SIZE,
      allowedFileTypes: Object.values(AttachmentType),
      autoTranslate: false,
      defaultLanguage: "en" as const,
      businessHoursOnly: false,
      retentionDays: MESSAGING_CONSTANTS.LIMITS.MESSAGE_RETENTION_DAYS,
    };
  }

  /**
   * Get Kenya context metadata
   */
  private getKenyaContextMetadata(
    _propertyId?: string,
    _applicationId?: string
  ) {
    const metadata: any = {
      timezone: MESSAGING_CONSTANTS.BUSINESS_HOURS.TIMEZONE,
    };

    // In a real app, you would fetch property/application data here
    // and extract county, city, etc.

    return metadata;
  }

  /**
   * Check if current time is within Kenyan business hours
   */
  private isKenyanBusinessHours(): boolean {
    const now = new Date();
    const nairobiTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: MESSAGING_CONSTANTS.BUSINESS_HOURS.TIMEZONE,
      })
    );

    const hour = nairobiTime.getHours();
    const isWeekend = nairobiTime.getDay() === 0 || nairobiTime.getDay() === 6;

    return (
      !isWeekend &&
      hour >= MESSAGING_CONSTANTS.BUSINESS_HOURS.START &&
      hour < MESSAGING_CONSTANTS.BUSINESS_HOURS.END
    );
  }

  /**
   * Process attachments (placeholder - would integrate with file service)
   */
  private async processAttachments(_attachments: any[]): Promise<any[]> {
    // This would integrate with your file upload service
    // For now, returning empty array
    return await Promise.resolve([]);
  }

  /**
   * Add translation to message
   */
  private async addTranslation(
    message: any,
    defaultLanguage: string
  ): Promise<void> {
    // This would integrate with translation service (e.g., Google Translate)
    // For Kenya, we'd primarily translate between English and Swahili

    if (defaultLanguage === "sw") {
      // Translate to English
      // message.addTranslation('en', translatedText);
      await Promise.resolve(message);
    } else {
      // Translate to Swahili
      // message.addTranslation('sw', translatedText);
    }
  }

  /**
   * Send system message
   */
  private async sendSystemMessage(
    conversationId: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    const systemMessage = new Message({
      conversationId,
      senderId: "system",
      type: MessageType.SYSTEM,
      content,
      status: MessageStatus.DELIVERED,
      priority: MessagePriority.LOW,
      deliveries: [],
      metadata: metadata || {},
      sentAt: new Date(),
    });

    await systemMessage.save();

    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      await conversation.incrementMessageCount(
        (systemMessage._id as Types.ObjectId).toString()
      );
    }
  }

  /**
   * Process message in background
   */
  private async processMessageInBackground(
    message: any,
    conversation: any
  ): Promise<void> {
    try {
      // Update analytics
      await this.updateMessageAnalytics(message, conversation);

      // Send notifications if needed
      if (
        message.priority === MessagePriority.HIGH ||
        message.priority === MessagePriority.URGENT
      ) {
        // Send push notifications, SMS, etc.
      }

      // Process for Kenya-specific features
      if (this.containsKenyaKeywords(message.content)) {
        // Handle M-Pesa references, Swahili content, etc.
      }
    } catch (error) {
      console.error("Background message processing failed:", error);
    }
  }

  /**
   * Update message analytics
   */
  private async updateMessageAnalytics(
    message: any,
    _conversation: any
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await MessageAnalytics.findOneAndUpdate(
      { conversationId: message.conversationId, date: today },
      {
        $inc: {
          "metrics.totalMessages": 1,
          [`metrics.messagesByType.${message.type}`]: 1,
          [`metrics.messagesByUser.${message.senderId}`]: 1,
          "metrics.attachmentCount": message.attachments.length,
        },
      },
      { upsert: true, new: true }
    );

    // Update Kenya-specific metrics
    if (this.isSwahiliContent(message.content)) {
      analytics.kenyaMetrics = analytics.kenyaMetrics || {
        swahiliMessages: 0,
        mpesaRelatedMessages: 0,
        businessHoursMessages: 0,
        peakHours: {},
      };
      analytics.kenyaMetrics.swahiliMessages =
        (analytics.kenyaMetrics.swahiliMessages || 0) + 1;
    }

    if (this.containsMpesaReferences(message.content)) {
      analytics.kenyaMetrics = analytics.kenyaMetrics || {
        swahiliMessages: 0,
        mpesaRelatedMessages: 0,
        businessHoursMessages: 0,
        peakHours: {},
      };
      analytics.kenyaMetrics.mpesaRelatedMessages =
        (analytics.kenyaMetrics.mpesaRelatedMessages || 0) + 1;
    }

    if (this.isKenyanBusinessHours()) {
      analytics.kenyaMetrics = analytics.kenyaMetrics || {
        swahiliMessages: 0,
        mpesaRelatedMessages: 0,
        businessHoursMessages: 0,
        peakHours: {},
      };
      analytics.kenyaMetrics.businessHoursMessages =
        (analytics.kenyaMetrics.businessHoursMessages || 0) + 1;
    }

    await analytics.save();
  }

  /**
   * Check for Kenya-specific keywords
   */
  private containsKenyaKeywords(content: string): boolean {
    const kenyaKeywords = [
      "mpesa",
      "m-pesa",
      "paybill",
      "lipa",
      "pesa",
      "shilling",
      "ksh",
    ];
    const lowerContent = content.toLowerCase();
    return kenyaKeywords.some((keyword) => lowerContent.includes(keyword));
  }

  /**
   * Check if content is in Swahili
   */
  private isSwahiliContent(content: string): boolean {
    const swahiliWords = [
      "hujambo",
      "asante",
      "karibu",
      "sawa",
      "tafadhali",
      "habari",
      "sasa",
    ];
    const lowerContent = content.toLowerCase();
    return swahiliWords.some((word) => lowerContent.includes(word));
  }

  /**
   * Check for M-Pesa references
   */
  private containsMpesaReferences(content: string): boolean {
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const mpesaPattern = /m[-\s]?pesa|paybill|lipa\s+na\s+m[-\s]?pesa/i;
    return mpesaPattern.test(content);
  }

  /**
   * Calculate response time metrics
   */
  private async calculateResponseTimeMetrics(
    _conversationId?: string,
    _startDate?: Date,
    _endDate?: Date
  ): Promise<{ average: number; p50: number; p90: number; p99: number }> {
    // This would involve complex aggregation to calculate response times
    // between messages from different users
    return await Promise.resolve({
      average: 0,
      p50: 0,
      p90: 0,
      p99: 0,
    });
  }

  /**
   * Get user info (placeholder)
   */
  private async getUserInfo(userId: string): Promise<any> {
    // This would fetch user data from user service
    return await Promise.resolve({
      _id: userId,
      firstName: "User",
      lastName: "Name",
      avatar: undefined,
    });
  }

  /**
   * Get conversation response with user context
   */
  private async getConversationResponse(
    conversationId: string,
    userId: string
  ): Promise<ConversationResponse> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new MessageError(
        "CONVERSATION_NOT_FOUND",
        "Conversation not found",
        404
      );
    }

    // Get last message
    const lastMessage = conversation.lastMessageId
      ? await this.getMessageResponse(
          conversation.lastMessageId.toString(),
          userId
        )
      : undefined;

    // Calculate unread count
    const participant = conversation.participants.find(
      (p) => p.userId === userId
    );
    let unreadCount = 0;

    if (participant?.lastReadMessageId) {
      unreadCount = await Message.countDocuments({
        conversationId,
        _id: { $gt: participant.lastReadMessageId },
        senderId: { $ne: userId },
        isDeleted: false,
      });
    } else {
      unreadCount = await Message.countDocuments({
        conversationId,
        senderId: { $ne: userId },
        isDeleted: false,
      });
    }

    // Get participant info
    const participants = await Promise.all(
      conversation.getActiveParticipants().map(async (p) => ({
        user: await this.getUserInfo(p.userId),
        role: p.role,
        isOnline: false, // Would check from presence service
        lastSeen: undefined, // Would get from presence service
      }))
    );

    return {
      conversation: conversation.toObject(),
      participants,
      lastMessage,
      unreadCount,
      canWrite: participant?.permissions.canWrite as boolean,
      canAddParticipants: participant?.permissions
        .canAddParticipants as boolean,
    };
  }

  /**
   * Get message response with user context
   */
  private async getMessageResponse(
    messageId: string,
    userId: string
  ): Promise<MessageResponse> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new MessageError("MESSAGE_NOT_FOUND", "Message not found", 404);
    }

    const sender = await this.getUserInfo(message.senderId.toString());
    const conversation = await Conversation.findById(message.conversationId);

    const delivery = message.deliveries.find(
      (d) => d.participantId === new Types.ObjectId(userId)
    );

    return {
      message: message.toObject(),
      sender: {
        ...sender,
        role:
          conversation?.participants.find(
            (p) => p.userId === message.senderId.toString()
          )?.role || ParticipantRole.TENANT,
      },
      conversation: {
        _id: (conversation?._id as Types.ObjectId).toString(),
        title: conversation?.title,
        type: conversation?.type as ConversationType,
      },
      isDelivered:
        delivery?.status === MessageStatus.DELIVERED ||
        delivery?.status === MessageStatus.READ,
      isRead: delivery?.status === MessageStatus.READ,
      canEdit: message.senderId === new Types.ObjectId(userId),
      canDelete:
        message.senderId === new Types.ObjectId(userId) ||
        (conversation?.hasPermission(userId, "canDeleteMessages") as boolean),
    };
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof MessageError) {
      return error;
    }

    if (error.name === "ValidationError") {
      return new MessageError("VALIDATION_ERROR", error.message, 400);
    }

    if (error.name === "CastError") {
      return new MessageError("INVALID_ID", "Invalid ID format", 400);
    }

    console.error(defaultMessage, error);
    return new MessageError("INTERNAL_ERROR", defaultMessage, 500);
  }
}

export const messageService = new MessageService();
