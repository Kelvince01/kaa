import * as z from "zod";
import { TenantStatus, TenantType } from "./tenant.type";

// Schema for address
const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  town: z.string().min(1, "Town is required"),
  county: z.string().min(1, "County is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  directions: z.string().optional(),
});

// Schema for personal info
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Invalid email format"),
  phone: z.string().min(1, "Phone number is required"),
  nationalId: z.string().min(1, "National ID is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  occupation: z.string().min(1, "Occupation is required"),
  employer: z.string().optional(),
  monthlyIncome: z.coerce
    .number()
    .min(0, "Monthly income must be 0 or greater"),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"], {
    message: "Marital status is required",
  }),
  dependents: z.coerce.number().min(0, "Dependents must be 0 or greater"),
});

// Schema for emergency contact
const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  relationship: z.string().min(1, "Relationship is required"),
  email: z.email("Invalid email format").optional(),
});

// Schema for tenant form
export const tenantFormSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unit: z.string().min(1, "Unit is required"),
  contract: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  status: z.enum(TenantStatus).optional(),
  type: z.enum(TenantType),
  personalInfo: personalInfoSchema,
  address: addressSchema,
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().optional(),
  id: z.string().optional(), // For edit mode
});

// Type for form values
export type TenantFormValues = z.infer<typeof tenantFormSchema>;
