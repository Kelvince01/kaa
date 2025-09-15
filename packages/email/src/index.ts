// Export all email functions
export {
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./auth.emails";
export {
  sendBookingCancellationEmail,
  sendBookingNotificationEmail,
  sendBookingStatusUpdateEmail,
} from "./booking.emails";
// Export the service itself for direct use if needed
export { default as emailService } from "./email.service";
export { sendIncidentNotificationEmail } from "./monitoring.emails";
export { sendNotificationEmail } from "./notification.emails";
export {
  sendPaymentOverdueEmail,
  sendPaymentReceiptEmail,
  sendPaymentReminderEmail,
} from "./payment.emails";

export {
  sendReferenceCompletedEmail,
  sendReferenceDeclinedEmail,
  sendReferenceProviderWelcomeEmail,
  sendReferenceReminderEmail,
  sendReferenceRequestEmail,
  sendTenantVerificationStatusEmail,
} from "./reference.emails";
export { sendMonthlyReportEmail } from "./report.emails";
