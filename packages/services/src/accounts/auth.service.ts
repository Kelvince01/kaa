import { SecurityEvent, Session } from "@kaa/models";
import { SecurityEventType, ThreatLevel, SecurityEventStatus } from "@kaa/models/types";
import mongoose from "mongoose";
import { nanoid } from "nanoid";

export class AuthService {
  /**
   * Create user session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = nanoid();

    const session = new Session({
      userId,
      sessionId,
      refreshToken,
      ipAddress,
      userAgent,
      isActive: true,
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await session.save();
    return sessionId;
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    type: SecurityEventType,
    severity: ThreatLevel,
    description: string,
    memberId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any,
  ): Promise<void> {
    try {
      const event = new SecurityEvent({
        memberId: memberId ? new mongoose.Types.ObjectId(memberId) : undefined,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        type,
        severity,
        details: {
          ipAddress,
          userAgent,
          metadata,
        },
        status: SecurityEventStatus.DETECTED,
        createdAt: new Date(),
      });
      await event.save();
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }
}

export const authService = new AuthService();
