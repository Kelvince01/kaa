"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { cn } from "@kaa/ui/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceType,
} from "../../maintenance.type";
import {
  getMaintenanceTypeDisplayName,
  getPriorityDisplayName,
  getStatusDisplayName,
} from "../../utils/maintenance-utils";

export type MaintenanceFilters = {
  status: MaintenanceStatus[];
  priority: MaintenancePriority[];
  type: MaintenanceType[];
  property: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  costRange: {
    min?: number;
    max?: number;
  };
  hasContractor?: boolean;
  isOverdue?: boolean;
};

type MaintenanceFiltersProps = {
  filters: MaintenanceFilters;
  onFiltersChange: (filters: MaintenanceFilters) => void;
  properties?: Array<{ _id: string; title: string }>;
};

export function MaintenanceFiltersComponent({
  filters,
  onFiltersChange,
  properties = [],
}: MaintenanceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<MaintenanceFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      type: [],
      property: [],
      dateRange: {},
      costRange: {},
      hasContractor: undefined,
      isOverdue: undefined,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    count += filters.status.length;
    count += filters.priority.length;
    count += filters.type.length;
    count += filters.property.length;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (
      filters.costRange.min !== undefined ||
      filters.costRange.max !== undefined
    )
      count++;
    if (filters.hasContractor !== undefined) count++;
    if (filters.isOverdue !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Status
              {filters.status.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(MaintenanceStatus).map((status) => (
              <DropdownMenuCheckboxItem
                checked={filters.status.includes(status)}
                key={status}
                onCheckedChange={(checked) => {
                  const newStatus = checked
                    ? [...filters.status, status]
                    : filters.status.filter((s) => s !== status);
                  updateFilters({ status: newStatus });
                }}
              >
                {getStatusDisplayName(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Priority
              {filters.priority.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {filters.priority.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(MaintenancePriority).map((priority) => (
              <DropdownMenuCheckboxItem
                checked={filters.priority.includes(priority)}
                key={priority}
                onCheckedChange={(checked) => {
                  const newPriority = checked
                    ? [...filters.priority, priority]
                    : filters.priority.filter((p) => p !== priority);
                  updateFilters({ priority: newPriority });
                }}
              >
                {getPriorityDisplayName(priority)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Type
              {filters.type.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {filters.type.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.values(MaintenanceType).map((type) => (
              <DropdownMenuCheckboxItem
                checked={filters.type.includes(type)}
                key={type}
                onCheckedChange={(checked) => {
                  const newType = checked
                    ? [...filters.type, type]
                    : filters.type.filter((t) => t !== type);
                  updateFilters({ type: newType });
                }}
              >
                {getMaintenanceTypeDisplayName(type)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Property Filter */}
        {properties.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                Property
                {filters.property.length > 0 && (
                  <Badge className="ml-2" variant="secondary">
                    {filters.property.length}
                  </Badge>
                )}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Property</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {properties.map((property) => (
                <DropdownMenuCheckboxItem
                  checked={filters.property.includes(property._id)}
                  key={property._id}
                  onCheckedChange={(checked) => {
                    const newProperty = checked
                      ? [...filters.property, property._id]
                      : filters.property.filter((p) => p !== property._id);
                    updateFilters({ property: newProperty });
                  }}
                >
                  {property.title}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Advanced Filters Toggle */}
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          size="sm"
          variant="outline"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Advanced
        </Button>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button onClick={clearFilters} size="sm" variant="ghost">
            <X className="mr-2 h-4 w-4" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
          <h4 className="font-medium text-sm">Advanced Filters</h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="date-range">
                Date Range
              </label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground"
                      )}
                      size="sm"
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        format(filters.dateRange.from, "PPP")
                      ) : (
                        <span>From</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: date },
                        })
                      }
                      selected={filters.dateRange.from}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateRange.to && "text-muted-foreground"
                      )}
                      size="sm"
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? (
                        format(filters.dateRange.to, "PPP")
                      ) : (
                        <span>To</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={(date) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: date },
                        })
                      }
                      selected={filters.dateRange.to}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Cost Range */}
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="cost-range">
                Cost Range
              </label>
              <div className="flex gap-2">
                <Input
                  onChange={(e) =>
                    updateFilters({
                      costRange: {
                        ...filters.costRange,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                  placeholder="Min"
                  type="number"
                  value={filters.costRange.min || ""}
                />
                <Input
                  onChange={(e) =>
                    updateFilters({
                      costRange: {
                        ...filters.costRange,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      },
                    })
                  }
                  placeholder="Max"
                  type="number"
                  value={filters.costRange.max || ""}
                />
              </div>
            </div>

            {/* Special Filters */}
            <div className="space-y-2">
              <label className="font-medium text-sm" htmlFor="special-filters">
                Special Filters
              </label>
              <div className="space-y-2">
                <Select
                  onValueChange={(value) =>
                    updateFilters({
                      hasContractor:
                        value === "with-contractor"
                          ? true
                          : value === "without-contractor"
                            ? false
                            : undefined,
                    })
                  }
                  value={
                    filters.hasContractor === true
                      ? "with-contractor"
                      : filters.hasContractor === false
                        ? "without-contractor"
                        : "all"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Contractor status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All requests</SelectItem>
                    <SelectItem value="with-contractor">
                      With contractor
                    </SelectItem>
                    <SelectItem value="without-contractor">
                      Without contractor
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) =>
                    updateFilters({
                      isOverdue:
                        value === "overdue"
                          ? true
                          : value === "not-overdue"
                            ? false
                            : undefined,
                    })
                  }
                  value={
                    filters.isOverdue === true
                      ? "overdue"
                      : filters.isOverdue === false
                        ? "not-overdue"
                        : "all"
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Due status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All requests</SelectItem>
                    <SelectItem value="overdue">Overdue only</SelectItem>
                    <SelectItem value="not-overdue">Not overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
