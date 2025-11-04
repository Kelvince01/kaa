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
        userId: mongoose.Types.ObjectId.createFromHexString(user.id),
        // memberId: mongoose.Types.ObjectId.createFromHexString(user.memberId),
        roleId: mongoose.Types.ObjectId.createFromHexString(user.roleId),
        isActive: true,
        deletedAt: { $exists: false },
      }).populate("roleId", "name");

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
      .derive(async ({ role }) => {
        const access = await permissionManager.can(resource, action, {
          roleId: role.id,
        });

        console.log("access", access);

        if (!access) {
          throw new ForbiddenError(
            "Access denied. You are not authorized to access this resource."
          );
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
