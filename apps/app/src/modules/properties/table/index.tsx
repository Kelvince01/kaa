"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/ui/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/ui/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/ui/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/ui/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useFeatureFlags } from "@/components/ui/data-table/feature-flags-provider";
import { useDataTable } from "@/hooks/use-data-table";
import { getValidFilters } from "@/lib/data-table";
import { searchParamsCache } from "@/modules/applications/application.schema";
import type { SearchParams } from "@/shared/types";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { PropertyFormSheet } from "../components/property-form-sheet";
import { PropertyViewSheet } from "../components/property-view-sheet";
import { useProperties } from "../property.queries";
import type { Property } from "../property.type";
import { PropertiesTableActionBar } from "./action-bar";
import { getPropertiesTableColumns } from "./columns";

export const propertyStatusOptions = [
  { label: "Available", value: "available" },
  { label: "Rented", value: "rented" },
  { label: "Sold", value: "sold" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" },
];

type PropertiesTableProps = {
  params: Promise<SearchParams>;
};

export function PropertiesTable({ params }: PropertiesTableProps) {
  const router = useRouter();
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const searchParams = React.use(params);
  const search = searchParamsCache.parse(searchParams);
  const validFilters = getValidFilters(search.filters);

  // Fetch properties data
  const { data, isLoading } = useProperties({
    // status: search.status as any,
    page: search.page,
    limit: search.perPage,
    // ...validFilters,
  });

  console.log(data);

  // State for row actions
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Property> | null>(null);

  // Get table columns
  const columns = React.useMemo(
    () =>
      getPropertiesTableColumns({
        setRowAction,
      }),
    []
  );

  // Initialize data table
  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.properties || [],
    columns,
    pageCount: data?.pagination.pages || 0,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  // Handle property form submission
  const handlePropertySaved = () => {
    setRowAction(null);
    router.refresh();
  };

  // Handle property view/close
  const handleViewClose = () => {
    setRowAction(null);
  };

  // Handle add new property
  const handleAddProperty = () => {
    setRowAction({ variant: "create", row: null });
  };

  // Handle export
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting properties...");
  };

  // Handle search
  const handleSearch = (query: string) => {
    // TODO: Implement search functionality
    console.log("Searching for:", query);
  };

  return (
    <div className="space-y-4">
      <DataTable
        actionBar={
          <PropertiesTableActionBar
            onAddProperty={handleAddProperty}
            onExport={handleExport}
            onSearch={handleSearch}
            searchPlaceholder="Search properties..."
            table={table}
          />
        }
        table={table}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList align="start" table={table} />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                align="start"
                debounceMs={debounceMs}
                shallow={shallow}
                table={table}
                throttleMs={throttleMs}
              />
            ) : (
              <DataTableFilterMenu
                align="start"
                debounceMs={debounceMs}
                shallow={shallow}
                table={table}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} />
            <DataTableFilterMenu
              debounceMs={debounceMs}
              shallow={shallow}
              table={table}
              throttleMs={throttleMs}
            />
          </DataTableToolbar>
        )}
      </DataTable>

      {/* Property Form Sheet */}
      {rowAction?.variant === "create" || rowAction?.variant === "update" ? (
        <PropertyFormSheet
          onOpenChange={(open: any) => !open && setRowAction(null)}
          onSuccess={handlePropertySaved}
          open={true}
          property={
            rowAction?.variant === "update"
              ? rowAction.row?.original
              : undefined
          }
        />
      ) : null}

      {/* Property View Sheet */}
      {rowAction?.variant === "view" ? (
        <PropertyViewSheet
          onEdit={() => setRowAction({ variant: "update", row: rowAction.row })}
          onOpenChange={(open: any) => !open && setRowAction(null)}
          open={true}
          property={rowAction.row?.original as Property}
        />
      ) : null}
    </div>
  );
}
