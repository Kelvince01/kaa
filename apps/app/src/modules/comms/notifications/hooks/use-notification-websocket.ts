/**
 * WebSocket Hook for Notifications
 *
 * Custom hook for real-time notification updates via WebSocket
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/modules/auth/use-auth";
import { queryClient } from "@/query/query-client";
import type { Notification } from "../notification.type";

/**
 * Notification WebSocket event types
 */
enum NotificationSocketEvent {
  CONNECT = "notification:connect",
  NEW = "notification:new",
  READ = "notification:read",
  UNREAD_COUNT = "notification:unread_count",
  MARK_ALL_READ = "notification:mark_all_read",
  EMERGENCY = "notification:emergency",
  BULK_PROGRESS = "notification:bulk_progress",
  ERROR = "notification:error",
}

type UseNotificationWebSocketOptions = {
  userId?: string;
  enabled?: boolean;
};

export function useNotificationWebSocket({
  userId,
  enabled = true,
}: UseNotificationWebSocketOptions = {}) {
  const { user, getAccessToken } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  // Get user ID from auth if not provided
  const activeUserId = userId || user?.id;

  /**
   * Connect to notification WebSocket
   */
  const connect = useCallback(() => {
    if (!(enabled && activeUserId)) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Build WebSocket URL
      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
      const wsProtocol = apiUrl.startsWith("https") ? "wss" : "ws";
      const wsHost = apiUrl.startsWith("http://")
        ? apiUrl.slice(7)
        : apiUrl.startsWith("https://")
          ? apiUrl.slice(8)
          : apiUrl;
      const wsUrl = `${wsProtocol}://${wsHost}/notifications/ws`;

      console.log("🔔 Connecting to notification WebSocket:", wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("✅ Notification WebSocket connected");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                event: "ping",
                payload: {},
              })
            );
          } else {
            clearInterval(pingInterval);
          }
        }, 30_000); // Ping every 30 seconds

        // Store ping interval for cleanup
        (ws as any).pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { event: eventType, payload } = message;

          console.log("🔔 Notification WebSocket message:", eventType, payload);

          switch (eventType) {
            case NotificationSocketEvent.CONNECT:
              // Connection established
              if (payload.type === "pong") {
                // Just a pong response, no action needed
                return;
              }
              break;

            case NotificationSocketEvent.NEW: {
              // New notification received
              const notification: Notification = payload.notification;

              // Show browser notification if permitted
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: notification.image || "/images/logo.png",
                  tag: notification._id,
                  requireInteraction: notification.priority === "urgent",
                });
              }

              // Update React Query cache
              // Add to notifications list
              queryClient.setQueryData(
                [
                  "notifications",
                  { page: "1", limit: "20", unreadOnly: "false" },
                ],
                (oldData: any) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    items: [notification, ...oldData.items],
                    unread: (oldData.unread || 0) + 1,
                  };
                }
              );

              // Invalidate to trigger refetch
              queryClient.invalidateQueries({
                queryKey: ["notifications"],
              });

              // Emit custom event for other components
              window.dispatchEvent(
                new CustomEvent("notification:new", { detail: notification })
              );
              break;
            }

            case NotificationSocketEvent.READ: {
              // Notification marked as read
              const { notificationId } = payload;

              // Update local cache
              queryClient.setQueryData(["notifications"], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  items: oldData.items.map((n: Notification) =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                  ),
                  unread: Math.max((oldData.unread || 0) - 1, 0),
                };
              });

              // Invalidate to refetch
              queryClient.invalidateQueries({
                queryKey: ["notifications"],
              });

              window.dispatchEvent(
                new CustomEvent("notification:read", {
                  detail: { notificationId },
                })
              );
              break;
            }

            case NotificationSocketEvent.MARK_ALL_READ: {
              // All notifications marked as read
              queryClient.setQueryData(["notifications"], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  items: oldData.items.map((n: Notification) => ({
                    ...n,
                    isRead: true,
                  })),
                  unread: 0,
                };
              });

              queryClient.invalidateQueries({
                queryKey: ["notifications"],
              });

              window.dispatchEvent(
                new CustomEvent("notification:mark_all_read")
              );
              break;
            }

            case NotificationSocketEvent.UNREAD_COUNT: {
              // Unread count updated
              const { unreadCount } = payload;

              // Update unread count query
              queryClient.setQueryData(["notifications", "unread-count"], {
                data: { unreadCount },
                status: "success",
                message: "Unread count updated",
              });

              // Also update in notifications list
              queryClient.setQueryData(["notifications"], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  unread: unreadCount,
                };
              });

              window.dispatchEvent(
                new CustomEvent("notification:unread_count", {
                  detail: { unreadCount },
                })
              );
              break;
            }

            case NotificationSocketEvent.EMERGENCY: {
              // Emergency notification
              const notification: Notification = payload.notification;

              // Show urgent browser notification
              if (
                typeof window !== "undefined" &&
                "Notification" in window &&
                Notification.permission === "granted"
              ) {
                new Notification(notification.title, {
                  body: notification.message,
                  icon: notification.image || "/images/logo.png",
                  tag: notification._id,
                  requireInteraction: true,
                  badge: "/images/logo.png",
                });
              }

              // Update cache
              queryClient.setQueryData(
                [
                  "notifications",
                  { page: "1", limit: "20", unreadOnly: "false" },
                ],
                (oldData: any) => {
                  if (!oldData) return oldData;
                  return {
                    ...oldData,
                    items: [notification, ...oldData.items],
                    unread: (oldData.unread || 0) + 1,
                  };
                }
              );

              queryClient.invalidateQueries({
                queryKey: ["notifications"],
              });

              window.dispatchEvent(
                new CustomEvent("notification:emergency", {
                  detail: notification,
                })
              );
              break;
            }

            case NotificationSocketEvent.ERROR:
              console.error("Notification WebSocket error:", payload.error);
              setError(new Error(payload.error || "Unknown error"));
              break;

            default:
              console.warn("Unknown notification event:", eventType);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("❌ Notification WebSocket error:", err);
        setError(new Error("WebSocket connection error"));
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(
          "⚠️ Notification WebSocket disconnected",
          event.code,
          event.reason
        );
        setIsConnected(false);

        // Cleanup ping interval
        if ((ws as any).pingInterval) {
          clearInterval((ws as any).pingInterval);
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && enabled && activeUserId) {
          reconnectAttemptsRef.current += 1;

          if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
            console.log(
              `🔄 Reconnecting to notification WebSocket (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`
            );
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay * reconnectAttemptsRef.current);
          } else {
            console.error("❌ Max reconnection attempts reached");
            setError(new Error("Failed to reconnect to notification service"));
          }
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError(err as Error);
      setIsConnected(false);
    }
  }, [enabled, activeUserId]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Send message to WebSocket
   */
  const sendMessage = useCallback((event: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event,
          payload,
        })
      );
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }, []);

  /**
   * Mark notification as read via WebSocket
   */
  const markAsRead = useCallback(
    (notificationId: string) => {
      sendMessage("mark_notification_read", { notificationId });
    },
    [sendMessage]
  );

  /**
   * Mark all notifications as read via WebSocket
   */
  const markAllAsRead = useCallback(() => {
    sendMessage("mark_all_read", {});
  }, [sendMessage]);

  /**
   * Request unread count via WebSocket
   */
  const requestUnreadCount = useCallback(() => {
    sendMessage("request_unread_count", {});
  }, [sendMessage]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    if (enabled && activeUserId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, activeUserId, connect, disconnect]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      disconnect();
    },
    [disconnect]
  );

  return {
    // Connection state
    isConnected,
    error,

    // Actions
    markAsRead,
    markAllAsRead,
    requestUnreadCount,
    disconnect,
    reconnect: connect,
  };
}

// Export enum for external use
export { NotificationSocketEvent };
