import { z } from "zod";

// Query schemas
export const rolesQuerySchema = z.object({
  q: z.optional(z.string()),
  memberId: z.optional(z.string()),
  sort: z.optional(z.string()),
  order: z.optional(z.union([z.literal("asc"), z.literal("desc")])),
  offset: z.optional(z.coerce.number()),
  limit: z.optional(z.coerce.number()),
});

export const permissionsQuerySchema = z.object({
  q: z.optional(z.string()),
  roleId: z.optional(z.string()),
  resource: z.optional(z.string()),
  action: z.optional(z.string()),
  sort: z.optional(z.string()),
  order: z.optional(z.union([z.literal("asc"), z.literal("desc")])),
  offset: z.optional(z.coerce.number()),
  limit: z.optional(z.coerce.number()),
});

// Custom schemas with additional validation
export const roleSchema = z.object({
  id: z.optional(z.string()),
  name: z.string().min(1).max(50),
  description: z.optional(z.string()),
  isSystem: z.optional(z.boolean()),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  level: z.number().optional(),
  permissionCount: z.number().optional(),
});

export const conditionSchema = z.object({
  field: z.string(),
  operator: z.union([
    z.literal("equals"),
    z.literal("contains"),
    z.literal("in"),
    z.literal("gt"),
    z.literal("lt"),
    z.literal("between"),
  ]),
  value: z.any(),
});

export const permissionSchema = z.object({
  id: z.optional(z.string()),
  name: z.string().min(1).max(50),
  roleId: z.optional(z.string().min(1)),
  action: z.string().min(1),
  resource: z.string().min(1),
  description: z.optional(z.string()),
  conditions: z.optional(z.array(conditionSchema)),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  role: z.optional(z.string()),
});

export const notificationPreferenceSchema = z.object({
  id: z.optional(z.string()),
  roleId: z.string().min(1),
  category: z.string().min(1),
  notificationTypes: z.array(z.string()),
});

// Export types for use in controllers
export type RolesQuery = z.infer<typeof rolesQuerySchema>;
export type PermissionsQuery = z.infer<typeof permissionsQuerySchema>;
export type Role = z.infer<typeof roleSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type NotificationPreference = z.infer<
  typeof notificationPreferenceSchema
>;
