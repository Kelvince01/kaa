import crypto from "node:crypto";
import config from "@kaa/config/api";
import { MFASecret, User } from "@kaa/models";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import { jwtPlugin } from "~/plugins/security.plugin";
import { authPlugin } from "./auth.plugin";
import { createOrUpdateSession } from "./session.controller";

export const twoFactorController = new Elysia().group("2fa", (app) =>
  app
    .use(jwtPlugin)
    .post(
      "/complete/login",
      async (ctx) => {
        try {
          const { userId, token, recoveryCode } = ctx.body;

          // Find the user
          const user = await User.findById(userId);
          if (!user) {
            ctx.set.status = 404;
            return {
              status: "error",
              message: "User not found",
            };
          }

          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            ctx.set.status = 404;
            return {
              status: "error",
              message: "MFA not found",
            };
          }

          // Check if 2FA is enabled
          if (!mfaSecret.isEnabled) {
            ctx.set.status = 400;
            return {
              status: "error",
              message: "Two-factor authentication is not enabled for this user",
            };
          }

          // Verify 2FA token or recovery code
          let isValid = false;

          // Check recovery code if provided
          if (recoveryCode && mfaSecret.backupCodes) {
            const recoveryCodeIndex =
              mfaSecret.backupCodes.indexOf(recoveryCode);

            if (recoveryCodeIndex >= 0) {
              // Remove the used recovery code
              mfaSecret.backupCodes.splice(recoveryCodeIndex, 1);
              await mfaSecret.save();
              isValid = true;
            }
          }
          // Check TOTP token if provided
          else if (token && mfaSecret.secret) {
            isValid = speakeasy.totp.verify({
              secret: mfaSecret.secret,
              encoding: "base32",
              token,
            });
          }

          if (!isValid) {
            ctx.set.status = 401;
            return {
              status: "error",
              message: "Invalid verification code or recovery code",
            };
          }

          // Create or update session
          const sessionId = await createOrUpdateSession(
            (user._id as mongoose.Types.ObjectId).toString(),
            token,
            "regular",
            "otp",
            ctx
          );

          // create new access token
          const accessJWTToken = await ctx.jwt.sign({
            sub: (user._id as mongoose.Types.ObjectId).toString(),
            iss: "access",
            exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
          });

          ctx.cookie.access_token.set({
            value: accessJWTToken,
            httpOnly: true,
            maxAge: Number(config.jwt.expiresIn),
            path: "/",
          });

          // create new refresh token
          const refreshJWTToken = await ctx.jwt.sign({
            sub: (user._id as mongoose.Types.ObjectId).toString(),
            iss: "refresh",
            exp:
              Math.floor(Date.now() / 1000) + config.jwt.refreshTokenExpiresIn,
          });
          ctx.cookie.refresh_token.set({
            value: refreshJWTToken,
            httpOnly: true,
            maxAge: Number(config.jwt.refreshTokenExpiresIn),
            path: "/",
          });

          // Get user profile without sensitive information
          const userProfile = user.getPublicProfile();

          // Set session ID in header for subsequent requests
          ctx.headers["x-session-id"] = sessionId;
          ctx.cookie.session_id.set({
            value: sessionId,
            httpOnly: true,
            maxAge: Number(config.jwt.expiresIn),
            path: "/",
          });

          ctx.set.status = 200;
          return {
            status: "success",
            tokens: {
              access_token: accessJWTToken,
              refresh_token: refreshJWTToken,
            },
            user: userProfile,
            sessionId,
          };
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error("2FA login error:", error as Error);
          ctx.set.status = 500;
          return {
            status: "error",
            message: "Two-factor authentication failed",
            error: errorMessage,
          };
        }
      },
      {
        body: t.Object({
          userId: t.String(),
          token: t.String(),
          recoveryCode: t.Optional(t.String()),
        }),
        detail: {
          tags: ["2fa"],
          summary: "Complete login with 2FA",
        },
      }
    )
    .use(authPlugin)
    .get(
      "/status",
      async ({ set, user }) => {
        try {
          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            set.status = 404;
            return {
              status: "error",
              data: {
                isEnabled: false,
                backupCodesRemaining: 0,
              },
              message: "MFA not found",
            };
          }

          set.status = 200;
          return {
            status: "success",
            data: {
              isEnabled: mfaSecret.isEnabled,
              backupCodesRemaining: mfaSecret.backupCodes.length || 0,
            },
          };
        } catch (error) {
          console.error("Error checking 2FA status:", error as Error);
          set.status = 500;
          return {
            status: "error",
            data: {
              isEnabled: false,
              backupCodesRemaining: 0,
            },
            message: "Failed to check 2FA status",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        detail: {
          tags: ["2fa"],
          summary: "Check 2FA status",
        },
      }
    )
    .post(
      "/setup",
      async ({ user }) => {
        try {
          let mfaSecret = await MFASecret.findOne({ userId: user.id });

          // Check if 2FA is already enabled
          if (mfaSecret?.isEnabled) {
            return {
              status: "error",
              message: "Two-factor authentication is already enabled",
            };
          }

          // Generate a new secret
          const secret = speakeasy.generateSecret({
            length: 20,
            name: `Kaa:${user.email}`,
          });

          // Save the secret to the user (they'll need to verify before it's active)
          if (!mfaSecret) {
            mfaSecret = new MFASecret({
              userId: user.id,
              secret: secret.base32,
            });
          }
          await mfaSecret.save();

          // Generate QR code
          const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || "");

          return {
            status: "success",
            secret: secret.base32,
            qrCodeUrl,
          };
        } catch (error) {
          console.error("Error setting up 2FA:", error as Error);
          return {
            status: "error",
            message: "Failed to set up two-factor authentication",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        detail: {
          tags: ["2fa"],
          summary: "Setup 2FA",
        },
      }
    )
    .post(
      "/verify",
      async ({ body, user }) => {
        try {
          const { token, secret } = body;

          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            return {
              status: "error",
              message: "MFA not found",
            };
          }

          // Verify that the provided secret matches the stored secret
          if (mfaSecret.secret !== secret) {
            return {
              status: "error",
              message: "Invalid secret",
            };
          }

          // Verify the token
          const verified = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token,
          });

          if (!verified) {
            return {
              status: "error",
              message: "Invalid verification code",
            };
          }

          // Generate recovery codes
          const recoveryCodes = generateRecoveryCodes();

          // Enable 2FA for the user
          mfaSecret.isEnabled = true;
          mfaSecret.backupCodes = recoveryCodes;
          mfaSecret.lastUsed = new Date();
          await mfaSecret.save();

          return {
            status: "success",
            message: "Two-factor authentication enabled successfully",
            recoveryCodes,
          };
        } catch (error) {
          console.error("Error enabling 2FA:", error as Error);
          return {
            status: "error",
            message: "Failed to enable two-factor authentication",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        body: t.Object({
          token: t.String(),
          secret: t.String(),
        }),
        detail: {
          tags: ["2fa"],
          summary: "Verify 2FA",
        },
      }
    )
    .post(
      "/verify/backup-code",
      async ({ body, user }) => {
        try {
          const { token } = body;

          const mfaSecret = await MFASecret.findOne({
            userId: user.id,
            isEnabled: true,
          });
          if (!mfaSecret) {
            return {
              status: "error",
              message: "MFA not enabled",
            };
          }

          // Check if it's a backup code
          if (mfaSecret.backupCodes.includes(token)) {
            // Remove used backup code
            mfaSecret.backupCodes = mfaSecret.backupCodes.filter(
              (code) => code !== token
            );
            mfaSecret.lastUsed = new Date();
            await mfaSecret.save();
            return { status: "success", usedBackupCode: true };
          }

          // Verify the token
          const verified = speakeasy.totp.verify({
            secret: mfaSecret.secret,
            encoding: "base32",
            token,
          });

          if (!verified) {
            return {
              status: "error",
              message: "Invalid verification code",
            };
          }

          mfaSecret.lastUsed = new Date();
          await mfaSecret.save();

          return { status: "success", usedBackupCode: false };
        } catch (error) {
          console.error("Error verifying recovery code:", error as Error);
          return {
            status: "error",
            message: "Failed to verify recovery code",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        body: t.Object({
          token: t.String(),
        }),
        detail: {
          tags: ["2fa"],
          summary: "Verify 2FA backup code",
        },
      }
    )
    .delete(
      "/disable",
      async ({ user }) => {
        try {
          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            return {
              status: "error",
              message: "MFA not found",
            };
          }

          // Check if 2FA is not enabled
          if (!mfaSecret.isEnabled) {
            return {
              status: "error",
              message: "Two-factor authentication is not enabled",
            };
          }

          // Disable 2FA
          await mfaSecret.deleteOne();

          return {
            status: "success",
            message: "Two-factor authentication disabled successfully",
          };
        } catch (error) {
          console.error("Error disabling 2FA:", error as Error);
          return {
            status: "error",
            message: "Failed to disable two-factor authentication",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        detail: {
          tags: ["2fa"],
          summary: "Disable 2FA",
        },
      }
    )
    .post(
      "/recovery-codes/regenerate",
      async ({ user }) => {
        try {
          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            return {
              status: "error",
              message: "MFA not found",
            };
          }

          // Check if 2FA is not enabled
          if (!mfaSecret.isEnabled) {
            return {
              status: "error",
              message: "Two-factor authentication is not enabled",
            };
          }

          // Generate new recovery codes
          const recoveryCodes = generateRecoveryCodes();

          // Save the new recovery codes to the user
          mfaSecret.backupCodes = recoveryCodes;
          await mfaSecret.save();

          return {
            status: "success",
            message: "Recovery codes regenerated successfully",
            recoveryCodes,
          };
        } catch (error) {
          console.error("Error regenerating recovery codes:", error as Error);
          return {
            status: "error",
            message: "Failed to regenerate recovery codes",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        detail: {
          tags: ["2fa"],
          summary: "Regenerate recovery codes",
        },
      }
    )
    .post(
      "/validate",
      async ({ set, body, user }) => {
        try {
          const { token, recoveryCode } = body;
          const mfaSecret = await MFASecret.findOne({ userId: user.id });
          if (!mfaSecret) {
            return {
              status: "error",
              message: "MFA not found",
            };
          }

          // Check if 2FA is not enabled
          if (!mfaSecret.isEnabled) {
            return {
              status: "error",
              message: "Two-factor authentication is not enabled",
            };
          }

          let isValid = false;

          // Check recovery code if provided
          if (recoveryCode) {
            const recoveryCodeIndex =
              mfaSecret.backupCodes?.indexOf(recoveryCode) ?? -1;

            if (recoveryCodeIndex >= 0) {
              // Remove the used recovery code
              mfaSecret.backupCodes?.splice(recoveryCodeIndex, 1);
              await mfaSecret.save();
              isValid = true;
            }
          }
          // Check TOTP token if provided
          else if (token && mfaSecret.secret) {
            isValid = speakeasy.totp.verify({
              secret: mfaSecret.secret,
              encoding: "base32",
              token,
            });
          }

          // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
          if (isValid) {
            set.status = 200;
            return {
              status: "success",
              message: "Two-factor authentication successful",
            };
          }
          set.status = 401;
          return {
            status: "error",
            message: "Invalid verification code or recovery code",
          };
        } catch (error) {
          console.error("Error validating 2FA token:", error as Error);
          return {
            status: "error",
            message: "Failed to validate two-factor authentication",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        body: t.Object({
          token: t.Optional(t.String()),
          recoveryCode: t.Optional(t.String()),
        }),
        detail: {
          tags: ["2fa"],
          summary: "Validate 2FA token",
        },
      }
    )
);

/**
 * Generate recovery codes
 * @returns Array of recovery codes
 */
const generateRecoveryCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Format: xxxx-xxxx-xxxx
    const code = `${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;
    codes.push(code);
  }
  return codes;
};
