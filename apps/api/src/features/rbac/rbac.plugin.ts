import { UserRole } from "@kaa/models";
import {
  type PermittedAction,
  permissionManager,
} from "@kaa/services/managers";
import { ForbiddenError } from "@kaa/utils";
import type Elysia from "elysia";
import mongoose from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

export const rolePlugin = (app: Elysia) =>
  app
    .use(authPlugin)
    .derive(async ({ user }) => {
      const userRole = await UserRole.findOne({
        userId: new mongoose.Types.ObjectId(user.id),
        // memberId: new mongoose.Types.ObjectId(user.memberId),
        roleId: user.role,
        isActive: true,
        deletedAt: { $exists: false },
      }).populate("roleId", "_id name");

      if (!userRole) {
        throw new Error("User role not found");
      }

      return {
        role: {
          id: (userRole.roleId as any)._id.toString(),
          name: (userRole.roleId as any).name,
        } as {
          id: string;
          name: string;
        },
      };
    })
    .as("scoped");

export const accessPlugin =
  (resource: string, action: PermittedAction) => (app: Elysia) =>
    app
      .use(rolePlugin)
      .derive(async ({ role, set }) => {
        const access = await permissionManager.can(resource, action, {
          roleId: role.id,
        });

        if (!access) {
          set.status = 403;
          return {
            status: "error",
            message:
              "Access denied. You are not authorized to access this resource.",
          };
        }
      })
      .as("scoped");

export const rolesPlugin = (allowedRoles: string[]) => (app: Elysia) =>
  app.use(rolePlugin).derive(({ user, role }) => {
    if (!(user && allowedRoles.includes(role.name))) {
      throw new ForbiddenError("Insufficient permissions");
    }

    return {};
  });
