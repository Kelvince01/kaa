"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  AlertTriangle,
  Calendar,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  SortAsc,
  SortDesc,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { Unit } from "../unit.type";
import { UnitStatus, UnitType } from "../unit.type";
import {
  filterUnitsByStatus,
  filterUnitsByType,
  formatCurrency,
  formatDate,
  getDaysUntilRentDue,
  getUnitTypeDisplayName,
  isRentDueSoon,
  isRentOverdue,
  searchUnits,
  sortUnitsByNumber,
  sortUnitsByRent,
} from "../utils/unit-utils";
import { StatusBadge } from "./status/status-badge";

type UnitListProps = {
  units: Unit[];
  onViewUnit?: (unit: Unit) => void;
  onEditUnit?: (unit: Unit) => void;
  onAssignTenant?: (unit: Unit) => void;
  onVacateTenant?: (unit: Unit) => void;
  showActions?: boolean;
  selectable?: boolean;
  selectedUnits?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
};

type SortField = "unitNumber" | "rent" | "unitType" | "status" | "occupancy";
type SortOrder = "asc" | "desc";

type FilterState = {
  search: string;
  status: UnitStatus | "all";
  unitType: UnitType | "all";
  rentRange: {
    min: string;
    max: string;
  };
};

const SortIcon = ({
  field,
  sortField,
  sortOrder,
}: {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}): React.ReactNode => {
  if (sortField !== field) return null;
  return sortOrder === "asc" ? (
    <SortAsc className="ml-1 h-4 w-4" />
  ) : (
    <SortDesc className="ml-1 h-4 w-4" />
  );
};

export function UnitList({
  units,
  onViewUnit,
  onEditUnit,
  onAssignTenant,
  onVacateTenant,
  showActions = true,
  selectable = false,
  selectedUnits = [],
  onSelectionChange,
}: UnitListProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    unitType: "all",
    rentRange: { min: "", max: "" },
  });
  const [sortField, setSortField] = useState<SortField>("unitNumber");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort units
  const filteredAndSortedUnits = useMemo(() => {
    let filtered = [...units];

    // Search filter
    if (filters.search) {
      filtered = searchUnits(filtered, filters.search);
    }

    // Status filter
    if (filters.status !== "all") {
      filtered = filterUnitsByStatus(filtered, filters.status);
    }

    // Type filter
    if (filters.unitType !== "all") {
      filtered = filterUnitsByType(filtered, filters.unitType);
    }

    // Rent range filter
    if (filters.rentRange.min) {
      const minRent = Number.parseFloat(filters.rentRange.min);
      filtered = filtered.filter((unit) => unit.rent >= minRent);
    }
    if (filters.rentRange.max) {
      const maxRent = Number.parseFloat(filters.rentRange.max);
      filtered = filtered.filter((unit) => unit.rent <= maxRent);
    }

    // Sort
    switch (sortField) {
      case "unitNumber":
        filtered = sortUnitsByNumber(filtered);
        if (sortOrder === "desc") filtered.reverse();
        break;
      case "rent":
        filtered = sortUnitsByRent(filtered, sortOrder);
        break;
      case "unitType":
        filtered = filtered.sort((a, b) => {
          const comparison = getUnitTypeDisplayName(a.unitType).localeCompare(
            getUnitTypeDisplayName(b.unitType)
          );
          return sortOrder === "desc" ? -comparison : comparison;
        });
        break;
      case "status":
        filtered = filtered.sort((a, b) => {
          const comparison = a.status.localeCompare(b.status);
          return sortOrder === "desc" ? -comparison : comparison;
        });
        break;
      case "occupancy":
        filtered = filtered.sort((a, b) => {
          const aDays = getDaysUntilRentDue(a) ?? Number.POSITIVE_INFINITY;
          const bDays = getDaysUntilRentDue(b) ?? Number.POSITIVE_INFINITY;
          return sortOrder === "desc" ? bDays - aDays : aDays - bDays;
        });
        break;
      default:
        break;
    }

    return filtered;
  }, [units, filters, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allSelected = filteredAndSortedUnits.every((unit) =>
      selectedUnits.includes(unit._id)
    );

    if (allSelected) {
      const remainingSelected = selectedUnits.filter(
        (id) => !filteredAndSortedUnits.find((unit) => unit._id === id)
      );
      onSelectionChange(remainingSelected);
    } else {
      const newSelected = [
        ...selectedUnits,
        ...filteredAndSortedUnits
          .filter((unit) => !selectedUnits.includes(unit._id))
          .map((unit) => unit._id),
      ];
      onSelectionChange(newSelected);
    }
  };

  const handleSelectUnit = (unitId: string) => {
    if (!onSelectionChange) return;

    if (selectedUnits.includes(unitId)) {
      onSelectionChange(selectedUnits.filter((id) => id !== unitId));
    } else {
      onSelectionChange([...selectedUnits, unitId]);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      unitType: "all",
      rentRange: { min: "", max: "" },
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.unitType !== "all" ||
    filters.rentRange.min ||
    filters.rentRange.max;

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search units..."
            value={filters.search}
          />
        </div>

        <Button
          className="gap-2"
          onClick={() => setShowFilters(!showFilters)}
          size="sm"
          variant="outline"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge className="ml-1 h-4 w-4 p-0 text-xs" variant="secondary">
              •
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button onClick={resetFilters} size="sm" variant="ghost">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid gap-4 rounded-lg border bg-muted/50 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="status">
              Status
            </label>
            <Select
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as UnitStatus | "all" })
              }
              value={filters.status}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(UnitStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              className="mb-2 block font-medium text-sm"
              htmlFor="unitType"
            >
              Type
            </label>
            <Select
              onValueChange={(value) =>
                setFilters({ ...filters, unitType: value as UnitType | "all" })
              }
              value={filters.unitType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(UnitType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getUnitTypeDisplayName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="minRent">
              Min Rent
            </label>
            <Input
              onChange={(e) =>
                setFilters({
                  ...filters,
                  rentRange: { ...filters.rentRange, min: e.target.value },
                })
              }
              placeholder="0"
              type="number"
              value={filters.rentRange.min}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-sm" htmlFor="maxRent">
              Max Rent
            </label>
            <Input
              onChange={(e) =>
                setFilters({
                  ...filters,
                  rentRange: { ...filters.rentRange, max: e.target.value },
                })
              }
              placeholder="No limit"
              type="number"
              value={filters.rentRange.max}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Showing {filteredAndSortedUnits.length} of {units.length} units
        </span>
        {selectable && selectedUnits.length > 0 && (
          <span>{selectedUnits.length} selected</span>
        )}
      </div>

      {/* Units Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <input
                    checked={
                      filteredAndSortedUnits.length > 0 &&
                      filteredAndSortedUnits.every((unit) =>
                        selectedUnits.includes(unit._id)
                      )
                    }
                    className="rounded"
                    onChange={handleSelectAll}
                    type="checkbox"
                  />
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("unitNumber")}
              >
                <div className="flex items-center">
                  Unit Number
                  <SortIcon
                    field="unitNumber"
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("unitType")}
              >
                <div className="flex items-center">
                  Type
                  <SortIcon
                    field="unitType"
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon
                    field="status"
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("rent")}
              >
                <div className="flex items-center">
                  Rent
                  <SortIcon
                    field="rent"
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("occupancy")}
              >
                <div className="flex items-center">
                  Rent Status
                  <SortIcon
                    field="occupancy"
                    sortField={sortField}
                    sortOrder={sortOrder}
                  />
                </div>
              </TableHead>
              {showActions && <TableHead className="w-12">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedUnits.map((unit) => {
              const daysUntilRentDue = getDaysUntilRentDue(unit);
              const rentOverdue = isRentOverdue(unit);
              const rentDueSoon = isRentDueSoon(unit);
              const property =
                typeof unit.property === "string"
                  ? { title: unit.property }
                  : unit.property;

              return (
                <TableRow
                  className={`${
                    rentOverdue
                      ? "bg-red-50/50"
                      : rentDueSoon
                        ? "bg-yellow-50/50"
                        : ""
                  } hover:bg-muted/50`}
                  key={unit._id}
                >
                  {selectable && (
                    <TableCell>
                      <input
                        checked={selectedUnits.includes(unit._id)}
                        className="rounded"
                        onChange={() => handleSelectUnit(unit._id)}
                        type="checkbox"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">{unit.unitNumber}</div>
                      <div className="text-muted-foreground text-sm">
                        {property?.title}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{getUnitTypeDisplayName(unit.unitType)}</div>
                      <div className="text-muted-foreground text-sm">
                        {unit.bedrooms} bed • {unit.bathrooms} bath
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={unit.status} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {formatCurrency(unit.rent)}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Due: {unit.rentDueDay}th
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {unit.status === "occupied" && unit.currentTenant ? (
                      <div>
                        <div className="font-medium">
                          {typeof unit.currentTenant === "string"
                            ? unit.currentTenant
                            : `${unit.currentTenant.personalInfo.firstName} ${unit.currentTenant.personalInfo.lastName}`}
                        </div>
                        {unit.leaseStartDate && (
                          <div className="text-muted-foreground text-sm">
                            Since {formatDate(unit.leaseStartDate)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No tenant</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {daysUntilRentDue !== null ? (
                      <div className="flex items-center gap-2">
                        {rentOverdue && (
                          <Badge className="text-xs" variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {Math.abs(daysUntilRentDue)}d overdue
                          </Badge>
                        )}
                        {rentDueSoon && !rentOverdue && (
                          <Badge className="text-xs" variant="secondary">
                            <Calendar className="mr-1 h-3 w-3" />
                            {daysUntilRentDue}d to go
                          </Badge>
                        )}
                        {!(rentOverdue || rentDueSoon) && (
                          <span className="text-muted-foreground text-sm">
                            {daysUntilRentDue}d to go
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="h-8 w-8"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewUnit && (
                            <DropdownMenuItem onClick={() => onViewUnit(unit)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          )}
                          {onEditUnit && (
                            <DropdownMenuItem onClick={() => onEditUnit(unit)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Unit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {unit.status === "vacant" && onAssignTenant && (
                            <DropdownMenuItem
                              onClick={() => onAssignTenant(unit)}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign Tenant
                            </DropdownMenuItem>
                          )}
                          {unit.status === "occupied" && onVacateTenant && (
                            <DropdownMenuItem
                              onClick={() => onVacateTenant(unit)}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Vacate Unit
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredAndSortedUnits.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No units match your filters"
              : "No units found"}
          </div>
        )}
      </div>
    </div>
  );
}
