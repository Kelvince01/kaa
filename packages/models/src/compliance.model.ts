import mongoose, { Schema } from "mongoose";
import {
  ComplianceStatus,
  ComplianceType,
  DocumentType,
  type IComplianceRecord,
  type ILegalTemplate,
  type IRegulatoryReport,
} from "./types/compliance.type";

const complianceRecordSchema = new Schema<IComplianceRecord>(
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

    // Compliance details
    complianceType: {
      type: String,
      enum: Object.values(ComplianceType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplianceStatus),
      default: ComplianceStatus.PENDING,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },

    // Regulatory information
    regulatoryBody: {
      type: String,
      required: true,
    },
    regulation: {
      type: String,
      required: true,
    },
    requirementLevel: {
      type: String,
      enum: ["mandatory", "recommended", "optional"],
      default: "mandatory",
    },

    // Dates and validity
    issueDate: Date,
    expiryDate: Date,
    renewalDate: Date,
    lastInspectionDate: Date,
    nextInspectionDate: Date,

    // Documents
    documents: [
      {
        type: {
          type: String,
          enum: Object.values(DocumentType),
          required: true,
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        documentNumber: String,
        issueDate: { type: Date, required: true },
        expiryDate: Date,
        issuingAuthority: { type: String, required: true },
        verified: { type: Boolean, default: false },
      },
    ],

    // Compliance requirements
    requirements: [
      {
        requirement: { type: String, required: true },
        status: {
          type: String,
          enum: ["met", "not_met", "pending"],
          default: "pending",
        },
        evidence: String,
        notes: String,
      },
    ],

    // Violations and penalties
    violations: [
      {
        violationType: { type: String, required: true },
        description: { type: String, required: true },
        severity: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          required: true,
        },
        dateIdentified: { type: Date, required: true },
        penalty: {
          type: {
            type: String,
            enum: ["fine", "suspension", "revocation"],
          },
          amount: Number,
          description: String,
          dueDate: Date,
          paid: { type: Boolean, default: false },
        },
        remedialAction: { type: String, required: true },
        resolved: { type: Boolean, default: false },
        resolvedDate: Date,
      },
    ],

    // Inspections
    inspections: [
      {
        inspectionDate: { type: Date, required: true },
        inspector: { type: String, required: true },
        inspectorContact: { type: String, required: true },
        findings: { type: String, required: true },
        recommendations: [String],
        passed: { type: Boolean, required: true },
        reportUrl: String,
        nextInspectionDate: Date,
      },
    ],

    // Notifications and reminders
    notifications: {
      renewalReminder: { type: Boolean, default: true },
      expiryAlert: { type: Boolean, default: true },
      inspectionReminder: { type: Boolean, default: true },
      violationAlert: { type: Boolean, default: true },
      reminderDays: { type: Number, default: 30 },
    },

    // Costs
    costs: {
      applicationFee: Number,
      renewalFee: Number,
      inspectionFee: Number,
      penaltyAmount: Number,
      totalCost: { type: Number, default: 0 },
      currency: { type: String, default: "KES" },
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

const legalTemplateSchema = new Schema<ILegalTemplate>(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["lease_agreement", "notice", "contract", "form", "letter"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    jurisdiction: {
      type: String,
      required: true,
    },

    // Template content
    content: {
      type: String,
      required: true,
    },
    variables: [
      {
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "number", "date", "boolean", "select"],
          required: true,
        },
        required: { type: Boolean, default: false },
        description: { type: String, required: true },
        options: [String],
        defaultValue: Schema.Types.Mixed,
      },
    ],

    // Legal information
    legalBasis: {
      type: String,
      required: true,
    },
    applicableLaws: [String],
    lastReviewed: {
      type: Date,
      required: true,
    },
    reviewedBy: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },

    // Usage tracking
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

const regulatoryReportSchema = new Schema<IRegulatoryReport>(
  {
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    properties: [
      {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
    ],

    // Report details
    reportType: {
      type: String,
      enum: ["monthly", "quarterly", "annual", "custom"],
      required: true,
    },
    period: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },

    // Compliance summary
    complianceSummary: {
      totalProperties: { type: Number, required: true },
      compliantProperties: { type: Number, required: true },
      nonCompliantProperties: { type: Number, required: true },
      pendingProperties: { type: Number, required: true },
      complianceRate: { type: Number, required: true },
    },

    // Violations summary
    violationsSummary: {
      totalViolations: { type: Number, required: true },
      resolvedViolations: { type: Number, required: true },
      pendingViolations: { type: Number, required: true },
      criticalViolations: { type: Number, required: true },
      totalPenalties: { type: Number, required: true },
    },

    // Detailed data
    propertyCompliance: [
      {
        property: { type: Schema.Types.ObjectId, ref: "Property" },
        complianceRecords: [
          { type: Schema.Types.ObjectId, ref: "ComplianceRecord" },
        ],
        overallStatus: {
          type: String,
          enum: Object.values(ComplianceStatus),
        },
        riskLevel: {
          type: String,
          enum: ["low", "medium", "high"],
        },
        actionItems: [String],
      },
    ],

    // Recommendations
    recommendations: [
      {
        priority: {
          type: String,
          enum: ["high", "medium", "low"],
          required: true,
        },
        category: { type: String, required: true },
        description: { type: String, required: true },
        estimatedCost: Number,
        timeline: { type: String, required: true },
      },
    ],

    // Generated report
    reportUrl: String,
    generatedDate: {
      type: Date,
      required: true,
    },
    submittedDate: Date,
    submittedTo: String,

    // Metadata
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
complianceRecordSchema.index({ property: 1, complianceType: 1 });
complianceRecordSchema.index({ landlord: 1, status: 1 });
complianceRecordSchema.index({ expiryDate: 1, status: 1 });
complianceRecordSchema.index({ nextInspectionDate: 1 });

legalTemplateSchema.index({ type: 1, category: 1 });
legalTemplateSchema.index({ jurisdiction: 1, isActive: 1 });

regulatoryReportSchema.index({ landlord: 1, reportType: 1 });
regulatoryReportSchema.index({ "period.startDate": -1 });

export const ComplianceRecord = mongoose.model<IComplianceRecord>(
  "ComplianceRecord",
  complianceRecordSchema
);
export const LegalTemplate = mongoose.model<ILegalTemplate>(
  "LegalTemplate",
  legalTemplateSchema
);
export const RegulatoryReport = mongoose.model<IRegulatoryReport>(
  "RegulatoryReport",
  regulatoryReportSchema
);
