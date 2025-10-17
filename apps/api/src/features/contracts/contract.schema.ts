import { ContractStatus, ContractType } from "@kaa/models/types";
import { t } from "elysia";

/**
 * Common validation schemas
 */
export const commonSchemas = {
  objectId: t.String({
    minLength: 24,
    maxLength: 24,
    pattern: "^[0-9a-fA-F]{24}$",
    description: "Valid MongoDB ObjectId",
  }),

  dateString: t.String({
    format: "date",
    description: "Date in YYYY-MM-DD format",
  }),

  email: t.String({
    format: "email",
    description: "Valid email address",
  }),

  phone: t.String({
    pattern: "^\\+?[1-9]\\d{1,14}$",
    description: "Valid phone number",
  }),

  currency: t.Number({
    minimum: 0,
    description: "Currency amount (non-negative)",
  }),

  positiveNumber: t.Number({
    minimum: 0.01,
    description: "Positive number",
  }),

  rentDueDate: t.Number({
    minimum: 1,
    maximum: 31,
    description: "Day of month (1-31)",
  }),
};

/**
 * Contract term validation schema
 */
export const contractTermSchema = t.Object({
  title: t.String({
    minLength: 1,
    maxLength: 200,
    description: "Term title",
  }),
  content: t.String({
    minLength: 1,
    maxLength: 2000,
    description: "Term content",
  }),
});

/**
 * Contract creation validation schema
 */
export const contractCreateSchema = t.Object({
  propertyId: commonSchemas.objectId,
  unitId: t.Optional(commonSchemas.objectId),
  tenantIds: t.Array(commonSchemas.objectId, {
    minItems: 1,
    maxItems: 10,
    description: "List of tenant IDs",
  }),
  startDate: commonSchemas.dateString,
  endDate: commonSchemas.dateString,
  rentAmount: t.Optional(commonSchemas.positiveNumber),
  depositAmount: t.Optional(commonSchemas.currency),
  serviceCharge: t.Optional(commonSchemas.currency),
  lateFee: t.Optional(commonSchemas.currency),
  rentDueDate: t.Optional(commonSchemas.rentDueDate),
  waterBill: t.Optional(
    t.Union([
      t.Literal("Included"),
      t.Literal("Tenant pays"),
      t.Literal("Shared"),
    ])
  ),
  electricityBill: t.Optional(
    t.Union([
      t.Literal("Included"),
      t.Literal("Tenant pays"),
      t.Literal("Shared"),
    ])
  ),
  petsAllowed: t.Optional(t.Boolean()),
  smokingAllowed: t.Optional(t.Boolean()),
  sublettingAllowed: t.Optional(t.Boolean()),
  terms: t.Optional(
    t.Array(contractTermSchema, {
      maxItems: 50,
      description: "Custom contract terms",
    })
  ),
  specialConditions: t.Optional(
    t.Array(
      t.String({
        minLength: 1,
        maxLength: 1000,
      }),
      {
        maxItems: 20,
        description: "Special conditions",
      }
    )
  ),
  contractType: t.Optional(
    t.Union([
      t.Literal(ContractType.ASSURED_SHORTHAND_TENANCY),
      t.Literal(ContractType.ASSURED_TENANCY),
      t.Literal(ContractType.COMMERCIAL_LEASE),
      t.Literal(ContractType.STUDENT_ACCOMMODATION),
    ])
  ),
  contractTemplate: t.Optional(
    t.Union([
      t.Literal("standard"),
      t.Literal("furnished"),
      t.Literal("commercial"),
    ])
  ),
});

/**
 * Contract update validation schema
 */
export const contractUpdateSchema = t.Object({
  startDate: t.Optional(commonSchemas.dateString),
  endDate: t.Optional(commonSchemas.dateString),
  rentAmount: t.Optional(commonSchemas.positiveNumber),
  depositAmount: t.Optional(commonSchemas.currency),
  serviceCharge: t.Optional(commonSchemas.currency),
  lateFee: t.Optional(commonSchemas.currency),
  rentDueDate: t.Optional(commonSchemas.rentDueDate),
  waterBill: t.Optional(
    t.Union([
      t.Literal("Included"),
      t.Literal("Tenant pays"),
      t.Literal("Shared"),
    ])
  ),
  electricityBill: t.Optional(
    t.Union([
      t.Literal("Included"),
      t.Literal("Tenant pays"),
      t.Literal("Shared"),
    ])
  ),
  petsAllowed: t.Optional(t.Boolean()),
  smokingAllowed: t.Optional(t.Boolean()),
  sublettingAllowed: t.Optional(t.Boolean()),
  terms: t.Optional(t.Array(contractTermSchema, { maxItems: 50 })),
  specialConditions: t.Optional(
    t.Array(
      t.String({
        minLength: 1,
        maxLength: 1000,
      }),
      { maxItems: 20 }
    )
  ),
  status: t.Optional(
    t.Union([
      t.Literal(ContractStatus.DRAFT),
      t.Literal(ContractStatus.PENDING),
      t.Literal(ContractStatus.ACTIVE),
      t.Literal(ContractStatus.TERMINATED),
      t.Literal(ContractStatus.EXPIRED),
      t.Literal(ContractStatus.CANCELLED),
    ])
  ),
});

/**
 * Contract listing/query validation schema
 */
export const contractQuerySchema = t.Object({
  status: t.Optional(
    t.Union([
      t.Literal(ContractStatus.DRAFT),
      t.Literal(ContractStatus.PENDING),
      t.Literal(ContractStatus.ACTIVE),
      t.Literal(ContractStatus.TERMINATED),
      t.Literal(ContractStatus.EXPIRED),
      t.Literal(ContractStatus.CANCELLED),
    ])
  ),
  property: t.Optional(commonSchemas.objectId),
  unit: t.Optional(commonSchemas.objectId),
  tenants: t.Optional(
    t.Union([commonSchemas.objectId, t.Array(commonSchemas.objectId)])
  ),
  startDateFrom: t.Optional(commonSchemas.dateString),
  startDateTo: t.Optional(commonSchemas.dateString),
  endDateFrom: t.Optional(commonSchemas.dateString),
  endDateTo: t.Optional(commonSchemas.dateString),
  sortBy: t.Optional(
    t.Union([
      t.Literal("createdAt"),
      t.Literal("updatedAt"),
      t.Literal("startDate"),
      t.Literal("endDate"),
      t.Literal("rentAmount"),
      t.Literal("status"),
    ])
  ),
  sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
  limit: t.Optional(
    t.Number({
      minimum: 1,
      maximum: 100,
      default: 10,
    })
  ),
  page: t.Optional(
    t.Number({
      minimum: 1,
      default: 1,
    })
  ),
  search: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 100,
      description: "Search term for contract content",
    })
  ),
});

/**
 * Contract signing validation schema
 */
export const contractSigningSchema = t.Object({
  signatureType: t.Union([
    t.Literal("digital"),
    t.Literal("electronic"),
    t.Literal("wet"),
  ]),
  signatureData: t.Optional(
    t.String({
      description: "Base64 encoded signature data",
    })
  ),
  signedAt: t.Optional(t.Date()),
  ipAddress: t.Optional(
    t.String({
      description: "IP address of signer",
    })
  ),
  userAgent: t.Optional(
    t.String({
      description: "User agent of signer",
    })
  ),
  witnessName: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 100,
      description: "Name of witness (if required)",
    })
  ),
  witnessSignature: t.Optional(
    t.String({
      description: "Base64 encoded witness signature",
    })
  ),
});

/**
 * Contract document upload validation schema
 */
export const contractDocumentSchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 255,
    description: "Document name",
  }),
  type: t.Union([
    t.Literal("contract"),
    t.Literal("addendum"),
    t.Literal("amendment"),
    t.Literal("termination"),
    t.Literal("renewal"),
    t.Literal("other"),
  ]),
  description: t.Optional(
    t.String({
      maxLength: 500,
      description: "Document description",
    })
  ),
  file: t.File({
    maxSize: 10 * 1024 * 1024, // 10MB
    type: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    description: "Contract document file",
  }),
});

/**
 * Contract termination validation schema
 */
export const contractTerminationSchema = t.Object({
  terminationDate: commonSchemas.dateString,
  terminationReason: t.Union([
    t.Literal("mutual_agreement"),
    t.Literal("breach_of_contract"),
    t.Literal("non_payment"),
    t.Literal("property_sold"),
    t.Literal("tenant_relocation"),
    t.Literal("other"),
  ]),
  terminationNotice: t.Optional(
    t.String({
      minLength: 1,
      maxLength: 2000,
      description: "Termination notice details",
    })
  ),
  refundableDeposit: t.Optional(commonSchemas.currency),
  deductions: t.Optional(
    t.Array(
      t.Object({
        description: t.String({
          minLength: 1,
          maxLength: 200,
        }),
        amount: commonSchemas.currency,
      }),
      {
        maxItems: 20,
        description: "List of deductions from deposit",
      }
    )
  ),
  finalInspectionDate: t.Optional(commonSchemas.dateString),
  finalInspectionNotes: t.Optional(
    t.String({
      maxLength: 2000,
      description: "Final inspection notes",
    })
  ),
});

/**
 * Contract renewal validation schema
 */
export const contractRenewalSchema = t.Object({
  newStartDate: commonSchemas.dateString,
  newEndDate: commonSchemas.dateString,
  newRentAmount: t.Optional(commonSchemas.positiveNumber),
  newDepositAmount: t.Optional(commonSchemas.currency),
  newTerms: t.Optional(t.Array(contractTermSchema, { maxItems: 50 })),
  renewalNotes: t.Optional(
    t.String({
      maxLength: 1000,
      description: "Renewal notes",
    })
  ),
});

/**
 * Parameter validation schemas
 */
export const paramSchemas = {
  contractId: t.Object({
    contractId: commonSchemas.objectId,
  }),

  propertyId: t.Object({
    propertyId: commonSchemas.objectId,
  }),

  unitId: t.Object({
    unitId: commonSchemas.objectId,
  }),

  tenantId: t.Object({
    tenantId: commonSchemas.objectId,
  }),
};

/**
 * Response validation schemas
 */
export const responseSchemas = {
  success: t.Object({
    status: t.Literal("success"),
    message: t.Optional(t.String()),
    data: t.Optional(t.Any()),
  }),

  error: t.Object({
    status: t.Literal("error"),
    message: t.String(),
    code: t.Optional(t.String()),
    details: t.Optional(t.Any()),
  }),

  contractResponse: t.Object({
    status: t.Literal("success"),
    contract: t.Any(), // This would be the full contract object
  }),

  contractsResponse: t.Object({
    status: t.Literal("success"),
    contracts: t.Array(t.Any()),
    pagination: t.Optional(
      t.Object({
        page: t.Number(),
        limit: t.Number(),
        total: t.Number(),
        pages: t.Number(),
      })
    ),
  }),
};

/**
 * Custom validation functions
 */
export const customValidators = {
  /**
   * Validate that end date is after start date
   */
  validateDateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
  },

  /**
   * Validate that contract duration is reasonable
   */
  validateContractDuration: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);

    // Contract should be at least 30 days and at most 5 years
    return durationDays >= 30 && durationDays <= 5 * 365;
  },

  /**
   * Validate that start date is not in the past
   */
  validateFutureDate: (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  /**
   * Validate rental amounts are reasonable
   */
  validateRentalAmounts: (
    rentAmount: number,
    depositAmount: number
  ): boolean => {
    // Deposit should not be more than 6 months rent
    return depositAmount <= rentAmount * 6;
  },
};

/**
 * Validation error messages
 */
export const validationMessages = {
  required: "This field is required",
  invalidObjectId: "Invalid ID format",
  invalidDate: "Invalid date format (YYYY-MM-DD expected)",
  invalidEmail: "Invalid email format",
  invalidPhone: "Invalid phone number format",
  futureDate: "Date must be in the future",
  endDateAfterStart: "End date must be after start date",
  reasonableDuration: "Contract duration must be between 30 days and 5 years",
  reasonableDeposit: "Deposit amount should not exceed 6 months rent",
  rentDueDate: "Rent due date must be between 1 and 31",
  maxFileSize: "File size must not exceed 10MB",
  allowedFileTypes: "Only PDF, DOC, and DOCX files are allowed",
  maxTerms: "Maximum 50 terms allowed",
  maxConditions: "Maximum 20 special conditions allowed",
  maxDocuments: "Maximum 20 documents allowed",
  maxTenants: "Maximum 10 tenants allowed",
};
