/**
 * Pure Backend Collaboration Service for Virtual Tours
 * Handles session management and message routing - no frontend dependencies
 */

import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import type { ServerWebSocket } from "bun";

type LiveTourSession = {
  id: string;
  tourId: string;
  hostId: string;
  participants: Participant[];
  chatHistory: ChatMessage[];
  annotations: LiveAnnotation[];
  createdAt: Date;
  lastActivity: Date;
};

type Participant = {
  id: string;
  userId: string;
  role: "host" | "viewer" | "editor";
  joinedAt: Date;
  isActive: boolean;
  permissions: ParticipantPermissions;
};

type ChatMessage = {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "annotation";
};

type LiveAnnotation = {
  id: string;
  userId: string;
  sceneId: string;
  position: { x: number; y: number };
  content: string;
  timestamp: Date;
  type: "note" | "question" | "issue";
};

type ParticipantPermissions = {
  canEdit: boolean;
  canAddScenes: boolean;
  canAddHotspots: boolean;
  canModifySettings: boolean;
  canManageParticipants: boolean;
};

type TourChange = {
  id: string;
  type:
    | "scene-add"
    | "scene-update"
    | "scene-delete"
    | "hotspot-add"
    | "hotspot-update"
    | "hotspot-delete"
    | "settings-update";
  data: any;
  userId: string;
  timestamp: Date;
  sceneId?: string;
  hotspotId?: string;
};

type WebSocketConnection = {
  participantId: string;
  ws: ServerWebSocket<any>;
  sessionId: string;
  userId: string;
  joinedAt: Date;
  lastActivity: Date;
};

type CollaborationConfig = {
  maxParticipants: number;
  sessionTimeout: number;
  allowedOrigins: string[];
};

export class CollaborationService extends EventEmitter {
  private readonly activeSessions: Map<string, LiveTourSession> = new Map();
  private readonly webSocketConnections: Map<string, WebSocketConnection> =
    new Map();
  private readonly config: CollaborationConfig;

  constructor() {
    super();

    this.config = {
      maxParticipants: 50,
      sessionTimeout: 30, // 30 minutes
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
      ],
    };

    this.startSessionCleanup();
  }

  /**
   * Create a new collaborative tour session
   */
  async createSession(
    tourId: string,
    hostId: string
  ): Promise<LiveTourSession> {
    const session: LiveTourSession = {
      id: crypto.randomUUID(),
      tourId,
      hostId,
      participants: [],
      chatHistory: [],
      annotations: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.activeSessions.set(session.id, session);
    this.emit("session-created", session);
    return await Promise.resolve(session);
  }

  /**
   * Handle WebSocket connection
   */
  handleConnection(
    ws: ServerWebSocket<any>,
    sessionId: string,
    userId: string,
    role: "host" | "viewer" | "editor"
  ): string {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
      return "";
    }

    if (session.participants.length >= this.config.maxParticipants) {
      ws.send(JSON.stringify({ type: "error", message: "Session is full" }));
      return "";
    }

    const participantId = crypto.randomUUID();
    const participant: Participant = {
      id: participantId,
      userId,
      role,
      joinedAt: new Date(),
      isActive: true,
      permissions: this.getDefaultPermissions(role),
    };

    session.participants.push(participant);
    session.lastActivity = new Date();

    const connection: WebSocketConnection = {
      participantId,
      ws,
      sessionId,
      userId,
      joinedAt: new Date(),
      lastActivity: new Date(),
    };

    this.webSocketConnections.set(participantId, connection);

    // Notify existing participants
    this.broadcastToSession(
      sessionId,
      {
        type: "participant-joined",
        participant,
        timestamp: new Date(),
      },
      participantId
    );

    // Send session state to new participant
    ws.send(
      JSON.stringify({
        type: "session-state",
        session: {
          ...session,
          participants: session.participants,
        },
      })
    );

    this.emit("participant-joined", { session, participant });
    return participantId;
  }

  /**
   * Handle WebSocket message
   */
  handleMessage(participantId: string, message: any): void {
    const connection = this.webSocketConnections.get(participantId);
    if (!connection) return;

    connection.lastActivity = new Date();

    const session = this.activeSessions.get(connection.sessionId);
    if (!session) return;

    session.lastActivity = new Date();

    switch (message.type) {
      case "chat-message":
        this.handleChatMessage(connection, message.data);
        break;
      case "tour-change":
        this.handleTourChange(connection, message.data);
        break;
      case "annotation-add":
        this.handleAnnotationAdd(connection, message.data);
        break;
      case "cursor-move":
        this.handleCursorMove(connection, message.data);
        break;
      case "signaling":
        // Generic signaling for frontend WebRTC
        this.handleSignaling(connection, message.data);
        break;
      default:
        break;
    }
  }

  /**
   * Handle participant disconnect
   */
  handleDisconnect(participantId: string): void {
    const connection = this.webSocketConnections.get(participantId);
    if (!connection) return;

    const session = this.activeSessions.get(connection.sessionId);
    if (session) {
      const participantIndex = session.participants.findIndex(
        (p) => p.id === participantId
      );
      if (participantIndex !== -1) {
        const participant = session.participants[participantIndex];
        session.participants.splice(participantIndex, 1);

        this.broadcastToSession(connection.sessionId, {
          type: "participant-left",
          participant,
          timestamp: new Date(),
        });

        this.emit("participant-left", { session, participant });
      }

      // Clean up empty sessions
      if (session.participants.length === 0) {
        this.activeSessions.delete(connection.sessionId);
        this.emit("session-ended", session);
      }
    }

    this.webSocketConnections.delete(participantId);
    console.log(`Participant disconnected: ${participantId}`);
  }

  /**
   * Handle chat message
   */
  private handleChatMessage(
    connection: WebSocketConnection,
    data: { message: string }
  ): void {
    const session = this.activeSessions.get(connection.sessionId);
    if (!session) return;

    const participant = session.participants.find(
      (p) => p.id === connection.participantId
    );
    if (!participant) return;

    const chatMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId: participant.userId,
      message: data.message,
      timestamp: new Date(),
      type: "text",
    };

    session.chatHistory.push(chatMessage);

    // Keep only last 1000 messages
    if (session.chatHistory.length > 1000) {
      session.chatHistory.shift();
    }

    // Broadcast to all participants
    this.broadcastToSession(connection.sessionId, {
      type: "chat-message",
      message: chatMessage,
      timestamp: new Date(),
    });

    this.emit("chat-message-sent", { session, message: chatMessage });
  }

  /**
   * Handle tour changes
   */
  private handleTourChange(
    connection: WebSocketConnection,
    data: TourChange
  ): void {
    const session = this.activeSessions.get(connection.sessionId);
    if (!session) return;

    const participant = session.participants.find(
      (p) => p.id === connection.participantId
    );
    if (!(participant && this.validatePermissions(participant, data.type))) {
      connection.ws.send(
        JSON.stringify({
          type: "error",
          message: "Insufficient permissions",
        })
      );
      return;
    }

    const change: TourChange = {
      ...data,
      id: crypto.randomUUID(),
      userId: participant.userId,
      timestamp: new Date(),
    };

    // Broadcast change to all participants except sender
    this.broadcastToSession(
      connection.sessionId,
      {
        type: "tour-change",
        change,
        timestamp: new Date(),
      },
      connection.participantId
    );

    this.emit("tour-changed", { session, change });
  }

  /**
   * Handle live annotations
   */
  private handleAnnotationAdd(
    connection: WebSocketConnection,
    data: Omit<LiveAnnotation, "id" | "timestamp" | "userId">
  ): void {
    const session = this.activeSessions.get(connection.sessionId);
    if (!session) return;

    const participant = session.participants.find(
      (p) => p.id === connection.participantId
    );
    if (!participant) return;

    const annotation: LiveAnnotation = {
      ...data,
      id: crypto.randomUUID(),
      userId: participant.userId,
      timestamp: new Date(),
    };

    session.annotations.push(annotation);

    // Broadcast to all participants
    this.broadcastToSession(connection.sessionId, {
      type: "annotation-added",
      annotation,
      timestamp: new Date(),
    });

    this.emit("annotation-added", { session, annotation });
  }

  /**
   * Handle cursor movement
   */
  private handleCursorMove(
    connection: WebSocketConnection,
    data: { x: number; y: number; sceneId: string }
  ): void {
    // Broadcast cursor position to other participants
    this.broadcastToSession(
      connection.sessionId,
      {
        type: "cursor-moved",
        participantId: connection.participantId,
        ...data,
        timestamp: new Date(),
      },
      connection.participantId
    );
  }

  /**
   * Handle generic signaling messages (WebRTC, etc.)
   */
  private handleSignaling(
    connection: WebSocketConnection,
    data: { targetId: string; payload: any; signalType: string }
  ): void {
    const targetConnection = Array.from(
      this.webSocketConnections.values()
    ).find((c) => c.participantId === data.targetId);

    if (targetConnection) {
      targetConnection.ws.send(
        JSON.stringify({
          type: "signaling",
          signalType: data.signalType,
          payload: data.payload,
          senderId: connection.participantId,
        })
      );
    }
  }

  /**
   * Broadcast message to all participants in a session
   */
  private broadcastToSession(
    sessionId: string,
    message: any,
    excludeParticipantId?: string
  ): void {
    const connections = Array.from(this.webSocketConnections.values()).filter(
      (c) =>
        c.sessionId === sessionId && c.participantId !== excludeParticipantId
    );

    const messageString = JSON.stringify(message);

    for (const connection of connections) {
      try {
        connection.ws.send(messageString);
      } catch (error) {
        console.error(
          `Failed to send message to participant ${connection.participantId}:`,
          error
        );
        // Remove dead connection
        this.handleDisconnect(connection.participantId);
      }
    }
  }

  /**
   * Validate participant permissions
   */
  private validatePermissions(
    participant: Participant,
    changeType: string
  ): boolean {
    const permissions = participant.permissions;

    switch (changeType) {
      case "scene-add":
      case "scene-delete":
        return permissions.canAddScenes;
      case "hotspot-add":
      case "hotspot-delete":
        return permissions.canAddHotspots;
      case "settings-update":
        return permissions.canModifySettings;
      default:
        return permissions.canEdit;
    }
  }

  /**
   * Get default permissions based on role
   */
  private getDefaultPermissions(
    role: "host" | "viewer" | "editor"
  ): ParticipantPermissions {
    switch (role) {
      case "host":
        return {
          canEdit: true,
          canAddScenes: true,
          canAddHotspots: true,
          canModifySettings: true,
          canManageParticipants: true,
        };
      case "editor":
        return {
          canEdit: true,
          canAddScenes: true,
          canAddHotspots: true,
          canModifySettings: false,
          canManageParticipants: false,
        };

      default: // case 'viewer':
        return {
          canEdit: false,
          canAddScenes: false,
          canAddHotspots: false,
          canModifySettings: false,
          canManageParticipants: false,
        };
    }
  }

  /**
   * Start session cleanup process
   */
  private startSessionCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60_000); // Check every minute
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const minutesSinceActivity =
        (now.getTime() - session.lastActivity.getTime()) / (1000 * 60);

      if (minutesSinceActivity > this.config.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        // Disconnect all participants
        for (const participant of session.participants) {
          this.handleDisconnect(participant.id);
        }

        this.activeSessions.delete(sessionId);
        this.emit("session-expired", { sessionId });
      }
    }

    if (expiredSessions.length > 0) {
      console.log(
        `Cleaned up ${expiredSessions.length} expired collaboration sessions`
      );
    }
  }

  /**
   * Initialize service
   */
  initialize(): void {
    console.log(
      "Pure Backend Collaboration Service ready for real-time features"
    );
  }

  /**
   * Get service health
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    activeSessions: number;
    totalParticipants: number;
    activeConnections: number;
  } {
    const activeSessions = this.activeSessions.size;
    const totalParticipants = Array.from(this.activeSessions.values()).reduce(
      (total, session) => total + session.participants.length,
      0
    );

    return {
      status: "healthy",
      activeSessions,
      totalParticipants,
      activeConnections: this.webSocketConnections.size,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      activeSessions: this.activeSessions.size,
      totalParticipants: Array.from(this.activeSessions.values()).reduce(
        (total, session) => total + session.participants.length,
        0
      ),
      activeConnections: this.webSocketConnections.size,
      maxParticipants: this.config.maxParticipants,
      sessionTimeout: this.config.sessionTimeout,
      uptime: process.uptime(),
    };
  }

  /**
   * Public API methods
   */
  getActiveSessions(): LiveTourSession[] {
    return Array.from(this.activeSessions.values());
  }

  getSession(sessionId: string): LiveTourSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getSessionParticipants(sessionId: string): Participant[] {
    const session = this.activeSessions.get(sessionId);
    return session?.participants || [];
  }

  endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    // Disconnect all participants
    for (const participant of session.participants) {
      this.handleDisconnect(participant.id);
    }

    this.activeSessions.delete(sessionId);
    this.emit("session-ended", { sessionId });
    return true;
  }

  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId);
  }

  /**
   * Send message to specific participant
   */
  sendToParticipant(participantId: string, message: any): boolean {
    const connection = this.webSocketConnections.get(participantId);
    if (!connection) return false;

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(
        `Failed to send message to participant ${participantId}:`,
        error
      );
      this.handleDisconnect(participantId);
      return false;
    }
  }

  /**
   * Broadcast to all participants in session
   */
  broadcastToSessionPublic(
    sessionId: string,
    message: any,
    excludeParticipantId?: string
  ): void {
    this.broadcastToSession(sessionId, message, excludeParticipantId);
  }
}

// export default new CollaborationService();
