"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Briefcase, HelpCircle, Home, User } from "lucide-react";
import { ReferenceType } from "../../reference.type";
import { getReferenceTypeDisplayName } from "../../utils/reference-utils";

type TypeBadgeProps = {
  type: ReferenceType;
  showIcon?: boolean;
  className?: string;
};

export function TypeBadge({
  type,
  showIcon = false,
  className,
}: TypeBadgeProps) {
  const displayName = getReferenceTypeDisplayName(type);

  const getIcon = () => {
    switch (type) {
      case ReferenceType.EMPLOYER:
        return <Briefcase className="h-3 w-3" />;
      case ReferenceType.PREVIOUS_LANDLORD:
        return <Home className="h-3 w-3" />;
      case ReferenceType.CHARACTER:
        return <User className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  return (
    <Badge className={className} variant="outline">
      {showIcon && <span className="mr-1">{getIcon()}</span>}
      {displayName}
    </Badge>
  );
}
