"use client";

import { Badge } from "@kaa/ui/components/badge";
import { cn } from "@kaa/ui/lib/utils";
import type { BookingStatus } from "../booking.type";

type BookingStatusBadgeProps = {
  status: BookingStatus;
  className?: string;
};

const getStatusConfig = (status: BookingStatus) => {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        variant: "outline" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    case "confirmed":
      return {
        label: "Confirmed",
        variant: "default" as const,
        className: "bg-blue-100 text-blue-800 border-blue-300",
      };
    case "completed":
      return {
        label: "Completed",
        variant: "secondary" as const,
        className: "bg-green-100 text-green-800 border-green-300",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-300",
      };
    case "rejected":
      return {
        label: "Rejected",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-300",
      };
    default:
      return {
        label: "Unknown",
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800 border-gray-300",
      };
  }
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <Badge className={cn(config.className, className)} variant={config.variant}>
      {config.label}
    </Badge>
  );
}
