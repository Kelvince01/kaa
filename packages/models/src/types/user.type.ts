/**
 * User type definitions for the Kaa API
 */

import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum KYCStatus {
  PENDING = "pending",
  SUBMITTED = "submitted",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

// Kenyan specific types
export type KenyanPhone = {
  countryCode: "+254";
  number: string; // without country code
  formatted: string; // with country code
};

export type KenyanIdentification = {
  type: "national_id" | "passport" | "alien_id";
  number: string;
  verified: boolean;
};

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
  LOCKED = "locked",
  BANNED = "banned",
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

// User profile data
export type UserProfile = {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
};

// User contact information
export type UserContact = {
  email: string;
  phone: KenyanPhone;
  alternativePhone?: KenyanPhone;
  whatsappNumber?: string;
  preferredContact: "email" | "phone" | "whatsapp";
};

// User address information
export type UserAddress = {
  type: "residential" | "work" | "postal";
  line1?: string;
  line2?: string;
  town?: string;
  county: string;
  estate?: string;
  postalCode?: string;
  country: string;
  directions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isPrimary: boolean;
};

// User verification information
export type UserVerification = {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  kycStatus: KYCStatus;
  kycData?: {
    identification: KenyanIdentification;
    documents: {
      idDocument?: string; // URL to uploaded ID
      proofOfAddress?: string;
      bankStatement?: string;
      payslip?: string[];
    };
    verificationDate?: Date;
    verifiedBy?: string; // Admin user ID
    rejectionReason?: string;
  };
};

// User preferences
export type UserPreferences = {
  theme: "light" | "dark" | "system";
  language: "en" | "sw";
  currency: "KES";
  timezone: "Africa/Nairobi";
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showPhone: boolean;
    showEmail: boolean;
  };
  accessibility: {
    prefersReducedMotion: boolean;
    prefersContrast: "no-preference" | "high" | "low" | "custom";
    prefersDarkMode: boolean;
    fontSize: "small" | "medium" | "large";
  };
};

// User settings
export type UserSettings = {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  autoLogout: boolean;
  darkMode?: boolean;
};

// User activity tracking
export type UserActivity = {
  lastLogin?: Date;
  lastLoginIP?: string;
  lastActivity?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  accountDeactivatedAt?: Date;
  accountSuspendedAt?: Date;
  suspensionReason?: string;
};

// User statistics (for landlords/agents)
export type UserStats = {
  totalProperties?: number;
  activeListings?: number;
  totalApplications?: number;
  totalTenants?: number;
  totalEarnings?: number;
  averageRating?: number;
  totalReviews?: number;
};

/**
 * User document interface
 */
export interface IUser extends BaseDocument {
  slug: string;
  memberId?: mongoose.Types.ObjectId;

  // Basic info
  profile: UserProfile;
  contact: UserContact;
  role: mongoose.Types.ObjectId;
  status: UserStatus;

  // Security
  password: string;

  // Location
  addresses: UserAddress[];

  // Verification
  verification: UserVerification;

  // Preferences & Settings
  preferences: UserPreferences;
  settings: UserSettings;

  // Activity & Stats
  activity: UserActivity;
  stats?: UserStats;

  // Social
  connections?: {
    followers: string[]; // User IDs
    following: string[]; // User IDs
  };

  // Metadata
  metadata?: {
    source?: string; // Registration source
    referredBy?: string; // User ID who referred
    tags?: string[];
    notes?: string; // Admin notes
  };

  // Computed fields
  fullName: string;
  displayName: string;

  permissionFlags?: number;
  deletedAt?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  getPublicProfile(): Partial<IUser>;
  getFullName(): string;
  isLocked(): boolean;
}

// User creation data
export type CreateUserData = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  county?: string;
  estate?: string;
  acceptTerms: boolean;
};

// User update data
export type UpdateUserData = {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  alternativePhone?: string;
  whatsappNumber?: string;
  preferredContact?: "email" | "phone" | "whatsapp";
  addresses?: UserAddress[];
  preferences?: Partial<UserPreferences>;
  settings?: Partial<UserSettings>;
  deletedAt?: Date;
};

// User login data
export type LoginUserData = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

// Phone login data
export type PhoneLoginData = {
  phone: string;
  otp: string;
};

// User search filters
export type UserSearchFilters = {
  role?: UserRole;
  status?: UserStatus;
  county?: string;
  verified?: boolean;
  kycStatus?: KYCStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
};

// User response data (what gets sent to client)
export type UserResponse = {
  id: string;
  username: string;
  memberId?: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  kycStatus: KYCStatus;
  county?: string;
  estate?: string;
  preferences: UserPreferences;
  stats?: UserStats;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// User profile response (public view)
export type UserProfileResponse = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  role: UserRole;
  verified: boolean;
  county?: string;
  estate?: string;
  stats?: Pick<UserStats, "totalProperties" | "averageRating" | "totalReviews">;
  joinedAt: Date;
};
