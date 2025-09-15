import type { Document, Types } from "mongoose";
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
  contract: Types.ObjectId; // Reference to Lease model

  // Enhanced tenant classification
  tenantType: TenantType;
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
  contract: Types.ObjectId;
  tenantType: TenantType;
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
  tenantType?: TenantType;
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
  tenantType?: TenantType | TenantType[];
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
