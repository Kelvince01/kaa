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
import { Label } from "@kaa/ui/components/label";
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
import { Slider } from "@kaa/ui/components/slider";
import { cn } from "@kaa/ui/lib/utils";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

type AnalyticsFiltersProps = {
  onFiltersChange: (filters: AnalyticsFilters) => void;
  currentFilters: AnalyticsFilters;
  availableCategories?: string[];
  availableProperties?: Array<{ id: string; name: string }>;
  showAdvancedFilters?: boolean;
  className?: string;
};

export type AnalyticsFilters = {
  dateRange?: DateRange;
  quickDateRange?: string;
  categories?: string[];
  properties?: string[];
  minAmount?: number;
  maxAmount?: number;
  timeframe?: "day" | "week" | "month" | "quarter" | "year";
  comparison?: "previous_period" | "previous_year" | "none";
  includeRecurring?: boolean;
  taxDeductibleOnly?: boolean;
  status?: string[];
  vendors?: string[];
  groupBy?: "category" | "vendor" | "property" | "month" | "quarter";
};

const quickDateRanges = [
  {
    label: "Last 7 days",
    value: "7d",
    getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }),
  },
  {
    label: "Last 30 days",
    value: "30d",
    getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }),
  },
  {
    label: "Last 3 months",
    value: "3m",
    getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: "Last 6 months",
    value: "6m",
    getRange: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: "This month",
    value: "this_month",
    getRange: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: "This year",
    value: "this_year",
    getRange: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
  {
    label: "Last year",
    value: "last_year",
    getRange: () => {
      const lastYear = subYears(new Date(), 1);
      return { from: startOfYear(lastYear), to: endOfYear(lastYear) };
    },
  },
];

export function AnalyticsFilters({
  onFiltersChange,
  currentFilters,
  availableCategories = [
    "Maintenance",
    "Utilities",
    "Insurance",
    "Marketing",
    "Office Supplies",
    "Professional Services",
    "Travel",
    "Other",
  ],
  availableProperties = [],
  showAdvancedFilters = false,
  className,
}: AnalyticsFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedFilters);
  const [amountRange, setAmountRange] = useState<[number, number]>([
    currentFilters.minAmount || 0,
    currentFilters.maxAmount || 10_000,
  ]);

  const handleQuickDateChange = (value: string) => {
    const range = quickDateRanges.find((r) => r.value === value)?.getRange();
    if (range) {
      const updatedFilters = {
        ...currentFilters,
        dateRange: range,
        quickDateRange: value,
      };
      onFiltersChange(updatedFilters);
    }
  };

  const handleDateRangeChange = (dateRange?: DateRange) => {
    const updatedFilters = {
      ...currentFilters,
      dateRange,
      quickDateRange: undefined, // Clear quick selection when custom range is set
    };
    onFiltersChange(updatedFilters);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = currentFilters.categories || [];
    const updatedCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter((c) => c !== category);

    const updatedFilters = {
      ...currentFilters,
      categories: updatedCategories,
    };
    onFiltersChange(updatedFilters);
  };

  const handleAmountRangeChange = (range: [number, number]) => {
    setAmountRange(range);
    const updatedFilters = {
      ...currentFilters,
      minAmount: range[0],
      maxAmount: range[1],
    };
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: undefined,
      quickDateRange: undefined,
      categories: [],
      properties: [],
      minAmount: 0,
      maxAmount: 10_000,
      timeframe: "month",
      comparison: "none",
      includeRecurring: true,
      taxDeductibleOnly: false,
      status: [],
      vendors: [],
      groupBy: "category",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (currentFilters.dateRange) count++;
    if (currentFilters.categories && currentFilters.categories.length > 0)
      count++;
    if (currentFilters.properties && currentFilters.properties.length > 0)
      count++;
    if (currentFilters.minAmount && currentFilters.minAmount > 0) count++;
    if (currentFilters.maxAmount && currentFilters.maxAmount < 10_000) count++;
    if (currentFilters.taxDeductibleOnly) count++;
    if (currentFilters.status && currentFilters.status.length > 0) count++;
    return count;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="ml-2" variant="secondary">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="sm"
              variant="ghost"
            >
              <Settings className="mr-1 h-4 w-4" />
              Advanced
              <ChevronDown
                className={cn(
                  "ml-1 h-4 w-4 transition-transform",
                  showAdvanced && "rotate-180"
                )}
              />
            </Button>
            <Button
              disabled={getActiveFilterCount() === 0}
              onClick={clearAllFilters}
              size="sm"
              variant="outline"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Date Ranges */}
        <div>
          <Label className="mb-3 block font-medium text-sm">Time Period</Label>
          <div className="mb-3 flex flex-wrap gap-2">
            {quickDateRanges.map((range) => (
              <Button
                key={range.value}
                onClick={() => handleQuickDateChange(range.value)}
                size="sm"
                variant={
                  currentFilters.quickDateRange === range.value
                    ? "default"
                    : "outline"
                }
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    "justify-start text-left font-normal",
                    !currentFilters.dateRange && "text-muted-foreground"
                  )}
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {currentFilters.dateRange?.from ? (
                    currentFilters.dateRange.to ? (
                      <>
                        {format(currentFilters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(currentFilters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(currentFilters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Custom date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  defaultMonth={currentFilters.dateRange?.from}
                  initialFocus
                  mode="range"
                  numberOfMonths={2}
                  onSelect={handleDateRangeChange}
                  selected={currentFilters.dateRange}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Categories */}
        <div>
          <Label className="mb-3 block font-medium text-sm">Categories</Label>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {availableCategories.map((category) => (
              <div className="flex items-center space-x-2" key={category}>
                <Checkbox
                  checked={currentFilters.categories?.includes(category)}
                  id={`category-${category}`}
                  onCheckedChange={(checked) =>
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor={`category-${category}`}
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Timeframe and Grouping */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block font-medium text-sm">Time Frame</Label>
            <Select
              onValueChange={(value) =>
                onFiltersChange({
                  ...currentFilters,
                  timeframe: value as AnalyticsFilters["timeframe"],
                })
              }
              value={currentFilters.timeframe || "month"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block font-medium text-sm">Group By</Label>
            <Select
              onValueChange={(value) =>
                onFiltersChange({
                  ...currentFilters,
                  groupBy: value as AnalyticsFilters["groupBy"],
                })
              }
              value={currentFilters.groupBy || "category"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="property">Property</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-6 border-t pt-4">
            {/* Amount Range */}
            <div>
              <Label className="mb-3 block font-medium text-sm">
                Amount Range: ${amountRange[0]} - ${amountRange[1]}
              </Label>
              <div className="px-2">
                <Slider
                  className="w-full"
                  max={10_000}
                  min={0}
                  onValueChange={(value) =>
                    handleAmountRangeChange(value as [number, number])
                  }
                  step={100}
                  value={amountRange}
                />
              </div>
            </div>

            {/* Properties */}
            {availableProperties.length > 0 && (
              <div>
                <Label className="mb-3 block font-medium text-sm">
                  Properties
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {availableProperties.map((property) => (
                    <div
                      className="flex items-center space-x-2"
                      key={property.id}
                    >
                      <Checkbox
                        checked={currentFilters.properties?.includes(
                          property.id
                        )}
                        id={`property-${property.id}`}
                        onCheckedChange={(checked) => {
                          const currentProperties =
                            currentFilters.properties || [];
                          const updatedProperties = checked
                            ? [...currentProperties, property.id]
                            : currentProperties.filter(
                                (p) => p !== property.id
                              );

                          onFiltersChange({
                            ...currentFilters,
                            properties: updatedProperties,
                          });
                        }}
                      />
                      <Label
                        className="cursor-pointer font-normal text-sm"
                        htmlFor={`property-${property.id}`}
                      >
                        {property.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <Label className="mb-3 block font-medium text-sm">Status</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Pending", "Approved", "Rejected"].map((status) => (
                  <div className="flex items-center space-x-2" key={status}>
                    <Checkbox
                      checked={currentFilters.status?.includes(
                        status.toLowerCase()
                      )}
                      id={`status-${status}`}
                      onCheckedChange={(checked) => {
                        const currentStatuses = currentFilters.status || [];
                        const updatedStatuses = checked
                          ? [...currentStatuses, status.toLowerCase()]
                          : currentStatuses.filter(
                              (s) => s !== status.toLowerCase()
                            );

                        onFiltersChange({
                          ...currentFilters,
                          status: updatedStatuses,
                        });
                      }}
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor={`status-${status}`}
                    >
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={currentFilters.taxDeductibleOnly}
                  id="tax-deductible"
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...currentFilters,
                      taxDeductibleOnly: checked as boolean,
                    })
                  }
                />
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor="tax-deductible"
                >
                  Tax deductible only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={currentFilters.includeRecurring !== false}
                  id="include-recurring"
                  onCheckedChange={(checked) =>
                    onFiltersChange({
                      ...currentFilters,
                      includeRecurring: checked as boolean,
                    })
                  }
                />
                <Label
                  className="cursor-pointer font-normal text-sm"
                  htmlFor="include-recurring"
                >
                  Include recurring expenses
                </Label>
              </div>
            </div>

            {/* Comparison */}
            <div>
              <Label className="mb-2 block font-medium text-sm">
                Compare With
              </Label>
              <Select
                onValueChange={(value) =>
                  onFiltersChange({
                    ...currentFilters,
                    comparison: value as AnalyticsFilters["comparison"],
                  })
                }
                value={currentFilters.comparison || "none"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No comparison</SelectItem>
                  <SelectItem value="previous_period">
                    Previous period
                  </SelectItem>
                  <SelectItem value="previous_year">Previous year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Applied Filters Summary */}
        {getActiveFilterCount() > 0 && (
          <div className="border-t pt-4">
            <Label className="mb-2 block font-medium text-sm">
              Applied Filters
            </Label>
            <div className="flex flex-wrap gap-2">
              {currentFilters.dateRange && (
                <Badge variant="secondary">
                  {currentFilters.quickDateRange
                    ? quickDateRanges.find(
                        (r) => r.value === currentFilters.quickDateRange
                      )?.label
                    : `${format(currentFilters.dateRange.from || new Date(), "MMM d")} - ${
                        currentFilters.dateRange.to
                          ? format(currentFilters.dateRange.to, "MMM d")
                          : ""
                      }`}
                </Badge>
              )}
              {currentFilters.categories?.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                  <Button
                    className="ml-1 h-auto p-0"
                    onClick={() => handleCategoryChange(category, false)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {currentFilters.taxDeductibleOnly && (
                <Badge variant="secondary">Tax deductible only</Badge>
              )}
              {(currentFilters.minAmount && currentFilters.minAmount > 0) ||
              (currentFilters.maxAmount &&
                currentFilters.maxAmount < 10_000) ? (
                <Badge variant="secondary">
                  ${currentFilters.minAmount || 0} - $
                  {currentFilters.maxAmount || 10_000}
                </Badge>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
