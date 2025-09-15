import { Backup, RestoreJob } from "@kaa/models";
import type { IBackup } from "@kaa/models/types";
import {
  BadRequestError,
  ConflictError,
  logger,
  NotFoundError,
} from "@kaa/utils";
import { CronJob } from "cron";
import type mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export const backupService = {
  initialize: () => {
    // Start backup cleanup job
    new CronJob("0 1 * * *", async () => {
      await backupService.cleanupExpiredBackups();
    }); // Run daily
  },

  /**
   * Create backup
   */
  createBackup: async (
    type: "full" | "incremental" | "differential" = "full",
    memberId?: string
  ) => {
    const name = `backup_${type}_${Date.now()}`;
    const location = `backups/${name}.tar.gz`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days retention

    const backup = await Backup.create({
      name,
      type,
      location,
      expiresAt,
      memberId,
      status: "pending",
    });

    // Start backup process asynchronously
    processBackup((backup._id as mongoose.Types.ObjectId).toString());

    return backup;
  },

  /**
   * List backups
   */
  listBackups: async (memberId?: string, query: any = {}) => {
    const { page = 1, limit = 20, status, type } = query;

    const filter: any = {};
    if (memberId) filter.memberId = memberId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const backups = await Backup.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Backup.countDocuments(filter);

    return {
      backups,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Restore from backup
   */
  restoreFromBackup: async (backupId: string, memberId: string) => {
    const backup = await Backup.findById(backupId);

    if (!backup) {
      throw new NotFoundError("Backup not found");
    }

    if (backup.status !== "completed") {
      throw new BadRequestError("Backup is not completed");
    }

    // Check if there's already a running restore job
    const existingJob = await RestoreJob.findOne({
      memberId,
      status: { $in: ["pending", "running"] },
    });

    if (existingJob) {
      throw new ConflictError("Restore job already in progress");
    }

    const restoreJob = await RestoreJob.create({
      backupId,
      memberId,
      status: "pending",
    });

    // Start restore process asynchronously
    processRestore((restoreJob._id as mongoose.Types.ObjectId).toString());

    return restoreJob;
  },

  /**
   * Get restore job status
   */
  getRestoreStatus: async (jobId: string, memberId: string) => {
    const job = await RestoreJob.findOne({ _id: jobId, memberId });

    if (!job) {
      throw new NotFoundError("Restore job not found");
    }

    return job;
  },

  /**
   * Delete backup
   */
  deleteBackup: async (backupId: string, memberId?: string) => {
    const filter: any = { _id: backupId };
    if (memberId) filter.memberId = memberId;

    const backup = await Backup.findOne(filter);

    if (!backup) {
      throw new NotFoundError("Backup not found");
    }

    // In production, delete the actual backup file from storage
    logger.info(`Deleting backup file: ${backup.location}`);

    await Backup.findByIdAndDelete(backupId);

    return { success: true };
  },

  /**
   * Clean up expired backups
   */
  cleanupExpiredBackups: async () => {
    const expiredBackups = await Backup.find({
      expiresAt: { $lt: new Date() },
    });

    let deletedCount = 0;

    for (const backup of expiredBackups) {
      try {
        // In production, delete the actual backup file from storage
        logger.info(`Cleaning up expired backup: ${backup.location}`);

        await Backup.findByIdAndDelete(backup._id);
        deletedCount++;
      } catch (error) {
        logger.error(`Failed to delete expired backup ${backup._id}`, error);
      }
    }

    return { deletedCount };
  },

  /**
   * Get backup statistics
   */
  getBackupStats: async (memberId?: string) => {
    const filter: FilterQuery<IBackup> = {};
    if (memberId) filter.memberId = memberId;

    const [totalBackups, completedBackups, totalSize] = await Promise.all([
      Backup.countDocuments(filter),
      Backup.countDocuments({ ...filter, status: "completed" }),
      Backup.aggregate([
        { $match: { ...filter, status: "completed" } },
        { $group: { _id: null, totalSize: { $sum: "$size" } } },
      ]),
    ]);

    return {
      totalBackups,
      completedBackups,
      failedBackups: totalBackups - completedBackups,
      totalSize: totalSize[0]?.totalSize || 0,
    };
  },
};

/**
 * Process backup asynchronously
 */
async function processBackup(backupId: string) {
  try {
    const backup = await Backup.findById(backupId);
    if (!backup) return;

    backup.status = "running";
    backup.startedAt = new Date();
    await backup.save();

    logger.info(`Starting backup: ${backup.name}`);

    // Simulate backup process
    const collections = ["users", "tenants", "subscriptions", "events"];
    let totalSize = 0;

    for (const collection of collections) {
      // In production, implement actual backup logic
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate work

      const collectionSize = Math.floor(Math.random() * 1_000_000); // Random size
      totalSize += collectionSize;

      logger.debug(
        `Backed up collection: ${collection} (${collectionSize} bytes)`
      );
    }

    backup.status = "completed";
    backup.completedAt = new Date();
    backup.size = totalSize;
    backup.metadata = {
      collections: collections.length,
      compressionRatio: 0.7,
    };

    await backup.save();

    logger.info(`Backup completed: ${backup.name} (${totalSize} bytes)`);
  } catch (error) {
    logger.error(`Backup failed: ${backupId}`, error);

    await Backup.findByIdAndUpdate(backupId, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}

/**
 * Process restore asynchronously
 */
async function processRestore(jobId: string) {
  try {
    const job = await RestoreJob.findById(jobId).populate("backupId");
    if (!job) return;

    const backup = job.backupId as any;

    job.status = "running";
    job.startedAt = new Date();
    await job.save();

    logger.info(`Starting restore from backup: ${backup.name}`);

    // Simulate restore process with progress updates
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate work

      job.progress = (i / steps) * 100;
      await job.save();

      logger.debug(`Restore progress: ${job.progress}%`);
    }

    job.status = "completed";
    job.completedAt = new Date();
    job.progress = 100;
    await job.save();

    logger.info(`Restore completed from backup: ${backup.name}`);
  } catch (error) {
    logger.error(`Restore failed: ${jobId}`, error);

    await RestoreJob.findByIdAndUpdate(jobId, {
      status: "failed",
      completedAt: new Date(),
      error: (error as Error).message,
    });
  }
}
