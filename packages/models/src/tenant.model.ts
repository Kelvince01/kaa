import { type Model, model, Schema } from "mongoose";
import { addressSchema } from "./base.model";
import {
  CommunicationPreference,
  CreditRating,
  EmploymentStatus,
  type ITenant,
  type ITenantScreening,
  ScreeningStatus,
  ScreeningType,
  TenantPriority,
  TenantStatus,
  TenantType,
} from "./types/tenant.type";

// Define the schema
const tenantSchema: Schema<ITenant> = new Schema<ITenant>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "Member is required"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "Unit is required"],
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      // required: [true, "Contract is required"],
    },

    // Enhanced tenant classification
    type: {
      type: String,
      enum: Object.values(TenantType),
      required: true,
      default: TenantType.INDIVIDUAL,
    },
    priority: {
      type: String,
      enum: Object.values(TenantPriority),
      default: TenantPriority.MEDIUM,
    },

    personalInfo: {
      firstName: { type: String, required: true },
      middleName: String,
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      avatar: String,
      alternatePhone: String,
      nationalId: { type: String, required: true, unique: true },
      passportNumber: String,
      dateOfBirth: { type: Date, required: true },
      nationality: String,
      occupation: { type: String, required: true },
      employer: String,
      monthlyIncome: { type: Number, required: true },
      maritalStatus: {
        type: String,
        enum: ["single", "married", "divorced", "widowed"],
        required: true,
      },
      dependents: { type: Number, default: 0 },
      preferredLanguage: { type: String, default: "en" },
    },

    // Corporate tenant information
    corporateInfo: {
      companyName: String,
      registrationNumber: String,
      taxId: String,
      industry: String,
      companySize: {
        type: String,
        enum: ["small", "medium", "large", "enterprise"],
      },
      contactPerson: {
        name: String,
        title: String,
        email: String,
        phone: String,
      },
      businessAddress: addressSchema,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      validate: {
        validator(this: ITenant, value: Date) {
          return !value || value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.ACTIVE,
    },
    verificationProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    address: addressSchema,

    // Enhanced emergency contacts
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        alternatePhone: String,
        relationship: { type: String, required: true },
        email: String,
        address: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],

    documents: [
      {
        name: String,
        url: { type: String, required: true },
        type: String,
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date,
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
        expiryDate: Date,
        isExpired: {
          type: Boolean,
          default() {
            return (
              (this as any).expiryDate && (this as any).expiryDate < new Date()
            );
          },
        },
      },
    ],

    tenantScore: {
      creditScore: { type: Number, default: 0, min: 0, max: 850 },
      riskScore: { type: Number, default: 0, min: 0, max: 100 },
      reliabilityScore: { type: Number, default: 0, min: 0, max: 100 },
      paymentHistory: { type: Number, default: 0, min: 0, max: 100 },
      overallScore: { type: Number, default: 0, min: 0, max: 100 },
      lastUpdated: { type: Date, default: Date.now },
      factors: [
        {
          factor: String,
          impact: { type: String, enum: ["positive", "negative", "neutral"] },
          weight: { type: Number, min: 0, max: 1 },
          description: String,
        },
      ],
    },

    backgroundCheck: {
      conducted: { type: Boolean, default: false },
      conductedDate: Date,
      creditCheck: {
        score: Number,
        report: String,
        cleared: { type: Boolean, default: false },
        provider: String,
      },
      criminalCheck: {
        cleared: { type: Boolean, default: false },
        report: String,
        provider: String,
      },
      employmentVerification: {
        verified: { type: Boolean, default: false },
        employerConfirmed: { type: Boolean, default: false },
        incomeVerified: { type: Boolean, default: false },
        provider: String,
      },
      previousLandlordCheck: {
        contacted: { type: Boolean, default: false },
        recommendation: {
          type: String,
          enum: ["excellent", "good", "fair", "poor"],
        },
        notes: String,
      },
      referenceChecks: [
        {
          name: String,
          relationship: String,
          contact: String,
          verified: { type: Boolean, default: false },
          recommendation: String,
          notes: String,
        },
      ],
    },

    // Communication preferences
    communicationPreferences: {
      preferredMethod: {
        type: String,
        enum: Object.values(CommunicationPreference),
        default: CommunicationPreference.EMAIL,
      },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      receiveMarketing: { type: Boolean, default: true },
      receiveReminders: { type: Boolean, default: true },
      receiveMaintenanceUpdates: { type: Boolean, default: true },
    },

    // Payment information
    paymentInfo: {
      preferredMethod: {
        type: String,
        enum: ["bank_transfer", "mobile_money", "credit_card", "cash", "check"],
        default: "bank_transfer",
      },
      bankDetails: {
        bankName: String,
        accountNumber: String,
        accountName: String,
        routingNumber: String,
      },
      mobileMoney: {
        provider: String,
        phoneNumber: String,
      },
      autopayEnabled: { type: Boolean, default: false },
      paymentReminders: { type: Boolean, default: true },
    },

    // Lease history
    leaseHistory: [
      {
        property: { type: Schema.Types.ObjectId, ref: "Property" },
        unit: { type: Schema.Types.ObjectId, ref: "Unit" },
        startDate: Date,
        endDate: Date,
        monthlyRent: Number,
        securityDeposit: Number,
        reasonForLeaving: String,
        landlordRating: { type: Number, min: 1, max: 5 },
        landlordReview: String,
      },
    ],

    // Behavioral metrics
    behaviorMetrics: {
      communicationRating: { type: Number, min: 1, max: 5, default: 3 },
      maintenanceCompliance: { type: Number, min: 1, max: 5, default: 3 },
      respectForProperty: { type: Number, min: 1, max: 5, default: 3 },
      noiseComplaints: { type: Number, default: 0, min: 0 },
      latePayments: { type: Number, default: 0, min: 0 },
      violationsCount: { type: Number, default: 0, min: 0 },
      lastViolationDate: Date,
    },

    stripeCustomerId: String,
    notes: String,
    internalNotes: String,
    tags: [{ type: String, lowercase: true, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
    },

    // Metadata
    source: {
      type: String,
      enum: ["website", "referral", "agent", "walk_in", "social_media"],
    },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastContactDate: Date,
    nextFollowUpDate: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Enhanced indexes for better performance
tenantSchema.index({ user: 1 });
tenantSchema.index({ property: 1 });
tenantSchema.index({ unit: 1 });
tenantSchema.index({ contract: 1 });
tenantSchema.index({ memberId: 1, status: 1 });
tenantSchema.index({ isActive: 1 });
tenantSchema.index({ "tenantScore.overallScore": -1 });
tenantSchema.index({ type: 1, status: 1 });
tenantSchema.index({ priority: 1 });
tenantSchema.index({ tags: 1 });
tenantSchema.index({ "personalInfo.email": 1 });
tenantSchema.index({ "personalInfo.phone": 1 });
tenantSchema.index({ isVerified: 1 });
tenantSchema.index({ "address.city": 1 });
tenantSchema.index({ "address.state": 1 });
tenantSchema.index({ "behaviorMetrics.latePayments": 1 });
tenantSchema.index({ "behaviorMetrics.violationsCount": 1 });
tenantSchema.index({ nextFollowUpDate: 1 });

// Text search index
tenantSchema.index({
  "personalInfo.firstName": "text",
  "personalInfo.lastName": "text",
  "personalInfo.email": "text",
  "personalInfo.phone": "text",
  "corporateInfo.companyName": "text",
  notes: "text",
});

// Virtual for tenant's full name
tenantSchema.virtual("userDetails", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
  options: { select: "firstName lastName email phone" },
});

// Virtual for property details
tenantSchema.virtual("propertyDetails", {
  ref: "Property",
  localField: "property",
  foreignField: "_id",
  justOne: true,
  options: { select: "name address" },
});

// Virtual for unit details
tenantSchema.virtual("unitDetails", {
  ref: "Unit",
  localField: "unit",
  foreignField: "_id",
  justOne: true,
  options: { select: "name rent" },
});

// Virtual for contract details
tenantSchema.virtual("contractDetails", {
  ref: "Contract",
  localField: "contract",
  foreignField: "_id",
  justOne: true,
});

// Virtual for full name
tenantSchema.virtual("fullName").get(function () {
  const { firstName, middleName, lastName } = this.personalInfo;
  return middleName
    ? `${firstName} ${middleName} ${lastName}`
    : `${firstName} ${lastName}`;
});

// Virtual for primary emergency contact
tenantSchema.virtual("primaryEmergencyContact").get(function () {
  return (
    this.emergencyContacts?.find((contact) => contact.isPrimary) ||
    this.emergencyContacts?.[0]
  );
});

// Virtual for risk level based on scores
tenantSchema.virtual("riskLevel").get(function () {
  const score = this.tenantScore.overallScore;
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "very_high";
});

// Pre-save hooks
tenantSchema.pre<ITenant>("save", function (next) {
  const now = new Date();

  // If end date is in the past, mark as inactive
  if (this.endDate && this.endDate < now) {
    this.status = TenantStatus.INACTIVE;
    this.isActive = false;
  }

  // Update verification progress based on completed checks
  let progress = 0;
  const checks = [
    this.backgroundCheck.conducted,
    this.backgroundCheck.creditCheck.cleared,
    this.backgroundCheck.employmentVerification.verified,
    this.personalInfo.email && this.personalInfo.phone,
    this.documents && this.documents.length > 0,
  ];

  progress = (checks.filter(Boolean).length / checks.length) * 100;
  this.verificationProgress = Math.round(progress);

  // Auto-verify if all checks pass
  if (progress === 100) {
    this.isVerified = true;
  }

  // Ensure only one primary emergency contact
  if (this.emergencyContacts && this.emergencyContacts.length > 0) {
    let hasPrimary = false;
    for (const contact of this.emergencyContacts) {
      if (contact.isPrimary && hasPrimary) {
        contact.isPrimary = false;
      } else if (contact.isPrimary) {
        hasPrimary = true;
      }
    }

    // If no primary contact, make the first one primary
    if (!hasPrimary && this.emergencyContacts.length > 0) {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      this.emergencyContacts[0]!.isPrimary = true;
    }
  }

  // Update document expiry status
  if (this.documents) {
    for (const doc of this.documents) {
      doc.isExpired = doc.expiryDate && doc.expiryDate < now;
    }
  }

  next();
});

// Static method to get active tenants count for a property
tenantSchema.statics.getActiveTenantsCount = async function (
  propertyId: string
): Promise<number> {
  return await this.countDocuments({
    property: propertyId,
    status: TenantStatus.ACTIVE,
    isActive: true,
  });
};

// Static method to get tenants by risk level
tenantSchema.statics.getTenantsByRiskLevel = async function (
  riskLevel: string
): Promise<ITenant[]> {
  const scoreRanges = {
    low: { $gte: 80 },
    medium: { $gte: 60, $lt: 80 },
    high: { $gte: 40, $lt: 60 },
    very_high: { $lt: 40 },
  };

  return await this.find({
    "tenantScore.overallScore": scoreRanges[
      riskLevel as keyof typeof scoreRanges
    ] || { $gte: 0 },
    isActive: true,
  });
};

// Static method for advanced search
tenantSchema.statics.searchTenants = async function (
  searchText: string,
  filters: any = {}
): Promise<ITenant[]> {
  const searchQuery = {
    $and: [
      {
        $or: [
          { $text: { $search: searchText } },
          { "personalInfo.firstName": { $regex: searchText, $options: "i" } },
          { "personalInfo.lastName": { $regex: searchText, $options: "i" } },
          { "personalInfo.email": { $regex: searchText, $options: "i" } },
          { "personalInfo.phone": { $regex: searchText, $options: "i" } },
        ],
      },
      filters,
    ],
  };

  return await this.find(searchQuery)
    .populate("property", "title location")
    .populate("unit", "unitNumber")
    .sort({ score: { $meta: "textScore" } });
};

// Create the model
export const Tenant: Model<ITenant> = model<ITenant>("Tenant", tenantSchema);

const TenantScreeningSchema = new Schema<ITenantScreening>(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    application: {
      type: Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    // Screening details
    screeningType: {
      type: String,
      enum: Object.values(ScreeningType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ScreeningStatus),
      default: ScreeningStatus.PENDING,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    completedDate: Date,
    expiryDate: {
      type: Date,
      required: true,
    },

    // Identity verification
    identityVerification: {
      idNumber: { type: String, required: true },
      idType: {
        type: String,
        enum: ["national_id", "passport", "drivers_license"],
        required: true,
      },
      verified: { type: Boolean, default: false },
      verificationDate: Date,
      verificationMethod: {
        type: String,
        enum: ["manual", "automated", "third_party"],
        default: "manual",
      },
      documents: [
        {
          type: String,
          url: String,
          verified: { type: Boolean, default: false },
        },
      ],
    },

    // Credit check
    creditCheck: {
      creditScore: Number,
      creditRating: {
        type: String,
        enum: Object.values(CreditRating),
        required: true,
      },
      creditReportUrl: String,
      creditBureau: { type: String, default: "CRB Africa" },
      checkDate: { type: Date, required: true },
      outstandingDebts: [
        {
          creditor: String,
          amount: Number,
          status: {
            type: String,
            enum: ["current", "overdue", "defaulted"],
          },
          monthsOverdue: Number,
        },
      ],
      creditHistory: {
        totalAccounts: { type: Number, default: 0 },
        activeAccounts: { type: Number, default: 0 },
        closedAccounts: { type: Number, default: 0 },
        defaultedAccounts: { type: Number, default: 0 },
        paymentHistory: {
          type: String,
          enum: ["excellent", "good", "fair", "poor"],
          default: "fair",
        },
      },
    },

    // Employment verification
    employmentVerification: {
      status: {
        type: String,
        enum: Object.values(EmploymentStatus),
        required: true,
      },
      employer: String,
      jobTitle: String,
      employmentDuration: Number,
      monthlyIncome: Number,
      verified: { type: Boolean, default: false },
      verificationDate: Date,
      verificationMethod: {
        type: String,
        enum: ["payslip", "employment_letter", "bank_statement", "tax_returns"],
        default: "payslip",
      },
      documents: [
        {
          type: String,
          url: String,
          verified: { type: Boolean, default: false },
        },
      ],
    },

    // Income verification
    incomeVerification: {
      monthlyIncome: { type: Number, required: true },
      annualIncome: { type: Number, required: true },
      incomeSource: {
        type: String,
        enum: ["salary", "business", "investments", "pension", "other"],
        required: true,
      },
      incomeStability: {
        type: String,
        enum: ["stable", "variable", "irregular"],
        default: "stable",
      },
      verified: { type: Boolean, default: false },
      verificationDate: Date,
      documents: [
        {
          type: String,
          url: String,
          verified: { type: Boolean, default: false },
        },
      ],
    },

    // Background check
    backgroundCheck: {
      criminalRecord: {
        checked: { type: Boolean, default: false },
        hasRecord: { type: Boolean, default: false },
        details: String,
        checkDate: Date,
      },
      previousAddresses: [
        {
          address: String,
          duration: Number,
          landlordContact: String,
          reason_for_leaving: String,
        },
      ],
      references: [
        {
          name: String,
          relationship: {
            type: String,
            enum: ["employer", "landlord", "personal", "professional"],
          },
          contact: String,
          verified: { type: Boolean, default: false },
          feedback: String,
        },
      ],
    },

    // Financial assessment
    financialAssessment: {
      debtToIncomeRatio: { type: Number, required: true },
      rentToIncomeRatio: { type: Number, required: true },
      bankBalance: Number,
      savingsAmount: Number,
      financialStability: {
        type: String,
        enum: ["excellent", "good", "fair", "poor"],
        required: true,
      },
      affordabilityScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
    },

    // Risk assessment
    riskAssessment: {
      overallRiskScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      riskLevel: {
        type: String,
        enum: ["low", "medium", "high", "very_high"],
        required: true,
      },
      riskFactors: [String],
      mitigatingFactors: [String],
      recommendation: {
        type: String,
        enum: ["approve", "approve_with_conditions", "reject"],
        required: true,
      },
      conditions: [String],
    },

    // AI insights
    aiInsights: {
      paymentProbability: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      tenancySuccessScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      redFlags: [String],
      positiveIndicators: [String],
      similarTenantPerformance: {
        averagePaymentDelay: { type: Number, default: 0 },
        completionRate: { type: Number, default: 85 },
      },
    },

    // External service data
    externalServices: [
      {
        service: String,
        serviceType: {
          type: String,
          enum: ["credit_bureau", "background_check", "identity_verification"],
        },
        requestId: String,
        response: Schema.Types.Mixed,
        cost: Number,
        requestDate: Date,
        responseDate: Date,
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
      },
    ],

    // Screening results
    results: {
      passed: { type: Boolean, required: true },
      score: {
        type: Number,
        min: 0,
        max: 100,
        required: true,
      },
      grade: {
        type: String,
        enum: ["A", "B", "C", "D", "F"],
        required: true,
      },
      summary: { type: String, required: true },
      recommendations: [String],
      conditions: [String],
    },

    // Metadata
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
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
TenantScreeningSchema.index({ tenant: 1, status: 1 });
TenantScreeningSchema.index({ landlord: 1, status: 1 });
TenantScreeningSchema.index({ property: 1, status: 1 });
TenantScreeningSchema.index({ application: 1 });
TenantScreeningSchema.index({ status: 1, requestedDate: -1 });

export const TenantScreening = model<ITenantScreening>(
  "TenantScreening",
  TenantScreeningSchema
);
