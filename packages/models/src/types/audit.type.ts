import type mongoose from "mongoose";
import type { Document } from "mongoose";

import type { BaseDocument } from "./base.type";

/**
 * Audit action types enum
 * Follows standard CRUD operations plus additional actions
 */
export enum AuditActionType {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  LOGIN = "login",
  LOGOUT = "logout",
  EXPORT = "export",
  IMPORT = "import",
  PAYMENT = "payment",
  PERMISSION_CHANGE = "permission_change",
  CONFIGURATION_CHANGE = "configuration_change",
  PASSWORD_CHANGE = "password_change",
  PASSWORD_RESET = "password_reset",
  ACCOUNT_LOCK = "account_lock",
  ACCOUNT_UNLOCK = "account_unlock",
  EMAIL_CHANGE = "email_change",
  PHONE_CHANGE = "phone_change",
  API_ACCESS = "api_access",
  BULK_ACTION = "bulk_action",
  DOWNLOAD = "download",
  UPLOAD = "upload",
  PRINT = "print",
  OTHER = "other",
}

/**
 * Audit status enum
 */
export enum AuditStatus {
  SUCCESS = "success",
  FAILURE = "failure",
  WARNING = "warning",
  INFO = "info",
}

/**
 * Audit severity level enum
 * Based on standard severity levels
 */
export enum AuditSeverity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info",
}

/**
 * Audit entity type enum
 * Represents the different entities in the system
 */
export enum AuditEntityType {
  USER = "user",
  PROPERTY = "property",
  UNIT = "unit",
  TENANT = "tenant",
  PAYMENT = "payment",
  MAINTENANCE = "maintenance",
  NOTIFICATION = "notification",
  DOCUMENT = "document",
  SETTINGS = "settings",
  SYSTEM = "system",
  OTHER = "other",
}

export interface IEvent extends Document {
  memberId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: string;
  category: "user" | "api" | "billing" | "system" | "custom";
  action: string;
  properties: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface IAuditLog extends Document {
  memberId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // User who performed the action (null for system actions)
  action: AuditActionType;
  status: AuditStatus;
  resource: AuditEntityType;
  resourceId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
  severity?: AuditSeverity; // Severity level of the action
  description?: string; // Human-readable description of the action
  details?: Record<string, any>; // Additional details (before/after values, etc.)
  metadata: {
    sessionId?: string; // Session ID if applicable
    requestId?: string; // Request ID for correlation
    source?: string; // Source of the action (web, mobile, API, etc.)
    location?: {
      country?: string;
      region?: string;
      city?: string;
      coordinates?: [number, number]; // [longitude, latitude]
    };
    deviceId?: string; // Device identifier if available
    referenceId?: string; // Reference ID for cross-referencing
    tags?: string[]; // Tags for categorization
  };
}

export interface ISecurityViolation extends BaseDocument {
  ip: string;
  path: string;
  statusCode: string;
  createdAt: Date;
}
