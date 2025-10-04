import { z } from "zod";
import { PermissionAction } from "./rbac.type";

// Role validation schemas
export const roleSchema = z.object({
  _id: z.string().optional(),
  name: z
    .string()
    .min(1, "Role name is required")
    .max(50, "Role name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s_-]+$/,
      "Role name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  description: z
    .string()
    .max(255, "Description must be less than 255 characters")
    .optional(),
  isSystem: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  level: z.number().min(0).max(1000).optional(),
});

export const roleUpdateSchema = roleSchema.partial();

// Permission validation schemas
export const permissionConditionSchema = z.object({
  field: z.string().min(1, "Field is required"),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
  ]),
  value: z.any(),
});

export const permissionSchema = z.object({
  _id: z.string().optional(),
  id: z.string().optional(),
  name: z
    .string()
    .min(1, "Permission name is required")
    .max(50, "Permission name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s_.-:]+$/,
      "Permission name can only contain letters, numbers, spaces, dots, hyphens, colons, and underscores"
    ),
  description: z
    .string()
    .max(255, "Description must be less than 255 characters")
    .optional(),
  resource: z
    .string()
    .min(1, "Resource is required")
    .max(50, "Resource must be less than 50 characters"),
  action: z.enum(PermissionAction, {
    error: () => ({ message: "Please select a valid action" }),
  }),
  conditions: z.array(permissionConditionSchema).optional(),
});

export const permissionUpdateSchema = permissionSchema.partial();

// Role assignment schemas
export const roleAssignmentSchema = z.object({
  userId: z.string().min(1, "User is required"),
  roleId: z.string().min(1, "Role is required"),
  memberId: z.string().optional(),
  // isPrimary: z.boolean().optional().default(false),
  expiresAt: z.iso.datetime().optional(),
  context: z
    .object({
      department: z.string().optional(),
      project: z.string().optional(),
      location: z.string().optional(),
      temporary: z.boolean().optional(),
      reason: z.string().max(255).optional(),
    })
    .optional(),
});

// Permission assignment schemas
export const permissionAssignmentSchema = z.object({
  roleId: z.string().min(1, "Role is required"),
  permissionId: z.string().min(1, "Permission is required"),
  granted: z.boolean().default(true),
  conditions: z.record(z.string(), z.any()).optional(),
  expiresAt: z.iso.datetime().optional(),
});

// Filter schemas
export const roleFilterSchema = z.object({
  search: z.string().optional(),
  memberId: z.string().optional(),
  isSystem: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.string().optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const permissionFilterSchema = z.object({
  search: z.string().optional(),
  roleId: z.string().optional(),
  resource: z.string().optional(),
  action: z.enum(PermissionAction).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(10),
  sortBy: z.string().optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Bulk operations schemas
export const bulkRoleDeleteSchema = z.object({
  roleIds: z.array(z.string()).min(1, "At least one role must be selected"),
});

export const bulkPermissionDeleteSchema = z.object({
  permissionIds: z
    .array(z.string())
    .min(1, "At least one permission must be selected"),
});

export const bulkRoleAssignmentSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user must be selected"),
  roleId: z.string().min(1, "Role is required"),
  memberId: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  expiresAt: z.iso.datetime().optional(),
});

// Export types
export type RoleFormData = z.infer<typeof roleSchema>;
export type RoleUpdateFormData = z.infer<typeof roleUpdateSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
export type PermissionUpdateFormData = z.infer<typeof permissionUpdateSchema>;
export type RoleAssignmentFormData = z.infer<typeof roleAssignmentSchema>;
export type PermissionAssignmentFormData = z.infer<
  typeof permissionAssignmentSchema
>;
export type RoleFilterFormData = z.infer<typeof roleFilterSchema>;
export type PermissionFilterFormData = z.infer<typeof permissionFilterSchema>;
export type BulkRoleDeleteFormData = z.infer<typeof bulkRoleDeleteSchema>;
export type BulkPermissionDeleteFormData = z.infer<
  typeof bulkPermissionDeleteSchema
>;
export type BulkRoleAssignmentFormData = z.infer<
  typeof bulkRoleAssignmentSchema
>;
