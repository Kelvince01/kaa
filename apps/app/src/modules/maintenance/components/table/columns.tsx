"use client";

import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";

import type { Maintenance } from "../../maintenance.type";
import {
  formatCurrency,
  formatDate,
  getMaintenanceTypeDisplayName,
  isMaintenanceDueSoon,
  isMaintenanceOverdue,
} from "../../utils/maintenance-utils";
import { PriorityBadge } from "../status/priority-badge";
import { StatusBadge } from "../status/status-badge";
import { StatusUpdater } from "../status/status-updater";

type MaintenanceActionsProps = {
  maintenance: Maintenance;
  onView: (maintenance: Maintenance) => void;
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenanceId: string) => void;
  onStatusChange: (maintenanceId: string, status: any) => void;
};

function MaintenanceActions({
  maintenance,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: MaintenanceActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <StatusUpdater
        currentStatus={maintenance.status}
        onStatusChange={(status) => onStatusChange(maintenance._id, status)}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8 p-0" variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onView(maintenance)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(maintenance)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(maintenance._id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type CreateColumnsProps = {
  onView: (maintenance: Maintenance) => void;
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenanceId: string) => void;
  onStatusChange: (maintenanceId: string, status: any) => void;
  onSelectChange: (maintenanceId: string) => void;
  onSelectAll: (maintenanceIds: string[]) => void;
  selectedMaintenances: string[];
};

export function createMaintenanceColumns({
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onSelectChange,
  onSelectAll,
  selectedMaintenances,
}: CreateColumnsProps): ColumnDef<Maintenance>[] {
  return [
    // Selection column
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            const allMaintenanceIds = table
              .getRowModel()
              .rows.map((row) => row.original._id);
            onSelectAll(value ? allMaintenanceIds : []);
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={selectedMaintenances.includes(row.original._id)}
          onCheckedChange={() => onSelectChange(row.original._id)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Title column
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const maintenance = row.original;
        const isOverdue = isMaintenanceOverdue(maintenance);
        const isDueSoon = isMaintenanceDueSoon(maintenance);

        return (
          <div className="flex flex-col">
            <span
              className={`font-medium ${isOverdue ? "text-destructive" : isDueSoon ? "text-orange-600" : ""}`}
            >
              {maintenance.title}
            </span>
            {maintenance.workOrderNumber && (
              <span className="text-muted-foreground text-sm">
                {maintenance.workOrderNumber}
              </span>
            )}
          </div>
        );
      },
    },
    // Property column
    {
      accessorKey: "property",
      header: "Property",
      cell: ({ row }) => {
        const property = row.original.property;
        // Handle both string ID and populated property object
        const propertyName =
          typeof property === "string"
            ? property
            : property?.title || "Unknown Property";
        return <span className="text-sm">{propertyName}</span>;
      },
    },
    // Type column
    {
      accessorKey: "maintenanceType",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm">
          {getMaintenanceTypeDisplayName(row.original.maintenanceType)}
        </span>
      ),
    },
    // Priority column
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <PriorityBadge priority={row.original.priority} showIcon />
      ),
    },
    // Status column
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    // Scheduled Date column
    {
      accessorKey: "scheduledDate",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Scheduled Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const scheduledDate = row.original.scheduledDate;
        if (!scheduledDate)
          return <span className="text-muted-foreground">-</span>;

        const isOverdue = isMaintenanceOverdue(row.original);
        const isDueSoon = isMaintenanceDueSoon(row.original);

        return (
          <span
            className={`text-sm ${isOverdue ? "text-destructive" : isDueSoon ? "text-orange-600" : ""}`}
          >
            {formatDate(scheduledDate)}
          </span>
        );
      },
    },
    // Assigned Contractor column
    {
      accessorKey: "assignedContractor",
      header: "Contractor",
      cell: ({ row }) => {
        const contractor = row.original.assignedContractor;
        if (!contractor)
          return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{contractor.name}</span>
            {contractor.company && (
              <span className="text-muted-foreground text-xs">
                {contractor.company}
              </span>
            )}
          </div>
        );
      },
    },
    // Cost column
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cost = row.original.cost;
        const estimatedCost = row.original.estimatedCost;

        if (cost) {
          return (
            <span className="font-medium text-sm">{formatCurrency(cost)}</span>
          );
        }
        if (estimatedCost) {
          return (
            <span className="text-muted-foreground text-sm">
              ~{formatCurrency(estimatedCost)}
            </span>
          );
        }

        return <span className="text-muted-foreground">-</span>;
      },
    },
    // Created Date column
    {
      accessorKey: "statusUpdatedAt",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.statusUpdatedAt)}
        </span>
      ),
    },
    // Actions column
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <MaintenanceActions
          maintenance={row.original}
          onDelete={onDelete}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onView={onView}
        />
      ),
    },
  ];
}
