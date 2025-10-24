"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { exportTableToCSV } from "@/lib/export";
import type { Application } from "../application.type";
import { CreateApplicationSheet } from "../components/create-application-sheet";
import { DeleteApplicationsDialog } from "../components/delete-applications-dialog";

type ApplicationsTableToolbarActionsProps = {
  table: Table<Application>;
};

export function ApplicationsTableToolbarActions({
  table,
}: ApplicationsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteApplicationsDialog
          applications={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <CreateApplicationSheet />
      <Button
        onClick={() =>
          exportTableToCSV(table, {
            filename: "applications",
            excludeColumns: ["select", "actions"],
          })
        }
        size="sm"
        variant="outline"
      >
        <Download />
        Export
      </Button>
      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}
