import { z } from "zod";
import { ContractStatus, ContractType } from "./contract.type";

/**
 * Contract form validation schemas using Zod
 * These schemas provide client-side validation for contract forms
 */

// Common field schemas
export const commonSchemas = {
  objectId: z.string().length(24, "Invalid ID format"),
  dateString: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  currency: z.number().min(0, "Amount must be non-negative"),
  positiveNumber: z.number().min(0.01, "Amount must be positive"),
  rentDueDate: z.number().min(1).max(31, "Day must be between 1 and 31"),
  percentage: z
    .number()
    .min(0)
    .max(100, "Percentage must be between 0 and 100"),
};

// Contract term schema
export const contractTermSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(2000, "Content too long"),
  order: z.number().int().positive().optional(),
  category: z.string().max(50).optional(),
  mandatory: z.boolean().optional(),
});

// Signature schema
export const signatureSchema = z.object({
  signedBy: z.string().min(1, "Signer ID is required"),
  signedAt: z.string(),
  signatureType: z.enum(["digital", "electronic", "wet"]),
  signatureData: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  witnessName: z.string().max(100).optional(),
  witnessSignature: z.string().optional(),
});

// Payment schedule schema
export const paymentScheduleSchema = z.object({
  frequency: z.enum(["weekly", "monthly", "quarterly", "annually"]),
  amount: commonSchemas.positiveNumber,
  dueDate: commonSchemas.rentDueDate,
  firstPaymentDate: commonSchemas.dateString.optional(),
  paymentMethod: z
    .enum(["bank_transfer", "standing_order", "direct_debit", "cash", "other"])
    .optional(),
  accountDetails: z
    .object({
      accountName: z.string().max(100).optional(),
      accountNumber: z.string().max(20).optional(),
      sortCode: z.string().max(10).optional(),
      bankName: z.string().max(100).optional(),
    })
    .optional(),
});

// Renewal options schema
export const renewalOptionsSchema = z.object({
  allowAutoRenewal: z.boolean(),
  renewalNoticePeriod: z
    .number()
    .int()
    .min(1, "Notice period must be at least 1 day"),
  renewalTerms: z.string().max(1000).optional(),
  rentIncreasePercentage: commonSchemas.percentage.optional(),
  renewalFee: commonSchemas.currency.optional(),
});

// Deposit protection schema
export const depositProtectionSchema = z.object({
  scheme: z.string().min(1, "Scheme name is required").max(100),
  certificateNumber: z
    .string()
    .min(1, "Certificate number is required")
    .max(50),
  protectedAmount: commonSchemas.positiveNumber,
  protectedDate: commonSchemas.dateString,
  schemeContactDetails: z
    .object({
      name: z.string().max(100),
      phone: commonSchemas.phone,
      email: commonSchemas.email,
      address: z.string().max(200),
    })
    .optional(),
});

// Termination deduction schema
export const terminationDeductionSchema = z.object({
  description: z.string().min(1, "Description is required").max(200),
  amount: commonSchemas.positiveNumber,
  category: z.string().max(50).optional(),
});

// Base contract schema with common fields
export const baseContractSchema = z
  .object({
    startDate: commonSchemas.dateString,
    endDate: commonSchemas.dateString,
    rentAmount: commonSchemas.positiveNumber.optional(),
    depositAmount: commonSchemas.currency.optional(),
    serviceCharge: commonSchemas.currency.optional(),
    lateFee: commonSchemas.currency.optional(),
    rentDueDate: commonSchemas.rentDueDate.optional(),
    waterBill: z.enum(["Included", "Tenant pays", "Shared"]).optional(),
    electricityBill: z.enum(["Included", "Tenant pays", "Shared"]).optional(),
    gasBill: z.enum(["Included", "Tenant pays", "Shared"]).optional(),
    internetBill: z.enum(["Included", "Tenant pays", "Shared"]).optional(),
    petsAllowed: z.boolean().optional(),
    smokingAllowed: z.boolean().optional(),
    sublettingAllowed: z.boolean().optional(),
    maxOccupants: z.number().int().min(1).max(20).optional(),
    terms: z.array(contractTermSchema).max(50).optional(),
    specialConditions: z.array(z.string().min(1).max(1000)).max(20).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

// Create contract schema
export const createContractSchema = baseContractSchema.safeExtend({
  propertyId: commonSchemas.objectId,
  unitId: commonSchemas.objectId.optional(),
  tenantIds: z
    .array(commonSchemas.objectId)
    .min(1, "At least one tenant is required")
    .max(10, "Maximum 10 tenants allowed"),
  contractType: z.nativeEnum(ContractType).optional(),
  contractTemplate: z.string().max(100).optional(),
  paymentSchedule: paymentScheduleSchema.partial().optional(),
  renewalOptions: renewalOptionsSchema.optional(),
});

// Update contract schema (all fields optional)
export const updateContractSchema = baseContractSchema.partial().safeExtend({
  status: z.enum(ContractStatus).optional(),
  paymentSchedule: paymentScheduleSchema.partial().optional(),
  renewalOptions: renewalOptionsSchema.optional(),
});

export const updateContractStatusSchema = z.object({
  status: z.enum(ContractStatus),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

// Contract signing schema
export const contractSigningSchema = z.object({
  signatureType: z.enum(["digital", "electronic", "wet"]),
  signatureData: z.string().optional(),
  witnessName: z.string().max(100).optional(),
  witnessSignature: z.string().optional(),
});

// Contract termination schema
export const contractTerminationSchema = z
  .object({
    terminationDate: commonSchemas.dateString,
    terminationReason: z
      .string()
      .min(1, "Termination reason is required")
      .max(500),
    terminationNotice: z.string().max(1000).optional(),
    refundableDeposit: commonSchemas.currency.optional(),
    deductions: z.array(terminationDeductionSchema).optional(),
    finalInspectionDate: commonSchemas.dateString.optional(),
    finalInspectionNotes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.finalInspectionDate) {
        return (
          new Date(data.finalInspectionDate) <= new Date(data.terminationDate)
        );
      }
      return true;
    },
    {
      message: "Final inspection date must be on or before termination date",
      path: ["finalInspectionDate"],
    }
  );

// Contract renewal schema
export const contractRenewalSchema = z
  .object({
    newStartDate: commonSchemas.dateString,
    newEndDate: commonSchemas.dateString,
    newRentAmount: commonSchemas.positiveNumber.optional(),
    newDepositAmount: commonSchemas.currency.optional(),
    newTerms: z.array(contractTermSchema).optional(),
    renewalNotes: z.string().max(1000).optional(),
  })
  .refine((data) => new Date(data.newEndDate) > new Date(data.newStartDate), {
    message: "New end date must be after new start date",
    path: ["newEndDate"],
  });

// Contract amendment schema
export const contractAmendmentSchema = z.object({
  amendmentReason: z.string().min(1, "Amendment reason is required").max(500),
  changes: z
    .array(
      z.object({
        field: z.string().min(1, "Field name is required"),
        oldValue: z.string(),
        newValue: z.string(),
        description: z.string().optional(),
      })
    )
    .min(1, "At least one change is required"),
  effectiveDate: z.string().optional(),
  requiresApproval: z.boolean().optional(),
  notes: z.string().optional(),
});

// Document upload schema
export const documentUploadSchema = z.object({
  type: z.enum([
    "contract",
    "addendum",
    "amendment",
    "termination",
    "renewal",
    "other",
  ]),
  description: z.string().max(200).optional(),
});

// Contract query parameters schema
export const contractQuerySchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  property: commonSchemas.objectId.optional(),
  unit: commonSchemas.objectId.optional(),
  tenants: z
    .union([commonSchemas.objectId, z.array(commonSchemas.objectId)])
    .optional(),
  startDateFrom: commonSchemas.dateString.optional(),
  startDateTo: commonSchemas.dateString.optional(),
  endDateFrom: commonSchemas.dateString.optional(),
  endDateTo: commonSchemas.dateString.optional(),
  sortBy: z
    .enum([
      "createdAt",
      "updatedAt",
      "startDate",
      "endDate",
      "rentAmount",
      "status",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
  search: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
});

// Contract filters schema
export const contractFiltersSchema = z.object({
  status: z.array(z.nativeEnum(ContractStatus)).optional(),
  contractType: z.array(z.nativeEnum(ContractType)).optional(),
  propertyIds: z.array(commonSchemas.objectId).optional(),
  unitIds: z.array(commonSchemas.objectId).optional(),
  tenantIds: z.array(commonSchemas.objectId).optional(),
  landlordIds: z.array(commonSchemas.objectId).optional(),
  dateRange: z
    .object({
      startDate: z.date(),
      endDate: z.date(),
      field: z.enum(["startDate", "endDate", "createdAt", "updatedAt"]),
    })
    .optional(),
  rentRange: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0),
    })
    .refine((data) => data.max >= data.min, {
      message: "Maximum rent must be greater than or equal to minimum rent",
      path: ["max"],
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  archived: z.boolean().optional(),
});

// Bulk operations schema
export const bulkUpdateContractsSchema = z.object({
  contractIds: z
    .array(commonSchemas.objectId)
    .min(1, "At least one contract ID is required"),
  updates: updateContractSchema.partial(),
});

export const bulkDeleteContractsSchema = z.object({
  contractIds: z
    .array(commonSchemas.objectId)
    .min(1, "At least one contract ID is required"),
});

// Contract template schema
export const contractTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  description: z.string().max(500).optional(),
  contractType: z.enum(ContractType),
  terms: z.array(contractTermSchema),
  defaultSettings: z.object({
    rentDueDate: commonSchemas.rentDueDate,
    gracePeriodDays: z.number().int().min(0).max(30),
    lateFeeAmount: commonSchemas.currency,
    depositAmount: commonSchemas.currency,
    renewalOptions: renewalOptionsSchema,
  }),
  isActive: z.boolean().optional(),
});

// Export options schema
export const exportOptionsSchema = z.object({
  format: z.enum(["pdf", "csv", "xlsx"]),
  includeSignatures: z.boolean().optional(),
  includeDocuments: z.boolean().optional(),
  template: z.string().optional(),
  filters: contractFiltersSchema.optional(),
});

// Type inference helpers
export type CreateContractFormData = z.infer<typeof createContractSchema>;
export type UpdateContractFormData = z.infer<typeof updateContractSchema>;
export type UpdateContractStatusFormData = z.infer<
  typeof updateContractStatusSchema
>;
export type ContractSigningFormData = z.infer<typeof contractSigningSchema>;
export type ContractTerminationFormData = z.infer<
  typeof contractTerminationSchema
>;
export type ContractRenewalFormData = z.infer<typeof contractRenewalSchema>;
export type ContractAmendmentFormData = z.infer<typeof contractAmendmentSchema>;
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;
export type ContractQueryFormData = z.infer<typeof contractQuerySchema>;
export type ContractFiltersFormData = z.infer<typeof contractFiltersSchema>;
export type BulkUpdateContractsFormData = z.infer<
  typeof bulkUpdateContractsSchema
>;
export type ContractTemplateFormData = z.infer<typeof contractTemplateSchema>;
export type ExportOptionsFormData = z.infer<typeof exportOptionsSchema>;

// Validation helper functions
export const validateCreateContract = (data: unknown) =>
  createContractSchema.safeParse(data);

export const validateUpdateContract = (data: unknown) =>
  updateContractSchema.safeParse(data);

export const validateContractSigning = (data: unknown) =>
  contractSigningSchema.safeParse(data);

export const validateContractTermination = (data: unknown) =>
  contractTerminationSchema.safeParse(data);

export const validateContractRenewal = (data: unknown) =>
  contractRenewalSchema.safeParse(data);

// Field-level validation helpers
export const isValidObjectId = (id: string): boolean =>
  commonSchemas.objectId.safeParse(id).success;

export const isValidDateString = (date: string): boolean =>
  commonSchemas.dateString.safeParse(date).success;

export const isValidEmail = (email: string): boolean =>
  commonSchemas.email.safeParse(email).success;

export const isValidPhoneNumber = (phone: string): boolean =>
  commonSchemas.phone.safeParse(phone).success;

export const isValidCurrency = (amount: number): boolean =>
  commonSchemas.currency.safeParse(amount).success;

export const isValidRentDueDate = (day: number): boolean =>
  commonSchemas.rentDueDate.safeParse(day).success;

// Custom validation messages
export const validationMessages = {
  required: "This field is required",
  invalidEmail: "Please enter a valid email address",
  invalidPhone: "Please enter a valid phone number",
  invalidDate: "Please enter a valid date (YYYY-MM-DD)",
  invalidCurrency: "Please enter a valid amount",
  endDateBeforeStart: "End date must be after start date",
  maxLength: (max: number) => `Maximum ${max} characters allowed`,
  minLength: (min: number) => `Minimum ${min} characters required`,
  maxItems: (max: number) => `Maximum ${max} items allowed`,
  minItems: (min: number) => `Minimum ${min} items required`,
} as const;
