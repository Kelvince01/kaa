"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import type { LucideIcon } from "lucide-react";

type MaintenanceSummaryCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
  className?: string;
};

export function MaintenanceSummaryCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  className = "",
}: MaintenanceSummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge className="text-xs" variant={badge.variant}>
              {badge.text}
            </Badge>
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        {description && (
          <p className="mt-1 text-muted-foreground text-xs">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-muted-foreground text-xs">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
