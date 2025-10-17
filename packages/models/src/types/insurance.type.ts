import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum InsuranceType {
  PROPERTY = "property",
  LIABILITY = "liability",
  LANDLORD = "landlord",
  TENANT = "tenant",
  CONTENTS = "contents",
  BUILDING = "building",
  RENT_GUARANTEE = "rent_guarantee",
  LEGAL_EXPENSES = "legal_expenses",
}

export enum InsuranceStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
  PENDING = "pending",
  SUSPENDED = "suspended",
}

export enum ClaimStatus {
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  SETTLED = "settled",
  CLOSED = "closed",
}

export interface IInsurancePolicy extends BaseDocument {
  property: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  tenant?: mongoose.Types.ObjectId;

  // Policy details
  policyNumber: string;
  insuranceType: InsuranceType;
  provider: string;
  status: InsuranceStatus;

  // Coverage details
  coverage: {
    buildingValue: number;
    contentsValue: number;
    liabilityLimit: number;
    rentGuaranteeAmount?: number;
    legalExpensesLimit?: number;
    additionalCoverage: Array<{
      type: string;
      description: string;
      limit: number;
    }>;
  };

  // Policy terms
  terms: {
    startDate: Date;
    endDate: Date;
    renewalDate: Date;
    policyTerm: number; // months
    autoRenewal: boolean;
    deductible: number;
    currency: string;
  };

  // Premium details
  premium: {
    annualPremium: number;
    monthlyPremium: number;
    paymentFrequency: "monthly" | "quarterly" | "annually";
    nextPaymentDate: Date;
    lastPaymentDate?: Date;
    totalPaid: number;
    outstandingAmount: number;
  };

  // Policy documents
  documents: Array<{
    type: "policy_document" | "certificate" | "schedule" | "endorsement";
    name: string;
    url: string;
    uploadedDate: Date;
    expiryDate?: Date;
  }>;

  // Claims history
  claims: mongoose.Types.ObjectId[];

  // Risk assessment
  riskAssessment: {
    riskScore: number; // 0-100
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
    lastAssessmentDate: Date;
    assessedBy: string;
  };

  // Notifications and reminders
  notifications: {
    renewalReminder: boolean;
    paymentReminder: boolean;
    claimUpdates: boolean;
    policyChanges: boolean;
    reminderDays: number; // days before expiry
  };

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}

export interface IInsuranceClaim extends BaseDocument {
  policy: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;
  tenant?: mongoose.Types.ObjectId;

  // Claim details
  claimNumber: string;
  claimType: string;
  status: ClaimStatus;
  incidentDate: Date;
  reportedDate: Date;
  description: string;

  // Financial details
  claimedAmount: number;
  approvedAmount?: number;
  settledAmount?: number;
  deductible: number;
  currency: string;

  // Incident details
  incident: {
    type:
      | "fire"
      | "flood"
      | "theft"
      | "vandalism"
      | "accident"
      | "natural_disaster"
      | "other";
    location: string;
    cause?: string;
    witnesses: Array<{
      name: string;
      contact: string;
      statement?: string;
    }>;
    policeReport?: {
      reportNumber: string;
      station: string;
      officerName: string;
      reportDate: Date;
    };
  };

  // Supporting documents
  documents: Array<{
    type: "photos" | "receipts" | "reports" | "estimates" | "statements";
    name: string;
    url: string;
    uploadedDate: Date;
    description?: string;
  }>;

  // Assessment details
  assessment: {
    assessorName?: string;
    assessorContact?: string;
    assessmentDate?: Date;
    assessmentReport?: string;
    recommendedAmount?: number;
    assessorNotes?: string;
  };

  // Timeline
  timeline: Array<{
    date: Date;
    action: string;
    description: string;
    performedBy: string;
    documents?: string[];
  }>;

  // Communication
  communications: Array<{
    date: Date;
    type: "email" | "phone" | "letter" | "meeting";
    direction: "inbound" | "outbound";
    subject: string;
    content: string;
    attachments?: string[];
  }>;

  // Settlement details
  settlement?: {
    settlementDate: Date;
    paymentMethod: string;
    paymentReference: string;
    paymentDate: Date;
    finalAmount: number;
  };

  // Metadata
  submittedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
}
