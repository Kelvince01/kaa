import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import the security client component
const SecurityContainer = dynamic(() => import("@/routes/dashboard/security"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Security Settings | Dashboard",
  description:
    "Manage your account security settings and two-factor authentication",
};

export default function SecurityPage() {
  return <SecurityContainer />;
}
