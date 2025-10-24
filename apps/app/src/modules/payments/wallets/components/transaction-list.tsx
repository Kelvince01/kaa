"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useTransactionHistory } from "../wallet.queries";
import {
  type TransactionHistoryParams,
  TransactionStatus,
  TransactionType,
  type WalletTransaction,
} from "../wallet.type";
import { formatCurrency, formatDate } from "../wallet.utils";

type TransactionListProps = {
  /**
   * Show filters
   * @default true
   */
  showFilters?: boolean;

  /**
   * Items per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Callback when a transaction is clicked
   */
  onTransactionClick?: (transaction: WalletTransaction) => void;
};

/**
 * Transaction list component that displays wallet transaction history
 * with filtering and pagination.
 *
 * @component
 * @param {TransactionListProps} props - The component props
 * @returns {JSX.Element} The rendered transaction list
 */
export function TransactionList({
  showFilters = true,
  pageSize = 20,
  onTransactionClick,
}: TransactionListProps) {
  const [filters, setFilters] = useState<TransactionHistoryParams>({
    page: 1,
    limit: pageSize,
  });

  const { data, isLoading, isError, refetch, isRefetching } =
    useTransactionHistory(filters);

  // Get transaction type icon
  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return <ArrowDownLeft className="h-4 w-4" />;
      case TransactionType.WITHDRAWAL:
        return <ArrowUpRight className="h-4 w-4" />;
      case TransactionType.TRANSFER:
        return <ArrowLeftRight className="h-4 w-4" />;
      case TransactionType.RENT_PAYMENT:
      case TransactionType.DEPOSIT_PAYMENT:
        return <Receipt className="h-4 w-4" />;
      default:
        return <ArrowLeftRight className="h-4 w-4" />;
    }
  };

  // Get transaction type color
  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "text-green-600 bg-green-50";
      case TransactionType.WITHDRAWAL:
        return "text-orange-600 bg-orange-50";
      case TransactionType.TRANSFER:
        return "text-blue-600 bg-blue-50";
      case TransactionType.RENT_PAYMENT:
      case TransactionType.DEPOSIT_PAYMENT:
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Get status icon
  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case TransactionStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED:
        return "default";
      case TransactionStatus.FAILED:
        return "destructive";
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get transaction type display text
  const getTypeText = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT:
        return "Deposit";
      case TransactionType.WITHDRAWAL:
        return "Withdrawal";
      case TransactionType.RENT_PAYMENT:
        return "Rent Payment";
      case TransactionType.DEPOSIT_PAYMENT:
        return "Deposit Payment";
      case TransactionType.REFUND:
        return "Refund";
      case TransactionType.COMMISSION:
        return "Commission";
      case TransactionType.TRANSFER:
        return "Transfer";
      default:
        return type;
    }
  };

  // Handle filter change
  const handleFilterChange = (
    key: keyof TransactionHistoryParams,
    value: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-16 w-full" key={i.toString()} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 py-8 text-center">
            <p className="text-muted-foreground">Failed to load transactions</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { transactions, pagination } = data;
  const hasTransactions = transactions.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="font-medium text-base">
          Transaction History
        </CardTitle>
        <Button
          disabled={isRefetching}
          onClick={() => refetch()}
          size="icon"
          variant="ghost"
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefetching && "animate-spin")}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <Select
              onValueChange={(value) =>
                handleFilterChange("type", value === "all" ? undefined : value)
              }
              value={filters.type || "all"}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={TransactionType.DEPOSIT}>Deposit</SelectItem>
                <SelectItem value={TransactionType.WITHDRAWAL}>
                  Withdrawal
                </SelectItem>
                <SelectItem value={TransactionType.RENT_PAYMENT}>
                  Rent Payment
                </SelectItem>
                <SelectItem value={TransactionType.TRANSFER}>
                  Transfer
                </SelectItem>
                <SelectItem value={TransactionType.REFUND}>Refund</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                handleFilterChange(
                  "status",
                  value === "all" ? undefined : value
                )
              }
              value={filters.status || "all"}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value={TransactionStatus.COMPLETED}>
                  Completed
                </SelectItem>
                <SelectItem value={TransactionStatus.PENDING}>
                  Pending
                </SelectItem>
                <SelectItem value={TransactionStatus.PROCESSING}>
                  Processing
                </SelectItem>
                <SelectItem value={TransactionStatus.FAILED}>Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-2">
          {hasTransactions ? (
            transactions.map((transaction) => (
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4 transition-colors",
                  onTransactionClick && "cursor-pointer hover:bg-muted/50"
                )}
                key={transaction._id}
                onClick={() => onTransactionClick?.(transaction)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "rounded-full p-2",
                      getTransactionColor(transaction.type)
                    )}
                  >
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {getTypeText(transaction.type)}
                      </p>
                      <Badge
                        className="text-xs"
                        variant={getStatusVariant(transaction.status)}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      {getStatusIcon(transaction.status)}
                      <span>{transaction.reference}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                    {transaction.description && (
                      <p className="text-muted-foreground text-xs">
                        {transaction.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-semibold text-sm",
                      transaction.type === TransactionType.DEPOSIT
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {transaction.type === TransactionType.DEPOSIT ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Balance: {formatCurrency(transaction.balanceAfter)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground text-sm">
                No transactions found
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {hasTransactions && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        size="sm"
                        variant={
                          pagination.page === pageNum ? "default" : "outline"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>
              <Button
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
