"use client";

import { Badge } from "@kaa/ui/components/badge";
import type { MaintenanceStatus } from "../../maintenance.type";
import {
  getStatusBadgeVariant,
  getStatusDisplayName,
} from "../../utils/maintenance-utils";

type StatusBadgeProps = {
  status: MaintenanceStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = getStatusBadgeVariant(status);
  const displayName = getStatusDisplayName(status);

  return (
    <Badge className={className} variant={variant}>
      {displayName}
    </Badge>
  );
}
