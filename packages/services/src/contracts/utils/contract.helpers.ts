import fs from "node:fs";
import path from "node:path";
import { Landlord, Tenant } from "@kaa/models";
import type { IProperty, ITenant, IUser } from "@kaa/models/types";
import { logger } from "@kaa/utils";

/**
 * Contract-related constants
 */
export const CONTRACT_CONSTANTS = {
  // File upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [".pdf", ".doc", ".docx"],
  UPLOAD_DIR: "uploads/contracts",

  // Date settings
  DEFAULT_NOTICE_PERIOD_DAYS: 30,
  DEFAULT_INSPECTION_NOTICE_HOURS: 24,

  // Payment settings
  DEFAULT_PAYMENT_FREQUENCY: "monthly",
  LATE_FEE_GRACE_PERIOD_DAYS: 5,

  // Contract settings
  MIN_CONTRACT_DURATION_MONTHS: 1,
  MAX_CONTRACT_DURATION_MONTHS: 24,
} as const;

/**
 * Error types for contract operations
 */
export class ContractError extends Error {
  constructor(message: string, _statusCode = 400, _errorCode?: string) {
    super(message);
    this.name = "ContractError";
  }
}

export class ContractValidationError extends ContractError {
  constructor(message: string, _field?: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ContractValidationError";
  }
}

export class ContractNotFoundError extends ContractError {
  constructor(contractId: string) {
    super(
      `Contract with ID ${contractId} not found`,
      404,
      "CONTRACT_NOT_FOUND"
    );
    this.name = "ContractNotFoundError";
  }
}

export class ContractOverlapError extends ContractError {
  constructor() {
    super(
      "A contract already exists for this unit during the specified period",
      409,
      "CONTRACT_OVERLAP"
    );
    this.name = "ContractOverlapError";
  }
}

/**
 * Date utility functions
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class DateHelpers {
  /**
   * Format date for display in contracts
   */
  static formatContractDate(date: Date): string {
    return date.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Calculate contract duration in months
   */
  static calculateContractDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();

    return years * 12 + months;
  }

  /**
   * Validate contract date range
   */
  static validateContractDates(startDate: Date, endDate: Date): void {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Remove time component for date comparison
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start < now) {
      throw new ContractValidationError(
        "Contract start date cannot be in the past",
        "startDate"
      );
    }

    if (end <= start) {
      throw new ContractValidationError(
        "Contract end date must be after start date",
        "endDate"
      );
    }

    const duration = DateHelpers.calculateContractDuration(start, end);
    if (duration < CONTRACT_CONSTANTS.MIN_CONTRACT_DURATION_MONTHS) {
      throw new ContractValidationError(
        `Contract duration must be at least ${CONTRACT_CONSTANTS.MIN_CONTRACT_DURATION_MONTHS} month(s)`,
        "duration"
      );
    }

    if (duration > CONTRACT_CONSTANTS.MAX_CONTRACT_DURATION_MONTHS) {
      throw new ContractValidationError(
        `Contract duration cannot exceed ${CONTRACT_CONSTANTS.MAX_CONTRACT_DURATION_MONTHS} months`,
        "duration"
      );
    }
  }

  /**
   * Check if dates overlap
   */
  static datesOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date
  ): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  /**
   * Get next rent due date
   */
  static getNextRentDueDate(
    rentDueDate: number,
    fromDate: Date = new Date()
  ): Date {
    const nextDue = new Date(fromDate);
    nextDue.setDate(rentDueDate);

    // If the due date has passed this month, move to next month
    if (nextDue <= fromDate) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }

    return nextDue;
  }
}

/**
 * File handling utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class FileHelpers {
  /**
   * Generate unique filename for contract document
   */
  static generateContractFilename(
    propertyId: string,
    unitId: string,
    timestamp: Date = new Date()
  ): string {
    const dateStr = timestamp.toISOString().split("T")[0];
    const timeStr = timestamp.toTimeString().split(" ")[0]?.replace(/:/g, "-");
    return `contract_${propertyId}_${unitId}_${dateStr}_${timeStr}.pdf`;
  }

  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDir(uploadPath: string): Promise<void> {
    try {
      await fs.promises.access(uploadPath);
    } catch {
      await fs.promises.mkdir(uploadPath, { recursive: true });
    }
  }

  /**
   * Validate file extension
   */
  static validateFileExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return CONTRACT_CONSTANTS.ALLOWED_FILE_TYPES.includes(
      ext as ".pdf" | ".doc" | ".docx"
    );
  }

  /**
   * Clean up temporary files
   */
  static async cleanupTempFiles(filePaths: string[]): Promise<void> {
    const cleanupPromises = filePaths.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
        logger.info(`Cleaned up temporary file: ${filePath}`);
      } catch (error) {
        logger.warn(`Failed to cleanup temporary file: ${filePath}`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
  }
}

/**
 * Contract data validation utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ContractValidators {
  /**
   * Validate rental amounts
   */
  static validateRentalAmounts(data: {
    rentAmount: number;
    depositAmount: number;
    serviceCharge?: number;
    lateFee?: number;
  }): void {
    if (data.rentAmount <= 0) {
      throw new ContractValidationError(
        "Rent amount must be greater than zero",
        "rentAmount"
      );
    }

    if (data.depositAmount < 0) {
      throw new ContractValidationError(
        "Deposit amount cannot be negative",
        "depositAmount"
      );
    }

    if (data.serviceCharge !== undefined && data.serviceCharge < 0) {
      throw new ContractValidationError(
        "Service charge cannot be negative",
        "serviceCharge"
      );
    }

    if (data.lateFee !== undefined && data.lateFee < 0) {
      throw new ContractValidationError(
        "Late fee cannot be negative",
        "lateFee"
      );
    }
  }

  /**
   * Validate rent due date
   */
  static validateRentDueDate(rentDueDate: number): void {
    if (rentDueDate < 1 || rentDueDate > 31) {
      throw new ContractValidationError(
        "Rent due date must be between 1 and 31",
        "rentDueDate"
      );
    }
  }

  /**
   * Validate tenant list
   */
  static validateTenants(tenants: ITenant[]): void {
    if (!tenants || tenants.length === 0) {
      throw new ContractValidationError(
        "At least one tenant is required",
        "tenants"
      );
    }

    // Check for duplicate tenants
    const tenantIds = tenants.map((t) => t._id?.toString());
    const uniqueIds = new Set(tenantIds);
    if (uniqueIds.size !== tenantIds.length) {
      throw new ContractValidationError(
        "Duplicate tenants are not allowed",
        "tenants"
      );
    }
  }
}

/**
 * Address formatting utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class AddressHelpers {
  /**
   * Format address for Kenyan context
   */
  static formatKenyanAddress(address: {
    line1?: string;
    line2?: string;
    town?: string;
    postalCode?: string;
    country?: string;
  }): string {
    const addressParts: string[] = [];

    if (address.line1) {
      addressParts.push(`P.O. Box ${address.line1}`);
    }

    if (address.line2) {
      addressParts.push(address.line2);
    }

    let townLine = "";
    if (address.postalCode) {
      townLine += `-${address.postalCode}`;
    }
    if (address.town) {
      townLine += (address.postalCode ? " " : "") + address.town;
    }
    if (townLine) {
      addressParts.push(townLine);
    }

    if (address.country) {
      addressParts.push(address.country.toUpperCase());
    }

    return addressParts.join(", ") || "Not provided";
  }

  /**
   * Format property address for contract
   */
  static formatPropertyAddress(property: IProperty): string {
    const address = property.location.address;
    return AddressHelpers.formatKenyanAddress({
      line1: address.line1,
      line2: address.line2,
      town: address.town,
      postalCode: address.postalCode,
      country: property.location.country,
    });
  }
}

/**
 * Contract status utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ContractStatusHelpers {
  /**
   * Determine if contract can be modified
   */
  static canModifyContract(status: string): boolean {
    return ["draft", "pending"].includes(status);
  }

  /**
   * Determine if contract can be signed
   */
  static canSignContract(status: string): boolean {
    return ["draft", "pending"].includes(status);
  }

  /**
   * Determine if contract can be terminated
   */
  static canTerminateContract(status: string): boolean {
    return ["active", "pending"].includes(status);
  }

  /**
   * Get next possible status transitions
   */
  static getPossibleStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      DRAFT: ["pending", "cancelled"],
      PENDING: ["active", "cancelled"],
      ACTIVE: ["terminated", "expired"],
      TERMINATED: [],
      EXPIRED: [],
      CANCELLED: [],
    };

    return transitions[currentStatus] || [];
  }
}

/**
 * Permission checking utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class PermissionHelpers {
  /**
   * Check if user can access contract
   */
  static async canAccessContract(
    user: IUser,
    contract: { landlord: string; tenants: string[] },
    userRole?: { name: string }
  ): Promise<boolean> {
    // Admin can access all contracts
    if (userRole?.name === "admin") {
      return true;
    }

    const landlord = await Landlord.findOne({ user: user.id });

    // Landlord can access their contracts
    if (contract.landlord === landlord?.id) {
      return true;
    }

    const tenants = await Tenant.find({ user: user.id });

    // Tenants can access their contracts
    // Check if any of the user's tenant ids are in contract.tenants
    const tenantIds = tenants.map((t) => t.id);
    return contract.tenants.some((tenantId: string) =>
      tenantIds.includes(tenantId)
    );
  }

  /**
   * Check if user can modify contract
   */
  static async canModifyContract(
    user: IUser,
    contract: { landlord: string; status: string },
    userRole?: { name: string }
  ): Promise<boolean> {
    // Admin can modify all contracts
    if (userRole?.name === "admin") {
      return true;
    }

    const landlord = await Landlord.findOne({ user: user.id });

    // Only landlord can modify their contracts
    if (contract.landlord !== landlord?.id) {
      return false;
    }

    // Can only modify contracts in certain statuses
    return ContractStatusHelpers.canModifyContract(contract.status);
  }
}

/**
 * Logging utilities specific to contracts
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class ContractLogger {
  /**
   * Log contract creation
   */
  static logContractCreation(
    contractId: string,
    userId: string,
    propertyId: string
  ): void {
    logger.info("Contract created", {
      extra: {
        contractId,
        userId,
        propertyId,
        action: "contract_created",
      },
    });
  }

  /**
   * Log contract status change
   */
  static logStatusChange(
    contractId: string,
    userId: string,
    fromStatus: string,
    toStatus: string
  ): void {
    logger.info("Contract status changed", {
      extra: {
        contractId,
        userId,
        fromStatus,
        toStatus,
        action: "contract_status_changed",
      },
    });
  }

  /**
   * Log contract error
   */
  static logContractError(
    error: Error,
    context: {
      contractId?: string;
      userId?: string;
      action?: string;
      amendmentId?: string;
    }
  ): void {
    logger.error("Contract operation failed", {
      error: error.message,
      stack: error.stack,
      ...context,
    });
  }
}
