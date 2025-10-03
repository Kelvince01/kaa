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
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useDownloadInvoice, useInvoices } from "../subscriptions.queries";
import type { Invoice, InvoiceStatus } from "../subscriptions.type";
import { formatCurrency, formatDate } from "../subscriptions.utils";

type InvoiceHistoryProps = {
  className?: string;
  limit?: number;
};

export function InvoiceHistory({ className, limit = 10 }: InvoiceHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all"
  );
  const [page, setPage] = useState(1);

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useInvoices({
    page,
    limit,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { mutate: downloadInvoice, isPending: isDownloading } =
    useDownloadInvoice();

  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  const getStatusBadge = (status: InvoiceStatus) => {
    const statusConfig = {
      paid: {
        variant: "default" as const,
        label: "Paid",
        className: "bg-green-500",
      },
      open: { variant: "secondary" as const, label: "Open", className: "" },
      void: { variant: "outline" as const, label: "Void", className: "" },
      uncollectible: {
        variant: "destructive" as const,
        label: "Uncollectible",
        className: "",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.className} variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const handleDownload = (invoice: Invoice) => {
    downloadInvoice(invoice.id);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading invoices...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8 text-red-600">
          <FileText className="mr-2 h-6 w-6" />
          Failed to load invoices
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice History</span>
            </CardTitle>
            <CardDescription>
              View and download your billing invoices
            </CardDescription>
          </div>

          <Select
            onValueChange={(value: InvoiceStatus | "all") =>
              setStatusFilter(value)
            }
            value={statusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="void">Void</SelectItem>
              <SelectItem value="uncollectible">Uncollectible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {invoices.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No invoices found</p>
            {statusFilter !== "all" && (
              <Button
                className="mt-2"
                onClick={() => setStatusFilter("all")}
                variant="link"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        #{invoice.id.slice(-8)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          disabled={isDownloading}
                          onClick={() => handleDownload(invoice)}
                          size="sm"
                          variant="ghost"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-sm">
                          #{invoice.id.slice(-8)}
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date</p>
                          <p>{formatDate(invoice.invoiceDate)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-muted-foreground text-sm">
                          Due: {formatDate(invoice.dueDate)}
                        </span>
                        <Button
                          disabled={isDownloading}
                          onClick={() => handleDownload(invoice)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-muted-foreground text-sm">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} invoices
                </p>

                <div className="flex space-x-2">
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    size="sm"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    size="sm"
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
