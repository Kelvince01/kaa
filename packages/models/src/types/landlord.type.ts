import type { Document, Types } from "mongoose";
import type { IAddress } from "./common.type";

export enum LandlordStatus {
  PENDING_VERIFICATION = "pending_verification",
  VERIFICATION_IN_PROGRESS = "verification_in_progress",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REJECTED = "rejected",
  INACTIVE = "inactive",
}

export enum LandlordType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  TRUST = "trust",
  PARTNERSHIP = "partnership",
  LLC = "llc",
  CORPORATION = "corporation",
}

export enum VerificationStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  EXPIRED = "expired",
  REQUIRES_REVIEW = "requires_review",
}

export enum LandlordDocumentType {
  NATIONAL_ID = "national_id",
  PASSPORT = "passport",
  DRIVERS_LICENSE = "drivers_license",
  BUSINESS_REGISTRATION = "business_registration",
  TAX_CERTIFICATE = "tax_certificate",
  BANK_STATEMENT = "bank_statement",
  UTILITY_BILL = "utility_bill",
  INSURANCE_CERTIFICATE = "insurance_certificate",
  PROPERTY_DEED = "property_deed",
  PROPERTY_TITLE = "property_title",
  FINANCIAL_STATEMENT = "financial_statement",
  PROFESSIONAL_LICENSE = "professional_license",
  COMPLIANCE_CERTIFICATE = "compliance_certificate",
  OTHER = "other",
}

export enum ComplianceType {
  FIRE_SAFETY = "fire_safety",
  BUILDING_CODE = "building_code",
  HEALTH_PERMIT = "health_permit",
  BUSINESS_LICENSE = "business_license",
  TAX_CLEARANCE = "tax_clearance",
  INSURANCE = "insurance",
  ENVIRONMENTAL = "environmental",
  ACCESSIBILITY = "accessibility",
  ZONING = "zoning",
}

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

export enum KYCLevel {
  BASIC = "basic",
  STANDARD = "standard",
  ENHANCED = "enhanced",
}

export type ILandlord = Document & {
  // Basic Information
  user?: Types.ObjectId; // Reference to User model
  memberId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  landlordType: LandlordType;
  status: LandlordStatus;

  // Personal/Individual Information
  personalInfo?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    dateOfBirth: Date;
    nationality: string;
    nationalId: string;
    passportNumber?: string;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    occupation?: string;
    preferredLanguage: string;
  };

  // Business/Company Information
  businessInfo?: {
    companyName: string;
    registrationNumber: string;
    taxId: string;
    vatNumber?: string;
    industry: string;
    companyType:
      | "sole_proprietorship"
      | "partnership"
      | "llc"
      | "corporation"
      | "trust"
      | "other";
    establishedDate: Date;
    website?: string;
    description?: string;

    // Key Personnel
    directors: Array<{
      name: string;
      position: string;
      nationalId: string;
      sharePercentage?: number;
      isPrimary: boolean;
    }>;

    // Authorized Signatories
    authorizedPersons: Array<{
      name: string;
      position: string;
      email: string;
      phone: string;
      nationalId: string;
      canSignContracts: boolean;
      canManageFinances: boolean;
    }>;
  };

  // Contact Information
  contactInfo: {
    primaryAddress: IAddress;
    mailingAddress?: IAddress;
    businessAddress?: IAddress;
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
  };

  // Verification and KYC
  verification: {
    status: VerificationStatus;
    level: KYCLevel;
    startedDate: Date;
    completedDate?: Date;
    expiryDate?: Date;
    nextReviewDate?: Date;

    // Identity Verification
    identityVerification: {
      status: VerificationStatus;
      method: "manual" | "automated" | "video_call" | "in_person";
      verifiedDate?: Date;
      verifiedBy?: Types.ObjectId;
      identityScore: number; // 0-100
      notes?: string;
    };

    // Address Verification
    addressVerification: {
      status: VerificationStatus;
      method: "document" | "utility_bill" | "bank_statement" | "site_visit";
      verifiedDate?: Date;
      verifiedBy?: Types.ObjectId;
      notes?: string;
    };

    // Financial Verification
    financialVerification: {
      status: VerificationStatus;
      creditScore?: number;
      bankVerified: boolean;
      incomeVerified: boolean;
      assetValue?: number;
      liabilityValue?: number;
      netWorth?: number;
      verifiedDate?: Date;
      verifiedBy?: Types.ObjectId;
      notes?: string;
    };

    // Business Verification (for business entities)
    businessVerification?: {
      status: VerificationStatus;
      registrationVerified: boolean;
      taxStatusVerified: boolean;
      directorsVerified: boolean;
      financialStatementsVerified: boolean;
      verifiedDate?: Date;
      verifiedBy?: Types.ObjectId;
      notes?: string;
    };

    // Reference Checks
    referenceChecks: Array<{
      type: "professional" | "personal" | "business" | "banking";
      name: string;
      contact: string;
      relationship: string;
      verified: boolean;
      feedback?: string;
      rating?: number; // 1-5
      verifiedDate?: Date;
    }>;
  };

  // Documents
  documents: Array<{
    type: LandlordDocumentType;
    name: string;
    url: string;
    fileType: string;
    fileSize: number;
    uploadedDate: Date;
    uploadedBy?: Types.ObjectId;
    isVerified: boolean;
    verifiedDate?: Date;
    verifiedBy?: Types.ObjectId;
    expiryDate?: Date;
    isExpired: boolean;
    notes?: string;
    metadata?: Record<string, any>;
  }>;

  // Compliance and Licensing
  compliance: {
    businessLicense: {
      status: VerificationStatus;
      licenseNumber?: string;
      issueDate?: Date;
      expiryDate?: Date;
      issuingAuthority?: string;
    };

    taxCompliance: {
      status: VerificationStatus;
      taxNumber: string;
      lastFilingDate?: Date;
      nextFilingDate?: Date;
      clearanceCertificate?: string;
    };

    propertyLicenses: Array<{
      property: Types.ObjectId;
      licenseType: string;
      licenseNumber: string;
      issueDate: Date;
      expiryDate: Date;
      issuingAuthority: string;
      status: "active" | "expired" | "suspended" | "revoked";
    }>;

    complianceChecks: Array<{
      type: ComplianceType;
      status: VerificationStatus;
      checkDate: Date;
      expiryDate?: Date;
      certificate?: string;
      notes?: string;
    }>;
  };

  // Financial Information
  financialInfo: {
    bankingDetails: {
      primaryBank: string;
      accountNumber: string;
      accountName: string;
      routingNumber?: string;
      swiftCode?: string;
      isVerified: boolean;
    };

    creditInformation: {
      creditScore?: number;
      creditRating?: "excellent" | "good" | "fair" | "poor";
      creditHistory?: {
        totalAccounts: number;
        activeAccounts: number;
        defaultedAccounts: number;
        paymentHistory: "excellent" | "good" | "fair" | "poor";
      };
    };

    insurance: {
      hasPropertyInsurance: boolean;
      hasLiabilityInsurance: boolean;
      insuranceProvider?: string;
      policyNumbers: string[];
      coverageAmount?: number;
      expiryDate?: Date;
    };

    financialCapacity: {
      monthlyIncome?: number;
      totalAssets?: number;
      totalLiabilities?: number;
      netWorth?: number;
      liquidAssets?: number;
      propertyValue?: number;
      mortgageDebt?: number;
    };
  };

  // Risk Assessment
  riskAssessment: {
    overallRiskScore: number; // 0-100 (lower is better)
    riskLevel: RiskLevel;
    riskFactors: Array<{
      factor: string;
      severity: "low" | "medium" | "high" | "critical";
      description: string;
      detectedDate: Date;
    }>;
    mitigatingFactors: Array<{
      factor: string;
      impact: string;
      description: string;
    }>;
    lastAssessmentDate: Date;
    nextAssessmentDate: Date;
  };

  // Performance Metrics
  performanceMetrics: {
    propertyManagementRating: number; // 1-5
    tenantSatisfactionRating: number; // 1-5
    maintenanceResponseTime: number; // hours
    occupancyRate: number; // percentage
    rentCollectionRate: number; // percentage
    complaintResolutionTime: number; // hours

    // Violation history
    violations: Array<{
      type: string;
      description: string;
      severity: "minor" | "major" | "critical";
      date: Date;
      resolved: boolean;
      resolutionDate?: Date;
      fine?: number;
    }>;

    // Performance trends
    trends: {
      rentCollection: Array<{
        period: string;
        rate: number;
      }>;
      occupancy: Array<{
        period: string;
        rate: number;
      }>;
      maintenance: Array<{
        period: string;
        averageResponseTime: number;
      }>;
    };
  };

  // Communication Preferences
  communicationPreferences: {
    preferredMethod: "email" | "sms" | "whatsapp" | "phone" | "in_app";
    language: string;
    timezone: string;
    receiveMarketingEmails: boolean;
    receivePropertyAlerts: boolean;
    receiveMaintenanceUpdates: boolean;
    receiveRegulatoryUpdates: boolean;
    receivePerformanceReports: boolean;
  };

  // Properties Management
  properties: Types.ObjectId[]; // References to Property models
  propertyStats: {
    totalProperties: number;
    activeProperties: number;
    totalUnits: number;
    occupiedUnits: number;
    totalValue: number;
    monthlyRevenue: number;
  };

  // Subscription and Billing
  subscription: {
    plan: "basic" | "standard" | "premium" | "enterprise";
    status: "active" | "inactive" | "cancelled" | "suspended";
    startDate: Date;
    endDate?: Date;
    billingCycle: "monthly" | "quarterly" | "yearly";
    paymentMethod: "card" | "bank_transfer" | "mobile_money";
    stripeCustomerId?: string;
    autoRenewal: boolean;
  };

  // Metadata and Tracking
  metadata: {
    source: "website" | "referral" | "agent" | "marketing" | "api" | "import";
    referredBy?: Types.ObjectId;
    campaignId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;

    // Tracking
    lastLoginDate?: Date;
    lastActivityDate?: Date;
    loginCount: number;
    profileCompleteness: number; // 0-100

    // Flags and Tags
    tags: string[];
    flags: Array<{
      type: "warning" | "attention" | "priority" | "restricted";
      reason: string;
      setDate: Date;
      setBy: Types.ObjectId;
      expiryDate?: Date;
    }>;

    // Notes
    notes: string;
    internalNotes: string; // Only visible to admin/staff
  };

  // Audit and Compliance
  auditTrail: Array<{
    action: string;
    performedBy: Types.ObjectId;
    performedAt: Date;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }>;

  // System fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

// DTO Interfaces
export type CreateLandlordDto = {
  landlordType: LandlordType;
  personalInfo?: Partial<ILandlord["personalInfo"]>;
  businessInfo?: Partial<ILandlord["businessInfo"]>;
  contactInfo: ILandlord["contactInfo"];
  communicationPreferences?: Partial<ILandlord["communicationPreferences"]>;
  subscription?: Partial<ILandlord["subscription"]>;
  metadata?: Partial<ILandlord["metadata"]>;
};

export type UpdateLandlordDto = {
  landlordType?: LandlordType;
  status?: LandlordStatus;
  personalInfo?: Partial<ILandlord["personalInfo"]>;
  businessInfo?: Partial<ILandlord["businessInfo"]>;
  contactInfo?: Partial<ILandlord["contactInfo"]>;
  financialInfo?: Partial<ILandlord["financialInfo"]>;
  communicationPreferences?: Partial<ILandlord["communicationPreferences"]>;
  subscription?: Partial<ILandlord["subscription"]>;
  metadata?: Partial<ILandlord["metadata"]>;
};

export type LandlordQueryParams = {
  status?: LandlordStatus | LandlordStatus[];
  landlordType?: LandlordType | LandlordType[];
  verificationStatus?: VerificationStatus | VerificationStatus[];
  riskLevel?: RiskLevel | RiskLevel[];

  // Search and filters
  search?: string;
  tags?: string | string[];
  city?: string;
  state?: string;
  country?: string;

  // Date filters
  createdFrom?: Date;
  createdTo?: Date;
  verifiedFrom?: Date;
  verifiedTo?: Date;

  // Financial filters
  minNetWorth?: number;
  maxNetWorth?: number;
  minPropertyValue?: number;
  maxPropertyValue?: number;

  // Performance filters
  minOccupancyRate?: number;
  maxOccupancyRate?: number;
  minCollectionRate?: number;
  maxCollectionRate?: number;

  // Compliance filters
  hasValidLicense?: boolean;
  hasActiveViolations?: boolean;
  complianceExpiring?: boolean; // Documents expiring within 30 days

  // Pagination and sorting
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  populate?: string[];
};

export type LandlordVerificationDto = {
  verificationType: "identity" | "address" | "financial" | "business";
  documents?: Array<{
    type: LandlordDocumentType;
    url: string;
    name: string;
    expiryDate?: Date;
  }>;
  verificationData?: Record<string, any>;
  notes?: string;
};

export type LandlordAnalytics = {
  totalLandlords: number;
  activeLandlords: number;
  verifiedLandlords: number;
  pendingVerification: number;

  // Distribution by type
  byType: Record<LandlordType, number>;
  byStatus: Record<LandlordStatus, number>;
  byRiskLevel: Record<RiskLevel, number>;

  // Financial metrics
  averageNetWorth: number;
  averagePropertyValue: number;
  averageMonthlyRevenue: number;
  totalPropertyValue: number;

  // Performance metrics
  averageOccupancyRate: number;
  averageCollectionRate: number;
  averageRating: number;

  // Geographic distribution
  geographicDistribution: Array<{
    location: string;
    count: number;
    totalPropertyValue: number;
  }>;

  // Compliance status
  complianceMetrics: {
    fullyCompliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    expiringDocuments: number;
  };

  // Trends
  trends: {
    registrations: Array<{
      period: string;
      count: number;
    }>;
    verifications: Array<{
      period: string;
      completed: number;
      pending: number;
    }>;
    performance: Array<{
      period: string;
      averageOccupancy: number;
      averageCollection: number;
    }>;
  };
};

export type LandlordBulkOperationResult = {
  success: number;
  failed: number;
  errors: Array<{
    landlordId: string;
    error: string;
  }>;
  updated: Types.ObjectId[];
};

export type ComplianceAlert = {
  landlord: Types.ObjectId;
  type: ComplianceType;
  alertType: "expiring" | "expired" | "missing" | "violation";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  dueDate?: Date;
  actionRequired: string;
  consequences?: string;
  createdAt: Date;
};

export type VerificationWorkflow = {
  landlord: Types.ObjectId;
  workflowType: KYCLevel;
  currentStep: number;
  totalSteps: number;
  status: VerificationStatus;

  steps: Array<{
    stepNumber: number;
    stepName: string;
    status: VerificationStatus;
    required: boolean;
    completedDate?: Date;
    notes?: string;
    assignedTo?: Types.ObjectId;
  }>;

  startedDate: Date;
  estimatedCompletionDate: Date;
  actualCompletionDate?: Date;
  assignedTo?: Types.ObjectId;
};

export type RiskAssessmentResult = {
  landlordId: Types.ObjectId;
  overallScore: number;
  riskLevel: RiskLevel;
  assessmentDate: Date;

  factors: Array<{
    category: string;
    factor: string;
    score: number;
    weight: number;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;

  recommendations: Array<{
    priority: "low" | "medium" | "high" | "critical";
    action: string;
    description: string;
    timeframe: string;
  }>;

  nextAssessmentDate: Date;
  assessedBy: Types.ObjectId;
};
