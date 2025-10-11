import { EventEmitter } from "node:events";
import type { WebSocket } from "ws";

export type SignalingMessage = {
  type:
    | "join"
    | "leave"
    | "offer"
    | "answer"
    | "ice-candidate"
    | "mute"
    | "unmute"
    | "error";
  roomId: string;
  userId: string;
  targetUserId?: string;
  data?: any;
  timestamp: number;
};

export type Room = {
  id: string;
  participants: Map<string, ParticipantInfo>;
  createdAt: Date;
  metadata?: any;
};

export type ParticipantInfo = {
  userId: string;
  ws: WebSocket;
  joinedAt: Date;
  metadata?: any;
};

/**
 * WebRTC Signaling Server
 * Handles signaling for WebRTC connections
 */
export class WebRTCSignalingEngine extends EventEmitter {
  private readonly rooms: Map<string, Room> = new Map();
  private readonly userToRoom: Map<string, string> = new Map();
  private readonly wsToUser: Map<WebSocket, string> = new Map();

  /**
   * Handle WebSocket connection
   */
  handleConnection(ws: WebSocket, userId: string): void {
    this.wsToUser.set(ws, userId);

    ws.on("message", (data: Buffer) => {
      try {
        const message: SignalingMessage = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error("Error parsing signaling message:", error);
        this.sendError(ws, "Invalid message format");
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.handleDisconnection(ws);
    });

    this.emit("connection", { userId, ws });
  }

  /**
   * Handle signaling message
   */
  private handleMessage(ws: WebSocket, message: SignalingMessage): void {
    const userId = this.wsToUser.get(ws);
    if (!userId) {
      this.sendError(ws, "User not authenticated");
      return;
    }

    // Validate message
    if (!(message.type && message.roomId)) {
      this.sendError(ws, "Invalid message: missing type or roomId");
      return;
    }

    switch (message.type) {
      case "join":
        this.handleJoin(ws, userId, message);
        break;
      case "leave":
        this.handleLeave(ws, userId, message);
        break;
      case "offer":
        this.handleOffer(ws, userId, message);
        break;
      case "answer":
        this.handleAnswer(ws, userId, message);
        break;
      case "ice-candidate":
        this.handleIceCandidate(ws, userId, message);
        break;
      case "mute":
      case "unmute":
        this.handleMediaToggle(ws, userId, message);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle join room
   */
  private handleJoin(
    ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId, data } = message;

    // Check if user is already in a room
    const currentRoom = this.userToRoom.get(userId);
    if (currentRoom) {
      this.handleLeave(ws, userId, { ...message, roomId: currentRoom });
    }

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map(),
        createdAt: new Date(),
        metadata: data?.metadata,
      };
      this.rooms.set(roomId, room);
      this.emit("roomcreated", { roomId, room });
    }

    // Add participant to room
    room.participants.set(userId, {
      userId,
      ws,
      joinedAt: new Date(),
      metadata: data?.metadata,
    });

    this.userToRoom.set(userId, roomId);

    // Notify user of successful join
    this.send(ws, {
      type: "joined",
      roomId,
      userId,
      participants: Array.from(room.participants.keys()).filter(
        (id) => id !== userId
      ),
      timestamp: Date.now(),
    });

    // Notify other participants
    this.broadcastToRoom(
      roomId,
      {
        type: "user-joined",
        roomId,
        userId,
        timestamp: Date.now(),
      },
      userId
    );

    this.emit("userjoined", { roomId, userId, room });
  }

  /**
   * Handle leave room
   */
  private handleLeave(
    _ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId } = message;
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    // Remove participant from room
    room.participants.delete(userId);
    this.userToRoom.delete(userId);

    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: "user-left",
      roomId,
      userId,
      timestamp: Date.now(),
    });

    // Delete room if empty
    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
      this.emit("roomdeleted", { roomId });
    }

    this.emit("userleft", { roomId, userId, room });
  }

  /**
   * Handle WebRTC offer
   */
  private handleOffer(
    ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for offer");
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendError(ws, "Room not found");
      return;
    }

    const targetParticipant = room.participants.get(targetUserId);
    if (!targetParticipant) {
      this.sendError(ws, "Target user not in room");
      return;
    }

    // Forward offer to target user
    this.send(targetParticipant.ws, {
      type: "offer",
      roomId,
      userId,
      data,
      timestamp: Date.now(),
    });

    this.emit("offer", {
      roomId,
      fromUserId: userId,
      toUserId: targetUserId,
      data,
    });
  }

  /**
   * Handle WebRTC answer
   */
  private handleAnswer(
    ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for answer");
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.sendError(ws, "Room not found");
      return;
    }

    const targetParticipant = room.participants.get(targetUserId);
    if (!targetParticipant) {
      this.sendError(ws, "Target user not in room");
      return;
    }

    // Forward answer to target user
    this.send(targetParticipant.ws, {
      type: "answer",
      roomId,
      userId,
      data,
      timestamp: Date.now(),
    });

    this.emit("answer", {
      roomId,
      fromUserId: userId,
      toUserId: targetUserId,
      data,
    });
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(
    ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for ICE candidate");
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      return; // Silently ignore if room doesn't exist
    }

    const targetParticipant = room.participants.get(targetUserId);
    if (!targetParticipant) {
      return; // Silently ignore if target not in room
    }

    // Forward ICE candidate to target user
    this.send(targetParticipant.ws, {
      type: "ice-candidate",
      roomId,
      userId,
      data,
      timestamp: Date.now(),
    });

    this.emit("icecandidate", {
      roomId,
      fromUserId: userId,
      toUserId: targetUserId,
      data,
    });
  }

  /**
   * Handle media toggle (mute/unmute)
   */
  private handleMediaToggle(
    _ws: WebSocket,
    userId: string,
    message: SignalingMessage
  ): void {
    const { roomId, type, data } = message;

    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // Broadcast media toggle to all participants
    this.broadcastToRoom(
      roomId,
      {
        type,
        roomId,
        userId,
        data,
        timestamp: Date.now(),
      },
      userId
    );

    this.emit("mediatoggle", { roomId, userId, type, data });
  }

  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(ws: WebSocket): void {
    const userId = this.wsToUser.get(ws);
    if (!userId) {
      return;
    }

    const roomId = this.userToRoom.get(userId);
    if (roomId) {
      this.handleLeave(ws, userId, {
        type: "leave",
        roomId,
        userId,
        timestamp: Date.now(),
      });
    }

    this.wsToUser.delete(ws);
    this.emit("disconnection", { userId });
  }

  /**
   * Send message to WebSocket
   */
  private send(ws: WebSocket, message: any): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message
   */
  private sendError(ws: WebSocket, error: string): void {
    this.send(ws, {
      type: "error",
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast message to all participants in room
   */
  private broadcastToRoom(
    roomId: string,
    message: any,
    excludeUserId?: string
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    for (const [userId, participant] of room.participants) {
      if (userId !== excludeUserId) {
        this.send(participant.ws, message);
      }
    }
  }

  /**
   * Get room information
   */
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Get all rooms
   */
  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get room count
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Get participant count across all rooms
   */
  getTotalParticipantCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.participants.size;
    }
    return count;
  }

  /**
   * Get user's current room
   */
  getUserRoom(userId: string): string | undefined {
    return this.userToRoom.get(userId);
  }

  /**
   * Kick user from room
   */
  kickUser(roomId: string, userId: string, reason?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const participant = room.participants.get(userId);
    if (!participant) {
      return;
    }

    // Send kick message to user
    this.send(participant.ws, {
      type: "kicked",
      roomId,
      reason,
      timestamp: Date.now(),
    });

    // Remove user from room
    this.handleLeave(participant.ws, userId, {
      type: "leave",
      roomId,
      userId,
      timestamp: Date.now(),
    });

    this.emit("userkicked", { roomId, userId, reason });
  }

  /**
   * Close room and kick all participants
   */
  closeRoom(roomId: string, reason?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    // Kick all participants
    for (const userId of room.participants.keys()) {
      this.kickUser(roomId, userId, reason);
    }

    this.rooms.delete(roomId);
    this.emit("roomclosed", { roomId, reason });
  }

  /**
   * Get statistics
   */
  getStats(): {
    rooms: number;
    participants: number;
    averageParticipantsPerRoom: number;
  } {
    const rooms = this.rooms.size;
    const participants = this.getTotalParticipantCount();

    return {
      rooms,
      participants,
      averageParticipantsPerRoom: rooms > 0 ? participants / rooms : 0,
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    // Close all rooms
    for (const roomId of this.rooms.keys()) {
      this.closeRoom(roomId, "Server shutting down");
    }

    this.rooms.clear();
    this.userToRoom.clear();
    this.wsToUser.clear();
    this.removeAllListeners();
  }
}
