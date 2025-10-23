/**
 * Property Insurance Types
 *
 * This module provides type definitions for property insurance management
 * including policies, claims, and coverage details.
 */

/**
 * Insurance type enumeration
 */
export enum InsuranceType {
  BUILDING = "building",
  CONTENTS = "contents",
  LIABILITY = "liability",
  LANDLORD = "landlord",
  TENANT = "tenant",
  COMPREHENSIVE = "comprehensive",
}

/**
 * Insurance policy status enumeration
 */
export enum InsurancePolicyStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
  SUSPENDED = "suspended",
}

/**
 * Insurance claim status enumeration
 */
export enum InsuranceClaimStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  SETTLED = "settled",
  CLOSED = "closed",
}

/**
 * Insurance claim type enumeration
 */
export enum InsuranceClaimType {
  FIRE = "fire",
  FLOOD = "flood",
  THEFT = "theft",
  VANDALISM = "vandalism",
  ACCIDENT = "accident",
  NATURAL_DISASTER = "natural_disaster",
  LIABILITY = "liability",
  OTHER = "other",
}

/**
 * Insurance coverage interface
 */
export type InsuranceCoverage = {
  buildingValue: number;
  contentsValue?: number;
  liabilityLimit: number;
  additionalCoverage: Array<{
    type: string;
    description: string;
    limit: number;
  }>;
};

/**
 * Insurance terms interface
 */
export type InsuranceTerms = {
  startDate: string;
  endDate: string;
  policyTerm: number; // in months
  deductible: number;
  renewalDate: string;
  autoRenewal: boolean;
  currency: string;
};

/**
 * Insurance premium interface
 */
export type InsurancePremium = {
  annualPremium: number;
  paymentFrequency: "monthly" | "quarterly" | "semi_annually" | "annually";
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  totalPaid?: number;
};

/**
 * Insurance policy interface
 */
export type InsurancePolicy = {
  _id: string;
  policyNumber: string;
  property: string;
  landlord: string;
  tenant?: string;
  insuranceType: InsuranceType;
  provider: string;
  status: InsurancePolicyStatus;
  coverage: InsuranceCoverage;
  terms: InsuranceTerms;
  premium: InsurancePremium;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend
  propertyAddress?: string;
  landlordName?: string;
  tenantName?: string;
  daysUntilExpiry?: number;
  isExpiringSoon?: boolean;
};

/**
 * Insurance claim witness interface
 */
export type InsuranceClaimWitness = {
  name: string;
  contact: string;
  statement?: string;
};

/**
 * Insurance claim police report interface
 */
export type InsuranceClaimPoliceReport = {
  reportNumber: string;
  station: string;
  officerName: string;
  reportDate: string;
};

/**
 * Insurance claim incident interface
 */
export type InsuranceClaimIncident = {
  type: InsuranceClaimType;
  location: string;
  cause?: string;
  witnesses: InsuranceClaimWitness[];
  policeReport?: InsuranceClaimPoliceReport;
};

/**
 * Insurance claim interface
 */
export type InsuranceClaim = {
  _id: string;
  claimNumber: string;
  policy: string;
  property: string;
  landlord: string;
  claimType: InsuranceClaimType;
  status: InsuranceClaimStatus;
  incidentDate: string;
  reportedDate: string;
  description: string;
  claimedAmount: number;
  approvedAmount?: number;
  settledAmount?: number;
  incident: InsuranceClaimIncident;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    description?: string;
    uploadedAt: string;
  }>;
  adjusterNotes?: string;
  submittedBy: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Additional fields for frontend
  policyNumber?: string;
  propertyAddress?: string;
  landlordName?: string;
  daysOpen?: number;
};

/**
 * Insurance policy creation input
 */
export type CreateInsurancePolicyInput = {
  property: string;
  landlord: string;
  tenant?: string;
  insuranceType: InsuranceType;
  provider: string;
  coverage: InsuranceCoverage;
  terms: Omit<InsuranceTerms, "renewalDate"> & { renewalDate?: string };
  premium: Omit<
    InsurancePremium,
    "nextPaymentDate" | "lastPaymentDate" | "totalPaid"
  >;
  notes?: string;
};

/**
 * Insurance policy update input
 */
export type UpdateInsurancePolicyInput = {
  insuranceType?: InsuranceType;
  provider?: string;
  status?: InsurancePolicyStatus;
  coverage?: Partial<InsuranceCoverage>;
  terms?: Partial<InsuranceTerms>;
  premium?: Partial<InsurancePremium>;
  notes?: string;
};

/**
 * Insurance claim creation input
 */
export type CreateInsuranceClaimInput = {
  policy: string;
  property: string;
  landlord: string;
  claimType: InsuranceClaimType;
  incidentDate: string;
  description: string;
  claimedAmount: number;
  incident: InsuranceClaimIncident;
  attachments?: File[];
};

/**
 * Insurance claim update input
 */
export type UpdateInsuranceClaimInput = {
  status?: InsuranceClaimStatus;
  description?: string;
  claimedAmount?: number;
  approvedAmount?: number;
  settledAmount?: number;
  adjusterNotes?: string;
};

/**
 * Insurance policy query parameters
 */
export type InsurancePolicyQueryParams = {
  property?: string;
  landlord?: string;
  tenant?: string;
  insuranceType?: InsuranceType;
  status?: InsurancePolicyStatus;
  provider?: string;
  expiringSoon?: boolean;
  expiryDays?: number;
  sortBy?: "createdAt" | "renewalDate" | "premium" | "provider";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Insurance claim query parameters
 */
export type InsuranceClaimQueryParams = {
  policy?: string;
  property?: string;
  landlord?: string;
  claimType?: InsuranceClaimType;
  status?: InsuranceClaimStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "reportedDate" | "incidentDate" | "claimedAmount" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
};

/**
 * Insurance statistics interface
 */
export type InsuranceStats = {
  totalPolicies: number;
  activePolicies: number;
  expiredPolicies: number;
  expiringSoon: number;
  totalClaims: number;
  openClaims: number;
  settledClaims: number;
  totalClaimedAmount: number;
  totalSettledAmount: number;
  averageClaimAmount: number;
  claimSettlementRate: number;
};

/**
 * Insurance recommendation interface
 */
export type InsuranceRecommendation = {
  propertyId: string;
  recommendedType: InsuranceType;
  estimatedPremium: number;
  recommendedCoverage: InsuranceCoverage;
  providers: Array<{
    name: string;
    rating: number;
    estimatedPremium: number;
    features: string[];
  }>;
  reasoning: string;
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
 * Insurance API responses
 */
export interface InsurancePolicyResponse extends ApiResponse<InsurancePolicy> {
  policy?: InsurancePolicy;
}

export type InsurancePolicyListResponse = {
  policies?: InsurancePolicy[];
  data?: {
    policies: InsurancePolicy[];
    pagination: Pagination;
  };
};

export interface InsuranceClaimResponse extends ApiResponse<InsuranceClaim> {
  claim?: InsuranceClaim;
}

export type InsuranceClaimListResponse = {
  claims?: InsuranceClaim[];
  data?: {
    claims: InsuranceClaim[];
    pagination: Pagination;
  };
};

export interface InsuranceStatsResponse extends ApiResponse<InsuranceStats> {
  stats?: InsuranceStats;
}

export interface InsuranceRecommendationResponse
  extends ApiResponse<InsuranceRecommendation> {
  recommendation?: InsuranceRecommendation;
}
