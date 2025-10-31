/**
 * WebSocket Messages Hook
 *
 * Custom hook for WebSocket integration with message store
 */

"use client";

import { useCallback, useEffect } from "react";
import { useWebSocketConnection } from "../message.queries";
import { messageService } from "../message.service";
import { useMessageStore } from "../message.store";
import type { SocketEvent } from "../message.type";

type UseWebSocketMessagesOptions = {
  userId: string;
  userName?: string;
  token?: string;
  enabled?: boolean;
};

export function useWebSocketMessages({
  userId,
  userName: _userName,
  token,
  enabled = true,
}: UseWebSocketMessagesOptions) {
  const { handleSocketMessage, setWebSocketConnected, currentConversationId } =
    useMessageStore();

  // WebSocket connection
  const {
    data: wsConnection,
    isLoading,
    error,
  } = useWebSocketConnection(userId, token);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!(wsConnection && enabled)) return;

    setWebSocketConnected(true);

    // Setup message handler
    const handleMessage = (event: string, payload: any) => {
      console.log("WebSocket message received:", event, payload);
      handleSocketMessage(event as SocketEvent, payload);
    };

    messageService.onWebSocketMessage(handleMessage);

    // Cleanup function
    return () => {
      messageService.disconnectWebSocket();
      setWebSocketConnected(false);
    };
  }, [wsConnection, enabled, handleSocketMessage, setWebSocketConnected]);

  // Auto-join current conversation
  useEffect(() => {
    if (currentConversationId && wsConnection) {
      messageService.joinConversation(currentConversationId);
    }
  }, [currentConversationId, wsConnection]);

  // WebSocket actions
  const sendMessage = useCallback(
    (
      conversationId: string,
      content: string,
      options?: {
        type?: string;
        replyToMessageId?: string;
        attachments?: any[];
        metadata?: any;
      }
    ) => {
      if (!wsConnection) {
        console.warn("WebSocket not connected, cannot send message");
        return;
      }

      messageService.sendMessageWebSocket({
        conversationId,
        content,
        ...options,
      });
    },
    [wsConnection]
  );

  const sendTypingIndicator = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!wsConnection) return;
      messageService.sendTypingIndicator(conversationId, isTyping);
    },
    [wsConnection]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!wsConnection) return;
      messageService.joinConversation(conversationId);
    },
    [wsConnection]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!wsConnection) return;
      messageService.leaveConversation(conversationId);
    },
    [wsConnection]
  );

  const markMessageAsRead = useCallback(
    (messageId: string) => {
      if (!wsConnection) return;
      messageService.markMessageReadWebSocket(messageId);
    },
    [wsConnection]
  );

  return {
    // Connection state
    isConnected: !!wsConnection,
    isLoading,
    error,

    // Actions
    sendMessage,
    sendTypingIndicator,
    joinConversation,
    leaveConversation,
    markMessageAsRead,

    // Utilities
    disconnect: () => messageService.disconnectWebSocket(),
  };
}
