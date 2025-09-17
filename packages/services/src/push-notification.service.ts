import { DeviceToken, type IDeviceToken } from "@kaa/models";
import { logger } from "@kaa/utils";
import admin from "firebase-admin";

type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
};

type BatchNotificationResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

class PushNotificationService {
  private initialized = false;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (admin.apps.length) {
        this.initialized = true;
      } else {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
          this.initialized = true;
          logger.info("Firebase Admin initialized for push notifications");
        } else {
          logger.warn(
            "Firebase service account key not found - push notifications disabled"
          );
        }
      }
    } catch (error) {
      logger.error("Failed to initialize Firebase Admin:", error);
    }
  }

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: "ios" | "android" | "web",
    deviceId: string,
    appVersion?: string,
    osVersion?: string
  ): Promise<IDeviceToken> {
    try {
      // Remove existing token for this device
      await DeviceToken.findOneAndUpdate(
        { userId, deviceId },
        { isActive: false }
      );

      // Create new token record
      const deviceToken = new DeviceToken({
        userId,
        token,
        platform,
        deviceId,
        appVersion,
        osVersion,
        isActive: true,
        lastUsed: new Date(),
      });

      await deviceToken.save();
      logger.info(
        `Device token registered for user ${userId}, platform: ${platform}`
      );
      return deviceToken;
    } catch (error) {
      logger.error("Failed to register device token:", error);
      throw error;
    }
  }

  async unregisterDeviceToken(userId: string, deviceId: string): Promise<void> {
    try {
      await DeviceToken.updateMany({ userId, deviceId }, { isActive: false });
      logger.info(
        `Device token unregistered for user ${userId}, device: ${deviceId}`
      );
    } catch (error) {
      logger.error("Failed to unregister device token:", error);
      throw error;
    }
  }

  async sendToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<BatchNotificationResult> {
    if (!this.initialized) {
      logger.warn("Push notifications not initialized");
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const deviceTokens = await DeviceToken.find({
        userId,
        isActive: true,
      });

      if (deviceTokens.length === 0) {
        logger.info(`No active device tokens found for user ${userId}`);
        return { successCount: 0, failureCount: 0, invalidTokens: [] };
      }

      const tokens = deviceTokens.map((dt) => dt.token);
      return await this.sendToTokens(tokens, payload);
    } catch (error) {
      logger.error(
        `Failed to send push notification to user ${userId}:`,
        error
      );
      return { successCount: 0, failureCount: 1, invalidTokens: [] };
    }
  }

  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<BatchNotificationResult> {
    if (!this.initialized || tokens.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        webpush: payload.clickAction
          ? {
              fcmOptions: {
                link: payload.clickAction,
              },
            }
          : undefined,
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle invalid tokens
      const invalidTokens: string[] = [];
      if (response.failureCount > 0) {
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (
              errorCode === "messaging/invalid-registration-token" ||
              errorCode === "messaging/registration-token-not-registered"
            ) {
              invalidTokens.push(tokens[idx] as string);
            }
          }
        });

        // Remove invalid tokens from database
        if (invalidTokens.length > 0) {
          await DeviceToken.updateMany(
            { token: { $in: invalidTokens } },
            { isActive: false }
          );
          logger.info(`Deactivated ${invalidTokens.length} invalid tokens`);
        }
      }

      logger.info(
        `Push notification sent: ${response.successCount} success, ${response.failureCount} failed`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      logger.error("Failed to send push notifications:", error);
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: [],
      };
    }
  }

  async sendToMultipleUsers(
    userIds: string[],
    payload: PushNotificationPayload
  ): Promise<BatchNotificationResult> {
    const results = await Promise.all(
      userIds.map((userId) => this.sendToUser(userId, payload))
    );

    return results.reduce(
      (total, result) => ({
        successCount: total.successCount + result.successCount,
        failureCount: total.failureCount + result.failureCount,
        invalidTokens: [...total.invalidTokens, ...result.invalidTokens],
      }),
      { successCount: 0, failureCount: 0, invalidTokens: [] }
    );
  }

  async getUserDeviceTokens(userId: string): Promise<IDeviceToken[]> {
    return await DeviceToken.find({
      userId,
      isActive: true,
    });
  }

  async cleanupInactiveTokens(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await DeviceToken.deleteMany({
      isActive: false,
      updatedAt: { $lt: cutoffDate },
    });

    logger.info(`Cleaned up ${result.deletedCount} inactive device tokens`);
    return result.deletedCount;
  }
}

export const pushNotificationService = new PushNotificationService();
