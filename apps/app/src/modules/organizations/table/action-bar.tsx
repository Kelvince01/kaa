"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { DownloadIcon, Trash2, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { DeleteOrganizationsDialog } from "../components/delete-organizations-dialog";
import type { Organization } from "../organization.type";

type OrganizationsTableActionBarProps = {
  table: Table<Organization>;
};

export function OrganizationsTableActionBar({
  table,
}: OrganizationsTableActionBarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const selectedOrganizations = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  const handleExport = () => {
    // Export selected organizations to CSV
    const csv = [
      [
        "Name",
        "Slug",
        "Type",
        "Email",
        "Phone",
        "Location",
        "Status",
        "Created At",
      ],
      ...selectedOrganizations.map((org) => [
        org.name,
        org.slug,
        org.type,
        org.email,
        org.phone,
        `${org.address.county}, ${org.address.town}`,
        org.isActive ? "Active" : "Inactive",
        new Date(org.createdAt).toISOString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `organizations-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedRowCount} organization(s)`);
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
      <DeleteOrganizationsDialog
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={() => {
          table.toggleAllRowsSelected(false);
        }}
        open={isDeleteDialogOpen}
        organizations={selectedOrganizations}
        showTrigger={false}
      />
    </>
  );
}
