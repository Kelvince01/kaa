import crypto from "node:crypto";
import { ApiKey } from "@kaa/models";
import type { IApiKey } from "@kaa/models/types";
import { AppError, logger, NotFoundError } from "@kaa/utils";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export type CreateApiKeyData = {
  memberId: string;
  userId: string;
  name: string;
  permissions?: string[];
  expiresAt?: Date;
  rateLimit?: {
    requests: number;
    window: number;
  };
};

export class ApiKeyService {
  async createApiKey(data: CreateApiKeyData): Promise<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    rateLimit?: {
      requests: number;
      window: number;
    };
    expiresAt?: Date;
    createdAt: Date;
  }> {
    try {
      const key = `kaa_${crypto.randomBytes(32).toString("hex")}`;
      const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

      const apiKey = new ApiKey({
        memberId: data.memberId,
        userId: data.userId,
        name: data.name,
        key, // Only returned on creation
        hashedKey,
        permissions: data.permissions || [],
        rateLimit: data.rateLimit || { requests: 1000, window: 3600 },
        expiresAt: data.expiresAt,
      });

      await apiKey.save();

      logger.info("API key created", {
        apiKeyId: apiKey._id,
        memberId: data.memberId,
      });

      // Return key only once
      return {
        id: (apiKey._id as mongoose.Types.ObjectId).toString(),
        name: apiKey.name,
        key, // Only returned on creation
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      };
    } catch (error) {
      logger.error("Failed to create API key", error);
      throw new AppError("Failed to create API key");
    }
  }

  async validateApiKey(key: string): Promise<IApiKey | null> {
    try {
      const hashedKey = crypto.createHash("sha256").update(key).digest("hex");

      const apiKey = await ApiKey.findOne({
        hashedKey,
        isActive: true,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
      }).populate("memberId userId");

      if (apiKey) {
        // Update usage stats
        apiKey.lastUsedAt = new Date();
        apiKey.usage.totalRequests += 1;
        apiKey.usage.lastRequest = new Date();
        await apiKey.save();
      }

      return apiKey;
    } catch (error) {
      logger.error("Failed to validate API key", error);
      return null;
    }
  }

  async getApiKeys(memberId: string, userId?: string): Promise<IApiKey[]> {
    try {
      const query: FilterQuery<IApiKey> = { memberId, isActive: true };
      if (userId) {
        query.userId = userId;
      }

      const apiKeys = await ApiKey.find(query)
        .select("-hashedKey -key")
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 });

      return apiKeys;
    } catch (error) {
      logger.error("Failed to get API keys", error);
      throw new AppError("Failed to get API keys");
    }
  }

  async revokeApiKey(
    apiKeyId: string,
    memberId: string
  ): Promise<{ success: boolean }> {
    try {
      const apiKey = await ApiKey.findOne({ _id: apiKeyId, memberId });
      if (!apiKey) {
        throw new NotFoundError("API key not found");
      }

      apiKey.isActive = false;
      await apiKey.save();

      logger.info("API key revoked", { apiKeyId, memberId });

      return { success: true };
    } catch (error) {
      logger.error("Failed to revoke API key", error);
      throw new AppError("Failed to revoke API key");
    }
  }

  async updateApiKey(
    apiKeyId: string,
    memberId: string,
    updates: Partial<
      Pick<IApiKey, "name" | "permissions" | "expiresAt" | "rateLimit">
    >
  ): Promise<IApiKey> {
    try {
      const apiKey = await ApiKey.findOneAndUpdate(
        { _id: apiKeyId, memberId },
        updates,
        {
          new: true,
        }
      );

      if (!apiKey) {
        throw new NotFoundError("API key not found");
      }

      apiKey.key = "[HIDDEN]";
      logger.info("API key updated", { apiKeyId, memberId });

      return apiKey;
    } catch (error) {
      logger.error("Failed to update API key", error);
      throw new AppError("Failed to update API key");
    }
  }

  async getApiKeyUsage(apiKeyId: string, memberId: string) {
    try {
      const apiKey = await ApiKey.findOne({ _id: apiKeyId, memberId });
      if (!apiKey) {
        throw new NotFoundError("API key not found");
      }

      return {
        totalRequests: apiKey.usage.totalRequests,
        lastRequest: apiKey.usage.lastRequest,
        lastUsedAt: apiKey.lastUsedAt,
        rateLimit: apiKey.rateLimit,
      };
    } catch (error) {
      logger.error("Failed to get API key usage", error);
      throw new AppError("Failed to get API key usage");
    }
  }
}

export const apiKeyService = new ApiKeyService();
