"use client";

import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@kaa/ui/components/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { Calendar, Check, Clock, Home, Mail, MapPin, X } from "lucide-react";
import Image from "next/image";
import type * as React from "react";
import { toast } from "sonner";
import { formatDate } from "@/shared/utils/format.util";
import {
  useCancelBooking,
  useConfirmBooking,
  useRejectBooking,
} from "../booking.mutations";
import type { Booking } from "../booking.type";
import { BookingStatusBadge } from "./booking-status-badge";

interface BookingDetailSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  booking: Booking | null;
}

export function BookingDetailSheet({
  booking,
  ...props
}: BookingDetailSheetProps) {
  const confirmBookingMutation = useConfirmBooking();
  const cancelBookingMutation = useCancelBooking();
  const rejectBookingMutation = useRejectBooking();

  if (!booking) return null;

  const handleConfirm = async () => {
    try {
      await confirmBookingMutation.mutateAsync({ id: booking._id });
      toast.success("Booking confirmed successfully");
    } catch (error) {
      toast.error("Failed to confirm booking");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelBookingMutation.mutateAsync({
        id: booking._id,
        reason: "Cancelled by admin",
      });
      toast.success("Booking cancelled successfully");
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const handleReject = async () => {
    try {
      await rejectBookingMutation.mutateAsync({
        id: booking._id,
        rejectionReason: "Rejected by admin",
      });
      toast.success("Booking rejected successfully");
    } catch (error) {
      toast.error("Failed to reject booking");
    }
  };

  return (
    <Sheet {...props}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Booking Details</SheetTitle>
          <SheetDescription>
            View and manage booking information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Booking Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Booking Overview</CardTitle>
                <BookingStatusBadge status={booking.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Booking ID
                  </p>
                  <p className="font-mono text-sm">
                    {booking._id.substring(0, 12)}...
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Type
                  </p>
                  <p className="capitalize">
                    {booking.type === "viewing"
                      ? "Property Viewing"
                      : booking.type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Date
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Time
                  </p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {
                        // formatTime(booking.time)
                        booking.time ? booking.time : "-"
                      }
                    </span>
                  </div>
                </div>
              </div>

              {booking.totalAmount && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Amount
                  </p>
                  <p className="font-semibold text-lg">
                    KES {booking.totalAmount.toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.property ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {booking.property.media?.photos?.[0] ? (
                      <Image
                        alt={booking.property.title}
                        className="h-16 w-16 rounded-lg object-cover"
                        height={64}
                        src={booking.property.media.photos[0].url}
                        width={64}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200">
                        <Home className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {booking.property.title}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {booking.property.location.address.line1},{" "}
                          {booking.property.location.address.town},{" "}
                          {booking.property.location.address.postalCode}
                        </span>
                      </div>
                      {booking.property.pricing && (
                        <p className="font-medium text-sm">
                          {booking.property.pricing.currency}{" "}
                          {booking.property.pricing.rent}{" "}
                          {booking.property.pricing.paymentFrequency}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Property information not available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tenant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.tenant ? (
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                    {booking.tenant.personalInfo.avatar ? (
                      <Image
                        alt={`${booking.tenant.personalInfo.firstName} ${booking.tenant.personalInfo.lastName}`}
                        className="h-12 w-12 rounded-full"
                        height={48}
                        src={booking.tenant.personalInfo.avatar}
                        width={48}
                      />
                    ) : (
                      <span className="font-medium">
                        {booking.tenant.personalInfo.firstName?.[0]}
                        {booking.tenant.personalInfo.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold">
                        {booking.tenant.personalInfo.firstName}{" "}
                        {booking.tenant.personalInfo.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Mail className="h-4 w-4" />
                        <span>{booking.tenant.personalInfo.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Tenant information not available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Tabs className="w-full" defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="additional-attendees">
                Additional Attendees
              </TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent className="space-y-4" value="notes">
              {booking.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{booking.notes}</p>
                  </CardContent>
                </Card>
              )}

              {booking.specialRequests && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Special Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{booking.specialRequests}</p>
                  </CardContent>
                </Card>
              )}

              {booking.rejectionReason && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Rejection Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600 text-sm">
                      {booking.rejectionReason}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent className="space-y-4" value="additional-attendees">
              {booking.additionalAttendees &&
              booking.additionalAttendees.length > 0 ? (
                <div className="space-y-4">
                  {booking.additionalAttendees.map((additionalAttendee) => (
                    <div
                      className="flex gap-4"
                      key={`${additionalAttendee.name}-${additionalAttendee.relationship}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{additionalAttendee.name}</p>
                        {additionalAttendee.relationship && (
                          <p className="text-muted-foreground text-sm">
                            {additionalAttendee.relationship}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No additional attendees available
                </p>
              )}
            </TabsContent>

            <TabsContent className="space-y-4" value="reminders">
              {booking.reminders && booking.reminders.length > 0 ? (
                <div className="space-y-4">
                  {booking.reminders.map((reminder) => (
                    <Card key={reminder.sentAt}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{reminder.method}</p>
                              <p className="text-muted-foreground text-xs">
                                {formatDate(reminder.sentAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reminders available</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          {booking.status === "pending" && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={confirmBookingMutation.isPending}
                onClick={handleConfirm}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm
              </Button>
              <Button
                className="flex-1"
                disabled={rejectBookingMutation.isPending}
                onClick={handleReject}
                variant="destructive"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          {(booking.status === "pending" || booking.status === "confirmed") && (
            <Button
              className="w-full"
              disabled={cancelBookingMutation.isPending}
              onClick={handleCancel}
              variant="outline"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
