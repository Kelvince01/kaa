import mongoose, { Schema } from "mongoose";
import {
  ClaimStatus,
  type IInsuranceClaim,
  type IInsurancePolicy,
  InsuranceStatus,
  InsuranceType,
} from "./types/insurance.type";

const InsurancePolicySchema = new Schema<IInsurancePolicy>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Policy details
    policyNumber: {
      type: String,
      required: true,
      unique: true,
    },
    insuranceType: {
      type: String,
      enum: Object.values(InsuranceType),
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(InsuranceStatus),
      default: InsuranceStatus.ACTIVE,
    },

    // Coverage details
    coverage: {
      buildingValue: { type: Number, required: true },
      contentsValue: { type: Number, default: 0 },
      liabilityLimit: { type: Number, required: true },
      rentGuaranteeAmount: Number,
      legalExpensesLimit: Number,
      additionalCoverage: [
        {
          type: String,
          description: String,
          limit: Number,
        },
      ],
    },

    // Policy terms
    terms: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      renewalDate: { type: Date, required: true },
      policyTerm: { type: Number, required: true },
      autoRenewal: { type: Boolean, default: true },
      deductible: { type: Number, required: true },
      currency: { type: String, default: "KES" },
    },

    // Premium details
    premium: {
      annualPremium: { type: Number, required: true },
      monthlyPremium: { type: Number, required: true },
      paymentFrequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
        default: "annually",
      },
      nextPaymentDate: { type: Date, required: true },
      lastPaymentDate: Date,
      totalPaid: { type: Number, default: 0 },
      outstandingAmount: { type: Number, default: 0 },
    },

    // Policy documents
    documents: [
      {
        type: {
          type: String,
          enum: ["policy_document", "certificate", "schedule", "endorsement"],
          required: true,
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedDate: { type: Date, required: true },
        expiryDate: Date,
      },
    ],

    // Claims history
    claims: [
      {
        type: Schema.Types.ObjectId,
        ref: "InsuranceClaim",
      },
    ],

    // Risk assessment
    riskAssessment: {
      riskScore: { type: Number, min: 0, max: 100, required: true },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        required: true,
      },
      riskFactors: [String],
      lastAssessmentDate: { type: Date, required: true },
      assessedBy: { type: String, required: true },
    },

    // Notifications and reminders
    notifications: {
      renewalReminder: { type: Boolean, default: true },
      paymentReminder: { type: Boolean, default: true },
      claimUpdates: { type: Boolean, default: true },
      policyChanges: { type: Boolean, default: true },
      reminderDays: { type: Number, default: 30 },
    },

    // Metadata
    notes: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const InsuranceClaimSchema = new Schema<IInsuranceClaim>(
  {
    policy: {
      type: Schema.Types.ObjectId,
      ref: "InsurancePolicy",
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Claim details
    claimNumber: {
      type: String,
      required: true,
      unique: true,
    },
    claimType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      default: ClaimStatus.SUBMITTED,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    reportedDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Financial details
    claimedAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: Number,
    settledAmount: Number,
    deductible: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "KES",
    },

    // Incident details
    incident: {
      type: {
        type: String,
        enum: [
          "fire",
          "flood",
          "theft",
          "vandalism",
          "accident",
          "natural_disaster",
          "other",
        ],
        required: true,
      },
      location: { type: String, required: true },
      cause: String,
      witnesses: [
        {
          name: String,
          contact: String,
          statement: String,
        },
      ],
      policeReport: {
        reportNumber: String,
        station: String,
        officerName: String,
        reportDate: Date,
      },
    },

    // Supporting documents
    documents: [
      {
        type: {
          type: String,
          enum: ["photos", "receipts", "reports", "estimates", "statements"],
          required: true,
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedDate: { type: Date, required: true },
        description: String,
      },
    ],

    // Assessment details
    assessment: {
      assessorName: String,
      assessorContact: String,
      assessmentDate: Date,
      assessmentReport: String,
      recommendedAmount: Number,
      assessorNotes: String,
    },

    // Timeline
    timeline: [
      {
        date: { type: Date, required: true },
        action: { type: String, required: true },
        description: { type: String, required: true },
        performedBy: { type: String, required: true },
        documents: [String],
      },
    ],

    // Communication
    communications: [
      {
        date: { type: Date, required: true },
        type: {
          type: String,
          enum: ["email", "phone", "letter", "meeting"],
          required: true,
        },
        direction: {
          type: String,
          enum: ["inbound", "outbound"],
          required: true,
        },
        subject: { type: String, required: true },
        content: { type: String, required: true },
        attachments: [String],
      },
    ],

    // Settlement details
    settlement: {
      settlementDate: Date,
      paymentMethod: String,
      paymentReference: String,
      paymentDate: Date,
      finalAmount: Number,
    },

    // Metadata
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
InsurancePolicySchema.index({ property: 1, status: 1 });
InsurancePolicySchema.index({ landlord: 1, status: 1 });
InsurancePolicySchema.index({ "terms.endDate": 1, status: 1 });
InsurancePolicySchema.index({ "premium.nextPaymentDate": 1, status: 1 });

InsuranceClaimSchema.index({ policy: 1, status: 1 });
InsuranceClaimSchema.index({ property: 1, status: 1 });
InsuranceClaimSchema.index({ landlord: 1, status: 1 });
InsuranceClaimSchema.index({ incidentDate: -1 });

export const InsurancePolicy = mongoose.model<IInsurancePolicy>(
  "InsurancePolicy",
  InsurancePolicySchema
);
export const InsuranceClaim = mongoose.model<IInsuranceClaim>(
  "InsuranceClaim",
  InsuranceClaimSchema
);
