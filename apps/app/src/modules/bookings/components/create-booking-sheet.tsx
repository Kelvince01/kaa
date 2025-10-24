"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import { Loader } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateBooking } from "../booking.mutations";
import {
  type CreateBookingSchema,
  createBookingSchema,
} from "../booking.schema";
import { useBookingStore } from "../booking.store";
import type { BookingType } from "../booking.type";
import { BookingForm } from "./booking-form";

export function CreateBookingSheet() {
  const [isPending, startTransition] = React.useTransition();
  const createBookingMutation = useCreateBooking();
  const { isCreateBookingOpen, setIsCreateBookingOpen } = useBookingStore();

  const form = useForm<CreateBookingSchema>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      property: "",
      type: "viewing" as BookingType,
      date: "",
      time: "",
      notes: "",
      specialRequests: "",
    },
  });

  function onSubmit(input: CreateBookingSchema) {
    startTransition(async () => {
      try {
        await createBookingMutation.mutateAsync(input);
        form.reset();
        setIsCreateBookingOpen(false);
        toast.success("Booking created successfully");
      } catch (error) {
        toast.error("Failed to create booking");
      }
    });
  }

  return (
    <Sheet onOpenChange={setIsCreateBookingOpen} open={isCreateBookingOpen}>
      <SheetContent className="flex flex-col gap-2 overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Create new booking</SheetTitle>
          <SheetDescription>
            Create a new booking for a property viewing or application
          </SheetDescription>
        </SheetHeader>
        <BookingForm<CreateBookingSchema> form={form} onSubmit={onSubmit}>
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
              Create Booking
            </Button>
          </SheetFooter>
        </BookingForm>
      </SheetContent>
    </Sheet>
  );
}
