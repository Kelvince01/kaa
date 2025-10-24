import * as z from "zod";

/**
 * Phone number regex for Kenyan numbers (254...)
 */
const KENYA_PHONE_REGEX = /^254[17]\d{8}$/;

/**
 * Schema for wallet deposit
 */
export const depositSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum deposit amount is KES 10")
    .max(150_000, "Maximum deposit amount is KES 150,000"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(KENYA_PHONE_REGEX, "Invalid phone number format. Use 254XXXXXXXXX"),
});

export type DepositFormValues = z.infer<typeof depositSchema>;

/**
 * Schema for wallet withdrawal
 */
export const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(10, "Minimum withdrawal amount is KES 10")
    .max(150_000, "Maximum withdrawal amount is KES 150,000"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(KENYA_PHONE_REGEX, "Invalid phone number format. Use 254XXXXXXXXX"),
});

export type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

/**
 * Schema for rent payment from wallet
 */
export const payRentSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  applicationId: z.string().min(1, "Application is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
});

export type PayRentFormValues = z.infer<typeof payRentSchema>;

/**
 * Schema for wallet transfer
 */
export const transferSchema = z.object({
  recipientPhone: z
    .string()
    .min(1, "Recipient phone number is required")
    .regex(KENYA_PHONE_REGEX, "Invalid phone number format. Use 254XXXXXXXXX"),
  amount: z
    .number()
    .min(1, "Minimum transfer amount is KES 1")
    .max(150_000, "Maximum transfer amount is KES 150,000"),
  note: z.string().max(200, "Note must be 200 characters or less").optional(),
});

export type TransferFormValues = z.infer<typeof transferSchema>;

/**
 * Schema for transaction filters
 */
export const transactionFilterSchema = z.object({
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
  type: z
    .enum([
      "deposit",
      "withdrawal",
      "rent_payment",
      "deposit_payment",
      "refund",
      "commission",
      "transfer",
    ])
    .optional(),
  status: z
    .enum(["pending", "processing", "completed", "failed", "reversed"])
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type TransactionFilterFormValues = z.infer<
  typeof transactionFilterSchema
>;
