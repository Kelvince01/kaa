import type { Metadata } from "next";
import { AmenityApprovalPanel } from "@/modules/properties/amenities/components/AmenityApprovalPanel";

export const metadata: Metadata = {
  title: "Amenity Approvals",
  description: "Review and approve auto-discovered amenities",
};

type AmenityApprovalsPageProps = {
  searchParams: {
    county?: string;
  };
};

export default function AmenityApprovalsPage({
  searchParams,
}: AmenityApprovalsPageProps) {
  const { county } = searchParams;

  return (
    <div className="container mx-auto py-6">
      <AmenityApprovalPanel county={county} />
    </div>
  );
}
