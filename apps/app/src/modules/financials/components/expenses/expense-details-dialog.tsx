import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import {
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  FileImage,
  FileText,
  Phone,
  Receipt,
  RefreshCcw,
  Tag,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import type { Expense } from "../../financials.type";

type ExpenseDetailsDialogProps = {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (expense: Expense) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
};

export function ExpenseDetailsDialog({
  expense,
  isOpen,
  onClose,
  onEdit,
  onApprove,
  onReject,
}: ExpenseDetailsDialogProps) {
  const [imageError, setImageError] = useState(false);

  if (!expense) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleDownloadReceipt = () => {
    if (expense.receipt?.url) {
      const link = document.createElement("a");
      link.href = expense.receipt.url;
      link.download =
        expense.receipt.filename || `expense-receipt-${expense._id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Expense Details</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge
                className={`${getStatusColor(expense.status)} flex items-center space-x-1`}
              >
                {getStatusIcon(expense.status)}
                <span className="capitalize">{expense.status}</span>
              </Badge>
              {onEdit && (
                <Button
                  onClick={() => onEdit(expense)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="description"
                    >
                      Description
                    </label>
                    <p className="font-medium text-base">
                      {expense.description}
                    </p>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="amount"
                    >
                      Amount
                    </label>
                    <p className="flex items-center font-semibold text-base">
                      <DollarSign className="mr-1 h-4 w-4" />
                      {formatCurrency(expense.amount)} {expense.currency}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="category"
                    >
                      Category
                    </label>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className="flex items-center space-x-1"
                        variant="outline"
                      >
                        <Tag className="h-3 w-3" />
                        <span>{expense.category}</span>
                      </Badge>
                      {expense.subcategory && (
                        <Badge variant="secondary">{expense.subcategory}</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="date"
                    >
                      Date
                    </label>
                    <p className="flex items-center text-base">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="taxDeductible"
                    >
                      Tax Deductible
                    </label>
                    <Badge
                      variant={expense.taxDeductible ? "default" : "outline"}
                    >
                      {expense.taxDeductible ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {expense.property && (
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="property"
                      >
                        Property
                      </label>
                      <p className="flex items-center text-base">
                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                        {expense.property}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Information */}
            {expense.vendor && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Vendor Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="vendorName"
                    >
                      Vendor Name
                    </label>
                    <p className="font-medium text-base">
                      {expense.vendor.name}
                    </p>
                  </div>
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="contact"
                    >
                      Contact
                    </label>
                    <p className="flex items-center text-base">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      {expense.vendor.contact}
                    </p>
                  </div>
                  {expense.vendor.vatNumber && (
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="vatNumber"
                      >
                        VAT Number
                      </label>
                      <p className="text-base">{expense.vendor.vatNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recurring Information */}
            {expense.recurring.isRecurring && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <RefreshCcw className="h-4 w-4" />
                    <span>Recurring Expense</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="frequency"
                      >
                        Frequency
                      </label>
                      <Badge className="capitalize" variant="outline">
                        {expense.recurring.frequency}
                      </Badge>
                    </div>
                    {expense.recurring.nextDue && (
                      <div>
                        <label
                          className="font-medium text-muted-foreground text-sm"
                          htmlFor="nextDue"
                        >
                          Next Due
                        </label>
                        <p className="flex items-center text-base">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(expense.recurring.nextDue)}
                        </p>
                      </div>
                    )}
                  </div>
                  {expense.recurring.endDate && (
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="endDate"
                      >
                        End Date
                      </label>
                      <p className="flex items-center text-base">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(expense.recurring.endDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Receipt */}
            {expense.receipt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileImage className="h-4 w-4" />
                      <span>Receipt</span>
                    </div>
                    <Button
                      onClick={handleDownloadReceipt}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="filename"
                      >
                        Filename
                      </label>
                      <p className="text-sm">{expense.receipt.filename}</p>
                    </div>
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="uploaded"
                      >
                        Uploaded
                      </label>
                      <p className="text-sm">
                        {formatDate(expense.receipt.uploadedAt)}
                      </p>
                    </div>

                    {/* Receipt Preview */}
                    <div className="overflow-hidden rounded-lg border">
                      {imageError ? (
                        <div className="flex h-48 items-center justify-center bg-muted">
                          <div className="text-center text-muted-foreground">
                            <FileImage className="mx-auto mb-2 h-8 w-8" />
                            <p className="text-sm">Preview not available</p>
                          </div>
                        </div>
                      ) : (
                        <Image
                          alt="Receipt"
                          className="max-h-48 w-full object-cover"
                          height={100}
                          onError={handleImageError}
                          src={expense.receipt.url}
                          width={100}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {expense.status === "pending" && (onApprove || onReject) && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {onApprove && (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => onApprove(expense._id)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Expense
                    </Button>
                  )}
                  {onReject && (
                    <Button
                      className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => onReject(expense._id)}
                      variant="outline"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Expense
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approval Information */}
            {expense.status === "approved" && expense.approvedBy && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approval Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label
                      className="font-medium text-muted-foreground text-sm"
                      htmlFor="approvedBy"
                    >
                      Approved By
                    </label>
                    <p className="text-sm">{expense.approvedBy}</p>
                  </div>
                  {expense.approvedAt && (
                    <div>
                      <label
                        className="font-medium text-muted-foreground text-sm"
                        htmlFor="approvedAt"
                      >
                        Approved At
                      </label>
                      <p className="text-sm">
                        {formatDate(expense.approvedAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="created"
                  >
                    Created
                  </label>
                  <p className="text-sm">{formatDate(expense.createdAt)}</p>
                </div>
                <div>
                  <label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="updated"
                  >
                    Last Updated
                  </label>
                  <p className="text-sm">{formatDate(expense.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
