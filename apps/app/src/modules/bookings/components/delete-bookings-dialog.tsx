"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@kaa/ui/components/alert-dialog";
import { Button } from "@kaa/ui/components/button";
import { Loader, Trash } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useDeleteBookings } from "../booking.mutations";
import type { Booking } from "../booking.type";

interface DeleteBookingsDialogProps
  extends React.ComponentPropsWithRef<typeof AlertDialog> {
  bookings: Booking[];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeleteBookingsDialog({
  bookings,
  showTrigger = true,
  onSuccess,
  ...props
}: DeleteBookingsDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const deleteBookingsMutation = useDeleteBookings();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBookingsMutation.mutateAsync(
          bookings.map((booking) => booking._id)
        );
        props.onOpenChange?.(false);
        toast.success(
          `Successfully deleted ${bookings.length} ${bookings.length === 1 ? "booking" : "bookings"}`
        );
        onSuccess?.();
      } catch (error) {
        toast.error("Failed to delete bookings");
      }
    });
  };

  return (
    <AlertDialog {...props}>
      {showTrigger && (
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <Trash className="mr-2 h-4 w-4" />
            Delete{" "}
            {bookings.length === 1 ? "Booking" : `${bookings.length} Bookings`}
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete{" "}
            {bookings.length === 1 ? "booking" : `${bookings.length} bookings`}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {bookings.length === 1
              ? "This action cannot be undone. This will permanently delete the booking and remove all associated data."
              : `This action cannot be undone. This will permanently delete ${bookings.length} bookings and remove all associated data.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            Delete {bookings.length === 1 ? "Booking" : "Bookings"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
