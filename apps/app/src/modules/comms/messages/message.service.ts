/**
 * Message Service
 *
 * Client-side service for messaging functionality
 * Integrates with API endpoints from message.controller.ts and message-ws.controller.ts
 */

import { httpClient } from "@/lib/axios";
import type {
  AddParticipantRequest,
  ConversationFilters,
  ConversationListResponse,
  ConversationResponse,
  CreateConversationRequest,
  MessageFilters,
  MessageListResponse,
  MessageResponse,
  SendMessageRequest,
  UpdateConversationRequest,
} from "./message.type";

/**
 * Message Service Class
 */
export class MessageService {
  private readonly baseUrl = "/messages";

  /**
   * Create a new conversation
   */
  async createConversation(
    request: CreateConversationRequest
  ): Promise<ConversationResponse> {
    const response = await httpClient.api.post(
      `${this.baseUrl}/conversations`,
      request
    );
    return response.data;
  }

  /**
   * Get conversations for current user
   */
  async getConversations(
    filters: ConversationFilters = {},
    page = 1,
    limit = 20
  ): Promise<ConversationListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await httpClient.api.get(
      `${this.baseUrl}/conversations?${params}`
    );
    return response.data;
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    const response = await httpClient.api.get(
      `${this.baseUrl}/conversations/${conversationId}`
    );
    return response.data;
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    updates: UpdateConversationRequest
  ): Promise<ConversationResponse> {
    const response = await httpClient.api.patch(
      `${this.baseUrl}/conversations/${conversationId}`,
      updates
    );
    return response.data;
  }

  /**
   * Add participant to conversation
   */
  async addParticipant(
    conversationId: string,
    participant: AddParticipantRequest
  ): Promise<ConversationResponse> {
    const response = await httpClient.api.post(
      `${this.baseUrl}/conversations/${conversationId}/participants`,
      participant
    );
    return response.data;
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(
    conversationId: string,
    participantId: string
  ): Promise<{ status: string; message: string }> {
    const response = await httpClient.api.delete(
      `${this.baseUrl}/conversations/${conversationId}/participants/${participantId}`
    );
    return response.data;
  }

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<MessageResponse> {
    // If there are attachments, use FormData
    if (request.attachments && request.attachments.length > 0) {
      const formData = new FormData();

      // Add basic fields
      formData.append("conversationId", request.conversationId);
      formData.append("content", request.content);

      if (request.type) formData.append("type", request.type);
      if (request.replyToMessageId)
        formData.append("replyToMessageId", request.replyToMessageId);
      if (request.priority) formData.append("priority", request.priority);
      if (request.autoTranslate !== undefined)
        formData.append("autoTranslate", request.autoTranslate.toString());
      if (request.metadata)
        formData.append("metadata", JSON.stringify(request.metadata));

      // Add attachments
      request.attachments.forEach((attachment, index) => {
        formData.append(`attachments[${index}][file]`, attachment.file);
        formData.append(`attachments[${index}][type]`, attachment.type);
      });

      const response = await httpClient.api.post(`${this.baseUrl}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    // For text-only messages, use JSON
    const messageData = {
      conversationId: request.conversationId,
      content: request.content,
      ...(request.type && { type: request.type }),
      ...(request.replyToMessageId && {
        replyToMessageId: request.replyToMessageId,
      }),
      ...(request.priority && { priority: request.priority }),
      ...(request.autoTranslate !== undefined && {
        autoTranslate: request.autoTranslate,
      }),
      ...(request.metadata && { metadata: request.metadata }),
    };

    const response = await httpClient.api.post(`${this.baseUrl}/`, messageData);
    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    filters: MessageFilters = {},
    page = 1,
    limit = 20
  ): Promise<MessageListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      ),
    });

    const response = await httpClient.api.get(
      `${this.baseUrl}/${conversationId}?${params}`
    );
    return response.data;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<{ status: string }> {
    const response = await httpClient.api.put(
      `${this.baseUrl}/${messageId}/read`
    );
    return response.data;
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    content: string
  ): Promise<MessageResponse> {
    const response = await httpClient.api.patch(
      `${this.baseUrl}/${messageId}`,
      {
        content,
      }
    );
    return response.data;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ status: string }> {
    const response = await httpClient.api.delete(
      `${this.baseUrl}/${messageId}`
    );
    return response.data;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await httpClient.api.get(`${this.baseUrl}/unread-count`);
    return response.data.data;
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(request: {
    conversationIds: string[];
    content: string;
    type: string;
    priority: string;
    metadata?: Record<string, any>;
    scheduledFor?: Date;
    respectBusinessHours: boolean;
  }): Promise<{ status: string; message: string; data: any }> {
    const response = await httpClient.api.post(`${this.baseUrl}/bulk`, request);
    return response.data;
  }

  /**
   * Get conversation analytics
   */
  async getConversationAnalytics(
    conversationId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    const url = conversationId
      ? `${this.baseUrl}/conversations/${conversationId}/analytics`
      : `${this.baseUrl}/analytics`;

    const response = await httpClient.api.get(`${url}?${params}`);
    return response.data;
  }

  /**
   * WebSocket connection management
   */
  private wsConnection: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;

  /**
   * Connect to WebSocket for real-time messaging
   */
  connectWebSocket(userId: string, token?: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
        const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
        // Remove protocol from URL
        const wsHost = apiUrl.startsWith("http://")
          ? apiUrl.slice(7)
          : apiUrl.startsWith("https://")
            ? apiUrl.slice(8)
            : apiUrl;
        const wsUrl = `${wsProtocol}://${wsHost}/chat/ws?userId=${userId}${token ? `&token=${token}` : ""}`;

        // const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/chat/ws?userId=${userId}${token ? `&token=${token}` : ""}`;

        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          resolve(this.wsConnection as WebSocket);
        };

        this.wsConnection.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          reject(error);
        };

        this.wsConnection.onclose = () => {
          console.log("WebSocket disconnected");
          this.attemptReconnect(userId, token);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  /**
   * Send WebSocket message
   */
  sendWebSocketMessage(event: string, payload: any): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({ event, payload }));
    } else {
      console.warn(
        "WebSocket not connected, message not sent:",
        event,
        payload
      );
    }
  }

  /**
   * Join a conversation via WebSocket
   */
  joinConversation(conversationId: string): void {
    this.sendWebSocketMessage("join_conversation", { conversationId });
  }

  /**
   * Leave a conversation via WebSocket
   */
  leaveConversation(conversationId: string): void {
    this.sendWebSocketMessage("leave_conversation", { conversationId });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    this.sendWebSocketMessage(isTyping ? "typing_start" : "typing_stop", {
      conversationId,
    });
  }

  /**
   * Mark message as read via WebSocket
   */
  markMessageReadWebSocket(messageId: string): void {
    this.sendWebSocketMessage("mark_read", { messageId });
  }

  /**
   * Send message via WebSocket
   */
  sendMessageWebSocket(messageData: {
    conversationId: string;
    content: string;
    type?: string;
    replyToMessageId?: string;
    attachments?: any[];
    metadata?: any;
  }): void {
    this.sendWebSocketMessage("send_message", messageData);
  }

  /**
   * Register WebSocket event listener
   */
  onWebSocketMessage(callback: (event: string, payload: any) => void): void {
    if (this.wsConnection) {
      this.wsConnection.onmessage = (event) => {
        try {
          const { event: eventType, payload } = JSON.parse(event.data);
          callback(eventType, payload);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(userId: string, token?: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting WebSocket reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connectWebSocket(userId, token).catch(() => {
          // Reconnect will be attempted again in onclose
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max WebSocket reconnect attempts reached");
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const messageService = new MessageService();
