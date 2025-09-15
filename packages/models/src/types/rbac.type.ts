import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export interface IRole extends BaseDocument {
  name: string;
  description?: string;
  isSystem: boolean;
  isDefault: boolean;
  level: number; // For hierarchical roles
  deletedAt?: Date;
}

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

export interface IPermission extends BaseDocument {
  name: string;
  description?: string;
  resource: string;
  action: PermissionAction;
  conditions?: {
    // Conditional permissions based on context
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
}

export interface IRolePermission extends BaseDocument {
  roleId: mongoose.Types.ObjectId;
  permissionId: mongoose.Types.ObjectId;
  // memberId: mongoose.Types.ObjectId;
  granted: boolean; // true = granted, false = explicitly denied
  conditions?: Record<string, any>; // Additional conditions for this specific role-permission
  grantedBy?: mongoose.Types.ObjectId;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface IUserRole extends BaseDocument {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId;
  isPrimary: boolean; // Primary role for the user
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  context?: {
    // Additional context for role assignment
    department?: string;
    project?: string;
    location?: string;
    temporary?: boolean;
    reason?: string;
  };
  isActive: boolean;
  deletedAt?: Date;
}

// export interface INotificationPreference extends BaseDocument {
// 	roleId: string;
// 	category: string;
// 	notificationTypes: Record<string, unknown>;
// }
