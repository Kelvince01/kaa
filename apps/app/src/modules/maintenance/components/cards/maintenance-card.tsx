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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  AlertTriangle,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  User,
} from "lucide-react";

import type { Maintenance } from "../../maintenance.type";
import {
  formatCurrency,
  formatDate,
  getMaintenanceTypeDisplayName,
  getRelativeTime,
  isMaintenanceDueSoon,
  isMaintenanceOverdue,
} from "../../utils/maintenance-utils";
import { PriorityBadge } from "../status/priority-badge";
import { StatusBadge } from "../status/status-badge";

type MaintenanceCardProps = {
  maintenance: Maintenance;
  onView: (maintenance: Maintenance) => void;
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenanceId: string) => void;
  isSelected?: boolean;
  onSelect?: (maintenanceId: string) => void;
};

export function MaintenanceCard({
  maintenance,
  onView,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
}: MaintenanceCardProps) {
  const property =
    typeof maintenance.property === "string"
      ? { title: maintenance.property }
      : maintenance.property;

  const isOverdue = isMaintenanceOverdue(maintenance);
  const isDueSoon = isMaintenanceDueSoon(maintenance);

  return (
    <Card
      className={`relative transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      {/* Alert indicator for overdue/due soon */}
      {(isOverdue || isDueSoon) && (
        <div
          className={`absolute top-2 left-2 ${isOverdue ? "text-destructive" : "text-orange-600"}`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle
              className={`mb-1 cursor-pointer truncate text-lg hover:text-primary ${isOverdue ? "text-destructive" : isDueSoon ? "text-orange-600" : ""}`}
              onClick={() => onView(maintenance)}
            >
              {maintenance.title}
            </CardTitle>
            {maintenance.workOrderNumber && (
              <p className="text-muted-foreground text-sm">
                Work Order: {maintenance.workOrderNumber}
              </p>
            )}
          </div>

          <div className="ml-2 flex items-center gap-2">
            {onSelect && (
              <input
                checked={isSelected}
                className="rounded"
                onChange={() => onSelect(maintenance._id)}
                type="checkbox"
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(maintenance)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(maintenance)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(maintenance._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={maintenance.status} />
          <PriorityBadge priority={maintenance.priority} showIcon />
          <Badge className="text-xs" variant="outline">
            {getMaintenanceTypeDisplayName(maintenance.maintenanceType)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="line-clamp-2 text-muted-foreground text-sm">
          {maintenance.description}
        </p>

        {/* Property and dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {property?.title || "Unknown Property"}
            </span>
          </div>

          {maintenance.scheduledDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span
                className={
                  isOverdue
                    ? "text-destructive"
                    : isDueSoon
                      ? "text-orange-600"
                      : ""
                }
              >
                Scheduled: {formatDate(maintenance.scheduledDate)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>Created {getRelativeTime(maintenance.statusUpdatedAt)}</span>
          </div>
        </div>

        {/* Cost information */}
        {(maintenance.cost || maintenance.estimatedCost) && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            {maintenance.cost ? (
              <span className="font-medium">
                {formatCurrency(maintenance.cost)}
              </span>
            ) : maintenance.estimatedCost ? (
              <span className="text-muted-foreground">
                Est. {formatCurrency(maintenance.estimatedCost)}
              </span>
            ) : null}
          </div>
        )}

        {/* Contractor information */}
        {maintenance.assignedContractor && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">
              {maintenance.assignedContractor.name}
              {maintenance.assignedContractor.company && (
                <span className="text-muted-foreground">
                  {" "}
                  ({maintenance.assignedContractor.company})
                </span>
              )}
            </span>
          </div>
        )}

        {/* Updates count */}
        {maintenance.updates && maintenance.updates.length > 0 && (
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <span>{maintenance.updates.length} updates</span>
            <Button
              className="h-6 px-2 text-xs"
              onClick={() => onView(maintenance)}
              size="sm"
              variant="ghost"
            >
              View Timeline
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
