/**
 * Contract Amendment Service
 * Handles contract amendments, modifications, and amendment workflows
 */

import { Contract } from "@kaa/models";
import { ContractStatus, type IContract } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import mongoose from "mongoose";
import {
  ContractError,
  ContractLogger,
  ContractNotFoundError,
  ContractValidationError,
  PermissionHelpers,
} from "./utils/contract.helpers";

export type AmendmentRequestData = {
  contractId: string;
  userId: string;
  amendmentReason: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    description?: string;
  }>;
  effectiveDate?: string;
  requiresApproval?: boolean;
  notes?: string;
};

export type AmendmentApprovalData = {
  amendmentId: string;
  userId: string;
  approved: boolean;
  approvalNotes?: string;
};

export type ContractAmendment = {
  _id?: mongoose.Types.ObjectId;
  amendmentDate: Date;
  amendmentReason: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    description?: string;
  }>;
  effectiveDate?: Date;
  status: "pending" | "approved" | "rejected" | "applied";
  amendedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  approvalNotes?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class ContractAmendmentService {
  /**
   * Create an amendment request
   */
  async createAmendment(data: AmendmentRequestData): Promise<IContract> {
    try {
      // Get contract
      const contract = await Contract.findById(data.contractId);
      if (!contract) {
        throw new ContractNotFoundError(data.contractId);
      }

      // Validate amendment eligibility
      await this.validateAmendmentEligibility(contract, data.userId);

      // Validate changes
      await this.validateAmendmentChanges(data.changes);

      // Create amendment record
      const amendment: ContractAmendment = {
        _id: new mongoose.Types.ObjectId(),
        amendmentDate: new Date(),
        amendmentReason: data.amendmentReason,
        changes: data.changes,
        effectiveDate: data.effectiveDate
          ? new Date(data.effectiveDate)
          : new Date(),
        status: data.requiresApproval ? "pending" : "approved",
        amendedBy: new mongoose.Types.ObjectId(data.userId),
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add amendment to contract
      const updatedContract = await Contract.findByIdAndUpdate(
        data.contractId,
        {
          $push: {
            "contractData.amendments": amendment,
          },
          $set: {
            updatedAt: new Date(),
            lastModifiedBy: new mongoose.Types.ObjectId(data.userId),
          },
        },
        { new: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "name location" },
        { path: "unit", select: "unitNumber type" },
        { path: "tenants", select: "personalInfo" },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(data.contractId);
      }

      // If no approval required, apply changes immediately
      if (!data.requiresApproval) {
        await this.applyAmendmentChanges(
          data.contractId,
          (amendment._id as mongoose.Types.ObjectId).toString()
        );
      }

      ContractLogger.logContractCreation(
        data.contractId,
        data.userId,
        contract.property.toString()
        // "amendment"
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId: data.contractId,
        userId: data.userId,
        action: "create_amendment",
      });
      throw error;
    }
  }

  /**
   * Approve or reject an amendment
   */
  async processAmendmentApproval(
    data: AmendmentApprovalData
  ): Promise<IContract> {
    try {
      const contract = await Contract.findOne({
        "contractData.amendments._id": new mongoose.Types.ObjectId(
          data.amendmentId
        ),
      });

      if (!contract) {
        throw new ContractError("Amendment not found", 404);
      }

      // Find the amendment
      const amendment = contract.contractData.amendments?.find(
        (a: any) => a._id.toString() === data.amendmentId
      );

      if (!amendment) {
        throw new ContractError("Amendment not found", 404);
      }

      if (amendment.status !== "pending") {
        throw new ContractValidationError("Amendment is not pending approval");
      }

      // Update amendment status
      const updateData: any = {
        "contractData.amendments.$.status": data.approved
          ? "approved"
          : "rejected",
        "contractData.amendments.$.approvedBy": new mongoose.Types.ObjectId(
          data.userId
        ),
        "contractData.amendments.$.approvalDate": new Date(),
        "contractData.amendments.$.approvalNotes": data.approvalNotes,
        "contractData.amendments.$.updatedAt": new Date(),
        updatedAt: new Date(),
      };

      const updatedContract = await Contract.findOneAndUpdate(
        {
          _id: contract._id,
          "contractData.amendments._id": new mongoose.Types.ObjectId(
            data.amendmentId
          ),
        },
        { $set: updateData },
        { new: true }
      ).populate([
        { path: "landlord", select: "firstName lastName email phone" },
        { path: "property", select: "name location" },
        { path: "unit", select: "unitNumber type" },
        { path: "tenants", select: "personalInfo" },
      ]);

      if (!updatedContract) {
        throw new ContractNotFoundError(
          (contract._id as mongoose.Types.ObjectId).toString()
        );
      }

      // If approved, apply the changes
      if (data.approved) {
        await this.applyAmendmentChanges(
          (contract._id as mongoose.Types.ObjectId).toString(),
          data.amendmentId
        );
      }

      ContractLogger.logStatusChange(
        (contract._id as mongoose.Types.ObjectId).toString(),
        data.userId,
        "amendment_pending",
        data.approved ? "amendment_approved" : "amendment_rejected"
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        amendmentId: data.amendmentId,
        userId: data.userId,
        action: "process_amendment_approval",
      });
      throw error;
    }
  }

  /**
   * Get pending amendments for a user
   */
  async getPendingAmendments(
    userId: string,
    userRole?: { name: string }
  ): Promise<any[]> {
    try {
      const matchStage: any = {
        "contractData.amendments": {
          $elemMatch: { status: "pending" },
        },
      };

      // Add user filter for non-admin users
      if (userRole?.name !== "admin") {
        matchStage.$or = [
          { landlord: new mongoose.Types.ObjectId(userId) },
          { tenants: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ];
      }

      const contracts = await Contract.aggregate([
        { $match: matchStage },
        { $unwind: "$contractData.amendments" },
        { $match: { "contractData.amendments.status": "pending" } },
        {
          $lookup: {
            from: "properties",
            localField: "property",
            foreignField: "_id",
            as: "property",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "landlord",
            foreignField: "_id",
            as: "landlord",
          },
        },
        {
          $lookup: {
            from: "tenants",
            localField: "tenants",
            foreignField: "_id",
            as: "tenants",
          },
        },
        {
          $project: {
            contractId: "$_id",
            amendment: "$contractData.amendments",
            property: { $arrayElemAt: ["$property", 0] },
            landlord: { $arrayElemAt: ["$landlord", 0] },
            tenants: 1,
            startDate: 1,
            endDate: 1,
            rentAmount: 1,
          },
        },
      ]);

      return contracts;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        userId,
        action: "get_pending_amendments",
      });
      throw error;
    }
  }

  /**
   * Get amendment history for a contract
   */
  async getAmendmentHistory(
    contractId: string,
    userId: string
  ): Promise<ContractAmendment[]> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new ContractNotFoundError(contractId);
      }

      // Check permissions
      if (
        !PermissionHelpers.canAccessContract({ id: userId } as any, {
          landlord: contract.landlord.toString(),
          tenants: contract.tenants.map((t) => t.toString()),
        })
      ) {
        throw new ContractError(
          "Not authorized to view amendment history",
          403
        );
      }

      return contract.contractData.amendments || [];
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        userId,
        action: "get_amendment_history",
      });
      throw error;
    }
  }

  /**
   * Cancel a pending amendment
   */
  async cancelAmendment(
    contractId: string,
    amendmentId: string,
    userId: string
  ): Promise<IContract> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new ContractNotFoundError(contractId);
      }

      const amendment = contract.contractData.amendments?.find(
        (a: any) => a._id.toString() === amendmentId
      );

      if (!amendment) {
        throw new ContractError("Amendment not found", 404);
      }

      if (amendment.status !== "pending") {
        throw new ContractValidationError(
          "Only pending amendments can be cancelled"
        );
      }

      // Check if user can cancel (only the creator or landlord)
      if (
        amendment.amendedBy.toString() !== userId &&
        contract.landlord.toString() !== userId
      ) {
        throw new ContractError("Not authorized to cancel this amendment", 403);
      }

      // Remove the amendment
      const updatedContract = await Contract.findByIdAndUpdate(
        contractId,
        {
          $pull: {
            "contractData.amendments": {
              _id: new mongoose.Types.ObjectId(amendmentId),
            },
          },
          $set: { updatedAt: new Date() },
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
        "amendment_pending",
        "amendment_cancelled"
      );

      return updatedContract;
    } catch (error) {
      ContractLogger.logContractError(error as Error, {
        contractId,
        amendmentId,
        userId,
        action: "cancel_amendment",
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private validateAmendmentEligibility(
    contract: IContract,
    userId: string
  ): void {
    if (contract.status !== ContractStatus.ACTIVE) {
      throw new ContractValidationError("Only active contracts can be amended");
    }

    // Check if user has permission to amend
    const canAmend =
      contract.landlord.toString() === userId ||
      contract.tenants.some((t) => t.toString() === userId);

    if (!canAmend) {
      throw new ContractError("Not authorized to amend this contract", 403);
    }
  }

  private validateAmendmentChanges(
    changes: Array<{ field: string; oldValue: string; newValue: string }>
  ): void {
    const allowedFields = [
      "rentAmount",
      "depositAmount",
      "serviceCharge",
      "lateFee",
      "rentDueDate",
      "waterBill",
      "electricityBill",
      "gasBill",
      "internetBill",
      "petsAllowed",
      "smokingAllowed",
      "sublettingAllowed",
      "maxOccupants",
      "paymentSchedule",
      "specialConditions",
      "notes",
    ];

    for (const change of changes) {
      if (!allowedFields.includes(change.field)) {
        throw new ContractValidationError(
          `Field '${change.field}' cannot be amended`
        );
      }

      if (change.oldValue === change.newValue) {
        throw new ContractValidationError(
          `No change detected for field '${change.field}'`
        );
      }

      // Validate specific field types
      if (change.field === "rentAmount" || change.field === "depositAmount") {
        const newValue = Number.parseFloat(change.newValue);
        if (Number.isNaN(newValue) || newValue <= 0) {
          throw new ContractValidationError(
            `Invalid value for ${change.field}`
          );
        }
      }

      if (change.field === "rentDueDate") {
        const newValue = Number.parseInt(change.newValue, 10);
        if (Number.isNaN(newValue) || newValue < 1 || newValue > 31) {
          throw new ContractValidationError(
            "Rent due date must be between 1 and 31"
          );
        }
      }
    }
  }

  private async applyAmendmentChanges(
    contractId: string,
    amendmentId: string
  ): Promise<void> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) return;

      const amendment = contract.contractData.amendments?.find(
        (a: any) => a._id.toString() === amendmentId
      );

      if (!amendment) return;

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      for (const change of amendment.changes) {
        // Convert values to appropriate types
        let newValue: any = change.newValue;

        if (
          change.field === "rentAmount" ||
          change.field === "depositAmount" ||
          change.field === "serviceCharge" ||
          change.field === "lateFee"
        ) {
          newValue = Number.parseFloat(change.newValue);
        } else if (
          change.field === "rentDueDate" ||
          change.field === "maxOccupants"
        ) {
          newValue = Number.parseInt(change.newValue, 10);
        } else if (
          change.field === "petsAllowed" ||
          change.field === "smokingAllowed" ||
          change.field === "sublettingAllowed"
        ) {
          newValue = change.newValue === "true";
        }

        updateData[change.field] = newValue;
      }

      // Update contract
      await Contract.findByIdAndUpdate(contractId, { $set: updateData });

      // Mark amendment as applied
      await Contract.findOneAndUpdate(
        {
          _id: contractId,
          "contractData.amendments._id": new mongoose.Types.ObjectId(
            amendmentId
          ),
        },
        {
          $set: {
            "contractData.amendments.$.status": "applied",
            "contractData.amendments.$.updatedAt": new Date(),
          },
        }
      );
    } catch (error) {
      logger.error("Error applying amendment changes:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const contractAmendmentService = new ContractAmendmentService();
