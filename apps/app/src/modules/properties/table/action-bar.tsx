import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { Input } from "@kaa/ui/components/input";
// import { DataTableToolbarActions } from "@/components/ui/data-table/data-table-toolbar-actions";
import type { Table } from "@tanstack/react-table";
import { ChevronDown, Plus, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DataTableExportButton } from "@/components/ui/data-table/data-table-export-button";
import { DataTableFilterToggle } from "@/components/ui/data-table/data-table-filter-toggle";
// import { DataTableAdvancedFilter } from "@/components/ui/data-table/data-table-advanced-filter";
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options";

type PropertiesTableActionBarProps<TData> = {
  table: Table<TData>;
  onAddProperty?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
};

export function PropertiesTableActionBar<TData>({
  table,
  onAddProperty,
  onExport,
  onFilter,
  onSearch,
  searchPlaceholder = "Search properties...",
}: PropertiesTableActionBarProps<TData>) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="flex w-full items-center justify-between space-x-4 overflow-auto p-1">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            type="search"
            value={searchQuery}
          />
        </div>
        <DataTableFilterToggle
          /* pass true if there are active filters */
          // isFiltered={}
          onClearFilters={onFilter}
        />
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        <DataTableExportButton onExport={onExport} />

        {/* Add Property Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
              <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Choose Form Version</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onAddProperty}>
              <Plus className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Quick Form (Sheet)</span>
                <span className="text-muted-foreground text-xs">
                  Inline quick entry
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/properties/new-v4")}
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-medium">Enhanced Form (V4)</span>
                <span className="text-muted-foreground text-xs">
                  Full wizard with validation
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
