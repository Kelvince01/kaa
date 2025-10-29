import type { Metadata } from "next";
import dynamic from "next/dynamic";

const PaymentHistoryClient = dynamic(
  () => import("@/routes/account/payments/payment-history"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Payment History | Kaa",
  description: "View your payment history and transaction details",
};

export default function PaymentHistoryPage() {
  return <PaymentHistoryClient />;
}
