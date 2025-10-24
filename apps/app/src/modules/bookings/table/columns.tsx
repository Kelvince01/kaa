"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Checkbox } from "@kaa/ui/components/checkbox";
import type { ColumnDef } from "@tanstack/react-table";
import { Calendar, Clock, Eye, Pencil, Trash, User } from "lucide-react";
import Image from "next/image";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableRowActions } from "@/components/ui/data-table/data-table-row-actions";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";
import type { Booking, BookingStatus, BookingType } from "../booking.type";

// Status badge color mapping
const getStatusBadgeVariant = (
  status: BookingStatus
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "pending":
      return "outline";
    case "confirmed":
      return "default";
    case "completed":
      return "secondary";
    case "cancelled":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

// Status badge color classes
const getStatusBadgeClass = (status: BookingStatus): string => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Type badge display
const getBookingTypeDisplay = (
  type: BookingType
): { label: string; icon: React.ReactNode } => {
  switch (type) {
    case "viewing":
      return { label: "Property Viewing", icon: <Eye className="h-3 w-3" /> };
    case "application":
      return { label: "Application", icon: <User className="h-3 w-3" /> };
    default:
      return { label: type, icon: <Calendar className="h-3 w-3" /> };
  }
};

type GetColumnsOptions = {
  setRowAction: (action: DataTableRowAction<Booking> | null) => void;
};

export function getBookingsTableColumns({
  setRowAction,
}: GetColumnsOptions): ColumnDef<Booking>[] {
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
          className="translate-y-[2px]"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-[2px]"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booking ID" />
      ),
      cell: ({ row }) => {
        const id = row.getValue("_id") as string;
        return <div className="font-mono text-xs">{id.substring(0, 8)}...</div>;
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("type") as BookingType;
        const typeDisplay = getBookingTypeDisplay(type);
        return (
          <div className="flex items-center gap-2">
            {typeDisplay.icon}
            <span className="capitalize">{typeDisplay.label}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "tenant",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tenant" />
      ),
      cell: ({ row }) => {
        const tenant = row.getValue("tenant") as Booking["tenant"];
        if (!tenant)
          return <span className="text-muted-foreground">Unknown</span>;

        return (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              {tenant.avatar ? (
                <Image
                  alt={`${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`}
                  className="h-8 w-8 rounded-full"
                  height={32}
                  src={tenant.avatar}
                  width={32}
                />
              ) : (
                <span className="font-medium text-xs">
                  {tenant.personalInfo.firstName?.[0]}
                  {tenant.personalInfo.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">
                {tenant.personalInfo.firstName} {tenant.personalInfo.lastName}
              </p>
              <p className="text-muted-foreground text-xs">
                {tenant.personalInfo.email}
              </p>
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "property",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Property" />
      ),
      cell: ({ row }) => {
        const property = row.getValue("property") as Booking["property"];
        if (!property)
          return <span className="text-muted-foreground">Unknown</span>;

        return (
          <div>
            <p className="font-medium">{property.title}</p>
            <p className="text-muted-foreground text-xs">
              {property.location.address.town},{" "}
              {property.location.address.postalCode}
            </p>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date & Time" />
      ),
      cell: ({ row }) => {
        const booking = row.original;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm">{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {booking.time
                  ? // formatTime(booking.time)
                    booking.time
                  : "-"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as BookingStatus;
        return (
          <Badge
            className={getStatusBadgeClass(status)}
            variant={getStatusBadgeVariant(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => {
        const amount = row.getValue("totalAmount") as number;
        const property = row.getValue("property") as Booking["property"];

        if (!amount && property?.pricing?.rentAmount) {
          return (
            <span className="text-muted-foreground">
              £{property.pricing.rentAmount}
            </span>
          );
        }

        return amount ? (
          <span className="font-medium">£{amount.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <span className="text-muted-foreground text-sm">
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              label: "View",
              onClick: () => setRowAction({ variant: "view", row }),
              icon: Eye,
            },
            {
              label: "Edit",
              onClick: () => setRowAction({ variant: "update", row }),
              icon: Pencil,
            },
            {
              label: "Delete",
              onClick: () => setRowAction({ variant: "delete", row }),
              icon: Trash,
              destructive: true,
            },
          ]}
          row={row}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
