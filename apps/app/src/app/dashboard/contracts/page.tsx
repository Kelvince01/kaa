import type { Metadata } from "next";
import { ContractsContainer } from "@/routes/dashboard/contracts";

export const metadata: Metadata = {
  title: "Contracts | Dashboard",
  description: "Manage rental contracts, signatures, and documentation",
};

export default function ContractsPage() {
  return <ContractsContainer />;
}
