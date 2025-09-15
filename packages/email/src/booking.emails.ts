import config from "@kaa/config/api";
import emailService from "./email.service";

/**
 * Send booking notification email to landlord
 */
export const sendBookingNotificationEmail = async ({
  landlordEmail,
  landlordName,
  propertyTitle,
  tenantName,
  startDate,
  endDate,
  bookingType,
  totalAmount,
  specialRequests,
  bookingId,
}: {
  landlordEmail: string;
  landlordName: string;
  propertyTitle: string;
  tenantName: string;
  startDate: string;
  endDate?: string;
  bookingType: string;
  totalAmount: number;
  specialRequests?: string;
  bookingId: string;
}): Promise<boolean> => {
  const dashboardUrl = `${config.clientUrl}/dashboard/landlord/bookings/${bookingId}`;

  return await emailService.sendEmail({
    to: landlordEmail,
    subject: `New Booking Request for ${propertyTitle}`,
    template: "booking-notification",
    context: {
      landlordName,
      propertyTitle,
      tenantName,
      startDate: new Date(startDate).toLocaleDateString(),
      endDate: endDate ? new Date(endDate).toLocaleDateString() : "N/A",
      bookingType,
      totalAmount,
      specialRequests: specialRequests || "None",
      dashboardUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};

/**
 * Send booking status update email to tenant
 */
export const sendBookingStatusUpdateEmail = async ({
  tenantEmail,
  tenantName,
  propertyTitle,
  status,
  rejectionReason,
  startDate,
  endDate,
  totalAmount,
  bookingId,
}: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
  status: string;
  rejectionReason?: string;
  startDate: string;
  endDate?: string;
  totalAmount: number;
  bookingId: string;
}): Promise<boolean> => {
  // Determine status color and URLs
  let statusColor = "#4CAF50"; // Default green for approved
  if (status.toLowerCase() === "rejected") {
    statusColor = "#D32F2F"; // Red for rejected
  } else if (status.toLowerCase() === "pending") {
    statusColor = "#FF9800"; // Orange for pending
  }

  const paymentUrl = `${config.clientUrl}/dashboard/tenant/bookings/${bookingId}/payment`;

  return await emailService.sendEmail({
    to: tenantEmail,
    subject: `Booking ${status} - ${propertyTitle}`,
    template: "booking-status-update",
    context: {
      tenantName,
      propertyTitle,
      status,
      statusColor,
      isRejected: status.toLowerCase() === "rejected",
      isApproved: status.toLowerCase() === "approved",
      rejectionReason: rejectionReason || "No reason provided",
      startDate: new Date(startDate).toLocaleDateString(),
      endDate: endDate ? new Date(endDate).toLocaleDateString() : "N/A",
      totalAmount,
      paymentUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};

/**
 * Send booking cancellation email to landlord
 */
export const sendBookingCancellationEmail = async ({
  landlordEmail,
  landlordName,
  tenantName,
  propertyTitle,
  propertyId,
  startDate,
  endDate,
  cancellationReason,
}: {
  landlordEmail: string;
  landlordName: string;
  tenantName: string;
  propertyTitle: string;
  propertyId: string;
  startDate: string;
  endDate?: string;
  cancellationReason?: string;
}): Promise<boolean> => {
  const dashboardUrl = `${config.clientUrl}/dashboard/properties/${propertyId}`;

  return await emailService.sendEmail({
    to: landlordEmail,
    subject: `Booking Cancelled - ${propertyTitle}`,
    template: "booking-cancellation",
    context: {
      landlordName,
      tenantName,
      propertyTitle,
      startDate: new Date(startDate).toLocaleDateString(),
      endDate: endDate ? new Date(endDate).toLocaleDateString() : "N/A",
      cancellationReason,
      dashboardUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@kaa.co.ke",
      year: new Date().getFullYear(),
    },
  });
};
