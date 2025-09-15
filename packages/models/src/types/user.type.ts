/**
 * User type definitions for the Kaa API
 */

import type { Language } from "@kaa/config";
import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { IAddress } from "./common.type";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
  LOCKED = "locked",
}

/**
 * User roles
 */
export enum UserRole {
  TENANT = "tenant",
  LANDLORD = "landlord",
  AGENT = "agent",
  ADMIN = "admin",
}

export type Jwt = {
  refreshKey: string;
  userId: string;
  permissionFlags: string;
};

export type IUserPreference = {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  accessibility: {
    prefersReducedMotion: boolean;
    prefersContrast: "no-preference" | "high" | "low" | "custom";
    prefersDarkMode: boolean;
    fontSize: "small" | "medium" | "large";
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
};

export type IBaseUserSubscription = {
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  usageQuota: {
    requests: number;
    storage: number;
    users: number;
  };
  usageCurrent: {
    requests: number;
    storage: number;
    users: number;
  };
};

/**
 * User document interface
 */
export interface IUser extends BaseDocument {
  slug: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  passwordChangedAt?: Date;
  phone?: string;
  role: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  avatar?: string;
  idNumber?: string;
  idVerified?: boolean;
  phoneVerified?: boolean;
  isVerified: boolean;
  isActive: boolean;
  status: UserStatus;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  address?: IAddress;
  dateOfBirth?: Date;
  identityVerified?: boolean;
  stripeCustomerId?: string;
  notifications?: Array<{
    _id: string;
    message: string;
    type: string; // email, sms,maintenance, payments, announcements
    read: boolean;
    createdAt: Date;
  }>;
  permissionFlags?: number;
  settings?: IUserSettings;
  deviceTokens?: IDeviceToken[];
  locale: Language;
  preferences?: IUserPreference;
  subscription?: IBaseUserSubscription;
  metadata: Record<string, any>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  getPublicProfile(): Partial<IUser>;
  getFullName(): string;
  isLocked(): boolean;
}

/**
 * Reference schema type
 */
export type IReference = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  relationship: string;
  contactInfo: string;
  status: "pending" | "complete" | "declined";
};

// Add this interface for user settings
export type IUserSettings = {
  disableEmailNotifications?: boolean;
  disablePushNotifications?: boolean;
  // You can add more settings here
};

export type IDeviceToken = {
  token: string;
  platform: "ios" | "android" | "web";
  deviceId: string;
  appVersion?: string;
  osVersion?: string;
  isActive: boolean;
  lastUsed: Date;
};
