"use client";

import { Badge } from "@kaa/ui/components/badge";
import type { ReferenceStatus } from "../../reference.type";
import {
  getStatusBadgeVariant,
  getStatusDisplayName,
} from "../../utils/reference-utils";

type StatusBadgeProps = {
  status: ReferenceStatus;
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
