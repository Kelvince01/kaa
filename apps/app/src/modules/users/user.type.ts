// User role types
// biome-ignore lint/style/noEnum: false positive
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  LANDLORD = "landlord",
  TENANT = "tenant",
  MANAGER = "manager",
  AGENT = "agent",
  MAINTENANCE = "maintenance",
  STAFF = "staff",
  VIEWER = "viewer",
  USER = "user",
}

// User status types
// biome-ignore lint/style/noEnum: false positive
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
  LOCKED = "locked",
}

export type Address = {
  line1: string;
  line2?: string;
  town: string;
  county: string;
  postalCode: string;
  country: string;
  directions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

// User interface
export type User = {
  id: string;
  memberId?: string | { _id: string; name: string };
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole | { _id: string; name: string };
  roles?: string[]; // Array of role IDs or names
  permissions?: string[]; // Array of permission names
  status: UserStatus;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  avatar?: string;
  address?: Address;
  timezone?: string;
  locale?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  bio?: string;
  responseTime?: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
  propertiesCount?: number;
  yearsExperience?: number;
};

// User creation input
export interface UserCreateInput
  extends Omit<
    User,
    | "id"
    | "isVerified"
    | "isActive"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
    | "lastLoginAt"
    | "lastLoginIp"
    | "emailVerifiedAt"
    | "phoneVerifiedAt"
  > {
  password: string;
  confirmPassword?: string;
  sendWelcomeEmail?: boolean;
}

// User update input
export interface UserUpdateInput
  extends Partial<
    Omit<UserCreateInput, "password" | "confirmPassword" | "email" | "username">
  > {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

// User filter options
export type UserFilter = {
  search?: string;
  role?: string;
  status?: UserStatus;
  isActive?: boolean;
  isVerified?: boolean;
  // startDate?: string;
  // endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// User statistics
export type UserStats = {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  byRole: Array<{ role: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  byDate: Array<{ date: string; count: number }>;
};

// User session
export type UserSession = {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
};

// User notification preference
export type UserNotificationPreference = {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  categories: Record<string, boolean>;
};
