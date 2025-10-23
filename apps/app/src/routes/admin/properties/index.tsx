"use client";

import { Heading } from "@kaa/ui/components/heading";
import { Separator } from "@kaa/ui/components/separator";
import { useState } from "react";
import {
  useDeleteProperty,
  useTogglePropertyFeatured,
  useTogglePropertyVerification,
} from "@/modules/properties/property.mutations";
import { useProperties } from "@/modules/properties/property.queries";
import type { Property } from "@/modules/properties/property.type";
import { columns } from "./columns";
import { PropertyDataTable } from "./data-table";
import { PropertyManagementFilters } from "./filters";

export default function AdminProperties() {
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFeaturedModalOpen, setIsFeaturedModalOpen] = useState(false);

  const { data, isLoading } = useProperties({
    page: currentPage,
    limit: 10,
    // status: propertyStatus || undefined,
    // search: searchTerm || undefined,
  });

  const deleteMutation = useDeleteProperty();
  const toggleFeaturedMutation = useTogglePropertyFeatured();
  const toggleVerificationMutation = useTogglePropertyVerification();

  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(selectedProperty?._id as string);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const handleToggleFeatured = (property: Property) => {
    setSelectedProperty(property);
    setIsFeaturedModalOpen(true);
  };

  const confirmToggleFeatured = async () => {
    try {
      await toggleFeaturedMutation.mutateAsync({
        id: selectedProperty?._id as string,
        featured: !selectedProperty?.featured,
      });

      setIsFeaturedModalOpen(false);
    } catch (error) {
      console.error("Error updating property featured status:", error);
    }
  };

  const handleVerify = async (propertyId: string, isVerified: boolean) => {
    try {
      await toggleVerificationMutation.mutateAsync({
        id: propertyId,
        verified: isVerified,
      });
    } catch (error) {
      console.error("Error updating property verification:", error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-start justify-between">
        <Heading
          description="Review, verify, and manage property listings"
          title="Property Management"
        />
      </div>

      <Separator />

      <PropertyManagementFilters
        propertyStatus={propertyStatus}
        searchTerm={searchTerm}
        setPropertyStatus={setPropertyStatus}
        setSearchTerm={setSearchTerm}
      />

      <PropertyDataTable
        columns={columns}
        confirmDelete={confirmDelete}
        confirmToggleFeatured={confirmToggleFeatured}
        currentPage={currentPage}
        data={data?.properties as Property[]}
        isDeleteModalOpen={isDeleteModalOpen}
        isFeaturedModalOpen={isFeaturedModalOpen}
        isLoading={isLoading}
        onDelete={handleDelete}
        onToggleFeatured={handleToggleFeatured}
        onVerify={handleVerify}
        selectedProperty={selectedProperty}
        setCurrentPage={setCurrentPage}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        setIsFeaturedModalOpen={setIsFeaturedModalOpen}
        totalPages={data?.pagination.pages as number}
      />
    </div>
  );
}
