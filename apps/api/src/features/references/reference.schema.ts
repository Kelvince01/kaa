/**
 * Dynamic validation schemas for different reference types
 */

import { t } from "elysia";

// Base verification details schema
const baseVerificationDetailsSchema = t.Object({
  // Optional fields that may be present in any type
  feedback: t.Optional(t.String()),
  additionalNotes: t.Optional(t.String()),
});

// Employment specific validation
export const employerVerificationSchema = t.Object({
  employmentStatus: t.String({ description: "Current employment status" }),
  annualIncome: t.Number({ minimum: 0, description: "Annual income in KES" }),
  lengthOfEmployment: t.String({
    description: "How long employed at current position",
  }),
  positionHeld: t.String({ description: "Current job position/title" }),
  employerKRAPin: t.Optional(
    t.String({ description: "Employer KRA PIN for verification" })
  ),
  salarySlipVerified: t.Optional(
    t.Boolean({ description: "Whether salary slip has been verified" })
  ),
});

// Previous landlord specific validation
export const landlordVerificationSchema = t.Object({
  landlordFeedback: t.String({
    description: "General feedback about the tenant",
  }),
  rentPaymentHistory: t.String({
    enum: ["excellent", "good", "fair", "poor"],
    description: "Rent payment consistency",
  }),
  rentAmount: t.Number({
    minimum: 0,
    description: "Previous rent amount in KES",
  }),
  tenancyLength: t.String({ description: "Duration of previous tenancy" }),
  reasonForLeaving: t.String({
    description: "Reason tenant left the property",
  }),
  waterBillsPaid: t.Optional(
    t.Boolean({ description: "Were water bills paid on time" })
  ),
  electricalBillsPaid: t.Optional(
    t.Boolean({ description: "Were electrical bills paid on time" })
  ),
  propertyCondition: t.Optional(
    t.String({
      enum: ["excellent", "good", "fair", "poor"],
      description: "Condition property was left in",
    })
  ),
});

// Character/Community verification
export const characterVerificationSchema = t.Object({
  characterReference: t.String({ description: "Character assessment" }),
  communityStanding: t.Optional(
    t.String({
      enum: ["excellent", "good", "fair", "poor"],
      description: "Standing in the community",
    })
  ),
  religiousAffiliation: t.Optional(
    t.String({ description: "Religious background if relevant" })
  ),
  knownSince: t.Optional(
    t.String({ description: "How long have you known this person" })
  ),
});

// Financial/SACCOS verification
export const financialVerificationSchema = t.Object({
  saccosAccountStatus: t.Optional(
    t.String({
      enum: ["active", "inactive", "suspended"],
      description: "SACCOS account status",
    })
  ),
  chamaContribution: t.Optional(
    t.String({
      enum: ["regular", "irregular", "none"],
      description: "Chama contribution consistency",
    })
  ),
  mobileMoneyHistory: t.Optional(
    t.String({
      enum: ["excellent", "good", "fair", "poor"],
      description: "Mobile money transaction reliability",
    })
  ),
  crbStatus: t.Optional(
    t.String({
      enum: ["good", "fair", "poor"],
      description: "Credit Reference Bureau status",
    })
  ),
  relationshipDuration: t.Optional(
    t.String({ description: "How long known in financial context" })
  ),
});

// Guarantor verification
export const guarantorVerificationSchema = t.Object({
  guarantorNetWorth: t.Optional(
    t.Number({ minimum: 0, description: "Guarantor's net worth in KES" })
  ),
  guarantorProperty: t.Optional(
    t.String({ description: "Properties owned by guarantor" })
  ),
  relationshipDuration: t.String({ description: "How long known the tenant" }),
  willingnessToGuarantee: t.Boolean({
    description: "Willing to guarantee the tenant",
  }),
});

// Response schemas for different reference types
export const createReferenceResponseSchema = (referenceType: string) => {
  const baseResponse = t.Object({
    feedback: t.String({ description: "General feedback about the tenant" }),
    rating: t.Number({
      minimum: 1,
      maximum: 5,
      description: "Rating from 1-5",
    }),
  });

  switch (referenceType) {
    case "employer":
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: employerVerificationSchema,
      });

    case "previous_landlord":
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: landlordVerificationSchema,
      });

    case "character":
    case "religious_leader":
    case "community_elder":
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: characterVerificationSchema,
      });

    case "saccos_member":
    case "chama_member":
    case "business_partner":
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: financialVerificationSchema,
      });

    case "family_guarantor":
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: guarantorVerificationSchema,
      });

    default:
      // Fallback to character verification for unknown types
      return t.Object({
        ...baseResponse.properties,
        verificationDetails: t.Optional(
          t.Object({
            characterReference: t.Optional(t.String()),
            additionalNotes: t.Optional(t.String()),
          })
        ),
      });
  }
};

// Decline response schema
export const declineResponseSchema = t.Object({
  declineReason: t.String({
    enum: [
      "unreachable",
      "not_acquainted",
      "conflict_of_interest",
      "insufficient_information",
      "other",
    ],
    description: "Reason for declining to provide reference",
  }),
  declineComment: t.Optional(
    t.String({ description: "Additional comments about the decline" })
  ),
});

// Request creation schema
export const createReferenceRequestSchema = t.Object({
  referenceType: t.String({
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
    description: "Type of reference being requested",
  }),
  referenceProvider: t.Object({
    name: t.String({
      minLength: 1,
      description: "Reference provider's full name",
    }),
    email: t.String({
      format: "email",
      description: "Reference provider's email address",
    }),
    phone: t.Optional(
      t.String({ description: "Reference provider's phone number" })
    ),
    relationship: t.String({
      minLength: 1,
      description: "Relationship to the tenant",
    }),
  }),
  consentGiven: t.Boolean({
    description: "Tenant has given consent for this reference check",
  }),
});

// Consent creation schema
export const createConsentSchema = t.Object({
  permissions: t.Object({
    employerVerification: t.Boolean({ default: true }),
    kraVerification: t.Boolean({ default: false }),
    crbCheck: t.Boolean({ default: false }),
    mobileMoneyAnalysis: t.Boolean({ default: false }),
    utilityBillVerification: t.Boolean({ default: true }),
    saccosVerification: t.Boolean({ default: true }),
    communityVerification: t.Boolean({ default: true }),
    guarantorVerification: t.Boolean({ default: true }),
  }),
  dataRetention: t.Optional(
    t.Object({
      retentionPeriodMonths: t.Number({ minimum: 6, maximum: 60, default: 24 }),
      allowDataSharing: t.Boolean({ default: false }),
      allowAnalytics: t.Boolean({ default: true }),
    })
  ),
});

// Helper function to get the appropriate validation schema
export const getValidationSchemaForReferenceType = (referenceType: string) =>
  createReferenceResponseSchema(referenceType);
