import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const PaymentMethodFormClient = dynamic(
  () => import("@/routes/account/payments/payment-method-form"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Add Payment Method | Kaa",
  description: "Add a new payment method for your rental property",
};

export default function NewPaymentMethodPage() {
  return <PaymentMethodFormClient />;
}
