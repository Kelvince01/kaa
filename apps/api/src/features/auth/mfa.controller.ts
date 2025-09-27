import crypto from "node:crypto";
import type { MFAType } from "@kaa/models/types";
import { smsService } from "@kaa/services";
import { redisClient } from "@kaa/utils";
import Elysia from "elysia";
import { authPlugin } from "./auth.plugin";
import { mfaManager } from "./managers/mfa.manager";

// MFA Middleware
export const mfaController = new Elysia({ name: "mfa" })
  .use(authPlugin)
  .derive(({ user }) => {
    if (!user) return { mfaRequired: false, mfaMethods: [] };

    const mfaMethods = mfaManager.getUserMFAMethods(user.id);
    const mfaRequired = mfaMethods.length > 0;

    return { mfaRequired, mfaMethods };
  })
  .post("/mfa/setup/totp", async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    try {
      const setup = await mfaManager.setupTOTP(user.id);
      return {
        success: true,
        data: {
          secret: setup.secret,
          qrCode: setup.qrCode,
          backupCodes: setup.backupCodes,
        },
      };
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to setup TOTP");
    }
  })
  .post("/mfa/setup/totp/verify", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const { token } = body as { token: string };

    try {
      const verified = await mfaManager.verifyTOTPSetup(user.id, token);
      if (verified) {
        return { success: true, message: "TOTP setup completed successfully" };
      }
      set.status = 400;
      throw new Error("Invalid token");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to verify TOTP setup");
    }
  })
  .post("/mfa/setup/sms", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const { phoneNumber } = body as { phoneNumber: string };

    try {
      const sent = await mfaManager.setupSMS(user.id, phoneNumber);
      if (sent) {
        return { success: true, message: "SMS verification code sent" };
      }
      set.status = 500;
      throw new Error("Failed to send SMS");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to setup SMS MFA");
    }
  })
  .post("/mfa/setup/sms/verify", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const { challengeId, code } = body as { challengeId: string; code: string };

    try {
      const verified = await mfaManager.verifySMSSetup(
        user.id,
        challengeId,
        code
      );
      if (verified) {
        return {
          success: true,
          message: "SMS MFA setup completed successfully",
        };
      }
      set.status = 400;
      throw new Error("Invalid code");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to verify SMS setup");
    }
  })
  .post("/mfa/challenge", async ({ user, body, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const { type } = body as { type: MFAType };

    try {
      const challengeId = await mfaManager.createMFAChallenge(user.id, type);
      if (challengeId) {
        return { success: true, challengeId };
      }
      set.status = 400;
      throw new Error("MFA method not available");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to create MFA challenge");
    }
  })
  .post("/mfa/verify", async ({ body, set }) => {
    const { challengeId, code } = body as { challengeId: string; code: string };

    try {
      const verified = await mfaManager.verifyMFAChallenge(challengeId, code);
      if (verified) {
        return { success: true, message: "MFA verification successful" };
      }
      set.status = 400;
      throw new Error("Invalid code");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to verify MFA");
    }
  })
  .delete("/mfa/:type", async ({ user, params, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    const { type } = params;

    try {
      const disabled = await mfaManager.disableMFA(user.id, type as MFAType);
      if (disabled) {
        return { success: true, message: "MFA method disabled successfully" };
      }
      set.status = 404;
      throw new Error("MFA method not found");
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to disable MFA");
    }
  })
  .get("/mfa/methods", ({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Authentication required");
    }

    try {
      const methods = mfaManager.getUserMFAMethods(user.id);
      return {
        success: true,
        data: methods.map((method) => ({
          type: method.type,
          isEnabled: method.isEnabled,
          phoneNumber: method.phoneNumber
            ? // biome-ignore lint/performance/useTopLevelRegex: false positive
              method.phoneNumber.replace(/(\d{3})\d{6}(\d{3})/, "$1****$2")
            : undefined,
          lastUsed: method.lastUsed,
        })),
      };
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to get MFA methods");
    }
  });

// Account recovery middleware
export const accountRecoveryController = new Elysia({
  name: "account-recovery",
})
  .post("/recovery/request", async ({ body, set }) => {
    const { email, phoneNumber } = body as {
      email?: string;
      phoneNumber?: string;
    };

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

      return { success: true, message: "Recovery instructions sent" };
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to process recovery request");
    }
  })
  .post("/recovery/verify", async ({ body, set }) => {
    const { phoneNumber, code, newPassword } = body as {
      phoneNumber: string;
      code: string;
      newPassword: string;
    };

    try {
      const storedCode = await redisClient.get(`recovery_code:${phoneNumber}`);

      if (!storedCode || storedCode !== code) {
        set.status = 400;
        throw new Error("Invalid recovery code");
      }

      // Reset password logic would go here
      // This would typically update the user's password in the database

      // Clean up recovery code
      await redisClient.del(`recovery_code:${phoneNumber}`);

      return { success: true, message: "Password reset successfully" };
    } catch (error) {
      set.status = 500;
      throw new Error("Failed to reset password");
    }
  });
