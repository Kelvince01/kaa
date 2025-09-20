"use client";

import { Separator } from "@kaa/ui/components/separator";
import type { Table } from "@tanstack/react-table";
import { Download, Trash2 } from "lucide-react";
import * as React from "react";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/ui/data-table/data-table-action-bar";
import { exportTableToCSV } from "@/lib/export";
import type { FileType } from "../file.type";

const actions = ["export", "delete"] as const;

type Action = (typeof actions)[number];

type FilesTableActionBarProps = {
  table: Table<FileType>;
};

export function FilesTableActionBar({ table }: FilesTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction]
  );

  const onFileExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
        filename: `files-${new Date().toISOString()}`,
      });
      setCurrentAction(null);
    });
  }, [table]);

  const onFileDelete = React.useCallback(() => {
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
        <DataTableActionBarAction
          isPending={getIsActionPending("export")}
          onClick={onFileExport}
          size="icon"
          tooltip="Export files"
        >
          <Download className="h-4 w-4" />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          isPending={getIsActionPending("delete")}
          onClick={onFileDelete}
          size="icon"
          tooltip="Delete files"
        >
          <Trash2 className="h-4 w-4" />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
