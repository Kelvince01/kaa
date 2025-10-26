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
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import {
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  Phone,
  Plus,
  User,
} from "lucide-react";
import { useState } from "react";

import type { Maintenance } from "../../maintenance.type";
import {
  formatCurrency,
  formatDateTime,
  getMaintenanceTypeDisplayName,
  getRelativeTime,
} from "../../utils/maintenance-utils";
import { MaintenanceUpdateForm } from "../forms/maintenance-update-form";
import { PriorityBadge } from "../status/priority-badge";
import { StatusBadge } from "../status/status-badge";

type MaintenanceDetailsModalProps = {
  maintenance: Maintenance | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (maintenance: Maintenance) => void;
};

export function MaintenanceDetailsModal({
  maintenance,
  isOpen,
  onClose,
  onEdit,
}: MaintenanceDetailsModalProps) {
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  if (!maintenance) return null;

  const property =
    typeof maintenance.property === "string"
      ? { title: maintenance.property }
      : maintenance.property;

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Maintenance Request Details</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={maintenance.status} />
              <PriorityBadge priority={maintenance.priority} showIcon />
            </div>
          </DialogTitle>
          <DialogDescription>
            Request #{maintenance.workOrderNumber || maintenance._id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{maintenance.title}</h3>
                  <p className="mt-1 text-muted-foreground">
                    {maintenance.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Property:</strong> {property?.title || "Unknown"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>Type:</strong>{" "}
                      {getMaintenanceTypeDisplayName(
                        maintenance.maintenanceType
                      )}
                    </span>
                  </div>

                  {maintenance.scheduledDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Scheduled:</strong>{" "}
                        {formatDateTime(maintenance.scheduledDate)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Created:</strong>{" "}
                      {getRelativeTime(maintenance.statusUpdatedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Information */}
            {(maintenance.estimatedCost || maintenance.cost) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  </div>
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
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {maintenance.assignedContractor.name}
                    </p>
                    {maintenance.assignedContractor.company && (
                      <p className="text-muted-foreground">
                        {maintenance.assignedContractor.company}
                      </p>
                    )}

                    <div className="flex flex-col gap-1">
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
                  </div>
                </CardContent>
              </Card>
            )}

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

                <div className="space-y-4">
                  {maintenance.updates && maintenance.updates.length > 0 ? (
                    maintenance.updates.map((update, index) => (
                      <div
                        className="border-gray-200 border-l-2 pl-4"
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
                                {update.attachments.map((attachment, i) => (
                                  <Badge
                                    className="text-xs"
                                    key={i.toString()}
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
                    <p className="text-muted-foreground text-sm">
                      No updates yet. Add the first update to start tracking
                      progress.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {maintenance.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{maintenance.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(maintenance)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Request
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
