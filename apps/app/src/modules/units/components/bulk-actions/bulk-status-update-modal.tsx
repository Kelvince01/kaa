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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { Label } from "@kaa/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

import type { Unit, UnitStatus } from "../../unit.type";
import {
  getStatusDisplayName,
  getUnitDisplayTitle,
} from "../../utils/unit-utils";
import { StatusBadge } from "../status/status-badge";

type BulkStatusUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUnits: Unit[];
  onConfirm: (status: UnitStatus, reason?: string) => void;
  isLoading?: boolean;
};

const statusOptions = [
  {
    value: "vacant" as UnitStatus,
    label: "Vacant",
    description: "Unit is empty and available for rent",
  },
  {
    value: "occupied" as UnitStatus,
    label: "Occupied",
    description: "Unit is currently rented",
  },
  {
    value: "maintenance" as UnitStatus,
    label: "Maintenance",
    description: "Unit is under maintenance",
  },
  {
    value: "reserved" as UnitStatus,
    label: "Reserved",
    description: "Unit is reserved for a tenant",
  },
  {
    value: "unavailable" as UnitStatus,
    label: "Unavailable",
    description: "Unit is not available for rent",
  },
];

export function BulkStatusUpdateModal({
  open,
  onOpenChange,
  selectedUnits,
  onConfirm,
  isLoading = false,
}: BulkStatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<UnitStatus | "">("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus, reason || undefined);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedStatus("");
    setReason("");
  };

  // Group units by current status
  const unitsByStatus = selectedUnits.reduce(
    (acc, unit) => {
      const status = unit.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(unit);
      return acc;
    },
    {} as Record<UnitStatus, Unit[]>
  );

  // Check for potential issues
  const occupiedUnits = selectedUnits.filter(
    (unit) => unit.status === "occupied"
  );
  const hasOccupiedUnits = occupiedUnits.length > 0;
  const wouldVacateOccupied = selectedStatus === "vacant" && hasOccupiedUnits;
  const wouldOccupyWithoutTenant =
    selectedStatus === "occupied" &&
    selectedUnits.some((unit) => !unit.currentTenant);

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Update Status for {selectedUnits.length} Units
          </DialogTitle>
          <DialogDescription>
            Change the status for all selected units. Review the units below
            before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Selected Units</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(unitsByStatus).map(([status, units]) => (
                <div className="flex items-center justify-between" key={status}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status as UnitStatus} />
                    <span className="text-muted-foreground text-sm">
                      {getStatusDisplayName(status as UnitStatus)}
                    </span>
                  </div>
                  <Badge variant="outline">{units.length} units</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label>New Status</Label>
            <Select
              onValueChange={(value) => setSelectedStatus(value as UnitStatus)}
              value={selectedStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status for all units" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground text-sm">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warnings */}
          {(wouldVacateOccupied || wouldOccupyWithoutTenant) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div className="space-y-2">
                    {wouldVacateOccupied && (
                      <div>
                        <div className="font-medium text-amber-800">
                          Warning: Occupied Units
                        </div>
                        <div className="text-amber-700 text-sm">
                          {occupiedUnits.length} occupied units will be marked
                          as vacant. Make sure tenants have been properly
                          processed first.
                        </div>
                      </div>
                    )}
                    {wouldOccupyWithoutTenant && (
                      <div>
                        <div className="font-medium text-amber-800">
                          Warning: No Tenants Assigned
                        </div>
                        <div className="text-amber-700 text-sm">
                          Some units don't have tenants assigned. You may need
                          to assign tenants before marking them as occupied.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reason/Notes */}
          <div className="space-y-3">
            <Label>Reason (Optional)</Label>
            <Textarea
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              value={reason}
            />
          </div>

          {/* Unit Preview */}
          {selectedUnits.length <= 10 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Units to Update</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {selectedUnits.map((unit) => (
                    <div
                      className="flex items-center justify-between rounded border p-2"
                      key={unit._id}
                    >
                      <div>
                        <div className="font-medium">
                          {getUnitDisplayTitle(unit)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Current: {getStatusDisplayName(unit.status)}
                          {unit.currentTenant && " • Has tenant"}
                        </div>
                      </div>
                      <StatusBadge status={unit.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button disabled={isLoading} onClick={handleClose} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!selectedStatus || isLoading}
            onClick={handleConfirm}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update {selectedUnits.length} Units
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
