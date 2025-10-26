"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import { Skeleton } from "@kaa/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, Plus, Search, Settings, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useUpdateMaintenance } from "../../maintenance.queries";
import { useMaintenanceStore } from "../../maintenance.store";
import type { Maintenance } from "../../maintenance.type";
import { searchMaintenance } from "../../utils/maintenance-utils";
import { createMaintenanceColumns } from "./columns";

type MaintenanceTableProps = {
  maintenances: Maintenance[];
  isLoading: boolean;
  onCreateMaintenance: () => void;
  onViewMaintenance: (maintenance: Maintenance) => void;
  onEditMaintenance: (maintenance: Maintenance) => void;
  onDeleteMaintenance: (maintenanceId: string) => void;
  onDeleteSelected: (maintenanceIds: string[]) => void;
};

export function MaintenanceTable({
  maintenances,
  isLoading,
  onCreateMaintenance,
  onViewMaintenance,
  onEditMaintenance,
  onDeleteMaintenance,
  onDeleteSelected,
}: MaintenanceTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    selectedMaintenances,
    setSelectedMaintenances,
    toggleMaintenanceSelection,
    clearSelectedMaintenances,
    hasSelectedMaintenances,
    selectedCount,
  } = useMaintenanceStore();

  const updateMaintenanceMutation = useUpdateMaintenance();

  // Filter maintenances based on global search
  const filteredMaintenances = useMemo(
    () =>
      globalFilter.length > 0
        ? searchMaintenance(maintenances, globalFilter)
        : maintenances,
    [maintenances, globalFilter]
  );

  // Handle status change
  const handleStatusChange = async (maintenanceId: string, status: any) => {
    try {
      await updateMaintenanceMutation.mutateAsync({
        id: maintenanceId,
        data: { status },
      });
    } catch (error) {
      console.error("Failed to update maintenance status:", error);
    }
  };

  // Handle select all
  const handleSelectAll = (maintenanceIds: string[]) => {
    setSelectedMaintenances(maintenanceIds);
  };

  // Create columns
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const columns = useMemo(
    () =>
      createMaintenanceColumns({
        onView: onViewMaintenance,
        onEdit: onEditMaintenance,
        onDelete: onDeleteMaintenance,
        onStatusChange: handleStatusChange,
        onSelectChange: toggleMaintenanceSelection,
        onSelectAll: handleSelectAll,
        selectedMaintenances,
      }),
    [
      onViewMaintenance,
      onEditMaintenance,
      onDeleteMaintenance,
      toggleMaintenanceSelection,
      selectedMaintenances,
    ]
  );

  const table = useReactTable({
    data: filteredMaintenances,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="rounded-md border">
          <div className="h-96 w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                className="flex items-center space-x-4 p-4"
                key={i.toString()}
              >
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-64 pl-8"
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Search maintenance requests..."
              value={globalFilter}
            />
          </div>
          {hasSelectedMaintenances() && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{selectedCount()} selected</Badge>
              <Button
                onClick={() => onDeleteSelected(selectedMaintenances)}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                onClick={clearSelectedMaintenances}
                size="sm"
                variant="outline"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="ml-auto" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    className="capitalize"
                    key={column.id}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateMaintenance}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No maintenance requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
