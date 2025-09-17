import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as notificationService from "./notification.service";

// Get all notifications
export const useNotifications = ({
  page = "1",
  limit = "20",
  unreadOnly = "false",
}: {
  page?: string;
  limit?: string;
  unreadOnly?: string;
} = {}) => {
  return useQuery({
    queryKey: ["notifications", { page, limit, unreadOnly }],
    queryFn: () =>
      notificationService.getNotifications({ page, limit, unreadOnly }),
  });
};

// Get unread notification count
export const useUnreadCount = () => {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationService.getUnreadCount,
  });
};

// Mark notification as read
export const useMarkAsRead = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

// Mark all notifications as read
export const useMarkAllAsRead = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

// Delete notification
export const useDeleteNotification = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

// Delete all notifications
export const useDeleteAllNotifications = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.deleteAllNotifications,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

// Create notification
export const useCreateNotification = () => {
  // const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationService.createNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};
