export type AdminUser = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "support";
  lastLogin: Date;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SystemStats = {
  stats: {
    users: {
      total: number;
      landlords: number;
      tenants: number;
    };
    properties: {
      total: number;
      active: number;
      let: number;
    };
    bookings: {
      total: number;
      pending: number;
    };
  };
  recentUsers: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
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
