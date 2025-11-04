import type { Property } from "../properties";
import type { Tenant } from "../tenants/tenant.type";
import type { User } from "../users/user.type";

/**
 * Contract status enumeration
 */
export enum ContractStatus {
  DRAFT = "draft",
  PENDING = "pending",
  ACTIVE = "active",
  SIGNED = "signed",
  RENEWED = "renewed",
  SUSPENDED = "suspended",
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

export enum PropertyType {
  HOUSE = "house",
  FLAT = "flat",
  APARTMENT = "apartment",
  STUDIO = "studio",
  OTHER = "other",
  VILLA = "villa",
  OFFICE = "office",
  LAND = "land",
}

/**
 * Signature interface for contract signing
 */
export type Signature = {
  signedBy: string;
  signedAt: string;
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  ipAddress?: string;
  userAgent?: string;
  witnessName?: string;
  witnessSignature?: string;
};

/**
 * Contract document interface
 */
export type ContractDocument = {
  name: string;
  url: string;
  type:
    | "contract"
    | "addendum"
    | "amendment"
    | "termination"
    | "renewal"
    | "other";
  uploadedAt: string;
  uploadedBy?: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
};

/**
 * Payment schedule interface
 */
export type PaymentSchedule = {
  frequency: "weekly" | "monthly" | "quarterly" | "annually";
  amount: number;
  dueDate: number;
  firstPaymentDate?: string;
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
export type RenewalOptions = {
  allowAutoRenewal: boolean;
  renewalNoticePeriod: number;
  renewalTerms?: string;
  rentIncreasePercentage?: number;
  renewalFee?: number;
};

/**
 * Deposit protection information
 */
export type DepositProtection = {
  scheme: string;
  certificateNumber: string;
  protectedAmount: number;
  protectedDate: string;
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
export type TerminationInfo = {
  terminationDate?: string;
  terminationReason?: string;
  terminationNotice?: string;
  refundableDeposit?: number;
  deductions?: Array<{
    description: string;
    amount: number;
    category?: string;
  }>;
  finalInspectionDate?: string;
  finalInspectionNotes?: string;
  terminatedBy?: string;
};

/**
 * Contract term interface
 */
export type ContractTerm = {
  title: string;
  content: string;
  order?: number;
  category?: string;
  mandatory?: boolean;
};

/**
 * Contract amendment interface
 */
export type ContractAmendment = {
  _id: string;
  amendmentDate: string;
  amendmentReason: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    description?: string;
  }>;
  amendedBy: string;
  status: "pending" | "approved" | "rejected" | "applied";
  effectiveDate?: string;
  requiresApproval?: boolean;
  notes?: string;
};

/**
 * Custom clause interface
 */
export type CustomClause = {
  title: string;
  content: string;
  addedAt: string;
  addedBy: string;
};

/**
 * Contract data interface for custom terms and conditions
 */
export type ContractData = {
  terms?: ContractTerm[];
  specialConditions?: string[];
  customClauses?: CustomClause[];
  amendments?: ContractAmendment[];
  status?: string;
};

/**
 * Status history entry
 */
export type StatusHistoryEntry = {
  status: ContractStatus;
  changedAt: string;
  changedBy: string;
  reason?: string;
};

/**
 * Main contract interface
 */
export type Contract = {
  _id: string;
  // Core relationships
  property: string | Property;
  unit?: string;
  landlord: string | User;
  tenants: string[] | Tenant[];

  // Contract details
  startDate: string;
  endDate: string;
  rentAmount: number;
  depositAmount: number;
  serviceCharge?: number;
  lateFee?: number;
  rentDueDate: number;

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
  contractData: ContractData;
  contractDocument?: string;

  // Signatures
  signatures?: Signature[];
  landlordSignature?: Signature;
  tenantSignatures?: Record<string, Signature>;
  witnessSignature?: Signature;

  // Payment information
  paymentSchedule: PaymentSchedule;
  nextRentDueDate?: string;
  gracePeriodDays?: number;
  paymentTerms?: string;
  sendReminders?: boolean;

  // Documents
  documents: ContractDocument[];

  // Renewal options
  renewalOptions?: RenewalOptions;

  // Deposit protection
  depositProtectionScheme?:
    | "deposit_protection_service"
    | "my_deposits"
    | "tenancy_deposit_scheme"
    | "none";
  depositProtection?: DepositProtection;

  // Termination information
  terminationInfo?: TerminationInfo;

  // Contract relationships
  renewedFrom?: string;
  renewedTo?: string;
  parentContract?: string;
  childContracts?: string[];

  // Audit trail
  createdBy?: string;
  lastModifiedBy?: string;
  statusHistory?: StatusHistoryEntry[];

  // Additional fields
  notes?: string;
  reason?: string;
  tags?: string[];
  priority?: "low" | "medium" | "high";
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;

  // Timestamps
  signedAt?: string;
  activatedAt?: string;
  terminatedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Contract creation input
 */
export type CreateContractInput = {
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
  terms?: ContractTerm[];
  specialConditions?: string[];
  contractType?: ContractType;
  contractTemplate?: string;
  paymentSchedule?: Partial<PaymentSchedule>;
  renewalOptions?: RenewalOptions;
  notes?: string;
  tags?: string[];
};

/**
 * Contract update input
 */
export type UpdateContractInput = {
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
  terms?: ContractTerm[];
  specialConditions?: string[];
  status?: ContractStatus;
  paymentSchedule?: Partial<PaymentSchedule>;
  renewalOptions?: RenewalOptions;
  notes?: string;
  reason?: string;
  tags?: string[];
};

/**
 * Contract signing input
 */
export type ContractSigningInput = {
  signatureType: "digital" | "electronic" | "wet";
  signatureData?: string;
  witnessName?: string;
  witnessSignature?: string;
};

/**
 * Contract termination input
 */
export type ContractTerminationInput = {
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
 * Contract renewal input
 */
export type ContractRenewalInput = {
  newStartDate: string;
  newEndDate: string;
  newRentAmount?: number;
  newDepositAmount?: number;
  newTerms?: ContractTerm[];
  renewalNotes?: string;
};

/**
 * Contract query parameters
 */
export type ContractQueryParams = {
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
  tenantId?: string;
  landlordId?: string;
};

/**
 * Contract statistics interface
 */
export type ContractStats = {
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
 * Contract filter options
 */
export type ContractFilters = {
  status?: ContractStatus[];
  contractType?: ContractType[];
  propertyIds?: string[];
  unitIds?: string[];
  tenantIds?: string[];
  landlordIds?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
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
 * Pagination interface
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

/**
 * Base API response interface
 */
export type ApiResponse<T> = {
  status: "success" | "error";
  message?: string;
  data?: T;
};

/**
 * Contract API responses
 */
export type ContractResponse = ApiResponse<Contract> & {
  contract?: Contract; // For backward compatibility
};

export type ContractListResponse = ApiResponse<Contract[]> & {
  contracts?: Contract[];
  items?: Contract[];
  pagination: Pagination;
};

export type ContractStatsResponse = ApiResponse<ContractStats> & {
  stats?: ContractStats;
};

/**
 * Contract audit log entry
 */
export type ContractAuditLog = {
  contractId: string;
  action: string;
  userId: string;
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Contract template interface
 */
export type ContractTemplate = {
  _id: string;
  name: string;
  description?: string;
  contractType: ContractType;
  terms: ContractTerm[];
  defaultSettings: {
    rentDueDate: number;
    gracePeriodDays: number;
    lateFeeAmount: number;
    depositAmount: number;
    renewalOptions: RenewalOptions;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ContractTemplate_v2 = {
  name: string;
  description?: string;
  propertyType: PropertyType;
  content: string;
  variables: string[];
  isActive: boolean;
};

/**
 * Contract export options
 */
export type ContractExportOptions = {
  format: "pdf" | "csv" | "xlsx";
  includeSignatures?: boolean;
  includeDocuments?: boolean;
  template?: string;
  filters?: ContractFilters;
};

/**
 * Contract notification settings
 */
export type ContractNotificationSettings = {
  enableReminders: boolean;
  reminderDays: number[];
  enableRenewalNotifications: boolean;
  renewalNotificationDays: number;
  enableExpirationNotifications: boolean;
  expirationNotificationDays: number;
  notificationChannels: ("email" | "sms" | "push")[];
};

export type Amendment = {
  _id: string;
  amendmentDate: string;
  amendmentReason: string;
  changes: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    description?: string;
  }>;
  effectiveDate?: string;
  status: "pending" | "approved" | "rejected" | "applied";
  amendedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  approvalNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Amendment request data
 */
export type AmendmentRequestData = {
  contractId: string;
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

export type PendingAmendment = {
  contractId: string;
  amendment: Amendment;
  property: {
    name: string;
    location: {
      address: {
        line1: string;
        town: string;
      };
    };
  };
  landlord: {
    firstName: string;
    lastName: string;
  };
  tenants: Array<{
    personalInfo: {
      firstName: string;
      lastName: string;
    };
  }>;
  startDate: string;
  endDate: string;
  rentAmount: number;
};
