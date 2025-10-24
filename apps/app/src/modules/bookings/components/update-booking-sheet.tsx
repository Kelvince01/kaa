"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@kaa/ui/components/form";
import { Input } from "@kaa/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { Textarea } from "@kaa/ui/components/textarea";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateBooking } from "../booking.mutations";
import {
  type UpdateBookingSchema,
  updateBookingSchema,
} from "../booking.schema";
import type { Booking } from "../booking.type";
import { BookingStatus } from "../booking.type";

interface UpdateBookingSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  booking: Booking | null;
}

export function UpdateBookingSheet({
  booking,
  ...props
}: UpdateBookingSheetProps) {
  const [isPending, startTransition] = React.useTransition();
  const updateBookingMutation = useUpdateBooking();

  const form = useForm<UpdateBookingSchema>({
    resolver: zodResolver(updateBookingSchema),
    defaultValues: {
      status: booking?.status,
      date: booking?.date,
      time: booking?.time,
      notes: booking?.notes || "",
      specialRequests: booking?.specialRequests || "",
      rejectionReason: booking?.rejectionReason || "",
    },
  });

  React.useEffect(() => {
    if (booking) {
      form.reset({
        status: booking.status,
        date: booking.date,
        time: booking.time,
        notes: booking.notes || "",
        specialRequests: booking.specialRequests || "",
        rejectionReason: booking.rejectionReason || "",
      });
    }
  }, [booking, form]);

  function onSubmit(input: UpdateBookingSchema) {
    startTransition(async () => {
      if (!booking) return;

      try {
        await updateBookingMutation.mutateAsync({
          id: booking._id,
          data: {
            status: input.status as BookingStatus,
            date: input.date,
            time: input.time,
            // startTime: input.startTime,
            // endTime: input.endTime,
            // viewingType: input.viewingType as ViewingType,
            notes: input.notes,
            rejectionReason: input.rejectionReason,
          },
        });

        form.reset(input);
        props.onOpenChange?.(false);
        toast.success("Booking updated successfully");
      } catch (error) {
        toast.error("Failed to update booking");
      }
    });
  }

  return (
    <Sheet {...props}>
      <SheetContent className="flex flex-col gap-2 overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update booking</SheetTitle>
          <SheetDescription>
            Update the booking details and save the changes
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4 px-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {Object.values(BookingStatus).map((status) => (
                          <SelectItem
                            className="capitalize"
                            key={status}
                            value={status}
                          >
                            {status}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Add any notes about this booking..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Any special requests or requirements..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(form.watch("status") === "rejected" ||
              booking?.status === "rejected") && (
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejection Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        placeholder="Provide reason for rejection..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <SheetFooter className="gap-2 pt-2 sm:space-x-0">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button disabled={isPending}>
                {isPending && (
                  <Loader
                    aria-hidden="true"
                    className="mr-2 size-4 animate-spin"
                  />
                )}
                Update Booking
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
