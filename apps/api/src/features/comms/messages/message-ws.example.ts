/**
 * WebSocket Integration Example
 *
 * Shows how to integrate the WebSocket controller into your Elysia app
 */

import { AttachmentType, MessageType } from "@kaa/models/types";
import { messageService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { messageWSController } from "./message-ws.controller";

/**
 * Example Elysia app with WebSocket support
 */
export const createWebSocketApp = () => {
  const app = new Elysia()
    // Use the WebSocket controller
    .use(messageWSController)

    // Add other routes and middleware
    .get("/", () => ({
      message: "Messaging API with WebSocket support",
      websocket: "/chat/ws",
      health: "/chat/ws/health",
    }))

    // Example: Send message via HTTP (will be broadcast via WebSocket)
    .post(
      "/messages",
      async ({ body, headers }) => {
        // Extract user ID from auth headers
        const userId = headers.authorization?.split(" ")[1] || "user-id";

        const result = await messageService.sendMessage(
          {
            conversationId: body.conversationId,
            content: body.content,
            type: body.type,
            replyToMessageId: body.replyToMessageId,
            attachments: body.attachments,
            metadata: body.metadata,
          },
          userId
        );

        return result;
      },
      {
        body: t.Object({
          conversationId: t.String(),
          content: t.String(),
          type: t.Enum(MessageType),
          replyToMessageId: t.String(),
          attachments: t.Array(
            t.Object({
              file: t.Any(),
              type: t.Enum(AttachmentType),
            })
          ),
          metadata: t.Object({
            userId: t.String(),
            userName: t.String(),
          }),
        }),
      }
    )

    // Example: Get messages (HTTP)
    .get(
      "/conversations/:conversationId/messages",
      async ({ params, query, headers }) => {
        const userId = headers.authorization?.split(" ")[1] || "user-id";

        const result = await messageService.getMessages(
          params.conversationId,
          {
            page: Number(query.page) || 1,
            limit: Number(query.limit) || 50,
            search: query.search,
            senderId: query.senderId,
            type: query.type as any,
            dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
            dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
          },
          userId
        );

        return result;
      }
    )

    .listen(3000);

  return app;
};

/**
 * Client-side WebSocket connection example
 */
export const createWebSocketClient = (userId: string, userName: string) => {
  const ws = new WebSocket(
    `ws://localhost:3000/chat/ws?userId=${userId}&userName=${encodeURIComponent(userName)}`
  );

  ws.onopen = () => {
    console.log("Connected to WebSocket");

    // Join a conversation
    ws.send(
      JSON.stringify({
        event: "join_conversation",
        payload: {
          conversationId: "conv-123",
        },
      })
    );
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("Received:", data);

    switch (data.event) {
      case "message_sent":
        console.log("New message:", data.payload);
        break;

      case "typing_start":
        console.log("User is typing:", data.payload.userName);
        break;

      case "typing_stop":
        console.log("User stopped typing:", data.payload.userName);
        break;

      case "user_online":
        console.log("User came online:", data.payload.userId);
        break;

      case "user_offline":
        console.log("User went offline:", data.payload.userId);
        break;

      case "message_read":
        console.log("Message read:", data.payload.messageId);
        break;

      default:
        console.log("Unknown event:", data.event);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
  };

  // Helper functions
  return {
    ws,

    // Send a message
    sendMessage: (conversationId: string, content: string) => {
      ws.send(
        JSON.stringify({
          event: "send_message",
          payload: {
            conversationId,
            content,
          },
        })
      );
    },

    // Start typing indicator
    startTyping: (conversationId: string) => {
      ws.send(
        JSON.stringify({
          event: "typing_start",
          payload: {
            conversationId,
          },
        })
      );
    },

    // Stop typing indicator
    stopTyping: (conversationId: string) => {
      ws.send(
        JSON.stringify({
          event: "typing_stop",
          payload: {
            conversationId,
          },
        })
      );
    },

    // Mark message as read
    markAsRead: (messageId: string) => {
      ws.send(
        JSON.stringify({
          event: "mark_read",
          payload: {
            messageId,
          },
        })
      );
    },

    // Request presence information
    requestPresence: (userIds?: string[]) => {
      ws.send(
        JSON.stringify({
          event: "request_presence",
          payload: {
            userIds,
          },
        })
      );
    },

    // Ping to keep connection alive
    ping: () => {
      ws.send(
        JSON.stringify({
          event: "ping",
          payload: {},
        })
      );
    },

    // Close connection
    disconnect: () => {
      ws.close();
    },
  };
};

/**
 * React/Frontend example hook for WebSocket
 */
export const useWebSocket = (_userId: string, _userName: string) => {
  // This would be implemented in your React frontend
  // Using hooks like useState, useEffect, useRef
  /*
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<ReturnType<typeof createWebSocketClient>>();

  useEffect(() => {
    wsRef.current = createWebSocketClient(userId, userName);
    
    wsRef.current.ws.onopen = () => setIsConnected(true);
    wsRef.current.ws.onclose = () => setIsConnected(false);
    
    return () => {
      wsRef.current?.disconnect();
    };
  }, [userId, userName]);

  return {
    isConnected,
    messages,
    sendMessage: wsRef.current?.sendMessage,
    startTyping: wsRef.current?.startTyping,
    stopTyping: wsRef.current?.stopTyping,
    markAsRead: wsRef.current?.markAsRead,
  };
  */
};

// Example usage:
// const app = createWebSocketApp();
// const client = createWebSocketClient("user-123", "John Doe");
