/**
 * Contract model for digital rental agreements
 */

import mongoose, { type Model, Schema } from "mongoose";
import {
  ContractStatus,
  ContractType,
  type IContract,
} from "./types/contract.type";

const documentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const signatureSchema = new Schema(
  {
    signedBy: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    signedAt: { type: Date, required: true },
    signatureType: {
      type: String,
      enum: ["digital", "electronic", "wet"],
      required: true,
    },
    signatureData: { type: String }, // Base64 encoded signature data
    ipAddress: { type: String },
    userAgent: { type: String },
    witnessName: { type: String },
    witnessSignature: { type: String },
  },
  { _id: false }
);

const ContractSchema = new Schema<IContract>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: { type: Schema.Types.ObjectId, ref: "Unit", required: true },
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // details
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    serviceCharge: {
      type: Number,
    },
    rentDueDate: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    lateFee: { type: Number, min: 0 },

    // bills
    waterBill: {
      type: String,
      required: true,
      enum: ["Included", "Tenant pays", "Shared"],
      default: "Tenant pays",
    },
    electricityBill: {
      type: String,
      required: true,
      enum: ["Included", "Tenant pays", "Shared"],
      default: "Tenant pays",
    },
    gasBill: {
      type: String,
      enum: ["Included", "Tenant pays", "Shared"],
      default: "Tenant pays",
    },
    internetBill: {
      type: String,
      enum: ["Included", "Tenant pays", "Shared"],
      default: "Tenant pays",
    },

    // rules
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    sublettingAllowed: { type: Boolean, default: false },
    maxOccupants: Number,

    // metadata
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.DRAFT,
    },
    contractType: {
      type: String,
      enum: Object.values(ContractType),
      default: ContractType.ASSURED_SHORTHAND_TENANCY,
    },
    contractTemplate: {
      type: String,
      required: true,
    },
    contractData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    contractDocument: String,

    signatures: [signatureSchema],
    landlordSignature: signatureSchema,
    tenantSignatures: {
      type: Map,
      of: signatureSchema,
    },
    witnessSignature: signatureSchema,

    // Payment information
    paymentSchedule: {
      frequency: {
        type: String,
        enum: ["monthly", "weekly", "fortnightly", "quarterly"],
        default: "monthly",
      },
      amount: Number,
      dueDate: {
        type: Number,
        min: 1,
        max: 31,
        default: 1,
      },
      firstPaymentDate: Date,
      paymentMethod: {
        type: String,
        enum: [
          "bank_transfer",
          "standing_order",
          "direct_debit",
          "cash",
          "other",
        ],
        default: "bank_transfer",
      },
      accountDetails: {
        accountName: { type: String },
        accountNumber: { type: String },
        sortCode: { type: String },
        bankName: { type: String },
      },
    },
    nextRentDueDate: Date,
    gracePeriodDays: { type: Number, min: 0 },
    paymentTerms: { type: String, default: "Rent due monthly" },
    sendReminders: {
      type: Boolean,
      default: true,
    },

    // documents
    documents: [documentSchema],

    // renewal options
    renewalOptions: {
      allowAutoRenewal: {
        type: Boolean,
        default: false,
      },
      renewalNoticePeriod: {
        type: Number,
        default: 30,
      },
      renewalTerms: String,
      rentIncreasePercentage: Number,
      renewalFee: Number,
    },

    depositProtectionScheme: {
      type: String,
      enum: [
        "deposit_protection_service",
        "my_deposits",
        "tenancy_deposit_scheme",
        "none",
      ],
      default: "none",
    },
    depositProtection: {
      scheme: String,
      certificateNumber: String,
      protectedAmount: Number,
      protectedDate: Date,
      schemeContactDetails: {
        name: String,
        phone: String,
        email: String,
        address: String,
      },
    },

    // Termination information
    terminationInfo: {
      terminationDate: Date,
      terminationReason: String,
      terminationNotice: String,
      refundableDeposit: Number,
      deductions: [
        {
          description: String,
          amount: Number,
          category: String,
        },
      ],
      finalInspectionDate: Date,
      finalInspectionNotes: String,
      terminatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },

    // Contract relationships
    renewedFrom: { type: Schema.Types.ObjectId, ref: "Contract" },
    renewedTo: { type: Schema.Types.ObjectId, ref: "Contract" },
    parentContract: { type: Schema.Types.ObjectId, ref: "Contract" },
    childContracts: [{ type: Schema.Types.ObjectId, ref: "Contract" }],

    // Audit trail
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "draft",
            "pending",
            "active",
            "signed",
            "terminated",
            "expired",
            "cancelled",
            "archived",
          ],
          required: true,
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reason: String,
      },
    ],

    // Additional fields
    notes: String,
    reason: String,
    tags: {
      type: [String],
      default: [],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Timestamps
    signedAt: Date,
    activatedAt: Date,
    deletedAt: Date,
    terminatedAt: Date,
  },
  { timestamps: true }
);

// Create indexes for better query performance
ContractSchema.index({ property: 1, unit: 1, tenant: 1 });
ContractSchema.index({ landlord: 1 });
ContractSchema.index({ tenants: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ startDate: 1, endDate: 1 });

// Virtual for lease duration in months
ContractSchema.virtual("durationMonths").get(function (this: IContract) {
  const months =
    (this.endDate.getFullYear() - this.startDate.getFullYear()) * 12 +
    (this.endDate.getMonth() - this.startDate.getMonth());
  return months <= 0 ? 1 : months; // Minimum 1 month
});

// Middleware to validate dates before saving
ContractSchema.pre<IContract>("save", function (next) {
  if (this.startDate >= this.endDate) {
    throw new Error("End date must be after start date");
  }
  next();
});

export const Contract: Model<IContract> = mongoose.model<IContract>(
  "Contract",
  ContractSchema
);
