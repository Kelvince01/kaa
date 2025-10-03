import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const NewSubscriptionClient = dynamic(
  () => import("@/routes/account/subscriptions/new-subscription"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Create Recurring Payment | Kaa",
  description: "Set up a new recurring payment for your rental property",
};

export default function NewSubscriptionPage() {
  return <NewSubscriptionClient />;
}
