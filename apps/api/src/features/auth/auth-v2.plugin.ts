import bearer from "@elysiajs/bearer";
import { cookie } from "@elysiajs/cookie";
import config from "@kaa/config/api";
import { UserRole, UserStatus } from "@kaa/models/types";
import { memberService, roleService, userService } from "@kaa/services";
import {
  type PermittedAction,
  permissionManager,
} from "@kaa/services/managers";
import { Elysia } from "elysia";
import { SignJWT } from "jose";
import type mongoose from "mongoose";
import { jwtPlugin } from "~/plugins/security.plugin";
import { ERROR_CODES, getErrorMessage } from "~/shared/constants/errors";

// JWT types
export type JWTPayload = {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

// Request context types
export type RequestUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
};

// Create auth plugin
export const authPlugin = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  .use(cookie())
  .use(bearer())
  .derive(async ({ jwt, cookie: { access_token }, bearer: bearerToken }) => {
    // Get token from Authorization header or cookie
    let token: string | null = null;

    if (bearerToken) {
      // Check if the 'Authorization' header contains a Bearer token
      token = bearerToken;
    } else if (access_token.value) {
      token = access_token.value as string;
    } else {
      // Otherwise, set token to null indicating no valid token is present
      token = null;
    }

    if (!token) {
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token);

      if (!payload) {
        return { user: null };
      }

      // Fetch user from DB to get current status
      const userId = payload.sub;
      const userObj = await userService.getUserById(userId);
      const userRole = await roleService.getUserRoleBy({
        userId: (userObj._id as mongoose.Types.ObjectId).toString(),
      });

      if (!userObj) {
        // handle error for user not found from the provided access token
        return { user: null };
      }

      const member = await memberService.getMemberBy({
        user: (userObj._id as mongoose.Types.ObjectId).toString(),
      });

      const userRes = {
        id: (userObj._id as mongoose.Types.ObjectId).toString(),
        role: (userRole?.roleId as any).name,
        roleId: (userRole?.roleId as any)._id.toString(),
        memberId: member
          ? (member._id as mongoose.Types.ObjectId).toString()
          : undefined,
        organizationId: member
          ? (member.organization as any)._id.toString()
          : undefined,
        isVerified: !!userObj.verification.emailVerifiedAt, // Ensure this is always a boolean
        firstName: userObj.profile.firstName,
        lastName: userObj.profile.lastName,
        username: userObj.profile.displayName || "",
        email: userObj.contact.email,
        phone: userObj.contact.phone.formatted,
        status: userObj.status,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
      };

      return { user: userRes };
    } catch (error) {
      return { user: null };
    }
  })
  .macro({
    // Require authentication (enabled via { requireAuth: true } in route config)
    requireAuth: {
      beforeHandle({ user, set }) {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            error: ERROR_CODES.TOKEN_INVALID,
            message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
          };
        }
      },
    },

    // Require specific roles
    requireRole(roles: UserRole | UserRole[]) {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      return {
        beforeHandle({ user, set }) {
          if (!user) {
            set.status = 401;
            return {
              status: "error",
              error: ERROR_CODES.TOKEN_INVALID,
              message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
            };
          }

          if (!allowedRoles.includes(user.role)) {
            set.status = 403;
            return {
              status: "error",
              error: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
              message: getErrorMessage(ERROR_CODES.INSUFFICIENT_PERMISSIONS),
            };
          }
        },
      };
    },

    // Check account status (enabled via { requireActiveAccount: true })
    requireActiveAccount: {
      beforeHandle({ user, set }) {
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            error: ERROR_CODES.TOKEN_INVALID,
            message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
          };
        }

        if (user.status === UserStatus.SUSPENDED) {
          set.status = 403;
          return {
            status: "error",
            error: ERROR_CODES.ACCOUNT_SUSPENDED,
            message: getErrorMessage(ERROR_CODES.ACCOUNT_SUSPENDED),
          };
        }

        if (user.status === UserStatus.BANNED) {
          set.status = 403;
          return {
            status: "error",
            error: ERROR_CODES.ACCOUNT_BANNED,
            message: getErrorMessage(ERROR_CODES.ACCOUNT_BANNED),
          };
        }
      },
    },

    // Require ownership or admin access
    requireOwnershipOrAdmin(
      getResourceOwnerId: (context: any) => string | Promise<string>
    ) {
      return {
        beforeHandle: async ({ user, set, ...context }) => {
          if (!user) {
            set.status = 401;
            return {
              status: "error",
              error: ERROR_CODES.TOKEN_INVALID,
              message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
            };
          }

          // Admins can access everything
          if (
            user.role === UserRole.ADMIN ||
            user.role === UserRole.SUPER_ADMIN
          ) {
            return;
          }

          try {
            const ownerId = await getResourceOwnerId({ ...context, user });

            if (user.id !== ownerId) {
              set.status = 403;
              return {
                status: "error",
                error: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
                message: getErrorMessage(ERROR_CODES.INSUFFICIENT_PERMISSIONS),
              };
            }
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              error: "RESOURCE_CHECK_FAILED",
              message: "Failed to verify resource ownership",
            };
          }
        },
      };
    },

    // New: Require access based on permissions (resource/action specific)
    requireAccess(resource: string, action: PermittedAction) {
      return {
        beforeHandle: async ({ user, set }) => {
          if (!user) {
            set.status = 401;
            return {
              status: "error",
              error: ERROR_CODES.TOKEN_INVALID,
              message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
            };
          }

          try {
            const access = await permissionManager.can(resource, action, {
              roleId: user.role, // Assuming role is the roleId; adjust if role has .id
            });

            console.log("access", access); // Retain for debugging

            if (!access) {
              set.status = 403;
              return {
                status: "error",
                error: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
                message:
                  "Access denied. You are not authorized to access this resource.",
              };
            }
          } catch (error) {
            console.error("Permission check error:", error);
            set.status = 500;
            return {
              status: "error",
              error: "PERMISSION_CHECK_FAILED",
              message: "Failed to check permissions",
            };
          }
        },
      };
    },
  });

// Helper functions for token generation
// Note: This class uses jsonwebtoken directly for simplicity,
// but in production, consider using the Elysia JWT plugin for consistency
// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AuthTokenService {
  static async generateAccessToken(user: {
    id: string;
    email: string;
    role: UserRole;
  }): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

    const jwt = await import("jsonwebtoken");
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  static async generateAccessToken_v2(user: {
    id: string;
    email: string;
    role: UserRole;
  }): Promise<string> {
    const secret = new TextEncoder().encode(config.jwt.secret);
    const now = new Date();

    const jwt = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(config.jwt.expiresIn)
      .sign(secret);

    return jwt;
  }

  static async generateRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      tokenId: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
    };

    const jwt = await import("jsonwebtoken");
    return jwt.sign(payload, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiresIn,
    });
  }

  static async generateRefreshToken_v2(userId: string): Promise<string> {
    const secret = new TextEncoder().encode(config.jwt.refreshTokenSecret);
    const now = new Date();

    const payload = {
      sub: userId,
      tokenId: crypto.randomUUID(),
    };

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(config.jwt.refreshTokenExpiresIn)
      .sign(secret);

    return jwt;
  }

  static async generateTokens(user: {
    id: string;
    email: string;
    role: UserRole;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      AuthTokenService.generateAccessToken(user),
      AuthTokenService.generateRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn.toString(),
    };
  }
}

export default authPlugin;
