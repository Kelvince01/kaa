"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import type { Table } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";
import { SearchField } from "@/components/search-field";
import { exportTableToCSV } from "@/lib/export";
import type { User } from "../../user.type";
import { DeleteUsersDialog } from "../delete-users-dialog";
import { UserForm } from "../user-form";

type UsersTableToolbarActionsProps = {
  table: Table<User>;
};

export function UsersTableToolbarActions({
  table,
}: UsersTableToolbarActionsProps) {
  const selectedUsers = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const hasSelectedUsers = selectedUsers.length > 0;

  return (
    <div className="flex items-center gap-2">
      <SearchField placeholder="Search users" />

      {hasSelectedUsers ? (
        <DeleteUsersDialog
          onOpenChange={(_open: boolean): void => {
            throw new Error("Function not implemented.");
          }}
          onSuccess={() => table.toggleAllRowsSelected(false)}
          open={false}
          users={selectedUsers}
        />
      ) : null}

      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <UserForm
            mode="create"
            onSuccess={() => {
              // Refresh the table or handle success
            }}
          />
        </DialogContent>
      </Dialog>

      <Button
        onClick={() =>
          exportTableToCSV(table, {
            filename: `users-${new Date().toISOString().split("T")[0]}`,
            excludeColumns: ["select", "actions"],
          })
        }
        size="sm"
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  );
}
