import type mongoose from "mongoose";
import type { BaseDocument } from "./base.type";
import type { PaymentMethod } from "./payment.type";

/**
 * Booking status
 */
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

/**
 * Booking type
 */
export enum BookingType {
  VIEWING = "viewing",
  APPLICATION = "application",
}

export type BookingPeriodType = "short-term" | "long-term";

/**
 * Viewing type
 */
export type ViewingType = "in-person" | "virtual";

/**
 * Reminder method
 */
export type ReminderMethod = "email" | "sms" | "notification";

export type BookingPaymentStatus = "pending" | "partial" | "paid";

/**
 * Attendee interface
 */
export type IAttendee = {
  name: string;
  relationship: string;
};

/**
 * Feedback interface
 */
export type IFeedback = {
  rating: number;
  comment?: string;
  createdAt: Date;
};

/**
 * Reminder interface
 */
export type IReminder = {
  sentAt: Date;
  method: ReminderMethod;
};

export type PaymentDetail = {
  amount: number;
  paymentMethod: mongoose.Types.ObjectId;
  transactionId: string;
  paymentDate: Date;
  status: string;
};

/**
 * Booking document interface
 */
export interface IBooking extends BaseDocument {
  property: mongoose.Types.ObjectId;
  tenant: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  status: BookingStatus;
  notes?: string;
  // Additional fields
  landlord?: mongoose.Types.ObjectId;
  type?: BookingType;
  bookingType?: BookingPeriodType;
  startTime?: Date;
  endTime?: Date;
  viewingType?: ViewingType;
  meetingLink?: string;
  additionalAttendees?: IAttendee[];
  feedback?: IFeedback;
  reminders?: IReminder[];
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  paymentStatus: BookingPaymentStatus;
  paymentMethod: PaymentMethod;
  specialRequests?: string;
  rejectionReason?: string;
  paymentDetails: PaymentDetail[];
  checkInDate?: Date;
  checkOutDate?: Date;
  canBeCanceled(): boolean;
  isUpcoming(): boolean;
  isHappeningNow(): boolean;
  cancel(reason: string): Promise<IBooking>;
  checkAvailability(
    propertyId: string,
    startDate: Date,
    endDate: Date,
    bookingType: BookingType,
    excludeBookingId?: string
  ): Promise<boolean>;
}

export type CreateBookingInput = {
  type: BookingType;
  notes: string;
  date: string;
  property: string;
  time: string;
  bookingType: BookingPeriodType;
  startTime: string;
  endTime: string;
  viewingType: ViewingType;
  additionalAttendees: string[];
  totalAmount: number;
  depositAmount: number;
};
