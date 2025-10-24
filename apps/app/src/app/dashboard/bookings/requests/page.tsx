import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import client components
const BookingRequestsClient = dynamic(
  () => import("@/routes/dashboard/bookings/requests"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Booking Requests | Dashboard",
  description: "Manage your property booking requests in one place.",
};

export default function BookingRequestsPage() {
  return <BookingRequestsClient />;
}
