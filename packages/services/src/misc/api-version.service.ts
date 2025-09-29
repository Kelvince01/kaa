import { APIVersion } from "@kaa/models";
import { NotFoundError } from "@kaa/utils";

export const apiVersionService = {
  /**
   * Create API version
   */
  createVersion: async (data: {
    version: string;
    changelog: string;
    isDefault?: boolean;
  }) => {
    // If this is the default version, unset other defaults
    if (data.isDefault) {
      await APIVersion.updateMany({}, { isDefault: false });
    }

    const version = await APIVersion.create(data);
    return version;
  },

  /**
   * Get active API versions
   */
  getActiveVersions: async () => {
    const versions = await APIVersion.find({ isActive: true }).sort({
      createdAt: -1,
    });
    return versions;
  },

  /**
   * Deprecate API version
   */
  deprecateVersion: async (version: string, sunsetDate?: Date) => {
    const apiVersion = await APIVersion.findOne({ version });

    if (!apiVersion) {
      throw new NotFoundError("API version not found");
    }

    apiVersion.deprecatedAt = new Date();
    if (sunsetDate) {
      apiVersion.sunsetAt = sunsetDate;
    }

    await apiVersion.save();
    return apiVersion;
  },

  /**
   * Get default version
   */
  getDefaultVersion: async () => {
    const version = await APIVersion.findOne({
      isDefault: true,
      isActive: true,
    });
    return version?.version || "v1";
  },
};
