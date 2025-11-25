import { TenantPriority, TenantStatus, TenantType } from "@kaa/models/types";
import { t } from "elysia";

// Address schema
export const addressSchema = t.Object({
  line1: t.String({ minLength: 1 }),
  line2: t.Optional(t.String()),
  town: t.String({ minLength: 1 }),
  county: t.String({ minLength: 1 }),
  postalCode: t.String({ minLength: 1 }),
  country: t.String({ minLength: 1 }),
  directions: t.Optional(t.String()),
  coordinates: t.Optional(
    t.Object({
      latitude: t.Number(),
      longitude: t.Number(),
    })
  ),
});

// Emergency contact schema
export const emergencyContactSchema = t.Object({
  name: t.String({ minLength: 1 }),
  phone: t.String({ minLength: 1 }),
  relationship: t.String({ minLength: 1 }),
  email: t.Optional(t.String({ format: "email" })),
});

// Personal info schema
export const personalInfoSchema = t.Object({
  firstName: t.String({ minLength: 1 }),
  middleName: t.Optional(t.String()),
  lastName: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  phone: t.String({ minLength: 1 }),
  nationalId: t.String({ minLength: 1 }),
  dateOfBirth: t.String({ format: "date" }),
  occupation: t.String({ minLength: 1 }),
  employer: t.Optional(t.String()),
  monthlyIncome: t.Number({ minimum: 0 }),
  maritalStatus: t.Union([
    t.Literal("single"),
    t.Literal("married"),
    t.Literal("divorced"),
    t.Literal("widowed"),
  ]),
  dependents: t.Number({ minimum: 0 }),
});

// Create tenant schema
export const createTenantSchema = t.Object({
  user: t.Optional(t.String()),
  property: t.String({ minLength: 1 }),
  unit: t.String({ minLength: 1 }),
  contract: t.Optional(t.String()), // { minLength: 1 }
  type: t.Enum(TenantType),
  personalInfo: personalInfoSchema,
  startDate: t.String({ format: "date" }),
  endDate: t.Optional(t.String({ format: "date" })),
  status: t.Optional(t.Enum(TenantStatus)),
  address: addressSchema,
  emergencyContact: t.Optional(emergencyContactSchema),
  notes: t.Optional(t.String()),
});

// Update tenant schema
export const updateTenantSchema = t.Object({
  property: t.Optional(t.String()),
  unit: t.Optional(t.String()),
  contract: t.Optional(t.String()),
  type: t.Optional(t.Enum(TenantType)),
  priority: t.Optional(t.Enum(TenantPriority)),
  personalInfo: t.Optional(t.Partial(personalInfoSchema)),
  endDate: t.Optional(t.String({ format: "date" })),
  status: t.Optional(t.Enum(TenantStatus)),
  address: t.Optional(addressSchema),
  emergencyContact: t.Optional(emergencyContactSchema),
  notes: t.Optional(t.String()),
});

// Background check schema
export const backgroundCheckSchema = t.Object({
  conducted: t.Boolean(),
  conductedDate: t.Date(),
  creditCheck: t.Object({
    cleared: t.Boolean(),
  }),
  criminalCheck: t.Object({
    cleared: t.Boolean(),
  }),
  employmentVerification: t.Object({
    verified: t.Boolean(),
    employerConfirmed: t.Boolean(),
    incomeVerified: t.Boolean(),
  }),
  previousLandlordCheck: t.Object({
    contacted: t.Boolean(),
    recommendation: t.Enum({
      excellent: "excellent",
      good: "good",
      fair: "fair",
      poor: "poor",
    }),
    notes: t.String(),
  }),
  referenceChecks: t.Array(
    t.Object({
      name: t.String(),
      relationship: t.String(),
      contact: t.String(),
      verified: t.Boolean(),
      recommendation: t.String(),
    })
  ),
  previousAddresses: t.Array(
    t.Object({
      address: t.String(),
      duration: t.Number(),
      landlordContact: t.String(),
      reason_for_leaving: t.String(),
    })
  ),
});

// Update verification schema
export const updateVerificationSchema = t.Object({
  verificationProgress: t.Number({ minimum: 0, maximum: 100 }),
  verificationData: t.Optional(t.Partial(backgroundCheckSchema)),
});

// Tenant query params schema
export const tenantQuerySchema = t.Object({
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  sortField: t.Optional(t.String()),
  sortOrder: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal("active"),
      t.Literal("inactive"),
      t.Literal("suspended"),
    ])
  ),
  property: t.Optional(t.String()),
  unit: t.Optional(t.String()),
  contract: t.Optional(t.String()),
  isActive: t.Optional(t.String()),
  startDateFrom: t.Optional(t.String({ format: "date" })),
  startDateTo: t.Optional(t.String({ format: "date" })),
  endDateFrom: t.Optional(t.String({ format: "date" })),
  endDateTo: t.Optional(t.String({ format: "date" })),
});

// Search tenant schema
export const searchTenantSchema = t.Object({
  memberId: t.Optional(t.String()),
  email: t.Optional(t.String({ format: "email" })),
  username: t.Optional(t.String()),
  phone: t.Optional(t.String()),
});
