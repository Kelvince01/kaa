import { TenantPriority, TenantStatus, TenantType } from "@kaa/models/types";
import { z } from "zod";

// Address schema
export const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  town: z.string().min(1),
  county: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  directions: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.coerce.number(),
      longitude: z.coerce.number(),
    })
    .optional(),
});

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  relationship: z.string().min(1),
  email: z.string().email().optional(),
});

// Personal info schema
export const personalInfoSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  nationalId: z.string().min(1),
  dateOfBirth: z.string().date(),
  occupation: z.string().min(1),
  employer: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]),
  dependents: z.coerce.number().min(0),
});

// Create tenant schema
export const createTenantSchema = z.object({
  user: z.string().optional(),
  property: z.string().min(1),
  unit: z.string().min(1),
  contract: z.string().min(1),
  tenantType: z.enum([
    TenantType.INDIVIDUAL,
    TenantType.CORPORATE,
    TenantType.STUDENT,
  ]),
  personalInfo: personalInfoSchema,
  startDate: z.string().date(),
  endDate: z.string().date().optional(),
  status: z
    .enum([
      TenantStatus.ACTIVE,
      TenantStatus.INACTIVE,
      TenantStatus.SUSPENDED,
      TenantStatus.PENDING_VERIFICATION,
      TenantStatus.REJECTED,
    ])
    .optional(),
  address: addressSchema,
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().optional(),
});

// Update tenant schema
export const updateTenantSchema = z.object({
  property: z.string().optional(),
  unit: z.string().optional(),
  contract: z.string().optional(),
  tenantType: z
    .enum([TenantType.INDIVIDUAL, TenantType.CORPORATE, TenantType.STUDENT])
    .optional(),
  priority: z
    .enum([
      TenantPriority.LOW,
      TenantPriority.MEDIUM,
      TenantPriority.HIGH,
      TenantPriority.CRITICAL,
    ])
    .optional(),
  personalInfo: personalInfoSchema.partial().optional(),
  endDate: z.string().date().optional(),
  status: z
    .enum([
      TenantStatus.ACTIVE,
      TenantStatus.INACTIVE,
      TenantStatus.SUSPENDED,
      TenantStatus.PENDING_VERIFICATION,
      TenantStatus.REJECTED,
    ])
    .optional(),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().optional(),
});

// Background check schema
export const backgroundCheckSchema = z.object({
  conducted: z.boolean(),
  conductedDate: z.iso.date(),
  creditCheck: z.object({
    cleared: z.boolean(),
  }),
  criminalCheck: z.object({
    cleared: z.boolean(),
  }),
  employmentVerification: z.object({
    verified: z.boolean(),
    employerConfirmed: z.boolean(),
    incomeVerified: z.boolean(),
  }),
  previousLandlordCheck: z.object({
    contacted: z.boolean(),
    recommendation: z.enum(["excellent", "good", "fair", "poor"]),
    notes: z.string(),
  }),
  referenceChecks: z.array(
    z.object({
      name: z.string(),
      relationship: z.string(),
      contact: z.string(),
      verified: z.boolean(),
      recommendation: z.string(),
    })
  ),
  previousAddresses: z.array(
    z.object({
      address: z.string(),
      duration: z.coerce.number(),
      landlordContact: z.string(),
      reason_for_leaving: z.string(),
    })
  ),
});

// Update verification schema
export const updateVerificationSchema = z.object({
  verificationProgress: z.coerce.number().min(0).max(100),
  verificationData: backgroundCheckSchema.partial().optional(),
});

// Tenant query params schema
export const tenantQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortField: z.string().optional(),
  sortOrder: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  property: z.string().optional(),
  unit: z.string().optional(),
  contract: z.string().optional(),
  isActive: z.string().optional(),
  startDateFrom: z.string().date().optional(),
  startDateTo: z.string().date().optional(),
  endDateFrom: z.string().date().optional(),
  endDateTo: z.string().date().optional(),
});

// Search tenant schema
export const searchTenantSchema = z.object({
  memberId: z.string().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
});
