/**
 * Socket Service for Elysia WebSocket
 *
 * Manages WebSocket connections, real-time messaging, and presence tracking
 * for the Kenya rental platform messaging system
 */

import { Conversation } from "@kaa/models";
import { SocketEvent } from "@kaa/models/types";

// import type { ServerWebSocket } from "bun";

/**
 * WebSocket connection data structure
 */
type WebSocketConnection = {
  ws: any; // ServerWebSocket<any>,
  userId: string;
  userName?: string;
  connectedAt: Date;
  lastActivity: Date;
  conversationIds: Set<string>;
  metadata?: Record<string, any>;
};

type TypingIndicatorPayload = {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
};

type UserPresencePayload = {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
  conversationIds: string[];
};

/**
 * Socket Service Class
 */
export class SocketService {
  // Map of userId -> array of WebSocket connections (supports multiple devices)
  private readonly connections: Map<string, WebSocketConnection[]> = new Map();

  // Map of conversationId -> set of userIds (for efficient conversation broadcasting)
  private readonly conversationParticipants: Map<string, Set<string>> =
    new Map();

  // Typing indicators cache (conversationId -> userId -> timestamp)
  private readonly typingIndicators: Map<string, Map<string, number>> =
    new Map();

  // Cleanup interval for stale typing indicators
  private cleanupInterval: Timer | null = null;

  constructor() {
    // Start cleanup interval for typing indicators (every 30 seconds)
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleTypingIndicators();
    }, 30_000);
  }

  // ==================== CONNECTION MANAGEMENT ====================

  /**
   * Register a new WebSocket connection
   */
  addConnection(
    ws: any, // ServerWebSocket<any>,
    userId: string,
    userName?: string,
    metadata?: Record<string, any>
  ): void {
    const connection: WebSocketConnection = {
      ws,
      userId,
      userName,
      connectedAt: new Date(),
      lastActivity: new Date(),
      conversationIds: new Set(),
      metadata,
    };

    // Add to user connections
    const userConnections = this.connections.get(userId) || [];
    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    // Load user's conversations
    this.loadUserConversations(userId).catch(console.error);

    // Emit user online event
    this.broadcastUserPresence(userId, true).catch(console.error);

    console.log(
      `WebSocket connected: userId=${userId}, total=${userConnections.length}`
    );
  }

  /**
   * Remove a WebSocket connection
   */
  removeConnection(ws: any, userId: string): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    // Remove this specific connection
    const filteredConnections = userConnections.filter(
      (conn) => conn.ws !== ws
    );

    if (filteredConnections.length === 0) {
      // User has no more connections - mark as offline
      this.connections.delete(userId);
      this.broadcastUserPresence(userId, false).catch(console.error);
      console.log(`WebSocket disconnected: userId=${userId}, now offline`);
    } else {
      // User still has other connections
      this.connections.set(userId, filteredConnections);
      console.log(
        `WebSocket disconnected: userId=${userId}, remaining=${filteredConnections.length}`
      );
    }
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    const connections = this.connections.get(userId);
    return connections !== undefined && connections.length > 0;
  }

  /**
   * Get all online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get connection count for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.connections.get(userId)?.length || 0;
  }

  /**
   * Update last activity for user
   */
  updateUserActivity(userId: string): void {
    const connections = this.connections.get(userId);
    if (!connections) return;

    const now = new Date();
    for (const connection of connections) {
      connection.lastActivity = now;
    }
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Join a conversation room
   */
  joinConversation(userId: string, conversationId: string): void {
    // Add to user's conversation list
    const connections = this.connections.get(userId);
    if (connections) {
      for (const connection of connections) {
        connection.conversationIds.add(conversationId);
      }
    }

    // Add to conversation participants map
    let participants = this.conversationParticipants.get(conversationId);
    if (!participants) {
      participants = new Set();
      this.conversationParticipants.set(conversationId, participants);
    }
    participants.add(userId);

    console.log(`User ${userId} joined conversation ${conversationId}`);
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(userId: string, conversationId: string): void {
    // Remove from user's conversation list
    const connections = this.connections.get(userId);
    if (connections) {
      for (const connection of connections) {
        connection.conversationIds.delete(conversationId);
      }
    }

    // Remove from conversation participants
    const participants = this.conversationParticipants.get(conversationId);
    if (participants) {
      participants.delete(userId);
      if (participants.size === 0) {
        this.conversationParticipants.delete(conversationId);
      }
    }

    console.log(`User ${userId} left conversation ${conversationId}`);
  }

  /**
   * Load all conversations for a user
   */
  private async loadUserConversations(userId: string): Promise<void> {
    try {
      const conversations = await Conversation.find({
        "participants.userId": userId,
        "participants.isActive": true,
      })
        .select("_id")
        .lean();

      for (const conversation of conversations) {
        this.joinConversation(userId, conversation._id.toString());
      }
    } catch (error) {
      console.error(`Failed to load conversations for user ${userId}:`, error);
    }
  }

  // ==================== EMIT METHODS ====================

  /**
   * Emit event to specific users
   */
  emitToUsers(userIds: string[], event: SocketEvent, payload: any): void {
    const message = this.formatMessage(event, payload);

    for (const userId of userIds) {
      const connections = this.connections.get(userId);
      if (!connections) continue;

      for (const connection of connections) {
        try {
          connection.ws.send(message);
        } catch (error) {
          console.error(`Failed to send to user ${userId}:`, error);
        }
      }
    }
  }

  /**
   * Emit event to all participants in a conversation
   */
  async emitToConversation(
    conversationId: string,
    event: SocketEvent,
    payload: any
  ): Promise<void> {
    const participants = this.conversationParticipants.get(conversationId);

    if (!participants || participants.size === 0) {
      // Try to load participants from database
      const conversation = await Conversation.findById(conversationId)
        .select("participants")
        .lean();

      if (!conversation) {
        console.warn(`Conversation ${conversationId} not found`);
        return;
      }

      const activeParticipants = conversation.participants
        .filter((p: any) => p.isActive)
        .map((p: any) => p.userId);

      this.emitToUsers(activeParticipants, event, payload);
      return;
    }

    this.emitToUsers(Array.from(participants), event, payload);
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: SocketEvent, payload: any): void {
    const message = this.formatMessage(event, payload);

    for (const connections of this.connections.values()) {
      for (const connection of connections) {
        try {
          connection.ws.send(message);
        } catch (error) {
          console.error("Failed to broadcast:", error);
        }
      }
    }
  }

  /**
   * Emit to specific WebSocket connection
   */
  emitToConnection(
    ws: any, // ServerWebSocket<any>,
    event: SocketEvent,
    payload: any
  ): void {
    try {
      const message = this.formatMessage(event, payload);
      ws.send(message);
    } catch (error) {
      console.error("Failed to emit to connection:", error);
    }
  }

  // ==================== TYPING INDICATORS ====================

  /**
   * Handle typing indicator
   */
  async handleTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean
  ): Promise<void> {
    this.updateUserActivity(userId);

    if (isTyping) {
      // Add to typing indicators
      let conversationTyping = this.typingIndicators.get(conversationId);
      if (!conversationTyping) {
        conversationTyping = new Map();
        this.typingIndicators.set(conversationId, conversationTyping);
      }
      conversationTyping.set(userId, Date.now());
    } else {
      // Remove from typing indicators
      const conversationTyping = this.typingIndicators.get(conversationId);
      if (conversationTyping) {
        conversationTyping.delete(userId);
        if (conversationTyping.size === 0) {
          this.typingIndicators.delete(conversationId);
        }
      }
    }

    // Broadcast typing indicator
    const payload: TypingIndicatorPayload = {
      conversationId,
      userId,
      userName,
      isTyping,
    };

    await this.emitToConversation(
      conversationId,
      isTyping ? SocketEvent.TYPING_START : SocketEvent.TYPING_STOP,
      payload
    );
  }

  /**
   * Get currently typing users in a conversation
   */
  getTypingUsers(conversationId: string): string[] {
    const conversationTyping = this.typingIndicators.get(conversationId);
    if (!conversationTyping) return [];

    const now = Date.now();
    const typingUsers: string[] = [];

    for (const [userId, timestamp] of conversationTyping.entries()) {
      // Consider typing if last update was within 5 seconds
      if (now - timestamp < 5000) {
        typingUsers.push(userId);
      }
    }

    return typingUsers;
  }

  /**
   * Cleanup stale typing indicators
   */
  private cleanupStaleTypingIndicators(): void {
    const now = Date.now();
    const staleTimeout = 10_000; // 10 seconds

    for (const [conversationId, typingMap] of this.typingIndicators.entries()) {
      for (const [userId, timestamp] of typingMap.entries()) {
        if (now - timestamp > staleTimeout) {
          typingMap.delete(userId);

          // Emit typing stop event
          this.emitToConversation(conversationId, SocketEvent.TYPING_STOP, {
            conversationId,
            userId,
            isTyping: false,
          }).catch(console.error);
        }
      }

      // Remove empty conversation maps
      if (typingMap.size === 0) {
        this.typingIndicators.delete(conversationId);
      }
    }
  }

  // ==================== PRESENCE MANAGEMENT ====================

  /**
   * Broadcast user presence to their conversations
   */
  private async broadcastUserPresence(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    const connections = this.connections.get(userId);
    if (!connections || connections.length === 0) return;

    const firstConnection = connections[0];
    if (!firstConnection) return;

    const conversationIds = Array.from(firstConnection.conversationIds);

    const payload: UserPresencePayload = {
      userId,
      isOnline,
      lastSeen: isOnline ? undefined : new Date(),
      conversationIds,
    };

    for (const conversationId of conversationIds) {
      await this.emitToConversation(
        conversationId,
        isOnline ? SocketEvent.USER_ONLINE : SocketEvent.USER_OFFLINE,
        payload
      );
    }
  }

  /**
   * Get user presence information
   */
  getUserPresence(userId: string): {
    isOnline: boolean;
    lastActivity?: Date;
    connectionCount: number;
  } {
    const connections = this.connections.get(userId);

    if (!connections || connections.length === 0) {
      return {
        isOnline: false,
        connectionCount: 0,
      };
    }

    const firstConnection = connections[0];
    if (!firstConnection) {
      return {
        isOnline: false,
        connectionCount: 0,
      };
    }

    // Get most recent activity
    const lastActivity = connections.reduce(
      (latest, conn) =>
        conn.lastActivity > latest ? conn.lastActivity : latest,
      firstConnection.lastActivity
    );

    return {
      isOnline: true,
      lastActivity,
      connectionCount: connections.length,
    };
  }

  // ==================== MESSAGE FORMATTING ====================

  /**
   * Format message for WebSocket transmission
   */
  private formatMessage(event: SocketEvent, payload: any): string {
    return JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  // ==================== STATISTICS & MONITORING ====================

  /**
   * Get connection statistics
   */
  getStatistics(): {
    totalConnections: number;
    uniqueUsers: number;
    activeConversations: number;
    typingUsers: number;
  } {
    let totalConnections = 0;
    for (const connections of this.connections.values()) {
      totalConnections += connections.length;
    }

    let typingUsers = 0;
    for (const typingMap of this.typingIndicators.values()) {
      typingUsers += typingMap.size;
    }

    return {
      totalConnections,
      uniqueUsers: this.connections.size,
      activeConversations: this.conversationParticipants.size,
      typingUsers,
    };
  }

  /**
   * Get conversation participants count
   */
  getConversationParticipantsCount(conversationId: string): number {
    return this.conversationParticipants.get(conversationId)?.size || 0;
  }

  // ==================== CLEANUP ====================

  /**
   * Cleanup service resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    for (const connections of this.connections.values()) {
      for (const connection of connections) {
        try {
          connection.ws.close();
        } catch (error) {
          console.error("Error closing connection:", error);
        }
      }
    }

    this.connections.clear();
    this.conversationParticipants.clear();
    this.typingIndicators.clear();
  }
}

// Export singleton instance
export const socketService = new SocketService();
