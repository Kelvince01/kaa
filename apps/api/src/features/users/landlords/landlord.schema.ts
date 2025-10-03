import { LandlordStatus, LandlordType, RiskLevel } from "@kaa/models/types";
import { t } from "elysia";

// Address schema
const addressSchema = t.Object({
  line1: t.String(),
  town: t.String(),
  county: t.String(),
  city: t.String(),
  state: t.String(),
  country: t.String(),
  postalCode: t.String(),
  coordinates: t.Optional(
    t.Object({
      latitude: t.Number(),
      longitude: t.Number(),
    })
  ),
});

// Personal info schema
const personalInfoSchema = t.Object({
  firstName: t.Optional(t.String()),
  middleName: t.Optional(t.String()),
  lastName: t.Optional(t.String()),
  email: t.String(),
  phone: t.String(),
  alternatePhone: t.Optional(t.String()),
  dateOfBirth: t.Optional(t.Date()),
  nationality: t.Optional(t.String()),
  nationalId: t.Optional(t.String()),
  passportNumber: t.Optional(t.String()),
  gender: t.Optional(
    t.Union([
      t.Literal("male"),
      t.Literal("female"),
      t.Literal("other"),
      t.Literal("prefer_not_to_say"),
    ])
  ),
  occupation: t.Optional(t.String()),
  preferredLanguage: t.Optional(t.String()),
});

// Business info schema
const businessInfoSchema = t.Object({
  companyName: t.Optional(t.String()),
  registrationNumber: t.Optional(t.String()),
  taxId: t.Optional(t.String()),
  vatNumber: t.Optional(t.String()),
  industry: t.Optional(t.String()),
  companyType: t.Optional(
    t.Union([
      t.Literal("sole_proprietorship"),
      t.Literal("partnership"),
      t.Literal("llc"),
      t.Literal("corporation"),
      t.Literal("trust"),
      t.Literal("other"),
    ])
  ),
  establishedDate: t.Optional(t.String()),
  website: t.Optional(t.String()),
  description: t.Optional(t.String()),
  directors: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        position: t.String(),
        nationalId: t.String(),
        sharePercentage: t.Optional(t.Number()),
        isPrimary: t.Boolean(),
      })
    )
  ),
  authorizedPersons: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        position: t.String(),
        email: t.String(),
        phone: t.String(),
        nationalId: t.String(),
        canSignContracts: t.Optional(t.Boolean()),
        canManageFinances: t.Optional(t.Boolean()),
      })
    )
  ),
});

// Contact info schema
const contactInfoSchema = t.Object({
  primaryAddress: addressSchema,
  mailingAddress: t.Optional(addressSchema),
  businessAddress: t.Optional(addressSchema),
  emergencyContact: t.Object({
    name: t.String(),
    relationship: t.String(),
    phone: t.String(),
    email: t.Optional(t.String()),
  }),
});

// Communication preferences schema
const communicationPreferencesSchema = t.Object({
  preferredMethod: t.Optional(
    t.Union([
      t.Literal("email"),
      t.Literal("sms"),
      t.Literal("whatsapp"),
      t.Literal("phone"),
      t.Literal("in_app"),
    ])
  ),
  language: t.Optional(t.String()),
  timezone: t.Optional(t.String()),
  receiveMarketingEmails: t.Optional(t.Boolean()),
  receivePropertyAlerts: t.Optional(t.Boolean()),
  receiveMaintenanceUpdates: t.Optional(t.Boolean()),
  receiveRegulatoryUpdates: t.Optional(t.Boolean()),
  receivePerformanceReports: t.Optional(t.Boolean()),
});

// Subscription schema
const subscriptionSchema = t.Object({
  plan: t.Optional(
    t.Union([
      t.Literal("basic"),
      t.Literal("standard"),
      t.Literal("premium"),
      t.Literal("enterprise"),
    ])
  ),
  status: t.Optional(
    t.Union([
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("cancelled"),
      t.Literal("suspended"),
    ])
  ),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  billingCycle: t.Optional(
    t.Union([t.Literal("monthly"), t.Literal("quarterly"), t.Literal("yearly")])
  ),
  paymentMethod: t.Optional(
    t.Union([
      t.Literal("card"),
      t.Literal("bank_transfer"),
      t.Literal("mobile_money"),
    ])
  ),
  stripeCustomerId: t.Optional(t.String()),
  autoRenewal: t.Optional(t.Boolean()),
});

// Metadata schema
const metadataSchema = t.Object({
  source: t.Optional(
    t.Union([
      t.Literal("website"),
      t.Literal("referral"),
      t.Literal("agent"),
      t.Literal("marketing"),
      t.Literal("api"),
      t.Literal("import"),
    ])
  ),
  referredBy: t.Optional(t.String()),
  campaignId: t.Optional(t.String()),
  utmSource: t.Optional(t.String()),
  utmMedium: t.Optional(t.String()),
  utmCampaign: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  notes: t.Optional(t.String()),
  internalNotes: t.Optional(t.String()),
});

// Create landlord schema
export const createLandlordSchema = t.Object({
  landlordType: t.Union([
    t.Literal(LandlordType.INDIVIDUAL),
    t.Literal(LandlordType.COMPANY),
    t.Literal(LandlordType.TRUST),
    t.Literal(LandlordType.PARTNERSHIP),
    t.Literal(LandlordType.LLC),
    t.Literal(LandlordType.CORPORATION),
  ]),
  personalInfo: t.Optional(personalInfoSchema),
  businessInfo: t.Optional(businessInfoSchema),
  contactInfo: contactInfoSchema,
  communicationPreferences: t.Optional(communicationPreferencesSchema),
  subscription: t.Optional(subscriptionSchema),
  metadata: t.Optional(metadataSchema),
});

// Update landlord schema
export const updateLandlordSchema = t.Object({
  landlordType: t.Optional(
    t.Union([
      t.Literal(LandlordType.INDIVIDUAL),
      t.Literal(LandlordType.COMPANY),
      t.Literal(LandlordType.TRUST),
      t.Literal(LandlordType.PARTNERSHIP),
      t.Literal(LandlordType.LLC),
      t.Literal(LandlordType.CORPORATION),
    ])
  ),
  status: t.Optional(
    t.Union([
      t.Literal(LandlordStatus.PENDING_VERIFICATION),
      t.Literal(LandlordStatus.VERIFICATION_IN_PROGRESS),
      t.Literal(LandlordStatus.ACTIVE),
      t.Literal(LandlordStatus.SUSPENDED),
      t.Literal(LandlordStatus.REJECTED),
      t.Literal(LandlordStatus.INACTIVE),
    ])
  ),
  personalInfo: t.Optional(t.Partial(personalInfoSchema)),
  businessInfo: t.Optional(t.Partial(businessInfoSchema)),
  contactInfo: t.Optional(t.Partial(contactInfoSchema)),
  communicationPreferences: t.Optional(
    t.Partial(communicationPreferencesSchema)
  ),
  subscription: t.Optional(t.Partial(subscriptionSchema)),
  metadata: t.Optional(t.Partial(metadataSchema)),
});

// Query params schema
export const landlordQuerySchema = t.Object({
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  status: t.Optional(t.String()),
  landlordType: t.Optional(t.String()),
  verificationStatus: t.Optional(t.String()),
  riskLevel: t.Optional(t.Enum(RiskLevel)),
  search: t.Optional(t.String()),
  tags: t.Optional(t.String()),
  city: t.Optional(t.String()),
  state: t.Optional(t.String()),
  country: t.Optional(t.String()),
  createdFrom: t.Optional(t.String()),
  createdTo: t.Optional(t.String()),
  verifiedFrom: t.Optional(t.String()),
  verifiedTo: t.Optional(t.String()),
  minNetWorth: t.Optional(t.String()),
  maxNetWorth: t.Optional(t.String()),
  minPropertyValue: t.Optional(t.String()),
  maxPropertyValue: t.Optional(t.String()),
  minOccupancyRate: t.Optional(t.String()),
  maxOccupancyRate: t.Optional(t.String()),
  minCollectionRate: t.Optional(t.String()),
  maxCollectionRate: t.Optional(t.String()),
  hasValidLicense: t.Optional(t.String()),
  hasActiveViolations: t.Optional(t.String()),
  complianceExpiring: t.Optional(t.String()),
});

// Search landlord schema
export const searchLandlordSchema = t.Object({
  memberId: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  companyName: t.Optional(t.String()),
  registrationNumber: t.Optional(t.String()),
  taxId: t.Optional(t.String()),
  nationalId: t.Optional(t.String()),
  userId: t.Optional(t.String()),
});

// Verification schema
export const updateVerificationSchema = t.Object({
  verificationType: t.Union([
    t.Literal("identity"),
    t.Literal("address"),
    t.Literal("financial"),
    t.Literal("business"),
  ]),
  verificationData: t.Record(t.String(), t.Any()),
  notes: t.Optional(t.String()),
});
