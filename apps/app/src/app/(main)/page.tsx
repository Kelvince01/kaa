import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import components that might use client-side features
const HomeContent = dynamic(() => import("@/routes/main"), {
  ssr: true,
});

export const metadata: Metadata = {
  title: "Find Rental Properties | Kaa",
  description:
    "Search thousands of rental properties across the UK. Connect directly with landlords, no middlemen.",
};

export default function HomePage() {
  return <HomeContent />;
}
