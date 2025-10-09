import bearer from "@elysiajs/bearer";
import { memberService, roleService, userService } from "@kaa/services";
import { ForbiddenError, UnauthorizedError } from "@kaa/utils";
import type Elysia from "elysia";
import type mongoose from "mongoose";
import { jwtPlugin } from "~/plugins/security.plugin";
import { rolePlugin } from "../rbac/rbac.plugin";

export const authPlugin = (app: Elysia) =>
  app
    .use(jwtPlugin)
    .use(bearer())
    .derive(
      async ({ jwt, cookie: { access_token }, set, bearer: bearerToken }) => {
        // Get token from Authorization header or cookie
        let token: string | null = null;

        // Check if the 'Authorization' header contains a Bearer token
        if (bearerToken) {
          token = bearerToken;
        } else if (access_token.value) {
          token = access_token.value as string;
        } else {
          // Otherwise, set token to null indicating no valid token is present
          token = null;
        }

        if (!token) {
          // handle error for access token is not available
          set.status = 401;
          throw new UnauthorizedError("Access token is missing");
        }
        const jwtPayload = await jwt.verify(token);
        if (!jwtPayload) {
          // handle error for access token is tempted or incorrect
          set.status = 403;
          throw new Error("Access token is invalid");
        }

        const userId = jwtPayload.sub;
        const user = await userService.getUserById(userId);
        const userRole = await roleService.getUserRoleBy({
          userId: (user._id as mongoose.Types.ObjectId).toString(),
        });

        if (!user) {
          // handle error for user not found from the provided access token
          set.status = 403;
          throw new Error("Access token is invalid");
        }

        const member = await memberService.getMemberBy({
          user: (user._id as mongoose.Types.ObjectId).toString(),
        });

        return {
          user: {
            id: (user._id as mongoose.Types.ObjectId).toString(),
            role: (userRole?.roleId as any).name,
            roleId: (userRole?.roleId as any)._id.toString(),
            memberId: member
              ? (member._id as mongoose.Types.ObjectId).toString()
              : undefined,
            isVerified: !!user.verification.emailVerifiedAt, // Ensure this is always a boolean
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            username: user.profile.displayName || "",
            email: user.contact.email,
            phone: user.contact.phone.formatted,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        };
      }
    )
    .as("scoped");

export const rolesPlugin = (allowedRoles: string[]) => (app: Elysia) =>
  app.use(rolePlugin).derive(({ user, role }) => {
    if (!(user && allowedRoles.includes(role.name))) {
      throw new ForbiddenError("Insufficient permissions");
    }

    return {};
  });
