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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  Building2,
  Droplets,
  Edit,
  MoreVertical,
  Phone,
  Plus,
  Trash,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react";
import { useState } from "react";

import type { UnitUtility } from "../../unit.type";
import { formatCurrency } from "../../utils/unit-utils";
import { UtilityForm } from "./utility-form";

type UtilityManagerProps = {
  utilities: UnitUtility[];
  onUpdate: (utilities: UnitUtility[]) => void;
  readonly?: boolean;
};

const utilityIcons = {
  water: Droplets,
  electricity: Zap,
  power: Zap,
  internet: Wifi,
  garbage: Trash,
  gas: Building2,
  phone: Phone,
  default: Building2,
};

const getUtilityIcon = (utilityName: string) => {
  const name = utilityName.toLowerCase();
  for (const [key, Icon] of Object.entries(utilityIcons)) {
    if (name.includes(key)) {
      return Icon;
    }
  }
  return utilityIcons.default;
};

export function UtilityManager({
  utilities,
  onUpdate,
  readonly = false,
}: UtilityManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUtility, setEditingUtility] = useState<UnitUtility | null>(
    null
  );
  const [deletingUtility, setDeletingUtility] = useState<UnitUtility | null>(
    null
  );

  const handleAddUtility = (utility: UnitUtility) => {
    onUpdate([...utilities, utility]);
    setIsFormOpen(false);
  };

  const handleUpdateUtility = (updatedUtility: UnitUtility) => {
    const updatedUtilities = utilities.map((utility) =>
      utility.name === editingUtility?.name ? updatedUtility : utility
    );
    onUpdate(updatedUtilities);
    setEditingUtility(null);
  };

  const handleDeleteUtility = () => {
    if (deletingUtility) {
      const updatedUtilities = utilities.filter(
        (utility) => utility.name !== deletingUtility.name
      );
      onUpdate(updatedUtilities);
      setDeletingUtility(null);
    }
  };

  const handleEditUtility = (utility: UnitUtility) => {
    setEditingUtility(utility);
  };

  const includedUtilities = utilities.filter((u) => u.included);
  const separateUtilities = utilities.filter((u) => !u.included);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Included in Rent</CardTitle>
          </CardHeader>
          <CardContent>
            {includedUtilities.length > 0 ? (
              <div className="space-y-2">
                {includedUtilities.map((utility) => {
                  const Icon = getUtilityIcon(utility.name);
                  return (
                    <div className="flex items-center gap-3" key={utility.name}>
                      <Icon className="h-4 w-4 text-green-600" />
                      <span className="flex-1">{utility.name}</span>
                      <Badge
                        className="bg-green-100 text-green-800"
                        variant="default"
                      >
                        Included
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No utilities included in rent
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Separate Billing</CardTitle>
          </CardHeader>
          <CardContent>
            {separateUtilities.length > 0 ? (
              <div className="space-y-2">
                {separateUtilities.map((utility) => {
                  const Icon = getUtilityIcon(utility.name);
                  return (
                    <div className="flex items-center gap-3" key={utility.name}>
                      <Icon className="h-4 w-4 text-orange-600" />
                      <span className="flex-1">{utility.name}</span>
                      <div className="text-right">
                        {utility.amount && (
                          <div className="font-medium">
                            {formatCurrency(utility.amount)}
                            {utility.paymentFrequency &&
                              `/${utility.paymentFrequency}`}
                          </div>
                        )}
                        <Badge className="text-orange-800" variant="outline">
                          Separate
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No separate utility bills
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Utilities Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Utilities</CardTitle>
          {!readonly && (
            <Button
              className="gap-2"
              onClick={() => setIsFormOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Utility
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {utilities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utility</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Meter Number</TableHead>
                  <TableHead>Cost</TableHead>
                  {!readonly && <TableHead className="w-12">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {utilities.map((utility) => {
                  const Icon = getUtilityIcon(utility.name);
                  return (
                    <TableRow key={utility.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{utility.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {utility.provider || (
                          <span className="text-muted-foreground">
                            Not specified
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            utility.included
                              ? "bg-green-100 text-green-800"
                              : "text-orange-800"
                          }
                          variant={utility.included ? "default" : "outline"}
                        >
                          {utility.included ? "Included" : "Separate"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {utility.meterNumber || (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {utility.included ? (
                          <span className="text-muted-foreground">
                            Included in rent
                          </span>
                        ) : utility.amount ? (
                          <div>
                            <div className="font-medium">
                              {formatCurrency(utility.amount)}
                            </div>
                            {utility.paymentFrequency && (
                              <div className="text-muted-foreground text-sm">
                                per {utility.paymentFrequency}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not specified
                          </span>
                        )}
                      </TableCell>
                      {!readonly && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                className="h-8 w-8"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditUtility(utility)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingUtility(utility)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No utilities configured
              {!readonly && (
                <div className="mt-2">
                  <Button
                    className="gap-2"
                    onClick={() => setIsFormOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Utility
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Utility Dialog */}
      <UtilityForm
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingUtility(null);
          }
        }}
        onSubmit={editingUtility ? handleUpdateUtility : handleAddUtility}
        open={isFormOpen || editingUtility !== null}
        utility={editingUtility}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        onOpenChange={() => setDeletingUtility(null)}
        open={deletingUtility !== null}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Utility</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingUtility?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeletingUtility(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleDeleteUtility} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
