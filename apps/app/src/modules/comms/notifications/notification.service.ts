import { httpClient } from "@/lib/axios";
import type {
  CreateNotificationRequest,
  NotificationListResponse,
  UnreadCountResponse,
} from "./notification.type";

// Get all notifications
export const getNotifications = async ({
  page = "1",
  limit = "20",
  unreadOnly = "false",
}: {
  page?: string;
  limit?: string;
  unreadOnly?: string;
}): Promise<NotificationListResponse> => {
  const response = await httpClient.api.get("/notifications", {
    params: { page, limit, unreadOnly },
  });
  return response.data;
};

// Mark notification as read
export const markAsRead = async ({
  notificationId,
}: {
  notificationId: string;
}) => {
  const response = await httpClient.api.patch(
    `/notifications/${notificationId}/read`,
    {}
  );
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await httpClient.api.patch(
    "/notifications/mark-all-read",
    {}
  );
  return response.data;
};

// Delete notification
export const deleteNotification = async ({
  notificationId,
}: {
  notificationId: string;
}) => {
  const response = await httpClient.api.delete(
    `/notifications/${notificationId}`
  );
  return response.data;
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  const response = await httpClient.api.delete("/notifications");
  return response.data;
};

// Get unread notification count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const response = await httpClient.api.get("/notifications/unread-count");
  return response.data;
};

// Create notification
export const createNotification = async (data: CreateNotificationRequest) => {
  const response = await httpClient.api.post("/notifications", data);
  return response.data;
};
