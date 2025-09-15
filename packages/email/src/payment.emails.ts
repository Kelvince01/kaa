import config from "@kaa/config/api";
import { DateTime } from "luxon";
import emailService from "./email.service";

/**
 * Send payment reminder email to tenant
 */
export const sendPaymentReminderEmail = async ({
  tenantEmail,
  tenantName,
  propertyName,
  unitNumber,
  amount,
  dueDate,
  paymentLink,
}: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  paymentLink?: string;
}): Promise<boolean> => {
  // Generate payment link if not provided
  const paymentUrl =
    paymentLink || `${config.clientUrl}/dashboard/tenant/payments`;

  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `Rent Payment Reminder for ${propertyName}`,
    template: "payment-reminder",
    context: {
      tenantName,
      propertyName,
      unitNumber,
      amount,
      dueDate: DateTime.fromISO(dueDate).toLocaleString(DateTime.DATE_MED),
      paymentLink: paymentUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
      logoUrl: `${config.clientUrl}/logo.png`,
    },
  });
};

/**
 * Send payment receipt email to tenant
 */
export const sendPaymentReceiptEmail = async ({
  tenantEmail,
  tenantName,
  propertyName,
  unitNumber,
  amount,
  paymentDate,
  receiptNumber,
  transactionId,
  receiptLink,
}: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  paymentDate: string;
  receiptNumber: string;
  transactionId: string;
  receiptLink?: string;
}): Promise<boolean> => {
  // Generate receipt link if not provided
  const receiptUrl =
    receiptLink ||
    `${config.clientUrl}/dashboard/tenant/payments/receipts/${receiptNumber}`;

  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `Payment Receipt - ${receiptNumber}`,
    template: "payment-receipt",
    context: {
      tenantName,
      propertyName,
      unitNumber,
      amount,
      paymentDate: DateTime.fromISO(paymentDate).toLocaleString(
        DateTime.DATE_MED
      ),
      receiptNumber,
      transactionId,
      receiptLink: receiptUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
      logoUrl: `${config.clientUrl}/logo.png`,
    },
  });
};

/**
 * Send payment overdue email to tenant
 */
export const sendPaymentOverdueEmail = async ({
  tenantEmail,
  tenantName,
  propertyName,
  unitNumber,
  amount,
  dueDate,
  daysOverdue,
  paymentLink,
}: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentLink?: string;
}): Promise<boolean> => {
  // Generate payment link if not provided
  const paymentUrl =
    paymentLink || `${config.clientUrl}/dashboard/tenant/payments`;

  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `Urgent: Overdue Rent Payment for ${propertyName}`,
    template: "payment-overdue",
    context: {
      tenantName,
      propertyName,
      unitNumber,
      amount,
      dueDate: DateTime.fromISO(dueDate).toLocaleString(DateTime.DATE_MED),
      daysOverdue,
      paymentLink: paymentUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
      logoUrl: `${config.clientUrl}/logo.png`,
    },
  });
};
