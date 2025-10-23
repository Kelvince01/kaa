"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Checkbox } from "@kaa/ui/components/checkbox";
import { Input } from "@kaa/ui/components/input";
import { Label } from "@kaa/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@kaa/ui/components/sheet";
import { Slider } from "@kaa/ui/components/slider";
import { format } from "date-fns";
import { CalendarIcon, Filter, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { useProperties } from "@/modules/properties/property.queries";
import { useTenants } from "@/modules/tenants/tenant.queries";
import { useContractStore } from "../../contract.store";
import { ContractStatus, ContractType } from "../../contract.type";

type AdvancedFilterPanelProps = {
  onApplyFilters?: () => void;
};

export function AdvancedFilterPanel({
  onApplyFilters,
}: AdvancedFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    searchTerm: "",
    statusFilter: [] as ContractStatus[],
    typeFilter: [] as ContractType[],
    propertyFilter: [] as string[],
    tenantFilter: [] as string[],
    dateRange: null as {
      startDate?: Date;
      endDate?: Date;
      field: string | any;
    } | null,
    rentRange: { min: 0, max: 10_000 },
    tagsFilter: [] as string[],
  });

  const {
    filters,
    setSearchTerm,
    setStatusFilter,
    setTypeFilter,
    setPropertyFilter,
    setTenantFilter,
    setDateRange,
    setRentRange,
    setTagsFilter,
    clearFilters,
    getActiveFiltersCount,
  } = useContractStore();

  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();

  // Initialize temp filters from store
  const initializeTempFilters = () => {
    setTempFilters({
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      typeFilter: filters.typeFilter,
      propertyFilter: filters.propertyFilter,
      tenantFilter: filters.tenantFilter,
      dateRange: filters.dateRange,
      rentRange: (filters.rentRange as { min: number; max: number }) || {
        min: 0,
        max: 10_000,
      },
      tagsFilter: filters.tagsFilter,
    });
  };

  // Apply filters to store
  const applyFilters = () => {
    setSearchTerm(tempFilters.searchTerm);
    setStatusFilter(tempFilters.statusFilter);
    setTypeFilter(tempFilters.typeFilter);
    setPropertyFilter(tempFilters.propertyFilter);
    setTenantFilter(tempFilters.tenantFilter);
    setDateRange(tempFilters.dateRange);
    setRentRange(tempFilters.rentRange);
    setTagsFilter(tempFilters.tagsFilter);

    if (onApplyFilters) {
      onApplyFilters();
    }

    setOpen(false);
  };

  // Reset filters
  const resetFilters = () => {
    setTempFilters({
      searchTerm: "",
      statusFilter: [],
      typeFilter: [],
      propertyFilter: [],
      tenantFilter: [],
      dateRange: null,
      rentRange: { min: 0, max: 10_000 },
      tagsFilter: [],
    });
  };

  // Toggle status filter
  const toggleStatusFilter = (status: ContractStatus) => {
    setTempFilters((prev) => ({
      ...prev,
      statusFilter: prev.statusFilter.includes(status)
        ? prev.statusFilter.filter((s) => s !== status)
        : [...prev.statusFilter, status],
    }));
  };

  // Toggle type filter
  const toggleTypeFilter = (type: ContractType) => {
    setTempFilters((prev) => ({
      ...prev,
      typeFilter: prev.typeFilter.includes(type)
        ? prev.typeFilter.filter((t) => t !== type)
        : [...prev.typeFilter, type],
    }));
  };

  // Toggle property filter
  const togglePropertyFilter = (propertyId: string) => {
    setTempFilters((prev) => ({
      ...prev,
      propertyFilter: prev.propertyFilter.includes(propertyId)
        ? prev.propertyFilter.filter((p) => p !== propertyId)
        : [...prev.propertyFilter, propertyId],
    }));
  };

  // Toggle tenant filter
  const toggleTenantFilter = (tenantId: string) => {
    setTempFilters((prev) => ({
      ...prev,
      tenantFilter: prev.tenantFilter.includes(tenantId)
        ? prev.tenantFilter.filter((t) => t !== tenantId)
        : [...prev.tenantFilter, tenantId],
    }));
  };

  // Update date range
  const updateDateRange = (
    field: string,
    date: Date | undefined,
    type: "start" | "end"
  ) => {
    setTempFilters((prev) => ({
      ...prev,
      dateRange: {
        field,
        startDate: type === "start" ? date : prev.dateRange?.startDate,
        endDate: type === "end" ? date : prev.dateRange?.endDate,
      },
    }));
  };

  // Format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Sheet
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          initializeTempFilters();
        }
      }}
      open={open}
    >
      <SheetTrigger asChild>
        <Button className="relative" variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 p-0 text-xs" variant="secondary">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        className="w-full overflow-y-auto sm:w-[400px] sm:max-w-[400px]"
        side="right"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </SheetTitle>
          <SheetDescription>
            Filter contracts by various criteria
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-120px)]">
          <div className="space-y-6 pr-6">
            {/* Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    onChange={(e) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                    placeholder="Search contracts..."
                    value={tempFilters.searchTerm}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contract Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(ContractStatus).map((status) => (
                    <div className="flex items-center space-x-2" key={status}>
                      <Checkbox
                        checked={tempFilters.statusFilter.includes(status)}
                        id={`status-${status}`}
                        onCheckedChange={() => toggleStatusFilter(status)}
                      />
                      <Label
                        className="cursor-pointer font-normal text-sm"
                        htmlFor={`status-${status}`}
                      >
                        {status.replace("_", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Type */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Contract Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(ContractType)
                    .slice(0, 4)
                    .map((type) => (
                      <div className="flex items-center space-x-2" key={type}>
                        <Checkbox
                          checked={tempFilters.typeFilter.includes(type)}
                          id={`type-${type}`}
                          onCheckedChange={() => toggleTypeFilter(type)}
                        />
                        <Label
                          className="cursor-pointer font-normal text-sm"
                          htmlFor={`type-${type}`}
                        >
                          {type.replace(/_/g, " ")}
                        </Label>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Property Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {properties?.properties?.map((property) => (
                    <div
                      className="flex items-center space-x-2"
                      key={(property._id as any).toString()}
                    >
                      <Checkbox
                        checked={tempFilters.propertyFilter.includes(
                          property._id as any
                        )}
                        id={`property-${property._id as any}`}
                        onCheckedChange={() =>
                          togglePropertyFilter(property._id as any)
                        }
                      />
                      <Label
                        className="flex-1 cursor-pointer font-normal text-sm"
                        htmlFor={`property-${property._id}`}
                      >
                        <div className="font-medium">{property.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {property.location.address.line1}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tenant Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tenants?.items?.map((tenant) => (
                    <div
                      className="flex items-center space-x-2"
                      key={tenant._id}
                    >
                      <Checkbox
                        checked={tempFilters.tenantFilter.includes(tenant._id)}
                        id={`tenant-${tenant._id}`}
                        onCheckedChange={() => toggleTenantFilter(tenant._id)}
                      />
                      <Label
                        className="flex-1 cursor-pointer font-normal text-sm"
                        htmlFor={`tenant-${tenant._id}`}
                      >
                        <div className="font-medium">
                          {tenant.personalInfo.firstName}{" "}
                          {tenant.personalInfo.lastName}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {tenant.personalInfo.email}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Range */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Date Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Filter by</Label>
                  <Select
                    onValueChange={(value) => {
                      setTempFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          field: value,
                        } as any,
                      }));
                    }}
                    value={tempFilters.dateRange?.field || "startDate"}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select date field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startDate">Start Date</SelectItem>
                      <SelectItem value="endDate">End Date</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="mt-1 w-full justify-start text-left font-normal"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateRange?.startDate ? (
                            format(tempFilters.dateRange.startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          initialFocus
                          mode="single"
                          onSelect={(date) =>
                            updateDateRange(
                              tempFilters.dateRange?.field || "startDate",
                              date,
                              "start"
                            )
                          }
                          selected={tempFilters.dateRange?.startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-sm">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          className="mt-1 w-full justify-start text-left font-normal"
                          variant="outline"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tempFilters.dateRange?.endDate ? (
                            format(tempFilters.dateRange.endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          initialFocus
                          mode="single"
                          onSelect={(date) =>
                            updateDateRange(
                              tempFilters.dateRange?.field || "startDate",
                              date,
                              "end"
                            )
                          }
                          selected={tempFilters.dateRange?.endDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rent Range */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Monthly Rent Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-3">
                  <Slider
                    className="w-full"
                    max={20_000}
                    min={0}
                    onValueChange={(value) => {
                      setTempFilters((prev) => ({
                        ...prev,
                        rentRange: {
                          min: value[0] as number,
                          max: value[1] as number,
                        },
                      }));
                    }}
                    step={500}
                    value={[
                      tempFilters.rentRange.min,
                      tempFilters.rentRange.max,
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{formatCurrency(tempFilters.rentRange.min)}</span>
                  <span>{formatCurrency(tempFilters.rentRange.max)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-muted-foreground text-xs">Min</Label>
                    <Input
                      className="h-8"
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setTempFilters((prev) => ({
                          ...prev,
                          rentRange: { ...prev.rentRange, min: value },
                        }));
                      }}
                      type="number"
                      value={tempFilters.rentRange.min}
                    />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Max</Label>
                    <Input
                      className="h-8"
                      onChange={(e) => {
                        const value =
                          Number.parseInt(e.target.value, 10) || 20_000;
                        setTempFilters((prev) => ({
                          ...prev,
                          rentRange: { ...prev.rentRange, max: value },
                        }));
                      }}
                      type="number"
                      value={tempFilters.rentRange.max}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2 border-t pt-4">
          <Button className="flex-1" onClick={resetFilters} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button className="flex-1" onClick={applyFilters}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
