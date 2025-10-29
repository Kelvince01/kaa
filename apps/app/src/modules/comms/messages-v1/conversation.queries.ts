import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationFilter } from "./conversation.type";
import {
  createConversation,
  deleteMessage,
  getConversationMessages,
  getConversations,
  getUnreadCount,
  markConversationAsRead,
  sendMessage,
} from "./message.service";
import type {
  CreateConversationInput,
  CreateMessageInput,
  MessageFilter,
} from "./message.type";

// Query keys
export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (filters: ConversationFilter) =>
    [...conversationKeys.lists(), filters] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (id: string, filters?: MessageFilter) =>
    [...conversationKeys.detail(id), "messages", filters] as const,
  unreadCount: () => [...conversationKeys.all, "unreadCount"] as const,
};

// Get conversations list
export const useConversations = (filters: ConversationFilter = {}) => {
  return useQuery({
    queryKey: conversationKeys.list(filters),
    queryFn: () =>
      getConversations({
        page: filters.page || 1,
        limit: filters.limit || 20,
        search: filters.search,
      }),
    staleTime: 30_000, // 30 seconds
  });
};

// Get messages for a conversation
export const useConversationMessages = (
  conversationId: string,
  filters: MessageFilter = {}
) => {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId, filters),
    queryFn: () =>
      getConversationMessages(conversationId, {
        page: filters.page?.toString() || "1",
        limit: filters.limit?.toString() || "50",
      }),
    enabled: !!conversationId,
    staleTime: 10_000, // 10 seconds for messages
  });
};

// Create a new conversation
export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversationInput) => createConversation(data),
    onSuccess: () => {
      // Invalidate conversations list to refetch with new conversation
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
};

// Send message in conversation
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: CreateMessageInput;
    }) => sendMessage(conversationId, data),
    onSuccess: (_, { conversationId }) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
      // Also invalidate conversations list to update last message
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
    },
  });
};

// Delete a message
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      // Invalidate all conversation messages queries
      queryClient.invalidateQueries({
        queryKey: conversationKeys.all,
      });
    },
  });
};

// Mark conversation as read
export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      markConversationAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Update unread count
      queryClient.invalidateQueries({
        queryKey: conversationKeys.unreadCount(),
      });
      // Update conversation in list
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(),
      });
      // Update messages to show as read
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
    },
  });
};

// Get unread message count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: conversationKeys.unreadCount(),
    queryFn: () => getUnreadCount(),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Refetch every minute
  });
};
