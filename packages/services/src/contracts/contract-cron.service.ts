/**
 * Contract Cron Service
 * Handles scheduled tasks for contract management
 */

import { Contract } from "@kaa/models";
import { ContractStatus } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import { CronJob } from "cron";
import type mongoose from "mongoose";
import { contractNotificationService } from "./contract-notification.service";
import { contractRenewalService } from "./contract-renewal.service";

export class ContractCronService {
  private readonly jobs: Map<string, CronJob> = new Map();

  /**
   * Initialize all cron jobs
   */
  init(): void {
    this.setupRenewalReminders();
    this.setupAutoRenewals();
    this.setupContractExpiration();
    this.setupSigningReminders();
    this.setupCleanupTasks();

    logger.info("Contract cron jobs initialized");
  }

  /**
   * Stop all cron jobs
   */
  stop(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Setup renewal reminder notifications
   * Runs daily at 9:00 AM
   */
  private setupRenewalReminders(): void {
    const job = new CronJob(
      "0 9 * * *", // Daily at 9:00 AM
      async () => {
        try {
          logger.info("Running renewal reminders job");
          const result =
            await contractNotificationService.sendRenewalReminders();
          logger.info("Renewal reminders job completed", result);
        } catch (error) {
          logger.error("Error in renewal reminders job:", error);
        }
      },
      null,
      true,
      "Africa/Nairobi"
    );

    this.jobs.set("renewalReminders", job);
    logger.info("Renewal reminders cron job scheduled");
  }

  /**
   * Setup automatic renewals processing
   * Runs daily at 2:00 AM
   */
  private setupAutoRenewals(): void {
    const job = new CronJob(
      "0 2 * * *", // Daily at 2:00 AM
      async () => {
        try {
          logger.info("Running auto renewals job");
          const result = await contractRenewalService.processAutoRenewals();
          logger.info("Auto renewals job completed", result);
        } catch (error) {
          logger.error("Error in auto renewals job:", error);
        }
      },
      null,
      true,
      "Africa/Nairobi"
    );

    this.jobs.set("autoRenewals", job);
    logger.info("Auto renewals cron job scheduled");
  }

  /**
   * Setup contract expiration handling
   * Runs daily at 1:00 AM
   */
  private setupContractExpiration(): void {
    const job = new CronJob(
      "0 1 * * *", // Daily at 1:00 AM
      async () => {
        try {
          logger.info("Running contract expiration job");
          await this.processExpiredContracts();
          logger.info("Contract expiration job completed");
        } catch (error) {
          logger.error("Error in contract expiration job:", error);
        }
      },
      null,
      true,
      "Africa/Nairobi"
    );

    this.jobs.set("contractExpiration", job);
    logger.info("Contract expiration cron job scheduled");
  }

  /**
   * Setup signing reminders
   * Runs daily at 10:00 AM
   */
  private setupSigningReminders(): void {
    const job = new CronJob(
      "0 10 * * *", // Daily at 10:00 AM
      async () => {
        try {
          logger.info("Running signing reminders job");
          await this.sendSigningReminders();
          logger.info("Signing reminders job completed");
        } catch (error) {
          logger.error("Error in signing reminders job:", error);
        }
      },
      null,
      true,
      "Africa/Nairobi"
    );

    this.jobs.set("signingReminders", job);
    logger.info("Signing reminders cron job scheduled");
  }

  /**
   * Setup cleanup tasks
   * Runs weekly on Sunday at 3:00 AM
   */
  private setupCleanupTasks(): void {
    const job = new CronJob(
      "0 3 * * 0", // Weekly on Sunday at 3:00 AM
      async () => {
        try {
          logger.info("Running cleanup tasks job");
          await this.cleanupOldContracts();
          await this.cleanupTempFiles();
          logger.info("Cleanup tasks job completed");
        } catch (error) {
          logger.error("Error in cleanup tasks job:", error);
        }
      },
      null,
      true,
      "Africa/Nairobi"
    );

    this.jobs.set("cleanupTasks", job);
    logger.info("Cleanup tasks cron job scheduled");
  }

  /**
   * Process expired contracts
   */
  private async processExpiredContracts(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find contracts that expired today
      const expiredContracts = await Contract.find({
        status: ContractStatus.ACTIVE,
        endDate: { $lt: today },
      }).populate([
        { path: "landlord", select: "firstName lastName email" },
        { path: "property", select: "name" },
        {
          path: "tenants",
          select:
            "personalInfo.firstName personalInfo.lastName personalInfo.email",
        },
      ]);

      let processed = 0;
      const errors: string[] = [];

      for (const contract of expiredContracts) {
        try {
          // Update contract status to expired
          await Contract.findByIdAndUpdate(contract._id, {
            status: ContractStatus.EXPIRED,
            updatedAt: new Date(),
          });

          // Send expiration notifications
          await contractNotificationService.sendExpirationAlert(
            (contract._id as mongoose.Types.ObjectId).toString(),
            contract.landlord._id.toString(),
            (contract.property as any).name,
            0 // Already expired
          );

          for (const tenant of contract.tenants) {
            await contractNotificationService.sendExpirationAlert(
              (contract._id as mongoose.Types.ObjectId).toString(),
              tenant._id.toString(),
              (contract.property as any).name,
              0 // Already expired
            );
          }

          processed++;
        } catch (error) {
          errors.push(
            `Contract ${contract._id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      logger.info(`Processed ${processed} expired contracts`, {
        processed,
        errors: errors.length,
      });
    } catch (error) {
      logger.error("Error processing expired contracts:", error);
      throw error;
    }
  }

  /**
   * Send signing reminders for pending contracts
   */
  private async sendSigningReminders(): Promise<void> {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Find contracts pending signature for more than 3 days
      const pendingContracts = await Contract.find({
        status: ContractStatus.PENDING,
        createdAt: { $lt: threeDaysAgo },
      }).populate([
        { path: "landlord", select: "firstName lastName email" },
        { path: "property", select: "name" },
        {
          path: "tenants",
          select:
            "personalInfo.firstName personalInfo.lastName personalInfo.email",
        },
      ]);

      let sent = 0;
      const errors: string[] = [];

      for (const contract of pendingContracts) {
        try {
          const daysOverdue = Math.floor(
            (Date.now() - contract.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Send reminders to tenants (assuming landlord has already signed)
          for (const tenant of contract.tenants) {
            await contractNotificationService.sendSigningReminder(
              (contract._id as mongoose.Types.ObjectId).toString(),
              tenant._id.toString(),
              (contract.property as any).name,
              daysOverdue
            );
          }

          sent++;
        } catch (error) {
          errors.push(
            `Contract ${contract._id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      logger.info(`Sent ${sent} signing reminders`, {
        sent,
        errors: errors.length,
      });
    } catch (error) {
      logger.error("Error sending signing reminders:", error);
      throw error;
    }
  }

  /**
   * Cleanup old contracts (soft-deleted contracts older than 2 years)
   */
  private async cleanupOldContracts(): Promise<void> {
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const result = await Contract.deleteMany({
        status: ContractStatus.CANCELLED,
        deletedAt: { $lt: twoYearsAgo },
      });

      logger.info(`Cleaned up ${result.deletedCount} old contracts`);
    } catch (error) {
      logger.error("Error cleaning up old contracts:", error);
      throw error;
    }
  }

  /**
   * Cleanup temporary files (implementation depends on file storage strategy)
   */
  private cleanupTempFiles(): void {
    try {
      // TODO: Implement based on your file storage strategy
      // This could involve cleaning up:
      // - Temporary PDF files
      // - Unsigned contract templates
      // - Old signature images
      // - Cached documents

      logger.info("Temporary files cleanup completed");
    } catch (error) {
      logger.error("Error cleaning up temporary files:", error);
      throw error;
    }
  }

  /**
   * Get status of all cron jobs
   */
  getJobsStatus(): Record<string, { running: boolean; nextRun?: string }> {
    const status: Record<string, { running: boolean; nextRun?: string }> = {};

    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.isCallbackRunning,
        // Note: node-cron doesn't provide next run time directly
        // You might need to calculate this based on the cron expression
      };
    });

    return status;
  }

  /**
   * Manually trigger a specific job (for testing/admin purposes)
   */
  async triggerJob(jobName: string): Promise<void> {
    switch (jobName) {
      case "renewalReminders":
        await contractNotificationService.sendRenewalReminders();
        break;
      case "autoRenewals":
        await contractRenewalService.processAutoRenewals();
        break;
      case "contractExpiration":
        await this.processExpiredContracts();
        break;
      case "signingReminders":
        await this.sendSigningReminders();
        break;
      case "cleanupTasks":
        await this.cleanupOldContracts();
        await this.cleanupTempFiles();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Export singleton instance
export const contractCronService = new ContractCronService();
