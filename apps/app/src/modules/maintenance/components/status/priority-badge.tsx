"use client";

import { Badge } from "@kaa/ui/components/badge";
import { AlertTriangle, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { MaintenancePriority } from "../../maintenance.type";
import {
  getPriorityBadgeVariant,
  getPriorityDisplayName,
} from "../../utils/maintenance-utils";

type PriorityBadgeProps = {
  priority: MaintenancePriority;
  showIcon?: boolean;
  className?: string;
};

export function PriorityBadge({
  priority,
  showIcon = false,
  className,
}: PriorityBadgeProps) {
  const variant = getPriorityBadgeVariant(priority);
  const displayName = getPriorityDisplayName(priority);

  const getIcon = () => {
    switch (priority) {
      case MaintenancePriority.EMERGENCY:
        return <AlertTriangle className="h-3 w-3" />;
      case MaintenancePriority.HIGH:
        return <ArrowUp className="h-3 w-3" />;
      case MaintenancePriority.MEDIUM:
        return <Minus className="h-3 w-3" />;
      case MaintenancePriority.LOW:
        return <ArrowDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={className} variant={variant}>
      {showIcon && <span className="mr-1">{getIcon()}</span>}
      {displayName}
    </Badge>
  );
}
