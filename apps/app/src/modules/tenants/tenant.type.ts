// Tenant status
export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum TenantType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
  STUDENT = "student",
}

export enum TenantPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum CommunicationPreference {
  EMAIL = "email",
  SMS = "sms",
  WHATSAPP = "whatsapp",
  PHONE = "phone",
  IN_APP = "in_app",
}

/**
 * Address interface
 */
export type IAddress = {
  line1: string;
  line2?: string;
  town: string;
  county: string;
  postalCode: string;
  country: string;
  directions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type Tenant = {
  _id: string;
  memberId: string;
  user: string | any;
  property: string | any;
  unit: string | any;
  contract: string | any;
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    nationalId: string;
    dateOfBirth: string;
    occupation: string;
    employer?: string;
    monthlyIncome: number;
    maritalStatus: "single" | "married" | "divorced" | "widowed";
    dependents: number;
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
  startDate: string;
  endDate?: string;
  status: TenantStatus;
  type: TenantType;
  verificationProgress: number;
  isVerified: boolean;
  address: any;
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
    uploadedAt: string;
  }>;
  tenantScore: {
    creditScore: number;
    riskScore: number;
    reliabilityScore: number;
    paymentHistory: number;
    overallScore: number;
    lastUpdated: string;
    factors: Array<{
      factor: string;
      impact: "positive" | "negative" | "neutral";
      weight: number;
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
    property: string;
    unit: string;
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
  backgroundCheck: any;
  source?: "website" | "referral" | "agent" | "walk_in" | "social_media";
  stripeCustomerId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantDto = {
  user?: string;
  property: string;
  unit: string;
  contract?: string;
  type: TenantType;
  priority?: TenantPriority;
  startDate: string;
  endDate?: string;
  status?: TenantStatus;

  personalInfo?: Partial<Tenant["personalInfo"]>;
  corporateInfo?: Tenant["corporateInfo"];
  emergencyContacts?: Tenant["emergencyContacts"];
  communicationPreferences?: Partial<Tenant["communicationPreferences"]>;
  paymentInfo?: Partial<Tenant["paymentInfo"]>;
  source?: Tenant["source"];
  referredBy?: string;
  notes?: string;
  tags?: string[];
};

export type UpdateTenantDto = {
  property?: string;
  unit?: string;
  contract?: string;
  type?: TenantType;
  priority?: TenantPriority;
  endDate?: string;
  status?: TenantStatus;

  personalInfo?: Partial<Tenant["personalInfo"]>;
  corporateInfo?: Tenant["corporateInfo"];
  emergencyContacts?: Tenant["emergencyContacts"];
  communicationPreferences?: Partial<Tenant["communicationPreferences"]>;
  paymentInfo?: Partial<Tenant["paymentInfo"]>;
  behaviorMetrics?: Partial<Tenant["behaviorMetrics"]>;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  nextFollowUpDate?: Date;
};

export type TenantListResponse = {
  items: Tenant[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

export type TenantResponse = {
  data: Tenant;
  status: "success" | "error";
  message?: string;
};
