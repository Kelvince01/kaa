import mongoose, { type Model, Schema } from "mongoose";
import type { IConsent, IReference } from "./types/reference.type";

const ReferenceSchema = new Schema<IReference>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    referenceType: {
      type: String,
      enum: [
        "employer",
        "previous_landlord",
        "character",
        "business_partner",
        "family_guarantor",
        "saccos_member",
        "chama_member",
        "religious_leader",
        "community_elder",
      ],
      required: true,
    },
    referenceProvider: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: String,
      relationship: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "completed", "expired", "declined"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    declinedAt: Date,
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    // Decline information
    declineReason: {
      type: String,
      enum: [
        "unreachable",
        "not_acquainted",
        "conflict_of_interest",
        "insufficient_information",
        "other",
      ],
    },
    declineComment: String,

    // Request tracking
    requestAttempts: [
      {
        attemptNumber: { type: Number, required: true },
        sentAt: { type: Date, required: true },
        deliveryStatus: {
          type: String,
          enum: ["sent", "delivered", "failed", "bounced"],
          required: true,
        },
        deliveryDetails: String,
      },
    ],
    lastReminderSent: Date,
    reminderCount: {
      type: Number,
      default: 0,
    },

    // Consent tracking
    consentId: {
      type: Schema.Types.ObjectId,
      ref: "Consent",
    },
    verificationDetails: {
      // Employment verification
      employmentStatus: String,
      annualIncome: Number,
      lengthOfEmployment: String,
      positionHeld: String,
      employerKRAPin: String,
      salarySlipVerified: Boolean,

      // Landlord verification
      landlordFeedback: String,
      rentPaymentHistory: String,
      rentAmount: Number,
      tenancyLength: String,
      reasonForLeaving: String,
      waterBillsPaid: Boolean,
      electricalBillsPaid: Boolean,
      propertyCondition: String,

      // Character/Community verification
      characterReference: String,
      communityStanding: String,
      religiousAffiliation: String,
      knownSince: String,

      // Financial verification
      saccosAccountStatus: String,
      chamaContribution: String,
      mobileMoneyHistory: String,
      crbStatus: String,

      // Guarantor verification
      guarantorNetWorth: Number,
      guarantorProperty: String,
      relationshipDuration: String,
      willingnessToGuarantee: Boolean,
    },
    referenceToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Create indexes
ReferenceSchema.index({ tenant: 1, referenceType: 1 });
ReferenceSchema.index({ referenceToken: 1 });
ReferenceSchema.index({ "referenceProvider.email": 1 });

export const Reference: Model<IReference> = mongoose.model<IReference>(
  "Reference",
  ReferenceSchema
);

const ConsentSchema = new Schema<IConsent>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    consentVersion: {
      type: String,
      required: true,
      default: "1.0",
    },
    consentTimestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requesterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    policyReference: {
      type: String,
      required: true,
      default: "KAA-PRIVACY-2025-001",
    },

    permissions: {
      employerVerification: { type: Boolean, default: true },
      kraVerification: { type: Boolean, default: false },
      crbCheck: { type: Boolean, default: false },
      mobileMoneyAnalysis: { type: Boolean, default: false },
      utilityBillVerification: { type: Boolean, default: true },
      saccosVerification: { type: Boolean, default: true },
      communityVerification: { type: Boolean, default: true },
      guarantorVerification: { type: Boolean, default: true },
    },

    dataRetention: {
      retentionPeriodMonths: { type: Number, default: 24 },
      allowDataSharing: { type: Boolean, default: false },
      allowAnalytics: { type: Boolean, default: true },
    },

    status: {
      type: String,
      enum: ["active", "revoked", "expired"],
      default: "active",
    },
    revokedAt: Date,
    revokedReason: String,
    expiresAt: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 2); // 2 years default
        return date;
      },
    },
  },
  { timestamps: true }
);

// Create indexes
ConsentSchema.index({ tenant: 1, status: 1 });
ConsentSchema.index({ status: 1, expiresAt: 1 });
ConsentSchema.index({ requesterId: 1 });

// Pre-save hook to handle expiry
ConsentSchema.pre<IConsent>("save", function (next) {
  const now = new Date();

  // If expired, mark as expired
  if (this.expiresAt && this.expiresAt < now && this.status === "active") {
    this.status = "expired";
  }

  next();
});

export const Consent: Model<IConsent> = mongoose.model<IConsent>(
  "Consent",
  ConsentSchema
);
