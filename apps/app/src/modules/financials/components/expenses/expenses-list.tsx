import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Calendar,
  Check,
  Download,
  Edit,
  Eye,
  FileImage,
  Filter,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import { useDeleteExpense, useExpenses } from "../../financials.queries";
import { useFinancialsStore } from "../../financials.store";
import type { Expense, ExpenseFilters } from "../../financials.type";
import { ExpenseDetailsDialog } from "./expense-details-dialog";

type ExpensesListProps = {
  onCreateExpense?: () => void;
  onEditExpense?: (expense: Expense) => void;
  onViewExpense?: (expense: Expense) => void;
  onUploadReceipt?: () => void;
  onViewReceiptGallery?: () => void;
  onApproveExpense?: (expenseId: string) => void;
  onRejectExpense?: (expenseId: string) => void;
};

export function ExpensesList({
  onCreateExpense,
  onEditExpense,
  onViewExpense,
  onUploadReceipt,
  onViewReceiptGallery,
  onApproveExpense,
  onRejectExpense,
}: ExpensesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { expenseFilters, updateExpenseFilters } = useFinancialsStore();
  const { data: expensesData, isLoading } = useExpenses(expenseFilters);
  const { mutate: deleteExpense } = useDeleteExpense();

  const expenses = expensesData?.expenses || [];
  const pagination = expensesData?.pagination;

  const handleFilterChange = (filters: Partial<ExpenseFilters>) => {
    updateExpenseFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateExpenseFilters({ page });
  };

  const handleDeleteExpense = (expenseId: string) => {
    // biome-ignore lint/suspicious/noAlert: ignore
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(expenseId);
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailsDialog(true);
    if (onViewExpense) {
      onViewExpense(expense);
    }
  };

  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setSelectedExpense(null);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || expense.status === statusFilter;
    const matchesCategory =
      !categoryFilter || expense.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {new Array(5).fill(0).map((_, i) => (
              <div
                className="flex animate-pulse items-center justify-between rounded border p-4"
                key={i.toString()}
              >
                <div className="flex flex-col space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
                <div className="h-6 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>Expenses</CardTitle>
            {onViewReceiptGallery && (
              <Button
                onClick={onViewReceiptGallery}
                size="sm"
                variant="outline"
              >
                <FileImage className="mr-2 h-4 w-4" />
                Receipts
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {onUploadReceipt && (
              <Button onClick={onUploadReceipt} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Receipt
              </Button>
            )}
            <Button onClick={onCreateExpense}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchTerm(e.target.value as string)}
              placeholder="Search expenses..."
              value={searchTerm}
            />
          </div>
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">All Status</SelectItem> */}
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setCategoryFilter} value={categoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">All Categories</SelectItem> */}
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="taxes">Taxes</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Button size="icon" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Expenses Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tax Deductible</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center" colSpan={7}>
                    <div className="text-muted-foreground">
                      No expenses found
                    </div>
                    <Button
                      className="mt-2"
                      onClick={onCreateExpense}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Expense
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>
                      <div className="rounded-lg bg-gray-100 p-2">
                        <Receipt className="h-6 w-6 text-gray-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {expense.description}
                        </span>
                        {expense.vendor && (
                          <span className="text-muted-foreground text-sm">
                            {expense.vendor.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expense.category}
                        {expense.subcategory && ` • ${expense.subcategory}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(expense.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expense.status === "approved"
                            ? "default"
                            : expense.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={expense.taxDeductible ? "default" : "outline"}
                      >
                        {expense.taxDeductible ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {expense.status === "pending" && (
                            <DropdownMenuItem
                              onClick={() => onApproveExpense?.(expense._id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {expense.status === "approved" && (
                            <DropdownMenuItem
                              onClick={() => onRejectExpense?.(expense._id)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {expense.status === "rejected" && (
                            <DropdownMenuItem
                              onClick={() => onApproveExpense?.(expense._id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onViewReceiptGallery?.()}
                          >
                            <FileImage className="mr-2 h-4 w-4" />
                            View Receipt Gallery
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewExpense(expense)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditExpense?.(expense)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {expense.receipt && (
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteExpense(expense._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} expenses
            </div>
            <div className="flex items-center space-x-2">
              <Button
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                size="sm"
                variant="outline"
              >
                Previous
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    size="sm"
                    variant={page === pagination.page ? "default" : "outline"}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                size="sm"
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog
        expense={selectedExpense}
        isOpen={showDetailsDialog}
        onApprove={onApproveExpense}
        onClose={handleCloseDetailsDialog}
        onEdit={onEditExpense}
        onReject={onRejectExpense}
      />
    </Card>
  );
}
