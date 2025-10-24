"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { use, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import LandlordForm from "@/modules/landlords/components/landlord-form";
import {
  useDeleteLandlord,
  useLandlords,
  useVerifyLandlord,
} from "@/modules/landlords/landlord.queries";
import type {
  Landlord,
  LandlordQueryParams,
} from "@/modules/landlords/landlord.type";
import LandlordTable from "@/modules/landlords/table";
import type { SearchParams } from "@/shared/types";

export default function LandlordsManagement({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page, limit, sortBy, sortOrder } = use(searchParams);
  const [queryParams, setQueryParams] = useState<LandlordQueryParams>({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    sortBy: (sortBy as string) || "createdAt",
    sortOrder: (sortOrder as "asc" | "desc") || "desc",
  });

  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(
    null
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Queries and mutations
  const { data: landlordsData, isLoading } = useLandlords(queryParams);
  const deleteLandlordMutation = useDeleteLandlord();
  const verifyLandlordMutation = useVerifyLandlord();

  // Event handlers
  const handleView = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setIsViewSheetOpen(true);
  };

  const handleEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast.success("Landlord created successfully");
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    toast.success("Landlord updated successfully");
  };

  const confirmDelete = async () => {
    if (!selectedLandlord) return;

    try {
      await deleteLandlordMutation.mutateAsync(selectedLandlord._id);
      setIsDeleteDialogOpen(false);
      setSelectedLandlord(null);
      toast.success("Landlord deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete landlord");
    }
  };

  const handleVerify = async (landlord: Landlord) => {
    try {
      await verifyLandlordMutation.mutateAsync(landlord._id);
      toast.success("Landlord verification updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update verification");
    }
  };

  const renderLandlordDetails = (landlord: Landlord) => {
    const displayName =
      landlord.landlordType === "individual"
        ? `${landlord.personalInfo?.firstName || ""} ${landlord.personalInfo?.lastName || ""}`.trim()
        : landlord.businessInfo?.companyName || "";

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="name"
              >
                Name
              </label>
              <p className="text-gray-900 text-sm">{displayName}</p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="type"
              >
                Type
              </label>
              <p className="text-gray-900 text-sm capitalize">
                {landlord.landlordType.replace("_", " ")}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="status"
              >
                Status
              </label>
              <p className="text-gray-900 text-sm capitalize">
                {landlord.status.replace("_", " ")}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="verification"
              >
                Verification
              </label>
              <p className="text-gray-900 text-sm capitalize">
                {landlord.verification.status.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="email"
              >
                Email
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.personalInfo?.email ||
                  landlord.businessInfo?.authorizedPersons?.[0]?.email ||
                  "N/A"}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="phone"
              >
                Phone
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.personalInfo?.phone ||
                  landlord.businessInfo?.authorizedPersons?.[0]?.phone ||
                  "N/A"}
              </p>
            </div>
            <div className="md:col-span-2">
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="address"
              >
                Address
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.contactInfo.primaryAddress.street},{" "}
                {landlord.contactInfo.primaryAddress.city},{" "}
                {landlord.contactInfo.primaryAddress.state},{" "}
                {landlord.contactInfo.primaryAddress.country}
              </p>
            </div>
          </div>
        </div>

        {/* Property Statistics */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Property Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="font-bold text-2xl text-blue-600">
                {landlord.propertyStats.totalProperties}
              </p>
              <p className="text-gray-500 text-sm">Total Properties</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-green-600">
                {landlord.propertyStats.activeProperties}
              </p>
              <p className="text-gray-500 text-sm">Active Properties</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-purple-600">
                {landlord.propertyStats.totalUnits}
              </p>
              <p className="text-gray-500 text-sm">Total Units</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-orange-600">
                {landlord.performanceMetrics.occupancyRate.toFixed(1)}%
              </p>
              <p className="text-gray-500 text-sm">Occupancy Rate</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="propertyManagementRating"
              >
                Property Management Rating
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.performanceMetrics.propertyManagementRating}/5
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="tenantSatisfactionRating"
              >
                Tenant Satisfaction
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.performanceMetrics.tenantSatisfactionRating}/5
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="rentCollectionRate"
              >
                Rent Collection Rate
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.performanceMetrics.rentCollectionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Risk Assessment
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="riskLevel"
              >
                Risk Level
              </label>
              <p
                className={`font-medium text-sm capitalize ${
                  landlord.riskAssessment.riskLevel === "low"
                    ? "text-green-600"
                    : landlord.riskAssessment.riskLevel === "medium"
                      ? "text-yellow-600"
                      : landlord.riskAssessment.riskLevel === "high"
                        ? "text-orange-600"
                        : "text-red-600"
                }`}
              >
                {landlord.riskAssessment.riskLevel.replace("_", " ")}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="riskScore"
              >
                Risk Score
              </label>
              <p className="text-gray-900 text-sm">
                {landlord.riskAssessment.overallRiskScore}/100
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Shell className="gap-4">
      {/* <div className="flex items-center justify-between"> */}
      {/* <div>
					<h1 className="font-bold text-3xl tracking-tight">Landlord Management</h1>
					<p className="text-muted-foreground">Manage and oversee all landlords in the system</p>
				</div> */}

      {/* <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={handleCreateNew}>
							<Plus className="mr-2 h-4 w-4" />
							Add Landlord
						</Button>
					</DialogTrigger>
					<DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
						<DialogHeader>
							<DialogTitle>Create New Landlord</DialogTitle>
							<DialogDescription>
								Add a new landlord to the system. Fill in the required information below.
							</DialogDescription>
						</DialogHeader>
						<LandlordForm onSuccess={handleCreateSuccess} />
					</DialogContent>
				</Dialog>
			</div> */}

      {/* Landlords Table */}
      <LandlordTable
        data={landlordsData?.items || []}
        isLoading={isLoading}
        onCreateNew={handleCreateNew}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onView={handleView}
      />

      {/* View Landlord Sheet */}
      <Sheet onOpenChange={setIsViewSheetOpen} open={isViewSheetOpen}>
        <SheetContent className="w-[600px] overflow-y-auto sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Landlord Details</SheetTitle>
            <SheetDescription>
              View detailed information about the landlord
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedLandlord && renderLandlordDetails(selectedLandlord)}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Landlord Sheet */}
      <Sheet onOpenChange={setIsEditSheetOpen} open={isEditSheetOpen}>
        <SheetContent className="w-[600px] overflow-y-auto sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Edit Landlord</SheetTitle>
            <SheetDescription>Update landlord information</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedLandlord && (
              <LandlordForm
                initialData={selectedLandlord}
                onSuccess={handleEditSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landlord</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this landlord? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteLandlordMutation.isPending}
              onClick={confirmDelete}
              variant="destructive"
            >
              {deleteLandlordMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
