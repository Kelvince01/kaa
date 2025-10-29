"use client";

import { PaymentStatus } from "@kaa/models/types";
import { Button } from "@kaa/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FileDown, Receipt as ReceiptIcon, TriangleAlert } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { httpClient } from "@/lib/axios";
import type {
  Payment,
  PaymentHistoryResponse,
} from "@/modules/payments/payment.type";
import type { Property } from "@/modules/properties";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";

type PaymentHistoryProps = {
  propertyId?: string;
  paymentType?: string;
  limit?: number;
  showFilters?: boolean;
  className?: string;
};

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
  propertyId,
  paymentType,
  limit = 10,
  showFilters = true,
  className = "",
}) => {
  const [filters, setFilters] = useState({
    propertyId: propertyId || "",
    paymentType: paymentType || "",
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
    includeSubscriptions: true,
  });

  // Fetch payment history
  const { data, isLoading, error } = useQuery({
    queryKey: ["paymentHistory", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.propertyId) params.append("propertyId", filters.propertyId);
      if (filters.paymentType)
        params.append("paymentType", filters.paymentType);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      params.append("page", filters.page.toString());
      params.append("limit", limit.toString());
      params.append(
        "includeSubscriptions",
        filters.includeSubscriptions.toString()
      );

      const response = await httpClient.api.get<PaymentHistoryResponse>(
        `/payments/history?${params.toString()}`
      );
      return response;
    },
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFilters((prev) => ({
      ...prev,
      [name]: newValue,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await httpClient.api.get<Blob>(
        `/payments/${paymentId}/receipt`,
        {
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "succeeded":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
      case "partially_refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "rent":
        return "Rent";
      case "deposit":
        return "Security Deposit";
      case "holding_deposit":
        return "Holding Deposit";
      case "fee":
        return "Fee";
      case "subscription":
        return "Recurring Payment";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  if (isLoading) {
    return <div className="py-4 text-center">Loading payment history...</div>;
  }

  if (error) {
    return (
      <div className="py-4 text-center text-red-500">
        <TriangleAlert className="mr-2 inline-block" />
        Error loading payment history
      </div>
    );
  }

  const { payments = [], pagination = { total: 0, page: 1, limit, pages: 1 } } =
    data?.data || {};

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "createdAt",
      header: () => <span>Date</span>,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "paymentType",
      header: () => <span>Type</span>,
      cell: ({ row }) => (
        <>
          {getPaymentTypeLabel(row.original.type)}
          {row.original.type === "subscription" && row.original.interval && (
            <span className="ml-1 text-gray-500 text-xs">
              (
              {row.original.interval === "month"
                ? "Monthly"
                : row.original.interval === "week"
                  ? "Weekly"
                  : "Yearly"}
              )
            </span>
          )}
        </>
      ),
    },
    {
      accessorKey: "amount",
      header: () => <span>Amount</span>,
      cell: ({ row }) =>
        formatCurrency(row.original.amount / 100, row.original.currency),
    },
    {
      accessorKey: "status",
      header: () => <span>Status</span>,
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 font-semibold text-xs leading-5 ${getStatusColor(row.original.status)}`}
        >
          {row.original.status.charAt(0).toUpperCase() +
            row.original.status.slice(1)}
        </span>
      ),
    },
    {
      accessorKey: "property",
      header: () => <span>Property</span>,
      cell: ({ row }) =>
        (row.original.property as unknown as Property)?.title || "N/A",
    },
    {
      id: "actions",
      header: () => <span className="float-right">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right font-medium text-sm">
          {row.original.status === PaymentStatus.COMPLETED && (
            <button
              className="mr-3 text-primary-600 hover:text-primary-900"
              onClick={() => downloadReceipt(row.original.id)}
              title="Download Receipt"
              type="button"
            >
              <FileDown />
            </button>
          )}
          <a
            className="text-primary-600 hover:text-primary-900"
            href={`/account/payments/${row.original.id}`}
          >
            View
          </a>
        </div>
      ),
    },
  ];

  // biome-ignore lint/correctness/useHookAtTopLevel: ignore
  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {showFilters && (
        <div className="space-y-4 rounded-lg border bg-white p-4">
          <h3 className="font-medium text-lg">Filter Payments</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="paymentType"
              >
                Payment Type
              </label>
              <select
                className="w-full rounded-md border p-2"
                id="paymentType"
                name="paymentType"
                onChange={handleFilterChange}
                value={filters.paymentType}
              >
                <option value="">All Types</option>
                <option value="rent">Rent</option>
                <option value="deposit">Security Deposit</option>
                <option value="holding_deposit">Holding Deposit</option>
                <option value="fee">Fee</option>
                <option value="subscription">Recurring Payment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="status"
              >
                Status
              </label>
              <select
                className="w-full rounded-md border p-2"
                id="status"
                name="status"
                onChange={handleFilterChange}
                value={filters.status}
              >
                <option value="">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="mt-6 flex items-center">
              <input
                checked={filters.includeSubscriptions}
                className="h-4 w-4 rounded text-primary-600"
                id="includeSubscriptions"
                name="includeSubscriptions"
                onChange={handleFilterChange}
                type="checkbox"
              />
              <label
                className="ml-2 text-gray-700 text-sm"
                htmlFor="includeSubscriptions"
              >
                Include Recurring Payments
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="startDate"
              >
                From Date
              </label>
              <input
                className="w-full rounded-md border p-2"
                id="startDate"
                name="startDate"
                onChange={handleFilterChange}
                type="date"
                value={filters.startDate}
              />
            </div>

            <div>
              <label
                className="mb-1 block font-medium text-gray-700 text-sm"
                htmlFor="endDate"
              >
                To Date
              </label>
              <input
                className="w-full rounded-md border p-2"
                id="endDate"
                name="endDate"
                onChange={handleFilterChange}
                type="date"
                value={filters.endDate}
              />
            </div>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="rounded-lg border bg-white py-8 text-center">
          <ReceiptIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 font-medium text-gray-900 text-sm">
            No payments found
          </h3>
          <p className="mt-1 text-gray-500 text-sm">
            No payment records match your current filters.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        className={
                          header.id === "actions" ? "text-right" : undefined
                        }
                        key={header.id}
                      >
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
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div className="text-gray-700 text-sm">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </div>

              <div className="flex space-x-2">
                <Button
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentHistory;
