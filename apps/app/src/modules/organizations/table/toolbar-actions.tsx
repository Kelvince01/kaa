"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { CreateOrganizationSheet } from "../components/create-organization-sheet";
import type { Organization } from "../organization.type";

type OrganizationsTableToolbarActionsProps = {
  table: Table<Organization>;
};

export function OrganizationsTableToolbarActions({
  table,
}: OrganizationsTableToolbarActionsProps) {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  const handleExportAll = () => {
    const allOrganizations = table
      .getFilteredRowModel()
      .rows.map((row) => row.original);

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
      ...allOrganizations.map((org) => [
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
    a.download = `all-organizations-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${allOrganizations.length} organization(s)`);
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
          New Organization
        </Button> */}
      </div>
      <CreateOrganizationSheet
        onOpenChange={setIsCreateSheetOpen}
        open={isCreateSheetOpen}
      />
    </>
  );
}
