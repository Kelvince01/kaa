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
import { DeleteMembersDialog } from "../components/delete-members-dialog";
import { MemberStatsDialog } from "../components/member-stats-dialog";
import { UpdateMemberSheet } from "../components/update-member-sheet";
import { useMembers } from "../member.queries";
import type { Member } from "../member.type";
import { MembersTableActionBar } from "./action-bar";
import { getMembersTableColumns } from "./columns";
import { MembersTableToolbarActions } from "./toolbar-actions";

type MembersTableProps = {
  params: Promise<{
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    organization?: string;
  }>;
};

export function MembersTable({ params: paramsPromise }: MembersTableProps) {
  const params = use(paramsPromise);
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const { data, isLoading } = useMembers(params);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Member> | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = React.useState(false);
  const [selectedMemberForStats, setSelectedMemberForStats] =
    React.useState<Member | null>(null);

  const handleViewStats = React.useCallback((member: Member) => {
    setSelectedMemberForStats(member);
    setStatsDialogOpen(true);
  }, []);

  const columns = React.useMemo(
    () =>
      getMembersTableColumns({
        setRowAction,
        onViewStats: handleViewStats,
      }),
    [handleViewStats]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.members ?? [],
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
        actionBar={<MembersTableActionBar table={table} />}
        table={table}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <MembersTableToolbarActions table={table} />
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
            <MembersTableToolbarActions table={table} />
            <DataTableSortList align="end" table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
      <UpdateMemberSheet
        member={rowAction?.row?.original ?? null}
        onOpenChange={() => setRowAction(null)}
        open={rowAction?.variant === "update"}
      />
      <DeleteMembersDialog
        members={rowAction?.row?.original ? [rowAction?.row.original] : []}
        onOpenChange={() => setRowAction(null)}
        onSuccess={() => rowAction?.row?.toggleSelected(false)}
        open={rowAction?.variant === "delete"}
        showTrigger={false}
      />
      <MemberStatsDialog
        member={selectedMemberForStats}
        onOpenChange={(open) => {
          setStatsDialogOpen(open);
          if (!open) {
            setSelectedMemberForStats(null);
          }
        }}
        open={statsDialogOpen}
      />
    </>
  );
}
