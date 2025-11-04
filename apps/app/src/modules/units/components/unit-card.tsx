"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@kaa/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  AlertTriangle,
  Bath,
  Bed,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  MoreVertical,
  Square,
  User,
  UserMinus,
  UserPlus,
} from "lucide-react";

import type { Unit } from "../unit.type";
import {
  formatCurrency,
  formatDate,
  getAmenitiesSummary,
  getDaysUntilRentDue,
  getUnitTypeDisplayName,
  isRentDueSoon,
  isRentOverdue,
} from "../utils/unit-utils";
import { StatusBadge } from "./status/status-badge";

type UnitCardProps = {
  unit: Unit;
  onClick?: (unit: Unit) => void;
  onEdit?: (unit: Unit) => void;
  onAssignTenant?: (unit: Unit) => void;
  onVacateTenant?: (unit: Unit) => void;
  onViewDetails?: (unit: Unit) => void;
  showActions?: boolean;
  compact?: boolean;
};

export function UnitCard({
  unit,
  onClick,
  onEdit,
  onAssignTenant,
  onVacateTenant,
  onViewDetails,
  showActions = true,
  compact = false,
}: UnitCardProps) {
  const property =
    typeof unit.property === "string"
      ? { title: unit.property }
      : unit.property;
  const daysUntilRentDue = getDaysUntilRentDue(unit);
  const rentOverdue = isRentOverdue(unit);
  const rentDueSoon = isRentDueSoon(unit);

  const handleCardClick = () => {
    if (onClick) {
      onClick(unit);
    } else if (onViewDetails) {
      onViewDetails(unit);
    }
  };

  return (
    <Card
      className={`group transition-all duration-200 hover:shadow-md ${
        onClick || onViewDetails ? "cursor-pointer" : ""
      } ${rentOverdue ? "border-red-200 bg-red-50/50" : ""} ${
        rentDueSoon ? "border-yellow-200 bg-yellow-50/50" : ""
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className={`pb-3 ${compact ? "pb-2" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{unit.unitNumber}</h3>
              <StatusBadge status={unit.status} />
            </div>
            <p className="text-muted-foreground text-sm">{property?.title}</p>
            {!compact && (
              <p className="text-muted-foreground text-xs">
                {getUnitTypeDisplayName(unit.type)}
              </p>
            )}
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  size="icon"
                  variant="ghost"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={() => onViewDetails(unit)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(unit)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Unit
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {unit.status === "vacant" && onAssignTenant && (
                  <DropdownMenuItem onClick={() => onAssignTenant(unit)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Tenant
                  </DropdownMenuItem>
                )}
                {unit.status === "occupied" && onVacateTenant && (
                  <DropdownMenuItem onClick={() => onVacateTenant(unit)}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Vacate Unit
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Rent Alert Badges */}
        {!compact && (rentOverdue || rentDueSoon) && (
          <div className="mt-2 flex gap-2">
            {rentOverdue && (
              <Badge className="text-xs" variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Rent Overdue
              </Badge>
            )}
            {rentDueSoon && !rentOverdue && (
              <Badge className="text-xs" variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                Due Soon
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className={`space-y-4 ${compact ? "space-y-2" : ""}`}>
        {/* Rent Information */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg">
              {formatCurrency(unit.rent)}
            </span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          {!compact && unit.nextRentDueDate && (
            <div className="text-muted-foreground text-xs">
              Due: {formatDate(unit.nextRentDueDate)}
            </div>
          )}
        </div>

        {/* Unit Specifications */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{unit.bedrooms}</span>
            {!compact && <span className="text-muted-foreground">bed</span>}
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <span>{unit.bathrooms}</span>
            {!compact && <span className="text-muted-foreground">bath</span>}
          </div>
          {unit.size && (
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4 text-muted-foreground" />
              <span>{unit.size}</span>
              {!compact && <span className="text-muted-foreground">sqm</span>}
            </div>
          )}
        </div>

        {/* Current Tenant */}
        {unit.status === "occupied" && unit.currentTenant && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">
                {typeof unit.currentTenant === "string"
                  ? unit.currentTenant
                  : `${unit.currentTenant.firstName} ${unit.currentTenant.lastName}`}
              </p>
              {!compact && unit.leaseStartDate && (
                <p className="text-muted-foreground text-xs">
                  Since {formatDate(unit.leaseStartDate)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Amenities Preview */}
        {!compact && unit.amenities && unit.amenities.length > 0 && (
          <div>
            <p className="mb-1 text-muted-foreground text-xs">Amenities:</p>
            <p className="text-sm">{getAmenitiesSummary(unit)}</p>
          </div>
        )}

        {/* Floor and Additional Info */}
        {!compact && (
          <div className="flex justify-between text-muted-foreground text-xs">
            {unit.floor !== undefined && <span>Floor: {unit.floor}</span>}
            <span>Due: {unit.rentDueDay}th</span>
          </div>
        )}
      </CardContent>

      {!compact && (
        <CardFooter className="pt-3">
          <div className="flex w-full items-center justify-between">
            <div className="text-muted-foreground text-xs">
              Deposit: {formatCurrency(unit.depositAmount)}
            </div>
            {daysUntilRentDue !== null && (
              <div
                className={`text-xs ${
                  rentOverdue
                    ? "font-medium text-red-600"
                    : rentDueSoon
                      ? "font-medium text-yellow-600"
                      : "text-muted-foreground"
                }`}
              >
                {daysUntilRentDue > 0
                  ? `${daysUntilRentDue} days until due`
                  : daysUntilRentDue === 0
                    ? "Due today"
                    : `${Math.abs(daysUntilRentDue)} days overdue`}
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
