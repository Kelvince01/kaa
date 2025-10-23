"use client";

import * as React from "react";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/shared/types/data-table";
import type { Tenant } from "../tenant.type";
import { getTenantsTableColumns } from "./columns";

type TenantsTableProps = {
  data: Tenant[];
  onCreate: () => void;
  onDelete: (ids: string[]) => void;
  pageCount: number;
};

export function TenantsTable({ data, pageCount }: TenantsTableProps) {
  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Tenant> | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<Tenant[]>([]);

  // 计算状态计数
  const statusCounts = React.useMemo(() => {
    const counts = {} as Record<Tenant["status"], number>;
    for (const tenant of data) {
      counts[tenant.status] = (counts[tenant.status] || 0) + 1;
    }
    return counts;
  }, [data]);

  const columns = React.useMemo(
    () =>
      getTenantsTableColumns({
        statusCounts,
        setRowAction,
      }),
    [statusCounts]
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data as Tenant[],
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        // selectedRows={selectedRows.length}
        // actionBar={<TenantsTableActionBar selectedRows={selectedRows} onDelete={onDelete} />}
        // toolbarActions={<TenantsTableToolbarActions onCreate={onCreate} />}
      />
      <DataTable
        table={table}
        // data={data}
        // rowAction={rowAction}
        // onRowActionChange={setRowAction}
        // onSelectedRowsChange={setSelectedRows}
        // onDeleteRows={onDelete}
      />
    </div>
  );
}
