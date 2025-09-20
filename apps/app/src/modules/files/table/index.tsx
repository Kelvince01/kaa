"use client";

// import { Info } from "lucide-react";
// import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
// import { AlertWrap } from "@/components/common/alert-wrap";
import { dialog } from "@/components/common/dialoger/state";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/ui/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/ui/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "@/components/ui/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/ui/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useFeatureFlags } from "@/components/ui/data-table/feature-flags-provider";
import { useDataTable } from "@/hooks/use-data-table";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { useDeleteFile } from "../file.queries";
import type { FileType } from "../file.type";
// import { DeleteFilesDialog } from "./delete-files-dialog";
import { FilesTableActionBar } from "./action-bar";
import { getFilesTableColumns } from "./columns";
import RemoveFilesForm from "./remove-files-form";
import { FilesTableToolbarActions } from "./toolbar-actions";

type FilesTableProps = {
  /**
   * Search parameters for filtering and pagination
   * @example { status: 'active', page: 1, perPage: 10 }
   */
  files: FileType[];
  pageCount: number;
  onEdit?: (file: FileType) => void;
  onView?: (file: FileType) => void;
};

/**
 * UsersTable component that displays a data table of users with sorting, filtering, and pagination.
 *
 * @component
 * @param {FilesTableProps} props - The component props
 * @param {Promise<SearchParams>} props.params - Search parameters for filtering and pagination
 * @returns {JSX.Element} The rendered users table
 *
 * @example
 * // Basic usage
 * <FilesTable params={Promise.resolve({ status: 'active', page: 1, perPage: 10 })} />
 */
function FilesTable({ files, pageCount, onEdit, onView }: FilesTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { mutateAsync: deleteFile } = useDeleteFile();

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<FileType> | null>(null);

  const columns = React.useMemo(
    () =>
      getFilesTableColumns({
        setRowAction,
      }),
    []
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: files,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  });

  const handleDelete = async (file: FileType) => {
    try {
      setDeletingId(file._id);
      await deleteFile(file._id);
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const selectedFiles = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);

  const openRemoveDialog = () => {
    dialog(
      <RemoveFilesForm
        callback={() => table.toggleAllRowsSelected(false)}
        dialog
        files={selectedFiles}
        organizationId={""}
      />,
      {
        className: "max-w-xl",
        title: "Remove files",
        description: "Are you sure you want to remove these files?",
      }
    );
  };

  // Handle row actions (view, edit, delete)
  // biome-ignore lint/correctness/useExhaustiveDependencies: we need to open the remove dialog
  React.useEffect(() => {
    if (!rowAction?.variant) return;

    switch (rowAction.variant) {
      case "view":
        onView?.(rowAction.row?.original as FileType);
        break;
      case "update":
        onEdit?.(rowAction.row?.original as FileType);
        break;
      case "delete":
        openRemoveDialog();
        break;
      default:
        break;
    }
  }, [rowAction]);

  return (
    <DataTable actionBar={<FilesTableActionBar table={table} />} table={table}>
      {/* Explainer alert box */}
      {/* <AnimatePresence initial={false}>
        {!!files.length && (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            key="alert"
            style={{ overflow: "hidden" }}
            transition={{
              height: { duration: 0.3 },
              opacity: { delay: 0.6, duration: 0.2 },
            }}
          >
            <AlertWrap Icon={Info} id="edit_attachment" variant="plain">
              Double-click on a cell in the 'Name' column to edit an attachment
              name. Changes will be auto-saved.
            </AlertWrap>
          </motion.div>
        )}
      </AnimatePresence> */}

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
          <FilesTableToolbarActions table={table} />
        </DataTableToolbar>
      )}
    </DataTable>
  );
}

export { FilesTable };
