import { z } from "zod";

// Common validation schemas
export const commonSchemas = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
  email: z.string().email("Invalid email format"),
  //   kenyanPhone: z
  //     .string()
  //     .refine(validateKenyanPhone, "Invalid Kenyan phone number"),
  //   kenyanCounty: z
  //     .string()
  //     .refine(validateKenyanCounty, "Invalid Kenyan county"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  //   userRole: z.nativeEnum(UserRole),
  //   propertyType: z.nativeEnum(PropertyType),
  //   paymentMethod: z.nativeEnum(PaymentMethod),
};

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(Number)
    .refine((n) => n > 0, "Page must be positive")
    .default(1),
  limit: z
    .string()
    .transform(Number)
    .refine((n) => n > 0 && n <= 100, "Limit must be between 1 and 100")
    .default(10),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
