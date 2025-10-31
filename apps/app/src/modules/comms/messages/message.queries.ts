/**
 * Message Queries
 *
 * React Query hooks for messaging functionality
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messageService } from "./message.service";
import type {
  AddParticipantRequest,
  ConversationFilters,
  CreateConversationRequest,
  MessageFilters,
  SendMessageRequest,
  UpdateConversationRequest,
} from "./message.type";

// ==================== QUERY KEYS ====================

export const messageQueryKeys = {
  all: ["messages"] as const,
  conversations: () => [...messageQueryKeys.all, "conversations"] as const,
  conversation: (id: string) =>
    [...messageQueryKeys.conversations(), id] as const,
  conversationMessages: (conversationId: string) =>
    [...messageQueryKeys.conversation(conversationId), "messages"] as const,
  unreadCount: () => [...messageQueryKeys.all, "unread-count"] as const,
  analytics: () => [...messageQueryKeys.all, "analytics"] as const,
};

// ==================== CONVERSATION QUERIES ====================

/**
 * Get conversations for current user
 */
export function useConversations(
  filters: ConversationFilters = {},
  page = 1,
  limit = 20,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [
      ...messageQueryKeys.conversations(),
      filters,
      page,
      limit,
    ] as const,
    queryFn: () => messageService.getConversations(filters, page, limit),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get a specific conversation
 */
export function useConversation(
  conversationId: string,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: messageQueryKeys.conversation(conversationId),
    queryFn: () => messageService.getConversation(conversationId),
    enabled: options?.enabled && !!conversationId,
  });
}

/**
 * Create conversation mutation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      messageService.createConversation(request),
    onSuccess: (data) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversations(),
      });
      // Add new conversation to cache
      queryClient.setQueryData(
        messageQueryKeys.conversation(data.conversation._id || ""),
        data
      );
    },
  });
}

/**
 * Update conversation mutation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      updates,
    }: {
      conversationId: string;
      updates: UpdateConversationRequest;
    }) => messageService.updateConversation(conversationId, updates),
    onSuccess: (data, variables) => {
      // Update conversation in cache
      queryClient.setQueryData(
        messageQueryKeys.conversation(variables.conversationId),
        data
      );
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversations(),
      });
    },
  });
}

/**
 * Add participant mutation
 */
export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      participant,
    }: {
      conversationId: string;
      participant: AddParticipantRequest;
    }) => messageService.addParticipant(conversationId, participant),
    onSuccess: (data, variables) => {
      // Update conversation in cache
      queryClient.setQueryData(
        messageQueryKeys.conversation(variables.conversationId),
        data
      );
    },
  });
}

/**
 * Remove participant mutation
 */
export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      participantId,
    }: {
      conversationId: string;
      participantId: string;
    }) => messageService.removeParticipant(conversationId, participantId),
    onSuccess: (_, variables) => {
      // Invalidate conversation
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversation(variables.conversationId),
      });
    },
  });
}

// ==================== MESSAGE QUERIES ====================

/**
 * Get messages for a conversation
 */
export function useMessages(
  conversationId: string,
  filters: MessageFilters = {},
  page = 1,
  limit = 20,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: [
      ...messageQueryKeys.conversationMessages(conversationId),
      filters,
      page,
      limit,
    ] as const,
    queryFn: () =>
      messageService.getMessages(conversationId, filters, page, limit),
    enabled: options?.enabled && !!conversationId,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Send message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) =>
      messageService.sendMessage(request),
    onSuccess: (data) => {
      const conversationId = data.message.conversationId;

      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversationMessages(conversationId),
      });

      // Update conversation's last message
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversation(conversationId),
      });

      // Update conversations list
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversations(),
      });

      // Update unread count
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.unreadCount(),
      });
    },
  });
}

/**
 * Mark message as read mutation
 */
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) =>
      messageService.markMessageAsRead(messageId),
    onSuccess: (_, _messageId) => {
      // Invalidate unread count
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.unreadCount(),
      });

      // Note: We could optimistically update the message status in cache
      // but for simplicity, we'll invalidate relevant queries
    },
  });
}

/**
 * Edit message mutation
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => messageService.editMessage(messageId, content),
    onSuccess: (data) => {
      const conversationId = data.message.conversationId;

      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.conversationMessages(conversationId),
      });
    },
  });
}

/**
 * Delete message mutation
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: (_, _messageId) => {
      // Invalidate all conversations and messages
      // since we don't know which conversation this message belonged to
      queryClient.invalidateQueries({
        queryKey: messageQueryKeys.all,
      });
    },
  });
}

// ==================== UTILITY QUERIES ====================

/**
 * Get unread message count
 */
export function useUnreadCount(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: messageQueryKeys.unreadCount(),
    queryFn: () => messageService.getUnreadCount(),
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Send bulk messages mutation
 */
export function useSendBulkMessages() {
  return useMutation({
    mutationFn: (request: {
      conversationIds: string[];
      content: string;
      type: string;
      priority: string;
      metadata?: Record<string, any>;
      scheduledFor?: Date;
      respectBusinessHours: boolean;
    }) => messageService.sendBulkMessages(request),
  });
}

/**
 * Get conversation analytics
 */
export function useConversationAnalytics(
  conversationId?: string,
  startDate?: Date,
  endDate?: Date,
  options?: {
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey: [
      ...messageQueryKeys.analytics(),
      conversationId,
      startDate,
      endDate,
    ] as const,
    queryFn: () =>
      messageService.getConversationAnalytics(
        conversationId,
        startDate,
        endDate
      ),
    enabled: options?.enabled,
  });
}

// ==================== WEBSOCKET HOOKS ====================

/**
 * WebSocket connection hook
 */
export function useWebSocketConnection(userId: string, token?: string) {
  return useQuery({
    queryKey: ["websocket", userId] as const,
    queryFn: () => messageService.connectWebSocket(userId, token),
    enabled: !!userId,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
