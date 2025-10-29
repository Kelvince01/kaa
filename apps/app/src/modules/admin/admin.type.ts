import type { UserRole } from "../users/user.type";

export type AdminUser = {
  _id: string;
  contact: {
    email: string;
  };
  profile: {
    firstName: string;
    lastName: string;
  };
  role: UserRole;
  activity: { lastLogin?: Date; lastActivity?: Date };
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
};

export type SystemStats = {
  stats: {
    users: {
      total: number;
      landlords: number;
      tenants: number;
      growth: {
        percentage: number;
        trend: "up" | "down" | "flat";
      };
    };
    properties: {
      total: number;
      active: number;
      let: number;
      growth: {
        percentage: number;
        trend: "up" | "down" | "flat";
      };
    };
    bookings: {
      total: number;
      pending: number;
      growth: {
        percentage: number;
        trend: "up" | "down" | "flat";
      };
    };
    payments: {
      total: number;
      completed: number;
      pending: number;
    };
    revenue: {
      total: number;
      period: {
        start: Date;
        end: Date;
      };
      pending: number;
      growth: {
        percentage: number;
        trend: "up" | "down" | "flat";
      };
    };
  };
  period: {
    current: {
      start: Date;
      end: Date;
    };
    previous: {
      start: Date;
      end: Date;
    };
  };
  recentUsers: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    contact: {
      email: string;
    };
    roleId: {
      name: string;
    };
    createdAt: Date;
  }[];
  recentProperties: {
    _id: string;
    title: string;
    status: string;
    createdAt: Date;
  }[];
  recentBookings: {
    _id: string;
    property: string;
    tenant: string;
    status: string;
    createdAt: Date;
  }[];
};

export type SystemStatsFilter = {
  year?: string;
  month?: string;
  period?: "custom" | "daily" | "monthly" | "yearly";
  startDate?: string;
  endDate?: string;
};

export type UserManagementFilter = {
  search?: string;
  role?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type BulkUserAction = {
  action: "activate" | "deactivate" | "delete" | "assign_role";
  userIds: string[];
  data?: {
    role?: string;
    [key: string]: any;
  };
};

export type SystemConfiguration = {
  id: string;
  key: string;
  value: any;
  type: "string" | "number" | "boolean" | "object";
  description?: string;
  category: string;
  updatedAt: Date;
  updatedBy: string;
};

export type FeatureFlag = {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description?: string;
  conditions?: {
    userRoles?: string[];
    userIds?: string[];
    percentage?: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type SystemHealth = {
  status: "healthy" | "warning" | "critical";
  services: {
    database: "up" | "down";
    redis: "up" | "down";
    email: "up" | "down";
    storage: "up" | "down";
  };
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    responseTime: number;
  };
  lastCheck: Date;
};

export type AuditLog = {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
};

export type AdminCreateUserInput = {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
  isActive?: boolean;
  temporaryPassword?: boolean;
};

export type AdminUpdateUserInput = {
  firstName?: string;
  lastName?: string;
  role?: string;
  permissions?: string[];
  isActive?: boolean;
};

export type PropertyManagementFilter = {
  search?: string;
  status?: string;
  approved?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type BookingManagementFilter = {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type AdminProperty = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  approved: boolean;
  address: {
    city?: string;
    postalCode?: string;
  };
  media?: any[];
  landlord: {
    personalInfo?: any;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type AdminBooking = {
  _id: string;
  property: {
    _id: string;
    title: string;
    location?: any;
    media?: any[];
  };
  tenant: {
    personalInfo?: any;
  };
  landlord?: {
    personalInfo?: any;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SystemLog = {
  id: string;
  timestamp: Date;
  level: "info" | "error" | "warning";
  message: string;
  metadata?: Record<string, any>;
};

export type PaymentManagementFilter = {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type AdminPayment = {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  dueDate: Date;
  paidDate?: Date;
  description?: string;
  referenceNumber?: string;
  transactionId?: string;
  property?: {
    _id: string;
    title: string;
    location?: any;
  };
  tenant: {
    personalInfo?: any;
  };
  landlord: {
    personalInfo?: any;
  };
  booking?: {
    startDate: Date;
    endDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
};
