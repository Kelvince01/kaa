import { type Model, model, Schema, type Types } from "mongoose";
import { addressSchema } from "./base.model";
import {
  ComplianceType,
  type ILandlord,
  KYCLevel,
  LandlordDocumentType,
  LandlordStatus,
  LandlordType,
  RiskLevel,
  VerificationStatus,
} from "./types/landlord.type";

// Define the landlord schema
const landlordSchema: Schema<ILandlord> = new Schema<ILandlord>(
  {
    // Basic Information
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
    },
    landlordType: {
      type: String,
      enum: Object.values(LandlordType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LandlordStatus),
      default: LandlordStatus.PENDING_VERIFICATION,
    },

    // Personal/Individual Information
    personalInfo: {
      firstName: {
        type: String,
        required() {
          return this.landlordType === LandlordType.INDIVIDUAL;
        },
      },
      middleName: String,
      lastName: {
        type: String,
        required() {
          return this.landlordType === LandlordType.INDIVIDUAL;
        },
      },
      email: { type: String, required: true, unique: true },
      phone: { type: String, required: true },
      alternatePhone: String,
      dateOfBirth: {
        type: Date,
        required() {
          return this.landlordType === LandlordType.INDIVIDUAL;
        },
      },
      nationality: {
        type: String,
        required() {
          return this.landlordType === LandlordType.INDIVIDUAL;
        },
      },
      nationalId: {
        type: String,
        required() {
          return this.landlordType === LandlordType.INDIVIDUAL;
        },
        sparse: true,
      },
      passportNumber: String,
      gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say"],
      },
      occupation: String,
      preferredLanguage: { type: String, default: "en" },
    },

    // Business/Company Information
    businessInfo: {
      companyName: {
        type: String,
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
      },
      registrationNumber: {
        type: String,
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
        sparse: true,
      },
      taxId: {
        type: String,
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
        sparse: true,
      },
      vatNumber: String,
      industry: {
        type: String,
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
      },
      companyType: {
        type: String,
        enum: [
          "sole_proprietorship",
          "partnership",
          "llc",
          "corporation",
          "trust",
          "other",
        ],
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
      },
      establishedDate: {
        type: Date,
        required() {
          return this.landlordType !== LandlordType.INDIVIDUAL;
        },
      },
      website: String,
      description: String,

      // Key Personnel
      directors: [
        {
          name: { type: String, required: true },
          position: { type: String, required: true },
          nationalId: { type: String, required: true },
          sharePercentage: { type: Number, min: 0, max: 100 },
          isPrimary: { type: Boolean, default: false },
        },
      ],

      // Authorized Signatories
      authorizedPersons: [
        {
          name: { type: String, required: true },
          position: { type: String, required: true },
          email: { type: String, required: true },
          phone: { type: String, required: true },
          nationalId: { type: String, required: true },
          canSignContracts: { type: Boolean, default: false },
          canManageFinances: { type: Boolean, default: false },
        },
      ],
    },

    // Contact Information
    contactInfo: {
      primaryAddress: { type: addressSchema, required: true },
      mailingAddress: addressSchema,
      businessAddress: addressSchema,
      emergencyContact: {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
      },
    },

    // Verification and KYC
    verification: {
      status: {
        type: String,
        enum: Object.values(VerificationStatus),
        default: VerificationStatus.PENDING,
      },
      level: {
        type: String,
        enum: Object.values(KYCLevel),
        default: KYCLevel.BASIC,
      },
      startedDate: { type: Date, default: Date.now },
      completedDate: Date,
      expiryDate: Date,
      nextReviewDate: Date,

      // Identity Verification
      identityVerification: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        method: {
          type: String,
          enum: ["manual", "automated", "video_call", "in_person"],
          default: "manual",
        },
        verifiedDate: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        identityScore: { type: Number, min: 0, max: 100, default: 0 },
        notes: String,
      },

      // Address Verification
      addressVerification: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        method: {
          type: String,
          enum: ["document", "utility_bill", "bank_statement", "site_visit"],
          default: "document",
        },
        verifiedDate: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },

      // Financial Verification
      financialVerification: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        creditScore: { type: Number, min: 0, max: 850 },
        bankVerified: { type: Boolean, default: false },
        incomeVerified: { type: Boolean, default: false },
        assetValue: Number,
        liabilityValue: Number,
        netWorth: Number,
        verifiedDate: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },

      // Business Verification (for business entities)
      businessVerification: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        registrationVerified: { type: Boolean, default: false },
        taxStatusVerified: { type: Boolean, default: false },
        directorsVerified: { type: Boolean, default: false },
        financialStatementsVerified: { type: Boolean, default: false },
        verifiedDate: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: String,
      },

      // Reference Checks
      referenceChecks: [
        {
          type: {
            type: String,
            enum: ["professional", "personal", "business", "banking"],
            required: true,
          },
          name: { type: String, required: true },
          contact: { type: String, required: true },
          relationship: { type: String, required: true },
          verified: { type: Boolean, default: false },
          feedback: String,
          rating: { type: Number, min: 1, max: 5 },
          verifiedDate: Date,
        },
      ],
    },

    // Documents
    documents: [
      {
        type: {
          type: String,
          enum: Object.values(LandlordDocumentType),
          required: true,
        },
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        uploadedDate: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        isVerified: { type: Boolean, default: false },
        verifiedDate: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        expiryDate: Date,
        isExpired: {
          type: Boolean,
          default() {
            return (
              (this.documents as any).expiryDate &&
              (this.documents as any).expiryDate < new Date()
            );
          },
        },
        notes: String,
        metadata: { type: Map, of: Schema.Types.Mixed },
      },
    ],

    // Compliance and Licensing
    compliance: {
      businessLicense: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        licenseNumber: String,
        issueDate: Date,
        expiryDate: Date,
        issuingAuthority: String,
      },

      taxCompliance: {
        status: {
          type: String,
          enum: Object.values(VerificationStatus),
          default: VerificationStatus.PENDING,
        },
        taxNumber: { type: String, required: true },
        lastFilingDate: Date,
        nextFilingDate: Date,
        clearanceCertificate: String,
      },

      propertyLicenses: [
        {
          property: {
            type: Schema.Types.ObjectId,
            ref: "Property",
            required: true,
          },
          licenseType: { type: String, required: true },
          licenseNumber: { type: String, required: true },
          issueDate: { type: Date, required: true },
          expiryDate: { type: Date, required: true },
          issuingAuthority: { type: String, required: true },
          status: {
            type: String,
            enum: ["active", "expired", "suspended", "revoked"],
            default: "active",
          },
        },
      ],

      complianceChecks: [
        {
          type: {
            type: String,
            enum: Object.values(ComplianceType),
            required: true,
          },
          status: {
            type: String,
            enum: Object.values(VerificationStatus),
            required: true,
          },
          checkDate: { type: Date, required: true },
          expiryDate: Date,
          certificate: String,
          notes: String,
        },
      ],
    },

    // Financial Information
    financialInfo: {
      bankingDetails: {
        primaryBank: { type: String, required: true },
        accountNumber: { type: String, required: true },
        accountName: { type: String, required: true },
        routingNumber: String,
        swiftCode: String,
        isVerified: { type: Boolean, default: false },
      },

      creditInformation: {
        creditScore: { type: Number, min: 0, max: 850 },
        creditRating: {
          type: String,
          enum: ["excellent", "good", "fair", "poor"],
        },
        creditHistory: {
          totalAccounts: { type: Number, default: 0 },
          activeAccounts: { type: Number, default: 0 },
          defaultedAccounts: { type: Number, default: 0 },
          paymentHistory: {
            type: String,
            enum: ["excellent", "good", "fair", "poor"],
            default: "fair",
          },
        },
      },

      insurance: {
        hasPropertyInsurance: { type: Boolean, default: false },
        hasLiabilityInsurance: { type: Boolean, default: false },
        insuranceProvider: String,
        policyNumbers: [String],
        coverageAmount: Number,
        expiryDate: Date,
      },

      financialCapacity: {
        monthlyIncome: Number,
        totalAssets: Number,
        totalLiabilities: Number,
        netWorth: Number,
        liquidAssets: Number,
        propertyValue: Number,
        mortgageDebt: Number,
      },
    },

    // Risk Assessment
    riskAssessment: {
      overallRiskScore: { type: Number, min: 0, max: 100, default: 50 },
      riskLevel: {
        type: String,
        enum: Object.values(RiskLevel),
        default: RiskLevel.MEDIUM,
      },
      riskFactors: [
        {
          factor: { type: String, required: true },
          severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            required: true,
          },
          description: { type: String, required: true },
          detectedDate: { type: Date, default: Date.now },
        },
      ],
      mitigatingFactors: [
        {
          factor: { type: String, required: true },
          impact: { type: String, required: true },
          description: { type: String, required: true },
        },
      ],
      lastAssessmentDate: { type: Date, default: Date.now },
      nextAssessmentDate: { type: Date, required: true },
    },

    // Performance Metrics
    performanceMetrics: {
      propertyManagementRating: { type: Number, min: 1, max: 5, default: 3 },
      tenantSatisfactionRating: { type: Number, min: 1, max: 5, default: 3 },
      maintenanceResponseTime: { type: Number, default: 24 }, // hours
      occupancyRate: { type: Number, min: 0, max: 100, default: 0 },
      rentCollectionRate: { type: Number, min: 0, max: 100, default: 0 },
      complaintResolutionTime: { type: Number, default: 48 }, // hours

      // Violation history
      violations: [
        {
          type: { type: String, required: true },
          description: { type: String, required: true },
          severity: {
            type: String,
            enum: ["minor", "major", "critical"],
            required: true,
          },
          date: { type: Date, required: true },
          resolved: { type: Boolean, default: false },
          resolutionDate: Date,
          fine: Number,
        },
      ],

      // Performance trends
      trends: {
        rentCollection: [
          {
            period: String,
            rate: { type: Number, min: 0, max: 100 },
          },
        ],
        occupancy: [
          {
            period: String,
            rate: { type: Number, min: 0, max: 100 },
          },
        ],
        maintenance: [
          {
            period: String,
            averageResponseTime: Number,
          },
        ],
      },
    },

    // Communication Preferences
    communicationPreferences: {
      preferredMethod: {
        type: String,
        enum: ["email", "sms", "whatsapp", "phone", "in_app"],
        default: "email",
      },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      receiveMarketingEmails: { type: Boolean, default: true },
      receivePropertyAlerts: { type: Boolean, default: true },
      receiveMaintenanceUpdates: { type: Boolean, default: true },
      receiveRegulatoryUpdates: { type: Boolean, default: true },
      receivePerformanceReports: { type: Boolean, default: true },
    },

    // Properties Management
    properties: [{ type: Schema.Types.ObjectId, ref: "Property" }],
    propertyStats: {
      totalProperties: { type: Number, default: 0 },
      activeProperties: { type: Number, default: 0 },
      totalUnits: { type: Number, default: 0 },
      occupiedUnits: { type: Number, default: 0 },
      totalValue: { type: Number, default: 0 },
      monthlyRevenue: { type: Number, default: 0 },
    },

    // Subscription and Billing
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "standard", "premium", "enterprise"],
        default: "basic",
      },
      status: {
        type: String,
        enum: ["active", "inactive", "cancelled", "suspended"],
        default: "active",
      },
      startDate: { type: Date, default: Date.now },
      endDate: Date,
      billingCycle: {
        type: String,
        enum: ["monthly", "quarterly", "yearly"],
        default: "monthly",
      },
      paymentMethod: {
        type: String,
        enum: ["card", "bank_transfer", "mobile_money"],
        default: "card",
      },
      stripeCustomerId: String,
      autoRenewal: { type: Boolean, default: true },
    },

    // Metadata and Tracking
    metadata: {
      source: {
        type: String,
        enum: ["website", "referral", "agent", "marketing", "api", "import"],
        default: "website",
      },
      referredBy: { type: Schema.Types.ObjectId, ref: "User" },
      campaignId: String,
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,

      // Tracking
      lastLoginDate: Date,
      lastActivityDate: Date,
      loginCount: { type: Number, default: 0 },
      profileCompleteness: { type: Number, min: 0, max: 100, default: 0 },

      // Flags and Tags
      tags: [{ type: String, lowercase: true, trim: true }],
      flags: [
        {
          type: {
            type: String,
            enum: ["warning", "attention", "priority", "restricted"],
            required: true,
          },
          reason: { type: String, required: true },
          setDate: { type: Date, default: Date.now },
          setBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
          expiryDate: Date,
        },
      ],

      // Notes
      notes: { type: String, default: "" },
      internalNotes: { type: String, default: "" }, // Only visible to admin/staff
    },

    // Audit and Compliance
    auditTrail: [
      {
        action: { type: String, required: true },
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        performedAt: { type: Date, default: Date.now },
        details: { type: Map, of: Schema.Types.Mixed },
        ipAddress: String,
        userAgent: String,
      },
    ],

    // System fields
    isActive: { type: Boolean, default: true },
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Comprehensive indexes for optimal performance
landlordSchema.index({ memberId: 1 });
landlordSchema.index({ user: 1 });
landlordSchema.index({ status: 1 });
landlordSchema.index({ landlordType: 1 });
landlordSchema.index({ "verification.status": 1 });
landlordSchema.index({ "riskAssessment.riskLevel": 1 });
landlordSchema.index({ "personalInfo.phone": 1 });
landlordSchema.index({ isActive: 1 });
landlordSchema.index({ "metadata.tags": 1 });
landlordSchema.index({ "contactInfo.primaryAddress.city": 1 });
landlordSchema.index({ "contactInfo.primaryAddress.state": 1 });
landlordSchema.index({ "contactInfo.primaryAddress.country": 1 });
landlordSchema.index({ "performanceMetrics.occupancyRate": 1 });
landlordSchema.index({ "performanceMetrics.rentCollectionRate": 1 });
landlordSchema.index({ "subscription.status": 1 });
landlordSchema.index({ "verification.expiryDate": 1 });
landlordSchema.index({ "compliance.businessLicense.expiryDate": 1 });

// Text search index
landlordSchema.index({
  "personalInfo.firstName": "text",
  "personalInfo.lastName": "text",
  "personalInfo.email": "text",
  "businessInfo.companyName": "text",
  "metadata.notes": "text",
});

// Compound indexes for common queries
landlordSchema.index({ status: 1, landlordType: 1 });
landlordSchema.index({ "verification.status": 1, "verification.level": 1 });
landlordSchema.index({ isActive: 1, status: 1 });

// Virtual for full name (individual landlords)
landlordSchema.virtual("fullName").get(function () {
  if (this.landlordType === LandlordType.INDIVIDUAL && this.personalInfo) {
    const { firstName, middleName, lastName } = this.personalInfo;
    return middleName
      ? `${firstName} ${middleName} ${lastName}`
      : `${firstName} ${lastName}`;
  }
  return this.businessInfo?.companyName || "";
});

// Virtual for display name
landlordSchema.virtual("displayName").get(function () {
  return this.landlordType === LandlordType.INDIVIDUAL
    ? // @ts-expect-error - fullName is a virtual property
      this.fullName
    : this.businessInfo?.companyName || "";
});

// Virtual for verification progress
landlordSchema.virtual("verificationProgress").get(function () {
  const checks = [
    this.verification.identityVerification.status ===
      VerificationStatus.COMPLETED,
    this.verification.addressVerification.status ===
      VerificationStatus.COMPLETED,
    this.verification.financialVerification.status ===
      VerificationStatus.COMPLETED,
  ];

  // Add business verification for non-individual landlords
  if (
    this.landlordType !== LandlordType.INDIVIDUAL &&
    this.verification.businessVerification
  ) {
    checks.push(
      this.verification.businessVerification.status ===
        VerificationStatus.COMPLETED
    );
  }

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
});

// Virtual for active violations count
landlordSchema.virtual("activeViolationsCount").get(function () {
  return this.performanceMetrics.violations.filter((v) => !v.resolved).length;
});

// Virtual for expiring documents count
landlordSchema.virtual("expiringDocumentsCount").get(function () {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return this.documents.filter(
    (doc) =>
      doc.expiryDate && doc.expiryDate <= thirtyDaysFromNow && !doc.isExpired
  ).length;
});

// Pre-save middleware
landlordSchema.pre<ILandlord>("save", function (next) {
  const now = new Date();

  // Update document expiry status
  for (const doc of this.documents) {
    doc.isExpired = (doc.expiryDate && doc.expiryDate < now) as boolean;
  }

  // Calculate profile completeness
  let completeness = 0;
  const requiredFields = [
    this.personalInfo?.email,
    this.personalInfo?.phone,
    this.contactInfo?.primaryAddress,
    this.financialInfo?.bankingDetails?.primaryBank,
  ];

  if (this.landlordType === LandlordType.INDIVIDUAL) {
    requiredFields.push(
      this.personalInfo?.firstName,
      this.personalInfo?.lastName,
      this.personalInfo?.nationalId
    );
  } else {
    requiredFields.push(
      this.businessInfo?.companyName,
      this.businessInfo?.registrationNumber,
      this.businessInfo?.taxId
    );
  }

  const documents = this.documents.filter((doc) => doc.isVerified).length > 0;
  requiredFields.push(documents as any);

  completeness =
    (requiredFields.filter(Boolean).length / requiredFields.length) * 100;
  this.metadata.profileCompleteness = Math.round(completeness);

  // Auto-update verification status based on progress
  // @ts-expect-error - verificationProgress is a virtual property
  if (this.verificationProgress === 100) {
    this.verification.status = VerificationStatus.COMPLETED;
    if (!this.verification.completedDate) {
      this.verification.completedDate = now;
    }
    // @ts-expect-error - verificationProgress is a virtual property
  } else if (this.verificationProgress > 0) {
    this.verification.status = VerificationStatus.IN_PROGRESS;
  }

  // Update risk assessment if needed
  if (
    !this.riskAssessment.nextAssessmentDate ||
    this.riskAssessment.nextAssessmentDate < now
  ) {
    // Schedule next assessment in 6 months
    const nextAssessment = new Date(now);
    nextAssessment.setMonth(nextAssessment.getMonth() + 6);
    this.riskAssessment.nextAssessmentDate = nextAssessment;
  }

  // Ensure only one primary director for businesses
  if (this.businessInfo?.directors && this.businessInfo.directors.length > 0) {
    let hasPrimary = false;
    for (const director of this.businessInfo.directors) {
      if (director.isPrimary && hasPrimary) {
        director.isPrimary = false;
      } else if (director.isPrimary) {
        hasPrimary = true;
      }
    }

    // If no primary director, make the first one primary
    if (!hasPrimary && this.businessInfo.directors.length > 0) {
      (this.businessInfo.directors[0] as any).isPrimary = true;
    }
  }

  next();
});

// Static methods
landlordSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ "personalInfo.email": email });
};

landlordSchema.statics.findByRegistrationNumber = function (regNumber: string) {
  return this.findOne({ "businessInfo.registrationNumber": regNumber });
};

landlordSchema.statics.findByTaxId = function (taxId: string) {
  return this.findOne({ "businessInfo.taxId": taxId });
};

landlordSchema.statics.findVerified = function () {
  return this.find({ "verification.status": VerificationStatus.COMPLETED });
};

landlordSchema.statics.findByRiskLevel = function (riskLevel: RiskLevel) {
  return this.find({ "riskAssessment.riskLevel": riskLevel });
};

landlordSchema.statics.findExpiringVerifications = function (daysAhead = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return this.find({
    "verification.expiryDate": { $lte: futureDate, $gte: new Date() },
    isActive: true,
  });
};

landlordSchema.statics.searchLandlords = function (
  searchText: string,
  filters: any = {}
) {
  const searchQuery = {
    $and: [
      {
        $or: [
          { $text: { $search: searchText } },
          { "personalInfo.firstName": { $regex: searchText, $options: "i" } },
          { "personalInfo.lastName": { $regex: searchText, $options: "i" } },
          { "personalInfo.email": { $regex: searchText, $options: "i" } },
          { "businessInfo.companyName": { $regex: searchText, $options: "i" } },
        ],
      },
      filters,
    ],
  };

  return this.find(searchQuery)
    .populate("properties", "title location")
    .sort({ score: { $meta: "textScore" } });
};

// Instance methods
landlordSchema.methods.addAuditEntry = function (
  action: string,
  performedBy: Types.ObjectId,
  details: any = {},
  ipAddress?: string,
  userAgent?: string
) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    ipAddress,
    userAgent,
    performedAt: new Date(),
  });
  return this.save();
};

landlordSchema.methods.addFlag = function (
  type: string,
  reason: string,
  setBy: Types.ObjectId,
  expiryDate?: Date
) {
  this.metadata.flags.push({
    type,
    reason,
    setBy,
    expiryDate,
  });
  return this.save();
};

landlordSchema.methods.removeFlag = function (flagId: string) {
  this.metadata.flags = this.metadata.flags.filter(
    (flag: any) => flag._id.toString() !== flagId
  );
  return this.save();
};

landlordSchema.methods.updatePropertyStats = async function () {
  // This would typically aggregate data from the properties collection
  // For now, we'll update based on the properties array
  const Property = model("Property");
  const properties = await Property.find({ _id: { $in: this.properties } });

  this.propertyStats.totalProperties = properties.length;
  this.propertyStats.activeProperties = properties.filter(
    (p) => p.status === "active"
  ).length;
  // Additional calculations would be done here based on actual property data

  return this.save();
};

// Create the model
export const Landlord: Model<ILandlord> = model<ILandlord>(
  "Landlord",
  landlordSchema
);
