import { createSearchParamsCache } from "nuqs/server";
import * as z from "zod";
import {
  BookingStatus,
  BookingType,
  PaymentMethod,
  ViewingType,
} from "./booking.type";

// Search params schema for bookings table
export const bookingsSearchParamsSchema = z.object({
  page: z.coerce.number(),
  perPage: z.coerce.number(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  q: z.string().optional(),
  status: z.enum(BookingStatus).optional(),
  type: z.enum(BookingType).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  property: z.string().optional(),
  tenant: z.string().optional(),
});

export type BookingsSearchParams = z.infer<typeof bookingsSearchParamsSchema>;

// TODO: fix
export const searchParamsCache = createSearchParamsCache<any>(
  bookingsSearchParamsSchema
);

// Create booking schema
export const createBookingSchema = z.object({
  property: z.string().min(1, "Property is required"),
  unit: z.string().optional(),
  type: z.enum(BookingType),
  // { errorMap: () => ({ message: "Please select a valid booking type" })}
  viewingType: z.nativeEnum(ViewingType).optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  additionalAttendees: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        relationship: z.string().min(1, "Relationship is required"),
      })
    )
    .optional(),
});

export type CreateBookingSchema = z.infer<typeof createBookingSchema>;

// Update booking schema
export const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  rejectionReason: z.string().optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  feedback: z
    .object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    })
    .optional(),
});

export type UpdateBookingSchema = z.infer<typeof updateBookingSchema>;

// Cancel booking schema
export const cancelBookingSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
});

export type CancelBookingSchema = z.infer<typeof cancelBookingSchema>;

// Reject booking schema
export const rejectBookingSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export type RejectBookingSchema = z.infer<typeof rejectBookingSchema>;

// Confirm booking schema
export const confirmBookingSchema = z.object({
  checkInInstructions: z.string().optional(),
});

export type ConfirmBookingSchema = z.infer<typeof confirmBookingSchema>;
