import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const SubscriptionsClient = dynamic(
  () => import("@/routes/account/subscriptions"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Recurring Payments | Kaa",
  description: "Manage your recurring payments and subscriptions",
};

export default function SubscriptionsPage() {
  return <SubscriptionsClient />;
}
