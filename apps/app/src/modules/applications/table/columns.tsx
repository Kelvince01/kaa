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
  Clock,
  Ellipsis,
  Text,
  Timer,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";

import { type Application, ApplicationStatus } from "../application.type";

export function getStatusIcon(status: Application["status"]) {
  const statusIcons = {
    rejected: CircleX,
    approved: CheckCircle2,
    in_review: Timer,
    submitted: CircleHelp,
    draft: CircleHelp,
    withdrawn: CircleHelp,
  };

  return statusIcons[status] || CircleIcon;
}

type GetApplicationsTableColumnsProps = {
  statusCounts: Record<Application["status"], number>;
  estimatedOfferAmount: { min: number; max: number };
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Application> | null>
  >;
};

export function getApplicationsTableColumns({
  statusCounts,
  setRowAction,
}: GetApplicationsTableColumnsProps): ColumnDef<Application>[] {
  // const updateApplicationMutation = useUpdateApplication();
  console.log(statusCounts);

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
      id: "moveInDate",
      accessorKey: "moveInDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Move In Date" />
      ),
      cell: ({ row }) => (
        <div className="w-20">{row.getValue("moveInDate")}</div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "property",
      accessorKey: "property",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="max-w-125 truncate font-medium">
            {row.getValue("property.title")}
          </span>
        </div>
      ),
      meta: {
        label: "Property name",
        placeholder: "Search property name...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ cell }) => {
        const status = Object.values(ApplicationStatus).find(
          (status) => status === cell.getValue<Application["status"]>()
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
        options: Object.values(ApplicationStatus).map((status) => ({
          label: status.charAt(0).toUpperCase() + status.slice(1),
          value: status,
          count: 1, // statusCounts[status],
          icon: CircleIcon, //getStatusIcon(status),
        })),
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "offerAmount",
      accessorKey: "offerAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Offer Amount" />
      ),
      cell: ({ cell }) => {
        const estimatedHours = cell.getValue<number>();
        return <div className="w-20 text-right">{estimatedHours}</div>;
      },
      meta: {
        label: "Offer Amount",
        variant: "range",
        range: [0, 0], // [estimatedOfferAmount.min, estimatedOfferAmount.max],
        unit: "hr",
        icon: Clock,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<Date>()),
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
                <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    onValueChange={(_value) => {
                      startUpdateTransition(() => {
                        toast.promise(
                          // updateApplicationMutation.mutateAsync({
                          // 	id: row.original._id,
                          // 	data: { status: value as Application["status"] },
                          // }),
                          async () => {
                            await Promise.resolve();
                          },
                          {
                            loading: "Updating...",
                            success: "Status updated",
                            error: (err) => getErrorMessage(err),
                          }
                        );
                      });
                    }}
                    value={row.original.status}
                  >
                    {Object.values(ApplicationStatus).map((label) => (
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
