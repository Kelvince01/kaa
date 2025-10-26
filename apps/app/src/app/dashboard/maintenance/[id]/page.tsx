"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import {
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { MaintenanceUpdateForm } from "@/modules/maintenance/components/forms/maintenance-update-form";
import { DeleteMaintenanceModal } from "@/modules/maintenance/components/modals/delete-maintenance-modal";
import { PriorityBadge } from "@/modules/maintenance/components/status/priority-badge";
import { StatusBadge } from "@/modules/maintenance/components/status/status-badge";
import { useMaintenance } from "@/modules/maintenance/maintenance.queries";
import {
  formatCurrency,
  formatDateTime,
  getMaintenanceTypeDisplayName,
  getRelativeTime,
} from "@/modules/maintenance/utils/maintenance-utils";

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const maintenanceId = params.id as string;

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: maintenanceData, isLoading } = useMaintenance(maintenanceId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 rounded bg-muted" />
            <div className="h-96 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  console.log(maintenanceData);

  if (!maintenanceData?.data) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl">Maintenance Request Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The maintenance request you're looking for doesn't exist or has been
            deleted.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/dashboard/maintenance")}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Maintenance
          </Button>
        </div>
      </div>
    );
  }

  const maintenance = maintenanceData.data;
  const property =
    typeof maintenance.property === "string"
      ? { title: maintenance.property }
      : maintenance.property;

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log("Deleting maintenance:", maintenanceId);
    router.push("/dashboard/maintenance");
    return await Promise.resolve();
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/dashboard/maintenance")}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              {maintenance.title}
            </h1>
            <p className="text-muted-foreground">
              Request #{maintenance.workOrderNumber || maintenance._id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={maintenance.status} />
          <PriorityBadge priority={maintenance.priority} showIcon />
          <Button
            onClick={() => {
              /* TODO: Implement edit */
            }}
            size="sm"
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() => setIsDeleteModalOpen(true)}
            size="sm"
            variant="outline"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-lg">
                  {maintenance.title}
                </h3>
                <p className="text-muted-foreground">
                  {maintenance.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>Property:</strong> {property?.title || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      <strong>Type:</strong>{" "}
                      {getMaintenanceTypeDisplayName(
                        maintenance.maintenanceType
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {maintenance.scheduledDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <strong>Scheduled:</strong>{" "}
                        {formatDateTime(maintenance.scheduledDate)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>Created:</strong>{" "}
                      {getRelativeTime(maintenance.statusUpdatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {maintenance.notes && (
                <div className="border-t pt-4">
                  <h4 className="mb-2 font-medium">Additional Notes</h4>
                  <p className="text-muted-foreground text-sm">
                    {maintenance.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Updates Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Updates & Timeline
                </span>
                <Button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Update
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showUpdateForm && (
                <div className="mb-6">
                  <MaintenanceUpdateForm
                    currentStatus={maintenance.status}
                    maintenanceId={maintenance._id}
                    onCancel={() => setShowUpdateForm(false)}
                    onSuccess={() => setShowUpdateForm(false)}
                  />
                  <Separator className="mt-4" />
                </div>
              )}

              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {maintenance.updates && maintenance.updates.length > 0 ? (
                    maintenance.updates.map((update, index) => (
                      <div
                        className="border-gray-200 border-l-2 pb-4 pl-4"
                        key={update._id || index}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm">{update.message}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                {(update.updatedBy as any).firstName}{" "}
                                {(update.updatedBy as any).lastName}
                              </span>
                              {update.scheduledDate && (
                                <span className="text-muted-foreground text-xs">
                                  • Scheduled:{" "}
                                  {formatDateTime(update.scheduledDate)}
                                </span>
                              )}
                            </div>
                          </div>
                          {update.status && (
                            <StatusBadge status={update.status} />
                          )}
                        </div>

                        {update.attachments &&
                          update.attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="mb-1 text-muted-foreground text-xs">
                                Attachments:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {update.attachments.map((attachment) => (
                                  <Badge
                                    className="text-xs"
                                    key={attachment.fileName}
                                    variant="outline"
                                  >
                                    {attachment.fileName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-muted-foreground text-sm">
                      No updates yet. Add the first update to start tracking
                      progress.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Information */}
          {(maintenance.estimatedCost || maintenance.cost) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {maintenance.estimatedCost && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Estimated Cost
                    </span>
                    <p className="font-semibold text-lg">
                      {formatCurrency(maintenance.estimatedCost)}
                    </p>
                  </div>
                )}

                {maintenance.cost && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Actual Cost
                    </span>
                    <p className="font-semibold text-lg">
                      {formatCurrency(maintenance.cost)}
                    </p>
                  </div>
                )}

                {maintenance.paidBy && (
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Paid By
                    </span>
                    <p className="capitalize">{maintenance.paidBy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contractor Information */}
          {maintenance.assignedContractor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigned Contractor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">
                    {maintenance.assignedContractor.name}
                  </p>
                  {maintenance.assignedContractor.company && (
                    <p className="text-muted-foreground text-sm">
                      {maintenance.assignedContractor.company}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {maintenance.assignedContractor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {maintenance.assignedContractor.phone}
                      </span>
                    </div>
                  )}

                  {maintenance.assignedContractor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {maintenance.assignedContractor.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                onClick={() => setShowUpdateForm(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Update
              </Button>

              <Button
                className="w-full justify-start"
                onClick={() => {
                  /* TODO: Implement edit */
                }}
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Request
              </Button>

              <Button
                className="w-full justify-start"
                onClick={() => router.push("/dashboard/maintenance")}
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteMaintenanceModal
        isOpen={isDeleteModalOpen}
        maintenanceTitle={maintenance.title}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
