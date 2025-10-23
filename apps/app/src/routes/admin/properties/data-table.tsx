"use client";

import { Button } from "@kaa/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kaa/ui/components/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kaa/ui/components/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import type { Property } from "@/modules/properties/property.type";
import { DeletePropertyModal } from "./delete-modal";
import { ToggleFeaturedModal } from "./feature-modal";
import { Pagination } from "./pagination";
import { PropertyTableSkeleton } from "./skeleton";

export function PropertyDataTable({
  data,
  columns,
  isLoading,
  currentPage,
  totalPages,
  setCurrentPage,
  onDelete,
  onToggleFeatured,
  onVerify,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  isFeaturedModalOpen,
  setIsFeaturedModalOpen,
  selectedProperty,
  confirmDelete,
  confirmToggleFeatured,
}: {
  data: Property[];
  columns: ColumnDef<Property>[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  onDelete: (property: Property) => void;
  onToggleFeatured: (property: Property) => void;
  onVerify: (propertyId: string, isVerified: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  isFeaturedModalOpen: boolean;
  setIsFeaturedModalOpen: (isOpen: boolean) => void;
  selectedProperty: Property | null;
  confirmDelete: () => void;
  confirmToggleFeatured: () => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <PropertyTableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 font-semibold text-lg">No properties found</h3>
          <p className="mt-2 mb-4 text-muted-foreground text-sm">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="h-8 w-8 p-0" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/properties/${row.original._id}`,
                            "_blank"
                          )
                        }
                      >
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onVerify(row.original._id, !row.original.verified)
                        }
                      >
                        {row.original.verified ? "Unverify" : "Verify"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onToggleFeatured(row.original)}
                      >
                        {row.original.featured ? "Unfeature" : "Feature"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(row.original)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      )}

      <DeletePropertyModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      <ToggleFeaturedModal
        isOpen={isFeaturedModalOpen}
        onClose={() => setIsFeaturedModalOpen(false)}
        onConfirm={confirmToggleFeatured}
        property={selectedProperty as Property}
      />
    </div>
  );
}
