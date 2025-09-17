// Permission action types
export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
  APPROVE = "approve",
  REJECT = "reject",
  MANAGE = "manage",
  EXPORT = "export",
  IMPORT = "import",
}

// Role interface
export type Role = {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isDefault: boolean;
  isActive?: boolean;
  level: number; // For hierarchical roles
  permissionCount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

// Permission interface
export type Permission = {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: PermissionAction;
  conditions?: {
    field?: string;
    operator?:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
    value?: any;
  }[];
  isSystem: number;
  createdAt: string;
  updatedAt: string;
};

// Role permission association
export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  granted: boolean; // true = granted, false = explicitly denied
  conditions?: Record<string, any>; // Additional conditions for this specific role-permission
  grantedBy?: string;
  grantedAt: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

// User role assignment
export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  memberId?: string;
  isPrimary: boolean; // Primary role for the user
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  context?: {
    department?: string;
    project?: string;
    location?: string;
    temporary?: boolean;
    reason?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

// Role creation input
export type RoleCreateInput = {
  name: string;
  description?: string;
  isSystem?: boolean;
  isDefault?: boolean;
  level?: number;
};

// Role update input
export type RoleUpdateInput = Partial<RoleCreateInput>;

// Permission creation input
export type PermissionCreateInput = {
  name: string;
  description?: string;
  resource: string;
  action: PermissionAction;
  conditions?: {
    field?: string;
    operator?:
      | "equals"
      | "not_equals"
      | "contains"
      | "greater_than"
      | "less_than";
    value?: any;
  }[];
};

// Permission update input
export type PermissionUpdateInput = Partial<PermissionCreateInput>;

// Role assignment input
export type RoleAssignmentInput = {
  userId: string;
  roleId: string;
  memberId?: string;
  isPrimary?: boolean;
  expiresAt?: string;
  context?: {
    department?: string;
    project?: string;
    location?: string;
    temporary?: boolean;
    reason?: string;
  };
};

// Permission assignment input
export type PermissionAssignmentInput = {
  roleId: string;
  permissionId: string;
  granted: boolean;
  conditions?: Record<string, any>;
  expiresAt?: string;
};

// Filter options
export type RoleFilter = {
  search?: string;
  memberId?: string;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type PermissionFilter = {
  search?: string;
  roleId?: string;
  resource?: string;
  action?: PermissionAction;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// User permissions with context
export type UserPermission = {
  resource: string;
  action: string;
  organizationId: string;
  roleName: string;
};

// Permission check interface
export type PermissionCheck = {
  userId: string;
  memberId?: string;
  resource: string;
  action: string;
  context?: Record<string, any>;
};

// RBAC Statistics
export type RBACStats = {
  totalRoles: number;
  totalPermissions: number;
  totalUserRoles: number;
  systemRoles: number;
  customRoles: number;
  activeAssignments: number;
  expiredAssignments: number;
  byRole: Array<{ role: string; count: number }>;
  byPermission: Array<{ permission: string; count: number }>;
};
