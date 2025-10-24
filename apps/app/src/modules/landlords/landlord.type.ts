// Landlord status
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

export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high",
}

export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type Landlord = {
  _id: string;
  memberId: string;
  user?: string | any;
  organizationId?: string;
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
    dateOfBirth: string;
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
    establishedDate: string;
    website?: string;
    description?: string;

    directors: Array<{
      name: string;
      position: string;
      nationalId: string;
      sharePercentage?: number;
      isPrimary: boolean;
    }>;

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
    primaryAddress: Address;
    mailingAddress?: Address;
    businessAddress?: Address;
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
    level: "basic" | "standard" | "enhanced";
    startedDate: string;
    completedDate?: string;
    expiryDate?: string;
    nextReviewDate?: string;

    identityVerification: {
      status: VerificationStatus;
      method: "manual" | "automated" | "video_call" | "in_person";
      verifiedDate?: string;
      verifiedBy?: string;
      identityScore: number;
      notes?: string;
    };

    addressVerification: {
      status: VerificationStatus;
      method: "document" | "utility_bill" | "bank_statement" | "site_visit";
      verifiedDate?: string;
      verifiedBy?: string;
      notes?: string;
    };

    financialVerification: {
      status: VerificationStatus;
      creditScore?: number;
      bankVerified: boolean;
      incomeVerified: boolean;
      assetValue?: number;
      liabilityValue?: number;
      netWorth?: number;
      verifiedDate?: string;
      verifiedBy?: string;
      notes?: string;
    };

    businessVerification?: {
      status: VerificationStatus;
      registrationVerified: boolean;
      taxStatusVerified: boolean;
      directorsVerified: boolean;
      financialStatementsVerified: boolean;
      verifiedDate?: string;
      verifiedBy?: string;
      notes?: string;
    };
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
    };

    insurance: {
      hasPropertyInsurance: boolean;
      hasLiabilityInsurance: boolean;
      insuranceProvider?: string;
      policyNumbers: string[];
      coverageAmount?: number;
      expiryDate?: string;
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
    overallRiskScore: number;
    riskLevel: RiskLevel;
    lastAssessmentDate: string;
    nextAssessmentDate: string;
  };

  // Performance Metrics
  performanceMetrics: {
    propertyManagementRating: number;
    tenantSatisfactionRating: number;
    maintenanceResponseTime: number;
    occupancyRate: number;
    rentCollectionRate: number;
    complaintResolutionTime: number;
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
  properties: string[];
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
    startDate: string;
    endDate?: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    paymentMethod: "card" | "bank_transfer" | "mobile_money";
    stripeCustomerId?: string;
    autoRenewal: boolean;
  };

  // Metadata
  metadata: {
    source: "website" | "referral" | "agent" | "marketing" | "api" | "import";
    referredBy?: string;
    campaignId?: string;
    tags: string[];
    notes: string;
    internalNotes: string;
    lastLoginDate?: string;
    lastActivityDate?: string;
    loginCount: number;
    profileCompleteness: number;
  };

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type LandlordCreateInput = {
  landlordType: LandlordType;
  personalInfo?: Partial<Landlord["personalInfo"]>;
  businessInfo?: Partial<Landlord["businessInfo"]>;
  contactInfo: Landlord["contactInfo"];
  communicationPreferences?: Partial<Landlord["communicationPreferences"]>;
  subscription?: Partial<Landlord["subscription"]>;
  metadata?: Partial<Landlord["metadata"]>;
};

export type LandlordUpdateInput = {
  landlordType?: LandlordType;
  status?: LandlordStatus;
  personalInfo?: Partial<Landlord["personalInfo"]>;
  businessInfo?: Partial<Landlord["businessInfo"]>;
  contactInfo?: Partial<Landlord["contactInfo"]>;
  financialInfo?: Partial<Landlord["financialInfo"]>;
  communicationPreferences?: Partial<Landlord["communicationPreferences"]>;
  subscription?: Partial<Landlord["subscription"]>;
  metadata?: Partial<Landlord["metadata"]>;
};

export type LandlordQueryParams = {
  status?: LandlordStatus | LandlordStatus[];
  landlordType?: LandlordType | LandlordType[];
  verificationStatus?: VerificationStatus | VerificationStatus[];
  riskLevel?: RiskLevel | RiskLevel[];
  search?: string;
  tags?: string | string[];
  city?: string;
  state?: string;
  country?: string;
  createdFrom?: string;
  createdTo?: string;
  verifiedFrom?: string;
  verifiedTo?: string;
  minNetWorth?: number;
  maxNetWorth?: number;
  minPropertyValue?: number;
  maxPropertyValue?: number;
  minOccupancyRate?: number;
  maxOccupancyRate?: number;
  minCollectionRate?: number;
  maxCollectionRate?: number;
  hasValidLicense?: boolean;
  hasActiveViolations?: boolean;
  complianceExpiring?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  populate?: string[];
};

export type LandlordListResponse = {
  items: Landlord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  status: "success" | "error";
  message?: string;
};

export type LandlordResponse = {
  data: Landlord;
  status: "success" | "error";
  message?: string;
};

export type LandlordAnalytics = {
  totalLandlords: number;
  activeLandlords: number;
  verifiedLandlords: number;
  pendingVerification: number;
  byType: Record<LandlordType, number>;
  byStatus: Record<LandlordStatus, number>;
  byRiskLevel: Record<RiskLevel, number>;
  averageNetWorth: number;
  averagePropertyValue: number;
  averageMonthlyRevenue: number;
  totalPropertyValue: number;
  averageOccupancyRate: number;
  averageCollectionRate: number;
  averageRating: number;
  geographicDistribution: Array<{
    location: string;
    count: number;
    totalPropertyValue: number;
  }>;
  complianceMetrics: {
    fullyCompliant: number;
    partiallyCompliant: number;
    nonCompliant: number;
    expiringDocuments: number;
  };
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
