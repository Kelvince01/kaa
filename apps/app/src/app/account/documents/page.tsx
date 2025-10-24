import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Import client component with dynamic loading
const AccountDocumentsClient = dynamic(
  () => import("@/routes/account/documents"),
  {
    ssr: true,
  }
);

// Define metadata for the page
export const metadata: Metadata = {
  title: "My Documents | Account",
  description: "View and manage your uploaded documents and identification",
};

export default function AccountDocumentsPage() {
  return <AccountDocumentsClient />;
}
