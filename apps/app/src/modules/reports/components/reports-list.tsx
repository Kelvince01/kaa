"use client";

import type { ReportStatus, ReportType } from "@kaa/models/types";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import { format } from "date-fns";
import {
  Copy,
  Edit,
  FileText,
  MoreHorizontal,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  useDeleteReport,
  useDuplicateReport,
  useReports,
} from "../reports.queries";
import type { IReportDefinition } from "../reports.type";

type ReportsListProps = {
  onViewReport?: (report: IReportDefinition) => void;
  onCreateReport?: () => void;
  onEditReport?: (report: IReportDefinition) => void;
  onExecuteReport?: (report: IReportDefinition) => void;
};

export function ReportsList({
  onViewReport,
  onCreateReport,
  onEditReport,
  onExecuteReport,
}: ReportsListProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, error } = useReports({
    page,
    limit,
  });

  const deleteReport = useDeleteReport();
  const duplicateReport = useDuplicateReport();

  const reports = data?.data?.items || [];
  const pagination = data?.data;

  const handleDelete = async (reportId: string) => {
    if (
      // biome-ignore lint/suspicious/noAlert: ignore
      confirm(
        "Are you sure you want to delete this report? This action cannot be undone."
      )
    ) {
      await deleteReport.mutateAsync(reportId);
    }
  };

  const handleDuplicate = async (reportId: string) => {
    await duplicateReport.mutateAsync(reportId);
  };

  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "pending":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeLabel = (type: ReportType) =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Loading reports...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Error loading reports</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              Manage and view your reports ({pagination?.total || 0} total)
            </CardDescription>
          </div>
          {onCreateReport && (
            <Button onClick={onCreateReport} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Report
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No reports found</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Get started by creating your first report
            </p>
            {onCreateReport && (
              <Button onClick={onCreateReport} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report: IReportDefinition) => (
                  <TableRow key={report._id.toString()}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{report.name}</span>
                        {report.description && (
                          <span className="text-muted-foreground text-xs">
                            {report.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getTypeLabel(report.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {report.frequency.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {report.lastRunAt ? (
                        <span className="text-muted-foreground text-sm">
                          {format(new Date(report.lastRunAt), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onViewReport && (
                            <DropdownMenuItem
                              onClick={() => onViewReport(report)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onExecuteReport && (
                            <DropdownMenuItem
                              onClick={() => onExecuteReport(report)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Execute
                            </DropdownMenuItem>
                          )}
                          {onEditReport && (
                            <DropdownMenuItem
                              onClick={() => onEditReport(report)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleDuplicate(report._id.toString())
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(report._id.toString())}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, pagination.total)} of{" "}
                  {pagination.total} reports
                </div>
                <div className="flex gap-2">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    size="sm"
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
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
      </CardContent>
    </Card>
  );
}
