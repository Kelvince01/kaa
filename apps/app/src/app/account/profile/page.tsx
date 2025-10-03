import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the client component
const ProfileClient = dynamic(() => import("@/routes/account/profile"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "My Profile | Kaa",
  description: "Manage your personal profile information and account settings.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
