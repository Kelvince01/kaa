"use client";

import type { ReportStatus } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { format } from "date-fns";
import { CheckCircle2, Clock, Download, Loader2, XCircle } from "lucide-react";
import { useDownloadReport, useExecution } from "../reports.queries";

type ReportExecutionStatusProps = {
  executionId: string;
  onClose?: () => void;
};

export function ReportExecutionStatus({
  executionId,
  onClose,
}: ReportExecutionStatusProps) {
  const { data: execution, isLoading } = useExecution(executionId);
  const downloadReport = useDownloadReport();

  if (isLoading || !execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Execution Status</CardTitle>
          <CardDescription>Loading execution details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
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

  const getProgress = () => {
    if (execution.status === "completed") return 100;
    if (execution.status === "failed") return 0;
    if (execution.status === "processing") {
      // Try to get progress from metadata if available
      const progress =
        (execution.metadata?.performanceMetrics as any)?.progress || 50;
      return progress;
    }
    return 0;
  };

  const canDownload =
    execution.status === "completed" && execution.results?.files;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <CardTitle>Execution Status</CardTitle>
              <CardDescription>
                {execution._id.toString().slice(0, 8)}...
              </CardDescription>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(execution.status)}>
            {execution.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(execution.status === "processing" ||
          execution.status === "pending") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} />
          </div>
        )}

        {/* Timing Information */}
        <div className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Started</span>
            <p className="font-medium">
              {format(new Date(execution.startedAt), "MMM d, yyyy HH:mm:ss")}
            </p>
          </div>
          {execution.completedAt && (
            <div>
              <span className="text-muted-foreground">Completed</span>
              <p className="font-medium">
                {format(
                  new Date(execution.completedAt),
                  "MMM d, yyyy HH:mm:ss"
                )}
              </p>
            </div>
          )}
          {execution.duration && (
            <div>
              <span className="text-muted-foreground">Duration</span>
              <p className="font-medium">
                {(execution.duration / 1000).toFixed(2)}s
              </p>
            </div>
          )}
          {execution.results?.recordCount !== undefined && (
            <div>
              <span className="text-muted-foreground">Records</span>
              <p className="font-medium">
                {execution.results.recordCount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Error Information */}
        {execution.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive text-sm">
                  {execution.error.code}
                </p>
                <p className="text-muted-foreground text-sm">
                  {execution.error.message}
                </p>
                {execution.error.details && (
                  <pre className="mt-2 text-muted-foreground text-xs">
                    {JSON.stringify(execution.error.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {execution.results && (
          <div className="rounded-md border bg-muted/50 p-3">
            <h4 className="mb-2 font-semibold text-sm">Results Summary</h4>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              {execution.results.recordCount !== undefined && (
                <div>
                  <span className="text-muted-foreground">Records:</span>{" "}
                  <span className="font-medium">
                    {execution.results.recordCount.toLocaleString()}
                  </span>
                </div>
              )}
              {execution.results.dataSize !== undefined && (
                <div>
                  <span className="text-muted-foreground">Data Size:</span>{" "}
                  <span className="font-medium">
                    {(execution.results.dataSize / 1024).toFixed(2)} KB
                  </span>
                </div>
              )}
              {execution.results.files &&
                execution.results.files.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Files:</span>{" "}
                    <span className="font-medium">
                      {execution.results.files.length}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {canDownload && (
            <Button
              disabled={downloadReport.isPending}
              onClick={() => {
                // Download the first available file
                const file = execution.results?.files?.[0];
                if (file) {
                  downloadReport.mutate({
                    reportId: execution.reportId.toString(),
                    format: file.format,
                  });
                }
              }}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose} size="sm" variant="outline">
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
