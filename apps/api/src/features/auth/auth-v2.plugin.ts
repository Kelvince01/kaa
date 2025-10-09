// import { cookie } from "@elysiajs/cookie";
// import { jwt } from "@elysiajs/jwt";
// import { User } from "@kaa/models";
// import { UserRole, UserStatus } from "@kaa/models/types";
// import { Elysia } from "elysia";
// import config from "@kaa/config/api";
// import { ERROR_CODES, getErrorMessage } from "~/shared/constants/errors";

// // JWT types
// export type JWTPayload = {
//   sub: string; // user id
//   email: string;
//   role: UserRole;
//   iat?: number;
//   exp?: number;
// };

// // Request context types
// export type RequestUser = {
//   id: string;
//   email: string;
//   role: UserRole;
//   status: UserStatus;
//   phone?: string;
// };

// // Create auth plugin
// export const authPlugin = new Elysia({ name: "auth" })
//   .use(
//     jwt({
//       name: "jwt",
//       secret: jwtConfig.secret,
//       exp: jwtConfig.expiresIn,
//     })
//   )
//   .use(
//     jwt({
//       name: "refreshJwt",
//       secret: jwtConfig.refreshSecret,
//       exp: jwtConfig.refreshExpiresIn,
//     })
//   )
//   .use(cookie())
//   .derive(async ({ headers, jwt, cookie }) => {
//     const authHeader = headers.authorization;
//     const token = authHeader?.startsWith("Bearer ")
//       ? authHeader.substring(7)
//       : cookie.accessToken;

//     if (!token) {
//       return { user: null };
//     }

//     try {
//       const payload = (await jwt.verify(token)) as JWTPayload;

//       if (!payload) {
//         return { user: null };
//       }

//       // Fetch user from DB to get current status
//       const dbUser = await User.findById(payload.sub);
//       if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
//         return { user: null };
//       }

//       const user: RequestUser = {
//         id: payload.sub,
//         email: payload.email,
//         role: payload.role,
//         status: dbUser.status,
//         phone: dbUser.contact?.phone?.formatted,
//       };

//       return { user };
//     } catch (error) {
//       return { user: null };
//     }
//   })
//   .macro({
//     requireAuth: (enabled = true) => ({
//       if (!enabled) return;

//       beforeHandle(({ user, set }) => {
//         if (!user) {
//           set.status = 401;
//           return {
//             success: false,
//             error: ERROR_CODES.TOKEN_INVALID,
//             message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
//           };
//         }
//       });
//     },
//   })
//   .macro(({ onBeforeHandle }) => ({
//     // Require authentication
//     requireAuth(enabled = true) {
//       if (!enabled) return;

//       onBeforeHandle(({ user, set }) => {
//         if (!user) {
//           set.status = 401;
//           return {
//             success: false,
//             error: ERROR_CODES.TOKEN_INVALID,
//             message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
//           };
//         }
//       });
//     },

//     // Require specific roles
//     requireRole(roles: UserRole | UserRole[]) {
//       const allowedRoles = Array.isArray(roles) ? roles : [roles];

//       onBeforeHandle(({ user, set }) => {
//         if (!user) {
//           set.status = 401;
//           return {
//             success: false,
//             error: ERROR_CODES.TOKEN_INVALID,
//             message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
//           };
//         }

//         if (!allowedRoles.includes(user.role)) {
//           set.status = 403;
//           return {
//             success: false,
//             error: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
//             message: getErrorMessage(ERROR_CODES.INSUFFICIENT_PERMISSIONS),
//           };
//         }
//       });
//     },

//     // Check account status
//     requireActiveAccount(enabled = true) {
//       if (!enabled) return;

//       onBeforeHandle(({ user, set }) => {
//         if (!user) {
//           set.status = 401;
//           return {
//             success: false,
//             error: ERROR_CODES.TOKEN_INVALID,
//             message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
//           };
//         }

//         if (user.status === UserStatus.SUSPENDED) {
//           set.status = 403;
//           return {
//             success: false,
//             error: ERROR_CODES.ACCOUNT_SUSPENDED,
//             message: getErrorMessage(ERROR_CODES.ACCOUNT_SUSPENDED),
//           };
//         }

//         if (user.status === UserStatus.BANNED) {
//           set.status = 403;
//           return {
//             success: false,
//             error: ERROR_CODES.ACCOUNT_BANNED,
//             message: getErrorMessage(ERROR_CODES.ACCOUNT_BANNED),
//           };
//         }
//       });
//     },

//     // Require ownership or admin access
//     requireOwnershipOrAdmin(
//       getResourceOwnerId: (context: any) => string | Promise<string>
//     ) {
//       onBeforeHandle(async ({ user, set, ...context }) => {
//         if (!user) {
//           set.status = 401;
//           return {
//             success: false,
//             error: ERROR_CODES.TOKEN_INVALID,
//             message: getErrorMessage(ERROR_CODES.TOKEN_INVALID),
//           };
//         }

//         // Admins can access everything
//         if (
//           user.role === UserRole.ADMIN ||
//           user.role === UserRole.SUPER_ADMIN
//         ) {
//           return;
//         }

//         try {
//           const ownerId = await getResourceOwnerId(context);

//           if (user.id !== ownerId) {
//             set.status = 403;
//             return {
//               success: false,
//               error: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
//               message: getErrorMessage(ERROR_CODES.INSUFFICIENT_PERMISSIONS),
//             };
//           }
//         } catch (error) {
//           set.status = 500;
//           return {
//             success: false,
//             error: "RESOURCE_CHECK_FAILED",
//             message: "Failed to verify resource ownership",
//           };
//         }
//       });
//     },
//   }));

// // Helper functions for token generation
// // Note: This class uses jsonwebtoken directly for simplicity,
// // but in production, consider using the Elysia JWT plugin for consistency
// // biome-ignore lint/complexity/noStaticOnlyClass: ignore
// export class AuthTokenService {
//   static async generateAccessToken(user: {
//     id: string;
//     email: string;
//     role: UserRole;
//   }): Promise<string> {
//     const payload: JWTPayload = {
//       sub: user.id,
//       email: user.email,
//       role: user.role,
//       iat: Math.floor(Date.now() / 1000),
//     };

//     const jwt = await import("jsonwebtoken");
//     return jwt.sign(payload, jwtConfig.secret, {
//       expiresIn: jwtConfig.expiresIn,
//     });
//   }

//   static async generateRefreshToken(userId: string): Promise<string> {
//     const payload = {
//       sub: userId,
//       tokenId: crypto.randomUUID(),
//       iat: Math.floor(Date.now() / 1000),
//     };

//     const jwt = await import("jsonwebtoken");
//     return jwt.sign(payload, jwtConfig.refreshSecret, {
//       expiresIn: jwtConfig.refreshExpiresIn,
//     });
//   }

//   static async generateTokens(user: {
//     id: string;
//     email: string;
//     role: UserRole;
//   }): Promise<{
//     accessToken: string;
//     refreshToken: string;
//     expiresIn: string;
//   }> {
//     const [accessToken, refreshToken] = await Promise.all([
//       AuthTokenService.generateAccessToken(user),
//       AuthTokenService.generateRefreshToken(user.id),
//     ]);

//     return {
//       accessToken,
//       refreshToken,
//       expiresIn: jwtConfig.expiresIn,
//     };
//   }
// }

// export default authPlugin;
