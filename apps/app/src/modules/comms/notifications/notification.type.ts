/**
 * Type definitions for notifications system
 */

export type NotificationType =
  | "message"
  | "property"
  | "property_update"
  | "property_viewing"
  | "property_application"
  | "property_tenancy"
  | "property_favorite"
  | "property_alert"
  | "property_payment"
  | "property_system"
  | "viewing_request"
  | "viewing_confirmation"
  | "viewing_cancellation"
  | "application_status"
  | "payment_reminder"
  | "payment_confirmation"
  | "account"
  | "booking"
  | "tenancy"
  | "favorite"
  | "alert"
  | "payment"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type BaseNotification = {
  _id: string;
  recipients: string[];
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  link?: string;
  priority?: NotificationPriority;
  image?: string;
  relatedId?: string;
  relatedModel?: string;
};

export type Notification = BaseNotification;

export type NotificationListResponse = {
  items: Notification[];
  unread: number;
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  status: "success" | "error";
  message: string;
};

export type UnreadCountResponse = {
  data: {
    unreadCount: number;
  };
  status: "success" | "error";
  message: string;
};

export type CreateNotificationRequest = {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  image?: string;
  relatedId?: string;
  relatedModel?: string;
};

/**
 * Notification preferences for a user
 */
export type NotificationPreferences = {
  /** User ID */
  userId: string;
  /** Email notification preferences */
  email: {
    /** Whether email notifications are enabled */
    enabled: boolean;
    /** Types of notifications to receive via email */
    types: NotificationType[];
    /** Digest frequency if applicable */
    digestFrequency?: "immediate" | "daily" | "weekly";
  };
  /** Push notification preferences */
  push: {
    /** Whether push notifications are enabled */
    enabled: boolean;
    /** Types of notifications to receive via push */
    types: NotificationType[];
  };
  /** In-app notification preferences */
  inApp: {
    /** Whether in-app notifications are enabled */
    enabled: boolean;
    /** Types of notifications to receive in-app */
    types: NotificationType[];
  };
  /** SMS notification preferences */
  sms: {
    /** Whether SMS notifications are enabled */
    enabled: boolean;
    /** Types of notifications to receive via SMS */
    types: NotificationType[];
  };
};
