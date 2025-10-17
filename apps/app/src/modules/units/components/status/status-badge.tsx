"use client";

import { Badge } from "@kaa/ui/components/badge";
import { getStatusBadgeVariant, getStatusDisplayName } from "@/modules/units";
import type { UnitStatus } from "../../unit.type";

type StatusBadgeProps = {
  status: UnitStatus;
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
