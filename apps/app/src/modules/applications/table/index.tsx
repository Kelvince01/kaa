"use client";

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
import type { SearchParams } from "@/shared/types";
import type { DataTableRowAction } from "@/shared/types/data-table";
import {
  useApplicationEstimatedOfferAmount,
  useApplicationStatusCounts,
  useApplications,
} from "../application.queries";
import { searchParamsCache } from "../application.schema";
import type { Application } from "../application.type";
import { DeleteApplicationsDialog } from "../components/delete-applications-dialog";
import { UpdateApplicationSheet } from "../components/update-application-sheet";
import { ApplicationsTableActionBar } from "./action-bar";
import { getApplicationsTableColumns } from "./columns";

type ApplicationsTableProps = {
  params: Promise<SearchParams>;
};

export function ApplicationsTable({ params }: ApplicationsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const searchParams = React.use(params);
  const search = searchParamsCache.parse(searchParams);

  const validFilters = getValidFilters(search.filters);

  const { data } = useApplications({
    // status: search.status,
    page: search.page,
    limit: search.perPage,
  });

  // {
  // 	...search,
  // 	filters: validFilters,
  // }

  const { data: statusCounts } = useApplicationStatusCounts();
  const { data: estimatedOfferAmount } = useApplicationEstimatedOfferAmount();

  console.log(statusCounts);
  console.log(estimatedOfferAmount);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Application> | null>(null);

  const columns = React.useMemo(
    () =>
      getApplicationsTableColumns({
        statusCounts: statusCounts?.data as Record<
          Application["status"],
          number
        >,
        estimatedOfferAmount: estimatedOfferAmount?.data as {
          min: number;
          max: number;
        },
        setRowAction,
      }),
    [statusCounts?.data, estimatedOfferAmount?.data]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.items ?? [],
    columns,
    pageCount: data?.pagination.page ?? 1,
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
        actionBar={<ApplicationsTableActionBar table={table} />}
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
                debounceMs={debounceMs}
                shallow={shallow}
                table={table}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList align="end" table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
      <UpdateApplicationSheet
        application={rowAction?.row?.original ?? null}
        onOpenChange={() => setRowAction(null)}
        open={rowAction?.variant === "update"}
      />
      <DeleteApplicationsDialog
        applications={rowAction?.row?.original ? [rowAction?.row.original] : []}
        onOpenChange={() => setRowAction(null)}
        onSuccess={() => rowAction?.row?.toggleSelected(false)}
        open={rowAction?.variant === "delete"}
        showTrigger={false}
      />
    </>
  );
}
