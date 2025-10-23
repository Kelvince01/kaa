import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

/**
 * Signature interface for contract signing
 */
export type ISignature = {
  signedBy: mongoose.Types.ObjectId;
  signedAt: Date;
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string; // Base64 encoded signature data
  ipAddress?: string;
  userAgent?: string;
  witnessName?: string;
  witnessSignature?: string;
};

/**
 * Contract status enumeration
 */
export enum ContractStatus {
  DRAFT = "draft",
  PENDING = "pending",
  ACTIVE = "active",
  SIGNED = "signed",
  TERMINATED = "terminated",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

/**
 * Contract type enumeration
 */
export enum ContractType {
  ASSURED_SHORTHAND_TENANCY = "assured_shorthand_tenancy",
  ASSURED_TENANCY = "assured_tenancy",
  COMMERCIAL_LEASE = "commercial_lease",
  STUDENT_ACCOMMODATION = "student_accommodation",
  HOLIDAY_LET = "holiday_let",
  ROOM_RENTAL = "room_rental",
  COMPANY_LET = "company_let",
  CUSTOM = "custom",
}

/**
 * Contract document interface
 */
export type IContractDocument = {
  name: string;
  url: string;
  type:
    | "contract"
    | "addendum"
    | "amendment"
    | "termination"
    | "renewal"
    | "other";
  uploadedAt: Date;
  uploadedBy?: mongoose.Types.ObjectId;
  fileSize?: number;
  mimeType?: string;
  description?: string;
};

/**
 * Payment schedule interface
 */
export type IPaymentSchedule = {
  frequency: "weekly" | "monthly" | "quarterly" | "annually";
  amount: number;
  dueDate: number; // Day of month (1-31)
  firstPaymentDate?: Date;
  paymentMethod?:
    | "bank_transfer"
    | "standing_order"
    | "direct_debit"
    | "cash"
    | "other";
  accountDetails?: {
    accountName?: string;
    accountNumber?: string;
    sortCode?: string;
    bankName?: string;
  };
};

/**
 * Contract renewal options
 */
export type IRenewalOptions = {
  allowAutoRenewal: boolean;
  renewalNoticePeriod: number; // in days
  renewalTerms?: string;
  rentIncreasePercentage?: number;
  renewalFee?: number;
};

/**
 * Deposit protection information
 */
export type IDepositProtection = {
  scheme: string;
  certificateNumber: string;
  protectedAmount: number;
  protectedDate: Date;
  schemeContactDetails?: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
};

/**
 * Contract termination information
 */
export type ITerminationInfo = {
  terminationDate?: Date;
  terminationReason?: string;
  terminationNotice?: string;
  refundableDeposit?: number;
  deductions?: Array<{
    description: string;
    amount: number;
    category?: string;
  }>;
  finalInspectionDate?: Date;
  finalInspectionNotes?: string;
  terminatedBy?: mongoose.Types.ObjectId;
};

/**
 * Contract term interface
 */
export type IContractTerm = {
  title: string;
  content: string;
  order?: number;
  category?: string;
  mandatory?: boolean;
};

/**
 * Contract data interface for custom terms and conditions
 */
export type IContractData = {
  terms?: IContractTerm[];
  specialConditions?: string[];
  customClauses?: Array<{
    title: string;
    content: string;
    addedAt: Date;
    addedBy: mongoose.Types.ObjectId;
  }>;
  amendments?: Array<{
    amendmentDate: Date;
    amendmentReason: string;
    changes: Array<{
      field: string;
      oldValue: string;
      newValue: string;
      description?: string;
    }>;
    effectiveDate?: Date;
    requiresApproval?: boolean;
    notes?: string;
    amendedBy: mongoose.Types.ObjectId;
    status: "pending" | "approved" | "rejected" | "applied";
  }>;
  status?: string;
};

/**
 * Main contract interface
 */
export type IContract = BaseDocument & {
  // Core relationships
  property: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  tenants: mongoose.Types.ObjectId[];

  // Contract details
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  depositAmount: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate: number; // Day of month (1-31)

  // Utility bills
  waterBill: "Included" | "Tenant pays" | "Shared";
  electricityBill: "Included" | "Tenant pays" | "Shared";
  gasBill?: "Included" | "Tenant pays" | "Shared";
  internetBill?: "Included" | "Tenant pays" | "Shared";

  // Property rules
  petsAllowed: boolean;
  smokingAllowed: boolean;
  sublettingAllowed: boolean;
  maxOccupants?: number;

  // Contract metadata
  status: ContractStatus;
  contractType: ContractType;
  contractTemplate: string;
  contractData: IContractData;
  contractDocument?: string; // URL to the generated PDF

  // Signatures
  signatures?: ISignature[];
  landlordSignature?: ISignature;
  tenantSignatures?: Record<string, ISignature>;
  witnessSignature?: ISignature;

  // Payment information
  paymentSchedule: IPaymentSchedule;
  nextRentDueDate?: Date;
  gracePeriodDays?: number;
  paymentTerms?: string;
  sendReminders?: boolean;

  // Documents
  documents: IContractDocument[];

  // Renewal options
  renewalOptions?: IRenewalOptions;

  // Deposit protection
  depositProtectionScheme?:
    | "deposit_protection_service"
    | "my_deposits"
    | "tenancy_deposit_scheme"
    | "none";
  depositProtection?: IDepositProtection;

  // Termination information
  terminationInfo?: ITerminationInfo;

  // Contract relationships
  renewedFrom?: mongoose.Types.ObjectId;
  renewedTo?: mongoose.Types.ObjectId;
  parentContract?: mongoose.Types.ObjectId;
  childContracts?: mongoose.Types.ObjectId[];

  // Audit trail
  createdBy?: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
  statusHistory?: Array<{
    status: ContractStatus;
    changedAt: Date;
    changedBy: mongoose.Types.ObjectId;
    reason?: string;
  }>;

  // Additional fields
  notes?: string;
  reason?: string;
  tags?: string[];
  priority?: "low" | "medium" | "high";
  archived?: boolean;
  archivedAt?: Date;
  archivedBy?: mongoose.Types.ObjectId;

  // Timestamps
  signedAt?: Date;
  activatedAt?: Date;
  terminatedAt?: Date;
  deletedAt?: Date;
};

/**
 * Contract creation DTO
 */
export type ICreateContractDto = {
  propertyId: string;
  unitId?: string;
  tenantIds: string[];
  startDate: string;
  endDate: string;
  rentAmount?: number;
  depositAmount?: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate?: number;
  waterBill?: "Included" | "Tenant pays" | "Shared";
  electricityBill?: "Included" | "Tenant pays" | "Shared";
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  sublettingAllowed?: boolean;
  terms?: IContractTerm[];
  specialConditions?: string[];
  contractType?: ContractType;
  contractTemplate?: string;
  paymentSchedule?: Partial<IPaymentSchedule>;
  renewalOptions?: IRenewalOptions;
  notes?: string;
  reason?: string;
  tags?: string[];
};

/**
 * Contract update DTO
 */
export type IUpdateContractDto = {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  depositAmount?: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate?: number;
  waterBill?: "Included" | "Tenant pays" | "Shared";
  electricityBill?: "Included" | "Tenant pays" | "Shared";
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  sublettingAllowed?: boolean;
  terms?: IContractTerm[];
  specialConditions?: string[];
  status?: ContractStatus;
  paymentSchedule?: Partial<IPaymentSchedule>;
  renewalOptions?: IRenewalOptions;
  notes?: string;
  reason?: string;
  tags?: string[];
};

/**
 * Contract query parameters
 */
export type IContractQueryParams = {
  status?: ContractStatus;
  property?: string;
  unit?: string;
  tenants?: string | string[];
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "startDate"
    | "endDate"
    | "rentAmount"
    | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;
  search?: string;
  tags?: string[];
  archived?: boolean;
};

/**
 * Contract signing DTO
 */
export type IContractSigningDto = {
  contractId: string;
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  witnessName?: string;
  witnessSignature?: string;
};

/**
 * Contract termination DTO
 */
export type IContractTerminationDto = {
  terminationDate: string;
  terminationReason: string;
  terminationNotice?: string;
  refundableDeposit?: number;
  deductions?: Array<{
    description: string;
    amount: number;
    category?: string;
  }>;
  finalInspectionDate?: string;
  finalInspectionNotes?: string;
};

/**
 * Contract renewal DTO
 */
export type IContractRenewalDto = {
  newStartDate: string;
  newEndDate: string;
  newRentAmount?: number;
  newDepositAmount?: number;
  newTerms?: IContractTerm[];
  renewalNotes?: string;
};

/**
 * Contract statistics interface
 */
export type IContractStats = {
  total: number;
  active: number;
  draft: number;
  pending: number;
  terminated: number;
  expired: number;
  cancelled: number;
  totalRentAmount: number;
  averageRentAmount: number;
  upcomingRenewals: number;
  expiringThisMonth: number;
};

/**
 * Contract term data for templates
 */
export type ContractTermData = {
  rentAmount: number;
  rentDueDate: number;
  depositAmount: number;
  lateFee: number;
  waterBill: "Included" | "Tenant pays" | "Shared";
  electricityBill: "Included" | "Tenant pays" | "Shared";
  petsAllowed: boolean;
  smokingAllowed: boolean;
  sublettingAllowed: boolean;
};

/**
 * Contract filter options
 */
export type IContractFilters = {
  status?: ContractStatus[];
  contractType?: ContractType[];
  propertyIds?: string[];
  unitIds?: string[];
  tenantIds?: string[];
  landlordIds?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
    field: "startDate" | "endDate" | "createdAt" | "updatedAt";
  };
  rentRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  archived?: boolean;
};

/**
 * Contract export options
 */
export type IContractExportOptions = {
  format: "pdf" | "csv" | "xlsx";
  includeSignatures?: boolean;
  includeDocuments?: boolean;
  template?: string;
  filters?: IContractFilters;
};

/**
 * Contract notification settings
 */
export type IContractNotificationSettings = {
  enableReminders: boolean;
  reminderDays: number[];
  enableRenewalNotifications: boolean;
  renewalNotificationDays: number;
  enableExpirationNotifications: boolean;
  expirationNotificationDays: number;
  notificationChannels: ("email" | "sms" | "push")[];
};

/**
 * Contract audit log entry
 */
export type IContractAuditLog = {
  contractId: mongoose.Types.ObjectId;
  action: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Contract template interface
 */
export type IContractTemplate = {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  contractType: ContractType;
  terms: IContractTerm[];
  defaultSettings: {
    rentDueDate: number;
    gracePeriodDays: number;
    lateFeeAmount: number;
    depositAmount: number;
    renewalOptions: IRenewalOptions;
  };
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
