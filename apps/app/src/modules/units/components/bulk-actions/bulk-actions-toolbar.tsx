"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Edit,
  RotateCcw,
  Settings,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useBulkUpdateUnits } from "../../unit.mutations";
import type { Unit, UnitStatus } from "../../unit.type";
import { BulkDeleteModal } from "./bulk-delete-modal";
import { BulkStatusUpdateModal } from "./bulk-status-update-modal";

type BulkActionsToolbarProps = {
  selectedUnits: string[];
  units: Unit[];
  onClearSelection: () => void;
  onRefresh?: () => void;
};

export function BulkActionsToolbar({
  selectedUnits,
  units,
  onClearSelection,
  onRefresh,
}: BulkActionsToolbarProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const bulkUpdateMutation = useBulkUpdateUnits();

  const selectedUnitObjects = units.filter((unit) =>
    selectedUnits.includes(unit._id)
  );
  const selectedCount = selectedUnits.length;

  const handleExport = () => {
    // Create CSV data
    const headers = ["Unit Number", "Type", "Status", "Rent", "Property"];
    const csvData = [
      headers.join(","),
      ...selectedUnitObjects.map((unit) =>
        [
          unit.unitNumber,
          unit.type,
          unit.status,
          unit.rent,
          typeof unit.property === "string"
            ? unit.property
            : unit.property?.title || "",
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    // Download file
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `units-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkStatusUpdate = async (
    status: UnitStatus,
    _reason?: string
  ) => {
    try {
      await bulkUpdateMutation.mutateAsync({
        unitIds: selectedUnits,
        data: { status },
      });
      setShowStatusModal(false);
      onClearSelection();
      onRefresh?.();
    } catch (error) {
      console.error("Failed to update units:", error);
    }
  };

  const handleBulkDelete = () => {
    // This would call a bulk delete API
    console.log("Bulk delete units:", selectedUnits);
    setShowDeleteModal(false);
    onClearSelection();
    onRefresh?.();
  };

  if (selectedCount === 0) {
    return null;
  }

  // Check if any selected units are occupied (cannot be deleted)
  const hasOccupiedUnits = selectedUnitObjects.some(
    (unit) => unit.status === "occupied"
  );

  return (
    <>
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge className="px-3 py-1" variant="default">
                {selectedCount} selected
              </Badge>
              <Button
                className="h-6 w-6 p-0"
                onClick={onClearSelection}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {hasOccupiedUnits && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Some units are occupied</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions */}
            <Button
              className="gap-2"
              onClick={() => setShowStatusModal(true)}
              size="sm"
              variant="outline"
            >
              <Settings className="h-4 w-4" />
              Update Status
            </Button>

            <Button
              className="gap-2"
              onClick={handleExport}
              size="sm"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" size="sm" variant="outline">
                  More Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowStatusModal(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Update Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Updates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Bulk Assign Tenants
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Edit className="mr-2 h-4 w-4" />
                  Bulk Edit Properties
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  disabled={hasOccupiedUnits}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Units
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onRefresh && (
              <Button
                className="gap-2"
                onClick={onRefresh}
                size="sm"
                variant="ghost"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <BulkStatusUpdateModal
        isLoading={bulkUpdateMutation.isPending}
        onConfirm={handleBulkStatusUpdate}
        onOpenChange={setShowStatusModal}
        open={showStatusModal}
        selectedUnits={selectedUnitObjects}
      />

      <BulkDeleteModal
        onConfirm={handleBulkDelete}
        onOpenChange={setShowDeleteModal}
        open={showDeleteModal}
        selectedUnits={selectedUnitObjects}
      />
    </>
  );
}
