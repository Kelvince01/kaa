import crypto from "node:crypto";
import { MFASecret } from "@kaa/models";
import {
  type IMFAChallenge,
  type IMFASecret,
  MFAStatus,
  MFAType,
  SmsType,
} from "@kaa/models/types";
import { smsService } from "@kaa/services";
import { redisClient } from "@kaa/utils";
import { redis } from "bun";
import mongoose from "mongoose";
import * as qrcode from "qrcode";
import type { RedisClientType } from "redis";
import * as speakeasy from "speakeasy";

// MFA Manager - Consolidated implementation
class MFAManager {
  private readonly challenges = new Map<string, IMFAChallenge>();
  private readonly redis: RedisClientType;

  constructor() {
    this.redis = redisClient;
  }

  // Setup TOTP for user (returns setup data, doesn't enable yet)
  async setupTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    // Check if MFA is already enabled
    const existingMFA = await MFASecret.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    });

    if (existingMFA) {
      throw new Error("MFA is already enabled for this user");
    }

    const secret = speakeasy.generateSecret({
      name: `Kaa Rental Platform (${userId})`,
      issuer: "Kaa Rental Platform",
      length: 32,
    });

    const qrCode = await qrcode.toDataURL(secret.otpauth_url || "");

    // Store setup data temporarily in Redis
    await this.redis.setEx(
      `mfa_setup:${userId}:totp`,
      600, // 10 minutes
      JSON.stringify({
        secret: secret.base32,
        createdAt: new Date().toISOString(),
      })
    );

    return {
      secret: secret.base32,
      qrCode,
    };
  }

  // Verify TOTP setup and enable MFA
  async verifyAndEnableTOTP(
    userId: string,
    token: string
  ): Promise<{ backupCodes: string[] }> {
    const setupData = await this.redis.get(`mfa_setup:${userId}:totp`);
    if (!setupData) {
      throw new Error("Setup session expired or not found");
    }
    // const mfaSecret = await MFASecret.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    // if (!mfaSecret) {
    //   return {
    //     status: "error",
    //     message: "MFA not found",
    //   };
    // }

    // // Verify that the provided secret matches the stored secret
    // if (mfaSecret.secret !== secret) {
    //   return {
    //     status: "error",
    //     message: "Invalid secret",
    //   };
    // }

    const setup = JSON.parse(setupData);
    const verified = speakeasy.totp.verify({
      secret: setup.secret,
      encoding: "base32",
      token,
      window: 2, // Allow 60 seconds window
    });

    if (!verified) {
      throw new Error("Invalid verification token");
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Create permanent MFA record
    const mfaSecret = new MFASecret({
      userId: new mongoose.Types.ObjectId(userId),
      type: MFAType.TOTP,
      secret: setup.secret,
      backupCodes,
      isEnabled: true,
      lastUsed: new Date(),
    });

    await mfaSecret.save();

    // Clean up temporary setup data
    await this.redis.del(`mfa_setup:${userId}:totp`);

    return { backupCodes };
  }

  // Setup SMS MFA
  async setupSMS(userId: string, phoneNumber: string): Promise<string> {
    // Check if MFA is already enabled
    const existingMFA = await MFASecret.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    });

    if (existingMFA) {
      throw new Error("MFA is already enabled for this user");
    }

    const code = this.generateSMSCode();
    const challenge = this.createChallenge(
      userId,
      MFAType.SMS,
      code,
      phoneNumber
    );

    const message = `Your Kaa Rental Platform verification code is: ${code}. Valid for 5 minutes.`;
    const sent = await smsService.sendSms({
      to: [
        {
          phoneNumber,
        },
      ],
      message,
      type: SmsType.NOTIFICATION,
    });

    if (!sent.success) {
      throw new Error("Failed to send SMS verification code");
    }

    this.challenges.set(challenge.id, challenge);
    await this.redis.setEx(
      `mfa_challenge:${challenge.id}`,
      300,
      JSON.stringify(challenge)
    );

    return challenge.id;
  }

  // Verify SMS setup and enable MFA
  async verifyAndEnableSMS(
    userId: string,
    challengeId: string,
    code: string
  ): Promise<{ backupCodes: string[] }> {
    const challenge = await this.getChallenge(challengeId);
    if (
      !challenge ||
      challenge.userId.toString() !== userId ||
      challenge.type !== MFAType.SMS
    ) {
      throw new Error("Invalid challenge");
    }

    if (!this.verifyChallenge(challenge, code)) {
      throw new Error("Invalid verification code");
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Create permanent MFA record
    const mfaSecret = new MFASecret({
      userId: new mongoose.Types.ObjectId(userId),
      type: MFAType.SMS,
      phoneNumber: challenge.phoneNumber,
      backupCodes,
      isEnabled: true,
      createdAt: new Date(),
    });

    await mfaSecret.save();

    // Clean up challenge
    await this.cleanupChallenge(challengeId);

    return { backupCodes };
  }

  // Create MFA challenge for authentication
  async createMFAChallenge(
    userId: string,
    type?: MFAType
  ): Promise<string | null> {
    const userMFAs = await MFASecret.find({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    });

    if (userMFAs.length === 0) {
      return null;
    }

    // Use preferred type or first available
    const mfaSetup = type
      ? userMFAs.find((mfa) => mfa.type === type) || userMFAs[0]
      : userMFAs[0];

    if (mfaSetup.type === MFAType.SMS && mfaSetup.phoneNumber) {
      const code = this.generateSMSCode();
      const challenge = this.createChallenge(
        userId,
        MFAType.SMS,
        code,
        mfaSetup.phoneNumber
      );

      const message = `Your Kaa Rental Platform login code is: ${code}. Valid for 5 minutes.`;
      const sent = await smsService.sendSms({
        to: [{ phoneNumber: mfaSetup.phoneNumber }],
        message,
        type: SmsType.NOTIFICATION,
      });

      if (sent.success) {
        this.challenges.set(challenge.id, challenge);
        await this.redis.setEx(
          `mfa_challenge:${challenge.id}`,
          300,
          JSON.stringify(challenge)
        );
        return challenge.id;
      }
    } else if (mfaSetup.type === MFAType.TOTP) {
      // For TOTP, create a challenge record for tracking
      const challenge = this.createChallenge(userId, MFAType.TOTP, "");
      this.challenges.set(challenge.id, challenge);
      await this.redis.setEx(
        `mfa_challenge:${challenge.id}`,
        300,
        JSON.stringify(challenge)
      );
      return challenge.id;
    }

    return null;
  }

  // Verify MFA challenge
  async verifyMFAChallenge(
    challengeId: string,
    code: string
  ): Promise<boolean> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) return false;

    const userMFAs = await MFASecret.find({
      userId: challenge.userId,
      isEnabled: true,
    });

    const mfaSetup = userMFAs.find((mfa) => mfa.type === challenge.type);

    if (!mfaSetup) return false;

    let verified = false;

    if (challenge.type === MFAType.SMS) {
      verified = this.verifyChallenge(challenge, code);
    } else if (challenge.type === MFAType.TOTP && mfaSetup.secret) {
      verified = speakeasy.totp.verify({
        secret: mfaSetup.secret,
        encoding: "base32",
        token: code,
        window: 2,
      });
    } else if (mfaSetup.backupCodes?.includes(code)) {
      // Use backup code
      verified = this.verifyBackupCode(mfaSetup, code);
    }

    if (verified) {
      challenge.status = MFAStatus.VERIFIED;
      mfaSetup.lastUsed = new Date();
      await mfaSetup.save();
      await this.cleanupChallenge(challengeId);
      return true;
    }

    // Handle failed attempts
    challenge.attempts++;
    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.status = MFAStatus.FAILED;
      await this.cleanupChallenge(challengeId);
    } else {
      await this.redis.setEx(
        `mfa_challenge:${challengeId}`,
        300,
        JSON.stringify(challenge)
      );
    }

    return false;
  }

  // Disable MFA for user
  async disableMFA(userId: string, type: MFAType): Promise<boolean> {
    const mfaSecret = await MFASecret.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!mfaSecret) {
      throw new Error("MFA not found");
    }

    // Check if MFA is not enabled
    if (!mfaSecret.isEnabled) {
      throw new Error("MFA is not enabled");
    }

    const result = await MFASecret.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      type,
    });

    return result.deletedCount > 0;
  }

  // Get user MFA methods
  async getUserMFAMethods(userId: string): Promise<IMFASecret[]> {
    return await MFASecret.find({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  // Get MFA status for user
  async getMFAStatus(userId: string): Promise<{
    isEnabled: boolean;
    backupCodesRemaining: number;
    methods: Array<{ type: MFAType; phoneNumber?: string; lastUsed?: Date }>;
  }> {
    const enabledMfas = await MFASecret.find({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    });

    return {
      isEnabled: enabledMfas.length > 0,
      backupCodesRemaining: enabledMfas[0]?.backupCodes?.length || 0,
      methods: enabledMfas.map((mfa) => ({
        type: mfa.type,
        phoneNumber: mfa.phoneNumber,
        lastUsed: mfa.lastUsed,
      })),
    };
  }

  // Regenerate backup codes
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const mfas = await MFASecret.find({
      userId: new mongoose.Types.ObjectId(userId),
      isEnabled: true,
    });

    if (mfas.length === 0) {
      throw new Error("MFA not enabled for this user");
    }

    const backupCodes = this.generateBackupCodes();

    // Update all enabled MFA methods with new backup codes
    await MFASecret.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isEnabled: true,
      },
      { backupCodes }
    );

    return backupCodes;
  }

  // Generate backup codes (format: xxxx-xxxx-xxxx)
  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = `${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}-${crypto.randomBytes(2).toString("hex")}`;
      codes.push(code.toUpperCase());
    }
    return codes;
  }

  // Generate SMS code
  private generateSMSCode(): string {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  // Create challenge
  private createChallenge(
    userId: string,
    type: MFAType,
    code: string,
    phoneNumber?: string
  ): IMFAChallenge {
    return {
      id: crypto.randomUUID(),
      userId: new mongoose.Types.ObjectId(userId),
      type,
      code,
      phoneNumber,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      maxAttempts: 3,
      status: MFAStatus.PENDING,
      createdAt: new Date(),
    };
  }

  // Get challenge
  private async getChallenge(
    challengeId: string
  ): Promise<IMFAChallenge | null> {
    let challenge = this.challenges.get(challengeId);

    if (!challenge) {
      const challengeData = await this.redis.get(
        `mfa_challenge:${challengeId}`
      );
      if (challengeData) {
        challenge = JSON.parse(challengeData);
        this.challenges.set(challengeId, challenge as IMFAChallenge);
      }
    }

    if (challenge && new Date() > new Date(challenge.expiresAt)) {
      challenge.status = MFAStatus.EXPIRED;
      await this.cleanupChallenge(challengeId);
      return null;
    }

    return challenge || null;
  }

  // Verify challenge code
  private verifyChallenge(challenge: IMFAChallenge, code: string): boolean {
    return (
      challenge.code === code &&
      challenge.status === MFAStatus.PENDING &&
      new Date() <= new Date(challenge.expiresAt)
    );
  }

  // Verify backup code
  private verifyBackupCode(mfaSetup: IMFASecret, code: string): boolean {
    if (!mfaSetup.backupCodes) return false;

    const index = mfaSetup.backupCodes.indexOf(code);
    if (index !== -1) {
      // Remove used backup code
      mfaSetup.backupCodes.splice(index, 1);
      return true;
    }

    return false;
  }

  // Cleanup challenge
  private async cleanupChallenge(challengeId: string): Promise<void> {
    this.challenges.delete(challengeId);
    await redis.del(`mfa_challenge:${challengeId}`);
  }
}

export const mfaManager = new MFAManager();
