/**
 * Message Controller
 *
 * REST API endpoints for messaging system
 * Handles conversations, messages, and analytics
 */

import { messageService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "../../auth/auth.plugin";
import {
  addParticipantRequestSchema,
  bulkMessageRequestSchema,
  conversationListQuerySchema,
  createConversationRequestSchema,
  messageAnalyticsQuerySchema,
  messageListQuerySchema,
  sendMessageRequestSchema,
  updateConversationRequestSchema,
} from "./message.schema";

export const messageController = new Elysia({ prefix: "/messages" })
  .use(authPlugin)

  // ==================== CONVERSATION ENDPOINTS ====================

  /**
   * Create a new conversation
   * POST /messages/conversations
   */
  .post(
    "/conversations",
    async ({ body, user }) => {
      const result = await messageService.createConversation(body, user.id);
      return result;
    },
    {
      body: createConversationRequestSchema,
      detail: {
        tags: ["messages"],
        summary: "Create a new conversation",
        description: "Create a new conversation with participants",
      },
    }
  )

  /**
   * List conversations for current user
   * GET /messages/conversations
   */
  .get(
    "/conversations",
    async ({ query, user }) => {
      const result = await messageService.listConversations(user.id, query);
      return result;
    },
    {
      query: conversationListQuerySchema,
      detail: {
        tags: ["messages"],
        summary: "List user conversations",
        description: "Get paginated list of conversations for current user",
      },
    }
  )

  /**
   * Get conversation by ID
   * GET /messages/conversations/:conversationId
   */
  .get(
    "/conversations/:conversationId",
    async ({ params, user }) => {
      const result = await messageService.getConversation(
        params.conversationId,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      detail: {
        tags: ["messages"],
        summary: "Get conversation details",
        description: "Get details of a specific conversation",
      },
    }
  )

  /**
   * Update conversation
   * PATCH /messages/conversations/:conversationId
   */
  .patch(
    "/conversations/:conversationId",
    async ({ params, body, user }) => {
      const result = await messageService.updateConversation(
        params.conversationId,
        body,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      body: updateConversationRequestSchema,
      detail: {
        tags: ["messages"],
        summary: "Update conversation",
        description:
          "Update conversation title, description, status or settings",
      },
    }
  )

  /**
   * Add participant to conversation
   * POST /messages/conversations/:conversationId/participants
   */
  .post(
    "/conversations/:conversationId/participants",
    async ({ params, body, user }) => {
      const result = await messageService.addParticipant(
        params.conversationId,
        body,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      body: addParticipantRequestSchema,
      detail: {
        tags: ["messages"],
        summary: "Add participant",
        description: "Add a new participant to the conversation",
      },
    }
  )

  /**
   * Remove participant from conversation
   * DELETE /messages/conversations/:conversationId/participants/:participantId
   */
  .delete(
    "/conversations/:conversationId/participants/:participantId",
    async ({ params, user }) => {
      const result = await messageService.removeParticipant(
        params.conversationId,
        params.participantId,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
        participantId: t.String(),
      }),
      detail: {
        tags: ["messages"],
        summary: "Remove participant",
        description: "Remove a participant from the conversation",
      },
    }
  )

  /**
   * Get conversation analytics
   * GET /messages/conversations/:conversationId/analytics
   */
  .get(
    "/conversations/:conversationId/analytics",
    async ({ params, query }) => {
      const result = await messageService.getConversationAnalytics(
        params.conversationId,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      query: messageAnalyticsQuerySchema,
      detail: {
        tags: ["messages"],
        summary: "Get conversation analytics",
        description: "Get analytics for a specific conversation",
      },
    }
  )

  // ==================== MESSAGE ENDPOINTS ====================

  /**
   * Send a message
   * POST /messages
   */
  .post(
    "/",
    async ({ body, user }) => {
      const result = await messageService.sendMessage(body, user.id);
      return result;
    },
    {
      body: sendMessageRequestSchema,
      detail: {
        tags: ["messages"],
        summary: "Send a message",
        description: "Send a new message to a conversation",
      },
    }
  )

  /**
   * Get messages for conversation
   * GET /messages/:conversationId
   */
  .get(
    "/:conversationId",
    async ({ query, user, params }) => {
      const result = await messageService.getMessages(
        params.conversationId,
        query,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      query: messageListQuerySchema,
      detail: {
        tags: ["messages"],
        summary: "Get conversation messages",
        description: "Get paginated list of messages for a conversation",
      },
    }
  )

  /**
   * Mark message as read
   * PUT /messages/:messageId/read
   */
  .put(
    "/:messageId/read",
    async ({ params, user }) => {
      await messageService.markMessageAsRead(params.messageId, user.id);
      return { success: true, messageId: params.messageId };
    },
    {
      params: t.Object({
        messageId: t.String(),
      }),
      detail: {
        tags: ["messages"],
        summary: "Mark message as read",
        description: "Mark a message as read by current user",
      },
    }
  )

  /**
   * Edit message
   * PATCH /messages/:messageId
   */
  .patch(
    "/:messageId",
    async ({ params, body, user }) => {
      const result = await messageService.editMessage(
        params.messageId,
        body.content,
        user.id
      );
      return result;
    },
    {
      params: t.Object({
        messageId: t.String(),
      }),
      body: t.Object({
        content: t.String({ minLength: 1 }),
      }),
      detail: {
        tags: ["messages"],
        summary: "Edit message",
        description: "Edit message content (within 24 hours)",
      },
    }
  )

  /**
   * Delete message
   * DELETE /messages/:messageId
   */
  .delete(
    "/:messageId",
    async ({ params, user }) => {
      await messageService.deleteMessage(params.messageId, user.id);
      return { success: true, messageId: params.messageId };
    },
    {
      params: t.Object({
        messageId: t.String(),
      }),
      detail: {
        tags: ["messages"],
        summary: "Delete message",
        description: "Soft delete a message",
      },
    }
  )

  // ==================== BULK OPERATIONS ====================

  /**
   * Send bulk messages
   * POST /messages/bulk
   */
  .post(
    "/bulk",
    async ({ body, user }) => {
      const result = await messageService.sendBulkMessages(body, user.id);
      return result;
    },
    {
      body: bulkMessageRequestSchema,
      detail: {
        tags: ["messages"],
        summary: "Send bulk messages",
        description: "Send the same message to multiple conversations",
      },
    }
  )

  // ==================== ANALYTICS ENDPOINTS ====================

  /**
   * Get overall analytics
   * GET /messages/analytics
   */
  .get(
    "/analytics",
    async ({ query }) => {
      const result = await messageService.getConversationAnalytics(
        undefined,
        query.startDate ? new Date(query.startDate) : undefined,
        query.endDate ? new Date(query.endDate) : undefined
      );
      return result;
    },
    {
      query: messageAnalyticsQuerySchema,
      detail: {
        tags: ["messages"],
        summary: "Get overall analytics",
        description: "Get analytics for all conversations",
      },
    }
  );
