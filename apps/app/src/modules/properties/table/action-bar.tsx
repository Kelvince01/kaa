import { Button } from "@kaa/ui/components/button";
import { Input } from "@kaa/ui/components/input";
// import { DataTableToolbarActions } from "@/components/ui/data-table/data-table-toolbar-actions";
import type { Table } from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";
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
        <Button className="h-8" onClick={onAddProperty} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>
    </div>
  );
}
