import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the ProfileClient component with SSR disabled
const ProfileClient = dynamic(() => import("@/routes/dashboard/profile"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Profile | Dashboard",
  description: "Manage your profile information and account settings",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
