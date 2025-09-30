import crypto from "node:crypto";
import config from "@kaa/config/api";
import { MFASecret, User } from "@kaa/models";
import { MFAType } from "@kaa/models/types";
import { smsService } from "@kaa/services";
import { redisClient } from "@kaa/utils";
import Elysia, { t } from "elysia";
import type mongoose from "mongoose";
import { SECURITY_CONFIG } from "~/config/security.config";
import { jwtPlugin } from "~/plugins/security.plugin";
import { SessionStore } from "~/services/session-store";
import { authPlugin } from "./auth.plugin";
import { mfaManager } from "./managers/mfa.manager";
import { createOrUpdateSession } from "./session.controller";

// Phone number masking regex
const PHONE_MASK_REGEX = /(\d{3})\d{6}(\d{3})/;

// MFA v2 Controller - Unified implementation
export const mfaController = new Elysia({ name: "mfa-v2" })
  .decorate({
    sessionStore: new SessionStore(process.env.SESSION_STORAGE as any),
  })
  .use(jwtPlugin)
  .use(authPlugin)
  .derive(async ({ user }) => {
    if (!user) return { mfaRequired: false, mfaMethods: [] };

    return await mfaManager.getMFAStatus(user.id).then((status) => ({
      mfaRequired: status.isEnabled,
      mfaMethods: status.methods,
    }));
  })

  // Setup TOTP - initiate setup
  .post(
    "/mfa/setup/totp",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      try {
        const setup = await mfaManager.setupTOTP(user.id);
        return {
          status: "success",
          data: {
            secret: setup.secret,
            qrCode: setup.qrCode,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          status: "error",
          message: "Failed to setup TOTP",
        };
      }
    },
    {
      detail: {
        tags: ["mfa"],
        summary: "Setup TOTP",
        description: "Setup TOTP for MFA",
      },
    }
  )

  // Verify TOTP setup and enable MFA
  .post(
    "/mfa/setup/totp/verify",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { token } = body;

      try {
        const result = await mfaManager.verifyAndEnableTOTP(user.id, token);
        return {
          status: "success",
          message: "TOTP MFA setup completed successfully",
          data: {
            backupCodes: result.backupCodes,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          status: "error",
          message: "Failed to verify TOTP setup",
        };
      }
    },
    {
      body: t.Object({
        token: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Verify TOTP setup",
        description: "Verify TOTP setup for MFA",
      },
    }
  )

  // Setup SMS MFA - initiate setup
  .post(
    "/mfa/setup/sms",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { phoneNumber } = body;

      try {
        const challengeId = await mfaManager.setupSMS(user.id, phoneNumber);
        return {
          status: "success",
          message: "SMS verification code sent",
          data: { challengeId },
        };
      } catch (error) {
        set.status = 400;
        return {
          status: "error",
          message: "Failed to setup SMS MFA",
        };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Setup SMS MFA",
        description: "Setup SMS MFA for MFA",
      },
    }
  )

  // Verify SMS setup and enable MFA
  .post(
    "/mfa/setup/sms/verify",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { challengeId, code } = body;

      try {
        const result = await mfaManager.verifyAndEnableSMS(
          user.id,
          challengeId,
          code
        );
        return {
          status: "success",
          message: "SMS MFA setup completed successfully",
          data: {
            backupCodes: result.backupCodes,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          status: "error",
          message: "Failed to verify SMS setup",
        };
      }
    },
    {
      body: t.Object({
        challengeId: t.String(),
        code: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Verify SMS setup",
        description: "Verify SMS setup for MFA",
      },
    }
  )

  // Create MFA challenge for authentication
  .post(
    "/mfa/challenge",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { type } = body;

      try {
        const challengeId = await mfaManager.createMFAChallenge(user.id, type);
        if (challengeId) {
          return { status: "success", challengeId };
        }
        set.status = 400;
        return {
          status: "error",
          message: "MFA method not available or not enabled",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to create MFA challenge",
        };
      }
    },
    {
      body: t.Object({
        type: t.Optional(t.Enum(MFAType)),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Create MFA challenge",
        description: "Create MFA challenge for MFA",
      },
    }
  )

  // Verify MFA challenge
  .post(
    "/mfa/verify",
    async ({ body, set }) => {
      const { challengeId, code } = body;

      try {
        const verified = await mfaManager.verifyMFAChallenge(challengeId, code);
        if (verified) {
          return { status: "success", message: "MFA verification successful" };
        }
        set.status = 400;
        return {
          status: "error",
          message: "Invalid verification code",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to verify MFA",
        };
      }
    },
    {
      body: t.Object({
        challengeId: t.String(),
        code: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Verify MFA challenge",
        description: "Verify MFA challenge for MFA",
      },
    }
  )

  // Get MFA status
  .get(
    "/mfa/status",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          data: {
            isEnabled: false,
            backupCodesRemaining: 0,
            methods: [],
          },
        };
      }

      try {
        const status = await mfaManager.getMFAStatus(user.id);
        return {
          status: "success",
          data: status,
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get MFA status",
        };
      }
    },
    {
      detail: {
        tags: ["mfa"],
        summary: "Get MFA status",
        description: "Get MFA status for MFA",
      },
    }
  )

  // Disable MFA
  .delete(
    "/mfa/:type",
    async ({ user, set, params }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      try {
        const { type } = params;
        const disabled = await mfaManager.disableMFA(user.id, type);
        if (disabled) {
          return { status: "success", message: "MFA disabled successfully" };
        }
        set.status = 404;
        return {
          status: "error",
          message: "MFA not found or already disabled",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to disable MFA",
        };
      }
    },
    {
      params: t.Object({
        type: t.Enum(MFAType),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Disable MFA",
        description: "Disable MFA for MFA",
      },
    }
  )

  // Regenerate backup codes
  .post(
    "/mfa/recovery-codes/regenerate",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      try {
        const backupCodes = await mfaManager.regenerateBackupCodes(user.id);
        return {
          status: "success",
          message: "Recovery codes regenerated successfully",
          data: { backupCodes },
        };
      } catch (error) {
        set.status = 400;
        return {
          status: "error",
          message: "Failed to regenerate recovery codes",
        };
      }
    },
    {
      detail: {
        tags: ["mfa"],
        summary: "Regenerate backup codes",
        description: "Regenerate backup codes for MFA",
      },
    }
  )

  // Get MFA methods (legacy endpoint for compatibility)
  .get(
    "/mfa/methods",
    async ({ user, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      try {
        const methods = await mfaManager.getUserMFAMethods(user.id);
        return {
          status: "success",
          data: methods.map((method) => ({
            type: method.type,
            isEnabled: method.isEnabled,
            phoneNumber: method.phoneNumber
              ? method.phoneNumber.replace(PHONE_MASK_REGEX, "$1****$2")
              : undefined,
            lastUsed: method.lastUsed,
          })),
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to get MFA methods",
        };
      }
    },
    {
      detail: {
        tags: ["mfa"],
        summary: "Get MFA methods",
        description: "Get MFA methods for MFA",
      },
    }
  )

  // Validate MFA for already authenticated users (equivalent to /2fa/validate)
  .post(
    "/mfa/validate",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { token, recoveryCode } = body;

      try {
        const status = await mfaManager.getMFAStatus(user.id);

        if (!status.isEnabled) {
          set.status = 400;
          return {
            status: "error",
            message: "MFA is not enabled for this user",
          };
        }

        // Get MFA methods to verify against
        const methods = await mfaManager.getUserMFAMethods(user.id);
        const totpMethod = methods.find(
          (m) => m.type === "totp" && m.isEnabled
        );

        let isValid = false;

        // Check recovery code if provided
        if (recoveryCode && totpMethod?.backupCodes) {
          const recoveryCodeIndex =
            totpMethod.backupCodes.indexOf(recoveryCode);
          if (recoveryCodeIndex >= 0) {
            // Remove used backup code
            totpMethod.backupCodes.splice(recoveryCodeIndex, 1);
            await totpMethod.save();
            isValid = true;
          }
        }
        // Check TOTP token if provided
        else if (token && totpMethod?.secret) {
          const speakeasy = await import("speakeasy");
          isValid = speakeasy.totp.verify({
            secret: totpMethod.secret,
            encoding: "base32",
            token,
          });

          if (isValid) {
            totpMethod.lastUsed = new Date();
            await totpMethod.save();
          }
        }

        if (isValid) {
          set.status = 200;
          return {
            status: "success",
            message: "MFA validation successful",
          };
        }

        set.status = 401;
        return {
          status: "error",
          message: "Invalid verification code or recovery code",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to validate MFA",
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
        tags: ["mfa"],
        summary: "Validate MFA",
        description: "Validate MFA for MFA",
      },
    }
  )

  // Verify backup code specifically (equivalent to /2fa/verify/backup-code)
  .post(
    "/mfa/verify/backup-code",
    async ({ user, body, set }) => {
      if (!user) {
        set.status = 401;
        return {
          status: "error",
          message: "Authentication required",
        };
      }

      const { token } = body;

      try {
        const status = await mfaManager.getMFAStatus(user.id);

        if (!status.isEnabled) {
          set.status = 400;
          return {
            status: "error",
            message: "MFA is not enabled for this user",
          };
        }

        // Get MFA methods to verify against
        const methods = await mfaManager.getUserMFAMethods(user.id);
        const totpMethod = methods.find(
          (m) => m.type === "totp" && m.isEnabled
        );

        if (!totpMethod?.backupCodes) {
          set.status = 400;
          return {
            status: "error",
            message: "No backup codes available",
          };
        }

        const recoveryCodeIndex = totpMethod.backupCodes.indexOf(token);
        if (recoveryCodeIndex >= 0) {
          // Remove used backup code
          totpMethod.backupCodes.splice(recoveryCodeIndex, 1);
          totpMethod.lastUsed = new Date();
          await totpMethod.save();

          return {
            status: "success",
            message: "Backup code verified successfully",
            usedBackupCode: true,
          };
        }

        // Also try regular TOTP verification
        const speakeasy = await import("speakeasy");
        const isValidTOTP = speakeasy.totp.verify({
          secret: totpMethod.secret,
          encoding: "base32",
          token,
        });

        if (isValidTOTP) {
          totpMethod.lastUsed = new Date();
          await totpMethod.save();
          return {
            status: "success",
            message: "TOTP verified successfully",
            usedBackupCode: false,
          };
        }

        set.status = 401;
        return {
          status: "error",
          message: "Invalid verification code",
        };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to verify backup code",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      body: t.Object({
        token: t.String(),
        recoveryCode: t.Optional(t.String()),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Verify backup code",
        description: "Verify backup code for MFA",
      },
    }
  )
  // Complete login with MFA (equivalent to /2fa/complete/login)
  .post(
    "/mfa/complete/login",
    async (ctx) => {
      const { body, set, jwt, cookie } = ctx;
      try {
        const { userId, token, recoveryCode } = body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
          set.status = 404;
          return {
            status: "error",
            message: "User not found",
          };
        }

        const mfaSecret = await MFASecret.findOne({ userId: user.id });
        if (!mfaSecret) {
          set.status = 404;
          return {
            status: "error",
            message: "MFA not found",
          };
        }

        // Check if 2FA is enabled
        if (!mfaSecret.isEnabled) {
          set.status = 400;
          return {
            status: "error",
            message: "MFA is not enabled for this user",
          };
        }

        // Verify 2FA token or recovery code
        let isValid = false;

        // Check recovery code if provided
        if (recoveryCode && mfaSecret.backupCodes) {
          const recoveryCodeIndex = mfaSecret.backupCodes.indexOf(recoveryCode);
          if (recoveryCodeIndex >= 0) {
            // Remove the used recovery code
            mfaSecret.backupCodes.splice(recoveryCodeIndex, 1);
            await mfaSecret.save();
            isValid = true;
          }
        }
        // Check TOTP token if provided
        else if (token && mfaSecret.secret) {
          const speakeasy = await import("speakeasy");
          isValid = speakeasy.totp.verify({
            secret: mfaSecret.secret,
            encoding: "base32",
            token,
          });
        }

        if (!isValid) {
          set.status = 401;
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
          ctx,
          ctx.sessionStore
        );

        // Create new access token
        const accessJWTToken = await jwt.sign({
          sub: (user._id as mongoose.Types.ObjectId).toString(),
          iss: "access",
          exp: Math.floor(Date.now() / 1000) + config.jwt.expiresIn,
        });

        cookie.access_token.set({
          value: accessJWTToken,
          httpOnly: true,
          maxAge: Number(config.jwt.expiresIn),
          path: "/",
        });

        // Create new refresh token
        const refreshJWTToken = await jwt.sign({
          sub: (user._id as mongoose.Types.ObjectId).toString(),
          iss: "refresh",
          exp: Math.floor(Date.now() / 1000) + config.jwt.refreshTokenExpiresIn,
        });

        cookie.refresh_token.set({
          value: refreshJWTToken,
          httpOnly: true,
          maxAge: Number(config.jwt.refreshTokenExpiresIn),
          path: "/",
        });

        // Get user profile without sensitive information
        const userProfile = user.getPublicProfile();

        // Set session ID in header for subsequent requests
        set.headers["x-session-id"] = sessionId.sessionId;
        cookie.session_id.set({
          value: sessionId.sessionId,
          httpOnly: true,
          maxAge: SECURITY_CONFIG.sessionMaxAge,
          path: "/",
        });

        set.status = 200;
        return {
          status: "success",
          tokens: {
            access_token: accessJWTToken,
            refresh_token: refreshJWTToken,
          },
          user: userProfile,
          sessionId,
        };
      } catch (error) {
        console.error("MFA login error:", error);
        set.status = 500;
        return {
          status: "error",
          message: "MFA login failed",
          error: error instanceof Error ? error.message : String(error),
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
        tags: ["mfa"],
        summary: "Complete login with MFA",
      },
    }
  );

// Account recovery controller (kept separate as in original)
export const accountRecoveryController = new Elysia({
  name: "account-recovery",
})
  .post(
    "/recovery/request",
    async ({ body, set }) => {
      const { email, phoneNumber } = body;

      // Implementation would depend on your user model
      // This is a placeholder for the recovery flow

      try {
        // Generate recovery token
        const recoveryToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store recovery token (would typically be in database)
        await redisClient.setEx(
          `recovery_token:${recoveryToken}`,
          3600,
          JSON.stringify({ email, phoneNumber, expiresAt })
        );

        // Send recovery code via SMS or email
        if (phoneNumber) {
          const code = Math.floor(100_000 + Math.random() * 900_000).toString();
          const message = `Your Kaa Rental Platform recovery code is: ${code}. Valid for 1 hour.`;

          await smsService.sendSms({
            to: phoneNumber,
            message,
            type: "notification",
          });

          await redisClient.setEx(`recovery_code:${phoneNumber}`, 3600, code);
        }

        return { status: "success", message: "Recovery instructions sent" };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to process recovery request",
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        phoneNumber: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Request recovery",
        description: "Request recovery for MFA",
      },
    }
  )
  .post(
    "/recovery/verify",
    async ({ body, set }) => {
      const { phoneNumber, code, newPassword } = body;

      try {
        const storedCode = await redisClient.get(
          `recovery_code:${phoneNumber}`
        );

        if (!storedCode || storedCode !== code) {
          set.status = 400;
          return {
            status: "error",
            message: "Invalid recovery code",
          };
        }

        // Reset password logic would go here
        // This would typically update the user's password in the database

        // Clean up recovery code
        await redisClient.del(`recovery_code:${phoneNumber}`);

        return { status: "success", message: "Password reset successfully" };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: "Failed to reset password",
        };
      }
    },
    {
      body: t.Object({
        phoneNumber: t.String(),
        code: t.String(),
        newPassword: t.String(),
      }),
      detail: {
        tags: ["mfa"],
        summary: "Verify recovery",
        description: "Verify recovery for MFA",
      },
    }
  );
