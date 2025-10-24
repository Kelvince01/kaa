import type { Metadata } from "next";
import dynamic from "next/dynamic";

const SavedSearchesClient = dynamic(
  () => import("@/routes/account/saved-searches"),
  {
    ssr: true,
  }
);

export const metadata: Metadata = {
  title: "Saved Searches | Kaa",
  description: "View and manage your saved property searches and alerts.",
};

export default function SavedSearchesPage() {
  return <SavedSearchesClient />;
}
