"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImageNext,
} from "@kaa/ui/components/avatar";
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
  Clock,
  Ellipsis,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  UserX,
} from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { getErrorMessage } from "@/lib/handle-error";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";

import { UserRole, UserStatus, type User as UserType } from "../../user.type";

export function getStatusIcon(status: UserType["status"]) {
  const statusIcons = {
    [UserStatus.INACTIVE]: UserX,
    [UserStatus.ACTIVE]: UserCheck,
    [UserStatus.SUSPENDED]: ShieldAlert,
    [UserStatus.PENDING]: Clock,
    [UserStatus.LOCKED]: ShieldCheck,
  };

  const Icon = statusIcons[status] || UserIcon;
  return <Icon className="h-4 w-4" />;
}

export function getRoleBadge(role: UserRole) {
  const roleColors = {
    [UserRole.SUPER_ADMIN]:
      "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50",
    [UserRole.ADMIN]:
      "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50",
    [UserRole.MANAGER]:
      "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
    [UserRole.AGENT]:
      "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50",
    [UserRole.LANDLORD]:
      "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50",
    [UserRole.TENANT]:
      "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50",
    [UserRole.MAINTENANCE]:
      "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50",
    [UserRole.STAFF]:
      "bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-900/50",
    [UserRole.VIEWER]:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:hover:bg-gray-900/50",
    [UserRole.USER]:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:hover:bg-gray-900/50",
  };

  const roleLabels = {
    [UserRole.SUPER_ADMIN]: "Super Admin",
    [UserRole.ADMIN]: "Admin",
    [UserRole.MANAGER]: "Manager",
    [UserRole.AGENT]: "Agent",
    [UserRole.LANDLORD]: "Landlord",
    [UserRole.TENANT]: "Tenant",
    [UserRole.MAINTENANCE]: "Maintenance",
    [UserRole.STAFF]: "Staff",
    [UserRole.VIEWER]: "Viewer",
    [UserRole.USER]: "User",
  };

  return (
    <Badge className={roleColors[role]} variant="secondary">
      {roleLabels[role] || role}
    </Badge>
  );
}

type GetUsersTableColumnsProps = {
  statusCounts: Record<UserType["status"], number>;
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<UserType> | null>
  >;
};

export function getUsersTableColumns({
  statusCounts,
  setRowAction,
}: GetUsersTableColumnsProps): ColumnDef<UserType>[] {
  // const { mutateAsync: updateUser } = useUpdateUser();

  const handleStatusUpdate = (_userId: string, status: UserStatus) => {
    try {
      // await updateUser({ id: userId, data: { status } });
      toast.success(`User status updated to ${status}`);
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
          className="translate-y-[2px] cursor-pointer"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-[2px] cursor-pointer"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // {
    //   accessorKey: "memberId",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="ID" />
    //   ),
    //   cell: ({ row }) => (
    //     <div className="w-[80px] font-mono text-sm">
    //       {(row.original.memberId as { name: string })?.name || "-"}
    //     </div>
    //   ),
    //   enableSorting: true,
    //   enableHiding: true,
    // },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              {/* <UserIcon className="h-4 w-4" /> */}
              <Avatar className="size-5">
                {row.original.avatar && (
                  <AvatarImageNext
                    alt={`${user.firstName} ${user.lastName} avatar`}
                    height={20}
                    quality={100}
                    src={row.original.avatar}
                    width={20}
                  />
                )}
                <AvatarFallback className="font-medium text-[9px]">
                  {user.firstName?.[0]} {user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="font-medium">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-muted-foreground text-xs">{user.email}</div>
            </div>
          </div>
        );
      },
      enableSorting: true,
      enableHiding: false,
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => {
        return <span>{row.original.email}</span>;
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) =>
        getRoleBadge((row.original.role as { name: UserRole }).name),
      filterFn: (row, _id, value) => {
        return value.includes((row.original.role as { name: UserRole }).name);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const Icon = getStatusIcon(status);
        return (
          <div className="flex items-center space-x-2">
            {Icon}
            <span className="capitalize">{status.toLowerCase()}</span>
          </div>
        );
      },
      filterFn: (row, _id, value) => {
        return value.includes(row.original.status);
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "isVerified",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verified" />
      ),
      cell: ({ row }) => {
        return (
          <span
            className={`inline-flex rounded-full px-2 font-semibold text-xs leading-5 ${
              row.original.isVerified
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.original.isVerified ? "Verified" : "Unverified"}
          </span>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      header: "Created at",
      accessorKey: "createdAt",
      cell: ({ row }) => {
        if (row.original.createdAt) {
          return <span>{formatDate(row.original.createdAt)}</span>;
        }

        return "-";
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => {
        const lastLogin = row.original.lastLoginAt;
        return (
          <div className="text-muted-foreground text-sm">
            {lastLogin ? formatDate(lastLogin) : "Never"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const statuses = Object.values(UserStatus);

        return (
          <div className="flex items-center justify-end">
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
                    setRowAction({ row, variant: "view" });
                  }}
                >
                  View details
                </DropdownMenuItem>
                {/* TODO: Add verify user */}
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, variant: "update" })}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      onValueChange={(value) =>
                        handleStatusUpdate(user.id, value as UserStatus)
                      }
                      value={user.status}
                    >
                      {statuses.map((status) => (
                        <DropdownMenuRadioItem
                          className="flex items-center"
                          key={status}
                          value={status}
                        >
                          {getStatusIcon(status as UserStatus)}
                          <span className="ml-2 capitalize">
                            {status.toLowerCase()}
                          </span>
                          {statusCounts[status] > 0 && (
                            <span className="ml-auto text-muted-foreground text-xs">
                              {statusCounts[status]}
                            </span>
                          )}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() =>
                    setRowAction({
                      row,
                      variant: "delete",
                    })
                  }
                >
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
