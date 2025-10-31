import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { redisClient } from "@kaa/utils";
import type { RedisClientType } from "redis";

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
  ws: any; // Changed from WebSocket to any for adapter compatibility
  joinedAt: Date;
  metadata?: any;
};

// Redis key patterns
const REDIS_KEYS = {
  ROOM: "room:",
  USER_ROOM: "user_room:",
  WS_USER: "ws_user:",
  USER_WS: "user_ws:",
  ROOM_PARTICIPANTS: "room_participants:",
} as const;

/**
 * WebRTC Signaling Server
 * Handles signaling for WebRTC connections
 * Now compatible with ElysiaWebSocketAdapter
 */
export class WebRTCSignalingEngine extends EventEmitter {
  private readonly redisClient: RedisClientType;
  // Store WebSocket objects in memory since they can't be serialized to Redis
  private readonly wsObjects: Map<string, any> = new Map();

  constructor() {
    super();
    this.redisClient = redisClient;
  }

  /**
   * Generate a unique ID for WebSocket connections
   */
  private generateWebSocketId(): string {
    return randomUUID();
  }

  /**
   * Store WebSocket object in memory and create Redis mappings
   */
  private async storeWebSocket(ws: any, userId: string): Promise<string> {
    const wsId = this.generateWebSocketId();
    this.wsObjects.set(wsId, ws);

    // Store bidirectional mapping in Redis
    await Promise.all([
      this.redisClient.set(`${REDIS_KEYS.WS_USER}${wsId}`, userId),
      this.redisClient.set(`${REDIS_KEYS.USER_WS}${userId}`, wsId),
    ]);

    return wsId;
  }

  /**
   * Get user ID from WebSocket
   */
  private async getUserFromWebSocket(ws: any): Promise<string | null> {
    // Find WebSocket ID from our in-memory map
    for (const [wsId, storedWs] of this.wsObjects) {
      if (storedWs === ws) {
        const userId = await this.redisClient.get(
          `${REDIS_KEYS.WS_USER}${wsId}`
        );
        return userId;
      }
    }
    return null;
  }

  /**
   * Remove WebSocket from storage
   */
  private async removeWebSocket(ws: any): Promise<void> {
    // Find and remove WebSocket ID
    for (const [wsId, storedWs] of this.wsObjects) {
      if (storedWs === ws) {
        const userId = await this.redisClient.get(
          `${REDIS_KEYS.WS_USER}${wsId}`
        );

        // Clean up Redis mappings
        if (userId) {
          await Promise.all([
            this.redisClient.del(`${REDIS_KEYS.WS_USER}${wsId}`),
            this.redisClient.del(`${REDIS_KEYS.USER_WS}${userId}`),
            this.redisClient.del(`${REDIS_KEYS.USER_ROOM}${userId}`),
          ]);
        }

        this.wsObjects.delete(wsId);
        break;
      }
    }
  }

  /**
   * Get room data from Redis
   */
  private async getRoomFromRedis(roomId: string): Promise<Room | null> {
    const roomData = await this.redisClient.get(`${REDIS_KEYS.ROOM}${roomId}`);
    if (!roomData) return null;

    const room: Room = JSON.parse(roomData);
    // Convert participants back to Map
    room.participants = new Map(Object.entries(room.participants));
    return room;
  }

  /**
   * Store room data in Redis
   */
  private async setRoom(room: Room): Promise<void> {
    // Convert participants Map to object for JSON serialization
    const roomData = {
      ...room,
      participants: Object.fromEntries(room.participants),
    };
    await this.redisClient.set(
      `${REDIS_KEYS.ROOM}${room.id}`,
      JSON.stringify(roomData)
    );
  }

  /**
   * Delete room from Redis
   */
  private async deleteRoom(roomId: string): Promise<void> {
    await this.redisClient.del(`${REDIS_KEYS.ROOM}${roomId}`);
  }

  /**
   * Get all room IDs
   */
  private async getAllRoomIds(): Promise<string[]> {
    const keys = await this.redisClient.keys(`${REDIS_KEYS.ROOM}*`);
    return keys.map((key) => key.replace(REDIS_KEYS.ROOM, ""));
  }

  /**
   * Handle WebSocket connection
   * Store the connection for later message handling
   */
  async handleConnection(ws: any, userId: string): Promise<void> {
    console.log("connecting to WebSocket", userId);
    await this.storeWebSocket(ws, userId);
    this.emit("connection", { userId, ws });
  }

  /**
   * Handle WebSocket message (called by Elysia message handler)
   */
  async handleMessage(ws: any, message: any): Promise<void> {
    console.log("handling message", message);
    const userId = await this.getUserFromWebSocket(ws);
    console.log("user ID", userId);
    if (!userId) {
      this.sendError(ws, "User not authenticated");
      return;
    }

    try {
      // Convert message to Buffer if needed
      let data: Buffer;
      if (typeof message === "string") {
        data = Buffer.from(message);
      } else if (Buffer.isBuffer(message)) {
        data = message;
      } else if (message instanceof ArrayBuffer) {
        data = Buffer.from(message);
      } else {
        // Assume it's an object, stringify it
        data = Buffer.from(JSON.stringify(message));
      }

      const signalingMessage: SignalingMessage = JSON.parse(data.toString());
      await this.processMessage(ws, signalingMessage);
    } catch (error) {
      console.error("Error parsing signaling message:", error);
      this.sendError(ws, "Invalid message format");
    }
  }

  /**
   * Handle WebSocket close (called by Elysia close handler)
   */
  async handleClose(ws: any): Promise<void> {
    await this.handleDisconnection(ws);
  }

  /**
   * Handle WebSocket error (called by Elysia error handler)
   */
  async handleError(ws: any, error: Error): Promise<void> {
    console.error("WebSocket error:", error);
    await this.handleDisconnection(ws);
  }

  /**
   * Process signaling message
   */
  private async processMessage(
    ws: any,
    message: SignalingMessage
  ): Promise<void> {
    const userId = await this.getUserFromWebSocket(ws);
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
        await this.handleJoin(ws, userId, message);
        break;
      case "leave":
        await this.handleLeave(userId, message);
        break;
      case "offer":
        await this.handleOffer(ws, userId, message);
        break;
      case "answer":
        await this.handleAnswer(ws, userId, message);
        break;
      case "ice-candidate":
        await this.handleIceCandidate(ws, userId, message);
        break;
      case "mute":
      case "unmute":
        await this.handleMediaToggle(userId, message);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle join room
   */
  private async handleJoin(
    ws: any,
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId, data } = message;

    // Check if user is already in a room
    const currentRoomId = await this.redisClient.get(
      `${REDIS_KEYS.USER_ROOM}${userId}`
    );
    if (currentRoomId) {
      await this.handleLeave(userId, { ...message, roomId: currentRoomId });
    }

    // Get or create room
    let room = await this.getRoomFromRedis(roomId);
    if (!room) {
      room = {
        id: roomId,
        participants: new Map(),
        createdAt: new Date(),
        metadata: data?.metadata,
      };
      this.emit("roomcreated", { roomId, room });
    }

    // Add participant to room
    room.participants.set(userId, {
      userId,
      ws,
      joinedAt: new Date(),
      metadata: data?.metadata,
    });

    // Save room and user-room mapping to Redis
    await Promise.all([
      this.setRoom(room),
      this.redisClient.set(`${REDIS_KEYS.USER_ROOM}${userId}`, roomId),
    ]);

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
    await this.broadcastToRoom(
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
  private async handleLeave(
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId } = message;
    const room = await this.getRoomFromRedis(roomId);

    if (!room) {
      return;
    }

    // Remove participant from room
    room.participants.delete(userId);

    // Remove user-room mapping from Redis
    await this.redisClient.del(`${REDIS_KEYS.USER_ROOM}${userId}`);

    // Notify other participants
    await this.broadcastToRoom(roomId, {
      type: "user-left",
      roomId,
      userId,
      timestamp: Date.now(),
    });

    // Delete room if empty
    if (room.participants.size === 0) {
      await this.deleteRoom(roomId);
      this.emit("roomdeleted", { roomId });
    } else {
      // Save updated room
      await this.setRoom(room);
    }

    this.emit("userleft", { roomId, userId, room });
  }

  /**
   * Handle WebRTC offer
   */
  private async handleOffer(
    ws: any,
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for offer");
      return;
    }

    const room = await this.getRoomFromRedis(roomId);
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
  private async handleAnswer(
    ws: any,
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for answer");
      return;
    }

    const room = await this.getRoomFromRedis(roomId);
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
  private async handleIceCandidate(
    ws: any,
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId, targetUserId, data } = message;

    if (!targetUserId) {
      this.sendError(ws, "Target user ID required for ICE candidate");
      return;
    }

    const room = await this.getRoomFromRedis(roomId);
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
  private async handleMediaToggle(
    userId: string,
    message: SignalingMessage
  ): Promise<void> {
    const { roomId, type, data } = message;

    const room = await this.getRoom(roomId);
    if (!room) {
      return;
    }

    // Broadcast media toggle to all participants
    await this.broadcastToRoom(
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
  private async handleDisconnection(ws: any): Promise<void> {
    const userId = await this.getUserFromWebSocket(ws);
    if (!userId) {
      return;
    }

    const roomId = await this.redisClient.get(
      `${REDIS_KEYS.USER_ROOM}${userId}`
    );
    if (roomId) {
      await this.handleLeave(userId, {
        type: "leave",
        roomId,
        userId,
        timestamp: Date.now(),
      });
    }

    await this.removeWebSocket(ws);
    this.emit("disconnection", { userId });
  }

  /**
   * Send message to WebSocket
   */
  private send(ws: any, message: any): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message
   */
  private sendError(ws: any, error: string): void {
    this.send(ws, {
      type: "error",
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast message to all participants in room
   */
  private async broadcastToRoom(
    roomId: string,
    message: any,
    excludeUserId?: string
  ): Promise<void> {
    const room = await this.getRoomFromRedis(roomId);
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
  async getRoom(roomId: string): Promise<Room | null> {
    return await this.getRoomFromRedis(roomId);
  }

  /**
   * Get all rooms
   */
  async getRooms(): Promise<Room[]> {
    const roomIds = await this.getAllRoomIds();
    const rooms: Room[] = [];

    for (const roomId of roomIds) {
      const room = await this.getRoomFromRedis(roomId);
      if (room) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  /**
   * Get room count
   */
  async getRoomCount(): Promise<number> {
    const roomIds = await this.getAllRoomIds();
    return roomIds.length;
  }

  /**
   * Get participant count across all rooms
   */
  async getTotalParticipantCount(): Promise<number> {
    const rooms = await this.getRooms();
    let count = 0;
    for (const room of rooms) {
      count += room.participants.size;
    }
    return count;
  }

  /**
   * Get user's current room
   */
  async getUserRoom(userId: string): Promise<string | null> {
    return await this.redisClient.get(`${REDIS_KEYS.USER_ROOM}${userId}`);
  }

  /**
   * Kick user from room
   */
  async kickUser(
    roomId: string,
    userId: string,
    reason?: string
  ): Promise<void> {
    const room = await this.getRoomFromRedis(roomId);
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
    await this.handleLeave(userId, {
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
  async closeRoom(roomId: string, reason?: string): Promise<void> {
    const room = await this.getRoomFromRedis(roomId);
    if (!room) {
      return;
    }

    // Kick all participants
    for (const userId of room.participants.keys()) {
      await this.kickUser(roomId, userId, reason);
    }

    await this.deleteRoom(roomId);
    this.emit("roomclosed", { roomId, reason });
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    rooms: number;
    participants: number;
    averageParticipantsPerRoom: number;
  }> {
    const rooms = await this.getRoomCount();
    const participants = await this.getTotalParticipantCount();

    return {
      rooms,
      participants,
      averageParticipantsPerRoom: rooms > 0 ? participants / rooms : 0,
    };
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    // Close all rooms
    const roomIds = await this.getAllRoomIds();
    for (const roomId of roomIds) {
      await this.closeRoom(roomId, "Server shutting down");
    }

    // Clear WebSocket objects
    this.wsObjects.clear();
    this.removeAllListeners();
  }
}
