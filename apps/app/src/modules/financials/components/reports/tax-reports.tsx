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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  AlertCircle,
  Calculator,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency, formatDate } from "@/shared/utils/format.util";
import {
  useDownloadReport,
  useGenerateTaxReport,
  useTaxReports,
} from "../../financials.queries";
import type { TaxReport } from "../../financials.type";
import { ReportDetailsModal } from "./report-details-modal";

export function TaxReports() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedReport, setSelectedReport] = useState<TaxReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: taxReports = [], isLoading } = useTaxReports(selectedYear);
  const { mutate: generateTaxReport, isPending: isGenerating } =
    useGenerateTaxReport();
  const { mutate: downloadReport, isPending: isDownloading } =
    useDownloadReport();

  const handleGenerateReport = () => {
    generateTaxReport(selectedYear);
  };

  const handleDownloadReport = (reportId: string) => {
    downloadReport(reportId);
  };

  const handleViewReport = (report: TaxReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  // Generate year options (current year and 4 previous years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {new Array(3).fill(0).map((_, i) => (
                <div
                  className="flex items-center justify-between rounded border p-4"
                  key={i.toString()}
                >
                  <div className="flex flex-col space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                  <div className="h-6 w-20 rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Tax Reports
              </CardTitle>
              <p className="mt-1 text-muted-foreground text-sm">
                Generate and manage your annual tax reports
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                onValueChange={(value) =>
                  setSelectedYear(Number.parseInt(value, 10))
                }
                value={selectedYear.toString()}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={isGenerating} onClick={handleGenerateReport}>
                {isGenerating ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tax Reports List */}
      {taxReports && Array.isArray(taxReports) && taxReports.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tax Reports for {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxReports.map((report) => (
                <div className="rounded-lg border p-4" key={report._id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                          Tax Year {report.taxYear}
                        </h3>
                        <Badge
                          variant={
                            report.status === "approved"
                              ? "default"
                              : report.status === "submitted"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {report.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm">
                        Generated on {formatDate(report.createdAt)}
                        {report.submittedAt &&
                          ` • Submitted on ${formatDate(report.submittedAt)}`}
                      </p>

                      {/* Financial Summary */}
                      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <div className="flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">
                              Total Income
                            </span>
                          </div>
                          <div className="font-bold text-lg">
                            {formatCurrency(report.income.total)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                            <span className="font-medium text-sm">
                              Total Deductions
                            </span>
                          </div>
                          <div className="font-bold text-lg">
                            {formatCurrency(report.deductions.total)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <Calculator className="mr-1 h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">
                              Taxable Income
                            </span>
                          </div>
                          <div className="font-bold text-lg">
                            {formatCurrency(report.taxableIncome)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <AlertCircle className="mr-1 h-4 w-4 text-orange-600" />
                            <span className="font-medium text-sm">
                              Estimated Tax
                            </span>
                          </div>
                          <div className="font-bold text-lg">
                            {formatCurrency(report.estimatedTax)}
                          </div>
                        </div>
                      </div>

                      {/* Quarterly Payments */}
                      {report.quarterlyPayments &&
                        report.quarterlyPayments.length > 0 && (
                          <div className="mt-4">
                            <h4 className="mb-2 font-medium text-sm">
                              Quarterly Payments
                            </h4>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                              {report.quarterlyPayments.map((payment) => (
                                <div
                                  className={`rounded border p-2 text-center ${
                                    payment.paid
                                      ? "border-green-200 bg-green-50"
                                      : "border-orange-200 bg-orange-50"
                                  }`}
                                  key={payment.quarter}
                                >
                                  <div className="font-medium text-sm">
                                    Q{payment.quarter}
                                  </div>
                                  <div className="font-bold text-xs">
                                    {formatCurrency(payment.amount)}
                                  </div>
                                  <div className="text-xs">
                                    {payment.paid ? (
                                      <span className="text-green-600">
                                        Paid
                                      </span>
                                    ) : (
                                      <span className="text-orange-600">
                                        Due {formatDate(payment.dueDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={isDownloading}
                          onClick={() => handleDownloadReport(report._id)}
                        >
                          {isDownloading ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Download PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              No Tax Reports for {selectedYear}
            </h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Generate your first tax report for {selectedYear} to get started.
            </p>
            <Button
              className="mt-4"
              disabled={isGenerating}
              onClick={handleGenerateReport}
            >
              {isGenerating ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Generate {selectedYear} Tax Report
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tax Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Tax Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax Year:</span>
              <span className="font-medium">{selectedYear}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filing Deadline:</span>
              <span className="font-medium">April 15, {selectedYear + 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Quarterly Due Dates:
              </span>
              <span className="font-medium">
                Apr 15, Jun 15, Sep 15, Jan 15
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Details Modal */}
      <ReportDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        report={selectedReport}
      />
    </div>
  );
}
