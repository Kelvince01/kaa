import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";

export enum ComplianceType {
  PROPERTY_REGISTRATION = "property_registration",
  RENTAL_LICENSE = "rental_license",
  FIRE_SAFETY = "fire_safety",
  BUILDING_PERMIT = "building_permit",
  ENVIRONMENTAL = "environmental",
  HEALTH_PERMIT = "health_permit",
  BUSINESS_LICENSE = "business_license",
  TAX_COMPLIANCE = "tax_compliance",
  INSURANCE_COMPLIANCE = "insurance_compliance",
  TENANT_RIGHTS = "tenant_rights",
}

export enum ComplianceStatus {
  COMPLIANT = "compliant",
  NON_COMPLIANT = "non_compliant",
  PENDING = "pending",
  EXPIRED = "expired",
  UNDER_REVIEW = "under_review",
}

export enum DocumentType {
  CERTIFICATE = "certificate",
  LICENSE = "license",
  PERMIT = "permit",
  REPORT = "report",
  DECLARATION = "declaration",
  INSPECTION_REPORT = "inspection_report",
}

export interface IComplianceRecord extends BaseDocument {
  property: mongoose.Types.ObjectId;
  landlord: mongoose.Types.ObjectId;

  // Compliance details
  complianceType: ComplianceType;
  status: ComplianceStatus;
  title: string;
  description: string;

  // Regulatory information
  regulatoryBody: string;
  regulation: string;
  requirementLevel: "mandatory" | "recommended" | "optional";

  // Dates and validity
  issueDate?: Date;
  expiryDate?: Date;
  renewalDate?: Date;
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;

  // Documents
  documents: Array<{
    type: DocumentType;
    name: string;
    url: string;
    documentNumber?: string;
    issueDate: Date;
    expiryDate?: Date;
    issuingAuthority: string;
    verified: boolean;
  }>;

  // Compliance requirements
  requirements: Array<{
    requirement: string;
    status: "met" | "not_met" | "pending";
    evidence?: string;
    notes?: string;
  }>;

  // Violations and penalties
  violations: Array<{
    violationType: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    dateIdentified: Date;
    penalty?: {
      type: "fine" | "suspension" | "revocation";
      amount?: number;
      description: string;
      dueDate?: Date;
      paid?: boolean;
    };
    remedialAction: string;
    resolved: boolean;
    resolvedDate?: Date;
  }>;

  // Inspections
  inspections: Array<{
    inspectionDate: Date;
    inspector: string;
    inspectorContact: string;
    findings: string;
    recommendations: string[];
    passed: boolean;
    reportUrl?: string;
    nextInspectionDate?: Date;
  }>;

  // Notifications and reminders
  notifications: {
    renewalReminder: boolean;
    expiryAlert: boolean;
    inspectionReminder: boolean;
    violationAlert: boolean;
    reminderDays: number;
  };

  // Costs
  costs: {
    applicationFee?: number;
    renewalFee?: number;
    inspectionFee?: number;
    penaltyAmount?: number;
    totalCost: number;
    currency: string;
  };

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
}

export enum LegalTemplateType {
  LEASE_AGREEMENT = "lease_agreement",
  NOTICE = "notice",
  CONTRACT = "contract",
  FORM = "form",
  LETTER = "letter",
}

export interface ILegalTemplate extends BaseDocument {
  name: string;
  type: LegalTemplateType;
  category: string;
  jurisdiction: string;

  // Template content
  content: string;
  variables: Array<{
    name: string;
    type: "text" | "number" | "date" | "boolean" | "select";
    required: boolean;
    description: string;
    options?: string[]; // for select type
    defaultValue?: any;
  }>;

  // Legal information
  legalBasis: string;
  applicableLaws: string[];
  lastReviewed: Date;
  reviewedBy: string;
  version: string;

  // Usage tracking
  usageCount: number;
  isActive: boolean;

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface IRegulatoryReport extends BaseDocument {
  landlord: mongoose.Types.ObjectId;
  properties: mongoose.Types.ObjectId[];

  // Report details
  reportType: "monthly" | "quarterly" | "annual" | "custom";
  period: {
    startDate: Date;
    endDate: Date;
  };

  // Compliance summary
  complianceSummary: {
    totalProperties: number;
    compliantProperties: number;
    nonCompliantProperties: number;
    pendingProperties: number;
    complianceRate: number;
  };

  // Violations summary
  violationsSummary: {
    totalViolations: number;
    resolvedViolations: number;
    pendingViolations: number;
    criticalViolations: number;
    totalPenalties: number;
  };

  // Detailed data
  propertyCompliance: Array<{
    property: mongoose.Types.ObjectId;
    complianceRecords: mongoose.Types.ObjectId[];
    overallStatus: ComplianceStatus;
    riskLevel: "low" | "medium" | "high";
    actionItems: string[];
  }>;

  // Recommendations
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    description: string;
    estimatedCost?: number;
    timeline: string;
  }>;

  // Generated report
  reportUrl?: string;
  generatedDate: Date;
  submittedDate?: Date;
  submittedTo?: string;

  // Metadata
  generatedBy: mongoose.Types.ObjectId;
  notes?: string;
  metadata?: Record<string, any>;
}
