"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { DownloadIcon, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DeleteMembersDialog } from "../components/delete-members-dialog";
import type { Member } from "../member.type";

type MembersTableActionBarProps = {
  table: Table<Member>;
};

export function MembersTableActionBar({ table }: MembersTableActionBarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const selectedMembers = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  const handleExport = () => {
    // Export selected members to CSV
    const csv = [
      ["Name", "Slug", "Plan", "Domain", "Status", "Created At"],
      ...selectedMembers.map((member) => [
        member.name,
        member.slug,
        typeof member.plan === "string"
          ? member.plan
          : (member.plan as any)?.name || "",
        member.domain || "",
        member.isActive ? "Active" : "Inactive",
        new Date(member.createdAt).toISOString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `members-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedRowCount} member(s)`);
  };

  return (
    <>
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {selectedRowCount} of {table.getFilteredRowModel().rows.length}{" "}
            row(s) selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} size="sm" variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            onClick={() => table.toggleAllRowsSelected(false)}
            size="sm"
            variant="outline"
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
      <DeleteMembersDialog
        members={selectedMembers}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={() => {
          table.toggleAllRowsSelected(false);
        }}
        open={isDeleteDialogOpen}
        showTrigger={false}
      />
    </>
  );
}
