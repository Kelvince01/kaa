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
  Text,
  Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";
import type { Member, MemberPlan } from "../member.type";

const PLAN_COLORS: Record<MemberPlan, string> = {
  free: "bg-gray-100 text-gray-800",
  starter: "bg-blue-100 text-blue-800",
  professional: "bg-purple-100 text-purple-800",
  enterprise: "bg-green-100 text-green-800",
};

export function getStatusIcon(isActive: boolean) {
  return isActive ? CheckCircle2 : CircleX;
}

type GetMembersTableColumnsProps = {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<Member> | null>
  >;
  onViewStats?: (member: Member) => void;
};

export function getMembersTableColumns({
  setRowAction,
  onViewStats,
}: GetMembersTableColumnsProps): ColumnDef<Member>[] {
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
        const member = row.original;
        const Icon = getStatusIcon(member.isActive);

        return (
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${member.isActive ? "text-green-600" : "text-red-600"}`}
            />
            <div className="flex flex-col">
              <span className="font-medium">{member.name}</span>
              <span className="text-muted-foreground text-xs">
                {member.slug}
              </span>
            </div>
          </div>
        );
      },
      meta: {
        label: "Member name",
        placeholder: "Search member name...",
        variant: "text",
        icon: Building2,
      },
      enableColumnFilter: true,
    },
    {
      id: "plan",
      accessorKey: "plan",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plan" />
      ),
      cell: ({ row }) => {
        const plan =
          typeof row.original.plan === "string"
            ? row.original.plan
            : (row.original.plan as any)?.name || "free";

        return (
          <Badge
            className={`${PLAN_COLORS[plan as MemberPlan] || PLAN_COLORS.free} capitalize`}
            variant="outline"
          >
            {plan}
          </Badge>
        );
      },
      meta: {
        label: "Plan",
        variant: "multiSelect",
        options: [
          {
            label: "Free",
            value: "free",
            icon: CircleIcon,
          },
          {
            label: "Starter",
            value: "starter",
            icon: CircleIcon,
          },
          {
            label: "Professional",
            value: "professional",
            icon: CircleIcon,
          },
          {
            label: "Enterprise",
            value: "enterprise",
            icon: CircleIcon,
          },
        ],
        icon: CircleDashed,
      },
      enableColumnFilter: true,
    },
    {
      id: "usage",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Usage" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        const userPercentage = Math.round(
          (member.usage.users / member.limits.users) * 100
        );

        return (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {member.usage.users} / {member.limits.users}
            </span>
            <span
              className={`text-xs ${userPercentage > 80 ? "text-red-600" : "text-muted-foreground"}`}
            >
              ({userPercentage}%)
            </span>
          </div>
        );
      },
    },
    {
      id: "domain",
      accessorKey: "domain",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Domain" />
      ),
      cell: ({ row }) => {
        const domain = row.original.domain;
        return domain ? (
          <a
            className="text-blue-600 hover:underline"
            href={domain}
            rel="noopener noreferrer"
            target="_blank"
          >
            {domain}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
      meta: {
        label: "Domain",
        placeholder: "Search domain...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
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
                    <Link href={`/admin/members/${row.original._id}`}>
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (onViewStats) {
                        onViewStats(row.original);
                      }
                    }}
                  >
                    View Usage
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
