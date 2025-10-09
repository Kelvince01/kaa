import mongoose, { type Model, Schema } from "mongoose";
import { BookingStatus, type IBooking } from "./types/booking.type";
import { PaymentMethod } from "./types/payment.type";

/**
 * Booking schema definition
 */
const bookingSchema = new Schema<IBooking>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    notes: {
      type: String,
      trim: true,
    },
    // Additional fields from the original model
    landlord: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["viewing", "application"],
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["short-term", "long-term"],
      required: true,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
      required() {
        return this.bookingType === "short-term";
      },
    },
    viewingType: {
      type: String,
      enum: ["in-person", "virtual"],
      default: "in-person",
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    additionalAttendees: [
      {
        name: String,
        relationship: String,
      },
    ],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      createdAt: Date,
    },
    reminders: [
      {
        sentAt: Date,
        method: {
          type: String,
          enum: ["email", "sms", "notification"],
          default: "email",
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositPaid: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.MPESA,
    },
    specialRequests: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    paymentDetails: [
      {
        amount: Number,
        paymentMethod: mongoose.Types.ObjectId,
        transactionId: String,
        paymentDate: Date,
        status: String,
      },
    ],
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one booking for the same property with overlapping dates
bookingSchema.index(
  { property: 1, tenant: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

/**
 * Method to check if the booking can be canceled
 * @returns Boolean indicating if booking can be canceled
 */
bookingSchema.methods.canBeCanceled = function (): boolean {
  // Bookings can be canceled if they are pending or confirmed and haven't started yet
  const now = new Date();
  const bookingDate = this.startTime || this.date;

  return (
    (this.status === BookingStatus.PENDING ||
      this.status === BookingStatus.CONFIRMED) &&
    now < bookingDate
  );
};

/**
 * Method to check if the booking is upcoming
 * @returns Boolean indicating if booking is upcoming
 */
bookingSchema.methods.isUpcoming = function (): boolean {
  const now = new Date();
  const bookingDate = this.startTime || this.date;

  return this.status === BookingStatus.CONFIRMED && now < bookingDate;
};

/**
 * Method to check if the booking is happening now
 * @returns Boolean indicating if booking is currently happening
 */
bookingSchema.methods.isHappeningNow = function (): boolean {
  const now = new Date();

  if (this.startTime && this.endTime) {
    return (
      this.status === BookingStatus.CONFIRMED &&
      now >= this.startTime &&
      now <= this.endTime
    );
  }

  // For bookings with just date and time, check if it's today
  if (this.date) {
    const bookingDate = new Date(this.date);
    const today = new Date();

    return (
      this.status === BookingStatus.CONFIRMED &&
      bookingDate.getDate() === today.getDate() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getFullYear() === today.getFullYear()
    );
  }

  return false;
};

/**
 * Method to cancel a booking
 * @param reason - Reason for cancellation
 * @returns Promise with the saved booking document
 */
bookingSchema.methods.cancel = function (reason: string): Promise<IBooking> {
  if (!this.canBeCanceled()) {
    throw new Error("This booking cannot be canceled");
  }

  this.status = BookingStatus.CANCELLED;
  this.notes = this.notes
    ? `${this.notes}\nCancellation reason: ${reason}`
    : `Cancellation reason: ${reason}`;

  return this.save();
};

// Check if property is available for the requested dates
bookingSchema.statics.checkAvailability = async function (
  propertyId,
  startTime,
  endTime,
  bookingType,
  excludeBookingId = null
) {
  const query: any = {
    property: propertyId,
    status: { $in: ["pending", "confirmed"] },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  if (bookingType === "short-term" && startTime && endTime) {
    // For short-term bookings, check if there's any overlap with existing bookings
    query.$or = [
      { startTime: { $lte: endTime }, endTime: { $gte: startTime } },
      { startTime: { $lte: startTime }, endTime: { $gte: startTime } },
      { startTime: { $lte: endTime }, endTime: { $gte: endTime } },
    ];
  } else if (bookingType === "long-term" && startTime) {
    // For long-term bookings, check if there's any booking after the start date
    query.startTime = { $lte: startTime };
    query.bookingType = "long-term";
  }

  const existingBookings = await this.find(query);

  return existingBookings.length === 0;
};

// Create and export the Booking model
export const Booking: Model<IBooking> = mongoose.model<IBooking>(
  "Booking",
  bookingSchema
);
