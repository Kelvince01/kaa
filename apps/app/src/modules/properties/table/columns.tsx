"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bath,
  Bed,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Ellipsis,
  Home,
  MapPin,
  Ruler,
  XCircle,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import type { Property } from "../property.type";

const propertyTypeIcons = {
  house: Home,
  flat: Home,
  apartment: Building2,
  studio: Home,
  villa: Home,
  office: Building2,
  land: MapPin,
  other: Home,
};

export function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "available":
      return "success";
    case "rented":
    case "sold":
      return "destructive";
    case "pending":
      return "warning";
    case "inactive":
      return "outline";
    default:
      return "default";
  }
}

type GetPropertiesTableColumnsProps = {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Property> | null>
  >;
};

export function getPropertiesTableColumns({
  setRowAction,
}: GetPropertiesTableColumnsProps): ColumnDef<Property>[] {
  // const { mutateAsync: updateProperty } = useUpdateProperty();

  const handleStatusUpdate = (_id: string, status: Property["status"]) => {
    try {
      // await updateProperty({ id, data: { status } });
      toast.success(`Property marked as ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
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
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => {
        const property = row.original;
        const PropertyTypeIcon =
          propertyTypeIcons[property.type as keyof typeof propertyTypeIcons] ||
          Home;

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <PropertyTypeIcon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="font-medium">{property.title}</div>
              <div className="flex items-center text-muted-foreground text-xs">
                <MapPin className="mr-1 h-3 w-3" />
                {property.location.address.line1},{" "}
                {property.location.address.town}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;
        return <span className="capitalize">{type}</span>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => {
        const { bedrooms, bathrooms, totalArea } = row.original.specifications;
        return (
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm">
              <Bed className="mr-1 h-4 w-4" />
              {bedrooms}
            </div>
            <div className="flex items-center text-sm">
              <Bath className="mr-1 h-4 w-4" />
              {bathrooms}
            </div>
            {totalArea && (
              <div className="flex items-center text-sm">
                <Ruler className="mr-1 h-4 w-4" />
                {totalArea} m²
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "pricing.rentAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const { rent, currency, paymentFrequency } = row.original.pricing;
        return (
          <div className="flex items-center">
            <DollarSign className="mr-1 h-4 w-4" />
            {formatCurrency(rent, currency)}
            <span className="ml-1 text-muted-foreground text-xs">
              /{paymentFrequency}
            </span>
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
        const status = row.original.status || "inactive";
        return (
          <Badge className="capitalize" variant={getStatusBadgeVariant(status)}>
            {status.replace("_", " ")}
          </Badge>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center text-sm">
          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
          {formatDate(row.original.createdAt)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const property = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                variant="ghost"
              >
                <Ellipsis className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                onClick={() => {
                  setRowAction({
                    variant: "view",
                    row,
                  });
                }}
              >
                View details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRowAction({
                    variant: "update",
                    row,
                  });
                }}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-green-600"
                onClick={() =>
                  handleStatusUpdate(property._id, "available" as any)
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Available
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-amber-600"
                onClick={() =>
                  handleStatusUpdate(property._id, "rented" as any)
                }
              >
                <Clock className="mr-2 h-4 w-4" />
                Mark as Rented
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  handleStatusUpdate(property._id, "inactive" as any)
                }
              >
                <XCircle className="mr-2 h-4 w-4" />
                Mark as Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
