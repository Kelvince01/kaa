"use client";

import { Button } from "@kaa/ui/components/button";
import { Calendar } from "@kaa/ui/components/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@kaa/ui/components/command";
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
import type { Column, Table } from "@tanstack/react-table";
import {
  BadgeCheck,
  CalendarIcon,
  Check,
  ListFilter,
  Text,
  X,
} from "lucide-react";
import { useQueryState } from "nuqs";
import * as React from "react";
import { DataTableRangeFilter } from "@/components/ui/data-table/data-table-range-filter";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { getDefaultFilterOperator, getFilterOperators } from "@/lib/data-table";
import { getFiltersStateParser } from "@/lib/parsers";
import type {
  ExtendedColumnFilter,
  FilterOperator,
} from "@/shared/types/data-table";
import { formatDate } from "@/shared/utils/format.util";
import { generateId } from "@/shared/utils/id.util";

const FILTERS_KEY = "filters";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
const OPEN_MENU_SHORTCUT = "f";
const REMOVE_FILTER_SHORTCUTS = ["backspace", "delete"];

interface DataTableFilterMenuProps<TData>
  extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
  debounceMs?: number;
  throttleMs?: number;
  shallow?: boolean;
}

export function DataTableFilterMenu<TData>({
  table,
  debounceMs = DEBOUNCE_MS,
  throttleMs = THROTTLE_MS,
  shallow = true,
  align = "start",
  ...props
}: DataTableFilterMenuProps<TData>) {
  const id = React.useId();

  const columns = React.useMemo(() => {
    return table
      .getAllColumns()
      .filter((column) => column.columnDef.enableColumnFilter);
  }, [table]);

  const [open, setOpen] = React.useState(false);
  const [selectedColumn, setSelectedColumn] =
    React.useState<Column<TData> | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onOpenChange = React.useCallback((open: boolean) => {
    setOpen(open);

    if (!open) {
      setTimeout(() => {
        setSelectedColumn(null);
        setInputValue("");
      }, 100);
    }
  }, []);

  const onInputKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
        !inputValue &&
        selectedColumn
      ) {
        event.preventDefault();
        setSelectedColumn(null);
      }
    },
    [inputValue, selectedColumn]
  );

  const [filters, setFilters] = useQueryState(
    FILTERS_KEY,
    getFiltersStateParser<TData>(columns.map((field) => field.id))
      .withDefault([])
      .withOptions({
        clearOnDefault: true,
        shallow,
        throttleMs,
      })
  );
  const debouncedSetFilters = useDebouncedCallback(setFilters, debounceMs);

  const onFilterAdd = React.useCallback(
    (column: Column<TData>, value: string) => {
      if (!value.trim() && column.columnDef.meta?.variant !== "boolean") {
        return;
      }

      const filterValue =
        column.columnDef.meta?.variant === "multiSelect" ? [value] : value;

      const newFilter: ExtendedColumnFilter<TData> = {
        id: column.id as Extract<keyof TData, string>,
        value: filterValue,
        variant: column.columnDef.meta?.variant ?? "text",
        operator: getDefaultFilterOperator(
          column.columnDef.meta?.variant ?? "text"
        ),
        filterId: generateId({ length: 8 }),
      };

      debouncedSetFilters([...filters, newFilter]);
      setOpen(false);

      setTimeout(() => {
        setSelectedColumn(null);
        setInputValue("");
      }, 100);
    },
    [filters, debouncedSetFilters]
  );

  const onFilterRemove = React.useCallback(
    (filterId: string) => {
      const updatedFilters = filters.filter(
        (filter) => filter.filterId !== filterId
      );
      debouncedSetFilters(updatedFilters);
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    },
    [filters, debouncedSetFilters]
  );

  const onFilterUpdate = React.useCallback(
    (
      filterId: string,
      updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>
    ) => {
      debouncedSetFilters((prevFilters) => {
        const updatedFilters = prevFilters.map((filter) => {
          if (filter.filterId === filterId) {
            return { ...filter, ...updates } as ExtendedColumnFilter<TData>;
          }
          return filter;
        });
        return updatedFilters;
      });
    },
    [debouncedSetFilters]
  );

  const onFiltersReset = React.useCallback(() => {
    debouncedSetFilters([]);
  }, [debouncedSetFilters]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        event.key.toLowerCase() === OPEN_MENU_SHORTCUT &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        setOpen(true);
      }

      if (
        event.key.toLowerCase() === OPEN_MENU_SHORTCUT &&
        event.shiftKey &&
        !open &&
        filters.length > 0
      ) {
        event.preventDefault();
        onFilterRemove(filters.at(-1)?.filterId ?? "");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filters, onFilterRemove]);

  const onTriggerKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (
        REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase()) &&
        filters.length > 0
      ) {
        event.preventDefault();
        onFilterRemove(filters.at(-1)?.filterId ?? "");
      }
    },
    [filters, onFilterRemove]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <DataTableFilterItem
          columns={columns}
          filter={filter}
          filterItemId={`${id}-filter-${filter.filterId}`}
          key={filter.filterId}
          onFilterRemove={onFilterRemove}
          onFilterUpdate={onFilterUpdate}
        />
      ))}
      {filters.length > 0 && (
        <Button
          aria-label="Reset all filters"
          className="size-8"
          onClick={onFiltersReset}
          size="icon"
          variant="outline"
        >
          <X />
        </Button>
      )}
      <Popover onOpenChange={onOpenChange} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-label="Open filter command menu"
            className={cn(filters.length > 0 && "size-8", "h-8")}
            onKeyDown={onTriggerKeyDown}
            ref={triggerRef}
            size={filters.length > 0 ? "icon" : "sm"}
            variant="outline"
          >
            <ListFilter />
            {filters.length > 0 ? null : "Filter"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align={align}
          className="w-full max-w-[var(--radix-popover-content-available-width)] origin-[var(--radix-popover-content-transform-origin)] p-0"
          {...props}
        >
          <Command className="[&_[cmdk-input-wrapper]_svg]:hidden" loop>
            <CommandInput
              onKeyDown={onInputKeyDown}
              onValueChange={setInputValue}
              placeholder={
                selectedColumn
                  ? (selectedColumn.columnDef.meta?.label ?? selectedColumn.id)
                  : "Search fields..."
              }
              ref={inputRef}
              value={inputValue}
            />
            <CommandList>
              {selectedColumn ? (
                <>
                  {selectedColumn.columnDef.meta?.options && (
                    <CommandEmpty>No options found.</CommandEmpty>
                  )}
                  <FilterValueSelector
                    column={selectedColumn}
                    onSelect={(value) => onFilterAdd(selectedColumn, value)}
                    value={inputValue}
                  />
                </>
              ) : (
                <>
                  <CommandEmpty>No fields found.</CommandEmpty>
                  <CommandGroup>
                    {columns.map((column) => (
                      <CommandItem
                        key={column.id}
                        onSelect={() => {
                          setSelectedColumn(column);
                          setInputValue("");
                          requestAnimationFrame(() => {
                            inputRef.current?.focus();
                          });
                        }}
                        value={column.id}
                      >
                        {column.columnDef.meta?.icon && (
                          <column.columnDef.meta.icon />
                        )}
                        <span className="truncate">
                          {column.columnDef.meta?.label ?? column.id}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type DataTableFilterItemProps<TData> = {
  filter: ExtendedColumnFilter<TData>;
  filterItemId: string;
  columns: Column<TData>[];
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>
  ) => void;
  onFilterRemove: (filterId: string) => void;
};

function DataTableFilterItem<TData>({
  filter,
  filterItemId,
  columns,
  onFilterUpdate,
  onFilterRemove,
}: DataTableFilterItemProps<TData>) {
  {
    const [showFieldSelector, setShowFieldSelector] = React.useState(false);
    const [showOperatorSelector, setShowOperatorSelector] =
      React.useState(false);
    const [showValueSelector, setShowValueSelector] = React.useState(false);

    const column = columns.find((column) => column.id === filter.id);

    const operatorListboxId = `${filterItemId}-operator-listbox`;
    const inputId = `${filterItemId}-input`;

    const columnMeta = column?.columnDef.meta;
    const filterOperators = getFilterOperators(filter.variant);

    const onItemKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (showFieldSelector || showOperatorSelector || showValueSelector) {
          return;
        }

        if (REMOVE_FILTER_SHORTCUTS.includes(event.key.toLowerCase())) {
          event.preventDefault();
          onFilterRemove(filter.filterId);
        }
      },
      [
        filter.filterId,
        showFieldSelector,
        showOperatorSelector,
        showValueSelector,
        onFilterRemove,
      ]
    );

    if (!column) return null;

    return (
      // biome-ignore lint/a11y/noNoninteractiveElementInteractions: false positive
      // biome-ignore lint/a11y/useSemanticElements: false positive
      <div
        className="flex h-8 items-center rounded-md bg-background"
        id={filterItemId}
        key={filter.filterId}
        onKeyDown={onItemKeyDown}
        role="listitem"
      >
        <Popover onOpenChange={setShowFieldSelector} open={showFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              className="rounded-none rounded-l-md border border-r-0 font-normal dark:bg-input/30"
              size="sm"
              variant="ghost"
            >
              {columnMeta?.icon && (
                <columnMeta.icon className="text-muted-foreground" />
              )}
              {columnMeta?.label ?? column.id}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-48 origin-[var(--radix-popover-content-transform-origin)] p-0"
          >
            <Command loop>
              <CommandInput placeholder="Search fields..." value={""} />
              <CommandList>
                <CommandEmpty>No fields found.</CommandEmpty>
                <CommandGroup>
                  {columns.map((column) => (
                    <CommandItem
                      key={column.id}
                      onSelect={() => {
                        onFilterUpdate(filter.filterId, {
                          id: column.id as Extract<keyof TData, string>,
                          variant: column.columnDef.meta?.variant ?? "text",
                          operator: getDefaultFilterOperator(
                            column.columnDef.meta?.variant ?? "text"
                          ),
                          value: "",
                        });

                        setShowFieldSelector(false);
                      }}
                      value={column.id}
                    >
                      {column.columnDef.meta?.icon && (
                        <column.columnDef.meta.icon />
                      )}
                      <span className="truncate">
                        {column.columnDef.meta?.label ?? column.id}
                      </span>
                      <Check
                        className={cn(
                          "ml-auto",
                          column.id === filter.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Select
          onOpenChange={setShowOperatorSelector}
          onValueChange={(value: FilterOperator) =>
            onFilterUpdate(filter.filterId, {
              operator: value,
              value:
                value === "isEmpty" || value === "isNotEmpty"
                  ? ""
                  : filter.value,
            })
          }
          open={showOperatorSelector}
          value={filter.operator}
        >
          <SelectTrigger
            aria-controls={operatorListboxId}
            className="h-8 rounded-none border-r-0 px-2.5 lowercase [&[data-size]]:h-8 [&_svg]:hidden"
          >
            <SelectValue placeholder={filter.operator} />
          </SelectTrigger>
          <SelectContent
            className="origin-[var(--radix-select-content-transform-origin)]"
            id={operatorListboxId}
          >
            {filterOperators.map((operator) => (
              <SelectItem
                className="lowercase"
                key={operator.value}
                value={operator.value}
              >
                {operator.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onFilterInputRender({
          filter,
          column,
          inputId,
          onFilterUpdate,
          showValueSelector,
          setShowValueSelector,
        })}
        <Button
          aria-controls={filterItemId}
          className="h-full rounded-none rounded-r-md border border-l-0 px-1.5 font-normal dark:bg-input/30"
          onClick={() => onFilterRemove(filter.filterId)}
          size="sm"
          variant="ghost"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }
}

type FilterValueSelectorProps<TData> = {
  column: Column<TData>;
  value: string;
  onSelect: (value: string) => void;
};

function FilterValueSelector<TData>({
  column,
  value,
  onSelect,
}: FilterValueSelectorProps<TData>) {
  const variant = column.columnDef.meta?.variant ?? "text";

  switch (variant) {
    case "boolean":
      return (
        <CommandGroup>
          <CommandItem onSelect={() => onSelect("true")} value="true">
            True
          </CommandItem>
          <CommandItem onSelect={() => onSelect("false")} value="false">
            False
          </CommandItem>
        </CommandGroup>
      );

    case "select":
    case "multiSelect":
      return (
        <CommandGroup>
          {column.columnDef.meta?.options?.map((option) => (
            <CommandItem
              key={option.value}
              onSelect={() => onSelect(option.value)}
              value={option.value}
            >
              {option.icon && <option.icon />}
              <span className="truncate">{option.label}</span>
              {option.count && (
                <span className="ml-auto font-mono text-xs">
                  {option.count}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      );

    case "date":
    case "dateRange":
      return (
        <Calendar
          captionLayout="dropdown"
          mode="single"
          onSelect={(date) => onSelect(date?.getTime().toString() ?? "")}
          selected={value ? new Date(value) : undefined}
        />
      );

    default: {
      const isEmpty = !value.trim();

      return (
        <CommandGroup>
          <CommandItem
            disabled={isEmpty}
            onSelect={() => onSelect(value)}
            value={value}
          >
            {isEmpty ? (
              <>
                <Text />
                <span>Type to add filter...</span>
              </>
            ) : (
              <>
                <BadgeCheck />
                <span className="truncate">Filter by &quot;{value}&quot;</span>
              </>
            )}
          </CommandItem>
        </CommandGroup>
      );
    }
  }
}

function onFilterInputRender<TData>({
  filter,
  column,
  inputId,
  onFilterUpdate,
  showValueSelector,
  setShowValueSelector,
}: {
  filter: ExtendedColumnFilter<TData>;
  column: Column<TData>;
  inputId: string;
  onFilterUpdate: (
    filterId: string,
    updates: Partial<Omit<ExtendedColumnFilter<TData>, "filterId">>
  ) => void;
  showValueSelector: boolean;
  setShowValueSelector: (value: boolean) => void;
}) {
  if (filter.operator === "isEmpty" || filter.operator === "isNotEmpty") {
    return (
      // biome-ignore lint/a11y/useSemanticElements: false positive
      <div
        aria-label={`${column.columnDef.meta?.label} filter is ${
          filter.operator === "isEmpty" ? "empty" : "not empty"
        }`}
        aria-live="polite"
        className="h-full w-16 rounded-none border bg-transparent px-1.5 py-0.5 text-muted-foreground dark:bg-input/30"
        id={inputId}
        role="status"
      />
    );
  }

  switch (filter.variant) {
    case "text":
    case "number":
    case "range": {
      if (
        (filter.variant === "range" && filter.operator === "isBetween") ||
        filter.operator === "isBetween"
      ) {
        return (
          <DataTableRangeFilter
            className="size-full max-w-28 gap-0 [&_[data-slot='range-min']]:border-r-0 [&_input]:rounded-none [&_input]:px-1.5"
            column={column}
            filter={filter}
            inputId={inputId}
            onFilterUpdate={onFilterUpdate}
          />
        );
      }

      const isNumber =
        filter.variant === "number" || filter.variant === "range";

      return (
        <Input
          className="h-full w-24 rounded-none px-1.5"
          defaultValue={typeof filter.value === "string" ? filter.value : ""}
          id={inputId}
          inputMode={isNumber ? "numeric" : undefined}
          onChange={(event) =>
            onFilterUpdate(filter.filterId, { value: event.target.value })
          }
          placeholder={column.columnDef.meta?.placeholder ?? "Enter value..."}
          type={isNumber ? "number" : "text"}
        />
      );
    }

    case "boolean": {
      const inputListboxId = `${inputId}-listbox`;

      return (
        <Select
          onOpenChange={setShowValueSelector}
          onValueChange={(value: "true" | "false") =>
            onFilterUpdate(filter.filterId, { value })
          }
          open={showValueSelector}
          value={typeof filter.value === "string" ? filter.value : "true"}
        >
          <SelectTrigger
            aria-controls={inputListboxId}
            className="rounded-none bg-transparent px-1.5 py-0.5 [&_svg]:hidden"
            id={inputId}
          >
            <SelectValue placeholder={filter.value ? "True" : "False"} />
          </SelectTrigger>
          <SelectContent id={inputListboxId}>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    case "select":
    case "multiSelect": {
      const inputListboxId = `${inputId}-listbox`;

      const options = column.columnDef.meta?.options ?? [];
      const selectedValues = Array.isArray(filter.value)
        ? filter.value
        : [filter.value];

      const selectedOptions = options.filter((option) =>
        selectedValues.includes(option.value)
      );

      return (
        <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
          <PopoverTrigger asChild>
            <Button
              aria-controls={inputListboxId}
              className="h-full min-w-16 rounded-none border px-1.5 font-normal dark:bg-input/30"
              id={inputId}
              size="sm"
              variant="ghost"
            >
              {selectedOptions.length === 0 ? (
                filter.variant === "multiSelect" ? (
                  "Select options..."
                ) : (
                  "Select option..."
                )
              ) : (
                <>
                  <div className="-space-x-2 flex items-center rtl:space-x-reverse">
                    {selectedOptions.map((selectedOption) =>
                      selectedOption.icon ? (
                        <div
                          className="rounded-full border bg-background p-0.5"
                          key={selectedOption.value}
                        >
                          <selectedOption.icon className="size-3.5" />
                        </div>
                      ) : null
                    )}
                  </div>
                  <span className="truncate">
                    {selectedOptions.length > 1
                      ? `${selectedOptions.length} selected`
                      : selectedOptions[0]?.label}
                  </span>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-48 origin-[var(--radix-popover-content-transform-origin)] p-0"
            id={inputListboxId}
          >
            <Command>
              <CommandInput placeholder="Search options..." value={""} />
              <CommandList>
                <CommandEmpty>No options found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        const value =
                          filter.variant === "multiSelect"
                            ? selectedValues.includes(option.value)
                              ? selectedValues.filter((v) => v !== option.value)
                              : [...selectedValues, option.value]
                            : option.value;
                        onFilterUpdate(filter.filterId, { value });
                      }}
                      value={option.value}
                    >
                      {option.icon && <option.icon />}
                      <span className="truncate">{option.label}</span>
                      {filter.variant === "multiSelect" && (
                        <Check
                          className={cn(
                            "ml-auto",
                            selectedValues.includes(option.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    case "date":
    case "dateRange": {
      const inputListboxId = `${inputId}-listbox`;

      const dateValue = Array.isArray(filter.value)
        ? filter.value.filter(Boolean)
        : [filter.value, filter.value].filter(Boolean);

      const displayValue =
        filter.operator === "isBetween" && dateValue.length === 2
          ? `${formatDate(new Date(Number(dateValue[0])))} - ${formatDate(
              new Date(Number(dateValue[1]))
            )}`
          : dateValue[0]
            ? formatDate(new Date(Number(dateValue[0])))
            : "Pick date...";

      return (
        <Popover onOpenChange={setShowValueSelector} open={showValueSelector}>
          <PopoverTrigger asChild>
            <Button
              aria-controls={inputListboxId}
              className={cn(
                "h-full rounded-none border px-1.5 font-normal dark:bg-input/30",
                !filter.value && "text-muted-foreground"
              )}
              id={inputId}
              size="sm"
              variant="ghost"
            >
              <CalendarIcon className="size-3.5" />
              <span className="truncate">{displayValue}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-auto origin-[var(--radix-popover-content-transform-origin)] p-0"
            id={inputListboxId}
          >
            {filter.operator === "isBetween" ? (
              <Calendar
                captionLayout="dropdown"
                mode="range"
                onSelect={(date) => {
                  onFilterUpdate(filter.filterId, {
                    value: date
                      ? [
                          (date.from?.getTime() ?? "").toString(),
                          (date.to?.getTime() ?? "").toString(),
                        ]
                      : [],
                  });
                }}
                selected={
                  dateValue.length === 2
                    ? {
                        from: new Date(Number(dateValue[0])),
                        to: new Date(Number(dateValue[1])),
                      }
                    : {
                        from: new Date(),
                        to: new Date(),
                      }
                }
              />
            ) : (
              <Calendar
                captionLayout="dropdown"
                mode="single"
                onSelect={(date) => {
                  onFilterUpdate(filter.filterId, {
                    value: (date?.getTime() ?? "").toString(),
                  });
                }}
                selected={
                  dateValue[0] ? new Date(Number(dateValue[0])) : undefined
                }
              />
            )}
          </PopoverContent>
        </Popover>
      );
    }

    default:
      return null;
  }
}
