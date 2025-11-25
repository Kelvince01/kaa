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
import { CheckCircle2, Download, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  DataTableActionBar,
  DataTableActionBarAction,
  DataTableActionBarSelection,
} from "@/components/ui/data-table/data-table-action-bar";
import { exportTableToCSV } from "@/lib/export";
import { useUpdateApplications } from "../application.mutations";
import { type Application, ApplicationStatus } from "../application.type";

const actions = ["update-status", "export", "delete"] as const;

type Action = (typeof actions)[number];

type ApplicationsTableActionBarProps = {
  table: Table<Application>;
};

export function ApplicationsTableActionBar({
  table,
}: ApplicationsTableActionBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows;
  const [isPending, startTransition] = React.useTransition();
  const [currentAction, setCurrentAction] = React.useState<Action | null>(null);
  const { mutateAsync: updateApplications } = useUpdateApplications();
  const { useDeleteApplications } = require("../application.mutations");
  const deleteApplicationsMutation = useDeleteApplications();

  const getIsActionPending = React.useCallback(
    (action: Action) => isPending && currentAction === action,
    [isPending, currentAction]
  );

  const onApplicationUpdate = React.useCallback(
    (value: Application["status"]) => {
      setCurrentAction("update-status");
      startTransition(async () => {
        const response = await updateApplications({
          ids: rows.map((row) => row.original._id),
          data: { status: value },
        });

        toast.success("Applications updated");
      });
    },
    [rows, updateApplications]
  );

  const onApplicationExport = React.useCallback(() => {
    setCurrentAction("export");
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ["select", "actions"],
        onlySelected: true,
      });
    });
  }, [table]);

  const onApplicationDelete = React.useCallback(() => {
    setCurrentAction("delete");
    startTransition(async () => {
      const { error } = await deleteApplicationsMutation.mutateAsync({
        ids: rows.map((row) => row.original._id),
      });

      if (error) {
        toast.error(error);
        return;
      }
      table.toggleAllRowsSelected(false);
    });
  }, [table, deleteApplicationsMutation, rows]);

  return (
    <DataTableActionBar table={table} visible={rows.length > 0}>
      <DataTableActionBarSelection table={table} />
      <Separator
        className="hidden data-[orientation=vertical]:h-5 sm:block"
        orientation="vertical"
      />
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={(value: Application["status"]) =>
            onApplicationUpdate(value)
          }
        >
          <SelectTrigger asChild>
            <DataTableActionBarAction
              isPending={getIsActionPending("update-status")}
              size="icon"
              tooltip="Update status"
            >
              <CheckCircle2 />
            </DataTableActionBarAction>
          </SelectTrigger>
          <SelectContent align="center">
            <SelectGroup>
              {Object.values(ApplicationStatus).map((status) => (
                <SelectItem className="capitalize" key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DataTableActionBarAction
          isPending={getIsActionPending("export")}
          onClick={onApplicationExport}
          size="icon"
          tooltip="Export applications"
        >
          <Download />
        </DataTableActionBarAction>
        <DataTableActionBarAction
          isPending={getIsActionPending("delete")}
          onClick={onApplicationDelete}
          size="icon"
          tooltip="Delete applications"
        >
          <Trash2 />
        </DataTableActionBarAction>
      </div>
    </DataTableActionBar>
  );
}
