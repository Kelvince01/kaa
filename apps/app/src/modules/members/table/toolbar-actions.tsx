"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { CreateMemberSheet } from "../components/create-member-sheet";
import type { Member } from "../member.type";

type MembersTableToolbarActionsProps = {
  table: Table<Member>;
};

export function MembersTableToolbarActions({
  table,
}: MembersTableToolbarActionsProps) {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  const handleExportAll = () => {
    const allMembers = table
      .getFilteredRowModel()
      .rows.map((row) => row.original);

    const csv = [
      ["Name", "Slug", "Plan", "Domain", "Status", "Created At"],
      ...allMembers.map((member) => [
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
    a.download = `all-members-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${allMembers.length} member(s)`);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button onClick={handleExportAll} size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
        {/* <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          New Member
        </Button> */}
      </div>
      <CreateMemberSheet
        onOpenChange={setIsCreateSheetOpen}
        open={isCreateSheetOpen}
      />
    </>
  );
}
