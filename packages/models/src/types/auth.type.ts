import type { Language } from "@kaa/config";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import type { BaseDocument } from "./base.type";
import type { UserPreferences, UserRole } from "./user.type";

/**
 * Auth token response
 */
export type AuthTokenResponse = {
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: UserRole;
    avatar?: string;
    isVerified: boolean;
    isActive: boolean;
  };
};

/**
 * Request with user
 */
export type AuthenticatedRequest = {
  user?: {
    _id: string;
    role: UserRole;
    phone?: string;
    isVerified?: boolean;
    locale?: Language;
    preferences?: UserPreferences;
  };
};

export type GoogleUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  verified_email: boolean;
};

export type MicrosoftUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string | undefined;
  userPrincipalName: string;
  displayName?: string;
  mail?: string;
  userType?: string;
  businessPhones?: string[];
  officeLocation?: string;
  preferredLanguage?: string;
};

export type SessionLocation = {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export type OAuthStrategy = "password" | "otp" | "oauth"; // 'google', 'microsoft', 'password', 'passkey'
export type OauthType = "regular" | "impersonation";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  token: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    os: string;
    location?: string;
    device?: string;
    deviceType: "desktop" | "mobile" | "tablet" | "unknown";
    deviceHash: string;
    browser: string;
  };
  valid: boolean;
  isRevoked: boolean;
  authStrategy: OAuthStrategy;
  authType: OauthType;
  location: SessionLocation;
  lastActive: Date;
  createdAt: Date;
  expiresAt: Date;
}

export interface IRefreshToken extends BaseDocument {
  user: mongoose.Schema.Types.ObjectId;
  token: string;
  expires: Date;
  valid: boolean;
  revoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  replacedByToken?: string;
  ipAddress?: string;
  userAgent?: string;
}

export type OAuthProvider = "google" | "apple" | "microsoft";

export interface IOAuthConnection extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  provider: OAuthProvider;
  providerUserId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  profile?: Record<string, any>;
}

// Verification Token Model
export interface IVerificationToken extends BaseDocument {
  user: mongoose.Types.ObjectId;
  token: string;
  purpose:
    | "email-verification"
    | "password-reset"
    | "account-deletion"
    | "email-change";
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
}

export interface IResetToken extends BaseDocument {
  token: string;
  user: mongoose.Types.ObjectId;
  expires: Date;
  blacklisted: boolean;
}

// MFA Types
export enum MFAType {
  SMS = "sms",
  TOTP = "totp",
  BACKUP_CODE = "backup_code",
}

export enum MFAStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  FAILED = "failed",
  EXPIRED = "expired",
}

export interface IMFASecret extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  type: MFAType;
  secret: string;
  backupCodes: string[];
  phoneNumber?: string;
  isEnabled: boolean;
  lastUsed: Date;
}

export type IMFAChallenge = {
  id: string;
  userId: mongoose.Types.ObjectId;
  type: MFAType;
  code: string;
  phoneNumber?: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  status: MFAStatus;
  createdAt: Date;
};

// OTP Model for one-time passcodes
export interface IOTP extends BaseDocument {
  id: string;
  user: mongoose.Types.ObjectId;
  code: string;
  purpose: "two-factor" | "login" | "transaction" | "verify-action";
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  attempts: number;
  maxAttempts: number;
}

// WebAuthn Passkey Model
export interface IPasskey extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  credentialId: string;
  publicKey: string;
  counter: number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports?: string[];
  name: string;
  lastUsed?: Date;
}

export interface IApiKey extends BaseDocument {
  memberId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  key: string;
  hashedKey: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  rateLimit?: {
    requests: number;
    window: number; // in seconds
  };
  usage: {
    totalRequests: number;
    lastRequest?: Date;
  };
}
