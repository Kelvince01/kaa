"use client";

import { Button } from "@kaa/ui/components/button";
import type { Table } from "@tanstack/react-table";
import { Check, Download, Trash, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { exportTableToCSV } from "@/lib/export";
import {
  useCancelBooking,
  useConfirmBooking,
  useDeleteBookings,
} from "../booking.mutations";
import type { Booking } from "../booking.type";

interface BookingsTableActionBarProps {
  table: Table<Booking>;
}

export function BookingsTableActionBar({ table }: BookingsTableActionBarProps) {
  const t = useTranslations();
  const confirmBookingMutation = useConfirmBooking();
  const deleteBookingsMutation = useDeleteBookings();
  const cancelBookingMutation = useCancelBooking();

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedBookings = selectedRows.map((row) => row.original);

  const handleExport = () => {
    const data =
      selectedBookings.length > 0
        ? selectedBookings
        : table.getFilteredRowModel().rows.map((row) => row.original);

    const csvData = data.map((booking) => ({
      "Booking ID": booking._id,
      Type: booking.type,
      Property: booking.property?.title || "Unknown",
      Tenant:
        `${booking.tenant?.firstName || ""} ${booking.tenant?.lastName || ""}`.trim() ||
        "Unknown",
      Email: booking.tenant?.email || "",
      Date: booking.date,
      Time: booking.time,
      Status: booking.status,
      Amount: booking.totalAmount || "",
      Created: booking.createdAt,
      Notes: booking.notes || "",
    }));

    exportTableToCSV(table, {
      filename: "bookings",
      // data: csvData
    });
    toast.success(`Exported ${csvData.length} bookings`);
  };

  const handleBulkConfirm = async () => {
    const pendingBookings = selectedBookings.filter(
      (booking) => booking.status === "pending"
    );

    if (pendingBookings.length === 0) {
      toast.error("No pending bookings selected");
      return;
    }

    try {
      for (const booking of pendingBookings) {
        await confirmBookingMutation.mutateAsync({ id: booking._id });
      }
      toast.success(`Confirmed ${pendingBookings.length} bookings`);
      table.toggleAllRowsSelected(false);
    } catch (error) {
      toast.error("Failed to confirm bookings");
    }
  };

  const handleBulkCancel = async () => {
    const cancellableBookings = selectedBookings.filter(
      (booking) =>
        booking.status === "pending" || booking.status === "confirmed"
    );

    if (cancellableBookings.length === 0) {
      toast.error("No cancellable bookings selected");
      return;
    }

    try {
      for (const booking of cancellableBookings) {
        await cancelBookingMutation.mutateAsync({
          id: booking._id,
          reason: "Bulk cancellation",
        });
      }
      toast.success(`Cancelled ${cancellableBookings.length} bookings`);
      table.toggleAllRowsSelected(false);
    } catch (error) {
      toast.error("Failed to cancel bookings");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) {
      toast.error("No bookings selected");
      return;
    }

    try {
      await deleteBookingsMutation.mutateAsync(
        selectedBookings.map((booking) => booking._id)
      );
      toast.success(`Deleted ${selectedBookings.length} bookings`);
      table.toggleAllRowsSelected(false);
    } catch (error) {
      toast.error("Failed to delete bookings");
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-2 overflow-auto p-1">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">
          {selectedRows.length} of {table.getFilteredRowModel().rows.length}{" "}
          row(s) selected
        </span>
      </div>
      <div className="flex items-center gap-2">
        {selectedRows.length > 0 && (
          <>
            <Button
              className="h-8"
              disabled={confirmBookingMutation.isPending}
              onClick={handleBulkConfirm}
              size="sm"
              variant="outline"
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Selected
            </Button>
            <Button
              className="h-8"
              disabled={cancelBookingMutation.isPending}
              onClick={handleBulkCancel}
              size="sm"
              variant="outline"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Selected
            </Button>
            <Button
              className="h-8"
              disabled={deleteBookingsMutation.isPending}
              onClick={handleBulkDelete}
              size="sm"
              variant="destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </>
        )}
        <Button
          className="h-8"
          onClick={handleExport}
          size="sm"
          variant="outline"
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
