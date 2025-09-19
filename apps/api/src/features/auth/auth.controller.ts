import crypto from "node:crypto";
// import { authRateLimit } from "~/plugins/rate-limit.plugin";
import config from "@kaa/config/api";
import { RefreshToken, ResetToken, User, VerificationToken } from "@kaa/models";
import {
  ForgotPasswordRequestSchema,
  LoginUserRequestSchema,
  RegisterUserRequestSchema,
  ResetPasswordRequestSchema,
  VerifyUserRequestSchema,
} from "@kaa/schemas";
import { fileService, roleService, userService } from "@kaa/services";
import {
  AppError,
  generateResetPasswordToken,
  generateVerificationToken,
  getDeviceInfo,
  isMetaDataImg,
  logger,
  NotFoundError,
  processFromBuffer,
  uploadFile,
  verifyPassword,
} from "@kaa/utils";
import { type Context, Elysia, t } from "elysia";
import mongoose from "mongoose";
import ShortUniqueId from "short-unique-id";
import { jwtPlugin } from "~/plugins/security.plugin";
// import { auditService } from "@kaa/services";
import { accessPlugin } from "../rbac/rbac.plugin";
import { apiKeyController } from "./api-key.controller";
import { authPlugin } from "./auth.plugin";
import { LoginTwoFactorSchema, LoginUserResponseSchema } from "./auth.schema";
import {
  //   enhancedAuthRateLimitPlugin,
  adaptiveRateLimiter,
} from "./auth-rate-limit.plugin";
import { oauthController } from "./oauth.controller";
import { passkeyController } from "./passkey.controller";
import { authBackgroundJobs } from "./services/auth-background.service";
import { authCacheService } from "./services/auth-cache.service";
import { authMetrics } from "./services/auth-metrics.service";
import { createOrUpdateSession, sessionController } from "./session.controller";
import { twoFactorController } from "./two-factor.controller";

export const authController = new Elysia()
  .use(jwtPlugin)
  //   .use(authRateLimit)
  .use(oauthController)
  .use(apiKeyController)
  .group("/auth", (app) =>
    app
      .post(
        "/register",
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

            const { user, verificationToken } = await userService.createUser({
              body,
            });

            // Send verification email (background job)
            authBackgroundJobs
              .sendVerificationEmail(user.email, verificationToken)
              .catch((err) =>
                logger.error("Failed to queue verification email", err)
              );

            // Track registration event (background job)
            authBackgroundJobs
              .trackRegistrationEvent(
                (user._id as mongoose.Types.ObjectId).toString(),
                user.memberId?.toString() || "",
                { email: user.email, role: body.role }
              )
              .catch((err) =>
                logger.error("Failed to queue registration audit event", err)
              );

            set.status = 201;
            return {
              status: "success",
              data: {
                message:
                  "User registered successfully. Please check your email to verify your account.",
                userId: (user._id as mongoose.Types.ObjectId).toString(),
                email: user.email,
              },
            };
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
            201: t.Object({
              status: t.Literal("success"),
              data: t.Object({
                message: t.String(),
                userId: t.String(),
                email: t.String(),
              }),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Register a new user",
            description: "Create a new user account",
          },
        }
      )
      .post(
        "/email/verify",
        async ({ body, set }) => {
          try {
            const { token } = body;

            // Get hashed token
            const verificationToken = crypto
              .createHash("sha256")
              .update(token)
              .digest("hex");

            const verificationTokenDoc = await VerificationToken.findOne({
              token: verificationToken,
              expiresAt: { $gt: Date.now() },
            });

            if (!verificationTokenDoc) {
              set.status = 400;
              return {
                status: "error",
                message: "Invalid or expired verification token",
              };
            }

            const user = await User.findById(
              verificationTokenDoc.user.toString()
            );
            if (!user) {
              set.status = 400;
              return {
                status: "error",
                message: "User not found",
              };
            }

            // Update user
            user.isVerified = true;
            await user.save();

            // Send welcome email (background job)
            authBackgroundJobs
              .sendWelcomeEmail(user.email)
              .catch((err) =>
                logger.error("Failed to queue welcome email", err)
              );

            set.status = 200;
            return {
              status: "success",
              message: "Email verified successfully. You can now log in.",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message:
                error instanceof Error ? error.message : "Verification failed",
              error,
            };
          }
        },
        {
          body: VerifyUserRequestSchema,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.Any(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Verify a user email",
            description: "Verify a user email address",
          },
        }
      )
      .post(
        "/resend/email/verify",
        async ({ set, body }) => {
          try {
            const { email } = body;
            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
              // For security reasons, don't reveal that the user doesn't exist
              set.status = 200;
              return {
                status: "success",
                message:
                  "If your email is registered and not verified, you will receive a verification link",
              };
            }

            // Check if already verified
            if (user.isVerified) {
              set.status = 200;
              return {
                status: "success",
                message: "Your email is already verified. Please login.",
              };
            }

            // Generate new verification token
            const { verificationToken } = generateVerificationToken();

            // Send verification email (background job)
            authBackgroundJobs
              .sendVerificationEmail(user.email, verificationToken)
              .catch((err) =>
                logger.error("Failed to queue verification email", err)
              );

            set.status = 200;
            return {
              status: "success",
              message:
                "Verification email has been resent. Please check your inbox.",
            };
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            console.error("Resend verification error:", error as Error);
            set.status = 500;
            return {
              status: "error",
              message: "Failed to resend verification email",
              error: errorMessage,
            };
          }
        },
        {
          body: t.Object({
            email: t.String(),
          }),
          detail: {
            tags: ["auth"],
            summary: "Resend email verification",
          },
        }
      )
      .post(
        "/phone/verify",
        async ({ body, set }) => {
          try {
            const { token } = body;

            // Get hashed token
            const verificationToken = crypto
              .createHash("sha256")
              .update(token)
              .digest("hex");

            const verificationTokenDoc = await VerificationToken.findOne({
              token: verificationToken,
              expiresAt: { $gt: Date.now() },
            });

            if (!verificationTokenDoc) {
              set.status = 400;
              return {
                status: "error",
                message: "Invalid or expired verification token",
              };
            }

            // Verify code (in a real app, this would check against a stored code)
            // For simplicity, we're not implementing the actual verification here
            // const isValid = true // Placeholder

            // if (!isValid) {
            //   throw ApiError.badRequest("Invalid or expired verification code")
            // }

            const user = await User.findById(
              verificationTokenDoc.user.toString()
            );
            if (!user) {
              set.status = 400;
              return {
                status: "error",
                message: "User not found",
              };
            }

            // Update user
            user.phoneVerified = true;
            await user.save();

            // Send welcome email (background job)
            authBackgroundJobs
              .sendWelcomeEmail(user.email)
              .catch((err) =>
                logger.error("Failed to queue welcome email", err)
              );

            set.status = 200;
            return {
              status: "success",
              message: "Phone verified successfully.",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message:
                error instanceof Error ? error.message : "Verification failed",
              error,
            };
          }
        },
        {
          body: VerifyUserRequestSchema,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
            }),
            400: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.Any(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Verify a user email",
            description: "Verify a user email address",
          },
        }
      )
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

          const startTime = Date.now();
          const { email, password } = body;

          try {
            // 1. Progressive rate limiting (fastest check first)
            const { ip } = getDeviceInfo(request, server);
            const adaptiveLimits = adaptiveRateLimiter.getAdaptiveLimits(
              email,
              ip || ""
            );

            // Check adaptive rate limits
            const loginAttempts = await authCacheService.getLoginAttempts(
              email,
              ip || ""
            );
            if (loginAttempts >= adaptiveLimits.maxRequests) {
              set.status = 429;
              return {
                status: "error",
                message: adaptiveLimits.message,
              };
            }

            // 2. Parallel operations for user data with caching
            const [user, mfaStatus] = await Promise.all([
              authCacheService.getUser(email),
              // We'll get MFA status after user validation
              Promise.resolve(null),
            ]);

            if (!user) {
              // Increment failed login attempts
              await authCacheService.incrementLoginAttempts(email, ip || "");
              authMetrics.recordLogin(false, Date.now() - startTime, {
                email,
                ip,
              });

              set.status = 401;
              return {
                status: "error",
                message: "Invalid credentials",
              };
            }

            // 3. Account validation checks
            const isLocked = !!(
              user.lockUntil && user.lockUntil.getTime() > Date.now()
            );
            if (isLocked) {
              authMetrics.recordLogin(false, Date.now() - startTime, {
                email,
                ip,
                reason: "account_locked",
              });
              set.status = 401;
              return {
                status: "error",
                message: "Account is temporarily locked",
              };
            }

            if (!user.isActive) {
              authMetrics.recordLogin(false, Date.now() - startTime, {
                email,
                ip,
                reason: "account_inactive",
              });
              set.status = 401;
              return {
                status: "error",
                message: "User is not active",
              };
            }

            if (!user.isVerified) {
              authMetrics.recordLogin(false, Date.now() - startTime, {
                email,
                ip,
                reason: "email_unverified",
              });
              set.status = 401;
              return {
                verified: false,
                status: "error",
                message: "Please verify your email before logging in",
              };
            }

            // 4. Password verification (optimized)
            // const isPasswordValid = await user.comparePassword(password);
            const isPasswordValid = verifyPassword(password, user.password);

            if (!isPasswordValid) {
              // Increment login attempts (non-blocking)
              User.findByIdAndUpdate(user._id, {
                $inc: { loginAttempts: 1 },
                ...(user.loginAttempts + 1 >= 5 && {
                  lockUntil: new Date(Date.now() + 30 * 60 * 1000),
                }),
              })
                .exec()
                .catch((err) =>
                  logger.error("Failed to update login attempts", err)
                );

              await authCacheService.incrementLoginAttempts(email, ip || "");
              authMetrics.recordLogin(false, Date.now() - startTime, {
                email,
                ip,
                reason: "invalid_password",
              });

              set.status = 401;
              return {
                status: "error",
                message: "Invalid credentials",
              };
            }

            // 5. Get MFA status (now that we know user exists)
            const actualMfaStatus = await authCacheService.getMFAStatus(
              (user._id as mongoose.Types.ObjectId).toString()
            );

            if (actualMfaStatus.isEnabled) {
              authMetrics.recordLogin(true, Date.now() - startTime, {
                email,
                ip,
                mfa_required: true,
              });
              set.status = 200;
              return {
                status: "success",
                message: "Please complete two-factor authentication",
                requiresTwoFactor: true,
                userId: (user._id as mongoose.Types.ObjectId).toString(),
              };
            }

            // 6. Parallel operations for successful login
            const [userRole, refreshTokenExpiry] = await Promise.all([
              authCacheService.getRole(
                (user.role as any)._id?.toString() || ""
              ),
              Promise.resolve(
                Math.floor(Date.now() / 1000) + config.jwt.refreshTokenExpiresIn
              ),
            ]);

            // 7. Generate tokens
            const [accessToken, refreshToken] = await Promise.all([
              jwt.sign({
                sub: (user._id as mongoose.Types.ObjectId).toString(),
                iss: "access",
                exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
              }),
              jwt.sign({
                sub: (user._id as mongoose.Types.ObjectId).toString(),
                iss: "refresh",
                exp: refreshTokenExpiry,
              }),
            ]);

            // 8. Update user data (non-blocking)
            User.findByIdAndUpdate(user._id, {
              loginAttempts: 0,
              $unset: { lockUntil: 1 },
              lastLoginAt: new Date(),
              lastActiveAt: new Date(),
            })
              .exec()
              .catch((err) =>
                logger.error("Failed to update user login data", err)
              );

            // Reset login attempts cache
            authCacheService
              .resetLoginAttempts(email, ip || "")
              .catch((err) =>
                logger.error("Failed to reset login attempts cache", err)
              );

            // 9. Store refresh token (non-blocking)
            const { userAgent } = getDeviceInfo(request, server);
            RefreshToken.create({
              user: user._id as mongoose.Types.ObjectId,
              token: refreshToken,
              expires: new Date(refreshTokenExpiry * 1000),
              valid: true,
              revoked: false,
              ipAddress: ip,
              userAgent,
            }).catch((err) =>
              logger.error("Failed to create refresh token", err)
            );

            // 10. Create session (non-blocking)
            createOrUpdateSession(
              (user._id as mongoose.Types.ObjectId).toString(),
              accessToken,
              "regular",
              "password",
              ctx as Context
            )
              .then((sessionId) => {
                ctx.headers["x-session-id"] = sessionId;
                ctx.cookie.session_id.set({
                  value: sessionId,
                  httpOnly: true,
                  maxAge: Number(config.jwt.expiresIn),
                  path: "/",
                });
              })
              .catch((err) => logger.error("Failed to create session", err));

            // 11. Set cookies
            access_token.set({
              value: accessToken,
              httpOnly: true,
              secure: true,
              sameSite: "none",
              maxAge: config.jwt.expiresIn,
              path: "/",
            });
            refresh_token.set({
              value: refreshToken,
              httpOnly: true,
              secure: true,
              sameSite: "none",
              maxAge: config.jwt.refreshTokenExpiresIn,
              path: "/",
            });
            role_token.set({
              value: userRole?.name || "",
              maxAge: config.jwt.refreshTokenExpiresIn,
              path: "/",
            });
            set.headers.authorization = `Bearer ${accessToken}`;

            // 12. Background jobs (non-blocking)
            authBackgroundJobs
              .sendLoginAlert(user.email, ip || "", userAgent)
              .catch((err) =>
                logger.error("Failed to queue login alert email", err)
              );

            authBackgroundJobs
              .trackLoginEvent(
                (user._id as mongoose.Types.ObjectId).toString(),
                user.memberId?.toString() || "",
                {
                  ip,
                  userAgent,
                }
              )
              .catch((err) =>
                logger.error("Failed to queue login audit event", err)
              );

            // Update adaptive rate limiter
            adaptiveRateLimiter.updateBehavior(email, ip || "", true);

            const responseTime = Date.now() - startTime;
            authMetrics.recordLogin(true, responseTime, { email, ip });

            logger.info("User logged in", {
              userId: user._id as mongoose.Types.ObjectId,
              memberId: user.memberId,
              responseTime: `${responseTime}ms`,
            });

            set.status = 200;
            return {
              status: "success",
              user: {
                id: (user._id as mongoose.Types.ObjectId).toString(),
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar,
                memberId: user.memberId?.toString(),
                role: userRole?.name || "",
                phone: user.phone,
                address: user.address,
                status: user.status as
                  | "active"
                  | "inactive"
                  | "suspended"
                  | "pending",
                isActive: user.isActive,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt as Date,
              },
              tokens: {
                access_token: accessToken,
                refresh_token: refreshToken,
              },
              message: "Login successful",
              performance: {
                responseTime: `${responseTime}ms`,
                cacheHits: {
                  user: !!(await authCacheService.getUser(email)),
                  role: !!(await authCacheService.getRole(
                    user.role?.toString() || ""
                  )),
                  mfa: !!(await authCacheService.getMFAStatus(
                    (user._id as mongoose.Types.ObjectId).toString()
                  )),
                },
              },
            };
          } catch (error) {
            const responseTime = Date.now() - startTime;
            authMetrics.recordLogin(false, responseTime, {
              email,
              error: (error as Error).message,
            });
            logger.error("Login error", {
              error,
              responseTime: `${responseTime}ms`,
            });

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
                error instanceof Error
                  ? error.message
                  : "Authentication failed",
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
                performance: t.Optional(
                  t.Object({
                    responseTime: t.String(),
                    cacheHits: t.Object({
                      user: t.Boolean(),
                      role: t.Boolean(),
                      mfa: t.Boolean(),
                    }),
                  })
                ),
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
            429: t.Object({
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
                const userRole = await roleService.getRoleById(
                  userProfile.role?.toString() ?? ""
                );

                set.status = 200;
                return {
                  status: "success",
                  user: {
                    id: (userProfile._id as mongoose.Types.ObjectId).toString(),
                    memberId: userProfile.memberId?.toString(),
                    avatar: userProfile.avatar,
                    username: userProfile.username as string,
                    firstName: userProfile.firstName as string,
                    lastName: userProfile.lastName as string,
                    email: userProfile.email as string,
                    status: userProfile.status as string,
                    role: userRole?.name ?? "",
                    phone: userProfile.phone,
                    address: userProfile.address,
                    isActive: userProfile.isActive as boolean,
                    isVerified: userProfile.isVerified as boolean,
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
              await RefreshToken.findOneAndDelete({
                token: refresh_token.value,
              });

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
          .post(
            "/upload/avatar",
            async ({ body, set, user }) => {
              try {
                const fileBuffer = await body.avatar.arrayBuffer(); // Use arrayBuffer for binary data

                const { randomUUID } = new ShortUniqueId({ length: 20 });

                if (!(await isMetaDataImg(fileBuffer))) {
                  return {
                    status: "error",
                    message: "Uploaded file is not a valid image",
                  };
                }

                const fileExtension =
                  body.avatar.name.split(".").pop() || ".png";
                const fileName = `${randomUUID()}.${fileExtension}`; // `${uuidv4()}.${fileExtension}`
                // const metadata = {
                // 	"Content-Type": body.avatar.type,
                // 	"Content-Length": body.avatar.size.toString(), // Set the content length
                // };

                const processed = await processFromBuffer(
                  Buffer.from(fileBuffer)
                );

                // Upload to storage
                const file = await uploadFile(
                  {
                    originalname: fileName, // body.avatar.name,
                    buffer: processed,
                    mimetype: body.avatar.type,
                    size: body.avatar.size,
                  },
                  {
                    userId: user?.id,
                    fileName: "profile-picture.jpg",
                    public: true,
                  }
                );

                // Save file metadata to database
                const fileData = {
                  user: new mongoose.Types.ObjectId(user.id),
                  name: fileName, // body.avatar.name,
                  path: file.path,
                  url: file.url,
                  size: file.size,
                  mimeType: body.avatar.type,
                  description: "User avatar",
                };

                const savedFile = await fileService.createFile(fileData);

                // Update user with new profile picture URL
                await User.findByIdAndUpdate(user?.id, {
                  avatar: file.url,
                });

                set.status = 200;
                return {
                  status: "success",
                  avatar: file.url,
                };
              } catch (error) {
                set.status = 500;
                return {
                  status: "error",
                  message: (error as Error).message,
                };
              }
            },
            {
              body: t.Object({
                avatar: t.File({
                  type: [
                    "image/png",
                    "image/jpeg",
                    "image/gif",
                    "image/bmp",
                    "image/webp",
                  ], // List of acceptable image types
                  maxSize: 5 * 1024 * 1024, // 5 MB in bytes
                }),
              }),
              type: "multipart/form-data",
              response: {
                200: t.Object({
                  status: t.Literal("success"),
                  avatar: t.String(),
                }),
                500: t.Object({
                  status: t.Literal("error"),
                  message: t.String(),
                }),
              },
              detail: {
                tags: ["auth"],
                summary: "User upload avatar",
                description: "Upload a user's avatar",
              },
            }
          )
      )
      .post(
        "/password/forgot",
        async ({ body, set }) => {
          try {
            const user = await userService.getUserBy({
              email: body.email.toLowerCase(),
            });
            if (!user) {
              // For security reasons, don't reveal that the user doesn't exist
              set.status = 200;
              return {
                status: "success",
                message:
                  "If an account with that email exists, a password reset token has been sent",
              };
            }

            // Generate reset token
            const { resetToken, resetExpiry } = generateResetPasswordToken();

            // Save reset token to database
            await ResetToken.create({
              token: resetToken,
              user: user._id,
              expires: resetExpiry,
            });

            // Send reset password email (background job)
            authBackgroundJobs
              .sendPasswordResetEmail(user.email, resetToken)
              .catch((err) =>
                logger.error("Failed to queue password reset email", err)
              );

            set.status = 200;
            return {
              status: "success",
              message:
                "If an account with that email exists, a password reset token has been sent",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to send password reset email",
            };
          }
        },
        {
          detail: {
            tags: ["auth"],
            summary: "Forgot password",
            description: "Send a password reset email to the user",
          },
          body: ForgotPasswordRequestSchema,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.Any(),
            }),
          },
        }
      )
      .post(
        "/password/reset",
        async ({ body, set }) => {
          try {
            const { token, password } = body;
            const resetTokenDoc = await ResetToken.findOne({
              token,
              expires: { $gt: Date.now() },
            });
            if (!resetTokenDoc) {
              set.status = 404;
              return {
                status: "error",
                message: "Invalid or expired reset token",
              };
            }
            const user = await userService.getUserById(
              resetTokenDoc.user.toString()
            );
            if (!user) {
              set.status = 404;
              return {
                status: "error",
                message: "User not found",
              };
            }
            user.password = password;
            user.passwordChangedAt = new Date();

            await user.save();
            // Delete all user's refresh tokens
            await RefreshToken.deleteMany({ user: user._id });

            // Delete the used reset token
            await ResetToken.findByIdAndDelete(resetTokenDoc._id);

            set.status = 200;
            return {
              status: "success",
              message: "Password reset successfully",
            };
          } catch (error) {
            set.status = 500;
            return {
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to reset password",
            };
          }
        },
        {
          body: ResetPasswordRequestSchema,
          response: {
            200: t.Object({
              status: t.Literal("success"),
              message: t.String(),
            }),
            404: t.Object({
              status: t.Literal("error"),
              message: t.String(),
            }),
            500: t.Object({
              status: t.Literal("error"),
              message: t.String(),
              error: t.Any(),
            }),
          },
          detail: {
            tags: ["auth"],
            summary: "Reset password",
            description: "Reset password for a user",
          },
        }
      )
      .post(
        "/refresh",
        async ({
          cookie: { access_token, refresh_token },
          jwt,
          set,
          request,
          server,
        }) => {
          if (!refresh_token.value) {
            // handle error for refresh token is not available
            set.status = 401;
            throw new Error("Refresh token is missing");
          }
          // get refresh token from cookie
          const jwtPayload = await jwt.verify(refresh_token.value as string);
          if (!jwtPayload) {
            // handle error for refresh token is tempted or incorrect
            set.status = 403;
            throw new Error("Refresh token is invalid");
          }

          // Find the refresh token in the database
          const storedRefreshToken = await RefreshToken.findOne({
            token: refresh_token.value,
            revoked: false,
            expires: { $gt: new Date() },
          });

          if (!storedRefreshToken) {
            set.status = 401;
            throw new Error("Invalid or expired refresh token");
          }

          // get user from refresh token
          const userId = jwtPayload.sub as string;

          // verify user exists or not
          const user = await userService.getUserById(
            storedRefreshToken?.user.toString()
          );

          if (!user) {
            // handle error for user not found from the provided refresh token
            set.status = 403;
            throw new Error("Refresh token is invalid");
          }

          // Ensure storedRefreshToken exists before using it
          if (storedRefreshToken) {
            // Revoke the old refresh token
            storedRefreshToken.revoked = true;
            storedRefreshToken.revokedAt = new Date();
            await storedRefreshToken.save();
          }

          // create new access token
          const accessJWTToken = await jwt.sign({
            sub: user.id,
            iss: "access",
            exp: config.jwt.expiresIn,
          });

          access_token.set({
            value: accessJWTToken,
            httpOnly: true,
            maxAge: Number(config.jwt.expiresIn),
            path: "/",
          });

          const accessTokenPayload = {
            id: user.id,
            email: user.email,
            username: user.username,
            role: (user.role as mongoose.Types.ObjectId).toString(),
          };
          // create new refresh token
          const refreshJWTToken = await jwt.sign({
            sub: user.id,
            iss: "refresh",
            exp: config.jwt.refreshTokenExpiresIn,
          });
          refresh_token.set({
            value: refreshJWTToken,
            httpOnly: true,
            maxAge: Number(config.jwt.refreshTokenExpiresIn),
            path: "/",
          });

          const { userAgent, ip } = getDeviceInfo(request, server);

          // Set the old token's replacedByToken field
          storedRefreshToken.replacedByToken = refreshJWTToken;
          await storedRefreshToken.save();

          return {
            message: "Access token generated successfully",
            tokens: {
              access_token: accessJWTToken,
              refresh_token: refreshJWTToken,
            },
          };
        },
        {
          detail: {
            tags: ["auth"],
            summary: "User refresh",
            description: "Refresh a user's access token",
          },
        }
      )
      .group("", (app) =>
        app.use(accessPlugin("refreshTokens", "revoke")).post(
          "/revoke",
          async ({ cookie: { refresh_token }, set }) => {
            try {
              if (!refresh_token.value) {
                set.status = 401;
                throw new Error("Refresh token is missing");
              }

              const storedRefreshToken = await RefreshToken.findOne({
                token: refresh_token.value,
                revoked: false,
              });

              if (!storedRefreshToken) {
                set.status = 400;
                throw new NotFoundError("Token not found");
              }

              // Revoke the token
              if (storedRefreshToken) {
                storedRefreshToken.revoked = true;
                storedRefreshToken.revokedAt = new Date();
                await storedRefreshToken.save();
              }

              // remove refresh token from cookies
              refresh_token.remove();

              set.status = 200;
              return {
                status: "success",
                message: "Token revoked successfully",
              };
            } catch (error) {
              if (error instanceof AppError) {
                set.status = error.statusCode;
                return {
                  status: "error",
                  message: error.message,
                };
              }
              set.status = 500;
              return {
                status: "error",
                message: "An error occurred during token revocation",
              };
            }
          },
          {
            detail: {
              tags: ["auth"],
              summary: "User revoke",
              description: "Revoke a user's access token",
            },
          }
        )
      )
      .use(sessionController)
      .use(twoFactorController)
      .use(passkeyController)
  );
