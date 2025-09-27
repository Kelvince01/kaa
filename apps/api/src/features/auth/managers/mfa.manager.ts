import crypto from "node:crypto";
import {
  type IMFAChallenge,
  type IMFASetup,
  MFAStatus,
  MFAType,
} from "@kaa/models/types";
import { smsService } from "@kaa/services";
// import { MFAChallenge, MFASetup } from "@kaa/models";
import { redisClient } from "@kaa/utils";
import { redis } from "bun";
import mongoose from "mongoose";
import * as qrcode from "qrcode";
import type { RedisClientType } from "redis";
import * as speakeasy from "speakeasy";

// MFA Manager
class MFAManager {
  private readonly challenges = new Map<string, IMFAChallenge>();
  private readonly userMFA = new Map<string, IMFASetup[]>();
  private readonly redis: RedisClientType;

  constructor() {
    this.redis = redisClient;
  }

  // Setup TOTP for user
  async setupTOTP(
    userId: string
  ): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `Kaa Rental Platform (${userId})`,
      issuer: "Kaa Rental Platform",
      length: 32,
    });

    const backupCodes = this.generateBackupCodes();

    const qrCode = await qrcode.toDataURL(secret.otpauth_url || "");

    const mfaSetup: IMFASetup = {
      userId: new mongoose.Types.ObjectId(userId),
      type: MFAType.TOTP,
      secret: secret.base32,
      backupCodes,
      isEnabled: false, // Will be enabled after verification
      createdAt: new Date(),
    };

    // Store temporarily until verified
    await this.redis.setEx(
      `mfa_setup:${userId}:totp`,
      600, // 10 minutes
      JSON.stringify(mfaSetup)
    );

    return {
      secret: secret.base32,
      qrCode,
      backupCodes,
    };
  }

  // Verify TOTP setup
  async verifyTOTPSetup(userId: string, token: string): Promise<boolean> {
    const setupData = await this.redis.get(`mfa_setup:${userId}:totp`);
    if (!setupData) return false;

    const mfaSetup: IMFASetup = JSON.parse(setupData);

    const verified = speakeasy.totp.verify({
      secret: mfaSetup.secret as string,
      encoding: "base32",
      token,
      window: 2, // Allow 60 seconds window
    });

    if (verified) {
      mfaSetup.isEnabled = true;

      // Store permanently
      const userMFAs = this.userMFA.get(userId) || [];
      // Remove any existing TOTP setup
      const filteredMFAs = userMFAs.filter((mfa) => mfa.type !== MFAType.TOTP);
      filteredMFAs.push(mfaSetup);
      this.userMFA.set(userId, filteredMFAs);

      // Remove temporary setup
      await this.redis.del(`mfa_setup:${userId}:totp`);

      return true;
    }

    return false;
  }

  // Setup SMS MFA
  async setupSMS(userId: string, phoneNumber: string): Promise<boolean> {
    const code = this.generateSMSCode();
    const challenge = this.createChallenge(
      userId,
      MFAType.SMS,
      code,
      phoneNumber
    );

    const message = `Your Kaa Rental Platform verification code is: ${code}. Valid for 5 minutes.`;
    const sent = await smsService.sendSms({
      to: phoneNumber,
      message,
      type: "notification",
    });

    if (sent) {
      this.challenges.set(challenge.id, challenge);
      await this.redis.setEx(
        `mfa_challenge:${challenge.id}`,
        300,
        JSON.stringify(challenge)
      );
      return true;
    }

    return false;
  }

  // Verify SMS MFA setup
  async verifySMSSetup(
    userId: string,
    challengeId: string,
    code: string
  ): Promise<boolean> {
    const challenge = await this.getChallenge(challengeId);
    if (
      !challenge ||
      challenge.userId.toString() !== userId ||
      challenge.type !== MFAType.SMS
    ) {
      return false;
    }

    if (this.verifyChallenge(challenge, code)) {
      const mfaSetup: IMFASetup = {
        userId: new mongoose.Types.ObjectId(userId),
        type: MFAType.SMS,
        phoneNumber: challenge.phoneNumber,
        isEnabled: true,
        createdAt: new Date(),
      };

      const userMFAs = this.userMFA.get(userId) || [];
      // Remove any existing SMS setup
      const filteredMFAs = userMFAs.filter((mfa) => mfa.type !== MFAType.SMS);
      filteredMFAs.push(mfaSetup);
      this.userMFA.set(userId, filteredMFAs);

      // Clean up challenge
      await this.cleanupChallenge(challengeId);
      return true;
    }

    return false;
  }

  // Create MFA challenge for authentication
  async createMFAChallenge(
    userId: string,
    type: MFAType
  ): Promise<string | null> {
    const userMFAs = this.userMFA.get(userId) || [];
    const mfaSetup = userMFAs.find((mfa) => mfa.type === type && mfa.isEnabled);

    if (!mfaSetup) return null;

    if (type === MFAType.SMS && mfaSetup.phoneNumber) {
      const code = this.generateSMSCode();
      const challenge = this.createChallenge(
        userId,
        type,
        code,
        mfaSetup.phoneNumber
      );

      const message = `Your Kaa Rental Platform login code is: ${code}. Valid for 5 minutes.`;
      const sent = await smsService.sendSms({
        to: mfaSetup.phoneNumber,
        message,
        type: "notification",
      });

      if (sent) {
        this.challenges.set(challenge.id, challenge);
        await this.redis.setEx(
          `mfa_challenge:${challenge.id}`,
          300,
          JSON.stringify(challenge)
        );
        return challenge.id;
      }
    } else if (type === MFAType.TOTP) {
      // For TOTP, we don't need to send anything, just create a challenge record
      const challenge = this.createChallenge(userId, type, "");
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

    const userMFAs = this.userMFA.get(challenge.userId.toString()) || [];
    const mfaSetup = userMFAs.find(
      (mfa) => mfa.type === challenge.type && mfa.isEnabled
    );

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
    } else if (challenge.type === MFAType.BACKUP_CODE && mfaSetup.backupCodes) {
      verified = this.verifyBackupCode(mfaSetup, code);
    }

    // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
    if (verified) {
      challenge.status = MFAStatus.VERIFIED;
      mfaSetup.lastUsed = new Date();
      await this.cleanupChallenge(challengeId);
      return true;
      // biome-ignore lint/style/noUselessElse: false positive
    } else {
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
  }

  // Disable MFA for user
  disableMFA(userId: string, type: MFAType): boolean {
    const userMFAs = this.userMFA.get(userId) || [];
    const filteredMFAs = userMFAs.filter((mfa) => mfa.type !== type);

    if (filteredMFAs.length !== userMFAs.length) {
      this.userMFA.set(userId, filteredMFAs);
      return true;
    }

    return false;
  }

  // Get user MFA methods
  getUserMFAMethods(userId: string): IMFASetup[] {
    return this.userMFA.get(userId) || [];
  }

  // Generate backup codes
  private generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase();
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
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
  private verifyBackupCode(mfaSetup: IMFASetup, code: string): boolean {
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
