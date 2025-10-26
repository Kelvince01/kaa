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
import {
  ArrowUpDown,
  Copy,
  Eye,
  Mail,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import type { Reference } from "../../reference.type";
import {
  formatDate,
  getRelativeTime,
  isReferenceExpired,
} from "../../utils/reference-utils";
import { StatusBadge } from "../status/status-badge";
import { TypeBadge } from "../status/type-badge";

type ReferenceActionsProps = {
  reference: Reference;
  onView: (reference: Reference) => void;
  onResend: (referenceId: string) => void;
  onCopyLink: (reference: Reference) => void;
};

function ReferenceActions({
  reference,
  onView,
  onResend,
  onCopyLink,
}: ReferenceActionsProps) {
  return (
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
        <DropdownMenuItem onClick={() => onView(reference)}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopyLink(reference)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Reference Link
        </DropdownMenuItem>
        {reference.status === "pending" && !isReferenceExpired(reference) && (
          <DropdownMenuItem onClick={() => onResend(reference._id)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend Invitation
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onView(reference)}>
          <Mail className="mr-2 h-4 w-4" />
          Contact Reference
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type CreateColumnsProps = {
  onView: (reference: Reference) => void;
  onResend: (referenceId: string) => void;
  onCopyLink: (reference: Reference) => void;
  onSelectChange: (referenceId: string) => void;
  onSelectAll: (referenceIds: string[]) => void;
  selectedReferences: string[];
};

export function createReferenceColumns({
  onView,
  onResend,
  onCopyLink,
  onSelectChange,
  onSelectAll,
  selectedReferences,
}: CreateColumnsProps): ColumnDef<Reference>[] {
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
            const allReferenceIds = table
              .getRowModel()
              .rows.map((row) => row.original._id);
            onSelectAll(value ? allReferenceIds : []);
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={selectedReferences.includes(row.original._id)}
          onCheckedChange={() => onSelectChange(row.original._id)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Reference Provider column
    {
      accessorKey: "referenceProvider",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Reference Provider
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const provider = row.original.referenceProvider;
        const isExpired = isReferenceExpired(row.original);

        return (
          <div className="flex flex-col">
            <span
              className={`font-medium ${isExpired ? "text-muted-foreground" : ""}`}
            >
              {provider.name}
            </span>
            <span className="text-muted-foreground text-sm">
              {provider.email}
            </span>
            <span className="text-muted-foreground text-xs">
              {provider.relationship}
            </span>
          </div>
        );
      },
    },
    // Type column
    {
      accessorKey: "referenceType",
      header: "Type",
      cell: ({ row }) => (
        <TypeBadge showIcon type={row.original.referenceType} />
      ),
    },
    // Status column
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isExpired = isReferenceExpired(row.original);
        return (
          <div className="flex items-center gap-2">
            <StatusBadge status={row.original.status} />
            {isExpired && row.original.status === "pending" && (
              <span className="text-destructive text-xs">(Expired)</span>
            )}
          </div>
        );
      },
    },
    // Rating column
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = row.original.rating;
        if (!rating) return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex items-center gap-1">
            <span className="font-medium">{rating}</span>
            <span className="text-muted-foreground text-sm">/5</span>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  className={`text-xs ${i < rating ? "text-yellow-400" : "text-muted-foreground"}`}
                  key={i.toString()}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        );
      },
    },
    // Submitted Date column
    {
      accessorKey: "submittedAt",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Submitted
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {formatDate(row.original.submittedAt)}
          </span>
          <span className="text-muted-foreground text-xs">
            {getRelativeTime(row.original.submittedAt)}
          </span>
        </div>
      ),
    },
    // Completed Date column
    {
      accessorKey: "completedAt",
      header: ({ column }) => (
        <Button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Completed
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const completedAt = row.original.completedAt;
        if (!completedAt)
          return <span className="text-muted-foreground">-</span>;

        return (
          <div className="flex flex-col">
            <span className="text-sm">{formatDate(completedAt)}</span>
            <span className="text-muted-foreground text-xs">
              {getRelativeTime(completedAt)}
            </span>
          </div>
        );
      },
    },
    // Expires At column
    {
      accessorKey: "expiresAt",
      header: "Expires",
      cell: ({ row }) => {
        const expiresAt = row.original.expiresAt;
        const isExpired = isReferenceExpired(row.original);

        return (
          <div className="flex flex-col">
            <span className={`text-sm ${isExpired ? "text-destructive" : ""}`}>
              {formatDate(expiresAt)}
            </span>
            <span
              className={`text-xs ${isExpired ? "text-destructive" : "text-muted-foreground"}`}
            >
              {isExpired ? "Expired" : getRelativeTime(expiresAt)}
            </span>
          </div>
        );
      },
    },
    // Actions column
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <ReferenceActions
          onCopyLink={onCopyLink}
          onResend={onResend}
          onView={onView}
          reference={row.original}
        />
      ),
    },
  ];
}
