import { httpClient } from "@/lib/axios";
import type {
  ConversationFilter,
  ConversationListResponse,
} from "./conversation.type";
import type {
  CreateConversationInput,
  CreateMessageInput,
  MessageListResponse,
  MessageResponse,
} from "./message.type";

// Create conversation (which creates first message)
export const createConversation = async (
  data: CreateConversationInput
): Promise<any> => {
  const response = await httpClient.api.post("/messages/conversations", data);
  return response.data;
};

// Get all conversations for user
export const getConversations = async (
  params: ConversationFilter
): Promise<ConversationListResponse> => {
  const response = await httpClient.api.get("/messages/conversations", {
    params,
  });
  return response.data;
};

// Get messages for a conversation
export const getConversationMessages = async (
  conversationId: string,
  params: any = {}
): Promise<MessageListResponse> => {
  const response = await httpClient.api.get(
    `/messages/conversations/${conversationId}`,
    {
      params,
    }
  );
  return response.data;
};

// Send message in conversation
export const sendMessage = async (
  conversationId: string,
  data: CreateMessageInput
): Promise<MessageResponse> => {
  const response = await httpClient.api.post(
    `/messages/conversations/${conversationId}`,
    data
  );
  return response.data;
};

// Delete message
export const deleteMessage = async (
  messageId: string
): Promise<MessageResponse> => {
  const response = await httpClient.api.delete(
    `/messages/conversations/${messageId}`
  );
  return response.data;
};

// Mark conversation as read
export const markConversationAsRead = async (
  conversationId: string
): Promise<any> => {
  const response = await httpClient.api.patch(
    `/messages/conversations/${conversationId}/read`
  );
  return response.data;
};

// Get unread message count
export const getUnreadCount = async (): Promise<any> => {
  const response = await httpClient.api.get("/messages/unread-count");
  return response.data;
};
