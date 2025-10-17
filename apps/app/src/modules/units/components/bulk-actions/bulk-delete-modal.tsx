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
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

import type { Unit } from "../../unit.type";
import { formatCurrency, getUnitDisplayTitle } from "../../utils/unit-utils";
import { StatusBadge } from "../status/status-badge";

type BulkDeleteModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUnits: Unit[];
  onConfirm: () => void;
};

export function BulkDeleteModal({
  open,
  onOpenChange,
  selectedUnits,
  onConfirm,
}: BulkDeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const expectedConfirmText = "DELETE";
  const canDelete = confirmText === expectedConfirmText;

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setConfirmText("");
  };

  // Check for units that cannot be deleted
  const occupiedUnits = selectedUnits.filter(
    (unit) => unit.status === "occupied"
  );
  const deletableUnits = selectedUnits.filter(
    (unit) => unit.status !== "occupied"
  );
  const hasOccupiedUnits = occupiedUnits.length > 0;

  // Calculate total rent impact
  const totalRentImpact = deletableUnits.reduce(
    (sum, unit) => sum + unit.rent,
    0
  );

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete {selectedUnits.length} Units
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The units and all associated data will
            be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning about occupied units */}
          {hasOccupiedUnits && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">
                      Cannot Delete Occupied Units
                    </div>
                    <div className="mt-1 text-red-700 text-sm">
                      {occupiedUnits.length} of the selected units are currently
                      occupied and cannot be deleted. You must vacate these
                      units first.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deletable units summary */}
          {deletableUnits.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Units to Delete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Units that can be deleted:
                  </span>
                  <Badge variant="destructive">
                    {deletableUnits.length} units
                  </Badge>
                </div>

                {totalRentImpact > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Total rent impact:
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(totalRentImpact)}/month
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unit list preview */}
          {selectedUnits.length <= 10 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selected Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {selectedUnits.map((unit) => {
                    const isOccupied = unit.status === "occupied";
                    return (
                      <div
                        className={`flex items-center justify-between rounded border p-2 ${
                          isOccupied ? "border-red-200 bg-red-50" : ""
                        }`}
                        key={unit._id}
                      >
                        <div>
                          <div className="font-medium">
                            {getUnitDisplayTitle(unit)}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {formatCurrency(unit.rent)}/month
                            {isOccupied && " • Cannot delete (occupied)"}
                          </div>
                        </div>
                        <StatusBadge status={unit.status} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Total selected:
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedUnits.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Can delete:</span>
                    <span className="ml-2 font-medium text-red-600">
                      {deletableUnits.length}
                    </span>
                  </div>
                  {hasOccupiedUnits && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        Occupied (cannot delete):
                      </span>
                      <span className="ml-2 font-medium text-amber-600">
                        {occupiedUnits.length}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation input */}
          {deletableUnits.length > 0 && (
            <div className="space-y-3">
              <Label>
                Type{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-sm">
                  DELETE
                </code>{" "}
                to confirm
              </Label>
              <Input
                className={canDelete ? "border-red-300" : ""}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                value={confirmText}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Cancel
          </Button>
          {deletableUnits.length > 0 ? (
            <Button
              disabled={!canDelete}
              onClick={handleConfirm}
              variant="destructive"
            >
              Delete {deletableUnits.length} Units
            </Button>
          ) : (
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
