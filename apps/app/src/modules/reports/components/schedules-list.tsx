"use client";

import type { ReportFrequency } from "@kaa/models/types";
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
  Calendar,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  useDeleteSchedule,
  usePauseSchedule,
  useResumeSchedule,
  useSchedules,
} from "../reports.queries";
import type { IReportSchedule } from "../reports.type";

type SchedulesListProps = {
  onCreateSchedule?: () => void;
  onEditSchedule?: (schedule: IReportSchedule) => void;
};

export function SchedulesList({
  onCreateSchedule,
  onEditSchedule,
}: SchedulesListProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading } = useSchedules({
    page,
    limit,
  });

  const deleteSchedule = useDeleteSchedule();
  const pauseSchedule = usePauseSchedule();
  const resumeSchedule = useResumeSchedule();

  const schedules = data?.data?.items || [];
  const pagination = data?.data;

  const handleDelete = async (scheduleId: string) => {
    if (
      // biome-ignore lint/suspicious/noAlert: user confirmation
      confirm(
        "Are you sure you want to delete this schedule? This action cannot be undone."
      )
    ) {
      await deleteSchedule.mutateAsync(scheduleId);
    }
  };

  const getFrequencyLabel = (frequency: ReportFrequency) =>
    frequency.replace("_", " ");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Loading schedules...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Reports
            </CardTitle>
            <CardDescription>
              Manage your automated report schedules ({pagination?.total || 0}{" "}
              total)
            </CardDescription>
          </div>
          {onCreateSchedule && (
            <Button onClick={onCreateSchedule} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No schedules found</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Create a schedule to automate report generation
            </p>
            {onCreateSchedule && (
              <Button onClick={onCreateSchedule} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Schedule
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: IReportSchedule) => (
                  <TableRow key={schedule._id?.toString()}>
                    <TableCell className="font-medium">
                      Schedule #{schedule._id?.toString().slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFrequencyLabel(schedule.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {schedule.startDate
                          ? format(new Date(schedule.startDate), "MMM d, yyyy")
                          : "Not scheduled"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
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
                          <DropdownMenuItem
                            onClick={() =>
                              pauseSchedule.mutate(
                                schedule._id?.toString() || ""
                              )
                            }
                          >
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              resumeSchedule.mutate(
                                schedule._id?.toString() || ""
                              )
                            }
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </DropdownMenuItem>
                          {onEditSchedule && (
                            <DropdownMenuItem
                              onClick={() => onEditSchedule(schedule)}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleDelete(schedule._id?.toString() || "")
                            }
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
                  {pagination.total} schedules
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
