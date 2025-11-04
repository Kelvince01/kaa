"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/shell";
import SimpleTenantForm from "@/modules/tenants/components/simple-tenant-form";
import SimpleTenantTable from "@/modules/tenants/components/simple-tenant-table";
import {
  useDeleteTenant,
  useVerifyTenant,
} from "@/modules/tenants/tenant.mutations";
import { useTenantStats, useTenants } from "@/modules/tenants/tenant.queries";
import type { Tenant } from "@/modules/tenants/tenant.type";
import { TenantStatus } from "@/modules/tenants/tenant.type";

export default function TenantsManagement({ property }: { property: string }) {
  const [queryParams, setQueryParams] = useState({
    property,
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  });

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Queries and mutations
  const { data: tenantsData, isLoading } = useTenants(queryParams);
  const { data: statsData } = useTenantStats({ property });
  const deleteTenantMutation = useDeleteTenant();
  const verifyTenantMutation = useVerifyTenant();

  // Event handlers
  const handleView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsViewSheetOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditSheetOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast.success("Tenant created successfully");
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    toast.success("Tenant updated successfully");
  };

  const confirmDelete = async () => {
    if (!selectedTenant) return;

    try {
      await deleteTenantMutation.mutateAsync(selectedTenant._id);
      setIsDeleteDialogOpen(false);
      setSelectedTenant(null);
      toast.success("Tenant deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tenant");
    }
  };

  const handleVerify = async (tenant: Tenant) => {
    try {
      await verifyTenantMutation.mutateAsync(tenant._id);
      toast.success("Tenant verification updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update verification");
    }
  };

  const getStatusColor = (status: TenantStatus) => {
    switch (status) {
      case TenantStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case TenantStatus.INACTIVE:
        return "bg-gray-100 text-gray-800";
      case TenantStatus.SUSPENDED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderTenantDetails = (tenant: Tenant) => {
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
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="email"
              >
                Email
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.email}
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
                {tenant.personalInfo.phone}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="status"
              >
                Status
              </label>
              <Badge className={getStatusColor(tenant.status)}>
                {tenant.status}
              </Badge>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="nationalId"
              >
                National ID
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.nationalId}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="dateOfBirth"
              >
                Date of Birth
              </label>
              <p className="text-gray-900 text-sm">
                {new Date(tenant.personalInfo.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="occupation"
              >
                Occupation
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.occupation}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="employer"
              >
                Employer
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.employer || "N/A"}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="monthlyIncome"
              >
                Monthly Income
              </label>
              <p className="text-gray-900 text-sm">
                ${tenant.personalInfo.monthlyIncome?.toLocaleString() || "N/A"}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="maritalStatus"
              >
                Marital Status
              </label>
              <p className="text-gray-900 text-sm capitalize">
                {tenant.personalInfo.maritalStatus}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="dependents"
              >
                Dependents
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.personalInfo.dependents}
              </p>
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Lease Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="startDate"
              >
                Start Date
              </label>
              <p className="text-gray-900 text-sm">
                {new Date(tenant.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="endDate"
              >
                End Date
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.endDate
                  ? new Date(tenant.endDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="property"
              >
                Property
              </label>
              <p className="text-gray-900 text-sm">
                {typeof tenant.property === "object"
                  ? tenant.property.title
                  : tenant.property}
              </p>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="unit"
              >
                Unit
              </label>
              <p className="text-gray-900 text-sm">
                {typeof tenant.unit === "object"
                  ? tenant.unit.unitNumber
                  : tenant.unit}
              </p>
            </div>
          </div>
        </div>

        {/* Verification */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Verification
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="verificationStatus"
              >
                Verification Status
              </label>
              <Badge
                className={
                  tenant.isVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {tenant.isVerified ? "Verified" : "Unverified"}
              </Badge>
            </div>
            <div>
              <label
                className="font-medium text-gray-500 text-sm"
                htmlFor="verificationProgress"
              >
                Verification Progress
              </label>
              <p className="text-gray-900 text-sm">
                {tenant.verificationProgress}%
              </p>
            </div>
          </div>
        </div>

        {/* Tenant Score */}
        <div>
          <h3 className="mb-3 font-medium text-gray-900 text-lg">
            Tenant Score
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="font-bold text-2xl text-blue-600">
                {tenant.tenantScore.overallScore}
              </p>
              <p className="text-gray-500 text-sm">Overall Score</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-green-600">
                {tenant.tenantScore.creditScore}
              </p>
              <p className="text-gray-500 text-sm">Credit Score</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-purple-600">
                {tenant.tenantScore.reliabilityScore}
              </p>
              <p className="text-gray-500 text-sm">Reliability</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-2xl text-orange-600">
                {tenant.tenantScore.paymentHistory}
              </p>
              <p className="text-gray-500 text-sm">Payment History</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        {tenant.emergencyContact && (
          <div>
            <h3 className="mb-3 font-medium text-gray-900 text-lg">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  className="font-medium text-gray-500 text-sm"
                  htmlFor="emergencyContactName"
                >
                  Name
                </label>
                <p className="text-gray-900 text-sm">
                  {tenant.emergencyContact.name}
                </p>
              </div>
              <div>
                <label
                  className="font-medium text-gray-500 text-sm"
                  htmlFor="emergencyContactRelationship"
                >
                  Relationship
                </label>
                <p className="text-gray-900 text-sm">
                  {tenant.emergencyContact.relationship}
                </p>
              </div>
              <div>
                <label
                  className="font-medium text-gray-500 text-sm"
                  htmlFor="emergencyContactPhone"
                >
                  Phone
                </label>
                <p className="text-gray-900 text-sm">
                  {tenant.emergencyContact.phone}
                </p>
              </div>
              <div>
                <label
                  className="font-medium text-gray-500 text-sm"
                  htmlFor="emergencyContactEmail"
                >
                  Email
                </label>
                <p className="text-gray-900 text-sm">
                  {tenant.emergencyContact.email || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {tenant.notes && (
          <div>
            <h3 className="mb-3 font-medium text-gray-900 text-lg">Notes</h3>
            <p className="rounded-md bg-gray-50 p-3 text-gray-900 text-sm">
              {tenant.notes}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Shell className="gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Tenant Management
          </h1>
          <p className="text-muted-foreground">
            Manage and oversee all tenants in your properties
          </p>
        </div>

        <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new tenant to your property. Fill in the required
                information below.
              </DialogDescription>
            </DialogHeader>
            <SimpleTenantForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {statsData.data.totalTenants}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Active Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {statsData.data.activeTenants}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Verified Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {statsData.data.verifiedTenants}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {statsData.data.averageScore}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tenants Table */}
      <SimpleTenantTable
        data={tenantsData?.items || []}
        isLoading={isLoading}
        onCreateNew={handleCreateNew}
        onDelete={handleDelete}
        onEdit={handleEdit}
        onVerify={handleVerify}
        onView={handleView}
      />

      {/* View Tenant Sheet */}
      <Sheet onOpenChange={setIsViewSheetOpen} open={isViewSheetOpen}>
        <SheetContent className="w-[600px] overflow-y-auto sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Tenant Details</SheetTitle>
            <SheetDescription>
              View detailed information about the tenant
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedTenant && renderTenantDetails(selectedTenant)}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Tenant Sheet */}
      <Sheet onOpenChange={setIsEditSheetOpen} open={isEditSheetOpen}>
        <SheetContent className="w-[600px] overflow-y-auto sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Edit Tenant</SheetTitle>
            <SheetDescription>Update tenant information</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedTenant && (
              <SimpleTenantForm
                initialData={selectedTenant}
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
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be
              undone.
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
              disabled={deleteTenantMutation.isPending}
              onClick={confirmDelete}
              variant="destructive"
            >
              {deleteTenantMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
