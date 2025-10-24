"use client";

import { Badge } from "@kaa/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/shared/utils/format.util";
import type { Booking, BookingStatus } from "../booking.type";

type BookingTrackerProps = {
  booking: Booking;
};

// Map booking status to step in progress bar
const statusToStep = {
  pending: 1,
  confirmed: 2,
  completed: 3,
  cancelled: -1,
  rejected: -1,
};

// Get human-readable status label
const getStatusLabel = (status: BookingStatus) => {
  switch (status) {
    case "pending":
      return "Booking Submitted";
    case "confirmed":
      return "Booking Confirmed";
    case "completed":
      return "Booking Completed";
    case "cancelled":
      return "Booking Cancelled";
    case "rejected":
      return "Booking Rejected";
    default:
      return "Unknown Status";
  }
};

// Get icon for status
const getStatusIcon = (status: BookingStatus) => {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5 text-yellow-600" />;
    case "confirmed":
      return <CheckCircle className="h-5 w-5 text-blue-600" />;
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case "cancelled":
      return <XCircle className="h-5 w-5 text-red-600" />;
    case "rejected":
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-600" />;
  }
};

// Get color for status
const getStatusColor = (status: BookingStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function BookingTracker({ booking }: BookingTrackerProps) {
  const currentStep = statusToStep[booking.status] || 0;
  const maxSteps = 3;
  const progress = currentStep < 0 ? 0 : (currentStep / maxSteps) * 100;

  const steps = [
    {
      id: 1,
      title: "Booking Submitted",
      description: "Booking request has been submitted",
      icon: <FileText className="h-4 w-4" />,
      completed: currentStep >= 1,
    },
    {
      id: 2,
      title: "Booking Confirmed",
      description: "Property owner has confirmed the booking",
      icon: <CheckCircle className="h-4 w-4" />,
      completed: currentStep >= 2,
    },
    {
      id: 3,
      title: "Booking Completed",
      description: "Viewing or rental period has been completed",
      icon: <Calendar className="h-4 w-4" />,
      completed: currentStep >= 3,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking Progress</CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {getStatusLabel(booking.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress className="h-2" value={progress} />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div className="flex gap-4" key={step.id}>
              <div className="relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.completed
                      ? "border-green-500 bg-green-500 text-white"
                      : currentStep === step.id
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-8 left-4 h-6 w-px ${
                      step.completed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-6">
                <p
                  className={`font-medium ${step.completed ? "text-green-700" : "text-gray-700"}`}
                >
                  {step.title}
                </p>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
                {step.completed && (
                  <p className="mt-1 text-green-600 text-xs">
                    Completed on {formatDate(booking.createdAt)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Special Status Messages */}
        {booking.status === "cancelled" && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-800">Booking Cancelled</p>
            </div>
            {booking.rejectionReason && (
              <p className="mt-2 text-red-700 text-sm">
                Reason: {booking.rejectionReason}
              </p>
            )}
            {booking.cancelledAt && (
              <p className="mt-1 text-red-600 text-xs">
                Cancelled on {formatDate(booking.cancelledAt)}
              </p>
            )}
          </div>
        )}

        {booking.status === "rejected" && (
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-800">Booking Rejected</p>
            </div>
            {booking.rejectionReason && (
              <p className="mt-2 text-red-700 text-sm">
                Reason: {booking.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Key Dates */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Key Dates</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{formatDate(booking.createdAt)}</p>
            </div>
            {booking.confirmedAt && (
              <div>
                <p className="text-muted-foreground">Confirmed</p>
                <p>{formatDate(booking.confirmedAt)}</p>
              </div>
            )}
            {booking.completedAt && (
              <div>
                <p className="text-muted-foreground">Completed</p>
                <p>{formatDate(booking.completedAt)}</p>
              </div>
            )}
            {booking.cancelledAt && (
              <div>
                <p className="text-muted-foreground">Cancelled</p>
                <p>{formatDate(booking.cancelledAt)}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
