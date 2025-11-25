"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CalendarIcon,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  CircleIcon,
  CircleX,
  Ellipsis,
  Home,
  User,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";

import { type Tenant, TenantStatus } from "../tenant.type";

export function getStatusIcon(status: Tenant["status"]) {
  const statusIcons = {
    active: CheckCircle2,
    inactive: CircleX,
    suspended: CircleHelp,
  };

  return statusIcons[status] || CircleIcon;
}

type GetTenantsTableColumnsProps = {
  statusCounts: Record<Tenant["status"], number>;
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Tenant> | null>
  >;
};

export function getTenantsTableColumns({
  statusCounts,
  setRowAction,
}: GetTenantsTableColumnsProps): ColumnDef<Tenant>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          className="translate-y-0.5"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-0.5"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "name",
      accessorKey: "personalInfo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tenant Name" />
      ),
      cell: ({ row }) => {
        const personalInfo = row.original.personalInfo;

        const fullName = `${personalInfo.firstName} ${personalInfo.middleName ? `${personalInfo.middleName} ` : ""}${personalInfo.lastName}`;
        return (
          <div className="flex items-center gap-2">
            <span className="max-w-125 truncate font-medium">{fullName}</span>
          </div>
        );
      },
      meta: {
        label: "Tenant Name",
        placeholder: "Search tenant name...",
        variant: "text",
        icon: User,
      },
      enableColumnFilter: true,
    },
    {
      id: "property",
      accessorKey: "property",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Property" />
      ),
      cell: ({ row }) => {
        const property = row.original.property;
        const propertyTitle = property.title;

        return (
          <div className="flex items-center gap-2">
            <span className="max-w-125 truncate font-medium">
              {propertyTitle || "N/A"}
            </span>
          </div>
        );
      },
      meta: {
        label: "Property",
        placeholder: "Search property...",
        variant: "text",
        icon: Home,
      },
      enableColumnFilter: true,
    },
    {
      id: "unit",
      accessorKey: "unit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit" />
      ),
      cell: ({ row }) => {
        const unit = row.original.unit;
        const unitTitle = unit.unitNumber;

        return (
          <div className="flex items-center gap-2">
            <span className="max-w-125 truncate font-medium">
              {unitTitle || "N/A"}
            </span>
          </div>
        );
      },
      meta: {
        label: "Unit",
        placeholder: "Search unit...",
        variant: "text",
        icon: Home,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = Object.values(TenantStatus).find(
          (status) => status === row.original.status
        );

        if (!status) return null;

        const Icon = getStatusIcon(status);

        return (
          <Badge className="py-1 [&>svg]:size-3.5" variant="outline">
            <Icon />
            <span className="capitalize">{status}</span>
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: Object.values(TenantStatus).map((status) => ({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          value: status,
          count: statusCounts[status] || 0,
          icon: getStatusIcon(status),
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "startDate",
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      cell: ({ row }) => formatDate(row.original.startDate),
      meta: {
        label: "Start Date",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "endDate",
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="End Date" />
      ),
      cell: ({ row }) => {
        const endDate = row.original.endDate;
        return endDate ? (
          formatDate(endDate)
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
      meta: {
        label: "End Date",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => formatDate(row.original.createdAt),
      meta: {
        label: "Created At",
        variant: "dateRange",
        icon: CalendarIcon,
      },
      enableColumnFilter: true,
    },
    {
      id: "actions",
      cell({ row }) {
        const [isUpdatePending, startUpdateTransition] = React.useTransition();

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Open menu"
                className="flex size-8 p-0 data-[state=open]:bg-muted"
                variant="ghost"
              >
                <Ellipsis aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "update" })}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    onValueChange={() => {
                      startUpdateTransition(() => {
                        toast.promise(async () => null, {
                          loading: "Updating...",
                          success: "Status updated",
                          error: (err) => getErrorMessage(err),
                        });
                      });
                    }}
                    value={row.original.status}
                  >
                    {Object.values(TenantStatus).map((label) => (
                      <DropdownMenuRadioItem
                        className="capitalize"
                        disabled={isUpdatePending}
                        key={label}
                        value={label}
                      >
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setRowAction({ row, variant: "delete" })}
              >
                Delete
                <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 40,
    },
  ];
}
