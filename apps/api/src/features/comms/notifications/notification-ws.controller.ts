/**
 * WebSocket Controller for Notifications
 *
 * Handles WebSocket connections for real-time notifications
 */

import { notificationService } from "@kaa/services";
import { Elysia, t } from "elysia";
import { authPlugin } from "~/features/auth/auth.plugin";

/**
 * Notification WebSocket event types
 */
export enum NotificationSocketEvent {
  CONNECT = "notification:connect",
  NEW = "notification:new",
  READ = "notification:read",
  UNREAD_COUNT = "notification:unread_count",
  MARK_ALL_READ = "notification:mark_all_read",
  EMERGENCY = "notification:emergency",
  BULK_PROGRESS = "notification:bulk_progress",
  ERROR = "notification:error",
}

/**
 * WebSocket message schema
 */
const NotificationWebSocketMessageSchema = t.Object({
  event: t.String(),
  payload: t.Any(),
});

/**
 * Notification WebSocket connection data
 */
type NotificationConnection = {
  ws: any;
  userId: string;
  userName?: string;
  connectedAt: Date;
};

/**
 * Notification connection manager
 * Tracks all active notification WebSocket connections
 */
class NotificationConnectionManager {
  // Map of userId -> array of WebSocket connections (supports multiple devices)
  private readonly connections: Map<string, NotificationConnection[]> =
    new Map();

  /**
   * Add a new notification WebSocket connection
   */
  addConnection(ws: any, userId: string, userName?: string): void {
    const connection: NotificationConnection = {
      ws,
      userId,
      userName,
      connectedAt: new Date(),
    };

    const userConnections = this.connections.get(userId) || [];
    userConnections.push(connection);
    this.connections.set(userId, userConnections);

    console.log(
      `🔔 Notification WebSocket connected: userId=${userId}, total=${userConnections.length}`
    );
  }

  /**
   * Remove a notification WebSocket connection
   */
  removeConnection(ws: any, userId: string): void {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const filteredConnections = userConnections.filter(
      (conn) => conn.ws !== ws
    );

    if (filteredConnections.length === 0) {
      this.connections.delete(userId);
      console.log(`🔔 Notification WebSocket disconnected: userId=${userId}`);
    } else {
      this.connections.set(userId, filteredConnections);
      console.log(
        `🔔 Notification WebSocket disconnected: userId=${userId}, remaining=${filteredConnections.length}`
      );
    }
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId: string): NotificationConnection[] {
    return this.connections.get(userId) || [];
  }

  /**
   * Check if user has any active connections
   */
  isUserConnected(userId: string): boolean {
    const connections = this.connections.get(userId);
    return connections !== undefined && connections.length > 0;
  }

  /**
   * Get all connected user IDs
   */
  getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Emit event to specific users
   */
  emitToUsers(userIds: string[], event: string, payload: any): void {
    const message = JSON.stringify({
      event,
      payload,
    });

    for (const userId of userIds) {
      const connections = this.connections.get(userId);
      if (!connections) continue;

      for (const connection of connections) {
        try {
          connection.ws.send(message);
        } catch (error) {
          console.error(
            `Failed to send notification to user ${userId}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Emit event to a specific connection
   */
  emitToConnection(ws: any, event: string, payload: any): void {
    try {
      const message = JSON.stringify({
        event,
        payload,
      });
      ws.send(message);
    } catch (error) {
      console.error("Failed to emit to notification connection:", error);
    }
  }

  /**
   * Get connection statistics
   */
  getStatistics() {
    let totalConnections = 0;
    for (const connections of this.connections.values()) {
      totalConnections += connections.length;
    }

    return {
      totalConnections,
      uniqueUsers: this.connections.size,
    };
  }
}

// Global notification connection manager instance
export const notificationConnectionManager =
  new NotificationConnectionManager();

/**
 * Notification WebSocket Controller
 */
export const notificationWSController = new Elysia({
  prefix: "/notifications",
})
  .use(authPlugin)
  .decorate("connectedAt", new Date())
  .ws("/ws", {
    // Body validation schema
    body: NotificationWebSocketMessageSchema,

    // WebSocket lifecycle handlers
    open(ws) {
      const user = (ws.data as any).user;

      if (!user?.id) {
        ws.close();
        return;
      }

      const userName = `${user.firstName} ${user.lastName}`;

      // Register connection
      notificationConnectionManager.addConnection(ws, user.id, userName);

      // Send welcome message
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.CONNECT,
        {
          type: "connection_established",
          message: "Connected to notification service",
          userId: user.id,
          timestamp: new Date().toISOString(),
        }
      );

      // Send initial unread count
      notificationService
        .getUnreadCount(user.id)
        .then((count) => {
          notificationConnectionManager.emitToConnection(
            ws,
            NotificationSocketEvent.UNREAD_COUNT,
            {
              unreadCount: count,
              timestamp: new Date().toISOString(),
            }
          );
        })
        .catch(console.error);
    },

    message(ws, message: any) {
      const user = (ws.data as any).user;

      if (!user?.id) {
        notificationConnectionManager.emitToConnection(
          ws,
          NotificationSocketEvent.ERROR,
          {
            error: "Unauthorized",
          }
        );
        return;
      }

      const { event, payload } = message;

      // Handle different event types
      handleNotificationWebSocketMessage(ws, user.id, event, payload).catch(
        (error) => {
          console.error("Notification WebSocket message handler error:", error);
          notificationConnectionManager.emitToConnection(
            ws,
            NotificationSocketEvent.ERROR,
            {
              error: error.message || "Failed to process message",
              originalEvent: event,
            }
          );
        }
      );
    },

    close(ws) {
      const user = (ws.data as any).user;
      if (user?.id) {
        notificationConnectionManager.removeConnection(ws, user.id);
      }
    },
  })

  // Health check endpoint
  .get("/ws/health", () => ({
    status: "ok",
    statistics: notificationConnectionManager.getStatistics(),
    timestamp: new Date().toISOString(),
  }));

/**
 * Handle incoming WebSocket messages
 */
async function handleNotificationWebSocketMessage(
  ws: any,
  userId: string,
  event: string,
  payload: any
): Promise<void> {
  switch (event) {
    // Mark notification as read
    case "mark_notification_read": {
      const { notificationId } = payload;

      if (!notificationId) {
        throw new Error("notificationId is required");
      }

      const result = await notificationService.markAsRead(
        notificationId,
        userId
      );

      // Send confirmation
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.READ,
        {
          notificationId,
          ...result,
        }
      );

      // Send updated unread count
      const unreadCount = await notificationService.getUnreadCount(userId);
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.UNREAD_COUNT,
        {
          unreadCount,
          timestamp: new Date().toISOString(),
        }
      );

      break;
    }

    // Mark all notifications as read
    case "mark_all_read": {
      const user = (ws.data as any).user;
      const result = await notificationService.markAllAsRead(
        userId,
        user.memberId || ""
      );

      // Send confirmation
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.MARK_ALL_READ,
        {
          ...result,
        }
      );

      // Send updated unread count (should be 0)
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.UNREAD_COUNT,
        {
          unreadCount: 0,
          timestamp: new Date().toISOString(),
        }
      );

      break;
    }

    // Request unread count
    case "request_unread_count": {
      const count = await notificationService.getUnreadCount(userId);
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.UNREAD_COUNT,
        {
          unreadCount: count,
          timestamp: new Date().toISOString(),
        }
      );
      break;
    }

    // Ping/Pong for connection keep-alive
    case "ping":
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.CONNECT,
        {
          type: "pong",
          timestamp: new Date().toISOString(),
        }
      );
      break;

    default:
      notificationConnectionManager.emitToConnection(
        ws,
        NotificationSocketEvent.ERROR,
        {
          error: `Unknown event type: ${event}`,
        }
      );
  }
}

/**
 * Helper function to emit notification to connected users
 * This should be called when notifications are created
 */
export async function emitNotificationToUsers(
  userIds: string[],
  notification: any
): Promise<void> {
  // Emit new notification to connected users
  notificationConnectionManager.emitToUsers(
    userIds,
    NotificationSocketEvent.NEW,
    {
      notification,
      timestamp: new Date().toISOString(),
    }
  );

  // Update unread counts for connected users
  for (const userId of userIds) {
    if (notificationConnectionManager.isUserConnected(userId)) {
      try {
        const unreadCount = await notificationService.getUnreadCount(userId);
        notificationConnectionManager.emitToUsers(
          [userId],
          NotificationSocketEvent.UNREAD_COUNT,
          {
            unreadCount,
            timestamp: new Date().toISOString(),
          }
        );
      } catch (error) {
        console.error(
          `Failed to update unread count for user ${userId}:`,
          error
        );
      }
    }
  }
}

/**
 * Helper function to emit unread count update
 */
export function emitUnreadCountUpdate(
  userId: string,
  unreadCount: number
): void {
  notificationConnectionManager.emitToUsers(
    [userId],
    NotificationSocketEvent.UNREAD_COUNT,
    {
      unreadCount,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Helper function to emit emergency notification
 */
export function emitEmergencyNotification(
  userIds: string[],
  notification: any
): void {
  notificationConnectionManager.emitToUsers(
    userIds,
    NotificationSocketEvent.EMERGENCY,
    {
      notification,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Helper function to emit bulk notification progress
 */
export function emitBulkNotificationProgress(
  userId: string,
  progress: {
    total: number;
    completed: number;
    failed: number;
    errors?: string[];
  }
): void {
  notificationConnectionManager.emitToUsers(
    [userId],
    NotificationSocketEvent.BULK_PROGRESS,
    {
      progress,
      timestamp: new Date().toISOString(),
    }
  );
}

export default notificationWSController;
