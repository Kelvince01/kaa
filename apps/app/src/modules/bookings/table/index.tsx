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
import type { SearchParams } from "@/shared/types";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { useBookings } from "../booking.queries";
import {
  type BookingsSearchParams,
  searchParamsCache,
} from "../booking.schema";
import type { Booking } from "../booking.type";
import { BookingDetailSheet } from "../components/booking-detail-sheet";
import { CreateBookingSheet } from "../components/create-booking-sheet";
import { DeleteBookingsDialog } from "../components/delete-bookings-dialog";
import { UpdateBookingSheet } from "../components/update-booking-sheet";
import { BookingsTableActionBar } from "./action-bar";
import { getBookingsTableColumns } from "./columns";

type BookingsTableProps = {
  params: Promise<SearchParams>;
};

export function BookingsTable({ params }: BookingsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const searchParams = React.use(params);
  const search = searchParamsCache.parse(searchParams) as BookingsSearchParams;

  const { data } = useBookings({
    page: search.page,
    limit: search.perPage,
    status: search.status,
    type: search.type,
    q: search.q,
    sort: search.sort,
    order: search.order,
    from: search.from,
    to: search.to,
    property: search.property,
    tenant: search.tenant,
  });

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Booking> | null>(null);

  const columns = React.useMemo(
    () => getBookingsTableColumns({ setRowAction }),
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
        actionBar={<BookingsTableActionBar table={table} />}
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
      <CreateBookingSheet />
      <UpdateBookingSheet
        booking={rowAction?.row?.original ?? null}
        onOpenChange={() => setRowAction(null)}
        open={rowAction?.variant === "update"}
      />
      <BookingDetailSheet
        booking={rowAction?.row?.original ?? null}
        onOpenChange={() => setRowAction(null)}
        open={rowAction?.variant === "view"}
      />
      <DeleteBookingsDialog
        bookings={rowAction?.row?.original ? [rowAction?.row.original] : []}
        onOpenChange={() => setRowAction(null)}
        onSuccess={() => rowAction?.row?.toggleSelected(false)}
        open={rowAction?.variant === "delete"}
        showTrigger={false}
      />
    </>
  );
}
