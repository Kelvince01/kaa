// Booking status
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

// export type BookingType = "viewing" | "application";
export type BookingPeriodType = "short-term" | "long-term";
// export type ViewingType = "in-person" | "virtual";
export type ReminderMethod = "email" | "sms" | "notification";
export type PaymentStatus = "pending" | "partial" | "paid";
// export type PaymentMethod = "mpesa" | "card" | "bank" | "cash";

export enum BookingType {
  viewing = "viewing",
  application = "application",
}

export enum ViewingType {
  virtual = "virtual",
  "in-person" = "in-person",
}

export enum PaymentMethod {
  mpesa = "mpesa",
  card = "card",
  bank = "bank",
  cash = "cash",
}

export type Attendee = {
  name: string;
  relationship: string;
};

export type Feedback = {
  rating: number;
  comment?: string;
  createdAt: string;
};

export type Reminder = {
  sentAt: string;
  method: ReminderMethod;
};

export type PaymentDetail = {
  amount: number;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  status: string;
};

export type Booking = {
  _id: string;
  property: string | any;
  tenant: string | any;
  date: string;
  time: string;
  status: BookingStatus;
  notes?: string;
  landlord?: string | any;
  type?: BookingType;
  bookingType?: BookingPeriodType;
  startTime?: string;
  endTime?: string;
  viewingType?: ViewingType;
  meetingLink?: string;
  additionalAttendees?: Attendee[];
  feedback?: Feedback;
  reminders?: Reminder[];
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  specialRequests?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  paymentDetails: PaymentDetail[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type BookingCreateInput = {
  property: string;
  date: string;
  time: string;
  notes?: string;
  type?: BookingType;
  bookingType?: BookingPeriodType;
  startTime?: string;
  endTime?: string;
  viewingType?: ViewingType;
  additionalAttendees?: Attendee[];
  specialRequests?: string;
};

export type BookingUpdateInput = {
  status?: BookingStatus;
  date?: string;
  time?: string;
  notes?: string;
  rejectionReason?: string;
  feedback?: Feedback;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetail[];
};

export type BookingListResponse = {
  items: Booking[];
  pagination: {
    pages: number;
    total: number;
    page: number;
    limit: number;
  };
  status: "success" | "error";
  message?: string;
};

export type BookingResponse = {
  data: Booking;
  status: "success" | "error";
  message?: string;
};
