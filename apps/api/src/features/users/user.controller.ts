import {
  AuditActionType,
  AuditEntityType,
  AuditStatus,
} from "@kaa/models/types";
import {
  RegisterUserRequestSchema,
  RegisterUserResponseSchema,
  type UserResponse,
  UserResponseSchema,
  type UsersResponse,
  UserUpdateSchema,
} from "@kaa/schemas";
import { auditService, userService } from "@kaa/services";
import { BadRequestError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import { ip } from "elysia-ip";
import type mongoose from "mongoose";
import { z } from "zod";
import { accessPlugin } from "../rbac/rbac.plugin";

export const usersController = new Elysia({
  detail: {
    tags: ["users"],
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
}).group("/users", (app) =>
  app
    .use(ip())
    .use(accessPlugin("users", "create"))
    .post(
      "/",
      async ({ body, set }) => {
        try {
          const existingUser = await userService.getUserBy({
            email: body.email,
          });

          if (existingUser) {
            set.status = 422;
            return {
              status: "error",
              message: "User with this email already exists",
            };
          }

          const existingByUsername = await userService.getUserBy({
            username: body.username,
          });
          if (existingByUsername) {
            set.status = 422;
            return {
              status: "error",
              message: "Username already in use",
            };
          }

          const existingByPhone = await userService.getUserBy({
            phone: body.phone,
          });
          if (existingByPhone) {
            set.status = 422;
            return {
              status: "error",
              message: "Phone number already in use",
            };
          }

          const newUser = await userService.createUser({ body });

          set.status = 201;
          return { status: "success", user: newUser };
        } catch (error) {
          set.status = 400;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Registration failed",
          };
        }
      },
      {
        body: RegisterUserRequestSchema,
        response: {
          201: z.object({
            status: z.literal("success"),
            user: RegisterUserResponseSchema,
          }),
          422: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Create a new user",
          description: "Create a new user account",
        },
      }
    )
    .use(accessPlugin("users", "read"))
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const { memberId, status, page, limit } = query;
          const { users, pagination } = await userService.getUsers(
            {
              status,
              memberId,
            },
            { page, limit }
          );
          set.status = 200;

          const usersRes: UsersResponse = users.map((user) => ({
            id: (user._id as mongoose.Types.ObjectId).toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: {
              _id: (
                (user.role as any)._id as mongoose.Types.ObjectId
              ).toString(),
              name: (user.role as any).name,
            },
            phone: user.phone,
            status: user.status,
            memberId: user.memberId
              ? {
                  _id: (
                    (user.memberId as any)._id as mongoose.Types.ObjectId
                  ).toString(),
                  name: (user.memberId as any).name,
                }
              : undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
          }));

          return { status: "success", users: usersRes, pagination };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to retrieve users",
          };
        }
      },
      {
        query: t.Object({
          memberId: t.Optional(t.String()),
          status: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        response: {
          200: z.object({
            status: z.literal("success"),
            users: z.array(UserResponseSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              pages: z.number(),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Get users",
          description: "Get users",
        },
      }
    )
    .use(accessPlugin("users", "read"))
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const user = await userService.getUserById(params.id);
          set.status = 200;

          const userRes: UserResponse = {
            id: (user._id as mongoose.Types.ObjectId).toString(),
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: {
              _id: (
                (user.role as any)._id as mongoose.Types.ObjectId
              ).toString(),
              name: (user.role as any).name,
            },
            phone: user.phone,
            status: user.status,
            memberId: user.memberId
              ? {
                  _id: (
                    (user.memberId as any)._id as mongoose.Types.ObjectId
                  ).toString(),
                  name: (user.memberId as any).name,
                }
              : undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
          };

          return { status: "success", user: userRes };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to retrieve user",
          };
        }
      },
      {
        response: {
          200: z.object({
            status: z.literal("success"),
            user: UserResponseSchema,
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Get user by id",
          description: "Get a user by id",
        },
      }
    )
    .use(accessPlugin("users", "update"))
    .patch(
      "/:id",
      async ({ params, body, set, user, role }) => {
        try {
          // Non-admin users can only update their own profile
          if (user && role.name !== "admin" && user.id !== params.id) {
            throw new BadRequestError("You can only update your own profile");
          }

          const updatedUser = await userService.updateUser({
            body,
            params: { id: params.id },
          });

          const userRes: UserResponse = {
            id: (updatedUser._id as mongoose.Types.ObjectId).toString(),
            username: updatedUser.username,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            role: {
              _id: (
                (updatedUser.role as any)._id as mongoose.Types.ObjectId
              ).toString(),
              name: (updatedUser.role as any).name,
            },
            phone: updatedUser.phone,
            status: updatedUser.status,
            memberId: updatedUser?.memberId
              ? {
                  _id: (
                    (updatedUser?.memberId as any)
                      ._id as mongoose.Types.ObjectId
                  ).toString(),
                  name: (updatedUser?.memberId as any).name,
                }
              : undefined,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            lastLoginAt: updatedUser.lastLoginAt,
          };

          set.status = 200;
          return { status: "success", user: userRes };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Failed to update user",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        body: UserUpdateSchema,
        response: {
          200: z.object({
            status: z.literal("success"),
            user: UserResponseSchema,
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Update a user",
          description: "Update a user account",
        },
      }
    )
    .use(accessPlugin("users", "delete"))
    .delete(
      "/:id",
      async ({ params, set, ip, user, headers }) => {
        try {
          const deletedUser = await userService.deleteUser({
            params: { id: params.id },
          });

          // Create audit log
          await auditService.auditLog({
            userId: user.id,
            memberId: user.memberId,
            action: AuditActionType.DELETE,
            resource: AuditEntityType.USER,
            status: AuditStatus.SUCCESS,
            resourceId: deletedUser.id,
            description: `Deleted user: ${user.email}`,
            ipAddress: ip,
            userAgent: headers["user-agent"],
          });

          set.status = 200;
          return { status: "success", user: deletedUser };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Failed to delete user",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: z.object({
            status: z.literal("success"),
            user: z.object({
              id: z.string(),
              username: z.string(),
              email: z.string(),
            }),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Delete a user",
          description: "Delete a user account",
        },
      }
    )
    .use(accessPlugin("users", "update"))
    .post(
      "/password/change",
      async ({ set, user, body }) => {
        try {
          const { currentPassword, newPassword } = body;

          // Find the user
          const userObj = await userService.getUserById(user.id);

          if (!userObj) {
            set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          // Check if current password is correct
          const isMatch = await userObj.comparePassword(currentPassword);
          if (!isMatch) {
            set.status = 400;
            return {
              status: "error",
              message: "Current password is incorrect",
            };
          }

          // Update password
          userObj.password = newPassword;
          userObj.passwordChangedAt = new Date();
          await userObj.save();

          return {
            status: "success",
            message: "Password changed successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Failed to change password",
          };
        }
      },
      {
        body: t.Object({
          currentPassword: t.String(),
          newPassword: t.String(),
        }),
        response: {
          200: t.Object({
            status: t.Literal("success"),
            message: t.String(),
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["users"],
          summary: "Change password",
          description: "Change the authenticated user's password",
        },
      }
    )
);
