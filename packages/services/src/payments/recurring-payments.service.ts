import { Payment, RecurringPayment } from "@kaa/models";
import {
  type IRecurringPayment,
  PaymentRecurrenceFrequency,
  PaymentStatus,
  PaymentType,
  RecurringPaymentStatus,
} from "@kaa/models/types";
import { DateTime } from "luxon";
import type mongoose from "mongoose";
import {
  sendLateFeeNotification,
  sendPaymentDueNotification,
  sendPaymentFailureNotification,
  sendPaymentReminderNotification,
} from "../comms/notification.factory";

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class RecurringPaymentService {
  /**
   * Create a new recurring payment schedule
   */
  static async createRecurringPayment(
    data: Partial<IRecurringPayment>
  ): Promise<IRecurringPayment> {
    const recurringPayment = new RecurringPayment({
      ...data,
      nextPaymentDate: data.startDate,
    });

    await recurringPayment.save();
    return recurringPayment;
  }

  /**
   * Process all due recurring payments
   */
  static async processDuePayments(): Promise<void> {
    const now = new Date();

    const duePayments = await RecurringPayment.find({
      status: RecurringPaymentStatus.ACTIVE,
      nextPaymentDate: { $lte: now },
    }).populate([
      "tenant",
      "landlord",
      "property",
      "contract",
      "paymentMethod",
    ]);

    for (const recurringPayment of duePayments) {
      try {
        await RecurringPaymentService.processRecurringPayment(recurringPayment);
      } catch (error) {
        console.error(
          `Failed to process recurring payment ${recurringPayment._id}:`,
          error
        );
      }
    }
  }

  /**
   * Process a single recurring payment
   */
  private static async processRecurringPayment(
    recurringPayment: IRecurringPayment
  ): Promise<void> {
    try {
      // Create payment record
      const payment = new Payment({
        amount: recurringPayment.amount,
        currency: recurringPayment.currency,
        type: recurringPayment.paymentType as PaymentType,
        description: recurringPayment.description,
        dueDate: recurringPayment.nextPaymentDate,
        tenant: recurringPayment.tenant,
        landlord: recurringPayment.landlord,
        property: recurringPayment.property,
        contract: recurringPayment.contract,
        paymentMethod: recurringPayment.paymentMethod,
        status: PaymentStatus.PENDING,
        paymentIntentId: `recurring_${recurringPayment._id}_${Date.now()}`,
        metadata: {
          recurringPaymentId: recurringPayment._id,
          isRecurring: true,
        },
      });

      await payment.save();

      // Update recurring payment
      recurringPayment.generatedPayments.push(
        payment._id as mongoose.Types.ObjectId
      );
      recurringPayment.totalPayments += 1;
      recurringPayment.lastPaymentDate = new Date();
      recurringPayment.nextPaymentDate =
        RecurringPaymentService.calculateNextPaymentDate(recurringPayment);

      // Check if recurring payment should end
      if (
        recurringPayment.endDate &&
        DateTime.fromJSDate(recurringPayment.nextPaymentDate).toMillis() >
          DateTime.fromJSDate(recurringPayment.endDate).toMillis()
      ) {
        recurringPayment.status = RecurringPaymentStatus.COMPLETED;
      }

      await recurringPayment.save();

      // Send notification
      if (recurringPayment.notifyOnSuccess) {
        await sendPaymentDueNotification(payment);
      }
    } catch (error) {
      // Update failure count
      recurringPayment.failedPayments += 1;
      recurringPayment.lastPaymentStatus = "failed";
      await recurringPayment.save();

      // Send failure notification
      if (recurringPayment.notifyOnFailure) {
        await sendPaymentFailureNotification(
          recurringPayment,
          (error as Error).message
        );
      }

      throw error;
    }
  }

  /**
   * Calculate next payment date based on frequency
   */
  private static calculateNextPaymentDate(
    recurringPayment: IRecurringPayment
  ): Date {
    const currentDate = recurringPayment.nextPaymentDate;

    switch (recurringPayment.frequency) {
      case PaymentRecurrenceFrequency.DAILY:
        return DateTime.fromJSDate(currentDate).plus({ days: 1 }).toJSDate();

      case PaymentRecurrenceFrequency.WEEKLY:
        return DateTime.fromJSDate(currentDate).plus({ weeks: 1 }).toJSDate();

      case PaymentRecurrenceFrequency.MONTHLY:
        // biome-ignore lint/correctness/noSwitchDeclarations: ignore
        const nextMonth = DateTime.fromJSDate(currentDate)
          .plus({ months: 1 })
          .toJSDate();
        if (recurringPayment.dayOfMonth) {
          nextMonth.setDate(
            Math.min(
              recurringPayment.dayOfMonth,
              RecurringPaymentService.getDaysInMonth(nextMonth)
            )
          );
        }
        return nextMonth;

      case PaymentRecurrenceFrequency.QUARTERLY:
        return DateTime.fromJSDate(currentDate).plus({ months: 3 }).toJSDate();

      case PaymentRecurrenceFrequency.ANNUALLY:
        return DateTime.fromJSDate(currentDate).plus({ years: 1 }).toJSDate();

      default:
        return DateTime.fromJSDate(currentDate).plus({ months: 1 }).toJSDate();
    }
  }

  /**
   * Get number of days in a month
   */
  private static getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Send payment reminders
   */
  static async sendPaymentReminders(): Promise<void> {
    const reminderDate = DateTime.now();

    const upcomingPayments = await RecurringPayment.find({
      status: RecurringPaymentStatus.ACTIVE,
      nextPaymentDate: {
        $gte: reminderDate.toJSDate(),
        $lte: reminderDate.plus({ days: 7 }).toJSDate(), // Next 7 days
      },
    }).populate(["tenant", "landlord", "property"]);

    for (const recurringPayment of upcomingPayments) {
      const daysUntilDue = Math.ceil(
        (recurringPayment.nextPaymentDate.getTime() - reminderDate.toMillis()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue <= recurringPayment.notifyBeforeDays) {
        await sendPaymentReminderNotification(recurringPayment, daysUntilDue);
      }
    }
  }

  /**
   * Process late fees for overdue payments
   */
  static async processLateFees(): Promise<void> {
    const now = new Date();

    const overduePayments = await Payment.find({
      status: { $in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      dueDate: { $lt: now },
      "latePayment.penaltyApplied": false,
    }).populate("tenant landlord property");

    for (const payment of overduePayments) {
      const daysLate = Math.ceil(
        (now.getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find associated recurring payment for late fee settings
      const recurringPayment = await RecurringPayment.findOne({
        generatedPayments: payment._id,
      });

      if (
        recurringPayment &&
        daysLate > recurringPayment.applyLateFeeAfterDays
      ) {
        await RecurringPaymentService.applyLateFee(
          payment,
          recurringPayment,
          daysLate
        );
      }
    }
  }

  /**
   * Apply late fee to a payment
   */
  private static async applyLateFee(
    payment: any,
    recurringPayment: IRecurringPayment,
    daysLate: number
  ): Promise<void> {
    let lateFeeAmount = 0;

    // Calculate late fee
    if (recurringPayment.lateFeeAmount > 0) {
      lateFeeAmount = recurringPayment.lateFeeAmount;
    } else if (recurringPayment.lateFeePercentage > 0) {
      lateFeeAmount =
        (payment.amount * recurringPayment.lateFeePercentage) / 100;
    }

    if (lateFeeAmount > 0) {
      // Update payment with late fee
      payment.latePayment = {
        isLate: true,
        daysLate,
        penaltyAmount: lateFeeAmount,
        penaltyApplied: true,
      };

      await payment.save();

      // Create separate late fee payment
      const lateFeePayment = new Payment({
        amount: lateFeeAmount,
        currency: payment.currency,
        type: PaymentType.PENALTY,
        description: `Late fee for payment ${payment.referenceNumber}`,
        dueDate: new Date(),
        tenant: payment.tenant,
        landlord: payment.landlord,
        property: payment.property,
        contract: payment.contract,
        paymentMethod: payment.paymentMethod,
        status: PaymentStatus.PENDING,
        paymentIntentId: `late_fee_${payment._id}_${Date.now()}`,
        metadata: {
          originalPaymentId: payment._id,
          isLateFee: true,
          daysLate,
        },
      });

      await lateFeePayment.save();

      // Send late fee notification
      await sendLateFeeNotification(payment, lateFeePayment, daysLate);
    }
  }

  /**
   * Pause a recurring payment
   */
  static async pauseRecurringPayment(id: string): Promise<IRecurringPayment> {
    const recurringPayment = await RecurringPayment.findByIdAndUpdate(
      id,
      { status: RecurringPaymentStatus.PAUSED },
      { new: true }
    );

    if (!recurringPayment) {
      throw new Error("Recurring payment not found");
    }

    return recurringPayment;
  }

  /**
   * Resume a paused recurring payment
   */
  static async resumeRecurringPayment(id: string): Promise<IRecurringPayment> {
    const recurringPayment = await RecurringPayment.findByIdAndUpdate(
      id,
      { status: RecurringPaymentStatus.ACTIVE },
      { new: true }
    );

    if (!recurringPayment) {
      throw new Error("Recurring payment not found");
    }

    return recurringPayment;
  }

  /**
   * Cancel a recurring payment
   */
  static async cancelRecurringPayment(id: string): Promise<IRecurringPayment> {
    const recurringPayment = await RecurringPayment.findByIdAndUpdate(
      id,
      { status: RecurringPaymentStatus.CANCELLED },
      { new: true }
    );

    if (!recurringPayment) {
      throw new Error("Recurring payment not found");
    }

    return recurringPayment;
  }

  /**
   * Get recurring payments for a tenant
   */
  static async getRecurringPaymentsByTenant(
    tenantId: string
  ): Promise<IRecurringPayment[]> {
    return await RecurringPayment.find({ tenant: tenantId })
      .populate("landlord property contract paymentMethod")
      .sort({ createdAt: -1 });
  }

  /**
   * Get recurring payments for a landlord
   */
  static async getRecurringPaymentsByLandlord(
    landlordId: string
  ): Promise<IRecurringPayment[]> {
    return await RecurringPayment.find({ landlord: landlordId })
      .populate("tenant property contract paymentMethod")
      .sort({ createdAt: -1 });
  }
}
