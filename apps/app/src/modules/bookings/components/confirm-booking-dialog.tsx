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
import { Check, Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useConfirmBooking } from "../booking.mutations";
import {
  type ConfirmBookingSchema,
  confirmBookingSchema,
} from "../booking.schema";
import type { Booking } from "../booking.type";

interface ConfirmBookingDialogProps
  extends React.ComponentPropsWithRef<typeof Dialog> {
  booking: Booking;
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function ConfirmBookingDialog({
  booking,
  showTrigger = true,
  onSuccess,
  ...props
}: ConfirmBookingDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const confirmBookingMutation = useConfirmBooking();

  const form = useForm<ConfirmBookingSchema>({
    resolver: zodResolver(confirmBookingSchema),
    defaultValues: {
      checkInInstructions: "",
    },
  });

  function onSubmit(input: ConfirmBookingSchema) {
    startTransition(async () => {
      try {
        await confirmBookingMutation.mutateAsync({
          id: booking._id,
          checkInInstructions: input.checkInInstructions,
        });

        form.reset();
        props.onOpenChange?.(false);
        toast.success("Booking confirmed successfully");
        onSuccess?.();
      } catch (error) {
        toast.error("Failed to confirm booking");
      }
    });
  }

  return (
    <Dialog {...props}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            <Check className="mr-2 h-4 w-4" />
            Confirm Booking
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Booking</DialogTitle>
          <DialogDescription>
            Confirm this booking and optionally provide check-in instructions
            for the tenant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Booking Summary */}
            <div className="rounded-lg bg-green-50 p-4">
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
                {booking.specialRequests && (
                  <p>
                    <strong>Special Requests:</strong> {booking.specialRequests}
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="checkInInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-in Instructions (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Provide any check-in instructions or additional information for the tenant..."
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
              <Button disabled={isPending} type="submit">
                {isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Booking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
