import { UserStatus } from "@kaa/models/types";
import { z } from "zod";

export const UserSchema = z.object({
  _id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  password: z.string(),
  role: z.string(),
  phone: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  role: z.object({
    _id: z.string(),
    name: z.string(),
  }),
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.SUSPENDED,
    UserStatus.PENDING,
    UserStatus.LOCKED,
  ]),
  phone: z.string().optional(),
  memberId: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
    })
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().optional(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UsersResponse = z.infer<typeof UserResponseSchema>[];

export const UserUpdateSchema = z
  .object({
    username: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    address: z.object({
      line1: z.string(),
      town: z.string(),
      postalCode: z.string(),
      county: z.string(),
      country: z.string(),
    }),
    role: z.string(),
    phone: z.string(),
  })
  .partial();

export type UserUpdate = z.infer<typeof UserUpdateSchema>;
