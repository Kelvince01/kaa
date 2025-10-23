import type { Metadata } from "next";
import { AmenityManagementDashboard } from "@/modules/properties/amenities/components/AmenityManagementDashboard";

export const metadata: Metadata = {
  title: "Amenity Management",
  description:
    "Manage amenities, approvals, and automated discovery for properties",
};

export default function AmenitiesPage() {
  return (
    <div className="container mx-auto py-6">
      <AmenityManagementDashboard />
    </div>
  );
}
