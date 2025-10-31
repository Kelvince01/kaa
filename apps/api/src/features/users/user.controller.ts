import { User } from "@kaa/models";
import {
  AuditActionType,
  AuditEntityType,
  AuditStatus,
} from "@kaa/models/types";
import { auditService, userService } from "@kaa/services";
import { BadRequestError } from "@kaa/utils";
import Elysia, { t } from "elysia";
import { ip } from "elysia-ip";
import type mongoose from "mongoose";
import {
  RegisterUserRequestSchema,
  RegisterUserResponseSchema,
} from "../auth/auth.schema";
import { accessPlugin } from "../rbac/rbac.plugin";
import {
  type UserResponse,
  UserResponseSchema,
  type UsersResponse,
  UserUpdateSchema,
} from "./user.schema";

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

    .use(accessPlugin("users", "read"))
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const { memberId, status, page, limit } = query;
          const { users, pagination } = await userService.getUsers(
            {
              status,
            },
            { page, limit }
          );

          set.status = 200;
          const usersRes: UsersResponse = users.map((user) => ({
            id: (user._id as mongoose.Types.ObjectId).toString(),
            username: user.profile?.displayName,
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            email: user.contact?.email,
            // role: {
            //   _id: userObj.roleId as any,
            //   name: userObj.role,
            // },
            phone: user.contact?.phone.formatted,
            status: user.status,
            // memberId: userObj.memberId
            //   ? {
            //       _id: userObj.memberId as any,
            //       name: `${user.profile.firstName} ${user.profile.lastName}`,
            //     }
            //   : undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user?.activity?.lastLogin,
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
          200: t.Object({
            status: t.Literal("success"),
            users: t.Array(UserResponseSchema),
            pagination: t.Object({
              page: t.Number(),
              limit: t.Number(),
              total: t.Number(),
              pages: t.Number(),
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
            username: user.profile?.displayName,
            firstName: user.profile?.firstName,
            lastName: user.profile?.lastName,
            email: user.contact?.email,
            // role: {
            //   _id: userObj.roleId,
            //   name: userObj.role,
            // },
            phone: user.contact?.phone.formatted,
            status: user.status,
            // memberId: userObj.memberId
            //   ? {
            //       _id: userObj.memberId,
            //       name: `${user.profile.firstName} ${user.profile.lastName}`,
            //     }
            //   : undefined,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user?.activity?.lastLogin,
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
          200: t.Object({
            status: t.Literal("success"),
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
    .group("", (app) =>
      app
        .use(accessPlugin("users", "create"))
        .post(
          "/",
          async ({ body, set }) => {
            try {
              const existingUser = await userService.getUserBy({
                "contact.email": body.email,
              });

              if (existingUser) {
                set.status = 422;
                return {
                  status: "error",
                  message: "User with this email already exists",
                };
              }

              const existingByUsername = await userService.getUserBy({
                "profile.displayName": body.username,
              });
              if (existingByUsername) {
                set.status = 422;
                return {
                  status: "error",
                  message: "Username already in use",
                };
              }

              const existingByPhone = await userService.getUserBy({
                "contact.phone.formatted": body.phone,
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
                  error instanceof Error
                    ? error.message
                    : "Registration failed",
              };
            }
          },
          {
            body: RegisterUserRequestSchema,
            response: {
              201: t.Object({
                status: t.Literal("success"),
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
        .use(accessPlugin("users", "update"))
        .patch(
          "/:id",
          async ({ params, body, set, user }) => {
            try {
              // Non-admin users can only update their own profile
              if (user && user.role.name !== "admin" && user.id !== params.id) {
                throw new BadRequestError(
                  "You can only update your own profile"
                );
              }

              const updatedUser = await userService.updateUser({
                body,
                params: { id: params.id },
              });

              const userRes: UserResponse = {
                id: (updatedUser._id as mongoose.Types.ObjectId).toString(),
                username: updatedUser.profile?.displayName,
                firstName: updatedUser.profile?.firstName,
                lastName: updatedUser.profile?.lastName,
                email: updatedUser.contact?.email,
                // role: {
                //   _id: user.roleId.toString(),
                //   name: user.role,
                // },
                phone: updatedUser.contact?.phone.formatted,
                status: updatedUser.status,
                // memberId: user?.memberId
                //   ? {
                //       _id: user?.memberId,
                //       name: `${updatedUser.profile.firstName} ${updatedUser.profile.lastName}`,
                //     }
                //   : undefined,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
                lastLoginAt: updatedUser?.activity?.lastLogin,
              };

              set.status = 200;
              return { status: "success", user: userRes };
            } catch (error) {
              set.status = 500;
              return {
                status: "error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to update user",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            body: UserUpdateSchema,
            response: {
              200: t.Object({
                status: t.Literal("success"),
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
                  error instanceof Error
                    ? error.message
                    : "Failed to delete user",
              };
            }
          },
          {
            params: t.Object({
              id: t.String(),
            }),
            response: {
              200: t.Object({
                status: t.Literal("success"),
                user: t.Pick(UserResponseSchema, ["_id", "username", "email"]),
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
              const userObj = await User.findById(user.id);

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
              userObj.activity.passwordChangedAt = new Date();
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
    )
);
