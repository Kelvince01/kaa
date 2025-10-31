"use client";

import type { ReportStatus } from "@kaa/models/types";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@kaa/ui/components/dialog";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Separator } from "@kaa/ui/components/separator";
import { format } from "date-fns";
import { Download, FileText, Play, Settings, Tag } from "lucide-react";
import { useDownloadReport } from "../reports.queries";
import type { IReportDefinition } from "../reports.type";

type ReportDetailsDialogProps = {
  report: IReportDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (report: IReportDefinition) => void;
  onExecute?: (report: IReportDefinition) => void;
};

export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
  onEdit,
  onExecute,
}: ReportDetailsDialogProps) {
  const downloadReport = useDownloadReport();

  if (!report) {
    return null;
  }

  const handleDownload = async () => {
    await downloadReport.mutateAsync({
      reportId: report._id.toString(),
      format: report.format[0] || "pdf",
    });
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

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {report.name}
          </DialogTitle>
          <DialogDescription>
            {report.description || "Report details and configuration"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="font-medium">
                    {report.type
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </p>
                </div>
                {/* <div>
                  <span className="text-muted-foreground">Status</span>
                  <p>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </p>
                </div> */}
                <div>
                  <span className="text-muted-foreground">Frequency</span>
                  <p className="font-medium">
                    {report.frequency.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <p className="font-medium">{report.priority}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Formats</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {report.format.map((fmt) => (
                      <Badge key={fmt} variant="outline">
                        {fmt.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Active</span>
                  <p className="font-medium">
                    {report.isActive ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Execution History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Execution History</h3>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Last Run</span>
                  <p className="font-medium">
                    {report.lastRunAt
                      ? format(new Date(report.lastRunAt), "MMM d, yyyy HH:mm")
                      : "Never"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Next Run</span>
                  <p className="font-medium">
                    {report.nextRunAt
                      ? format(new Date(report.nextRunAt), "MMM d, yyyy HH:mm")
                      : "Not scheduled"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Run Count</span>
                  <p className="font-medium">{report.runCount || 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {report.tags && report.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            {report.metadata && Object.keys(report.metadata).length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="flex items-center gap-2 font-semibold text-sm">
                    <Settings className="h-4 w-4" />
                    Metadata
                  </h3>
                  <div className="rounded-md border bg-muted/50 p-3">
                    <pre className="text-muted-foreground text-xs">
                      {JSON.stringify(report.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
          {onExecute && (
            <Button onClick={() => onExecute(report)}>
              <Play className="mr-2 h-4 w-4" />
              Execute
            </Button>
          )}
          <Button
            disabled={downloadReport.isPending}
            onClick={handleDownload}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(report)} variant="default">
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
