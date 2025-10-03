import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const AccountSettingsClient = dynamic(
  () => import("@/routes/account/settings"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "Account Settings | Kaa",
  description: "Manage your account settings and preferences",
};

export default function AccountSettingsPage() {
  return <AccountSettingsClient />;
}
