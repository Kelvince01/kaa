/**
 * Contract Renewal Service
 * Handles lease renewals, notifications, and renewal workflows
 */

import { Contract } from "@kaa/models";
import { ContractStatus, type IContract } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import mongoose from "mongoose";
import {
  ContractLogger,
  ContractNotFoundError,
  ContractValidationError,
  DateHelpers,
} from "./utils/contract.helpers";

export type RenewalRequestData = {
  contractId: string;
  userId: string;
  newStartDate: string;
  newEndDate: string;
  newRentAmount?: number;
  newDepositAmount?: number;
  newTerms?: Array<{ title: string; content: string }>;
  renewalNotes?: string;
  autoRenewal?: boolean;
};

export type RenewalNotificationData = {
  contractId: string;
  daysUntilExpiry: number;
  landlordId: string;
  tenantIds: string[];
  propertyName: string;
  currentRent: number;
  expiryDate: string;
};

export class ContractRenewalService {
  /**
   * Create a renewal request
   */
  async createRenewalRequest(data: RenewalRequestData): Promise<IContract> {
    try {
      // Get original contract
      const originalContract = await Contract.findById(data.contractId);
      if (!originalContract) {
        throw new ContractNotFoundError(data.contractId);
      }

      // Validate renewal eligibility
      await this.validateRenewalEligibility(originalContract);

      // Validate new dates
      DateHelpers.validateContractDates(
        new Date(data.newStartDate),
        new Date(data.newEndDate)
      );

      // Check for overlaps
      await this.checkRenewalOverlap(
        originalContract.unit?.toString(),
        data.newStartDate,
        data.newEndDate,
        data.contractId
      );

      // Create renewal contract
      const renewalContract = await this.createRenewalContract(
        originalContract,
        data
      );

      // Update original contract with renewal reference
      await Contract.findByIdAndUpdate(data.contractId, {
        renewedTo: renewalContract._id,
        updatedAt: new Date(),
      });

      ContractLogger.logContractCreation(
        (renewalContract._id as mongoose.Types.ObjectId).toString(),
        data.userId,
        originalContract.property.toString()
        // "renewal"
      );

      return renewalContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId: data.contractId,
        userId: data.userId,
        action: "create_renewal",
      });
      throw error;
    }
  }

  /**
   * Get contracts eligible for renewal
   */
  async getContractsEligibleForRenewal(
    userId: string,
    daysAhead = 90
  ): Promise<IContract[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const contracts = await Contract.find({
        $or: [
          { landlord: new mongoose.Types.ObjectId(userId) },
          { tenants: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ],
        status: ContractStatus.ACTIVE,
        endDate: { $lte: cutoffDate },
        renewedTo: { $exists: false }, // Not already renewed
      })
        .populate([
          { path: "landlord", select: "firstName lastName email phone" },
          { path: "property", select: "name location" },
          { path: "unit", select: "unitNumber type" },
          { path: "tenants", select: "personalInfo" },
        ])
        .sort({ endDate: 1 });

      return contracts;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId,
        action: "get_renewal_eligible",
      });
      throw error;
    }
  }

  /**
   * Process automatic renewals
   */
  async processAutoRenewals(): Promise<{
    processed: number;
    errors: string[];
  }> {
    try {
      const autoRenewalContracts = await Contract.find({
        status: ContractStatus.ACTIVE,
        "renewalOptions.allowAutoRenewal": true,
        endDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
        },
        renewedTo: { $exists: false },
      });

      let processed = 0;
      const errors: string[] = [];

      for (const contract of autoRenewalContracts) {
        try {
          await this.processAutoRenewal(contract);
          processed++;
        } catch (error) {
          errors.push(
            `Contract ${contract._id}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      return { processed, errors };
    } catch (error) {
      logger.error("Error processing auto renewals:", error);
      throw error;
    }
  }

  /**
   * Get renewal notifications to send
   */
  async getRenewalNotifications(
    daysAhead: number[] = [90, 60, 30, 7]
  ): Promise<RenewalNotificationData[]> {
    try {
      const notifications: RenewalNotificationData[] = [];

      for (const days of daysAhead) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);

        const contracts = await Contract.find({
          status: ContractStatus.ACTIVE,
          endDate: {
            $gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000), // Start of target day
            $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000), // End of target day
          },
          renewedTo: { $exists: false },
        }).populate([
          { path: "landlord", select: "firstName lastName email" },
          { path: "property", select: "name" },
          {
            path: "tenants",
            select:
              "personalInfo.email personalInfo.firstName personalInfo.lastName",
          },
        ]);

        for (const contract of contracts) {
          notifications.push({
            contractId: (contract._id as mongoose.Types.ObjectId).toString(),
            daysUntilExpiry: days,
            landlordId: contract.landlord._id.toString(),
            tenantIds: contract.tenants.map((t: any) => t._id.toString()),
            propertyName: (contract.property as any).name,
            currentRent: contract.rentAmount,
            expiryDate: contract.endDate.toISOString(),
          });
        }
      }

      return notifications;
    } catch (error) {
      logger.error("Error getting renewal notifications:", error);
      throw error;
    }
  }

  /**
   * Approve renewal request
   */
  async approveRenewal(contractId: string, userId: string): Promise<IContract> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new ContractNotFoundError(contractId);
      }

      if (contract.status !== ContractStatus.PENDING) {
        throw new ContractValidationError(
          "Only pending renewals can be approved"
        );
      }

      // Update status to active
      const updatedContract = await Contract.findByIdAndUpdate(
        contractId,
        {
          status: ContractStatus.ACTIVE,
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "name location" },
        { path: "unit", select: "unitNumber type" },
        { path: "tenants", select: "personalInfo" },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(contractId);
      }

      ContractLogger.logStatusChange(
        contractId,
        userId,
        ContractStatus.PENDING,
        ContractStatus.ACTIVE
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        userId,
        action: "approve_renewal",
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private validateRenewalEligibility(contract: IContract): void {
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ContractValidationError("Only active contracts can be renewed");
    }

    if (contract.renewedTo) {
      throw new ContractValidationError("Contract has already been renewed");
    }

    // Check if renewal is within allowed timeframe
    const daysUntilExpiry = Math.ceil(
      (contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const maxRenewalDays = contract.renewalOptions?.renewalNoticePeriod || 90;
    if (daysUntilExpiry > maxRenewalDays) {
      throw new ContractValidationError(
        `Renewal can only be initiated within ${maxRenewalDays} days of expiry`
      );
    }
  }

  private async checkRenewalOverlap(
    unitId: string | undefined,
    startDate: string,
    endDate: string,
    excludeContractId: string
  ): Promise<void> {
    if (!unitId) return;

    const existingContract = await Contract.findOne({
      unit: new mongoose.Types.ObjectId(unitId),
      status: { $in: [ContractStatus.ACTIVE, ContractStatus.PENDING] },
      _id: { $ne: new mongoose.Types.ObjectId(excludeContractId) },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (existingContract) {
      throw new ContractValidationError(
        "Renewal dates conflict with existing contract"
      );
    }
  }

  private async createRenewalContract(
    originalContract: IContract,
    data: RenewalRequestData
  ): Promise<IContract> {
    const renewalContract = new Contract({
      landlord: originalContract.landlord,
      property: originalContract.property,
      unit: originalContract.unit,
      tenants: originalContract.tenants,
      startDate: new Date(data.newStartDate),
      endDate: new Date(data.newEndDate),
      rentAmount: data.newRentAmount || originalContract.rentAmount,
      depositAmount: data.newDepositAmount || originalContract.depositAmount,
      serviceCharge: originalContract.serviceCharge,
      lateFee: originalContract.lateFee,
      rentDueDate: originalContract.rentDueDate,
      waterBill: originalContract.waterBill,
      electricityBill: originalContract.electricityBill,
      gasBill: originalContract.gasBill,
      internetBill: originalContract.internetBill,
      petsAllowed: originalContract.petsAllowed,
      smokingAllowed: originalContract.smokingAllowed,
      sublettingAllowed: originalContract.sublettingAllowed,
      maxOccupants: originalContract.maxOccupants,
      status: data.autoRenewal ? ContractStatus.ACTIVE : ContractStatus.PENDING,
      contractType: originalContract.contractType,
      contractTemplate: originalContract.contractTemplate,
      contractData: {
        ...originalContract.contractData,
        terms: data.newTerms || originalContract.contractData.terms,
        amendments: [
          ...(originalContract.contractData.amendments || []),
          {
            amendmentDate: new Date(),
            amendmentReason: "Contract Renewal",
            changes: [
              {
                field: "startDate",
                oldValue: originalContract.startDate.toISOString(),
                newValue: data.newStartDate,
              },
              {
                field: "endDate",
                oldValue: originalContract.endDate.toISOString(),
                newValue: data.newEndDate,
              },
              ...(data.newRentAmount &&
              data.newRentAmount !== originalContract.rentAmount
                ? [
                    {
                      field: "rentAmount",
                      oldValue: originalContract.rentAmount.toString(),
                      newValue: data.newRentAmount.toString(),
                    },
                  ]
                : []),
            ],
            amendedBy: new mongoose.Types.ObjectId(data.userId),
          },
        ],
      },
      paymentSchedule: originalContract.paymentSchedule,
      renewalOptions: originalContract.renewalOptions,
      depositProtectionScheme: originalContract.depositProtectionScheme,
      depositProtection: originalContract.depositProtection,
      renewedFrom: originalContract._id,
      parentContract: originalContract.parentContract || originalContract._id,
      createdBy: new mongoose.Types.ObjectId(data.userId),
      notes: data.renewalNotes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await renewalContract.save();
    return renewalContract;
  }

  private async processAutoRenewal(contract: IContract): Promise<void> {
    const renewalOptions = contract.renewalOptions;
    if (!renewalOptions?.allowAutoRenewal) return;

    // Calculate new dates
    const currentDuration =
      contract.endDate.getTime() - contract.startDate.getTime();
    const newStartDate = new Date(contract.endDate);
    const newEndDate = new Date(contract.endDate.getTime() + currentDuration);

    // Calculate new rent with increase
    const rentIncrease = renewalOptions.rentIncreasePercentage || 0;
    const newRentAmount = contract.rentAmount * (1 + rentIncrease / 100);

    // Create renewal
    await this.createRenewalRequest({
      contractId: (contract._id as mongoose.Types.ObjectId).toString(),
      userId: contract.landlord.toString(),
      newStartDate: newStartDate.toISOString(),
      newEndDate: newEndDate.toISOString(),
      newRentAmount: Math.round(newRentAmount),
      renewalNotes: "Automatic renewal",
      autoRenewal: true,
    });
  }
}

// Export singleton instance
export const contractRenewalService = new ContractRenewalService();
