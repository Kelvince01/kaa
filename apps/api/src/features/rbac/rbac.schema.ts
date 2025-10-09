import { t } from "elysia";

// Query schemas
export const rolesQuerySchema = t.Object({
  q: t.Optional(t.String()),
  memberId: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  offset: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export const permissionsQuerySchema = t.Object({
  q: t.Optional(t.String()),
  roleId: t.Optional(t.String()),
  resource: t.Optional(t.String()),
  action: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  offset: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

// Custom schemas with additional validation
export const roleSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 1, maxLength: 50 }),
  description: t.Optional(t.String()),
  isSystem: t.Optional(t.Boolean()),
});

export const conditionSchema = t.Object({
  field: t.String(),
  operator: t.Union([
    t.Literal("equals"),
    t.Literal("contains"),
    t.Literal("in"),
    t.Literal("gt"),
    t.Literal("lt"),
    t.Literal("between"),
  ]),
  value: t.Any(),
});

export const permissionSchema = t.Object({
  id: t.Optional(t.String()),
  name: t.String({ minLength: 1, maxLength: 50 }),
  roleId: t.Optional(t.String({ minLength: 1 })),
  action: t.String({ minLength: 1 }),
  resource: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  conditions: t.Optional(t.Array(conditionSchema)),
});

export const notificationPreferenceSchema = t.Object({
  id: t.Optional(t.String()),
  roleId: t.String({ minLength: 1 }),
  category: t.String({ minLength: 1 }),
  notificationTypes: t.Array(t.String()),
});

// Export types for use in controllers
export type RolesQuery = typeof rolesQuerySchema.static;
export type PermissionsQuery = typeof permissionsQuerySchema.static;
export type Role = typeof roleSchema.static;
export type Permission = typeof permissionSchema.static;
export type NotificationPreference = typeof notificationPreferenceSchema.static;
