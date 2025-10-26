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
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";

import type { Maintenance } from "../../maintenance.type";
import {
  formatCurrency,
  getMaintenanceStats,
  isMaintenanceDueSoon,
  isMaintenanceOverdue,
  sortMaintenanceByPriority,
} from "../../utils/maintenance-utils";
import { MaintenanceCard } from "../cards/maintenance-card";
import { MaintenanceSummaryCard } from "../cards/maintenance-summary-card";

type MaintenanceOverviewProps = {
  maintenances: Maintenance[];
  isLoading?: boolean;
  onViewMaintenance: (maintenance: Maintenance) => void;
  onEditMaintenance: (maintenance: Maintenance) => void;
  onDeleteMaintenance: (maintenanceId: string) => void;
  onCreateMaintenance: () => void;
};

export function MaintenanceOverview({
  maintenances,
  isLoading = false,
  onViewMaintenance,
  onEditMaintenance,
  onDeleteMaintenance,
  onCreateMaintenance,
}: MaintenanceOverviewProps) {
  const stats = useMemo(
    () => getMaintenanceStats(maintenances),
    [maintenances]
  );

  const recentMaintenances = useMemo(
    () => sortMaintenanceByPriority(maintenances).slice(0, 5),
    [maintenances]
  );

  const urgentMaintenances = useMemo(
    () =>
      maintenances.filter(
        (maintenance) =>
          isMaintenanceOverdue(maintenance) || isMaintenanceDueSoon(maintenance)
      ),
    [maintenances]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card className="animate-pulse" key={i.toString()}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-4 w-4 rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="mb-2 h-8 w-16 rounded bg-muted" />
                <div className="h-3 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MaintenanceSummaryCard
          description="All maintenance requests"
          icon={Wrench}
          title="Total Requests"
          value={stats.total}
        />

        <MaintenanceSummaryCard
          badge={
            stats.pending > 0
              ? { text: "Action needed", variant: "secondary" }
              : undefined
          }
          description="Awaiting assignment"
          icon={Clock}
          title="Pending"
          value={stats.pending}
        />

        <MaintenanceSummaryCard
          description="Currently being worked on"
          icon={TrendingUp}
          title="In Progress"
          value={stats.inProgress}
        />

        <MaintenanceSummaryCard
          description={`${stats.completionRate.toFixed(1)}% completion rate`}
          icon={CheckCircle}
          title="Completed"
          trend={{
            value: stats.completionRate,
            label: "completion rate",
            isPositive: stats.completionRate > 80,
          }}
          value={stats.completed}
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <MaintenanceSummaryCard
          badge={
            stats.overdue > 0
              ? { text: "Urgent", variant: "destructive" }
              : undefined
          }
          description="Past scheduled date"
          icon={AlertTriangle}
          title="Overdue"
          value={stats.overdue}
        />

        <MaintenanceSummaryCard
          badge={
            stats.dueSoon > 0
              ? { text: "Attention", variant: "secondary" }
              : undefined
          }
          description="Due within 7 days"
          icon={Calendar}
          title="Due Soon"
          value={stats.dueSoon}
        />

        <MaintenanceSummaryCard
          description="Completed maintenance costs"
          icon={DollarSign}
          title="Total Cost"
          value={formatCurrency(stats.totalCost)}
        />
      </div>

      {/* Urgent Maintenance Alerts */}
      {urgentMaintenances.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Urgent Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-orange-600 text-sm dark:text-orange-400">
              {urgentMaintenances.length} maintenance request(s) require
              immediate attention
            </p>
            <div className="space-y-2">
              {urgentMaintenances.slice(0, 3).map((maintenance) => (
                <div
                  className="flex items-center justify-between rounded border bg-white p-2 dark:bg-gray-800"
                  key={maintenance._id}
                >
                  <div>
                    <p className="font-medium text-sm">{maintenance.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {typeof maintenance.property === "string"
                        ? maintenance.property
                        : maintenance.property?.title}
                    </p>
                  </div>
                  <Button
                    onClick={() => onViewMaintenance(maintenance)}
                    size="sm"
                    variant="outline"
                  >
                    View
                  </Button>
                </div>
              ))}
              {urgentMaintenances.length > 3 && (
                <p className="text-center text-muted-foreground text-xs">
                  and {urgentMaintenances.length - 3} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Maintenance Requests */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Requests</span>
              <Button onClick={onCreateMaintenance} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentMaintenances.length > 0 ? (
              recentMaintenances.map((maintenance) => (
                <MaintenanceCard
                  key={maintenance._id}
                  maintenance={maintenance}
                  onDelete={onDeleteMaintenance}
                  onEdit={onEditMaintenance}
                  onView={onViewMaintenance}
                />
              ))
            ) : (
              <div className="py-6 text-center">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-2 text-muted-foreground">
                  No maintenance requests yet
                </p>
                <Button
                  className="mt-2"
                  onClick={onCreateMaintenance}
                  size="sm"
                  variant="outline"
                >
                  Create your first request
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Button
                className="w-full justify-start"
                onClick={onCreateMaintenance}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Request
              </Button>

              <Button
                className="w-full justify-start"
                onClick={() => {
                  /* Navigate to maintenance list */
                }}
                variant="outline"
              >
                <Wrench className="mr-2 h-4 w-4" />
                View All Requests
              </Button>

              <Button
                className="w-full justify-start"
                onClick={() => {
                  /* Navigate to reports */
                }}
                variant="outline"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </div>

            {/* Status Distribution */}
            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium text-sm">Status Distribution</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge variant="secondary">{stats.pending}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">In Progress</span>
                  <Badge variant="outline">{stats.inProgress}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed</span>
                  <Badge variant="default">{stats.completed}</Badge>
                </div>
                {stats.overdue > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overdue</span>
                    <Badge variant="destructive">{stats.overdue}</Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
