"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, Plus, Search } from "lucide-react";
import * as React from "react";

import {
  type Landlord,
  LandlordStatus,
  LandlordType,
  VerificationStatus,
} from "../landlord.type";
import { createLandlordColumns } from "./columns";

type LandlordTableProps = {
  data: Landlord[];
  isLoading?: boolean;
  onView?: (landlord: Landlord) => void;
  onEdit?: (landlord: Landlord) => void;
  onDelete?: (landlord: Landlord) => void;
  onCreateNew?: () => void;
};

export default function LandlordTable({
  data,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onCreateNew,
}: LandlordTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...createLandlordColumns(onView, onEdit, onDelete),
    ],
    [onView, onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Filter by status
  const handleStatusFilter = (status: LandlordStatus | "all") => {
    if (status === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(status);
    }
  };

  // Filter by type
  const handleTypeFilter = (type: LandlordType | "all") => {
    if (type === "all") {
      table.getColumn("landlordType")?.setFilterValue(undefined);
    } else {
      table.getColumn("landlordType")?.setFilterValue(type);
    }
  };

  // Filter by verification status
  const handleVerificationFilter = (
    verificationStatus: VerificationStatus | "all"
  ) => {
    if (verificationStatus === "all") {
      table.getColumn("verification.status")?.setFilterValue(undefined);
    } else {
      table
        .getColumn("verification.status")
        ?.setFilterValue(verificationStatus);
    }
  };

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Landlords</h2>
          <p className="text-muted-foreground">
            Manage and view all landlords in the system
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={onCreateNew}>
          <Plus className="h-4 w-4" />
          Add Landlord
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            Filter landlords by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(event) =>
                    setGlobalFilter(String(event.target.value))
                  }
                  placeholder="Search landlords..."
                  value={globalFilter ?? ""}
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={LandlordStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={LandlordStatus.PENDING_VERIFICATION}>
                  Pending Verification
                </SelectItem>
                <SelectItem value={LandlordStatus.VERIFICATION_IN_PROGRESS}>
                  Verification in Progress
                </SelectItem>
                <SelectItem value={LandlordStatus.SUSPENDED}>
                  Suspended
                </SelectItem>
                <SelectItem value={LandlordStatus.REJECTED}>
                  Rejected
                </SelectItem>
                <SelectItem value={LandlordStatus.INACTIVE}>
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={LandlordType.INDIVIDUAL}>
                  Individual
                </SelectItem>
                <SelectItem value={LandlordType.COMPANY}>Company</SelectItem>
                <SelectItem value={LandlordType.TRUST}>Trust</SelectItem>
                <SelectItem value={LandlordType.PARTNERSHIP}>
                  Partnership
                </SelectItem>
                <SelectItem value={LandlordType.LLC}>LLC</SelectItem>
                <SelectItem value={LandlordType.CORPORATION}>
                  Corporation
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Filter */}
            <Select onValueChange={handleVerificationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verification</SelectItem>
                <SelectItem value={VerificationStatus.COMPLETED}>
                  Completed
                </SelectItem>
                <SelectItem value={VerificationStatus.IN_PROGRESS}>
                  In Progress
                </SelectItem>
                <SelectItem value={VerificationStatus.PENDING}>
                  Pending
                </SelectItem>
                <SelectItem value={VerificationStatus.FAILED}>
                  Failed
                </SelectItem>
                <SelectItem value={VerificationStatus.EXPIRED}>
                  Expired
                </SelectItem>
                <SelectItem value={VerificationStatus.REQUIRES_REVIEW}>
                  Requires Review
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="ml-auto" variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
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
          </div>
        </CardContent>
      </Card>

      {/* Selected Items */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedRows.length} selected</Badge>
            <span className="text-muted-foreground text-sm">
              {selectedRows.length === 1 ? "landlord" : "landlords"} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              Bulk Edit
            </Button>
            <Button size="sm" variant="destructive">
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center"
                      colSpan={columns.length}
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      No landlords found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <p className="font-medium text-sm">Rows per page</p>
          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
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
