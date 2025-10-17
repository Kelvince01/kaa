import type { PaymentRecurrenceFrequency } from "@kaa/models/types";
import { RecurringPaymentService, SchedulerService } from "@kaa/services";
import { Elysia, t } from "elysia";

export const recurringPaymentsController = new Elysia({
  prefix: "/recurring",
})
  .post(
    "/",
    async ({ body }) =>
      await RecurringPaymentService.createRecurringPayment({
        ...body,
        frequency: body.frequency as PaymentRecurrenceFrequency,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate as string),
      }),
    {
      body: t.Object({
        tenantId: t.String(),
        landlordId: t.String(),
        propertyId: t.String(),
        contractId: t.String(),
        amount: t.Number(),
        currency: t.Optional(t.String()),
        paymentType: t.String(),
        description: t.String(),
        frequency: t.String(),
        startDate: t.String(),
        endDate: t.Optional(t.String()),
        paymentMethodId: t.String(),
        gracePeriodDays: t.Optional(t.Number()),
        lateFeeAmount: t.Optional(t.Number()),
        lateFeePercentage: t.Optional(t.Number()),
      }),
    }
  )

  .get(
    "/tenant/:tenantId",
    async ({ params }) =>
      await RecurringPaymentService.getRecurringPaymentsByTenant(
        params.tenantId
      )
  )

  .get(
    "/landlord/:landlordId",
    async ({ params }) =>
      await RecurringPaymentService.getRecurringPaymentsByLandlord(
        params.landlordId
      )
  )

  .patch(
    "/:id/pause",
    async ({ params }) =>
      await RecurringPaymentService.pauseRecurringPayment(params.id)
  )

  .patch(
    "/:id/resume",
    async ({ params }) =>
      await RecurringPaymentService.resumeRecurringPayment(params.id)
  )

  .patch(
    "/:id/cancel",
    async ({ params }) =>
      await RecurringPaymentService.cancelRecurringPayment(params.id)
  )

  .post("/process-due", async () => {
    await SchedulerService.runTask("process_due_payments");
    return { message: "Due payments processed successfully" };
  })

  .post("/process-late-fees", async () => {
    await SchedulerService.runTask("process_late_fees");
    return { message: "Late fees processed successfully" };
  })

  .post("/send-reminders", async () => {
    await SchedulerService.runTask("send_payment_reminders");
    return { message: "Payment reminders sent successfully" };
  });
