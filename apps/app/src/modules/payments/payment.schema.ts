import z from "zod";

// Input types
export const CreatePaymentSchema = z.object({
  amount: z.number().min(1),
  currency: z.string(),
  paymentMethodId: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const CreatePaymentMethodSchema = z.object({
  type: z.enum(["mpesa", "card", "bank"]),
  phoneNumber: z.string().optional(),
  cardNumber: z.string().optional(),
  expiryMonth: z.number().optional(),
  expiryYear: z.number().optional(),
  cvc: z.string().optional(),
});

export type CreatePaymentMethodInput = z.infer<
  typeof CreatePaymentMethodSchema
>;
