import { Permission } from "@kaa/models";
import {
  permissionSchema,
  permissionsQuerySchema,
  roleSchema,
  rolesQuerySchema,
} from "@kaa/schemas";
import { permissionService, rbacService, roleService } from "@kaa/services";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { z } from "zod";
import { accessPlugin } from "./rbac.plugin";

export const rbacController = new Elysia()
  .group("roles", (app) =>
    app
      .use(accessPlugin("roles", "read"))
      .get(
        "/",
        async ({ set, query, user }) => {
          const { q, memberId, sort, order, offset, limit } = query;

          const result = await roleService.getRoles({
            q,
            memberId: memberId ? memberId : user?.memberId,
            sort,
            order,
            offset,
            limit,
          });

          const data = result.data.map((role) => ({
            name: role.name,
            id: role.id,
            isSystem: role.isSystem,
            description: role.description,
            level: role.level,
            createdAt: role.createdAt.toString(),
            permissionCount: role.permissionCount,
          }));

          set.status = 200;
          return {
            status: "success",
            roles: data,
            pagination: result.pagination,
          };
        },
        {
          query: rolesQuerySchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              roles: z.array(roleSchema),
              pagination: z.object({
                total: z.number(),
                offset: z.number(),
                limit: z.number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Get all roles",
            summary: "Get all roles",
          },
        }
      )
      .use(accessPlugin("roles", "read"))
      .get(
        "/:id",
        async ({ set, params }) => {
          const { id } = params;

          const role = await roleService.getRoleById(id);

          if (!role) {
            set.status = 404;
            return {
              status: "error",
              message: "Role not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            role: {
              id: role.id,
              name: role.name,
              description: role.description,
              isSystem: role.isSystem,
              permissionCount: role.permissionCount,
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          response: {
            200: z.object({
              status: z.literal("success"),
              role: roleSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Get a role by ID",
            summary: "Get a role by ID",
          },
        }
      )
      .use(accessPlugin("roles", "read"))
      .get(
        "/users/:roleId",
        async ({ set, params, query }) => {
          const { roleId } = params;
          const { limit, offset } = query;
          const options = {
            limit: limit ? Number.parseInt(limit, 10) : 10,
            offset: offset ? Number.parseInt(offset, 10) : 0,
          };

          const result = await rbacService.getUsersWithRole(roleId, options);

          set.status = 200;
          return {
            status: "success",
            users: result.users,
            pagination: result.pagination,
          };
        },
        {
          params: t.Object({
            roleId: t.String(),
          }),
          query: t.Object({
            limit: t.Optional(t.String()),
            offset: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              users: t.Array(
                t.Any()
                // t.Object({
                // 	id: t.String(),
                // 	name: t.String(),
                // 	email: t.String(),
                // })
              ),
              pagination: t.Object({
                total: t.Number(),
                offset: t.Number(),
                limit: t.Number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Get users by role",
            summary: "Get users by role",
          },
        }
      )
      .use(accessPlugin("roles", "create"))
      .post(
        "/",
        async ({ set, body }) => {
          const result = await roleService.createRole(body);

          set.status = 201;
          return {
            status: "success",
            role: {
              id: result.id,
              name: result.name,
              description: result.description,
              isSystem: result.isSystem,
              createdAt: result.createdAt.toString(),
              level: result.level,
              permissionCount: 0, // result.permissionCount,
            },
          };
        },
        {
          body: roleSchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              role: roleSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Create a new role",
            summary: "Create a new role",
          },
        }
      )
      .use(accessPlugin("roles", "update"))
      .put(
        "/:id",
        async ({ set, params, body }) => {
          const { id } = params;

          const result = await roleService.updateRole(id, body);

          if (!result) {
            set.status = 404;
            return {
              status: "error",
              message: "Role not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            role: {
              id: result?.id,
              name: result?.name,
              description: result?.description,
              isSystem: result?.isSystem,
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: roleSchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              role: roleSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Update a role",
            summary: "Update a role",
          },
        }
      )
      .use(accessPlugin("roles", "delete"))
      .delete(
        "/:id",
        async ({ set, params }) => {
          const { id } = params;

          const result = await roleService.deleteRole(id);

          if (!result.success) {
            set.status = 404;
            return {
              status: "error",
              message: result.error || "Role not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              success: result.success,
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Delete a role",
            summary: "Delete a role",
          },
        }
      )
  )
  .group("permissions", (app) =>
    app
      .use(accessPlugin("permissions", "read"))
      .get(
        "/",
        async ({ set, query }) => {
          const { q, roleId, resource, action, sort, order, offset, limit } =
            query;

          const result = await permissionService.getPermissions({
            q,
            roleId,
            resource,
            action,
            sort,
            order,
            offset,
            limit,
          });

          const data = result.data.map((permission) => ({
            id: (permission._id as mongoose.Types.ObjectId).toString(),
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            conditions: (permission.conditions as any)?.map(
              (condition: any) => ({
                ...condition,
                field: condition.field.toString(),
              })
            ),
            createdAt: permission.createdAt.toString(),
          }));

          set.status = 200;
          return {
            status: "success",
            permissions: data,
            pagination: result.pagination,
            meta: result.meta,
          };
        },
        {
          query: permissionsQuerySchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              permissions: z.array(permissionSchema),
              pagination: z.object({
                total: z.number(),
                offset: z.number(),
                limit: z.number(),
              }),
              meta: z.object({
                resources: z.array(z.string()),
                actions: z.array(z.string()),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get permissions",
            summary: "Get permissions",
          },
        }
      )
      // GET /permissions/all-available
      // Returns ALL available permissions in the system (for creating new roles)
      .get(
        "/all-available",
        async ({ set }) => {
          try {
            // This returns all possible permissions that can be assigned
            // Useful for creating new roles or comparing
            const allPermissions = await Permission.find()
              .select("name action resource description")
              .sort({ resource: 1, action: 1 })
              .lean();

            if (!allPermissions) {
              set.status = 404;
              return {
                status: "error",
                message: "No permissions found",
              };
            }

            const data = allPermissions.map((permission) => ({
              id: (permission._id as mongoose.Types.ObjectId).toString(),
              name: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
            }));

            // Group by resource for easier consumption
            const grouped = data.reduce(
              (acc, perm) => {
                if (!acc[perm.resource]) {
                  acc[perm.resource] = [];
                }
                acc[perm.resource].push(perm);
                return acc;
              },
              {} as Record<string, typeof data>
            );

            const actions = Object.keys(grouped).flatMap((resource) =>
              grouped[resource].map((perm) => perm.action)
            );
            const uniqueActions = [...new Set(actions)];

            set.status = 200;
            return {
              status: "success",
              data: {
                permissions: data,
                grouped,
                resources: Object.keys(grouped),
                actions: uniqueActions,
              },
              meta: {
                total: data.length,
                resourceCount: Object.keys(grouped).length,
                actionCount: uniqueActions.length,
              },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to get all available permissions",
            };
          }
        },
        {
          response: {
            200: z.object({
              status: z.literal("success"),
              data: z.object({
                permissions: z.array(permissionSchema),
                grouped: z.record(z.string(), z.array(permissionSchema)),
                resources: z.array(z.string()),
                actions: z.array(z.string()),
              }),
              meta: z.object({
                total: z.number(),
                resourceCount: z.number(),
                actionCount: z.number(),
              }),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get all available permissions",
            summary: "Get all available permissions",
          },
        }
      )
      .use(accessPlugin("permissions", "read"))
      .get(
        "/:id",
        async ({ set, params }) => {
          const { id } = params;

          const permission = await permissionService.getPermissionById(id);

          if (!permission) {
            set.status = 404;
            return {
              status: "error",
              message: "Permission not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            permission: {
              id: (permission._id as mongoose.Types.ObjectId).toString(),
              name: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
              conditions: (permission.conditions as any)?.map(
                (condition: any) => ({
                  ...condition,
                  field: condition.field.toString(),
                })
              ),
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          response: {
            200: z.object({
              status: z.literal("success"),
              permission: permissionSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get a permission by ID",
            summary: "Get a permission by ID",
          },
        }
      )
      .use(accessPlugin("permissions", "create"))
      .post(
        "/",
        async ({ set, body }) => {
          const result = await permissionService.createPermission({
            name: body.name,
            description: body.description,
            resource: body.resource,
            action: body.action,
            conditions: body.conditions,
          });

          set.status = 201;
          return {
            status: "success",
            permission: {
              id: (result._id as mongoose.Types.ObjectId).toString(),
            },
          };
        },
        {
          body: permissionSchema,
          response: {
            201: z.object({
              status: z.literal("success"),
              permission: permissionSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Create a new permission",
            summary: "Create a new permission",
          },
        }
      )
      .use(accessPlugin("permissions", "update"))
      .put(
        "/:id",
        async ({ set, params, body }) => {
          const { id } = params;

          const result = await permissionService.updatePermission(id, {
            name: body.name,
            description: body.description,
            resource: body.resource,
            action: body.action,
            conditions: body.conditions,
          });

          if (!result) {
            set.status = 404;
            return {
              status: "error",
              message: "Permission not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            permission: {
              id: (result._id as mongoose.Types.ObjectId).toString(),
              name: result.name,
              description: result.description,
              resource: result.resource,
              action: result.action,
              conditions: (result.conditions as any)?.map((condition: any) => ({
                ...condition,
                field: condition.field.toString(),
              })),
            },
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          body: permissionSchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              permission: permissionSchema,
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Update a permission",
            summary: "Update a permission",
          },
        }
      )
      .use(accessPlugin("permissions", "delete"))
      .delete(
        "/:id",
        async ({ set, params }) => {
          const { id } = params;

          const result = await permissionService.deletePermission(id);

          if (!result) {
            set.status = 404;
            return {
              status: "error",
              message: "Permission not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            permission: result,
          };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              permission: t.Boolean(),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Delete a permission",
            summary: "Delete a permission",
          },
        }
      )
  )
  .group("role/permissions", (app) =>
    app
      .use(accessPlugin("roles", "read"))
      .get(
        "/:roleId",
        async ({ set, params, query }) => {
          const { roleId } = params;
          const { sort, order } = query;

          // Check if role exists
          const role = await roleService.getRoleById(roleId);
          if (!role) {
            set.status = 404;
            return {
              status: "error",
              message: "Role not found",
            };
          }

          const result = await permissionService.getPermissionsByRole({
            roleId,
            sort,
            order,
          });

          const rolePermissions = result.data.map((permission) => ({
            id: (
              permission.permission._id as mongoose.Types.ObjectId
            ).toString(),
            name: permission.permission.name,
            description: permission.permission.description,
            resource: permission.permission.resource,
            action: permission.permission.action,
            conditions: (permission.permission.conditions as any)?.map(
              (condition: any) => ({
                ...condition,
                field: (condition.field as mongoose.Types.ObjectId).toString(),
              })
            ),
            role: permission.role.name,
            createdAt: permission.permission.createdAt.toString(),
            updatedAt: permission.permission.updatedAt.toString(),
          }));

          set.status = 200;
          return {
            status: "success",
            data: rolePermissions,
            meta: result.meta,
          };
        },
        {
          params: t.Object({
            roleId: t.String(),
          }),
          query: permissionsQuerySchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              data: z.array(permissionSchema),
              meta: z.object({
                total: z.number(),
                resources: z.array(z.string()),
                actions: z.array(z.string()),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get permissions by role ID",
            summary: "Get permissions by role ID",
          },
        }
      )
      .use(accessPlugin("roles", "update"))
      .post(
        "/:roleId/:permissionId",
        async ({ set, params, user }) => {
          const { roleId, permissionId } = params;

          const result = await rbacService.addPermissionToRole(
            roleId,
            permissionId,
            user.id
          );

          if (!result) {
            set.status = 404;
            return {
              status: "error",
              message: "Permission not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              success: true,
            },
          };
        },
        {
          params: t.Object({
            roleId: t.String(),
            permissionId: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Add permission to role",
            summary: "Add permission to role",
          },
        }
      )
      .use(accessPlugin("roles", "update"))
      .put(
        "/:roleId",
        async ({ set, params, body, user }) => {
          const { roleId } = params;
          const { permissionIds } = body;

          // Check if role exists
          const role = await roleService.getRoleById(roleId);
          if (!role) {
            set.status = 404;
            return {
              status: "error",
              message: "Role not found",
            };
          }

          const result = await rbacService.updateRolePermissions(
            roleId,
            permissionIds,
            user?.id
          );

          if (!result.success) {
            set.status = 500;
            return {
              status: "error",
              message: result.error || "Failed to update role permissions",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              updatedCount: result.updatedCount || 0,
            },
          };
        },
        {
          params: t.Object({
            roleId: t.String(),
          }),
          body: t.Object({
            permissionIds: t.Array(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                updatedCount: t.Number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Update role permissions",
            summary: "Update role permissions",
          },
        }
      )
      .use(accessPlugin("roles", "delete"))
      .delete(
        "/:roleId/:permissionId",
        async ({ set, params }) => {
          const { roleId, permissionId } = params;

          // Check if role exists
          const role = await roleService.getRoleById(roleId);
          if (!role) {
            set.status = 404;
            return {
              status: "error",
              message: "Role not found",
            };
          }

          // Check if permission exists
          const permission =
            await permissionService.getPermissionById(permissionId);
          if (!permission) {
            set.status = 404;
            return {
              status: "error",
              message: "Permission not found",
            };
          }

          const result = await rbacService.removePermissionFromRole(
            roleId,
            permissionId
          );

          if (!result) {
            set.status = 500;
            return {
              status: "error",
              message: "Failed to remove permission from role",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              success: true,
            },
          };
        },
        {
          params: t.Object({
            roleId: t.String(),
            permissionId: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Remove permission from role",
            summary: "Remove permission from role",
          },
        }
      )
  )
  .group("rbac", (app) =>
    app
      // Role assignment endpoints
      .use(accessPlugin("roles", "update"))
      .post(
        "/assign-role",
        async ({ set, body, user }) => {
          try {
            const { userId, roleId, memberId, isPrimary, expiresAt } = body;
            const result = await rbacService.assignRoleToUser(
              userId,
              roleId,
              memberId || user?.memberId,
              isPrimary,
              expiresAt ? new Date(expiresAt).toISOString() : undefined
            );

            if (!result) {
              set.status = 400;
              return {
                status: "error",
                message: "Failed to assign role to user",
              };
            }

            set.status = 201;
            return {
              status: "success",
              data: result,
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            roleId: t.String(),
            memberId: t.Optional(t.String()),
            isPrimary: t.Optional(t.Boolean()),
            expiresAt: t.Optional(t.String()),
          }),
          response: {
            201: t.Object({
              status: t.Literal("success"),
              data: t.Any(),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Assign role to user",
            summary: "Assign role to user",
          },
        }
      )
      .use(accessPlugin("roles", "update"))
      .delete(
        "/remove-role",
        async ({ set, body, user }) => {
          try {
            const { userId, roleId, memberId } = body;
            const result = await rbacService.removeRoleFromUser(
              userId,
              roleId,
              memberId || user?.memberId
            );

            if (!result) {
              set.status = 400;
              return {
                status: "error",
                message: "Failed to remove role from user",
              };
            }

            set.status = 200;
            return {
              status: "success",
              data: { success: true },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            roleId: t.String(),
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Remove role from user",
            summary: "Remove role from user",
          },
        }
      )
      // User roles endpoint
      .use(accessPlugin("roles", "read"))
      .get(
        "/users/:userId/roles",
        async ({ set, params, query, user }) => {
          try {
            const { userId } = params;
            const { memberId } = query;
            const result = await rbacService.getUserRoles(
              userId,
              memberId || user?.memberId
            );

            set.status = 200;
            return {
              status: "success",
              data: result,
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          query: t.Object({
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Array(t.Any()),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Get user roles",
            summary: "Get user roles",
          },
        }
      )
      // Permission assignment endpoints
      .use(accessPlugin("permissions", "update"))
      .post(
        "/assign-permission",
        async ({ set, body, user }) => {
          try {
            const { roleId, permissionId } = body;
            const result = await rbacService.addPermissionToRole(
              roleId,
              permissionId,
              user?.id
            );

            if (!result) {
              set.status = 400;
              return {
                status: "error",
                message: "Failed to assign permission to role",
              };
            }

            set.status = 200;
            return {
              status: "success",
              data: { success: true },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            roleId: t.String(),
            permissionId: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Assign permission to role",
            summary: "Assign permission to role",
          },
        }
      )
      .use(accessPlugin("permissions", "update"))
      .delete(
        "/remove-permission",
        async ({ set, body }) => {
          try {
            const { roleId, permissionId } = body;
            const result = await rbacService.removePermissionFromRole(
              roleId,
              permissionId
            );

            if (!result) {
              set.status = 400;
              return {
                status: "error",
                message: "Failed to remove permission from role",
              };
            }

            set.status = 200;
            return {
              status: "success",
              data: { success: true },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            roleId: t.String(),
            permissionId: t.String(),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                success: t.Boolean(),
              }),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Remove permission from role",
            summary: "Remove permission from role",
          },
        }
      )
      // Get role permissions endpoint
      .use(accessPlugin("permissions", "read"))
      .get(
        "/roles/:roleId/permissions",
        async ({ set, params, query }) => {
          try {
            const { roleId } = params;
            const { q, resource, action, sort, order, offset, limit } = query;

            // Check if role exists
            const role = await roleService.getRoleById(roleId);
            if (!role) {
              set.status = 404;
              return {
                status: "error",
                message: "Role not found",
              };
            }

            const result = await permissionService.getPermissions({
              q,
              roleId,
              resource,
              action,
              sort,
              order,
              offset,
              limit,
            });

            const data = result.data.map((permission) => ({
              id: (permission._id as mongoose.Types.ObjectId).toString(),
              name: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
              conditions: (permission.conditions as any)?.map(
                (condition: any) => ({
                  ...condition,
                  field: (
                    condition.field as mongoose.Types.ObjectId
                  ).toString(),
                })
              ),
            }));

            set.status = 200;
            return {
              status: "success",
              data,
              pagination: result.pagination,
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          params: t.Object({
            roleId: t.String(),
          }),
          query: permissionsQuerySchema,
          response: {
            200: z.object({
              status: z.literal("success"),
              data: z.array(permissionSchema),
              pagination: z.object({
                total: z.number(),
                offset: z.number(),
                limit: z.number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get permissions by role ID",
            summary: "Get permissions by role ID",
          },
        }
      )
      // Permission checking endpoints
      .use(accessPlugin("permissions", "read"))
      .post(
        "/check-permission",
        async ({ set, body, user }) => {
          try {
            const { userId, resource, action, memberId } = body;
            const result = await rbacService.checkUserPermission(
              userId,
              resource,
              action,
              memberId || user?.memberId
            );

            set.status = 200;
            return {
              status: "success",
              data: { hasPermission: result },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            resource: t.String(),
            action: t.String(),
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                hasPermission: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Check user permission",
            summary: "Check user permission",
          },
        }
      )
      // Get user permissions endpoint
      .use(accessPlugin("permissions", "read"))
      .get(
        "/users/:userId/permissions",
        async ({ set, params, query }) => {
          try {
            const { userId } = params;
            const { memberId } = query;
            const result = await rbacService.getUserPermissions(userId);

            set.status = 200;
            return {
              status: "success",
              data: result,
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          params: t.Object({
            userId: t.String(),
          }),
          query: t.Object({
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Array(t.Any()),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Get user permissions",
            summary: "Get user permissions",
          },
        }
      )
      // Multiple permission checks
      .use(accessPlugin("permissions", "read"))
      .post(
        "/check-permissions",
        async ({ set, body }) => {
          try {
            const { userId, permissions, memberId } = body;
            const result = await rbacService.hasAllPermissions(
              userId,
              permissions
            );

            set.status = 200;
            return {
              status: "success",
              data: { hasAllPermissions: result },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            permissions: t.Array(
              t.Object({
                resource: t.String(),
                action: t.String(),
              })
            ),
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                hasAllPermissions: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Check if user has all permissions",
            summary: "Check if user has all permissions",
          },
        }
      )
      .use(accessPlugin("permissions", "read"))
      .post(
        "/check-any-permission",
        async ({ set, body }) => {
          try {
            const { userId, permissions, memberId } = body;
            const result = await rbacService.hasAnyPermission(
              userId,
              permissions
            );

            set.status = 200;
            return {
              status: "success",
              data: { hasAnyPermission: result },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userId: t.String(),
            permissions: t.Array(
              t.Object({
                resource: t.String(),
                action: t.String(),
              })
            ),
            memberId: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                hasAnyPermission: t.Boolean(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Check if user has any of the permissions",
            summary: "Check if user has any of the permissions",
          },
        }
      )
      // Bulk operations
      .use(accessPlugin("roles", "delete"))
      .post(
        "/roles/bulk-delete",
        async ({ set, body }) => {
          try {
            const { roleIds } = body;
            const result = await rbacService.bulkDeleteRoles(roleIds);

            set.status = 200;
            return {
              status: "success",
              data: { deletedCount: result.deletedCount },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            roleIds: t.Array(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                deletedCount: t.Number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Bulk delete roles",
            summary: "Bulk delete roles",
          },
        }
      )
      .use(accessPlugin("permissions", "delete"))
      .post(
        "/permissions/bulk-delete",
        async ({ set, body }) => {
          try {
            const { permissionIds } = body;
            const result =
              await rbacService.bulkDeletePermissions(permissionIds);

            set.status = 200;
            return {
              status: "success",
              data: { deletedCount: result.deletedCount },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            permissionIds: t.Array(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                deletedCount: t.Number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["permissions"],
            description: "Bulk delete permissions",
            summary: "Bulk delete permissions",
          },
        }
      )
      .use(accessPlugin("roles", "update"))
      .post(
        "/bulk-assign-roles",
        async ({ set, body, user }) => {
          try {
            const { userIds, roleId, memberId, isPrimary, expiresAt } = body;
            const result = await rbacService.bulkAssignRoles(userIds, roleId, {
              memberId: memberId || user?.memberId,
              isPrimary,
              expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            });

            set.status = 200;
            return {
              status: "success",
              data: { assignedCount: result.assignedCount },
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message: "Internal server error",
            };
          }
        },
        {
          body: t.Object({
            userIds: t.Array(t.String()),
            roleId: t.String(),
            memberId: t.Optional(t.String()),
            isPrimary: t.Optional(t.Boolean()),
            expiresAt: t.Optional(t.String()),
          }),
          response: {
            200: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                assignedCount: t.Number(),
              }),
            }),
            403: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["roles"],
            description: "Bulk assign roles to users",
            summary: "Bulk assign roles to users",
          },
        }
      )
  )
  .group("user/preferences", (app) =>
    app.get(
      "/",
      ({ set }) => {
        set.status = 200;
        return {
          status: "success",
          data: [],
        };
      },
      {
        detail: {
          tags: ["preferences"],
          summary: "Get user preferences",
          description: "Get user preferences",
        },
      }
    )
  )
  .group("user/roles", (app) =>
    app.get(
      "/",
      ({ set }) => {
        set.status = 200;
        return {
          status: "success",
          data: [],
        };
      },
      {
        detail: {
          tags: ["roles"],
          summary: "Get user roles",
          description: "Get user roles",
        },
      }
    )
  );
