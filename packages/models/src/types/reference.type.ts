/**
 * Reference model for tenant referencing system
 */

import type mongoose from "mongoose";

export interface IReference extends mongoose.Document {
  tenant: mongoose.Types.ObjectId;
  referenceType:
    | "employer"
    | "previous_landlord"
    | "character"
    | "business_partner"
    | "family_guarantor"
    | "saccos_member"
    | "chama_member"
    | "religious_leader"
    | "community_elder";
  referenceProvider: {
    name: string;
    email: string;
    phone?: string;
    relationship: string;
  };
  status: "pending" | "completed" | "declined" | "expired";
  submittedAt: Date;
  completedAt?: Date;
  declinedAt?: Date;
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
    sentAt: Date;
    deliveryStatus: "sent" | "delivered" | "failed" | "bounced";
    deliveryDetails?: string;
  }>;
  lastReminderSent?: Date;
  reminderCount: number;

  // Consent tracking
  consentId?: mongoose.Types.ObjectId;
  verificationDetails?: {
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
  referenceToken: string;
  expiresAt: Date;
}

export interface IConsent extends mongoose.Document {
  tenant: mongoose.Types.ObjectId;
  consentVersion: string;
  consentTimestamp: Date;
  requesterId: mongoose.Types.ObjectId;
  policyReference: string;

  // Specific consent permissions
  permissions: {
    employerVerification: boolean;
    kraVerification: boolean;
    crbCheck: boolean;
    mobileMoneyAnalysis: boolean;
    utilityBillVerification: boolean;
    saccosVerification: boolean;
    communityVerification: boolean;
    guarantorVerification: boolean;
  };

  // Data retention preferences
  dataRetention: {
    retentionPeriodMonths: number;
    allowDataSharing: boolean;
    allowAnalytics: boolean;
  };

  // Consent status
  status: "active" | "revoked" | "expired";
  revokedAt?: Date;
  revokedReason?: string;
  expiresAt: Date;
}
