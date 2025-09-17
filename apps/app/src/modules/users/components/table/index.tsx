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
import { useUsers } from "../../user.queries";
import type { User, UserStatus } from "../../user.type";
import { DeleteUsersDialog } from "../delete-users-dialog";
import { UsersTableActionBar } from "./action-bar";
import { getUsersTableColumns } from "./columns";
import { UsersTableToolbarActions } from "./toolbar-actions";

type UsersTableProps = {
  /**
   * Search parameters for filtering and pagination
   * @example { status: 'active', page: 1, perPage: 10 }
   */
  params: Promise<SearchParams>;
};

/**
 * UsersTable component that displays a data table of users with sorting, filtering, and pagination.
 *
 * @component
 * @param {UsersTableProps} props - The component props
 * @param {Promise<SearchParams>} props.params - Search parameters for filtering and pagination
 * @returns {JSX.Element} The rendered users table
 *
 * @example
 * // Basic usage
 * <UsersTable params={Promise.resolve({ status: 'active', page: 1, perPage: 10 })} />
 */
function UsersTable({ params }: UsersTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const searchParams = React.use(params);
  // Parse search params directly since we don't have searchParamsCache
  const search = {
    status: searchParams.status as UserStatus,
    page: Number(searchParams.page) || 1,
    perPage: Number(searchParams.perPage) || 10,
  };

  // Initialize validFilters as an empty array since we're not using filters yet
  const validFilters: any[] = [];

  const { data, isLoading } = useUsers({
    // status: search.status as UserStatus,
    page: search.page,
    limit: search.perPage,
    // filters: validFilters,
  });

  // Mock status counts for now - replace with actual API call if needed
  const statusCounts = { data: {} };

  const [rowAction, setRowAction] = React.useState<
    | (DataTableRowAction<User> & {
        type?: "view" | "edit" | "delete";
        item?: User;
      })
    | null
  >(null);

  const columns = React.useMemo(
    () =>
      getUsersTableColumns({
        statusCounts: (statusCounts?.data as any) || {},
        setRowAction,
      }),
    []
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.users || [],
    columns,
    pageCount: Math.ceil(
      (data?.pagination?.total || 0) / (search.perPage || 10)
    ),
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  // Handle row actions (view, edit, delete)
  React.useEffect(() => {
    if (!rowAction?.type) return;

    switch (rowAction.type) {
      case "view":
        // Handle view action
        console.log("View user:", rowAction.item);
        break;
      case "edit":
        // Handle edit action
        console.log("Edit user:", rowAction.item);
        break;
      case "delete":
        // Delete action is handled by the DeleteUsersDialog
        break;
      default:
        break;
    }
  }, [rowAction]);

  // if (!data?.length) {
  //   if (
  //     query?.length ||
  //     Object.values(filter).some((value) => value !== null)
  //   ) {
  //     return <NoResults />;
  //   }

  //   return <EmptyState />;
  // }

  return (
    <>
      <DataTable
        actionBar={<UsersTableActionBar table={table} />}
        table={table}
        // {...({ isLoading } as unknown as DataTableProps<User>)}
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
            <UsersTableToolbarActions table={table} />
          </DataTableToolbar>
        )}
      </DataTable>

      {/* Row action dialogs */}
      {rowAction?.type === "delete" && rowAction.item && (
        <DeleteUsersDialog
          onOpenChange={(open: boolean) => !open && setRowAction(null)}
          onSuccess={() => {
            setRowAction(null);
            // Optionally refresh the table data here
            // table.resetRowSelection();
          }}
          open={true}
          users={[rowAction.item]}
        />
      )}
    </>
  );
}

export { UsersTable };
