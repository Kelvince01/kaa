"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  CalendarIcon,
  CheckCircle2,
  CircleDashed,
  CircleIcon,
  CircleX,
  Ellipsis,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";
import type { Organization, OrganizationType } from "../organization.type";

const TYPE_COLORS: Record<OrganizationType, string> = {
  landlord: "bg-blue-100 text-blue-800",
  property_manager: "bg-purple-100 text-purple-800",
  agency: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

const TYPE_LABELS: Record<OrganizationType, string> = {
  landlord: "Landlord",
  property_manager: "Property Manager",
  agency: "Agency",
  other: "Other",
};

export function getStatusIcon(isActive: boolean) {
  return isActive ? CheckCircle2 : CircleX;
}

type GetOrganizationsTableColumnsProps = {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Organization> | null>
  >;
};

export function getOrganizationsTableColumns({
  setRowAction,
}: GetOrganizationsTableColumnsProps): ColumnDef<Organization>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const org = row.original;
        const Icon = getStatusIcon(org.isActive);

        return (
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${org.isActive ? "text-green-600" : "text-red-600"}`}
            />
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-muted-foreground text-xs">{org.slug}</span>
            </div>
          </div>
        );
      },
      meta: {
        label: "Organization name",
        placeholder: "Search organization name...",
        variant: "text",
        icon: Building2,
      },
      enableColumnFilter: true,
    },
    {
      id: "type",
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.original.type;

        return (
          <Badge
            className={`${TYPE_COLORS[type]} capitalize`}
            variant="outline"
          >
            {TYPE_LABELS[type]}
          </Badge>
        );
      },
      meta: {
        label: "Type",
        variant: "multiSelect",
        options: [
          {
            label: "Landlord",
            value: "landlord",
            icon: CircleIcon,
          },
          {
            label: "Property Manager",
            value: "property_manager",
            icon: CircleIcon,
          },
          {
            label: "Agency",
            value: "agency",
            icon: CircleIcon,
          },
          {
            label: "Other",
            value: "other",
            icon: CircleIcon,
          },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => {
        const email = row.original.email;

        return (
          <a
            className="flex items-center gap-1 text-blue-600 hover:underline"
            href={`mailto:${email}`}
          >
            <Mail className="h-3 w-3" />
            {email}
          </a>
        );
      },
      meta: {
        label: "Email",
        placeholder: "Search email...",
        variant: "text",
        icon: Mail,
      },
      enableColumnFilter: true,
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => {
        const phone = row.original.phone;

        return (
          <a
            className="flex items-center gap-1 text-blue-600 hover:underline"
            href={`tel:${phone}`}
          >
            <Phone className="h-3 w-3" />
            {phone}
          </a>
        );
      },
      meta: {
        label: "Phone",
        placeholder: "Search phone...",
        variant: "text",
        icon: Phone,
      },
      enableColumnFilter: true,
    },
    {
      id: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Location" />
      ),
      cell: ({ row }) => {
        const address = row.original.address;

        return (
          <div className="text-sm">
            <div>{`${address.county || "-"}, ${address.town || "-"}`}</div>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const Icon = getStatusIcon(isActive);

        return (
          <Badge
            className="py-1 [&>svg]:size-3.5"
            variant={isActive ? "default" : "outline"}
          >
            <Icon />
            <span>{isActive ? "Active" : "Inactive"}</span>
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: [
          {
            label: "Active",
            value: "true",
            icon: CheckCircle2,
          },
          {
            label: "Inactive",
            value: "false",
            icon: CircleX,
          },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue<string>()),
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
                <DropdownMenuSubTrigger>View Details</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/organizations/${row.original._id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/members?organization=${row.original._id}`}
                    >
                      View Members
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/admin/properties?organization=${row.original._id}`}
                    >
                      View Properties
                    </Link>
                  </DropdownMenuItem>
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
