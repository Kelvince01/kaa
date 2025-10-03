"use client";

import { Badge } from "@kaa/ui/components/badge";
// import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
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
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Trash2 } from "lucide-react";
import * as React from "react";
import { useEffect } from "react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/ui/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import useDebounce from "@/hooks/use-debounce";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { useDeletePermission, usePermissions } from "../rbac.queries";
import { useRBACStore } from "../rbac.store";
import type { Permission } from "../rbac.type";

type PermissionsTableProps = {
  roleId?: string;
  onEditPermission?: (permission: Permission) => void;
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

  const { data: permissionsData, isLoading } = usePermissions({
    roleId,
    offset: pagination.pageIndex * pagination.pageSize,
    limit: pagination.pageSize,
  });
  const deletePermission = useDeletePermission();
  const { selectedPermissions, togglePermissionSelection } = useRBACStore();

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Permission> | null>(null);

  const columns = React.useMemo(
    () => getPermissionsTableColumns({ setRowAction }),
    []
  );

  const table = useReactTable({
    data: permissionsData?.permissions || [],
    columns,
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
    enableRowSelection: true,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualSorting: true,
    manualFiltering: true,
    rowCount: permissionsData?.pagination.total,
    pageCount: Math.ceil(
      (permissionsData?.pagination.total || 0) /
        (permissionsData?.pagination.limit || 1)
    ),
  });

  // Reset pagination to first page when column filters change
  useEffect(() => {
    if (setPagination) {
      setPagination((pagination) => ({
        pageIndex: 0,
        pageSize: pagination.pageSize,
      }));
    }
  }, []);

  const handleDeletePermission = async (permissionId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (window.confirm("Are you sure you want to delete this permission?")) {
      await deletePermission.mutateAsync(permissionId);
    }
  };

  if (isLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar table={table} />
      <div className="rounded-md border">
        {/* <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
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
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 w-8 p-0" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onEditPermission?.(permission)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {!permission.isSystem && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeletePermission(permission.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table> */}

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
      <div className="w-[80px] font-medium">{row.getValue("name")}</div>
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
