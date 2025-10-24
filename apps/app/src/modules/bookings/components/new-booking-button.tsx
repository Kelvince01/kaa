"use client";

import { Button } from "@kaa/ui/components/button";
import { Plus } from "lucide-react";
import { useBookingStore } from "../booking.store";

export function NewBookingButton() {
  const { setIsCreateBookingOpen } = useBookingStore();

  return (
    <Button onClick={() => setIsCreateBookingOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      New Booking
    </Button>
  );
}
