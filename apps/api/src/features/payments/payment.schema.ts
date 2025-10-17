import { PaymentStatus, PaymentType } from "@kaa/models/types";
import { type Static, t } from "elysia";

export const paymentFiltersSchema = t.Object({
  status: t.Optional(t.String()),
  paymentType: t.Optional(t.String()),
  propertyId: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  search: t.Optional(t.String()),
  sortBy: t.Optional(t.String()),
  sortOrder: t.Optional(t.Enum({ asc: "asc", desc: "desc" })),
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  includeSubscriptions: t.Optional(t.Boolean()),
});

export type PaymentFilters = Static<typeof paymentFiltersSchema>;

export const paymentSchema = t.Object({
  _id: t.String(),
  amount: t.Number(),
  currency: t.String(),
  status: t.Enum(PaymentStatus),
  paymentType: t.Enum(PaymentType),
  paymentMethod: t.String(),
  paymentIntentId: t.String(),
  stripeChargeId: t.Optional(t.String()),
  description: t.Optional(t.String()),
  metadata: t.Optional(t.Object(t.Any())),
  tenant: t.String(),
  booking: t.String(),
  landlord: t.String(),
  property: t.Optional(t.String()),
  contract: t.Optional(t.String()),
  receiptUrl: t.Optional(t.String()),
  refunded: t.Optional(t.Boolean()),
  refundAmount: t.Optional(t.Number()),
  refundId: t.Optional(t.String()),
  transactionId: t.Optional(t.String()),
  referenceNumber: t.Optional(t.String()),
  completedAt: t.Optional(t.Date()),
  paymentDate: t.Optional(t.Date()),
  paymentDetails: t.Optional(t.Object(t.Any())),
  notes: t.Optional(t.String()),
});
// .default({
// 	currency: "KES",
// 	status: PaymentStatus.PENDING,
// 	refunded: false,
// 	refundAmount: 0,
// 	refundId: "",
// 	transactionId: "",
// 	referenceNumber: "",
// 	completedAt: new Date(),
// 	paymentDate: new Date(),
// 	paymentDetails: {},
// 	notes: "",
// });
export const createPaymentSchema = t.Omit(paymentSchema, ["_id"]);
export const updatePaymentSchema = t.Optional(createPaymentSchema);

export type PaymentResponse = Static<typeof paymentSchema>;
export type CreatePayment = Static<typeof createPaymentSchema>;
export type UpdatePayment = Static<typeof updatePaymentSchema>;

export const paymentsResponseSchema = t.Object({
  payments: t.Array(paymentSchema),
  pagination: t.Object({
    total: t.Number(),
    pages: t.Number(),
    hasNextPage: t.Boolean(),
    hasPreviousPage: t.Boolean(),
    limit: t.Number(),
  }),
});
export type PaymentsResponse = Static<typeof paymentsResponseSchema>;
