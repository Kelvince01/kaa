import { UserStatus } from "@kaa/models/types";
import { type Static, t } from "elysia";

export const UserResponseSchema = t.Object({
  id: t.String(),
  username: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  email: t.String(),
  role: t.Optional(
    t.Object({
      _id: t.String(),
      name: t.String(),
    })
  ),
  status: t.Enum(UserStatus),
  phone: t.Optional(t.String()),
  memberId: t.Optional(
    t.Object({
      _id: t.Optional(t.String()),
      name: t.Optional(t.String()),
    })
  ),
  createdAt: t.Date(),
  updatedAt: t.Date(),
  lastLoginAt: t.Optional(t.Date()),
});

export type UserResponse = Static<typeof UserResponseSchema>;
export type UsersResponse = Static<typeof UserResponseSchema>[];

export const UserUpdateSchema = t.Partial(
  t.Object({
    username: t.String(),
    email: t.String(),
    firstName: t.String(),
    lastName: t.String(),
    address: t.Object({
      line1: t.String(),
      town: t.String(),
      postalCode: t.String(),
      county: t.String(),
      country: t.String(),
    }),
    role: t.String(),
    phone: t.String(),
  })
);
