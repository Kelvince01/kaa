import mongoose from "mongoose";

import {
  // type INotificationPreference,
  type IPermission,
  type IRole,
  type IRolePermission,
  type IUserRole,
  PermissionAction,
} from "./types/rbac.type";

export const RoleSchema = new mongoose.Schema<IRole>(
  {
    name: { type: String, required: true },
    description: String,
    isSystem: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },
    level: { type: Number, default: 0 }, // 0 = lowest, higher = more permissions
    deletedAt: Date,
  },
  { timestamps: true }
);

export const PermissionSchema = new mongoose.Schema<IPermission>(
  {
    name: { type: String, required: true },
    description: String,
    resource: { type: String, required: true },
    action: { type: String, required: true, enum: PermissionAction },
    conditions: [
      {
        field: String,
        operator: {
          type: String,
          enum: [
            "equals",
            "not_equals",
            "contains",
            "greater_than",
            "less_than",
          ],
        },
        value: mongoose.Schema.Types.Mixed,
      },
    ],
    isSystem: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const RolePermissionSchema = new mongoose.Schema<IRolePermission>(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    permissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
    },
    // memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    granted: { type: Boolean, default: true },
    conditions: { type: mongoose.Schema.Types.Mixed },
    grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    grantedAt: { type: Date, default: Date.now },
    expiresAt: Date,
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate role-permission assignments
RolePermissionSchema.index(
  {
    roleId: 1,
    permissionId: 1,
    // memberId: 1
  },
  { unique: true }
);

export const UserRoleSchema = new mongoose.Schema<IUserRole>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
    isPrimary: { type: Boolean, default: false },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    context: {
      department: String,
      project: String,
      location: String,
      temporary: Boolean,
      reason: String,
    },
    isActive: { type: Boolean, default: true },
    deletedAt: Date,
  },
  { timestamps: true }
);
// Compound index for efficient lookups
UserRoleSchema.index({ userId: 1, memberId: 1 });
UserRoleSchema.index({ roleId: 1, memberId: 1 });
UserRoleSchema.index({ userId: 1, roleId: 1, memberId: 1 }, { unique: true });

// export const NotificationPreferenceSchema = new mongoose.Schema<INotificationPreference>(
// 	{
// 		roleId: { type: String, required: true, ref: "Role" },
// 		category: { type: String, required: true },
// 		notificationTypes: { type: mongoose.Schema.Types.Mixed, required: true },
// 	},
// 	{ timestamps: true }
// );

export const Role = mongoose.model("Role", RoleSchema);
export const Permission = mongoose.model("Permission", PermissionSchema);
export const RolePermission = mongoose.model(
  "RolePermission",
  RolePermissionSchema
);
export const UserRole = mongoose.model("UserRole", UserRoleSchema);
// export const NotificationPreference = mongoose.model(
// 	"NotificationPreference",
// 	NotificationPreferenceSchema
// );
