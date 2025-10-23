"use client";

import { Button } from "@kaa/ui/components/button";
import { Calendar as CalendarComponent } from "@kaa/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kaa/ui/components/select";
import { Textarea } from "@kaa/ui/components/textarea";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Property } from "@/modules/properties/property.type";

type ViewingSchedulerProps = {
  property: Property;
};

export function ViewingScheduler({ property }: ViewingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [viewingType, setViewingType] = useState<"in-person" | "virtual">(
    "in-person"
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Mock available time slots (would come from API)
  const availableTimeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  const handleScheduleViewing = () => {
    if (!(selectedDate && selectedTime)) {
      toast.error("Please select a date and time for the viewing");
      return;
    }

    // TODO: Submit viewing request to API
    console.log("Scheduling viewing:", {
      propertyId: property._id,
      date: selectedDate,
      time: selectedTime,
      type: viewingType,
      notes: additionalNotes,
    });

    setIsConfirmed(true);
    toast.success(
      `Viewing scheduled for ${format(selectedDate, "PPP")} at ${selectedTime}`
    );
  };

  if (isConfirmed) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
          <h3 className="mb-2 font-semibold text-lg">Viewing Request Sent</h3>
          <p className="mb-4 text-muted-foreground">
            Your request for a viewing on{" "}
            {/* biome-ignore lint/style/noNonNullAssertion: ignore */}
            {format(selectedDate!, "PPP")} at {selectedTime} has been sent. The
            landlord will confirm the appointment shortly.
          </p>
          <Button onClick={() => setIsConfirmed(false)}>
            Schedule Another Viewing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule a Viewing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
          <label className="font-medium text-sm">Select a Date</label>
          <CalendarComponent
            className="mt-1 rounded-md border"
            disabled={{ before: new Date() }}
            mode="single"
            onSelect={setSelectedDate}
            selected={selectedDate}
          />
        </div>

        {/* Time Slot Picker */}
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
          <label className="font-medium text-sm">Select a Time Slot</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {availableTimeSlots.map((time) => (
              <Button
                disabled={!selectedDate}
                key={time}
                onClick={() => setSelectedTime(time)}
                variant={selectedTime === time ? "default" : "outline"}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>

        {/* Viewing Type */}
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
          <label className="font-medium text-sm">Viewing Type</label>
          <Select
            onValueChange={(value: any) => setViewingType(value)}
            value={viewingType}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-person">In-Person Viewing</SelectItem>
              <SelectItem value="virtual">Virtual Viewing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Additional Notes */}
        <div>
          {/* biome-ignore lint/a11y/noLabelWithoutControl: ignore */}
          <label className="font-medium text-sm">Additional Notes</label>
          <Textarea
            className="mt-1"
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any specific questions or requests?"
            value={additionalNotes}
          />
        </div>

        {/* Summary and Confirmation */}
        {selectedDate && selectedTime && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
            <p className="font-medium">Confirm your viewing:</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Date: {format(selectedDate, "PPP")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Time: {selectedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <span>
                Type: {viewingType === "in-person" ? "In-Person" : "Virtual"}
              </span>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!(selectedDate && selectedTime)}
          onClick={handleScheduleViewing}
          size="lg"
        >
          Schedule Viewing
        </Button>

        <div className="flex items-start gap-2 text-muted-foreground text-xs">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p>
            This is a request for a viewing. The landlord will confirm the
            appointment. Cancellations should be made at least 24 hours in
            advance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
