// Reference status (matches API MVP)
export enum ReferenceStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  EXPIRED = "expired",
  DECLINED = "declined",
}

// Reference type (matches API MVP with Kenyan extensions)
export enum ReferenceType {
  EMPLOYER = "employer",
  PREVIOUS_LANDLORD = "previous_landlord",
  CHARACTER = "character",
  BUSINESS_PARTNER = "business_partner",
  FAMILY_GUARANTOR = "family_guarantor",
  SACCOS_MEMBER = "saccos_member",
  CHAMA_MEMBER = "chama_member",
  RELIGIOUS_LEADER = "religious_leader",
  COMMUNITY_ELDER = "community_elder",
}

// Reference provider (matches API MVP)
export type ReferenceProvider = {
  name: string;
  email: string;
  phone?: string;
  relationship: string;
};

// Verification details (matches API MVP with Kenyan extensions)
export type VerificationDetails = {
  // Employment verification
  employmentStatus?: string;
  annualIncome?: number;
  lengthOfEmployment?: string;
  positionHeld?: string;
  employerKRAPin?: string;
  salarySlipVerified?: boolean;

  // Landlord verification
  landlordFeedback?: string;
  rentPaymentHistory?: string;
  rentAmount?: number;
  tenancyLength?: string;
  reasonForLeaving?: string;
  waterBillsPaid?: boolean;
  electricalBillsPaid?: boolean;
  propertyCondition?: string;

  // Character/Community verification
  characterReference?: string;
  communityStanding?: string;
  religiousAffiliation?: string;
  knownSince?: string;

  // Financial verification
  saccosAccountStatus?: string;
  chamaContribution?: string;
  mobileMoneyHistory?: string;
  crbStatus?: string;

  // Guarantor verification
  guarantorNetWorth?: number;
  guarantorProperty?: string;
  relationshipDuration?: string;
  willingnessToGuarantee?: boolean;
};

// Reference interface (matches API MVP structure with enhancements)
export type Reference = {
  _id: string;
  tenant: string; // ObjectId as string
  referenceType: ReferenceType;
  referenceProvider: ReferenceProvider;
  status: ReferenceStatus;
  submittedAt: string;
  completedAt?: string;
  declinedAt?: string;
  feedback?: string;
  rating?: number; // 1-5 rating scale

  // Decline information
  declineReason?:
    | "unreachable"
    | "not_acquainted"
    | "conflict_of_interest"
    | "insufficient_information"
    | "other";
  declineComment?: string;

  // Request tracking
  requestAttempts: Array<{
    attemptNumber: number;
    sentAt: string;
    deliveryStatus: "sent" | "delivered" | "failed" | "bounced";
    deliveryDetails?: string;
  }>;
  reminderCount: number;

  verificationDetails?: VerificationDetails;
  responseData?: Record<string, any>;
  verificationScore?: number;
  consentId?: string;
  referenceToken: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

// Create reference input (from our app)
export type CreateReferenceInput = {
  referenceType: ReferenceType;
  referenceProvider: ReferenceProvider;
};

// Submit reference input (from the person giving the reference)
export type SubmitReferenceInput = {
  feedback: string;
  rating: number;
  verificationDetails: VerificationDetails;
};

// Reference filter options
export type ReferenceFilter = {
  status?: ReferenceStatus;
  referenceType?: ReferenceType;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

// Reference list response
export type ReferenceListResponse = {
  items: Reference[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  summary?: {
    total: number;
    pending: number;
    completed: number;
    expired: number;
    declined: number;
  };
  status: "success" | "error";
  message?: string;
};

// Reference response
export type ReferenceResponseDto = {
  data: Reference;
  status: "success" | "error";
  message?: string;
};

// Reference statistics
export type ReferenceStats = {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ type: string; count: number }>;
  byDate: Array<{ date: string; count: number }>;
  avgVerificationTime: number; // in hours
  rejectionRate: number;
  pendingRate: number;
};

// Consent-related types
export type ConsentRequest = {
  tenantId: string;
  verificationType:
    | "employment"
    | "landlord_history"
    | "character"
    | "financial"
    | "identity"
    | "all";
  dataRetentionPeriod?: number;
  purposes: string[];
  permissions: {
    shareWithLandlords: boolean;
    shareWithAgents: boolean;
    shareWithThirdParties: boolean;
  };
};

export type Consent = {
  _id: string;
  tenantId: string;
  verificationType: string;
  status: "granted" | "revoked";
  grantedAt: string;
  revokedAt?: string;
  dataRetentionPeriod: number;
  purposes: string[];
  permissions: {
    shareWithLandlords: boolean;
    shareWithAgents: boolean;
    shareWithThirdParties: boolean;
  };
};

// Decline reference input
export type DeclineReferenceInput = {
  reason:
    | "unreachable"
    | "not_acquainted"
    | "conflict_of_interest"
    | "insufficient_information"
    | "other";
  comment?: string;
};

// Resend reference response
export type ResendReferenceResponse = {
  success: boolean;
  message: string;
  reference: Reference;
};

// Dynamic validation schema
export type ValidationSchema = {
  fields: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "select" | "multiselect";
      required: boolean;
      label: string;
      placeholder?: string;
      options?: Array<{ value: string; label: string }>;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
      };
    }
  >;
};

// Reference type metadata
export type ReferenceTypeMetadata = {
  value: ReferenceType;
  label: string;
  description: string;
  icon: string;
  requiredFields?: string[];
  color: string;
};
