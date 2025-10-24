import { z } from "zod";
import { LandlordStatus, LandlordType } from "./landlord.type";

// Address schema
const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

// Personal info schema
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationality: z.string().min(1, "Nationality is required"),
  nationalId: z.string().min(1, "National ID is required"),
  passportNumber: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  occupation: z.string().optional(),
  preferredLanguage: z.string(),
});

// Business info schema
const businessInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  taxId: z.string().min(1, "Tax ID is required"),
  vatNumber: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  companyType: z.enum([
    "sole_proprietorship",
    "partnership",
    "llc",
    "corporation",
    "trust",
    "other",
  ]),
  establishedDate: z.string().min(1, "Established date is required"),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  directors: z.array(
    z.object({
      name: z.string().min(1, "Director name is required"),
      position: z.string().min(1, "Position is required"),
      nationalId: z.string().min(1, "National ID is required"),
      sharePercentage: z.number().min(0).max(100).optional(),
      isPrimary: z.boolean(),
    })
  ),
  authorizedPersons: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      position: z.string().min(1, "Position is required"),
      email: z.string().email("Invalid email"),
      phone: z.string().min(1, "Phone is required"),
      nationalId: z.string().min(1, "National ID is required"),
      canSignContracts: z.boolean(),
      canManageFinances: z.boolean(),
    })
  ),
});

// Contact info schema
const contactInfoSchema = z.object({
  primaryAddress: addressSchema,
  mailingAddress: addressSchema.optional(),
  businessAddress: addressSchema.optional(),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    relationship: z.string().min(1, "Relationship is required"),
    phone: z.string().min(1, "Emergency contact phone is required"),
    email: z.string().email().optional().or(z.literal("")),
  }),
});

// Financial info schema
const financialInfoSchema = z.object({
  bankingDetails: z.object({
    primaryBank: z.string().min(1, "Primary bank is required"),
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    isVerified: z.boolean(),
  }),
  creditInformation: z.object({
    creditScore: z.number().min(0).max(850).optional(),
    creditRating: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  }),
  insurance: z.object({
    hasPropertyInsurance: z.boolean(),
    hasLiabilityInsurance: z.boolean(),
    insuranceProvider: z.string().optional(),
    policyNumbers: z.array(z.string()),
    coverageAmount: z.number().optional(),
    expiryDate: z.string().optional(),
  }),
  financialCapacity: z.object({
    monthlyIncome: z.number().optional(),
    totalAssets: z.number().optional(),
    totalLiabilities: z.number().optional(),
    netWorth: z.number().optional(),
    liquidAssets: z.number().optional(),
    propertyValue: z.number().optional(),
    mortgageDebt: z.number().optional(),
  }),
});

// Communication preferences schema
const communicationPreferencesSchema = z.object({
  preferredMethod: z.enum(["email", "sms", "whatsapp", "phone", "in_app"]),
  language: z.string(),
  timezone: z.string(),
  receiveMarketingEmails: z.boolean(),
  receivePropertyAlerts: z.boolean(),
  receiveMaintenanceUpdates: z.boolean(),
  receiveRegulatoryUpdates: z.boolean(),
  receivePerformanceReports: z.boolean(),
});

// Subscription schema
const subscriptionSchema = z.object({
  plan: z.enum(["basic", "standard", "premium", "enterprise"]),
  status: z.enum(["active", "inactive", "cancelled", "suspended"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  billingCycle: z.enum(["monthly", "quarterly", "yearly"]),
  paymentMethod: z.enum(["card", "bank_transfer", "mobile_money"]),
  stripeCustomerId: z.string().optional(),
  autoRenewal: z.boolean(),
});

// Metadata schema
const metadataSchema = z.object({
  source: z.enum([
    "website",
    "referral",
    "agent",
    "marketing",
    "api",
    "import",
  ]),
  referredBy: z.string().optional(),
  campaignId: z.string().optional(),
  tags: z.array(z.string()),
  notes: z.string(),
  internalNotes: z.string(),
});

// Create landlord schema
export const createLandlordSchema = z
  .object({
    landlordType: z.nativeEnum(LandlordType),
    personalInfo: personalInfoSchema.optional(),
    businessInfo: businessInfoSchema.optional(),
    contactInfo: contactInfoSchema,
    financialInfo: financialInfoSchema.optional(),
    communicationPreferences: communicationPreferencesSchema.optional(),
    subscription: subscriptionSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .refine(
    (data) => {
      // If landlordType is INDIVIDUAL, personalInfo is required
      if (data.landlordType === LandlordType.INDIVIDUAL) {
        return !!data.personalInfo;
      }
      // If landlordType is not INDIVIDUAL, businessInfo is required
      return !!data.businessInfo;
    },
    {
      message:
        "Personal info is required for individual landlords, business info is required for business entities",
      path: ["personalInfo", "businessInfo"],
    }
  );

// Update landlord schema
export const updateLandlordSchema = z.object({
  landlordType: z.nativeEnum(LandlordType).optional(),
  status: z.nativeEnum(LandlordStatus).optional(),
  personalInfo: personalInfoSchema.partial().optional(),
  businessInfo: businessInfoSchema.partial().optional(),
  contactInfo: contactInfoSchema.partial().optional(),
  financialInfo: financialInfoSchema.partial().optional(),
  communicationPreferences: communicationPreferencesSchema.partial().optional(),
  subscription: subscriptionSchema.partial().optional(),
  metadata: metadataSchema.partial().optional(),
});

// Query params schema
export const landlordQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  status: z.nativeEnum(LandlordStatus).optional(),
  landlordType: z.nativeEnum(LandlordType).optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  verifiedFrom: z.string().optional(),
  verifiedTo: z.string().optional(),
  minNetWorth: z.string().optional(),
  maxNetWorth: z.string().optional(),
  minPropertyValue: z.string().optional(),
  maxPropertyValue: z.string().optional(),
  minOccupancyRate: z.string().optional(),
  maxOccupancyRate: z.string().optional(),
  minCollectionRate: z.string().optional(),
  maxCollectionRate: z.string().optional(),
  hasValidLicense: z.string().optional(),
  hasActiveViolations: z.string().optional(),
  complianceExpiring: z.string().optional(),
});

// Search landlord schema
export const searchLandlordSchema = z.object({
  memberId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  nationalId: z.string().optional(),
});

// Verification schema
export const updateVerificationSchema = z.object({
  verificationType: z.enum(["identity", "address", "financial", "business"]),
  verificationData: z.record(z.string(), z.any()),
  notes: z.string().optional(),
});

export type CreateLandlordInput = z.infer<typeof createLandlordSchema>;
export type UpdateLandlordInput = z.infer<typeof updateLandlordSchema>;
export type LandlordQueryInput = z.infer<typeof landlordQuerySchema>;
export type SearchLandlordInput = z.infer<typeof searchLandlordSchema>;
export type UpdateVerificationInput = z.infer<typeof updateVerificationSchema>;
