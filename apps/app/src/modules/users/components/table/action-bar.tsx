"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@kaa/ui/components/select";
import { Separator } from "@kaa/ui/components/separator";
import { SelectTrigger } from "@radix-ui/react-select";
import type { Table } from "@tanstack/react-table";
import { CheckCircle2, Download, Trash2, UserCheck, UserX } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/ui/data-table/data-table-action-bar";
import { exportTableToCSV } from "@/lib/export";
import { useUpdateUser } from "../../user.queries";
import { type User, UserStatus } from "../../user.type";

const actions = ["update-status", "export", "delete"] as const;

type Action = (typeof actions)[number];

type UsersTableActionBarProps = {
  table: Table<User>;
};

export function UsersTableActionBar({ table }: UsersTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const { mutateAsync: updateUser } = useUpdateUser();

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction]
  );

  const onUserStatusUpdate = React.useCallback(
    (status: UserStatus) => {
      setCurrentAction("update-status");
      startTransition(async () => {
        try {
          await Promise.all(
            rows.map((row) =>
              updateUser({
                id: row.original.id,
                data: { status },
              })
            )
          );
          toast.success(`Updated ${rows.length} user(s) status to ${status}`);
          table.toggleAllRowsSelected(false);
        } catch (error) {
          toast.error("Failed to update user status");
        } finally {
          setCurrentAction(null);
        }
      });
    },
    [rows, updateUser, table]
  );

  const onUserExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
        filename: `users-${new Date().toISOString()}`,
      });
      setCurrentAction(null);
    });
  }, [table]);

  const onUserDelete = React.useCallback(() => {
    setCurrentAction("delete");
    // This will be handled by the parent component via rowAction
    setCurrentAction(null);
  }, []);

  if (rows.length === 0) return null;

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        className="hidden data-[orientation=vertical]:h-5 sm:block"
        orientation="vertical"
      />
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={(value: UserStatus) => onUserStatusUpdate(value)}
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-status")}
              size="icon"
              tooltip="Update status"
            >
              <UserCheck className="h-4 w-4" />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {Object.values(UserStatus).map((status) => (
                <SelectItem className="capitalize" key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {status === UserStatus.ACTIVE ? (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    ) : status === UserStatus.INACTIVE ? (
                      <UserX className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>{status.toLowerCase()}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          isPending={getIsActionPending("export")}
          onClick={onUserExport}
          size="icon"
          tooltip="Export users"
        >
          <Download className="h-4 w-4" />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          isPending={getIsActionPending("delete")}
          onClick={onUserDelete}
          size="icon"
          tooltip="Delete users"
        >
          <Trash2 className="h-4 w-4" />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
