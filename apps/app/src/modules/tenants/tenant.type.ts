// Tenant status
export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

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
  startDate: string;
  endDate?: string;
  status: TenantStatus;
  verificationProgress: number;
  isVerified: boolean;
  address: any;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
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
  backgroundCheck: any;
  stripeCustomerId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantCreateInput = {
  user?: string;
  property: string;
  unit: string;
  contract: string;
  startDate: string;
  endDate?: string;
  status?: TenantStatus;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
  notes?: string;
};

export type TenantUpdateInput = {
  property?: string;
  unit?: string;
  contract?: string;
  endDate?: string;
  status?: TenantStatus;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    email?: string;
  };
  notes?: string;
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
