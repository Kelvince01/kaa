import { config } from "@kaa/config";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Checkbox } from "@kaa/ui/components/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import { SpinnerV2 } from "@kaa/ui/components/spinner";
import type { ColumnDef } from "@tanstack/react-table";
import { CopyCheckIcon, CopyIcon, Download, Ellipsis } from "lucide-react";
import Link from "next/link";
import useDownloader from "react-use-downloader";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import type { DataTableRowAction } from "@/shared/types/data-table";
import { dateShort } from "@/shared/utils/date-short";
import type { FileType } from "../file.type";
import { removeFileExtension } from "../file.utils";
import AttachmentThumb from "../upload/attachment-thumb";
import { formatBytes } from "./helpers";

type GetFilesTableColumnsProps = {
  setRowAction: React.Dispatch<
    React.SetStateAction<DataTableRowAction<FileType> | null>
  >;
};

export function getFilesTableColumns({
  setRowAction,
}: GetFilesTableColumnsProps): ColumnDef<FileType>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all"
          checked={table.getIsAllPageRowsSelected()}
          className="translate-y-[2px] cursor-pointer"
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          className="translate-y-[2px] cursor-pointer"
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "thumbnail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Thumbnail" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <Link
            className="group flex h-full w-full items-center justify-center space-x-2 outline-0 ring-0"
            href={`${file.url}`}
          >
            {file.url ? (
              <AttachmentThumb
                contentType={file.mimeType}
                name={file.name}
                url={file.url}
              />
            ) : (
              <div>-</div>
            )}
          </Link>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <span className="truncate font-light underline-offset-4 group-hover:underline">
            {removeFileExtension(file.name) || (
              <span className="text-muted">-</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "url",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="URL" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        const { copyToClipboard, copied } = useCopyToClipboard();
        // const isInCloud = file.url.startsWith(config.publicCDNUrl);
        // if (!isInCloud)
        //   return <div className="w-full text-center text-muted">-</div>;

        const shareLink = `${config.backendUrl}/${file._id}/files/${row.id}/link`; // TODO: get organizationId from row

        return (
          <div className="flex items-center justify-center">
            <Button
              aria-label="Copy"
              className="h-full w-auto"
              data-tooltip="true"
              data-tooltip-content={copied ? "Copied" : "Copy"}
              onClick={() => copyToClipboard(shareLink)}
              size="icon"
              tabIndex={0}
              variant="cell"
            >
              {copied ? <CopyCheckIcon size={16} /> : <CopyIcon size={16} />}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "download",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Download" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        const { download, isInProgress } = useDownloader();
        // if (!file.url.startsWith(config.publicCDNUrl))
        //   return <div className="w-full text-center text-muted">-</div>;

        return (
          <div className="flex items-center justify-center">
            <Button
              aria-label="Download"
              className="h-full w-auto"
              data-tooltip="true"
              data-tooltip-content={"Download"}
              disabled={isInProgress}
              onClick={() => download(file.url, file.name)}
              size="icon"
              tabIndex={0}
              variant="cell"
            >
              {isInProgress ? (
                <SpinnerV2 className="h-4 w-4 text-muted" />
              ) : (
                <Download size={16} />
              )}
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "mimeType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mime Type" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="font-light">
            <Badge className="w-fit" variant="outline">
              {file.mimeType || <span className="text-muted">-</span>}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="group relative inline-flex h-full w-full items-center gap-1 font-light opacity-50">
            {formatBytes(file.size.toString())}
          </div>
        );
      },
    },
    {
      header: "Created at",
      accessorKey: "createdAt",
      cell: ({ row }) => {
        if (row.original.createdAt) {
          return <span>{dateShort(row.original.createdAt)}</span>;
        }

        return <span className="text-muted">-</span>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const file = row.original;

        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                  variant="ghost"
                >
                  <Ellipsis className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  onClick={() => {
                    setRowAction({ row, variant: "view" });
                  }}
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRowAction({ row, variant: "update" })}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() =>
                    setRowAction({
                      row,
                      variant: "delete",
                    })
                  }
                >
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
