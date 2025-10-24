"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@kaa/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCancelBooking } from "../booking.mutations";
import {
  type CancelBookingSchema,
  cancelBookingSchema,
} from "../booking.schema";
import type { Booking } from "../booking.type";

interface CancelBookingDialogProps
  extends React.ComponentPropsWithRef<typeof Dialog> {
  booking: Booking;
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function CancelBookingDialog({
  booking,
  showTrigger = true,
  onSuccess,
  ...props
}: CancelBookingDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const cancelBookingMutation = useCancelBooking();

  const form = useForm<CancelBookingSchema>({
    resolver: zodResolver(cancelBookingSchema),
    defaultValues: {
      reason: "",
    },
  });

  function onSubmit(input: CancelBookingSchema) {
    startTransition(async () => {
      try {
        await cancelBookingMutation.mutateAsync({
          id: booking._id,
          reason: input.reason,
        });

        form.reset();
        props.onOpenChange?.(false);
        toast.success("Booking cancelled successfully");
        onSuccess?.();
      } catch (error) {
        toast.error("Failed to cancel booking");
      }
    });
  }

  return (
    <Dialog {...props}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            <X className="mr-2 h-4 w-4" />
            Cancel Booking
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling this booking. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Booking Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="font-medium text-sm">Booking Details</h4>
              <div className="mt-2 space-y-1 text-muted-foreground text-sm">
                <p>
                  <strong>Property:</strong>{" "}
                  {booking.property?.title || "Unknown"}
                </p>
                <p>
                  <strong>Tenant:</strong> {booking.tenant?.firstName}{" "}
                  {booking.tenant?.lastName}
                </p>
                <p>
                  <strong>Date:</strong> {booking.date} at {booking.time}
                </p>
                <p>
                  <strong>Type:</strong> {booking.type}
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Please provide a reason for cancelling this booking..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                onClick={() => props.onOpenChange?.(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isPending} type="submit" variant="destructive">
                {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
