import type { Document, Types } from "mongoose";
import type { BaseDocument } from "./base.type";
import type { IAddress } from "./common.type";

export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
  REJECTED = "rejected",
}

export enum TenantPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum TenantType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
  STUDENT = "student",
}

export enum CommunicationPreference {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  PHONE = "phone",
  IN_APP = "in_app",
}

export interface ITenant extends Document {
  memberId: Types.ObjectId;
  user: Types.ObjectId; // Reference to User model
  property: Types.ObjectId; // Reference to Property model
  unit: Types.ObjectId; // Reference to Unit model
  contract?: Types.ObjectId; // Reference to Lease model

  // Enhanced tenant classification
  type: TenantType;
  priority: TenantPriority;

  // Personal information
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    alternatePhone?: string;
    nationalId: string;
    passportNumber?: string;
    dateOfBirth: Date;
    nationality?: string;
    occupation: string;
    employer?: string;
    monthlyIncome: number;
    maritalStatus: "single" | "married" | "divorced" | "widowed";
    dependents: number;
    preferredLanguage: string;
  };

  // Corporate tenant information (for corporate tenants)
  corporateInfo?: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    industry: string;
    companySize: "small" | "medium" | "large" | "enterprise";
    contactPerson: {
      name: string;
      title: string;
      email: string;
      phone: string;
    };
    businessAddress: IAddress;
  };

  startDate: Date;
  endDate?: Date;
  status: TenantStatus;
  verificationProgress: number;
  isVerified: boolean;
  address: IAddress;

  // Enhanced emergency contacts
  emergencyContacts: Array<{
    name: string;
    phone: string;
    alternatePhone?: string;
    relationship: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
  }>;

  documents?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: Types.ObjectId;
    expiryDate?: Date;
    isExpired?: boolean;
  }>;

  // Enhanced AI-powered tenant scoring
  tenantScore: {
    creditScore: number;
    riskScore: number;
    reliabilityScore: number;
    paymentHistory: number;
    overallScore: number;
    lastUpdated: Date;
    factors: Array<{
      factor: string;
      impact: "positive" | "negative" | "neutral";
      weight: number;
      description?: string;
    }>;
  };

  // Enhanced background check results
  backgroundCheck: {
    conducted: boolean;
    conductedDate?: Date;
    creditCheck: {
      score?: number;
      report?: string;
      cleared: boolean;
      provider?: string;
    };
    criminalCheck: {
      cleared: boolean;
      report?: string;
      provider?: string;
    };
    employmentVerification: {
      verified: boolean;
      employerConfirmed: boolean;
      incomeVerified: boolean;
      provider?: string;
    };
    previousLandlordCheck: {
      contacted: boolean;
      recommendation?: "excellent" | "good" | "fair" | "poor";
      notes?: string;
    };
    referenceChecks: Array<{
      name: string;
      relationship: string;
      contact: string;
      verified: boolean;
      recommendation?: string;
      notes?: string;
    }>;
  };

  // Communication preferences and history
  communicationPreferences: {
    preferredMethod: CommunicationPreference;
    language: string;
    timezone: string;
    receiveMarketing: boolean;
    receiveReminders: boolean;
    receiveMaintenanceUpdates: boolean;
  };

  // Payment information
  paymentInfo: {
    preferredMethod:
      | "bank_transfer"
      | "mobile_money"
      | "credit_card"
      | "cash"
      | "check";
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      routingNumber?: string;
    };
    mobileMoney?: {
      provider: string;
      phoneNumber: string;
    };
    autopayEnabled: boolean;
    paymentReminders: boolean;
  };

  // Lease history and metrics
  leaseHistory: Array<{
    property: Types.ObjectId;
    unit: Types.ObjectId;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
    securityDeposit: number;
    reasonForLeaving?: string;
    landlordRating?: number;
    landlordReview?: string;
  }>;

  // Behavioral metrics
  behaviorMetrics: {
    communicationRating: number; // 1-5
    maintenanceCompliance: number; // 1-5
    respectForProperty: number; // 1-5
    noiseComplaints: number;
    latePayments: number;
    violationsCount: number;
    lastViolationDate?: Date;
  };

  stripeCustomerId?: string;
  notes?: string;
  internalNotes?: string; // Only visible to landlords/property managers
  tags: string[]; // For categorization
  isActive: boolean;

  // Metadata
  source?: "website" | "referral" | "agent" | "walk_in" | "social_media";
  referredBy?: Types.ObjectId;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type CreateTenantDto = {
  user?: Types.ObjectId;
  property: Types.ObjectId;
  unit: Types.ObjectId;
  contract?: Types.ObjectId;
  type: TenantType;
  priority?: TenantPriority;
  startDate: Date;
  endDate?: Date;
  status?: TenantStatus;

  personalInfo?: Partial<ITenant["personalInfo"]>;
  corporateInfo?: ITenant["corporateInfo"];
  emergencyContacts?: ITenant["emergencyContacts"];
  communicationPreferences?: Partial<ITenant["communicationPreferences"]>;
  paymentInfo?: Partial<ITenant["paymentInfo"]>;
  source?: ITenant["source"];
  referredBy?: Types.ObjectId;
  notes?: string;
  tags?: string[];
};

export type UpdateTenantDto = {
  property?: Types.ObjectId;
  unit?: Types.ObjectId;
  contract?: Types.ObjectId;
  type?: TenantType;
  priority?: TenantPriority;
  endDate?: Date;
  status?: TenantStatus;

  personalInfo?: Partial<ITenant["personalInfo"]>;
  corporateInfo?: ITenant["corporateInfo"];
  emergencyContacts?: ITenant["emergencyContacts"];
  communicationPreferences?: Partial<ITenant["communicationPreferences"]>;
  paymentInfo?: Partial<ITenant["paymentInfo"]>;
  behaviorMetrics?: Partial<ITenant["behaviorMetrics"]>;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  nextFollowUpDate?: Date;
};

export type TenantQueryParams = {
  status?: TenantStatus | TenantStatus[];
  type?: TenantType | TenantType[];
  priority?: TenantPriority | TenantPriority[];
  property?: string | string[];
  unit?: string | string[];
  contract?: string;
  isActive?: boolean;
  isVerified?: boolean;

  // Date filters
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;

  // Score filters
  minScore?: number;
  maxScore?: number;
  minCreditScore?: number;
  maxCreditScore?: number;

  // Search
  search?: string; // Search across names, email, phone
  tags?: string | string[];

  // Geographic filters
  city?: string;
  state?: string;
  country?: string;

  // Behavioral filters
  hasViolations?: boolean;
  hasLatePayments?: boolean;

  // Pagination and sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  page?: number;

  // Include related data
  populate?: string[];
};

// Enhanced search and analytics interfaces
export type TenantSearchFilters = {
  text?: string;
  exact?: boolean;
  fields?: Array<keyof ITenant>;
  dateRange?: {
    field: string;
    from: Date;
    to: Date;
  };
  scores?: {
    min?: number;
    max?: number;
    type: "overall" | "credit" | "risk" | "reliability";
  };
};

export type TenantAnalytics = {
  totalTenants: number;
  activeTenants: number;
  verifiedTenants: number;
  averageScore: number;
  averageCreditScore: number;
  averageMonthlyIncome: number;
  tenantsByStatus: Record<TenantStatus, number>;
  tenantsByType: Record<TenantType, number>;
  tenantsByPriority: Record<TenantPriority, number>;
  verificationProgress: {
    pending: number;
    inProgress: number;
    completed: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  geographicDistribution: Array<{
    location: string;
    count: number;
  }>;
  trends: {
    newTenants: Array<{
      period: string;
      count: number;
    }>;
    scoreImprovement: Array<{
      period: string;
      averageScore: number;
    }>;
  };
};

export type TenantBulkOperationResult = {
  success: number;
  failed: number;
  errors: Array<{
    tenantId: string;
    error: string;
  }>;
  updated: Types.ObjectId[];
};

export type TenantCommunicationLog = {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  type: "email" | "sms" | "call" | "meeting" | "notification";
  subject?: string;
  content: string;
  sentBy: Types.ObjectId;
  sentAt: Date;
  status: "sent" | "delivered" | "read" | "failed";
  response?: string;
  responseAt?: Date;
};

// ============================================= //

export enum ScreeningStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  EXPIRED = "expired",
}

export enum ScreeningType {
  BASIC = "basic",
  STANDARD = "standard",
  COMPREHENSIVE = "comprehensive",
}

export enum CreditRating {
  EXCELLENT = "excellent", // 750+
  GOOD = "good", // 650-749
  FAIR = "fair", // 550-649
  POOR = "poor", // 350-549
  VERY_POOR = "very_poor", // <350
}

export enum EmploymentStatus {
  EMPLOYED = "employed",
  SELF_EMPLOYED = "self_employed",
  UNEMPLOYED = "unemployed",
  STUDENT = "student",
  RETIRED = "retired",
}

export interface ITenantScreening extends BaseDocument {
  tenant: Types.ObjectId;
  property: Types.ObjectId;
  landlord: Types.ObjectId;
  application: Types.ObjectId;

  // Screening details
  screeningType: ScreeningType;
  status: ScreeningStatus;
  requestedDate: Date;
  completedDate?: Date;
  expiryDate: Date;

  // Identity verification
  identityVerification: {
    idNumber: string;
    idType: "national_id" | "passport" | "drivers_license";
    verified: boolean;
    verificationDate?: Date;
    verificationMethod: "manual" | "automated" | "third_party";
    documents: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
  };

  // Credit check
  creditCheck: {
    creditScore?: number;
    creditRating: CreditRating;
    creditReportUrl?: string;
    creditBureau: string;
    checkDate: Date;
    outstandingDebts: Array<{
      creditor: string;
      amount: number;
      status: "current" | "overdue" | "defaulted";
      monthsOverdue?: number;
    }>;
    creditHistory: {
      totalAccounts: number;
      activeAccounts: number;
      closedAccounts: number;
      defaultedAccounts: number;
      paymentHistory: "excellent" | "good" | "fair" | "poor";
    };
  };

  // Employment verification
  employmentVerification: {
    status: EmploymentStatus;
    employer?: string;
    jobTitle?: string;
    employmentDuration?: number; // months
    monthlyIncome?: number;
    verified: boolean;
    verificationDate?: Date;
    verificationMethod:
      | "payslip"
      | "employment_letter"
      | "bank_statement"
      | "tax_returns";
    documents: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
  };

  // Income verification
  incomeVerification: {
    monthlyIncome: number;
    annualIncome: number;
    incomeSource: "salary" | "business" | "investments" | "pension" | "other";
    incomeStability: "stable" | "variable" | "irregular";
    verified: boolean;
    verificationDate?: Date;
    documents: Array<{
      type: string;
      url: string;
      verified: boolean;
    }>;
  };

  // Background check
  backgroundCheck: {
    criminalRecord: {
      checked: boolean;
      hasRecord: boolean;
      details?: string;
      checkDate?: Date;
    };
    previousAddresses: Array<{
      address: string;
      duration: number; // months
      landlordContact?: string;
      reason_for_leaving?: string;
    }>;
    references: Array<{
      name: string;
      relationship: "employer" | "landlord" | "personal" | "professional";
      contact: string;
      verified: boolean;
      feedback?: string;
    }>;
  };

  // Financial assessment
  financialAssessment: {
    debtToIncomeRatio: number;
    rentToIncomeRatio: number;
    bankBalance?: number;
    savingsAmount?: number;
    financialStability: "excellent" | "good" | "fair" | "poor";
    affordabilityScore: number; // 0-100
  };

  // Risk assessment
  riskAssessment: {
    overallRiskScore: number; // 0-100 (lower is better)
    riskLevel: "low" | "medium" | "high" | "very_high";
    riskFactors: string[];
    mitigatingFactors: string[];
    recommendation: "approve" | "approve_with_conditions" | "reject";
    conditions?: string[];
  };

  // AI insights
  aiInsights: {
    paymentProbability: number; // 0-100
    tenancySuccessScore: number; // 0-100
    redFlags: string[];
    positiveIndicators: string[];
    similarTenantPerformance: {
      averagePaymentDelay: number; // days
      completionRate: number; // percentage
    };
  };

  // External service data
  externalServices: Array<{
    service: string;
    serviceType: "credit_bureau" | "background_check" | "identity_verification";
    requestId: string;
    response: any;
    cost: number;
    requestDate: Date;
    responseDate?: Date;
    status: "pending" | "completed" | "failed";
  }>;

  // Screening results
  results: {
    passed: boolean;
    score: number; // 0-100
    grade: "A" | "B" | "C" | "D" | "F";
    summary: string;
    recommendations: string[];
    conditions: string[];
  };

  // Metadata
  requestedBy: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
}
