"use client";

import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Check, ChevronDown, Clock, Play, X } from "lucide-react";
import { useState } from "react";
import { MaintenanceStatus } from "../../maintenance.type";
import { getStatusDisplayName } from "../../utils/maintenance-utils";
import { StatusBadge } from "./status-badge";

type StatusUpdaterProps = {
  currentStatus: MaintenanceStatus;
  onStatusChange: (status: MaintenanceStatus) => void;
  disabled?: boolean;
};

export function StatusUpdater({
  currentStatus,
  onStatusChange,
  disabled = false,
}: StatusUpdaterProps) {
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    {
      status: MaintenanceStatus.PENDING,
      label: getStatusDisplayName(MaintenanceStatus.PENDING),
      icon: Clock,
    },
    {
      status: MaintenanceStatus.SCHEDULED,
      label: getStatusDisplayName(MaintenanceStatus.SCHEDULED),
      icon: Clock,
    },
    {
      status: MaintenanceStatus.IN_PROGRESS,
      label: getStatusDisplayName(MaintenanceStatus.IN_PROGRESS),
      icon: Play,
    },
    {
      status: MaintenanceStatus.COMPLETED,
      label: getStatusDisplayName(MaintenanceStatus.COMPLETED),
      icon: Check,
    },
    {
      status: MaintenanceStatus.CANCELLED,
      label: getStatusDisplayName(MaintenanceStatus.CANCELLED),
      icon: X,
    },
  ];

  const handleStatusChange = async (newStatus: MaintenanceStatus) => {
    if (newStatus === currentStatus) return;

    setIsLoading(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-auto p-1"
          disabled={disabled || isLoading}
          size="sm"
          variant="ghost"
        >
          <StatusBadge status={currentStatus} />
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statusOptions.map(({ status, label, icon: Icon }) => (
          <DropdownMenuItem
            className="flex items-center gap-2"
            disabled={status === currentStatus}
            key={status}
            onClick={() => handleStatusChange(status)}
          >
            <Icon className="h-4 w-4" />
            {label}
            {status === currentStatus && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
