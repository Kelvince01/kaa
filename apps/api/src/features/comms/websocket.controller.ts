/**
 * WebSocket Controller for Elysia
 *
 * Handles WebSocket connections for real-time messaging
 */

import { SocketEvent } from "@kaa/models/types";
import { messageService, socketService } from "@kaa/services";
import type { ServerWebSocket } from "bun";
import { Elysia, t } from "elysia";

/**
 * WebSocket message types
 */
const WebSocketMessageSchema = t.Object({
  event: t.String(),
  payload: t.Any(),
});

/**
 * WebSocket data attached to each connection
 */
type WebSocketData = {
  userId: string;
  userName?: string;
  connectedAt: Date;
};

/**
 * WebSocket Controller
 */
export const websocketController = new Elysia({ prefix: "/ws" })
  .ws("/chat", {
    // Body validation schema
    body: WebSocketMessageSchema,

    // Query parameters for authentication
    query: t.Object({
      token: t.Optional(t.String()),
      userId: t.String(),
      userName: t.Optional(t.String()),
    }),

    // WebSocket lifecycle handlers
    open(ws) {
      // : ServerWebSocket<WebSocketData>
      const { userId, userName, connectedAt } =
        ws.data as unknown as WebSocketData;

      // Register connection with socket service
      socketService.addConnection(
        ws as unknown as ServerWebSocket<any>,
        userId,
        userName,
        {
          connectedAt,
        }
      );

      // Send welcome message
      socketService.emitToConnection(
        ws as unknown as ServerWebSocket<any>,
        SocketEvent.CONNECT,
        {
          type: "connection_established",
          message: "Connected to messaging service",
          userId,
          timestamp: new Date().toISOString(),
        }
      );

      // Send online users list
      socketService.emitToConnection(
        ws as unknown as ServerWebSocket<any>,
        SocketEvent.CONNECT,
        {
          type: "online_users",
          users: socketService.getOnlineUsers(),
        }
      );
    },

    message(ws, message: any) {
      // : ServerWebSocket<WebSocketData>
      const { userId, userName } = ws.data as unknown as WebSocketData;

      // Update user activity
      socketService.updateUserActivity(userId);

      // Handle different event types
      handleWebSocketMessage(
        ws as unknown as ServerWebSocket<any>,
        userId,
        userName || "User",
        message
      ).catch((error) => {
        console.error("WebSocket message handler error:", error);
        socketService.emitToConnection(
          ws as unknown as ServerWebSocket<any>,
          SocketEvent.ERROR,
          {
            error: error.message || "Failed to process message",
            originalEvent: message.event,
          }
        );
      });
    },

    close(ws) {
      // : ServerWebSocket<WebSocketData>
      const { userId } = ws.data as unknown as WebSocketData;
      socketService.removeConnection(
        ws as unknown as ServerWebSocket<any>,
        userId
      );
    },

    // error(ws, error) { // : ServerWebSocket<WebSocketData>
    //   console.error("WebSocket error:", error);
    //   socketService.emitToConnection(ws as unknown as ServerWebSocket<any>, SocketEvent.ERROR, {
    //     error: error.message,
    //   });
    // },

    // Parse incoming messages
    beforeHandle({ query, set }: { query: any; set: any }) {
      const { userId, userName, token } = query;

      // TODO: Implement proper token validation
      if (token && !validateToken(token, userId)) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      // Attach user data to WebSocket connection
      return {
        userId,
        userName: userName || "User",
        connectedAt: new Date(),
      };
    },
  })

  // Health check endpoint
  .get("/health", () => ({
    status: "ok",
    statistics: socketService.getStatistics(),
    timestamp: new Date().toISOString(),
  }))

  // Get online users
  .get("/online", () => ({
    users: socketService.getOnlineUsers(),
    count: socketService.getOnlineUsers().length,
  }))

  // Get conversation participants
  .get(
    "/conversation/:conversationId/participants",
    ({ params }: { params: any }) => ({
      conversationId: params.conversationId,
      count: socketService.getConversationParticipantsCount(
        params.conversationId
      ),
    })
  )

  // Get typing users in a conversation
  .get(
    "/conversation/:conversationId/typing",
    ({ params }: { params: any }) => ({
      conversationId: params.conversationId,
      users: socketService.getTypingUsers(params.conversationId),
    })
  );

/**
 * Handle incoming WebSocket messages
 */
async function handleWebSocketMessage(
  ws: ServerWebSocket<WebSocketData>,
  userId: string,
  userName: string,
  message: { event: string; payload: any }
): Promise<void> {
  const { event, payload } = message;

  switch (event) {
    // Join conversation
    case "join_conversation":
      handleJoinConversation(userId, payload);
      break;

    // Leave conversation
    case "leave_conversation":
      handleLeaveConversation(userId, payload);
      break;

    // Typing indicator
    case "typing_start":
    case "typing_stop": {
      const isTyping = event === "typing_start";
      await handleTypingIndicator(userId, userName, payload, isTyping);
      break;
    }

    // Mark message as read
    case "mark_read":
      await handleMarkRead(userId, payload);
      break;

    // Send message (direct WebSocket message sending)
    case "send_message":
      await handleSendMessage(userId, payload);
      break;

    // Ping/Pong for connection keep-alive
    case "ping":
      socketService.emitToConnection(ws, SocketEvent.CONNECT, {
        type: "pong",
        timestamp: new Date().toISOString(),
      });
      break;

    // Request user presence
    case "request_presence":
      handleRequestPresence(ws, payload);
      break;

    // Update user status
    case "update_status":
      handleUpdateStatus(userId, payload);
      break;

    default:
      socketService.emitToConnection(ws, SocketEvent.ERROR, {
        error: `Unknown event type: ${event}`,
      });
  }
}

/**
 * Handle join conversation event
 */
function handleJoinConversation(
  userId: string,
  payload: { conversationId: string }
): void {
  const { conversationId } = payload;

  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  socketService.joinConversation(userId, conversationId);

  // Notify user they joined successfully
  socketService.emitToUsers([userId], SocketEvent.JOIN_CONVERSATION, {
    type: "conversation_joined",
    conversationId,
  });

  // Notify other participants
  socketService
    .emitToConversation(conversationId, SocketEvent.USER_ONLINE, {
      userId,
      conversationId,
      timestamp: new Date().toISOString(),
    })
    .catch(console.error);
}

/**
 * Handle leave conversation event
 */
function handleLeaveConversation(
  userId: string,
  payload: { conversationId: string }
): void {
  const { conversationId } = payload;

  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  socketService.leaveConversation(userId, conversationId);

  // Notify user they left
  socketService.emitToUsers([userId], SocketEvent.LEAVE_CONVERSATION, {
    type: "conversation_left",
    conversationId,
  });
}

/**
 * Handle typing indicator
 */
async function handleTypingIndicator(
  userId: string,
  userName: string,
  payload: { conversationId: string },
  isTyping: boolean
): Promise<void> {
  const { conversationId } = payload;

  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  await socketService.handleTypingIndicator(
    conversationId,
    userId,
    userName,
    isTyping
  );
}

/**
 * Handle mark message as read
 */
async function handleMarkRead(
  userId: string,
  payload: { messageId: string }
): Promise<void> {
  const { messageId } = payload;

  if (!messageId) {
    throw new Error("messageId is required");
  }

  await messageService.markMessageAsRead(messageId, userId);
}

/**
 * Handle send message via WebSocket
 */
async function handleSendMessage(
  userId: string,
  payload: {
    conversationId: string;
    content: string;
    type?: string;
    replyToMessageId?: string;
    attachments?: any[];
    metadata?: any;
  }
): Promise<void> {
  const {
    conversationId,
    content,
    type,
    replyToMessageId,
    attachments,
    metadata,
  } = payload;

  if (!conversationId) {
    throw new Error("conversationId is required");
  }

  if (!content) {
    throw new Error("content is required");
  }

  await messageService.sendMessage(
    {
      conversationId,
      content,
      type: type as any,
      replyToMessageId,
      attachments,
      metadata,
    },
    userId
  );
}

/**
 * Handle request presence
 */
function handleRequestPresence(
  ws: ServerWebSocket<WebSocketData>,
  payload: { userIds?: string[] }
): void {
  const userIds = payload.userIds || socketService.getOnlineUsers();

  const presenceData = userIds.map((userId: string) => ({
    userId,
    ...socketService.getUserPresence(userId),
  }));

  socketService.emitToConnection(ws, SocketEvent.CONNECT, {
    type: "presence_data",
    users: presenceData,
  });
}

/**
 * Handle update user status
 */
function handleUpdateStatus(
  userId: string,
  payload: { status?: string; customMessage?: string }
): void {
  // This would update user status in the database
  // For now, just broadcast the status update
  socketService.emitToUsers([userId], SocketEvent.CONNECT, {
    type: "status_updated",
    userId,
    status: payload.status,
    customMessage: payload.customMessage,
  });
}

/**
 * Validate authentication token (placeholder)
 */
function validateToken(_token: string, _userId: string): boolean {
  // TODO: Implement actual token validation
  // - Verify JWT token
  // - Check if userId matches token
  // - Validate token expiration
  return true;
}

export default websocketController;
