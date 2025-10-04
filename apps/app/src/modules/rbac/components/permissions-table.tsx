"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@kaa/ui/components/alert-dialog";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Input } from "@kaa/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  type PaginationState,
  type Table as ReactTable,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Filter, Loader2, Search, Trash2, X } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableFacetedFilter } from "@/components/ui/data-table/data-table-faceted-filter";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/ui/data-table/data-table-row-actions";
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options";
import useDebounce from "@/hooks/use-debounce";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { useDeletePermission, usePermissions } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import type { Permission, PermissionAction } from "../rbac.type";
import { CreatePermissionSheet } from "./create-permission-sheet";

type PermissionsTableProps = {
  roleId?: string;
};

export function PermissionsTable({ roleId }: PermissionsTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const debouncedSetColumnFilters: ColumnFiltersState = useDebounce(
    columnFilters,
    1000
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [actions, setActions] = React.useState<string[]>([]);
  const [resources, setResources] = React.useState<string[]>([]);

  const { data: permissionsData, isLoading } = usePermissions({
    roleId,
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
    sort: sorting[0]?.id,
    order: sorting[0]?.desc ? "desc" : "asc",
    q: columnFilters.find((filter) => filter.id === "name")?.value as string,
    resource: columnFilters.find((filter) => filter.id === "resource")
      ?.value as string,
    action: columnFilters.find((filter) => filter.id === "action")
      ?.value as PermissionAction,
  });
  const deletePermission = useDeletePermission();
  const { selectedPermissions, togglePermissionSelection } = useRBACStore();

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Permission> | null>(null);

  React.useEffect(() => {
    setActions(
      Array.from(
        new Set(
          permissionsData?.meta.actions ||
            permissionsData?.permissions?.map(
              (permission) => permission.action
            ) ||
            []
        )
      )
    );
    setResources(
      Array.from(
        new Set(
          permissionsData?.meta.resources ||
            permissionsData?.permissions?.map(
              (permission) => permission.resource
            ) ||
            []
        )
      )
    );
  }, [
    permissionsData?.meta.actions,
    permissionsData?.meta.resources,
    permissionsData?.permissions,
  ]);

  const columns = React.useMemo(
    () => getPermissionsTableColumns({ setRowAction }),
    []
  );

  const table = useReactTable({
    data: permissionsData?.permissions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),

    // Row selection configuration
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,

    // Sorting configuration
    onSortingChange: setSorting,
    enableMultiSort: true,
    manualSorting: true,
    sortDescFirst: true,
    // getSortedRowModel: getSortedRowModel(),

    // Filtering configuration
    onColumnFiltersChange: setColumnFilters,
    manualFiltering: true,
    // getFilteredRowModel: getFilteredRowModel(),

    // Pagination configuration
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    rowCount: permissionsData?.pagination.total,
    pageCount: Math.ceil(
      (permissionsData?.pagination.total || 0) /
        (permissionsData?.pagination.limit || 1)
    ),
    manualPagination: true,

    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters: debouncedSetColumnFilters,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Reset pagination to first page when column filters change
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (setPagination) {
      setPagination((pagination) => ({
        pageIndex: 0,
        pageSize: pagination.pageSize,
      }));
    }
  }, [debouncedSetColumnFilters]);

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        actions={actions}
        resources={resources}
        rowCount={permissionsData?.pagination.total || 0}
        table={table}
      />
      <div className="rounded-md border">
        {/*
              <input
                checked={
                  (permissionsData?.permissions?.length as number) > 0 &&
                  permissionsData?.permissions.every((permission) =>
                    selectedPermissions.includes(permission.id)
                  )
                }
                onChange={(e) => {
                  const allPermissionIds =
                    permissionsData?.permissions?.map(
                      (permission) => permission.id
                    ) || [];
                  if (e.target.checked) {
                    for (const id of allPermissionIds) {
                      if (!selectedPermissions.includes(id)) {
                        togglePermissionSelection(id);
                      }
                    }
                  } else {
                    for (const id of allPermissionIds) {
                      if (selectedPermissions.includes(id)) {
                        togglePermissionSelection(id);
                      }
                    }
                  }
                }}
                type="checkbox"
              />
                <input
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => togglePermissionSelection(permission.id)}
                  type="checkbox"
                />
              
           */}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead colSpan={header.colSpan} key={header.id}>
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      {/* Update Permission Sheet */}
      {rowAction?.variant === "update" ? (
        <CreatePermissionSheet
          onOpenChange={(open: any) => !open && setRowAction(null)}
          open={true}
          permissionId={rowAction?.row?.original?.id}
        />
      ) : null}

      {/* Delete Permission Dialog */}
      {rowAction?.variant === "delete" ? (
        <DeletePermissionDialog
          onOpenChange={(open: any) => !open && setRowAction(null)}
          open={true}
          permission={rowAction.row?.original as Permission}
        />
      ) : null}
    </div>
  );
}

type GetColumnsOptions = {
  setRowAction: (action: DataTableRowAction<Permission> | null) => void;
};

export const getPermissionsTableColumns = ({
  setRowAction,
}: GetColumnsOptions): ColumnDef<Permission>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        className="translate-y-[2px]"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        className="translate-y-[2px]"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "resource",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Resource" />
    ),
    cell: ({ row }) => {
      const resource = row.original.resource;

      return (
        <div className="flex gap-2">
          {resource && <Badge variant="outline">{resource}</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    enableSorting: true,
    enableHiding: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
    cell: ({ row }) => {
      const action = row.original.action;

      return (
        <div className="flex gap-2">
          {action && <Badge variant="outline">{action}</Badge>}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    enableSorting: false,
    enableHiding: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.original.description;

      return (
        <div className="flex items-center gap-2">
          <span>{description || "-"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isSystem",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => (
      <Badge variant={row.original.isSystem ? "secondary" : "default"}>
        {row.original.isSystem ? "System" : "Custom"}
      </Badge>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => (
      <span>{format(new Date(row.original.createdAt), "PP")}</span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        actions={[
          {
            label: "Edit",
            onClick: () => setRowAction({ variant: "update", row }),
            icon: Edit,
          },
          {
            label: "Delete",
            onClick: () => setRowAction({ variant: "delete", row }),
            icon: Trash2,
            destructive: true,
            disabled: !!row.original.isSystem,
          },
        ]}
        row={row}
      />
    ),
  },
];

type DataTableToolbarProps<TData> = {
  table: ReactTable<TData>;
  resources: string[];
  actions: string[];
  rowCount: number;
};

export function DataTableToolbar<TData>({
  table,
  resources,
  actions,
  rowCount,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  /* Filters and Search */
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-gray-400" />
            <Input
              className="h-8 w-[150px] pl-10 lg:w-[250px]"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              placeholder="Filter permissions..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
            />
            {/* {table.getColumn("name")?.getFilterValue() && (
            <Button
              className="absolute top-1 right-1 h-7 w-7 p-0"
              onClick={() => table.getColumn("name")?.setFilterValue("")}
              size="sm"
              variant="ghost"
            >
              <X className="h-3 w-3" />
            </Button>
          )} */}
          </div>

          {table.getColumn("resource") && (
            <DataTableFacetedFilter
              column={table.getColumn("resource")}
              options={resources.map((resource) => ({
                label: resource,
                value: resource,
              }))}
              title="Resource"
            />
          )}
          {table.getColumn("action") && (
            <DataTableFacetedFilter
              column={table.getColumn("action")}
              options={actions.map((action) => ({
                label: action,
                value: action,
              }))}
              title="Action"
            />
          )}

          {isFiltered && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{rowCount} permissions found</Badge>
            </div>
          )}

          {isFiltered && (
            <Button
              onClick={() => table.resetColumnFilters()}
              size="sm"
              variant="ghost"
            >
              Reset
              <X />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DeletePermissionDialog({
  permission,
  onOpenChange,
  open,
}: {
  permission: Permission | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const deletePermission = useDeletePermission();

  const handleDelete = async () => {
    await deletePermission.mutateAsync(permission?.id || "");
    onOpenChange(false);
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Delete Permission</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete permission "{permission?.name}"?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deletePermission.isPending}
            onClick={handleDelete}
          >
            {deletePermission.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Permission"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
