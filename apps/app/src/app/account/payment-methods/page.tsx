import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const PaymentMethodsClient = dynamic(
  () => import("@/routes/account/payments/payment-methods-list"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Payment Methods | Kaa",
  description: "Manage your payment methods for renting properties",
};

export default function PaymentMethodsPage() {
  return <PaymentMethodsClient />;
}
