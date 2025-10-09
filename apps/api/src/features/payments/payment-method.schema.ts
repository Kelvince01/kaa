import { type Static, t } from "elysia";

export const paymentMethodSchema = t.Object({
  _id: t.String(),
  userId: t.String(),
  memberId: t.String(),
  type: t.String(),
  details: t.Object({
    mpesaTransactionId: t.Optional(t.String()),
    mpesaReceiptNumber: t.Optional(t.String()),
    mpesaPhoneNumber: t.Optional(t.String()),
    bankReference: t.Optional(t.String()),
    bankName: t.Optional(t.String()),
    accountNumber: t.Optional(t.String()),
    chequeNumber: t.Optional(t.String()),
    bankDrawn: t.Optional(t.String()),
    cardType: t.Optional(t.String()),
    cardLast4: t.Optional(t.String()),
    expMonth: t.Optional(t.Number()),
    expYear: t.Optional(t.Number()),
  }),
  isDefault: t.Boolean(),
});

export const createPaymentMethodSchema = t.Object({
  userId: t.String(),
  memberId: t.String(),
  type: t.String(),
  details: t.Object({
    mpesaTransactionId: t.Optional(t.String()),
    mpesaReceiptNumber: t.Optional(t.String()),
    mpesaPhoneNumber: t.Optional(t.String()),
    bankReference: t.Optional(t.String()),
    bankName: t.Optional(t.String()),
    accountNumber: t.Optional(t.String()),
    chequeNumber: t.Optional(t.String()),
    bankDrawn: t.Optional(t.String()),
    cardType: t.Optional(t.String()),
    cardLast4: t.Optional(t.String()),
    expMonth: t.Optional(t.Number()),
    expYear: t.Optional(t.Number()),
  }),
  isDefault: t.Boolean(),
});

export const updatePaymentMethodSchema = t.Optional(createPaymentMethodSchema);

export type PaymentMethodResponse = Static<typeof paymentMethodSchema>;
export type CreatePaymentMethodRequest = Static<
  typeof createPaymentMethodSchema
>;
export type UpdatePaymentMethodRequest = Static<
  typeof updatePaymentMethodSchema
>;
