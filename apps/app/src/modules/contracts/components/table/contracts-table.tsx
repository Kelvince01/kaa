"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Activity,
  ArrowUpDown,
  Building,
  Calendar,
  ChevronDown,
  DollarSign,
  Edit,
  Eye,
  FileSignature,
  FolderOpen,
  GitPullRequest,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Property } from "@/modules/properties";
import { useProperties } from "@/modules/properties/property.queries";
import { useTenants } from "@/modules/tenants/tenant.queries";
import { useContractStore } from "../../contract.store";
import { type Contract, ContractStatus } from "../../contract.type";

type ContractsTableProps = {
  contracts: Contract[];
  isLoading: boolean;
  onViewContract: (contract: Contract) => void;
  onEditContract: (contract: Contract) => void;
  onDeleteContract: (contractId: string) => void;
  onSignContract: (contract: Contract) => void;
  onManageDocuments: (contract: Contract) => void;
  onManageAmendments: (contract: Contract) => void;
  onRenewContract: (contract: Contract) => void;
  onManageStatus: (contract: Contract) => void;
};

const columnHelper = createColumnHelper<Contract>();

export function ContractsTable({
  contracts,
  isLoading,
  onViewContract,
  onEditContract,
  onDeleteContract,
  onSignContract,
  onManageDocuments,
  onManageAmendments,
  onRenewContract,
  onManageStatus,
}: ContractsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    selectedContracts,
    setSelectedContracts,
    toggleContractSelection,
    selectAllContracts,
    clearSelectedContracts,
    filters,
  } = useContractStore();

  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();

  // Filter contracts based on global filter
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const filteredContracts = useMemo(() => {
    return globalFilter.length > 0
      ? contracts.filter(
          (contract) =>
            // Check if any of the searchable fields contain the global filter
            contract._id.toLowerCase().includes(globalFilter.toLowerCase()) ||
            // getPropertyName((contract.property as Property)._id)
            (contract.property as Property)?.title
              .toLowerCase()
              .includes(globalFilter.toLowerCase()) ||
            getTenantNames(contract.tenants as string[])
              .toLowerCase()
              .includes(globalFilter.toLowerCase())
        )
      : contracts;
  }, [contracts, globalFilter]);

  // Status badge variant helper
  const getStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE:
      case ContractStatus.SIGNED:
        return "default";
      case ContractStatus.PENDING:
        return "secondary";
      case ContractStatus.DRAFT:
        return "outline";
      case ContractStatus.TERMINATED:
      case ContractStatus.EXPIRED:
      case ContractStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);

  // Get property name
  // const getPropertyName = (propertyId: string) => {
  // 	const property = properties?.properties?.find((p) => p._id === propertyId);
  // 	return property ? property.title : "Unknown Property";
  // };

  // Get tenant names
  const getTenantNames = (tenantIds: string[]) =>
    tenantIds
      .map((id) => {
        const tenant = tenants?.items?.find((t) => t._id === id);
        return tenant
          ? `${tenant.personalInfo.firstName} ${tenant.personalInfo.lastName}`
          : "Unknown";
      })
      .join(", ");

  // Define columns
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const columns = useMemo<ColumnDef<Contract>[]>(
    () => [
      // Selection column
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value);
              if (value) {
                selectAllContracts(contracts.map((contract) => contract._id));
              } else {
                clearSelectedContracts();
              }
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              toggleContractSelection(row.original._id);
            }}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Property column
      {
        accessorKey: "property",
        header: ({ column }) => (
          <Button
            className="h-auto w-36 p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            <Building className="mr-2 h-4 w-4" />
            Property
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          // const propertyId =
          // 	typeof row.getValue("property") === "string"
          // 		? row.getValue("property")
          // 		: (row.getValue("property") as any)?._id;
          // return <div className="font-medium">{getPropertyName(propertyId)}</div>;
          return (
            <div className="whitespace-nowrap font-medium">
              {(row.getValue("property") as Property)?.title}
            </div>
          );
        },
      },
      // Tenants column
      {
        accessorKey: "tenants",
        header: ({ column }) => (
          <Button
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            <Users className="mr-2 h-4 w-4" />
            Tenants
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const tenants = row.getValue("tenants") as string[];
          return (
            <div className="max-w-[200px] truncate">
              {getTenantNames(tenants)}
            </div>
          );
        },
      },
      // Status column
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as ContractStatus;
          return (
            <Badge variant={getStatusBadgeVariant(status)}>
              {status.replace("_", " ")}
            </Badge>
          );
        },
      },
      // Start Date column
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <Button
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Start Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          format(new Date(row.getValue("startDate")), "MMM dd, yyyy"),
      },
      // End Date column
      {
        accessorKey: "endDate",
        header: ({ column }) => (
          <Button
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            <Calendar className="mr-2 h-4 w-4" />
            End Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) =>
          format(new Date(row.getValue("endDate")), "MMM dd, yyyy"),
      },
      // Rent Amount column
      {
        accessorKey: "rentAmount",
        header: ({ column }) => (
          <Button
            className="h-auto p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            variant="ghost"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Rent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.getValue("rentAmount")),
      },
      // Actions column
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const contract = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8 p-0" variant="ghost">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onViewContract(contract)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditContract(contract)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contract
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Contract Actions */}
                {contract.status === ContractStatus.PENDING && (
                  <DropdownMenuItem onClick={() => onSignContract(contract)}>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Sign Contract
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onManageDocuments(contract)}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Manage Documents
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onManageAmendments(contract)}>
                  <GitPullRequest className="mr-2 h-4 w-4" />
                  Amendments
                </DropdownMenuItem>

                {(contract.status === ContractStatus.ACTIVE ||
                  contract.status === ContractStatus.EXPIRED) && (
                  <DropdownMenuItem onClick={() => onRenewContract(contract)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renew Contract
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onManageStatus(contract)}>
                  <Activity className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeleteContract(contract._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [contracts, selectedContracts]
  );

  const table = useReactTable({
    data: filteredContracts,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...new Array(5)].map((_, i) => (
          <Skeleton className="h-12 w-full" key={i.toString()} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            className="max-w-sm"
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Search contracts..."
            value={globalFilter}
          />
          {selectedContracts.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground text-sm">
                {selectedContracts.length} selected
              </span>
              <Button size="sm" variant="destructive">
                Delete Selected
              </Button>
            </div>
          )}
        </div>
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
                <DropdownMenuItem
                  className="capitalize"
                  key={column.id}
                  onClick={() => column.toggleVisibility()}
                >
                  <Checkbox checked={column.getIsVisible()} className="mr-2" />
                  {column.id}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No contracts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
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
