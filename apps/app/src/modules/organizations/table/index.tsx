"use client";

import * as React from "react";
import { use } from "react";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/ui/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/ui/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/ui/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/ui/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useFeatureFlags } from "@/components/ui/data-table/feature-flags-provider";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { DeleteOrganizationsDialog } from "../components/delete-organizations-dialog";
import { UpdateOrganizationSheet } from "../components/update-organization-sheet";
import { useOrganizations } from "../organization.queries";
import type { Organization, OrganizationFilters } from "../organization.type";
import { OrganizationsTableActionBar } from "./action-bar";
import { getOrganizationsTableColumns } from "./columns";
import { OrganizationsTableToolbarActions } from "./toolbar-actions";

type OrganizationsTableProps = {
  filters: Promise<OrganizationFilters>;
};

export function OrganizationsTable({
  filters: filtersPromise,
}: OrganizationsTableProps) {
  const filters = use(filtersPromise);

  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, isLoading } = useOrganizations(filters);

  console.log(data);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Organization> | null>(null);

  const columns = React.useMemo(
    () =>
      getOrganizationsTableColumns({
        setRowAction,
      }),
    []
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.pages ?? 1,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <>
      <DataTable
        actionBar={<OrganizationsTableActionBar table={table} />}
        table={table}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <OrganizationsTableToolbarActions table={table} />
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
                debounceMs={debounceMs}
                shallow={shallow}
                table={table}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <OrganizationsTableToolbarActions table={table} />
            <DataTableSortList align="end" table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
      <UpdateOrganizationSheet
        onOpenChange={() => setRowAction(null)}
        open={rowAction?.variant === "update"}
        organization={rowAction?.row?.original ?? null}
      />
      <DeleteOrganizationsDialog
        onOpenChange={() => setRowAction(null)}
        onSuccess={() => rowAction?.row?.toggleSelected(false)}
        open={rowAction?.variant === "delete"}
        organizations={
          rowAction?.row?.original ? [rowAction?.row.original] : []
        }
        showTrigger={false}
      />
    </>
  );
}
