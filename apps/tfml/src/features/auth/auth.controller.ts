import { sendLoginAlertEmail } from "@kaa/email";
import { MFASecret, RefreshToken, User } from "@kaa/models";
import { UserStatus } from "@kaa/models/types";
import {
  auditService,
  memberService,
  roleService,
  userService,
} from "@kaa/services";
import { getDeviceInfo, logger } from "@kaa/utils";
import type { Context } from "elysia";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { config } from "#/config";
import { authPlugin } from "~/features/auth/auth.plugin";
import {
  LoginTwoFactorSchema,
  LoginUserRequestSchema,
  LoginUserResponseSchema,
} from "~/features/auth/auth.schema";
import { createOrUpdateSession } from "~/features/auth/session.controller";
// import { authRateLimit } from "~/plugins/rate-limit.plugin";
import { jwtPlugin } from "~/plugins/security.plugin";
import { SessionStore } from "~/services/session-store";

export const authController = new Elysia()
  .use(jwtPlugin)
  //   .use(authRateLimit)
  .decorate({
    sessionStore: new SessionStore(process.env.SESSION_STORAGE as any),
  })
  .post(
    "/login",
    async (ctx) => {
      const {
        body,
        set,
        cookie: { access_token, refresh_token, role_token },
        jwt,
        request,
        server,
      } = ctx;

      try {
        const user = await userService.getUserBy({
          "contact.email": body.email,
        });
        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Invalid credentials",
          };
        }

        // Check if account is locked
        if (user.isLocked()) {
          set.status = 401;
          return {
            status: "error",
            message: "Account is temporarily locked",
          };
        }

        const isPasswordValid = await user.comparePassword(body.password);

        if (!isPasswordValid) {
          // Increment login attempts
          user.activity.loginAttempts += 1;
          if (user.activity.loginAttempts >= 5) {
            user.activity.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
          }
          await user.save();

          set.status = 401;
          return {
            status: "error",
            message: "Invalid credentials",
          };
        }

        if (user.status !== UserStatus.ACTIVE) {
          set.status = 401;
          return {
            status: "error",
            message: "User is not active",
          };
        }

        if (user.verification.emailVerifiedAt === null) {
          set.status = 401;
          return {
            verified: false,
            status: "error",
            message: "Please verify your email before logging in",
          };
        }

        const mfaSecret = await MFASecret.findOne({ userId: user._id });

        if (mfaSecret?.isEnabled) {
          set.status = 200;
          return {
            status: "success",
            message: "Please complete two-factor authentication",
            requiresTwoFactor: true,
            userId: (user._id as mongoose.Types.ObjectId).toString(),
          } as any;
        }

        // Reset login attempts on successful login
        user.activity.loginAttempts = 0;
        user.activity.lockUntil = undefined;
        user.activity.lastLogin = new Date();
        user.activity.lastActivity = new Date();
        await user.save();

        const {
          _id: id,
          profile: { displayName, firstName, lastName, avatar },
          contact: { email, phone },
          status,
          verification: {
            emailVerifiedAt,
            phoneVerifiedAt,
            identityVerifiedAt,
          },
          createdAt,
          updatedAt,
          activity: { lastLogin: lastLoginAt, lastActivity: lastActivityAt },
        } = user;

        // Get user role
        const userRole = await roleService.getUserRoleBy({
          userId: (id as mongoose.Types.ObjectId).toString(),
        });

        const accessToken = await jwt.sign({
          sub: (id as mongoose.Types.ObjectId).toString(),
          iss: "access",
          exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
        });
        const refreshTokenExpiry =
          Math.floor(Date.now() / 1000) + config.jwt.refreshTokenExpiresIn;
        const refreshToken = await jwt.sign({
          sub: (id as mongoose.Types.ObjectId).toString(),
          iss: "refresh",
          exp: refreshTokenExpiry,
        });

        const { userAgent, ip } = getDeviceInfo(request, server);

        await RefreshToken.create({
          user: user.id,
          token: refreshToken,
          expires: new Date(refreshTokenExpiry * 1000),
          valid: true,
          revoked: false,
          ipAddress: ip,
          userAgent,
        });

        const sessionId = await createOrUpdateSession(
          (user._id as mongoose.Types.ObjectId).toString(),
          accessToken,
          "regular",
          "password",
          ctx as Context,
          ctx.sessionStore
        );

        // Set session ID in header for subsequent requests
        ctx.headers["x-session-id"] = sessionId.sessionId;
        ctx.cookie.session_id.set({
          value: sessionId,
          httpOnly: true,
          maxAge: Number(config.jwt.expiresIn),
          path: "/",
        });

        // Set the auth cookie
        access_token.set({
          value: accessToken,
          httpOnly: true, // Prevents XSS attacks
          secure: true, // HTTPS only (set to false in development)
          sameSite: "none", // Required for cross-origin requests
          maxAge: config.jwt.expiresIn,
          path: "/",
        });
        refresh_token.set({
          value: refreshToken,
          httpOnly: true, // Prevents XSS attacks
          secure: true, // HTTPS only (set to false in development)
          sameSite: "none", // Required for cross-origin requests
          maxAge: config.jwt.refreshTokenExpiresIn,
          path: "/",
        });
        role_token.set({
          value: (userRole?.roleId as any)?.name ?? "",
          maxAge: config.jwt.refreshTokenExpiresIn,
          path: "/",
        });
        set.headers.authorization = `Bearer ${accessToken}`;

        // Send login alert email
        await sendLoginAlertEmail(email, ip ?? "", userAgent);

        const member = await memberService.getMemberBy({
          user: (user._id as mongoose.Types.ObjectId).toString(),
        });

        // Track login event
        await auditService.trackEvent({
          memberId: member?._id?.toString(),
          userId: (user._id as mongoose.Types.ObjectId).toString(),
          type: "user_login",
          category: "user",
          action: "login",
        });

        logger.info("User logged in", {
          userId: user._id,
          memberId: member?._id?.toString(),
        });

        set.status = 200;
        return {
          status: "success",
          user: {
            id: (id as mongoose.Types.ObjectId).toString(),
            username: displayName,
            firstName,
            lastName,
            email,
            avatar,
            memberId: member?._id?.toString(),
            role: (userRole?.roleId as any)?.name ?? "",
            phone: phone?.formatted,
            address: user.addresses?.[0],
            status,
            isActive: (user.status as UserStatus) === UserStatus.ACTIVE,
            isVerified: !!user.verification?.emailVerifiedAt,
            createdAt,
            updatedAt,
            lastLoginAt,
          } as any,
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
          },
          message: "Login successful",
        };
      } catch (error) {
        // If unique mongoose constraint (for username or email) is violated
        if (
          error instanceof Error &&
          error.message.includes("E11000 duplicate key error collection")
        ) {
          set.status = 422;
          return {
            status: "error",
            message: "Resource already exists!",
          };
        }

        set.status = 401;
        return {
          status: "error",
          message:
            error instanceof Error ? error.message : "Authentication failed",
        };
      }
    },
    {
      body: LoginUserRequestSchema,
      response: {
        200: t.Union([
          t.Object({
            status: t.Literal("success"),
            ...LoginUserResponseSchema.properties,
          }),
          t.Object({
            ...LoginTwoFactorSchema.properties,
          }),
        ]),
        401: t.Object({
          verified: t.Optional(t.Boolean()),
          status: t.Literal("error"),
          message: t.String(),
        }),
        422: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["auth"],
        summary: "User login",
        description: "Authenticate a user and return a token",
      },
    }
  )
  .group("", (app) =>
    app
      .use(authPlugin)
      .get(
        "/me",
        async ({ user, set }) => {
          try {
            // Get full user document
            const currentUser = await User.findById(user.id);
            if (!currentUser) {
              set.status = 404;
              return {
                status: "error",
                message: "User not found",
              };
            }
            // User is attached to req by the auth middleware
            const userProfile = currentUser.getPublicProfile();

            // Get user role
            const userRole = await roleService.getUserRoleBy({
              userId: userProfile._id?.toString() ?? "",
            });

            const member = await memberService.getMemberBy({
              user: userProfile._id?.toString() ?? "",
            });

            set.status = 200;
            return {
              status: "success",
              user: {
                id: (userProfile._id as mongoose.Types.ObjectId).toString(),
                memberId: member?._id?.toString() ?? undefined,
                avatar: userProfile.profile?.avatar,
                username: userProfile.profile?.displayName as string,
                firstName: userProfile.profile?.firstName as string,
                lastName: userProfile.profile?.lastName as string,
                email: userProfile.contact?.email as string,
                status: userProfile.status as UserStatus,
                role: (userRole?.roleId as any)?.name ?? "",
                phone: userProfile.contact?.phone.formatted,
                address: userProfile.addresses?.[0] as any,
                isActive: userProfile.status === UserStatus.ACTIVE,
                isVerified: !!userProfile.verification?.emailVerifiedAt,
                createdAt: (userProfile.createdAt as Date).toISOString(),
                updatedAt: (userProfile.updatedAt as Date).toISOString(),
              },
            };
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);

            set.status = 500;
            return {
              status: "error",
              message: "Failed to fetch user",
              error: errorMessage,
            };
          }
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              user: t.Object({
                id: t.String(),
                memberId: t.Optional(t.String()),
                avatar: t.Optional(t.String()),
                username: t.String(),
                firstName: t.String(),
                lastName: t.String(),
                email: t.String(),
                role: t.String(),
                phone: t.Optional(t.String()),
                address: t.Optional(
                  t.Object({
                    line1: t.String(),
                    town: t.String(),
                    postalCode: t.String(),
                    county: t.String(),
                    country: t.String(),
                  })
                ),
                status: t.String(),
                isActive: t.Boolean(),
                isVerified: t.Boolean(),
                createdAt: t.String(),
                updatedAt: t.String(),
              }),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Fetch current user",
            description: "Fetch the current user",
          },
        }
      )
      .post(
        "/logout",
        async ({ cookie: { access_token, refresh_token }, user, set }) => {
          // remove refresh token and access token from cookies
          access_token.remove();
          refresh_token.remove();

          // remove refresh token from db & set user online status to offline
          await User.findByIdAndUpdate(user.id, {
            isOnline: false,
            refreshToken: null,
          });
          await RefreshToken.findOneAndDelete({ token: refresh_token.value });

          set.status = 200;
          return {
            status: "success",
            message: "Logout successfully",
          };
        },
        {
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "User logout",
            description:
              "Logout a user and remove the access token and refresh token from cookies",
          },
        }
      )
  );
