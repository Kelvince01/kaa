import type mongoose from "mongoose";
import type { Schema } from "mongoose";
import type { BaseDocument } from "./base.type";

// Notification types
export enum NotificationType {
  BOOKING_REQUEST = "booking_request",
  BOOKING_CONFIRMED = "booking_confirmed",
  BOOKING_CANCELLED = "booking_cancelled",
  PAYMENT_RECEIVED = "payment_received",
  PAYMENT_FAILED = "payment_failed",
  PROPERTY_APPROVED = "property_approved",
  PROPERTY_REJECTED = "property_rejected",
  NEW_MESSAGE = "new_message",
  REVIEW_RECEIVED = "review_received",
  SYSTEM = "system",
  PROPERTY_CREATED = "property_created",
  PROPERTY_UPDATED = "property_updated",
  PROPERTY_DELETED = "property_deleted",
  MAINTENANCE_CREATED = "maintenance_created",
  MAINTENANCE_UPDATED = "maintenance_updated",
  MAINTENANCE_DELETED = "maintenance_deleted",
  PAYMENT_CREATED = "payment_created",
  PAYMENT_UPDATED = "payment_updated",
  SYSTEM_ALERT = "system_alert",
  USER_ALERT = "user_alert",
  CHAT_MESSAGE = "chat_message",
  DOCUMENT_SHARED = "document_shared",
  INSPECTION_SCHEDULED = "inspection_scheduled",
  CONTRACT_UPDATED = "contract_updated",
}

export enum NotificationCategory {
  MESSAGE = "message",
  BOOKING = "booking",
  PAYMENT = "payment",
  PROPERTY = "property",
  MAINTENANCE = "maintenance",
  CONTRACT = "contract",
  REFERENCE = "reference",
  ACCOUNT = "account",
  OTHER = "other",
  APPLICATION = "application",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum NotificationChannel {
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
  IN_APP = "in_app",
  WHATSAPP = "whatsapp",
}

/**
 * Interface for Notification document
 */
export interface INotification extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  recipients?: Schema.Types.ObjectId[];
  type: "info" | "success" | "warning" | "error";
  channel: string;
  // channels: ("email" | "push" | "in_app")[];
  title: string;
  message: string;
  category?: string;
  status: "pending" | "sent" | "failed" | "read" | "delivered";
  priority?: NotificationPriority;
  link?: string;
  linkText?: string;
  image?: string;
  relatedId?: Schema.Types.ObjectId;
  relatedModel?: string;
  isRead: boolean;
  isDeleted: boolean;
  expiresAt?: Date;
  data?: Record<string, any>;
  readAt: Date;
  sentAt: Date;
  scheduledFor: Date;
}

export interface INotificationPreference extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  preferences: {
    email: {
      enabled: boolean;
      types: string[];
    };
    sms: {
      enabled: boolean;
      types: string[];
    };
    push: {
      enabled: boolean;
      types: string[];
    };
    in_app: {
      enabled: boolean;
      types: string[];
    };
    whatsapp: {
      enabled: boolean;
      types: string[];
    };
  };
}

export interface IDeviceToken extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: "ios" | "android" | "web";
  deviceId: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  lastUsed: Date;
}
