import { isValidPhoneNumber } from "react-phone-number-input";
import z from "zod";
import { UserRole, UserStatus } from "./user.type";

export const createUserSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" }),
    email: z.email({ message: "Please enter a valid email address" }),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: "Invalid phone number",
      }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character",
      }),
    confirmPassword: z
      .string()
      .min(8, { message: "Please confirm your password" }),
    role: z.enum(UserRole, { message: "Please select a valid role" }),
    status: z.enum(UserStatus).optional(),
    memberId: z.string().min(1, { message: "Member ID is required" }),
    sendWelcomeEmail: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .optional(),
  lastName: z.string().min(1, { message: "Last name is required" }).optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: "Invalid phone number",
    }),
  role: z.enum(UserRole).optional(),
  status: z.enum(UserStatus).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  avatar: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, {
        message: "Password must contain at least one special character",
      }),
    confirmNewPassword: z
      .string()
      .min(8, { message: "Please confirm your new password" }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// Schema for the user form (create/update)
export const userFormSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  username: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .optional(),
  role: z.enum(["admin", "user", "manager"] as const, "Please select a role"),
  status: z.enum(["active", "inactive", "suspended"] as const).optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const userFilterSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(UserStatus).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type UserFilterFormValues = z.infer<typeof userFilterSchema>;
